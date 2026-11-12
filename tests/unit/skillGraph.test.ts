import { describe, expect, it } from "vitest";
import layout from "@/content/skillGraph.generated.json";
import { skills } from "@/content/resume";
import { allSkills, projectsForSkill, skillProjectEdges } from "@/content/skillGraph";
import { GRAPH, groupLabelBox, skillBox } from "@/components/skills/skillGraphGeometry";
import { computeSkillGraph } from "../../scripts/skillGraphLayout";

type Box = { name: string; x: number; y: number; w: number; h: number };

describe("A5 skill graph", () => {
  it("links skills to projects exactly as plan §5 A5", () => {
    expect(skillProjectEdges).toEqual({
      sherpa: ["LangGraph", "Streamlit", "DeepEval", "Python"],
      pathfinder: ["LangGraph", "Streamlit", "Python"],
      shrinx: ["FastAPI", "MongoDB", "Jinja2", "JWT Authentication", "Python"],
    });
    expect(projectsForSkill("Python")).toEqual(["sherpa", "pathfinder", "shrinx"]);
    expect(projectsForSkill("LangChain")).toEqual([]);
    const names = new Set(allSkills.map((s) => s.name));
    for (const list of Object.values(skillProjectEdges))
      for (const s of list) expect(names.has(s)).toBe(true);
  });

  it("has one node per resume skill and one caption per group, nothing invented", () => {
    expect(layout.skills.map((s) => [s.name, s.group])).toEqual(
      skills.flatMap((g) => g.items.map((i) => [i, g.group])),
    );
    expect(layout.groups.map((g) => g.group)).toEqual(skills.map((g) => g.group));
  });

  it("is up to date with the layout script (deterministic)", () => {
    expect(computeSkillGraph()).toEqual(layout);
  });

  it("keeps every label inside the skills area with no overlaps", () => {
    const boxes: Box[] = [
      ...layout.skills.map((s) => ({ name: s.name, x: s.x, y: s.y, ...skillBox(s.name) })),
      ...layout.groups.map((g) => ({ name: g.group, x: g.x, y: g.y, ...groupLabelBox(g.group) })),
    ];
    for (const b of boxes) {
      expect(b.x - b.w / 2).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w / 2).toBeLessThanOrEqual(GRAPH.skillsRight + 0.5);
      expect(b.y - b.h / 2).toBeGreaterThanOrEqual(0);
      expect(b.y + b.h / 2).toBeLessThanOrEqual(GRAPH.height);
    }
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const apart =
          Math.abs(a.x - b.x) >= (a.w + b.w) / 2 || Math.abs(a.y - b.y) >= (a.h + b.h) / 2;
        expect(apart, `${a.name} overlaps ${b.name}`).toBe(true);
      }
  });
});
