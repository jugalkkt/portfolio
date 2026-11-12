import { ArrowUpRight } from "lucide-react";
import { certifications, education } from "@/content/resume";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { ExternalLink } from "@/components/ui/ExternalLink";

export function Education() {
  return (
    <section id="education" aria-labelledby="education-title" className="py-[var(--section-pad)]">
      <div className="container-page">
        <SectionHeading id="education" title="Education & certifications" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <h3 className="label mb-6">Education</h3>
            <ul className="flex flex-col gap-6">
              {education.map((e) => (
                <li key={e.qualification}>
                  <p className="label mb-2 text-muted">{e.dates}</p>
                  <p className="text-h3">{e.qualification}</p>
                  <p className="mt-1 text-muted">{e.institution}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="label mb-6">Certifications</h3>
            <ul className="flex flex-col divide-y divide-line">
              {certifications.map((c) => (
                <li key={c.name}>
                  <ExternalLink
                    href={c.href}
                    className="group flex min-h-14 items-center justify-between gap-4 py-3 transition-colors hover:text-signal"
                  >
                    <span>{c.name}</span>
                    <ArrowUpRight
                      className="size-4 shrink-0 text-muted group-hover:text-signal"
                      aria-hidden="true"
                    />
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}
