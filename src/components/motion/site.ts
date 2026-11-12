import type { MotionPreference } from "@/hooks/useMotionPreference";
import { converge } from "./converge";
import { decode } from "./decode";
import { pointer } from "./pointer";
import { reveals } from "./reveal";
import { trace } from "./trace";
import type { Part } from "./types";

export type SiteMotion = Part;

/** Phase 6 site-wide motion (A6, A7 kickers, A8, A9), loaded lazily after hydration. */
export function start(initial: MotionPreference): SiteMotion {
  const parts = [
    reveals(initial),
    decode(initial),
    trace(initial),
    pointer(initial),
    converge(initial),
  ].filter((p): p is Part => p !== null);
  return {
    setMotion: (m) => parts.forEach((p) => p.setMotion(m)),
    destroy: () => parts.forEach((p) => p.destroy()),
  };
}
