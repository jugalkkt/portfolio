import { ArrowDown, Download, Mail } from "lucide-react";
import { copy } from "@/content/copy";
import { identity } from "@/content/resume";
import { ButtonLink } from "@/components/ui/Button";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/icons";
import { HeroPoster } from "@/components/hero/HeroPoster";
import { HeroVisual } from "@/components/hero/HeroVisual";

const iconLink =
  "inline-flex size-11 items-center justify-center rounded-chip border border-line text-muted transition-colors duration-150 hover:border-signal hover:text-text";

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh items-center overflow-hidden pt-16"
    >
      {/* A1 Live Inference Network; the static SVG poster is its fallback and placeholder. */}
      <HeroVisual
        className="absolute inset-0 -z-10 opacity-40 lg:left-[38%] lg:right-16 lg:opacity-100 xl:right-20"
        poster={<HeroPoster className="h-full max-h-[760px] w-full max-w-[1040px]" />}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden bg-[radial-gradient(ellipse_at_20%_50%,var(--bg)_25%,transparent_70%)] lg:block"
      />

      <div className="container-page grid grid-cols-1 py-16 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <p className="font-mono text-small text-signal">{copy.hero.kicker}</p>
          <div className="flex flex-col gap-4">
            <h1 id="hero-title" className="text-display leading-[1.02] tracking-[-0.03em]">
              {identity.name}
            </h1>
            <span
              aria-hidden="true"
              className="block h-px w-24 bg-gradient-to-r from-signal to-activation"
            />
            <p className="text-h3 font-medium text-text">{identity.headline}</p>
          </div>
          <p className="prose-measure text-h3 font-normal text-muted">{copy.hero.tagline}</p>
          <p className="prose-measure text-muted">{copy.hero.subLine}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <ButtonLink href="#projects" variant="primary">
              View projects
            </ButtonLink>
            <ButtonLink href={identity.resumePdfPath} download>
              <Download className="size-4" aria-hidden="true" />
              Download resume
            </ButtonLink>
            <div className="flex items-center gap-2">
              <ExternalLink href={identity.github.href} className={iconLink}>
                <GitHubIcon className="size-5" />
                <span className="sr-only">GitHub</span>
              </ExternalLink>
              <ExternalLink href={identity.linkedin.href} className={iconLink}>
                <LinkedInIcon className="size-5" />
                <span className="sr-only">LinkedIn</span>
              </ExternalLink>
              <a href={identity.email.href} className={iconLink}>
                <Mail className="size-5" aria-hidden="true" />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <a
        href="#about"
        className="absolute bottom-6 left-1/2 inline-flex size-11 -translate-x-1/2 items-center justify-center text-faint hover:text-text"
      >
        <ArrowDown className="size-5" aria-hidden="true" />
        <span className="sr-only">Scroll to About</span>
      </a>
    </section>
  );
}
