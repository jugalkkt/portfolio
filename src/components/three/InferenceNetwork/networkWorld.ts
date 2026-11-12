import * as THREE from "three";
import { seededRandom } from "@/lib/seededRandom";
import {
  edgeFragment,
  edgeVertex,
  haloFragment,
  haloVertex,
  nodeFragment,
  nodeVertex,
  pulseFragment,
  pulseVertex,
} from "../shaders/network";
import { generateNetwork, type Network } from "./generateNetwork";
import { createPassBuffers, firePass, type PassBuffers } from "./scheduler";
import type { HeroBridge } from "./bridge";

// Colours are design-token sRGB values written straight to an unencoded (`linear`) canvas,
// so three must not convert them to linear working space.
THREE.ColorManagement.enabled = false;

const COLORS = {
  signal: new THREE.Color("#4fd1e8"),
  activation: new THREE.Color("#8b7cf6"),
  idle: new THREE.Color("#94a0b2"),
  node: new THREE.Color("#121925"),
  rim: new THREE.Color("#2a3546"),
};

export const HOP = 0.42; // s per layer gap
const TAU = 0.6; // node glow decay τ (§5 A1)
const THRESHOLD = 0.42; // |w_ij| · a_i needed for a visible pulse
const POINTER_RADIUS = 150; // px — r in x_i = exp(−‖p_i − c‖² / 2r²)
const PICK_RADIUS = 22; // px
const BASE_ANGLE = -0.45;
const HALO_SIZE = 520;
const PULSE_SIZE = 150;

/** Additive over whatever is behind the canvas, leaving destination alpha alone. */
function additive(material: THREE.ShaderMaterial) {
  material.transparent = true;
  material.depthWrite = false;
  material.blending = THREE.CustomBlending;
  material.blendEquation = THREE.AddEquation;
  material.blendSrc = THREE.OneFactor;
  material.blendDst = THREE.OneFactor;
  material.blendSrcAlpha = THREE.ZeroFactor;
  material.blendDstAlpha = THREE.OneFactor;
  return material;
}

function buildGeometry(net: Network, buffers: PassBuffers) {
  const E = net.edges.length;
  const N = net.nodes.length;

  const edgePos = new Float32Array(E * 6);
  const edgeT = new Float32Array(E * 2);
  const pulseTo = new Float32Array(E * 3);
  const pulseFrom = new Float32Array(E * 3);
  net.edges.forEach((e, k) => {
    const a = net.nodes[e.from].position;
    const b = net.nodes[e.to].position;
    edgePos.set([...a, ...b], k * 6);
    edgeT.set([0, 1], k * 2);
    pulseFrom.set(a, k * 3);
    pulseTo.set(b, k * 3);
  });
  const dynamic = (arr: Float32Array, size = 1) =>
    new THREE.BufferAttribute(arr, size).setUsage(THREE.DynamicDrawUsage);
  const instancedDynamic = (arr: Float32Array) =>
    new THREE.InstancedBufferAttribute(arr, 1).setUsage(THREE.DynamicDrawUsage);

  const edges = new THREE.BufferGeometry();
  edges.setAttribute("position", new THREE.BufferAttribute(edgePos, 3));
  edges.setAttribute("aT", new THREE.BufferAttribute(edgeT, 1));
  // Per-edge values duplicated onto both vertices; rewritten on each pass.
  edges.setAttribute("aStart", dynamic(new Float32Array(E * 2)));
  edges.setAttribute("aAmp", dynamic(new Float32Array(E * 2)));

  const pulses = new THREE.BufferGeometry();
  pulses.setAttribute("position", new THREE.BufferAttribute(pulseTo, 3));
  pulses.setAttribute("aFrom", new THREE.BufferAttribute(pulseFrom, 3));
  pulses.setAttribute("aStart", dynamic(buffers.edgeStart));
  pulses.setAttribute("aAmp", dynamic(buffers.edgeAmp));

  const nodePos = new Float32Array(N * 3);
  const index = new Float32Array(N);
  net.nodes.forEach((n, i) => {
    nodePos.set(n.position, i * 3);
    index[i] = i;
  });
  const halos = new THREE.BufferGeometry();
  halos.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
  halos.setAttribute("aIndex", new THREE.BufferAttribute(index, 1));
  halos.setAttribute("aAct", dynamic(buffers.nodeAct));
  halos.setAttribute("aArrive", dynamic(buffers.nodeArrive));

  const sphere = new THREE.SphereGeometry(1, 12, 8);
  sphere.setAttribute("aIndex", new THREE.InstancedBufferAttribute(index, 1));
  sphere.setAttribute("aAct", instancedDynamic(buffers.nodeAct));
  sphere.setAttribute("aArrive", instancedDynamic(buffers.nodeArrive));

  return { edges, pulses, halos, sphere };
}

