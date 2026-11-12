export type QualityTier = "high" | "medium" | "low" | "static";

export type DeviceInfo = {
  webgl2: boolean;
  /** navigator.deviceMemory in GB (undefined where unsupported, e.g. Safari/Firefox). */
  deviceMemory?: number;
  cores?: number;
  coarsePointer: boolean;
  viewportWidth: number;
};

export const TIER_ORDER: QualityTier[] = ["high", "medium", "low", "static"];

/** Pure tier choice (§5): high = bloom + 44 nodes, medium = 30, low = 20 @30fps, static = SVG. */
export function pickTier(d: DeviceInfo): QualityTier {
  if (!d.webgl2) return "static";
  if (
    d.coarsePointer ||
    d.viewportWidth < 640 ||
    (d.deviceMemory !== undefined && d.deviceMemory <= 2)
  )
    return "low";
  if (
    d.viewportWidth < 1024 ||
    (d.cores !== undefined && d.cores <= 4) ||
    (d.deviceMemory !== undefined && d.deviceMemory <= 4)
  ) {
    return "medium";
  }
  return "high";
}

export function lowerTier(t: QualityTier): QualityTier {
  return TIER_ORDER[Math.min(TIER_ORDER.indexOf(t) + 1, TIER_ORDER.length - 1)];
}

export function detectDevice(): DeviceInfo {
  let webgl2 = false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    webgl2 = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl2 = false;
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    webgl2,
    deviceMemory: nav.deviceMemory,
    cores: nav.hardwareConcurrency || undefined,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    viewportWidth: window.innerWidth,
  };
}
