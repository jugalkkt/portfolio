import type { Layout, Pipeline, PipelineNode } from "@/content/pipelines";
import { cn } from "@/lib/cn";
import { edgePoints, nodeBox, toPath } from "./pipelineGeometry";

const nodeStyle: Record<
  PipelineNode["kind"],
  { fill: string; stroke: string; dash?: string; text: string }
> = {
  agent: { fill: "var(--bg-raised)", stroke: "var(--line-strong)", text: "var(--text)" },
  gate: {
    fill: "color-mix(in srgb, var(--activation) 12%, var(--bg-raised))",
    stroke: "var(--activation)",
    text: "var(--text)",
  },
  tool: {
    fill: "color-mix(in srgb, var(--signal) 7%, var(--bg-raised))",
    stroke: "color-mix(in srgb, var(--signal) 55%, transparent)",
    text: "var(--text)",
  },
  store: {
    fill: "var(--bg-inset)",
    stroke: "var(--line-strong)",
    dash: "4 3",
    text: "var(--text)",
  },
  io: { fill: "transparent", stroke: "var(--line-strong)", text: "var(--text-muted)" },
  badge: { fill: "var(--bg-inset)", stroke: "var(--line)", text: "var(--text-muted)" },
};

function Graph({
  pipeline,
  layout,
  className,
}: {
  pipeline: Pipeline;
  layout: Layout;
  className?: string;
}) {
  const [w, h] = pipeline.viewBox[layout];
  const marker = `arrow-${pipeline.project}-${layout}`;
  const markerStart = `${marker}-start`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={pipeline.summary}
      className={cn("h-auto w-full", className)}
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 0.5 L7.5 4 L0 7.5 Z" fill="var(--text-muted)" />
        </marker>
        <marker
          id={markerStart}
          viewBox="0 0 8 8"
          refX="1"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M8 0.5 L0.5 4 L8 7.5 Z" fill="var(--text-muted)" />
        </marker>
      </defs>

      <g fill="none" strokeWidth="1.2" strokeLinejoin="round">
        {pipeline.edges.map((edge) => {
          const d = toPath(edgePoints(pipeline, edge, layout));
          return (
            <path
              key={`${edge.from}-${edge.to}`}
              d={d}
              stroke={edge.dashed ? "var(--line-strong)" : "var(--text-faint)"}
              strokeDasharray={edge.dashed ? "4 4" : undefined}
              markerEnd={`url(#${marker})`}
              markerStart={edge.bidirectional ? `url(#${markerStart})` : undefined}
            />
          );
        })}
      </g>

      {pipeline.edges
        .filter((e) => e.label && e.labelAt?.[layout])
        .map((e) => {
          const [x, y] = e.labelAt![layout]!;
          return (
            <text
              key={`label-${e.from}-${e.to}`}
              x={x}
              y={y}
              textAnchor="middle"
              fill="var(--signal)"
              stroke="var(--bg-inset)"
              strokeWidth="6"
              paintOrder="stroke"
              dominantBaseline="middle"
              fontSize="10.5"
              className="font-mono"
            >
              {e.label}
            </text>
          );
        })}

      {pipeline.nodes.map((node) => {
        const b = nodeBox(node, layout);
        const s = nodeStyle[node.kind];
        const isBadge = node.kind === "badge";
        return (
          <g key={node.id}>
            <title>{node.source}</title>
            <rect
              x={b.cx - b.w / 2}
              y={b.cy - b.h / 2}
              width={b.w}
              height={b.h}
              rx={isBadge ? b.h / 2 : 8}
              fill={s.fill}
              stroke={s.stroke}
              strokeDasharray={s.dash}
            />
            <text
              x={b.cx}
              y={node.sub ? b.cy - 4 : b.cy + (isBadge ? 3.5 : 4.5)}
              textAnchor="middle"
              fill={s.text}
              fontSize={isBadge ? 10.5 : 13}
              fontWeight={node.kind === "agent" || node.kind === "gate" ? 500 : 400}
              className={isBadge || node.kind === "io" ? "font-mono" : "font-sans"}
            >
              {node.label}
            </text>
            {node.sub ? (
              <text
                x={b.cx}
                y={b.cy + 13}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="10.5"
                className="font-mono"
              >
                {node.sub}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/** Static (fully drawn) pipeline diagram; horizontal ≥1024px, vertical variant below. */
export function PipelineGraph({ pipeline }: { pipeline: Pipeline }) {
  return (
    <div className="rounded-card border border-line bg-bg-inset p-2 sm:p-4 md:p-6">
      <Graph pipeline={pipeline} layout="desktop" className="hidden lg:block" />
      <Graph pipeline={pipeline} layout="mobile" className="mx-auto max-w-[420px] lg:hidden" />
    </div>
  );
}
