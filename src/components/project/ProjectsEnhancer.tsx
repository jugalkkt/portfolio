"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import type { ProjectsMotion } from "./motion/enhance";

/**
 * Loads the diagram/stat motion chunk only when the projects section is near the viewport.
 * Children are server-rendered and fully usable (static, fully drawn) without it.
 */
export function ProjectsEnhancer({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const ctrl = useRef<ProjectsMotion | null>(null);
  const motion = useMotionPreference();
  // Until hydration finishes, `motion` is the server snapshot ("reduced"), not the real value.
  const hydrated = useHydrated();
  const latest = useRef(motion);

  useEffect(() => {
    latest.current = motion;
    ctrl.current?.setMotion(motion);
  }, [motion]);

  useEffect(() => {
    const el = root.current;
    if (!el || !hydrated) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        import("./motion/enhance").then(({ enhance }) => {
          if (!cancelled) ctrl.current = enhance(el, latest.current);
        });
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      ctrl.current?.destroy();
      ctrl.current = null;
    };
  }, [hydrated]);

  return <div ref={root}>{children}</div>;
}
