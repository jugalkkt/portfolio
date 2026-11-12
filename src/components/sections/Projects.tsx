import { projects } from "@/content/resume";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectPanel } from "@/components/project/ProjectPanel";
import { ProjectsEnhancer } from "@/components/project/ProjectsEnhancer";

export function Projects() {
  return (
    <section id="projects" aria-labelledby="projects-title" className="py-[var(--section-pad)]">
      <div className="container-page">
        <SectionHeading id="projects" title="Featured projects" />
        <ProjectsEnhancer>
          <div className="flex flex-col gap-10 lg:gap-14">
            {projects.map((p, i) => (
              <ProjectPanel key={p.id} project={p} index={i} featured={i === 0} />
            ))}
          </div>
        </ProjectsEnhancer>
      </div>
    </section>
  );
}
