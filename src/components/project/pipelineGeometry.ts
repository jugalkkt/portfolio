import type { Layout, Pipeline, PipelineEdge, PipelineNode, Point } from "@/content/pipelines";

const LABEL_CHAR = 7.4; // ≈ advance of 13px Geist
const SUB_CHAR = 6.3; // ≈ advance of 10.5px Geist Mono
const BADGE_CHAR = 6.5;

export type Box = { cx: number; cy: number; w: number; h: number };

export function nodeBox(node: PipelineNode, layout: Layout): Box {
  const [cx, cy] = node.at[layout];
  if (node.kind === "badge") {
    return { cx, cy, w: node.label.length * BADGE_CHAR + 22, h: 24 };
  }
  const textW = Math.max(node.label.length * LABEL_CHAR, (node.sub?.length ?? 0) * SUB_CHAR);
  return { cx, cy, w: Math.round(textW + 28), h: node.sub ? 48 : 36 };
}

/** Point where the ray from the box centre toward `p` leaves the box. */
export function clipToBox(box: Box, p: Point): Point {
  const dx = p[0] - box.cx;
  const dy = p[1] - box.cy;
  if (dx === 0 && dy === 0) return [box.cx, box.cy];
  const sx = dx === 0 ? Infinity : box.w / 2 / Math.abs(dx);
  const sy = dy === 0 ? Infinity : box.h / 2 / Math.abs(dy);
  const s = Math.min(sx, sy);
  return [box.cx + dx * s, box.cy + dy * s];
}

export function edgePoints(pipeline: Pipeline, edge: PipelineEdge, layout: Layout): Point[] {
  const byId = (id: string) => {
    const n = pipeline.nodes.find((x) => x.id === id);
    if (!n) throw new Error(`Pipeline ${pipeline.project}: unknown node ${id}`);
    return nodeBox(n, layout);
  };
  const a = byId(edge.from);
  const b = byId(edge.to);
  const via = edge.via?.[layout] ?? [];
  const start = clipToBox(a, via[0] ?? [b.cx, b.cy]);
  const end = clipToBox(b, via[via.length - 1] ?? [a.cx, a.cy]);
  return [start, ...via, end];
}

export function toPath(points: Point[]): string {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
}
