import type { MotionPreference } from "@/hooks/useMotionPreference";
import type { Part } from "./types";

const PULL = 4; // px, max magnetic offset

/**
 * A9 pointer effects (fine pointers only): card borders light up around the pointer, and
 * primary CTAs lean ≤ 4 px toward it (full motion only).
 */
export function pointer(initial: MotionPreference): Part | null {
  if (!window.matchMedia("(pointer: fine)").matches) return null;
  let motion = initial;
  const off: (() => void)[] = [];
  const listen = <K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    type: K,
    fn: (e: HTMLElementEventMap[K]) => void,
  ) => {
    el.addEventListener(type, fn);
    off.push(() => el.removeEventListener(type, fn));
  };

  for (const el of document.querySelectorAll<HTMLElement>("[data-glow]")) {
    listen(el, "pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${(e.clientX - r.left).toFixed(0)}px`);
      el.style.setProperty("--my", `${(e.clientY - r.top).toFixed(0)}px`);
    });
  }

  const magnets = [...document.querySelectorAll<HTMLElement>("[data-magnetic]")];
  for (const el of magnets) {
    listen(el, "pointermove", (e) => {
      if (motion !== "full") return;
      const r = el.getBoundingClientRect();
      const dx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const dy = ((e.clientY - r.top) / r.height - 0.5) * 2;
      el.style.translate = `${(dx * PULL).toFixed(1)}px ${(dy * PULL).toFixed(1)}px`;
    });
    listen(el, "pointerleave", () => (el.style.translate = ""));
  }

  return {
    setMotion: (m) => {
      motion = m;
      if (m !== "full") magnets.forEach((el) => (el.style.translate = ""));
    },
    destroy: () => {
      off.forEach((f) => f());
      magnets.forEach((el) => (el.style.translate = ""));
    },
  };
}
