import type { MotionPreference } from "@/hooks/useMotionPreference";
import type { Part } from "./types";

const COUNT = 40;
const SIGNAL = "79, 209, 232";
const ACTIVATION = "139, 124, 246";
const DPR_CAP = 2;

type Mote = {
  sx: number;
  sy: number;
  cx: number;
  cy: number;
  delay: number;
  dur: number;
  size: number;
  tint: string;
  bright?: boolean;
};

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * A8 output convergence: ~40 faint nodes drift in from the section edges and converge into
 * the output node beside the email address, which then pulses (CSS). Hovering the email
 * link sends one bright pulse into it. Canvas 2D; runs only while in view and in full
 * motion, and stops drawing entirely once converged.
 */
export function converge(initial: MotionPreference): Part | null {
  const section = document.querySelector<HTMLElement>("[data-contact]");
  const canvas = section?.querySelector<HTMLCanvasElement>("[data-converge]");
  const node = section?.querySelector<HTMLElement>("[data-output-node]");
  const link = section?.querySelector<HTMLElement>("[data-email-link]");
  const ctx = canvas?.getContext("2d");
  if (!section || !canvas || !node || !link || !ctx) return null;

  let motion = initial;
  let inView = false;
  let started = false;
  let done = false;
  let raf = 0;
  let last = 0;
  let clock = 0; // ms of convergence time actually played (freezes while paused)
  let w = 0;
  let h = 0;
  let target: [number, number] = [0, 0];
  let motes: Mote[] = [];
  let pulses: { m: Mote; t0: number }[] = [];

  const measure = () => {
    const r = section.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = node.getBoundingClientRect();
    target = [n.left + n.width / 2 - r.left, n.top + n.height / 2 - r.top];
  };

  const edgePoint = (): [number, number] => {
    const side = Math.floor(Math.random() * 4);
    const u = Math.random();
    return side === 0
      ? [u * w, -8]
      : side === 1
        ? [w + 8, u * h]
        : side === 2
          ? [u * w, h + 8]
          : [-8, u * h];
  };

  const makeMote = (bright = false): Mote => {
    const [sx, sy] = edgePoint();
    // Control point off the straight line, so paths arc in like a fan-in.
    const mx = (sx + target[0]) / 2;
    const my = (sy + target[1]) / 2;
    const bend = (Math.random() - 0.5) * 0.6;
    return {
      sx,
      sy,
      cx: mx - (target[1] - sy) * bend,
      cy: my + (target[0] - sx) * bend,
      delay: bright ? 0 : Math.random() * 700,
      dur: bright ? 650 : 1700 + Math.random() * 1000,
      size: bright ? 2.8 : 1.2 + Math.random() * 1.4,
      tint: !bright && Math.random() > 0.78 ? ACTIVATION : SIGNAL,
      bright,
    };
  };

  const at = (m: Mote, e: number): [number, number] => {
    const a = (1 - e) * (1 - e);
    const b = 2 * (1 - e) * e;
    const c = e * e;
    return [a * m.sx + b * m.cx + c * target[0], a * m.sy + b * m.cy + c * target[1]];
  };

  const drawMote = (m: Mote, k: number) => {
    const e = easeInOut(k);
    const [x, y] = at(m, e);
    const fadeIn = Math.min(k * 4, 1);
    const fadeOut = k > 0.92 ? (1 - k) / 0.08 : 1;
    const alpha = (m.bright ? 1 : 0.35 + 0.55 * e) * fadeIn * fadeOut;
    // Faint "weight" line from the mote to the output node.
    ctx.strokeStyle = `rgba(${m.tint}, ${(m.bright ? 0.4 : 0.12) * e * fadeOut})`;
    ctx.lineWidth = m.bright ? 1 : 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(target[0], target[1]);
    ctx.stroke();
    ctx.fillStyle = `rgba(${m.tint}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, m.size, 0, Math.PI * 2);
    ctx.fill();
  };

  const hit = () => {
    node.classList.remove("is-hit");
    void node.offsetWidth; // restart the CSS animation
    node.classList.add("is-hit");
  };

  const frame = (now: number) => {
    raf = 0;
    const dt = last ? Math.min(now - last, 50) : 16;
    last = now;
    clock += dt;
    ctx.clearRect(0, 0, w, h);

    let live = false;
    if (!done) {
      for (const m of motes) {
        const k = Math.min(Math.max((clock - m.delay) / m.dur, 0), 1);
        if (k < 1) live = true;
        if (k > 0 && k < 1) drawMote(m, k);
      }
      if (!live) {
        done = true;
        node.classList.add("is-pulsing");
      }
    }
    pulses = pulses.filter((p) => {
      const k = (clock - p.t0) / p.m.dur;
      if (k >= 1) {
        hit();
        return false;
      }
      drawMote(p.m, k);
      return true;
    });

    if (!done || pulses.length) schedule();
    else ctx.clearRect(0, 0, w, h);
  };

  const schedule = () => {
    if (!raf && motion === "full" && inView) raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  };

  const begin = () => {
    if (started || motion !== "full" || !inView) return;
    started = true;
    measure();
    motes = Array.from({ length: COUNT }, () => makeMote());
    schedule();
  };

  const onEnter = () => {
    if (motion !== "full" || !started) return;
    measure();
    pulses.push({ m: makeMote(true), t0: clock });
    schedule();
  };
  link.addEventListener("pointerenter", onEnter);

  const io = new IntersectionObserver(
    ([e]) => {
      inView = e.isIntersecting;
      if (!inView) stop();
      else if (!started) begin();
      else schedule();
    },
    { threshold: 0.25 },
  );
  io.observe(section);

  const ro = new ResizeObserver(() => {
    if (!started) return;
    measure();
    if (raf === 0 && !done) frame(performance.now());
  });
  ro.observe(section);

  const reset = () => {
    stop();
    ctx.clearRect(0, 0, w, h);
    pulses = [];
    node.classList.remove("is-pulsing", "is-hit");
  };

  return {
    setMotion: (m) => {
      const prev = motion;
      motion = m;
      if (m === "reduced") {
        reset();
        if (started) done = true;
      } else if (m === "paused") stop();
      else if (prev !== "full") {
        if (!started) begin();
        else if (done && prev === "reduced") node.classList.add("is-pulsing");
        else schedule();
      }
    },
    destroy: () => {
      io.disconnect();
      ro.disconnect();
      link.removeEventListener("pointerenter", onEnter);
      reset();
    },
  };
}
