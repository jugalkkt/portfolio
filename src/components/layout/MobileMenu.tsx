"use client";

import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { navSections } from "@/content/sections";
import { identity } from "@/content/resume";
import { buttonClasses } from "@/components/ui/Button";
import { MotionToggle } from "./MotionToggle";

/** Full-screen sheet; Esc closes, focus is trapped while open and restored on close (§9.2). */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const root = sheet.current;
    const focusables = () =>
      Array.from(root?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
    focusables()[0]?.focus();
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "Tab") {
        const items = focusables();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center rounded-chip border border-line text-text lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
        <span className="sr-only">Open menu</span>
      </button>

      {open ? (
        <div
          ref={sheet}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-50 flex flex-col bg-bg/95 backdrop-blur-md lg:hidden"
        >
          <div className="container-page flex h-16 items-center justify-between">
            <span className="font-mono text-small text-muted">menu</span>
            <button
              type="button"
              onClick={close}
              className="inline-flex size-11 items-center justify-center rounded-chip border border-line text-text"
            >
              <X className="size-5" aria-hidden="true" />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <nav aria-label="Sections" className="container-page flex-1 overflow-y-auto pt-6">
            <ul className="flex flex-col">
              {navSections.map((s) => (
                <li key={s.id} className="border-b border-line">
                  <a
                    href={`#${s.id}`}
                    onClick={() => setOpen(false)}
                    className="flex min-h-14 items-baseline justify-between gap-4 py-3"
                  >
                    <span className="text-h3">{s.nav}</span>
                    <span className="label">{s.layer}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3 pb-10">
              <a href={identity.resumePdfPath} download className={buttonClasses("primary")}>
                Download resume
              </a>
              <MotionToggle showLabel />
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
