import { Mail } from "lucide-react";
import { navSections } from "@/content/sections";
import { identity } from "@/content/resume";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/icons";
import { MotionToggle } from "./MotionToggle";

const iconLink =
  "inline-flex size-11 items-center justify-center rounded-chip text-muted transition-colors duration-150 hover:text-text";

export function Footer() {
  return (
    <footer className="border-t border-line py-10">
      <div className="container-page flex flex-col gap-8">
        {/* Plain section links: the mobile menu needs JS, this doesn't. */}
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {navSections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="inline-flex min-h-11 min-w-11 items-center text-small text-muted hover:text-text"
                >
                  {s.nav}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-small text-muted">© 2026 {identity.name}</p>
          <div className="flex items-center gap-1">
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
            <MotionToggle className="ml-2" showLabel />
          </div>
        </div>
      </div>
    </footer>
  );
}
