"use client";

import { Bloom, EffectComposer } from "@react-three/postprocessing";

/** High tier only — loaded as its own chunk. */
export default function HeroBloom() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.2} intensity={0.55} mipmapBlur />
    </EffectComposer>
  );
}
