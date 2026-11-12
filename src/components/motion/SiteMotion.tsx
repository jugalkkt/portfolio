"use client";

import { useEffect, useRef } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import type { SiteMotion as Controller } from "./site";

/**
 * Loads the site-wide motion chunk once hydrated. Everything it touches is server-rendered
 * and complete without it; it only adds motion on top.
 */
export function SiteMotion() {
  const motion = useMotionPreference();
  // Before hydration `motion` is the server snapshot ("reduced"), not the real value.
  const hydrated = useHydrated();
  const ctrl = useRef<Controller | null>(null);
  const latest = useRef(motion);

  useEffect(() => {
    latest.current = motion;
    ctrl.current?.setMotion(motion);
  }, [motion]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    import("./site").then(({ start }) => {
      if (!cancelled) ctrl.current = start(latest.current);
    });
    return () => {
      cancelled = true;
      ctrl.current?.destroy();
      ctrl.current = null;
    };
  }, [hydrated]);

  return null;
}
