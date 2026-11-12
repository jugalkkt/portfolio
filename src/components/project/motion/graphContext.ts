import type { Layout, Pipeline } from "@/content/pipelines";
import { edgePoints, nodeBox, type Box } from "../pipelineGeometry";
import { Clock, easeInOut, polyline, type Pt } from "./clock";

const SVG = "http://www.w3.org/2000/svg";
const SPEED = 0.3; // viewBox units per ms

type TokenKind = "signal" | "activation" | "ghost";

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number>) {
  const node = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

/**
 * Drawing primitives for one diagram's script: tokens travelling along edges and the
 * per-project effects (approval tick, sandbox boundaries, "working" outline…).
 * Everything lives in the SVG's [data-fx] layer and is removed by `clear()`.
 */
export class GraphContext {
  readonly clock = new Clock();
  private readonly fx: SVGGElement;
  private readonly tokens = new Map<string, SVGGElement>();
  private readonly paths = new Map<string, Pt[]>();
  private readonly labels = new Map<string, string>();

  constructor(
    readonly svg: SVGSVGElement,
    readonly pipeline: Pipeline,
    readonly layout: Layout,
  ) {
    this.fx = svg.querySelector<SVGGElement>("[data-fx]")!;
    for (const e of pipeline.edges)
      this.paths.set(`${e.from}>${e.to}`, edgePoints(pipeline, e, layout));
  }

  box(id: string): Box {
    const node = this.pipeline.nodes.find((n) => n.id === id);
    if (!node) throw new Error(`unknown node ${id}`);
    return nodeBox(node, this.layout);
  }

  private node(id: string) {
    return this.svg.querySelector<SVGGElement>(`[data-node="${id}"]`);
  }

  edge(key: string) {
    return this.svg.querySelector<SVGPathElement>(`[data-edge="${key}"]`);
  }

  token(name: string, kind: TokenKind = "signal"): SVGGElement {
    let t = this.tokens.get(name);
    if (!t) {
      const color = kind === "activation" ? "var(--activation)" : "var(--signal)";
      t = el("g", { opacity: 0 });
      t.append(
        el("circle", {
          r: kind === "ghost" ? 5 : 9,
          fill: color,
          "fill-opacity": kind === "ghost" ? 0.12 : 0.18,
        }),
        el("circle", {
          r: kind === "ghost" ? 2.2 : 3.6,
          fill: color,
          "fill-opacity": kind === "ghost" ? 0.6 : 1,
        }),
      );
      this.fx.append(t);
      this.tokens.set(name, t);
    }
    return t;
  }

  /** Moves a token along an edge (optionally backwards); duration scales with length. */
  async move(
    key: string,
    opts: { token?: string; kind?: TokenKind; reverse?: boolean; hide?: boolean } = {},
  ) {
    const pts = this.paths.get(key);
    if (!pts) throw new Error(`unknown edge ${key}`);
    const line = polyline(opts.reverse ? [...pts].reverse() : pts);
    const t = this.token(opts.token ?? "a", opts.kind);
    t.setAttribute("opacity", "1");
    const dur = Math.min(Math.max(line.length / SPEED, 260), 900);
    await this.clock.tween(dur, (k) => {
      const [x, y] = line.at(easeInOut(k));
      t.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    });
    if (opts.hide) t.setAttribute("opacity", "0");
  }

  sleep(ms: number) {
    return this.clock.sleep(ms);
  }

  hide(name: string) {
    this.tokens.get(name)?.setAttribute("opacity", "0");
  }

  active(id: string, on: boolean) {
    this.node(id)?.classList.toggle("is-active", on);
  }

  /** Highlights a node for `ms` without blocking the script. */
  flash(id: string, ms = 500) {
    this.active(id, true);
    this.clock.sleep(ms).then(
      () => this.active(id, false),
      () => {},
    );
  }

  /** Replaces a node's label text (restored by `clear`). */
  setLabel(id: string, text: string) {
    const label = this.node(id)?.querySelector("[data-node-label]");
    if (!label) return;
    if (!this.labels.has(id)) this.labels.set(id, label.textContent ?? "");
    label.textContent = text;
  }

  forced(key: string, on: boolean) {
    this.edge(key)?.classList.toggle("is-forced", on);
    const label = this.svg.querySelector(`[data-edge-label="${key}"]`);
    label?.setAttribute("opacity", on ? "1" : "0.55");
  }

  /** Small fading caption, e.g. "✓ approved". Resolves when it has faded out. */
  async caption(text: string, x: number, y: number, ms: number, color = "var(--ok)") {
    const t = el("text", {
      x,
      y,
      "text-anchor": "middle",
      "font-size": 10.5,
      fill: color,
      opacity: 0,
      class: "font-mono",
    });
    t.textContent = text;
    this.fx.append(t);
    try {
      await this.clock.tween(180, (k) => t.setAttribute("opacity", String(k)));
      await this.clock.sleep(ms);
      await this.clock.tween(220, (k) => t.setAttribute("opacity", String(1 - k)));
    } finally {
      t.remove();
    }
  }

  /** Nested boundaries growing around a node (the sandbox's 2 layers). */
  async boundaries(id: string, layers: number, ms: number) {
    const b = this.box(id);
    const rects = Array.from({ length: layers }, (_, i) =>
      el("rect", {
        fill: "none",
        stroke: i === 0 ? "var(--signal)" : "var(--activation)",
        "stroke-width": 1,
        rx: 10 + i * 3,
        opacity: 0,
      }),
    );
    rects.forEach((r) => this.fx.append(r));
    try {
      await this.clock.tween(420, (k) => {
        rects.forEach((r, i) => {
          const pad = (5 + i * 6) * easeInOut(k);
          r.setAttribute("x", String(b.cx - b.w / 2 - pad));
          r.setAttribute("y", String(b.cy - b.h / 2 - pad));
          r.setAttribute("width", String(b.w + pad * 2));
          r.setAttribute("height", String(b.h + pad * 2));
          r.setAttribute("opacity", String(Math.min(1, k * 1.5) * (i === 0 ? 0.9 : 0.7)));
        });
      });
      await this.clock.sleep(ms);
      await this.clock.tween(250, (k) =>
        rects.forEach((r) => r.setAttribute("opacity", String((1 - k) * 0.8))),
      );
    } finally {
      rects.forEach((r) => r.remove());
    }
  }

  /** Marching-dash outline around a node while it "works" (bcrypt hashing, search retry). */
  async working(id: string, ms: number, color = "var(--activation)") {
    const b = this.box(id);
    const r = el("rect", {
      x: b.cx - b.w / 2 - 4,
      y: b.cy - b.h / 2 - 4,
      width: b.w + 8,
      height: b.h + 8,
      rx: 11,
      fill: "none",
      stroke: color,
      "stroke-width": 1.2,
      "stroke-dasharray": "5 4",
    });
    this.fx.append(r);
    try {
      await this.clock.tween(ms, (k) =>
        r.setAttribute("stroke-dashoffset", String(-k * ms * 0.04)),
      );
    } finally {
      r.remove();
    }
  }

  /** Removes all effects and restores labels and classes (used on reduce / destroy). */
  clear() {
    this.fx.replaceChildren();
    this.tokens.clear();
    for (const [id, text] of this.labels) {
      const label = this.node(id)?.querySelector("[data-node-label]");
      if (label) label.textContent = text;
    }
    this.labels.clear();
    this.svg
      .querySelectorAll(".is-active, .is-forced")
      .forEach((n) => n.classList.remove("is-active", "is-forced"));
    this.svg.querySelectorAll("[data-edge-label]").forEach((n) => n.removeAttribute("opacity"));
  }
}
