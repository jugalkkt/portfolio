import { copy } from "@/content/copy";
import { education, identity, skills } from "@/content/resume";
import { SectionHeading } from "@/components/ui/SectionHeading";

const group = (name: string) => skills.find((s) => s.group === name)?.items ?? [];

/** Every value comes from resume.ts, except `status`, which is approved copy. */
function modelCard(): [string, string][] {
  const edu = education[0];
  return [
    ["name", identity.name],
    ["role", identity.headline],
    ["education", `B.Tech CSE · IIIT Kottayam · ${edu.dates}`],
    ["stack", [...group("Agentic AI"), "FastAPI", "React"].join(" · ")],
    ["testing", group("Testing & Debugging").join(" · ")],
    ["observ.", group("Observability").join(" · ")],
    ["status", copy.modelCard.status],
  ];
}

export function About() {
  const portrait = copy.portrait;
  return (
    <section id="about" aria-labelledby="about-title" className="py-[var(--section-pad)]">
      <div className="container-page">
        <SectionHeading id="about" title="About" />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-8 lg:col-span-6">
            {portrait ? (
              // eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized asset
              <img
                src={portrait.src}
                alt={portrait.alt}
                width={portrait.width}
                height={portrait.height}
                className="aspect-[4/5] w-48 rounded-card border border-line object-cover"
              />
            ) : null}
            <p className="prose-measure text-[1.1875rem] leading-[1.7] text-text">{copy.about}</p>
          </div>
          <figure className="lg:col-span-6">
            <figcaption className="label mb-3">model_card.yaml</figcaption>
            <dl className="overflow-x-auto rounded-card border border-line bg-bg-inset p-5 font-mono text-small leading-7 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] md:p-6">
              {modelCard().map(([k, v]) => (
                <div
                  key={k}
                  className="grid grid-cols-[6.5rem_1fr] gap-x-3 sm:grid-cols-[7.5rem_1fr]"
                >
                  <dt className="text-muted">{k}:</dt>
                  <dd className={k === "status" ? "flex items-center gap-2 text-ok" : "text-text"}>
                    {k === "status" ? (
                      <span
                        aria-hidden="true"
                        className="inline-block size-1.5 rounded-full bg-ok"
                      />
                    ) : null}
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </figure>
        </div>
      </div>
    </section>
  );
}
