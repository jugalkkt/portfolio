"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * High tier only — a hand-rolled mip-chain bloom (the technique behind postprocessing's
 * `mipmapBlur`): bright-pass + 13-tap downsamples, tent-filter upsamples, then one additive
 * composite. Replaces @react-three/postprocessing (−22 KB gzip on the high tier).
 *
 * The scene is additive and never writes alpha, so the glow is added the same way: the
 * canvas stays transparent and draw order doesn't matter. The scene is drawn last so the
 * renderer's draw-call counter still reports the scene alone (the debug overlay reads it).
 */

const LEVELS = 6;
const THRESHOLD = 0.6;
const SMOOTHING = 0.2;
const INTENSITY = 0.55;
const RADIUS = 0.85;

const vertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const downsample = /* glsl */ `
uniform sampler2D uInput;
uniform vec2 uTexel;
uniform float uThreshold; // < 0: no bright-pass
varying vec2 vUv;
vec3 t(vec2 o) { return texture2D(uInput, vUv + o * uTexel).rgb; }
void main() {
  vec3 c = t(vec2(0.0)) * 0.125
    + (t(vec2(-2.0, 2.0)) + t(vec2(2.0, 2.0)) + t(vec2(-2.0, -2.0)) + t(vec2(2.0, -2.0))) * 0.03125
    + (t(vec2(0.0, 2.0)) + t(vec2(-2.0, 0.0)) + t(vec2(2.0, 0.0)) + t(vec2(0.0, -2.0))) * 0.0625
    + (t(vec2(-1.0, 1.0)) + t(vec2(1.0, 1.0)) + t(vec2(-1.0, -1.0)) + t(vec2(1.0, -1.0))) * 0.125;
  if (uThreshold >= 0.0) {
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c *= smoothstep(uThreshold, uThreshold + ${SMOOTHING.toFixed(2)}, l);
  }
  gl_FragColor = vec4(c, 1.0);
}
`;

const upsample = /* glsl */ `
uniform sampler2D uInput;   // coarser level (already upsampled)
uniform sampler2D uCurrent; // this level's downsample
uniform vec2 uTexel;
varying vec2 vUv;
vec3 t(vec2 o) { return texture2D(uInput, vUv + o * uTexel).rgb; }
void main() {
  vec3 s = (t(vec2(-1.0, -1.0)) + t(vec2(1.0, -1.0)) + t(vec2(-1.0, 1.0)) + t(vec2(1.0, 1.0))
    + 2.0 * (t(vec2(0.0, -1.0)) + t(vec2(-1.0, 0.0)) + t(vec2(1.0, 0.0)) + t(vec2(0.0, 1.0)))
    + 4.0 * t(vec2(0.0))) / 16.0;
  gl_FragColor = vec4(mix(texture2D(uCurrent, vUv).rgb, s, ${RADIUS.toFixed(2)}), 1.0);
}
`;

const composite = /* glsl */ `
uniform sampler2D uInput;
varying vec2 vUv;
void main() { gl_FragColor = vec4(texture2D(uInput, vUv).rgb * ${INTENSITY.toFixed(2)}, 0.0); }
`;

function material(fragmentShader: string, uniforms: Record<string, THREE.IUniform>) {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
}

class BloomPass {
  private readonly quadScene = new THREE.Scene();
  private readonly quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly quad: THREE.Mesh;
  private readonly sceneTarget: THREE.WebGLRenderTarget;
  private readonly down: THREE.WebGLRenderTarget[] = [];
  private readonly up: THREE.WebGLRenderTarget[] = [];
  private readonly downMat = material(downsample, {
    uInput: { value: null },
    uTexel: { value: new THREE.Vector2() },
    uThreshold: { value: -1 },
  });
  private readonly upMat = material(upsample, {
    uInput: { value: null },
    uCurrent: { value: null },
    uTexel: { value: new THREE.Vector2() },
  });
  private readonly compositeMat = material(composite, { uInput: { value: null } });
  private readonly size = new THREE.Vector2();
  private width = 0;
  private height = 0;

  constructor() {
    const opts = { type: THREE.HalfFloatType, depthBuffer: false } as const;
    this.sceneTarget = new THREE.WebGLRenderTarget(1, 1, opts);
    for (let i = 0; i < LEVELS; i++) {
      this.down.push(new THREE.WebGLRenderTarget(1, 1, opts));
      this.up.push(new THREE.WebGLRenderTarget(1, 1, opts));
    }
    // Additive, alpha untouched — identical to the scene's own blending.
    Object.assign(this.compositeMat, {
      transparent: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.downMat);
    this.quad.frustumCulled = false;
    this.quadScene.add(this.quad);
  }

  private resize(w: number, h: number) {
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    // The bloom works from half resolution, like postprocessing's default.
    let lw = Math.max(1, w >> 1);
    let lh = Math.max(1, h >> 1);
    this.sceneTarget.setSize(lw, lh);
    for (let i = 0; i < LEVELS; i++) {
      this.down[i].setSize(lw, lh);
      this.up[i].setSize(lw, lh);
      lw = Math.max(1, lw >> 1);
      lh = Math.max(1, lh >> 1);
    }
  }

  private pass(
    gl: THREE.WebGLRenderer,
    mat: THREE.ShaderMaterial,
    target: THREE.WebGLRenderTarget | null,
  ) {
    this.quad.material = mat;
    gl.setRenderTarget(target);
    gl.render(this.quadScene, this.quadCamera);
  }

  render(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    gl.getDrawingBufferSize(this.size);
    this.resize(this.size.x, this.size.y);
    const autoClear = gl.autoClear;

    // 1. Scene at half resolution.
    gl.autoClear = true;
    gl.setRenderTarget(this.sceneTarget);
    gl.render(scene, camera);

    // 2. Downsample chain; the first step also applies the bright-pass.
    const d = this.downMat.uniforms;
    let src = this.sceneTarget;
    for (let i = 0; i < LEVELS; i++) {
      d.uInput.value = src.texture;
      d.uTexel.value.set(1 / src.width, 1 / src.height);
      d.uThreshold.value = i === 0 ? THRESHOLD : -1;
      this.pass(gl, this.downMat, this.down[i]);
      src = this.down[i];
    }

    // 3. Upsample back up, blending each level with the coarser one.
    const u = this.upMat.uniforms;
    let coarse = this.down[LEVELS - 1];
    for (let i = LEVELS - 2; i >= 0; i--) {
      u.uInput.value = coarse.texture;
      u.uCurrent.value = this.down[i].texture;
      u.uTexel.value.set(1 / coarse.width, 1 / coarse.height);
      this.pass(gl, this.upMat, this.up[i]);
      coarse = this.up[i];
    }

    // 4. Screen: clear, add the glow, then the scene itself (last, see header comment).
    gl.setRenderTarget(null);
    gl.clear();
    gl.autoClear = false;
    this.compositeMat.uniforms.uInput.value = coarse.texture;
    this.pass(gl, this.compositeMat, null);
    gl.render(scene, camera);
    gl.autoClear = autoClear;
  }

  dispose() {
    this.sceneTarget.dispose();
    [...this.down, ...this.up].forEach((t) => t.dispose());
    [this.downMat, this.upMat, this.compositeMat].forEach((m) => m.dispose());
    this.quad.geometry.dispose();
  }
}

export default function HeroBloom() {
  const pass = useMemo(() => new BloomPass(), []);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
    return () => pass.dispose();
  }, [pass, invalidate]);
  // Priority 1: R3F hands rendering over to this pass.
  useFrame(({ gl, scene, camera }) => pass.render(gl, scene, camera), 1);
  return null;
}
