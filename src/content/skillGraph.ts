import { skills } from "./resume";

/** The three project nodes on the side of the A5 graph. */
export const graphProjects = [
  { id: "sherpa", name: "Sherpa" },
  { id: "pathfinder", name: "Pathfinder" },
  { id: "shrinx", name: "Shrinx" },
] as const;

export type GraphProjectId = (typeof graphProjects)[number]["id"];

/**
 * Skill ↔ project edges — exactly plan §5 A5, from the resume text. Tools named only inside
 * project bullets (Ollama, MCP, Groq, SQLite, bcrypt) are tech tags, not skill nodes.
 */
export const skillProjectEdges: Record<GraphProjectId, string[]> = {
  sherpa: ["LangGraph", "Streamlit", "DeepEval", "Python"],
  pathfinder: ["LangGraph", "Streamlit", "Python"],
  shrinx: ["FastAPI", "MongoDB", "Jinja2", "JWT Authentication", "Python"],
};

/** Clusters drawn at the centre of the projection; the rest orbit around them. */
export const coreGroups = ["Agentic AI", "Observability", "Testing & Debugging"];

export const skillSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\+/g, "p")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function projectsForSkill(skill: string): GraphProjectId[] {
  return graphProjects.filter((p) => skillProjectEdges[p.id].includes(skill)).map((p) => p.id);
}

export const allSkills = skills.flatMap((g) => g.items.map((name) => ({ name, group: g.group })));

/** Shape of src/content/skillGraph.generated.json (written by scripts/build-skill-graph.ts). */
export type SkillGraphLayout = {
  width: number;
  height: number;
  groups: { group: string; x: number; y: number }[];
  skills: { name: string; group: string; x: number; y: number }[];
  projects: { id: GraphProjectId; x: number; y: number }[];
};
