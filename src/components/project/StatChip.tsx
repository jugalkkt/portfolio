import { statParts } from "@/lib/statParts";

/**
 * The full value is in an sr-only span; the visible copy is split so the lazy enhancer
 * can count numbers up from 0 on first view. Without JS it simply shows the final value.
 */
export function StatChip({ value }: { value: string }) {
  const parts = statParts(value);
  return (
    <li
      data-stat
      className="rounded-chip border border-line bg-bg-inset px-3 py-1.5 font-mono text-small text-text tabular-nums"
    >
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        {parts.map((p, i) =>
          "text" in p ? (
            <span key={i}>{p.text}</span>
          ) : (
            <span key={i} data-stat-num={p.value} data-decimals={p.decimals}>
              {p.raw}
            </span>
          ),
        )}
      </span>
    </li>
  );
}
