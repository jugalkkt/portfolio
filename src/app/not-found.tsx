import type { Metadata } from "next";
import { navSections } from "@/content/sections";
import { buttonClasses } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found — Jugal Kakkat",
  robots: { index: false },
};

/** Static 404 (exported as 404.html). Styled as a model output that returned no result. */
export default function NotFound() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="container-page flex min-h-svh flex-col justify-center gap-6 py-16 outline-none"
    >
      <p className="label flex items-center gap-3 text-signal">
        <span
          aria-hidden="true"
          className="inline-block h-px w-8 bg-gradient-to-r from-signal to-activation"
        />
        404 · NO OUTPUT
      </p>
      <h1 className="text-display leading-[1.02] tracking-[-0.03em]">Page not found.</h1>
      <p className="prose-measure text-h3 font-normal text-muted">
        This route has no node in the network. Try one of these layers instead.
      </p>
      <div className="flex flex-wrap gap-3">
        {/* A full page load is right here, and next/link would add ~3 KB to every page. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className={buttonClasses("primary")}>
          Back to home
        </a>
        {navSections.map((s) => (
          <a key={s.id} href={`/#${s.id}`} className={buttonClasses("ghost")}>
            {s.nav}
          </a>
        ))}
      </div>
    </main>
  );
}
