import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/content/resume";
import { pipelines } from "@/content/pipelines";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { PipelineGraph } from "./PipelineGraph";
import { StatChip } from "./StatChip";
import { TechTag } from "./TechTag";

type Props = { project: Project; index: number; featured?: boolean };

function Links({ project }: { project: Project }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <ButtonLink
          href={project.live.href}
          external
          variant="primary"
          aria-label={`${project.name} live demo`}
        >
          <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-ok" />
          Live
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </ButtonLink>
        <ButtonLink href={project.code.href} external aria-label={`${project.name} source code`}>
          Code
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </ButtonLink>
      </div>
      {project.note ? <p className="text-small text-muted">{project.note}</p> : null}
    </div>
  );
}

function Details({ project }: { project: Project }) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      <ul className="flex flex-col gap-4 lg:col-span-7">
        {project.bullets.map((b) => (
          <li key={b} className="relative pl-5 text-muted">
            <span
              aria-hidden="true"
              className="absolute left-0 top-[0.7em] size-1.5 rounded-full bg-signal/70"
            />
            {b}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-6 lg:col-span-5">
        <div className="flex flex-col gap-3">
          <h4 className="label">Key figures</h4>
          <ul className="flex flex-wrap gap-2">
            {project.stats.map((s) => (
              <StatChip key={s} value={s} />
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="label">Stack</h4>
          <ul className="flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <TechTag key={t} name={t} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function ProjectPanel({ project, index, featured }: Props) {
  const pipeline = pipelines[project.id];
  const flip = index % 2 === 1;
  const number = String(index + 1).padStart(2, "0");

  const heading = (
    <header className="flex flex-col gap-2">
      <p className="label">
        {number} · {project.id === "shrinx" ? "full-stack" : "agentic ai"}
      </p>
      <h3 id={`project-${project.id}`} className="text-h2">
        {project.name}
      </h3>
      <p className="text-h3 font-normal text-muted">{project.subtitle}</p>
    </header>
  );

  return (
    <article
      aria-labelledby={`project-${project.id}`}
      data-glow
      data-reveal
      className="glow-card rounded-panel border border-line bg-bg-raised/80 p-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] sm:p-8 lg:p-10"
    >
      {featured ? (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            {heading}
            <Links project={project} />
          </div>
          <PipelineGraph pipeline={pipeline} />
          <Details project={project} />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-10">
            <div className={cn("flex flex-col gap-6 lg:col-span-4", flip && "lg:order-2")}>
              {heading}
              <Links project={project} />
            </div>
            <div className={cn("lg:col-span-8", flip && "lg:order-1")}>
              <PipelineGraph pipeline={pipeline} />
            </div>
          </div>
          <Details project={project} />
        </div>
      )}
    </article>
  );
}
