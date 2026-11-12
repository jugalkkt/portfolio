"use client";

import { useEffect, useState } from "react";
import { navSections } from "@/content/sections";
import { identity } from "@/content/resume";
import { buttonClasses } from "@/components/ui/Button";
import { clsx } from "clsx";
import { MobileMenu } from "./MobileMenu";
import { MotionToggle } from "./MotionToggle";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color] duration-300 ease-out",
        scrolled ? "border-line bg-bg/75 backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <a
          href="#top"
          className="inline-flex min-h-11 items-center font-mono text-base font-medium tracking-tight"
        >
          <span aria-hidden="true">
            J<span className="text-signal">K</span>
          </span>
          <span className="sr-only">{identity.name} — back to top</span>
        </a>

        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navSections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="inline-flex min-h-11 items-center px-3 text-small text-muted transition-colors duration-150 hover:text-text"
                >
                  {s.nav}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <MotionToggle display="hidden lg:inline-flex" />
          <a
            href={identity.resumePdfPath}
            download
            className={buttonClasses("secondary", "hidden sm:inline-flex")}
          >
            Resume
          </a>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
