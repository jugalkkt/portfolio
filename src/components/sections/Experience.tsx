import { ArrowUpRight } from "lucide-react";
import { experience, leadership } from "@/content/resume";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ExternalLink } from "@/components/ui/ExternalLink";

function Entry({ dates, children }: { dates: string; children: React.ReactNode }) {
  return (
    <li className="relative pb-12 pl-8 last:pb-0 md:pl-12">
      <span
        aria-hidden="true"
        className="absolute left-[-5px] top-2 size-[11px] rounded-full border border-signal bg-bg"
      />
      <p className="label mb-2">{dates}</p>
      {children}
    </li>
  );
}

/** Most recent first. The internship shows role, company, dates and certificate only. */
export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="py-[var(--section-pad)]">
      <div className="container-page">
        <SectionHeading id="experience" title="Leadership & experience" />
        {/* A6 signal-trace fill lands on this line in Phase 6. */}
        <ol className="relative ml-[5px] max-w-3xl border-l border-line">
          {leadership.map((l) => (
            <Entry key={l.role} dates={l.dates}>
              <h3 className="text-h3">
                {l.role} <span className="text-muted">— {l.organisation}</span>
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {l.bullets.map((b) => (
                  <li key={b} className="relative pl-5 text-muted">
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-[0.7em] size-1.5 rounded-full bg-activation/80"
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </Entry>
          ))}
          {experience.map((e) => (
            <Entry key={e.role} dates={e.dates}>
              <h3 className="text-h3">
                {e.role} <span className="text-muted">· {e.company}</span>
              </h3>
              <ExternalLink
                href={e.certificate.href}
                className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-signal underline-offset-4 hover:underline"
              >
                {e.certificate.label}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </ExternalLink>
            </Entry>
          ))}
        </ol>
      </div>
    </section>
  );
}
