import { copy } from "@/content/copy";
import { identity } from "@/content/resume";

/** Phase 0 placeholder — verifies fonts, tokens and content wiring. Sections arrive in Phase 1. */
export default function Home() {
  return (
    <main id="main" className="container-page flex min-h-svh flex-col justify-center gap-6">
      <p className="font-mono text-small text-signal">{copy.hero.kicker}</p>
      <h1 className="text-display tracking-[-0.03em]">{identity.name}</h1>
      <p className="text-h3 text-muted">{identity.headline}</p>
      <p className="prose-measure text-muted">{copy.hero.tagline}</p>
      <p className="label">Scaffold · phase 0</p>
    </main>
  );
}
