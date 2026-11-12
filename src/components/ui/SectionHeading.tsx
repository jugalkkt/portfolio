import { section, type SectionId } from "@/content/sections";

/** A7: the visible copy "decodes" from random glyphs (lazy-enhanced); the real text is sr-only. */
export function Kicker({ text }: { text: string }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" data-decode>
        {text}
      </span>
    </>
  );
}

type Props = { id: SectionId; title: string; intro?: string };

/** Layer label (mono kicker) + h2. The kicker gets its "decode" effect in Phase 6. */
export function SectionHeading({ id, title, intro }: Props) {
  return (
    <header data-reveal className="mb-12 flex flex-col gap-4 md:mb-16">
      <p data-layer-label className="label flex items-center gap-3 text-signal">
        <span
          aria-hidden="true"
          className="inline-block h-px w-8 bg-gradient-to-r from-signal to-activation"
        />
        <Kicker text={section(id).layer} />
      </p>
      <h2 id={`${id}-title`} className="text-h2">
        {title}
      </h2>
      {intro ? <p className="prose-measure text-muted">{intro}</p> : null}
    </header>
  );
}
