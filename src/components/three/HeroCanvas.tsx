"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { lazy, Suspense, useEffect } from "react";
import type { QualityTier } from "@/lib/capabilities";
import { InferenceNetwork } from "./InferenceNetwork/InferenceNetwork";
import { TIER_LAYERS } from "./InferenceNetwork/generateNetwork";
import type { HeroBridge } from "./InferenceNetwork/bridge";

const HeroBloom = lazy(() => import("./HeroBloom"));

type Tier = Exclude<QualityTier, "static">;

type Props = {
  tier: Tier;
  active: boolean;
  bridge: HeroBridge;
  onSlow: () => void;
  onReady: () => void;
};

/**
 * frameloop="demand": this driver invalidates on every animation frame while active
 * (capped at 30 fps on the low tier) and stops completely otherwise. It also measures
 * FPS and reports a sustained drop below the target (§5 A1 PerformanceMonitor).
 */
function FrameDriver({
  active,
  tier,
  bridge,
  onSlow,
}: Pick<Props, "active" | "tier" | "bridge" | "onSlow">) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    bridge.setInvalidate(() => invalidate());
    invalidate();
    if (!active) return;

    const cap = tier === "low" ? 30 : Infinity;
    const minFps = tier === "low" ? 24 : 45;
    const interval = 1000 / cap;
    let raf = 0;
    let last = 0;
    let frames = 0;
    let windowStart = performance.now();
    let warmup = true;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < interval - 1) return;
      last = now;
      frames++;
      invalidate();
      const elapsed = now - windowStart;
      if (elapsed >= 2000) {
        const fps = (frames * 1000) / elapsed;
        bridge.report({ fps: Math.round(fps) });
        // Skip the first window: shader compilation and first uploads skew it.
        if (!warmup && fps < minFps) onSlow();
        warmup = false;
        frames = 0;
        windowStart = now;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, tier, bridge, invalidate, onSlow]);

  return null;
}

export default function HeroCanvas({ tier, active, bridge, onSlow, onReady }: Props) {
  const bloom = tier === "high";
  return (
    <Canvas
      aria-hidden="true"
      frameloop="demand"
      linear
      flat
      dpr={tier === "low" ? [1, 1.5] : [1, 1.75]}
      camera={{ fov: 35, position: [0, 0, 12.5], near: 0.1, far: 50 }}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#000000", 0);
        requestAnimationFrame(onReady);
      }}
      style={{ pointerEvents: "none" }}
    >
      <FrameDriver active={active} tier={tier} bridge={bridge} onSlow={onSlow} />
      <InferenceNetwork key={tier} layerSizes={TIER_LAYERS[tier]} bridge={bridge} active={active} />
      {bloom ? (
        <Suspense fallback={null}>
          <HeroBloom />
        </Suspense>
      ) : null}
    </Canvas>
  );
}
