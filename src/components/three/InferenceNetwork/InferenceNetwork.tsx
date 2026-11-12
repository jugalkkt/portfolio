"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import type { HeroBridge } from "./bridge";
import { NetworkWorld } from "./networkWorld";

type Props = {
  layerSizes: readonly number[];
  bridge: HeroBridge;
  active: boolean;
};

/** Four draw calls: edges, pulse heads, node spheres (instanced), node halos. */
export function InferenceNetwork({ layerSizes, bridge, active }: Props) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const world = useMemo(() => new NetworkWorld(layerSizes), [layerSizes]);
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);

  // Portrait canvases (phones): turn the network so layers run top → bottom, like the page.
  const aspect = size.width / Math.max(size.height, 1);
  const portrait = aspect < 0.8;
  const scale = portrait ? Math.min(1, aspect * 1.6) : Math.min(1, aspect * 1.1);

  useEffect(() => () => world.dispose(), [world]);
  useEffect(() => world.describe(bridge), [world, bridge]);
  useEffect(() => world.setPointScale(dpr, scale), [world, dpr, scale]);
  useEffect(() => {
    if (mesh.current) world.placeInstances(mesh.current);
  }, [world]);

  useFrame((state, delta) => {
    if (!group.current) return;
    world.frame(state.camera, state.size, group.current, delta, active, bridge);
    bridge.report({ activeEdges: world.activeEdges, calls: state.gl.info.render.calls });
  });

  return (
    <group rotation-z={portrait ? -Math.PI / 2 : 0} scale={scale}>
      <group ref={group}>
        <lineSegments
          geometry={world.geo.edges}
          material={world.materials.edge}
          frustumCulled={false}
        />
        <points
          geometry={world.geo.pulses}
          material={world.materials.pulse}
          frustumCulled={false}
        />
        <instancedMesh
          ref={mesh}
          args={[world.geo.sphere, world.materials.node, world.net.nodes.length]}
          frustumCulled={false}
        />
        <points geometry={world.geo.halos} material={world.materials.halo} frustumCulled={false} />
      </group>
    </group>
  );
}
