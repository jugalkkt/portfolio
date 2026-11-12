import type { MotionPreference } from "@/hooks/useMotionPreference";
import type { Part } from "./types";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/#*+=";
const DURATION = 420;

/** A7: section kickers "decode" from random mono glyphs when they enter view (once). */
export function decode(initial: MotionPreference): Part {
  let motion = initial;
  const els = [...document.querySelectorAll<HTMLElement>("[data-decode]")];
  const finals = new Map(els.map((el) => [el, el.textContent ?? ""]));
  const running = new Map<HTMLElement, number>();

  const settle = (el: HTMLElement) => {
    cancelAnimationFrame(running.get(el) ?? 0);
    running.delete(el);
    el.textContent = finals.get(el)!;
  };

  const run = (el: HTMLElement) => {
    const text = finals.get(el)!;
    const start = performance.now();
    const frame = (now: number) => {
      const k = Math.min((now - start) / DURATION, 1);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        // Characters lock in left to right; spaces and separators never scramble.
        const lockAt = 0.25 + (i / text.length) * 0.75;
        out +=
          k >= lockAt || ch === " " || ch === "·"
            ? ch
            : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (k < 1) running.set(el, requestAnimationFrame(frame));
      else running.delete(el);
    };
    running.set(el, requestAnimationFrame(frame));
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        if (motion === "full") run(e.target as HTMLElement);
      }
    },
    { threshold: 0.9 },
  );
  els.forEach((el) => io.observe(el));

  return {
    setMotion: (m) => {
      motion = m;
      if (m !== "full") [...running.keys()].forEach(settle);
    },
    destroy: () => {
      io.disconnect();
      [...running.keys()].forEach(settle);
    },
  };
}
