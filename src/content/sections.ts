/** Site structure (§3): order, anchors, nav labels and neural "layer" labels. */
export type SectionId =
  "top" | "about" | "projects" | "skills" | "experience" | "education" | "contact";

export type SectionMeta = {
  id: SectionId;
  nav: string;
  layer: string;
};

export const sections: SectionMeta[] = [
  { id: "top", nav: "Home", layer: "INPUT" },
  { id: "about", nav: "About", layer: "L1 · ABOUT" },
  { id: "projects", nav: "Projects", layer: "L2 · PROJECTS" },
  { id: "skills", nav: "Skills", layer: "L3 · SKILLS" },
  { id: "experience", nav: "Experience", layer: "L4 · EXPERIENCE" },
  { id: "education", nav: "Education", layer: "L5 · EDUCATION" },
  { id: "contact", nav: "Contact", layer: "OUTPUT" },
];

/** Sections shown as links in the header / menu (everything after the hero). */
export const navSections = sections.filter((s) => s.id !== "top");

export function section(id: SectionId): SectionMeta {
  const found = sections.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown section ${id}`);
  return found;
}
