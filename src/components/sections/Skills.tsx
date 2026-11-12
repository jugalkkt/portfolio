import { SectionHeading } from "@/components/ui/SectionHeading";
import { SkillList } from "@/components/skills/SkillList";

export function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-title" className="py-[var(--section-pad)]">
      <div className="container-page">
        <SectionHeading id="skills" title="Technical skills" />
        <SkillList />
      </div>
    </section>
  );
}
