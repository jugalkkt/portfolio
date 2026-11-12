import { ArrowUpRight, Mail, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { copy } from "@/content/copy";
import { identity } from "@/content/resume";
import { section } from "@/content/sections";
import { CopyButton } from "@/components/ui/CopyButton";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/icons";

const rowLink =
  "group flex min-h-16 flex-1 items-center gap-4 py-3 transition-colors duration-150 hover:text-signal";

function Row({
  label,
  children,
  action,
}: {
  label: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 border-b border-line">
      <span className="label hidden w-24 shrink-0 sm:block">{label}</span>
      {children}
      {action}
    </li>
  );
}

export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="relative py-[var(--section-pad)]"
    >
      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-5">
          <p className="label flex items-center gap-3 text-signal">
            <span
              aria-hidden="true"
              className="inline-block h-px w-8 bg-gradient-to-r from-signal to-activation"
            />
            {section("contact").layer}
          </p>
          <h2 id="contact-title" className="text-display leading-[1.02] tracking-[-0.03em]">
            {copy.contact.heading}
          </h2>
          <p className="prose-measure text-h3 font-normal text-muted">{copy.contact.line}</p>
        </div>
        <ul className="flex flex-col border-t border-line lg:col-span-7 lg:self-end">
          <Row
            label="Email"
            action={<CopyButton value={identity.email.label} label="Copy email address" />}
          >
            <a href={identity.email.href} className={rowLink}>
              <Mail
                className="size-5 shrink-0 text-muted group-hover:text-signal"
                aria-hidden="true"
              />
              <span className="break-all text-h3 font-normal">{identity.email.label}</span>
            </a>
          </Row>
          <Row label="Phone">
            <a href={identity.phone.href} className={rowLink}>
              <Phone
                className="size-5 shrink-0 text-muted group-hover:text-signal"
                aria-hidden="true"
              />
              <span className="text-h3 font-normal">{identity.phone.label}</span>
            </a>
          </Row>
          <Row label="LinkedIn">
            <ExternalLink href={identity.linkedin.href} className={rowLink}>
              <LinkedInIcon className="size-5 shrink-0 text-muted group-hover:text-signal" />
              <span className="text-h3 font-normal">linkedin.com/in/{identity.linkedin.label}</span>
              <ArrowUpRight className="ml-auto size-4 text-muted" aria-hidden="true" />
            </ExternalLink>
          </Row>
          <Row label="GitHub">
            <ExternalLink href={identity.github.href} className={rowLink}>
              <GitHubIcon className="size-5 shrink-0 text-muted group-hover:text-signal" />
              <span className="text-h3 font-normal">github.com/{identity.github.label}</span>
              <ArrowUpRight className="ml-auto size-4 text-muted" aria-hidden="true" />
            </ExternalLink>
          </Row>
        </ul>
      </div>
    </section>
  );
}
