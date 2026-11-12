import type { MotionPreference } from "@/hooks/useMotionPreference";
import type { Part } from "./types";

/**
 * A6 signal trace: the fill tracks scroll progress through the timeline (measured at 60 %
 * of the viewport height); each entry's node flashes once when the signal reaches it.
 */
export function trace(initial: MotionPreference): Part | null {
  const root = document.querySelector<HTMLElement>("[data-trace]");
  const fill = root?.querySelector<HTMLElement>("[data-trace-fill]");
  if (!root || !fill) return null;
  const nodes = [...root.querySelectorAll<HTMLElement>("[data-trace-node]")];
  let raf = 0;
  let on = false;

  const update = () => {
    raf = 0;
    const r = root.getBoundingClientRect();
    const p = Math.min(Math.max((window.innerHeight * 0.6 - r.top) / r.height, 0), 1);
    fill.style.transform = `scaleY(${p.toFixed(4)})`;
    for (const n of nodes) {
      const nr = n.getBoundingClientRect();
      const at = (nr.top + nr.height / 2 - r.top) / r.height;
      n.classList.toggle("is-lit", p >= at);
    }
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };

  const set = (m: MotionPreference) => {
    const want = m === "full";
    if (want === on) return;
    on = want;
    if (on) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      update();
    } else {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      raf = 0;
      // Static line fallback.
      fill.style.transform = "";
      nodes.forEach((n) => n.classList.remove("is-lit"));
    }
  };
  set(initial);
  return { setMotion: set, destroy: () => set("reduced") };
}