/**
 * Imperative A1 scene state: network, GPU buffers, materials and the per-frame step.
 * Lives outside React so the frame loop can mutate freely without re-renders.
 */
export class NetworkWorld {
  readonly net: Network;
  readonly geo: ReturnType<typeof buildGeometry>;
  readonly materials: Record<"edge" | "node" | "halo" | "pulse", THREE.ShaderMaterial>;

  private readonly buffers: PassBuffers;
  private readonly last: number;
  private readonly time = { value: 0 };
  private readonly hover = { value: -1 };
  private readonly haloSize = { value: HALO_SIZE };
  private readonly pulseSize = { value: PULSE_SIZE };
  private readonly rand = seededRandom(7);
  private readonly v = new THREE.Vector3();
  private readonly screen: Float32Array;
  private readonly inputs: Float32Array;
  private readonly ones: Float32Array;
  private readonly auto: Float32Array;
  private t = 0;
  private nextAuto = 3;
  private lastPointerPass = -10;
  private settled = false;

  constructor(layerSizes: readonly number[]) {
    this.net = generateNetwork(undefined, [...layerSizes]);
    this.last = layerSizes.length - 1;
    this.buffers = createPassBuffers(this.net);
    this.geo = buildGeometry(this.net, this.buffers);
    this.screen = new Float32Array(this.net.nodes.length * 2);
    this.inputs = new Float32Array(layerSizes[0]);
    this.ones = new Float32Array(layerSizes[0]).fill(1);
    this.auto = new Float32Array(layerSizes[0]);

    const shader = (
      vertexShader: string,
      fragmentShader: string,
      uniforms: Record<string, THREE.IUniform>,
    ) => new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    this.materials = {
      edge: additive(
        shader(edgeVertex, edgeFragment, {
          uTime: this.time,
          uHop: { value: HOP },
          uBase: { value: 0.075 },
          uIdle: { value: COLORS.idle },
          uSignal: { value: COLORS.signal },
        }),
      ),
      node: shader(nodeVertex, nodeFragment, {
        uTime: this.time,
        uTau: { value: TAU },
        uHover: this.hover,
        uBaseColor: { value: COLORS.node },
        uRim: { value: COLORS.rim },
        uActivation: { value: COLORS.activation },
      }),
      halo: additive(
        shader(haloVertex, haloFragment, {
          uTime: this.time,
          uTau: { value: TAU },
          uHover: this.hover,
          uSize: this.haloSize,
          uActivation: { value: COLORS.activation },
          uStrength: { value: 0.9 },
        }),
      ),
      pulse: additive(
        shader(pulseVertex, pulseFragment, {
          uTime: this.time,
          uHop: { value: HOP },
          uSize: this.pulseSize,
          uSignal: { value: COLORS.signal },
        }),
      ),
    };

    // First pass fires at t = 0 and the clock starts mid-pass, so a paused /
    // settled frame shows one frozen pass (§5 A1 reduced motion / paused).
    this.fire([1, 0.35, 0.9, 0.15, 0.8, 0.45], 0);
    this.t = HOP * 2.3;
    this.time.value = this.t;
  }

  /** Point sprites are sized in pixels; keep them proportional to DPR and fit-scale. */
  setPointScale(dpr: number, scale: number) {
    this.haloSize.value = HALO_SIZE * dpr * scale;
    this.pulseSize.value = PULSE_SIZE * dpr * scale;
  }

