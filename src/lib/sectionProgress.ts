/**
 * Continuous position through the section stack, measured at the viewport's middle:
 * `index` is the section whose top has passed that line, `position` adds the fraction
 * travelled toward the next section (so 2.5 = halfway from section 2 to section 3).
 */
export function sectionPosition(
  tops: number[],
  probe: number,
): { index: number; position: number } {
  if (!tops.length) return { index: 0, position: 0 };
  let i = 0;
  while (i + 1 < tops.length && tops[i + 1] <= probe) i++;
  if (i === tops.length - 1 || probe < tops[0])
    return { index: i, position: probe < tops[0] ? 0 : i };
  const frac = (probe - tops[i]) / Math.max(tops[i + 1] - tops[i], 1);
  return { index: i, position: i + Math.min(Math.max(frac, 0), 1) };
}
