import { pipelines, type Layout } from "@/content/pipelines";
import type { MotionPreference } from "@/hooks/useMotionPreference";
import { Cancelled, Clock, easeOut } from "./clock";
import { GraphContext } from "./graphContext";
import { scripts } from "./scripts";

const DRAW_MS = 700;
const DRAW_STAGGER = 110;

/** Hover/focus tooltip quoting the resume phrase a node is drawn from. Esc closes it. */
function tooltips(root: HTMLElement) {
  const cleanups: (() => void)[] = [];
  for (const box of root.querySelectorAll<HTMLElement>("[data-pipeline-root]")) {
    // Native <title> tooltips are the no-JS fallback; the custom tooltip replaces them.
    box.querySelectorAll("[data-node] > title").forEach((t) => t.remove());
    const tip = document.createElement("div");
    tip.setAttribute("aria-hidden", "true");
    tip.className =
      "pointer-events-none absolute left-0 top-0 z-10 max-w-[18rem] rounded-chip border border-line-strong bg-bg-raised px-3 py-2 text-small leading-snug text-text opacity-0 shadow-lg transition-opacity duration-150";
    box.append(tip);
    let current: SVGGElement | null = null;

    const hot = (node: SVGGElement, on: boolean) => {
      node.classList.toggle("is-hot", on);
      const id = node.dataset.node!;
      node.ownerSVGElement?.querySelectorAll<SVGPathElement>("[data-edge]").forEach((e) => {
        const [a, b] = e.dataset.edge!.split(">");
        if (a === id || b === id) e.classList.toggle("is-hot", on);
      });
    };
    const show = (node: SVGGElement) => {
      if (current === node) return;
      if (current) hot(current, false);
      current = node;
      hot(node, true);
      tip.textContent = `“${node.dataset.source}”`;
      const r = node.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const w = tip.offsetWidth;
      const x = Math.max(8, Math.min(r.left - b.left + r.width / 2 - w / 2, b.width - w - 8));
      const above = r.top - b.top - tip.offsetHeight - 8;
      const y = above > 4 ? above : r.bottom - b.top + 8;
      tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      tip.style.opacity = "1";
    };
    const hide = () => {
      if (current) hot(current, false);
      current = null;
      tip.style.opacity = "0";
    };
    const nodeOf = (e: Event) => (e.target as Element).closest<SVGGElement>("[data-node]");
    const over = (e: Event) => {
      const n = nodeOf(e);
      if (n) show(n);
      else hide();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    box.addEventListener("pointerover", over);
    box.addEventListener("pointerleave", hide);
    box.addEventListener("focusin", over);
    box.addEventListener("focusout", hide);
    box.addEventListener("keydown", key);
    cleanups.push(() => {
      box.removeEventListener("pointerover", over);
      box.removeEventListener("pointerleave", hide);
      box.removeEventListener("focusin", over);
      box.removeEventListener("focusout", hide);
      box.removeEventListener("keydown", key);
      tip.remove();
    });
  }
  return () => cleanups.forEach((c) => c());
}

/** One diagram (one layout): edge draw-in on first view, then its token script while in view. */
class GraphRun {
  private ctx: GraphContext;
  private state: "waiting" | "hidden" | "drawn" = "waiting";
  private inView = false;
  private started = false;
  private motion: MotionPreference;
  private io: IntersectionObserver;
  private timers: number[] = [];

  constructor(svg: SVGSVGElement, motion: MotionPreference) {
    const pipeline = pipelines[svg.dataset.pipeline as keyof typeof pipelines];
    this.ctx = new GraphContext(svg, pipeline, svg.dataset.layout as Layout);
    this.motion = motion;
    this.io = new IntersectionObserver(([e]) => this.onView(e.isIntersecting), { threshold: 0.3 });
    this.io.observe(svg);
  }

  private edges() {
    return Array.from(this.ctx.svg.querySelectorAll<SVGPathElement>("[data-edge]"));
  }

  private onView(visible: boolean) {
    if (this.state === "waiting") {
      // Already on screen at load → no draw-in; otherwise hide edges until they're reached.
      if (!visible && this.motion === "full") this.hide();
      else this.state = "drawn";
    }
    this.inView = visible;
    this.update();
  }

  private hide() {
    for (const p of this.edges()) {
      if (p.hasAttribute("data-dashed")) {
        p.style.opacity = "0";
      } else {
        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
        p.dataset.markerEnd = p.getAttribute("marker-end") ?? "";
        p.dataset.markerStart = p.getAttribute("marker-start") ?? "";
        p.removeAttribute("marker-end");
        p.removeAttribute("marker-start");
      }
    }
    this.state = "hidden";
  }

  private reveal(animate: boolean) {
    for (const p of this.edges()) {
      const delay = (Number(p.dataset.order) - 1) * DRAW_STAGGER;
      const restore = () => {
        p.style.removeProperty("stroke-dasharray");
        p.style.removeProperty("stroke-dashoffset");
        p.style.removeProperty("transition");
        if (p.dataset.markerEnd) p.setAttribute("marker-end", p.dataset.markerEnd);
        if (p.dataset.markerStart) p.setAttribute("marker-start", p.dataset.markerStart);
      };
      if (!animate) {
        p.style.removeProperty("opacity");
        restore();
        continue;
      }
      p.style.transition = `stroke-dashoffset ${DRAW_MS}ms var(--ease-out) ${delay}ms, opacity ${DRAW_MS}ms var(--ease-out) ${delay}ms`;
      requestAnimationFrame(() => {
        p.style.strokeDashoffset = "0";
        p.style.opacity = "1";
      });
      this.timers.push(window.setTimeout(restore, delay + DRAW_MS + 30));
    }
    this.state = "drawn";
  }

  private totalDrawMs() {
    const maxOrder = Math.max(...this.edges().map((p) => Number(p.dataset.order)));
    return (maxOrder - 1) * DRAW_STAGGER + DRAW_MS;
  }

  setMotion(m: MotionPreference) {
    this.motion = m;
    this.update();
  }

  private update() {
    const full = this.motion === "full";
    if (this.state === "hidden" && (!full || this.inView)) {
      this.reveal(full);
      if (full) this.timers.push(window.setTimeout(() => this.update(), this.totalDrawMs()));
      return;
    }
    if (this.motion === "reduced") {
      // Reduced motion: graph fully drawn, no tokens.
      this.stopScript();
      return;
    }
    if (full && this.inView && this.state === "drawn") {
      if (!this.started) this.startScript();
      this.ctx.clock.play();
    } else {
      this.ctx.clock.pause(); // off-screen or paused: tokens freeze where they are
    }
  }

  private startScript() {
    this.started = true;
    scripts[this.ctx.pipeline.project](this.ctx).catch((e) => {
      if (!(e instanceof Cancelled)) console.error(e);
    });
  }

  private stopScript() {
    if (!this.started) return;
    this.ctx.clock.destroy();
    this.ctx.clear();
    this.started = false;
    // A fresh clock/context for if motion comes back.
    this.ctx = new GraphContext(this.ctx.svg, this.ctx.pipeline, this.ctx.layout);
  }

  destroy() {
    this.io.disconnect();
    this.timers.forEach(clearTimeout);
    this.ctx.clock.destroy();
    this.ctx.clear();
    if (this.state === "hidden") this.reveal(false);
  }
}

const format = (v: number, decimals: number) => v.toFixed(decimals);

/** Stat chips: numbers count up from 0 to the exact value once; others fade in (§5 A4). */
class Stats {
  private clock = new Clock();
  private io: IntersectionObserver;
  private pending = new Set<HTMLElement>();
  private motion: MotionPreference;

  constructor(root: HTMLElement, motion: MotionPreference) {
    this.motion = motion;
    const chips = Array.from(root.querySelectorAll<HTMLElement>("[data-stat]"));
    this.io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || !this.pending.has(e.target as HTMLElement)) continue;
          this.io.unobserve(e.target);
          this.run(e.target as HTMLElement);
        }
      },
      { threshold: 0.6 },
    );
    if (motion !== "full") return;
    for (const chip of chips) {
      // Only chips not yet seen get the entrance; reserve final widths so nothing shifts.
      const r = chip.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) continue;
      const nums = chip.querySelectorAll<HTMLElement>("[data-stat-num]");
      const counts = Array.from(nums).some((n) => Number(n.dataset.statNum) !== 0);
      if (counts) {
        nums.forEach((n) => {
          n.style.display = "inline-block";
          n.style.minWidth = `${n.getBoundingClientRect().width}px`;
          n.style.textAlign = "right";
          n.textContent = format(0, Number(n.dataset.decimals));
        });
      } else {
        chip.style.opacity = "0";
      }
      this.pending.add(chip);
      this.io.observe(chip);
    }
    this.clock.play();
  }

  private finish(chip: HTMLElement) {
    chip.querySelectorAll<HTMLElement>("[data-stat-num]").forEach((n) => {
      n.textContent = format(Number(n.dataset.statNum), Number(n.dataset.decimals));
    });
    chip.style.opacity = "";
    this.pending.delete(chip);
  }

  private run(chip: HTMLElement) {
    const siblings = Array.from(chip.parentElement?.children ?? []);
    const delay = Math.max(siblings.indexOf(chip), 0) * 60;
    const nums = Array.from(chip.querySelectorAll<HTMLElement>("[data-stat-num]"));
    this.clock
      .sleep(delay)
      .then(() => {
        if (chip.style.opacity === "0") {
          chip.style.transition = "opacity 300ms var(--ease-out)";
          chip.style.opacity = "1";
        }
        return this.clock.tween(1100, (t) => {
          const k = easeOut(t);
          nums.forEach((n) => {
            n.textContent = format(Number(n.dataset.statNum) * k, Number(n.dataset.decimals));
          });
        });
      })
      .then(
        () => this.finish(chip),
        () => this.finish(chip),
      );
  }

  setMotion(m: MotionPreference) {
    this.motion = m;
    if (m !== "full") {
      // Paused or reduced: show final values immediately.
      this.clock.destroy();
      this.pending.forEach((c) => this.finish(c));
      this.io.disconnect();
    }
  }

  destroy() {
    this.setMotion("reduced");
  }
}

export type ProjectsMotion = { setMotion(m: MotionPreference): void; destroy(): void };

/** Lazy entry point: wires tooltips, diagram runs and stat count-ups inside `root`. */
export function enhance(root: HTMLElement, motion: MotionPreference): ProjectsMotion {
  const untip = tooltips(root);
  const runs = Array.from(root.querySelectorAll<SVGSVGElement>("svg[data-pipeline]")).map(
    (svg) => new GraphRun(svg, motion),
  );
  const stats = new Stats(root, motion);
  return {
    setMotion(m) {
      runs.forEach((r) => r.setMotion(m));
      stats.setMotion(m);
    },
    destroy() {
      untip();
      runs.forEach((r) => r.destroy());
      stats.destroy();
    },
  };
}
