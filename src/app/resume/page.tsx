import type { Metadata } from "next";
import { identity } from "@/content/resume";

export const metadata: Metadata = {
  title: `Résumé — ${identity.name}`,
  robots: { index: false, follow: true },
  alternates: { canonical: identity.resumePdfPath },
};

/** /resume → the PDF. Static export has no server redirects, so this is a meta refresh. */
export default function ResumeRedirect() {
  return (
    <main id="main" className="container-page flex min-h-svh flex-col justify-center gap-4">
      <meta httpEquiv="refresh" content={`0; url=${identity.resumePdfPath}`} />
      <p className="label text-signal">Redirecting</p>
      <p className="text-h3">
        Opening the résumé…{" "}
        <a href={identity.resumePdfPath} className="text-signal underline underline-offset-4">
          Download {identity.name}’s résumé (PDF)
        </a>
      </p>
    </main>
  );
}
