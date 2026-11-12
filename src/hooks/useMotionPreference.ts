"use client";

import { useSyncExternalStore } from "react";
import { motionStore } from "@/lib/motionStore";

export type MotionPreference = "full" | "reduced" | "paused";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getReduced = () => window.matchMedia(QUERY).matches;

/** `reduced` (OS setting) wins over `paused` (site toggle); otherwise `full`. Server: `reduced`. */
export function useMotionPreference(): MotionPreference {
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => true);
  const paused = useSyncExternalStore(
    motionStore.subscribe,
    motionStore.getSnapshot,
    motionStore.getServerSnapshot,
  );
  if (reduced) return "reduced";
  return paused ? "paused" : "full";
}
