import { navSections } from "./sections";

/** A1 input layer = real skills from the resume (§5 A1). Exactly 6, in slot order. */
export const inputSkills = [
  "Python",
  "LangGraph",
  "LangChain",
  "CrewAI",
  "FastAPI",
  "React",
] as const;

/** A1 output layer = site sections; clicking an output node scrolls there. */
export const outputSections = navSections.map((s) => ({ id: s.id, label: s.nav }));
