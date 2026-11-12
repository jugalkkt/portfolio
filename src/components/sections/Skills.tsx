import { SectionHeading } from "@/components/ui/SectionHeading";
import { SkillGraph } from "@/components/skills/SkillGraph";
import { SkillList } from "@/components/skills/SkillList";

export function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-title" className="py-[var(--section-pad)]">
      <div className="container-page">
        <SectionHeading id="skills" title="Technical skills" />
        {/* Desktop: graph beside the grouped list. Mobile / reduced motion: the list only. */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          <SkillGraph className="hidden self-start lg:sticky lg:top-28 lg:col-span-8 lg:block motion-reduce:lg:hidden" />
          <div className="lg:col-span-4 motion-reduce:lg:col-span-12">
            <SkillList compact />
          </div>
        </div>
      </div>
    </section>
  );
}
