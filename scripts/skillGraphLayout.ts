/**
 * A5 layout: d3-force (cluster pull per resume group + label-box collision + weak
 * skill→project links), run once at build time. Deterministic: seeded start and RNG.
 */
import { forceLink, forceSimulation, forceX, forceY, type SimulationNodeDatum } from "d3-force";
import { skills } from "../src/content/resume";
import {
  allSkills,
  coreGroups,
  graphProjects,
  skillProjectEdges,
  type SkillGraphLayout,
} from "../src/content/skillGraph";
import { GRAPH, groupLabelBox, skillBox } from "../src/components/skills/skillGraphGeometry";
import { seededRandom } from "../src/lib/seededRandom";

type Node = SimulationNodeDatum & {
  key: string;
  kind: "skill" | "group" | "project";
  group: string;
  w: number;
  h: number;
  tx: number;
  ty: number;
};

export function computeSkillGraph(): SkillGraphLayout {
  const { width: W, height: H, centre, projectX } = GRAPH;

  // Cluster centres: the core groups in a tight triangle, the rest on an ellipse around them.
  // Languages (Python → all three projects) faces the project column.
  const orbitOrder = [
    "Languages",
    "Backend & APIs",
    "Databases",
    "Tools & Systems",
    "RTOS",
    "Frontend",
  ];
  const centres = new Map<string, [number, number]>();
  coreGroups.forEach((g, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / coreGroups.length;
    centres.set(g, [centre[0] + Math.cos(a) * 70, centre[1] + Math.sin(a) * 64]);
  });
  orbitOrder.forEach((g, i) => {
    const a = (i * 2 * Math.PI) / orbitOrder.length;
    centres.set(g, [centre[0] + Math.cos(a) * 225, centre[1] + Math.sin(a) * 215]);
  });
  for (const g of skills) if (!centres.has(g.group)) throw new Error(`no centre for ${g.group}`);

  const projectY = (i: number) => H / 2 + (i - 1) * 170;

  const nodes: Node[] = [
    ...allSkills.map((s) => {
      const [tx, ty] = centres.get(s.group)!;
      const b = skillBox(s.name);
      return { key: s.name, kind: "skill" as const, group: s.group, w: b.w, h: b.h, tx, ty };
    }),
    ...skills.map((g) => {
      const [tx, ty] = centres.get(g.group)!;
      const b = groupLabelBox(g.group);
      return {
        key: `group:${g.group}`,
        kind: "group" as const,
        group: g.group,
        w: b.w,
        h: b.h,
        tx,
        ty: ty - 30,
      };
    }),
    ...graphProjects.map((p, i) => ({
      key: `project:${p.id}`,
      kind: "project" as const,
      group: "",
      w: 0,
      h: 0,
      tx: projectX,
      ty: projectY(i),
      fx: projectX,
      fy: projectY(i),
    })),
  ];
  const byKey = new Map(nodes.map((n) => [n.key, n]));

  // Deterministic start: each node near its cluster centre.
  const rand = seededRandom(5);
  for (const n of nodes) {
    if (n.kind === "project") continue;
    n.x = n.tx + (rand() - 0.5) * 40;
    n.y = n.ty + (rand() - 0.5) * 40;
  }

  const links = graphProjects.flatMap((p) =>
    skillProjectEdges[p.id].map((s) => {
      if (!byKey.has(s)) throw new Error(`edge to unknown skill ${s}`);
      return { source: s, target: `project:${p.id}` };
    }),
  );

  /** Axis-aligned label-box collision (circles waste space around wide labels). */
  function forceBoxes(pad: number) {
    let list: Node[] = [];
    const force = () => {
      for (let i = 0; i < list.length; i++)
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          const dx = b.x! - a.x!;
          const dy = b.y! - a.y!;
          const ox = (a.w + b.w) / 2 + pad - Math.abs(dx);
          const oy = (a.h + b.h) / 2 + pad - Math.abs(dy);
          if (ox <= 0 || oy <= 0) continue;
          if (ox < oy * 1.4) {
            const s = (dx < 0 ? -1 : 1) * ox * 0.5;
            a.x! -= s;
            b.x! += s;
          } else {
            const s = (dy < 0 ? -1 : 1) * oy * 0.5;
            a.y! -= s;
            b.y! += s;
          }
        }
    };
    force.initialize = (ns: Node[]) => {
      list = ns.filter((n) => n.kind !== "project");
    };
    return force;
  }

  /** Keeps every label box inside the skills area (left of the project column). */
  function forceBounds() {
    let list: Node[] = [];
    const force = () => {
      for (const n of list) {
        n.x = Math.min(Math.max(n.x!, n.w / 2 + 6), GRAPH.skillsRight - n.w / 2);
        n.y = Math.min(Math.max(n.y!, n.h / 2 + 6), H - n.h / 2 - 6);
      }
    };
    force.initialize = (ns: Node[]) => {
      list = ns.filter((n) => n.kind !== "project");
    };
    return force;
  }

  /** Keeps each group's caption above its members (members are pushed below it). */
  function forceCaptionAbove() {
    let members: Node[] = [];
    const force = () => {
      for (const m of members) {
        const c = byKey.get(`group:${m.group}`)!;
        const minY = c.y! + c.h / 2 + m.h / 2 + 2;
        if (m.y! < minY) {
          const d = minY - m.y!;
          m.y! += d * 0.6;
          c.y! -= d * 0.4;
        }
      }
    };
    force.initialize = (ns: Node[]) => {
      members = ns.filter((n) => n.kind === "skill");
    };
    return force;
  }

  const sim = forceSimulation(nodes)
    .randomSource(seededRandom(11))
    .force(
      "x",
      forceX<Node>((n) => n.tx).strength((n) => (n.kind === "group" ? 0.6 : 0.3)),
    )
    .force(
      "y",
      forceY<Node>((n) => n.ty).strength((n) => (n.kind === "group" ? 0.6 : 0.3)),
    )
    .force(
      "link",
      forceLink<Node, { source: string; target: string }>(links)
        .id((n) => n.key)
        .strength(0.012)
        .distance(120),
    )
    .force("boxes", forceBoxes(6))
    .force("caption", forceCaptionAbove())
    .force("bounds", forceBounds())
    .stop();

  for (let i = 0; i < 800; i++) sim.tick();
  // Final settle: collisions and bounds only, so no two labels overlap.
  sim.force("x", null).force("y", null).force("link", null);
  for (let i = 0; i < 200; i++) sim.tick();

  const r = (v: number) => Math.round(v * 2) / 2;
  return {
    width: W,
    height: H,
    groups: skills.map((g) => {
      const n = byKey.get(`group:${g.group}`)!;
      return { group: g.group, x: r(n.x!), y: r(n.y!) };
    }),
    skills: allSkills.map((s) => {
      const n = byKey.get(s.name)!;
      return { name: s.name, group: s.group, x: r(n.x!), y: r(n.y!) };
    }),
    projects: graphProjects.map((p, i) => ({ id: p.id, x: projectX, y: projectY(i) })),
  } satisfies SkillGraphLayout;
}
