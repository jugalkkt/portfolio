export type StatPart = { text: string } | { value: number; decimals: number; raw: string };

/**
 * Splits a stat chip into text and countable numbers. Numbers joined to another number by
 * "–" or "/" without spaces ("1–8", "10/30/60") are ranges or sequences, not quantities,
 * so they stay text. Joining the parts back always reproduces the input exactly.
 */
export function statParts(stat: string): StatPart[] {
  const parts: StatPart[] = [];
  const re = /\d+(?:\.\d+)?/g;
  let last = 0;
  for (let m = re.exec(stat); m; m = re.exec(stat)) {
    const before = stat[m.index - 1];
    const after = stat[m.index + m[0].length];
    const joined =
      ((before === "–" || before === "/") && /\d/.test(stat[m.index - 2] ?? "")) ||
      ((after === "–" || after === "/") && /\d/.test(stat[m.index + m[0].length + 1] ?? ""));
    if (joined) continue;
    if (m.index > last) parts.push({ text: stat.slice(last, m.index) });
    const decimals = m[0].includes(".") ? m[0].split(".")[1].length : 0;
    parts.push({ value: Number(m[0]), decimals, raw: m[0] });
    last = m.index + m[0].length;
  }
  if (last < stat.length) parts.push({ text: stat.slice(last) });
  return parts;
}

export const joinParts = (parts: StatPart[]) =>
  parts.map((p) => ("text" in p ? p.text : p.raw)).join("");
export const countable = (parts: StatPart[]) => parts.some((p) => "value" in p && p.value !== 0);
