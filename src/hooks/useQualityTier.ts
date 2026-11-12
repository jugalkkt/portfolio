"use client";

import { useSyncExternalStore } from "react";
import { detectDevice, pickTier, type QualityTier } from "@/lib/capabilities";

let detected: QualityTier | null = null;
const noSubscribe = () => () => {};
const getDetected = () => (detected ??= pickTier(detectDevice()));
const getDebug = () => new URLSearchParams(window.location.search).get("debug") === "1";
/** ?debug=1&tier=high|medium|low pins the tier (no auto-downgrade) for tuning and tests. */
const getForced = (): QualityTier | null => {
  const params = new URLSearchParams(window.location.search);
  const t = params.get("tier");
  return params.get("debug") === "1" && (t === "high" || t === "medium" || t === "low") ? t : null;
};

/**
 * Device quality tier, detected once per page load. Server render and hydration
 * report "static" so the first paint is always the no-WebGL fallback.
 */
export function useQualityTier(): { tier: QualityTier; forced: boolean; debug: boolean } {
  const tier = useSyncExternalStore(noSubscribe, getDetected, () => "static" as const);
  const forced = useSyncExternalStore(noSubscribe, getForced, () => null);
  const debug = useSyncExternalStore(noSubscribe, getDebug, () => false);
  return { tier: forced ?? tier, forced: forced !== null, debug };
}