  /** Instance transforms: input/output nodes a little larger than hidden nodes. */
  placeInstances(mesh: THREE.InstancedMesh) {
    const m = new THREE.Matrix4();
    this.net.nodes.forEach((n, i) => {
      const r = n.layer === 0 || n.layer === this.last ? 0.085 : 0.065;
      m.makeScale(r, r, r).setPosition(...n.position);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }

  dispose() {
    Object.values(this.geo).forEach((g) => g.dispose());
    Object.values(this.materials).forEach((m) => m.dispose());
  }

  private fire(inputs: ArrayLike<number>, t0: number, boost = 1) {
    const active = firePass(this.buffers, this.net, inputs, t0, {
      hop: HOP,
      threshold: THRESHOLD,
      boost,
    });
    this.activeEdges = active;
    // Copy pass buffers into GPU attributes (only after a pass, never per frame).
    const start = this.geo.edges.getAttribute("aStart") as THREE.BufferAttribute;
    const amp = this.geo.edges.getAttribute("aAmp") as THREE.BufferAttribute;
    for (let k = 0; k < this.net.edges.length; k++) {
      start.array[k * 2] = start.array[k * 2 + 1] = this.buffers.edgeStart[k];
      amp.array[k * 2] = amp.array[k * 2 + 1] = this.buffers.edgeAmp[k];
    }
    start.needsUpdate = true;
    amp.needsUpdate = true;
    for (const g of [this.geo.pulses, this.geo.halos, this.geo.sphere]) {
      for (const name of ["aStart", "aAmp", "aAct", "aArrive"]) {
        const attr = g.getAttribute(name) as THREE.BufferAttribute | undefined;
        if (attr) attr.needsUpdate = true;
      }
    }
  }

  activeEdges = 0;

  /** Exposes picking data for the ?debug=1 overlay and e2e tests. */
  describe(bridge: HeroBridge) {
    bridge.screen = this.screen;
    bridge.firstOutput = this.net.nodes.length - this.net.layerSizes[this.last];
  }

  frame(
    camera: THREE.Camera,
    size: { width: number; height: number },
    group: THREE.Group,
    rawDelta: number,
    active: boolean,
    bridge: HeroBridge,
  ) {
    const delta = Math.min(rawDelta, 1 / 20);
    const p = bridge.pointer;

    if (active) {
      this.settled = false;
      this.t += delta;
      this.time.value = this.t;

      // Very slow rotation (peak ≈ 0.02 rad/s) and gentle parallax toward the pointer.
      group.rotation.y = BASE_ANGLE + 0.4 * Math.sin(this.t * 0.05);
      const tx = p.inside ? p.ndcX * 0.6 : 0;
      const ty = p.inside ? p.ndcY * 0.35 : 0;
      camera.position.x += (tx - camera.position.x) * 0.04;
      camera.position.y += (ty - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      if (this.t >= this.nextAuto) {
        for (let i = 0; i < this.auto.length; i++) {
          this.auto[i] = this.rand() < 0.6 ? 0.35 + this.rand() * 0.65 : 0;
        }
        this.fire(this.auto, this.t);
        this.nextAuto = this.t + 2.5 + this.rand() * 1.5;
      }
    } else if (!this.settled) {
      group.rotation.y = BASE_ANGLE;
      camera.position.set(0, 0, camera.position.z);
      camera.lookAt(0, 0, 0);
      this.settled = true;
    }

    // Screen-space picking for the labelled (input / output) layers.
    group.updateMatrixWorld();
    let best = -1;
    let bestD = PICK_RADIUS;
    let maxInput = 0;
    this.inputs.fill(0);
    for (const n of this.net.nodes) {
      if (n.layer !== 0 && n.layer !== this.last) continue;
      this.v
        .set(...n.position)
        .applyMatrix4(group.matrixWorld)
        .project(camera);
      const sx = (this.v.x * 0.5 + 0.5) * size.width;
      const sy = (-this.v.y * 0.5 + 0.5) * size.height;
      this.screen[n.index * 2] = sx;
      this.screen[n.index * 2 + 1] = sy;
      if (!p.inside) continue;
      const d = Math.hypot(sx - p.x, sy - p.y);
      if (d < bestD) {
        bestD = d;
        best = n.index;
      }
      if (n.layer === 0) {
        this.inputs[n.slot] = Math.exp(-(d * d) / (2 * POINTER_RADIUS * POINTER_RADIUS));
        maxInput = Math.max(maxInput, this.inputs[n.slot]);
      }
    }

    // Cursor = input signal: nearby input nodes trigger a pass from just those nodes.
    if (bridge.takeMoved() && active && maxInput > 0.35 && this.t - this.lastPointerPass > 0.9) {
      this.fire(this.inputs, this.t);
      this.lastPointerPass = this.t;
    }

    const hovered = best >= 0 ? this.net.nodes[best] : null;
    this.hover.value = best;
    if (hovered) {
      bridge.hover(
        best,
        hovered.layer === 0 ? "input" : "output",
        hovered.slot,
        this.screen[best * 2],
        this.screen[best * 2 + 1],
      );
    } else {
      bridge.hover(-1, null, -1, 0, 0);
    }

    if (bridge.takeClicks() > 0) {
      // Click on an output node navigates; anywhere else runs a full, brighter inference.
      if (hovered && hovered.layer === this.last) bridge.navigate(hovered.slot);
      else if (active) this.fire(this.ones, this.t, 1.5);
    }
  }
}
