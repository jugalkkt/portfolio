/**
 * Writes the A5 layout to src/content/skillGraph.generated.json. No simulation runs in the
 * browser. Run with: npm run build:skill-graph
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeSkillGraph } from "./skillGraphLayout";

const layout = computeSkillGraph();
const out = resolve(import.meta.dirname, "../src/content/skillGraph.generated.json");
writeFileSync(out, JSON.stringify(layout, null, 2) + "\n");
console.log(`wrote ${layout.skills.length} skills, ${layout.groups.length} groups → ${out}`);
