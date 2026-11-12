import type { MotionPreference } from "@/hooks/useMotionPreference";

/** One piece of site motion: follows the motion preference and can be torn down. */
export type Part = { setMotion(m: MotionPreference): void; destroy(): void };
