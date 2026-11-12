import { buildPoster } from "./posterGeometry";

const round = (n: number) => Math.round(n * 10) / 10;

/**
 * Static SVG poster of the seeded inference network: the no-JS / no-WebGL / reduced-motion
 * hero visual, and the placeholder the WebGL canvas fades in over (Phase 2).
 */
export function HeroPoster({ className }: { className?: string }) {
  const { width, height, nodes, edges } = buildPoster();
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="poster-pulse" x1="0" x2="1">
          <stop offset="0" stopColor="var(--signal)" />
          <stop offset="1" stopColor="var(--activation)" />
        </linearGradient>
        <radialGradient id="poster-glow">
          <stop offset="0" stopColor="var(--activation)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--activation)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g stroke="var(--text)" strokeOpacity="0.08" strokeWidth="0.6">
        {edges
          .filter((e) => !e.active)
          .map((e, i) => (
            <line key={i} x1={round(e.x1)} y1={round(e.y1)} x2={round(e.x2)} y2={round(e.y2)} />
          ))}
      </g>
      <g stroke="url(#poster-pulse)" strokeWidth="1" strokeLinecap="round">
        {edges
          .filter((e) => e.active)
          .map((e, i) => (
            <line
              key={i}
              x1={round(e.x1)}
              y1={round(e.y1)}
              x2={round(e.x2)}
              y2={round(e.y2)}
              strokeOpacity={round(Math.min(0.75, 0.25 + e.strength * 0.4))}
            />
          ))}
      </g>
      {nodes
        .map((n, i) => ({ ...n, i }))
        .sort((a, b) => b.depth - a.depth)
        .map((n) => (
          <g key={n.i}>
            {n.glow > 0.6 ? (
              <circle
                cx={round(n.x)}
                cy={round(n.y)}
                r={round(n.r * 4.5)}
                fill="url(#poster-glow)"
                opacity={round(n.glow)}
              />
            ) : null}
            <circle
              cx={round(n.x)}
              cy={round(n.y)}
              r={round(n.r)}
              fill={n.glow > 0.6 ? "var(--activation)" : "var(--bg-raised)"}
              fillOpacity={n.glow > 0.6 ? round(0.45 + n.glow * 0.5) : 1}
              stroke={n.glow > 0.6 ? "var(--activation)" : "var(--line-strong)"}
              strokeWidth="1"
            />
          </g>
        ))}
    </svg>
  );
}
