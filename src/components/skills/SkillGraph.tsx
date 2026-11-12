import layout from "@/content/skillGraph.generated.json";
import {
  coreGroups,
  graphProjects,
  projectsForSkill,
  skillProjectEdges,
  skillSlug,
  type SkillGraphLayout,
} from "@/content/skillGraph";
import { seededRandom } from "@/lib/seededRandom";
import { GRAPH, skillBox } from "./skillGraphGeometry";

const data = layout as SkillGraphLayout;

/**
 * Hover linking is pure CSS (`:has()`), generated from the edge list: hovering a project
 * lights its skills and edges, hovering a skill lights its projects. No client JS.
 */
function hoverRules() {
  const keys = [...data.skills.map((s) => skillSlug(s.name)), ...graphProjects.map((p) => p.id)];
  return keys
    .map((k) => `.sg:has([data-k="${k}"]:hover) [data-for~="${k}"]`)
    .join(",\n")
    .concat(" { opacity: 1; color: var(--signal); }");
}

function edgePath(sx: number, sy: number, tx: number, ty: number) {
  const mx = (sx + tx) / 2;
  return `M${sx} ${sy} C${mx} ${sy} ${mx} ${ty} ${tx} ${ty}`;
}

/** A5 Skill Embedding Graph: fixed build-time layout, CSS hover linking, CSS drift. */
export function SkillGraph({ className }: { className?: string }) {
  const project = new Map(data.projects.map((p) => [p.id, p]));
  const rand = seededRandom(23);
  const drift = () => (rand() * 2 - 1) * 2.5;
  const summary = graphProjects
    .map((p) => `${p.name} uses ${skillProjectEdges[p.id].join(", ")}`)
    .join(". ");

  return (
    <figure className={className}>
      <style>{hoverRules()}</style>
      <svg
        viewBox={`0 0 ${data.width} ${data.height}`}
        role="img"
        aria-labelledby="skill-graph-title skill-graph-desc"
        className="sg h-auto w-full"
        data-skill-graph
      >
        <title id="skill-graph-title">
          Skill graph: skills clustered by group, linked to projects
        </title>
        <desc id="skill-graph-desc">{summary}.</desc>

        <g data-edges fill="none">
          {graphProjects.flatMap((p) =>
            skillProjectEdges[p.id].map((name) => {
              const s = data.skills.find((x) => x.name === name)!;
              const b = skillBox(name);
              const t = project.get(p.id)!;
              const slug = skillSlug(name);
              return (
                <path
                  key={`${slug}>${p.id}`}
                  data-edge={`${slug}>${p.id}`}
                  data-for={`${slug} ${p.id}`}
                  className="sg-dim sg-edge"
                  d={edgePath(s.x + b.dotDx, s.y, t.x - GRAPH.projectW / 2, t.y)}
                />
              );
            }),
          )}
        </g>

        <g data-groups className="font-mono uppercase" fontSize={GRAPH.groupFontSize}>
          {data.groups.map((g) => (
            <text
              key={g.group}
              x={g.x}
              y={g.y}
              textAnchor="middle"
              dominantBaseline="central"
              letterSpacing="0.12em"
              className={coreGroups.includes(g.group) ? "sg-dim fill-signal" : "sg-dim fill-faint"}
            >
              {g.group}
            </text>
          ))}
        </g>

        <g data-skills fontSize={GRAPH.fontSize}>
          {data.skills.map((s) => {
            const b = skillBox(s.name);
            const slug = skillSlug(s.name);
            const core = coreGroups.includes(s.group);
            const style = {
              "--dx1": `${drift()}px`,
              "--dy1": `${drift()}px`,
              "--dx2": `${drift()}px`,
              "--dy2": `${drift()}px`,
              animationDuration: `${(7 + rand() * 6).toFixed(1)}s`,
              animationDelay: `${(-rand() * 10).toFixed(1)}s`,
            } as React.CSSProperties;
            return (
              <g
                key={slug}
                transform={`translate(${s.x} ${s.y})`}
                data-k={slug}
                data-skill={s.name}
                data-for={[slug, ...projectsForSkill(s.name)].join(" ")}
                className={core ? "sg-dim sg-node is-core" : "sg-dim sg-node"}
              >
                <g className="sg-drift" style={style}>
                  <rect x={-b.w / 2} y={-b.h / 2} width={b.w} height={b.h} fill="transparent" />
                  <circle cx={b.dotDx} r={3.2} />
                  <text x={b.textDx} dominantBaseline="central">
                    {s.name}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        <g data-projects>
          {graphProjects.map((p) => {
            const t = project.get(p.id)!;
            const ids = skillProjectEdges[p.id].map(skillSlug);
            return (
              <g
                key={p.id}
                transform={`translate(${t.x} ${t.y})`}
                data-k={p.id}
                data-project={p.id}
                data-for={[p.id, ...ids].join(" ")}
                className="sg-dim sg-project"
              >
                <rect
                  x={-GRAPH.projectW / 2}
                  y={-GRAPH.projectH / 2}
                  width={GRAPH.projectW}
                  height={GRAPH.projectH}
                  rx={GRAPH.projectH / 2}
                />
                <text textAnchor="middle" dominantBaseline="central" fontSize={12}>
                  {p.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <figcaption className="mt-3 font-mono text-label text-muted">
        Hover a project or a skill to trace its links.
      </figcaption>
    </figure>
  );
}
