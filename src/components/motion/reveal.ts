import type { MotionPreference } from "@/hooks/useMotionPreference";
import type { Part } from "./types";

const STAGGER = 60;
const DURATION = 600;

/**
 * A9 section reveals: fade + 16 px rise, staggered, once. Only elements still below the
 * viewport when this runs are hidden, so nothing already on screen ever blinks out.
 */
export function reveals(initial: MotionPreference): Part {
  const pending = new Set<HTMLElement>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let io: IntersectionObserver | null = null;

  const show = (el: HTMLElement, i: number) => {
    io?.unobserve(el);
    pending.delete(el);
    el.style.setProperty("--reveal-delay", `${i * STAGGER}ms`);
    el.classList.add("reveal-in");
    requestAnimationFrame(() => el.classList.remove("reveal-pending"));
    const t = setTimeout(
      () => {
        timers.delete(t);
        el.classList.remove("reveal-in");
        el.style.removeProperty("--reveal-delay");
      },
      DURATION + i * STAGGER + 50,
    );
    timers.add(t);
  };

  function arm() {
    const vh = window.innerHeight;
    for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
      if (el.getBoundingClientRect().top <= vh) continue;
      el.classList.add("reveal-pending");
      pending.add(el);
    }
    io = new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
          .forEach(show);
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    pending.forEach((el) => io!.observe(el));
  }

  function flush() {
    io?.disconnect();
    io = null;
    pending.forEach((el) => el.classList.remove("reveal-pending"));
    pending.clear();
  }

  if (initial === "full") arm();
  return {
    setMotion: (m) => {
      if (m !== "full") flush();
    },
    destroy: () => {
      flush();
      timers.forEach(clearTimeout);
    },
  };
}
