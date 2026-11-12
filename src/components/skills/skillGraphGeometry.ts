/** Shared by the build-time layout script and the SVG renderer, so boxes match exactly. */
export const GRAPH = {
  width: 760,
  height: 620,
  centre: [290, 300] as [number, number],
  /** Skills stay left of this x; the project column sits to its right. */
  skillsRight: 600,
  projectX: 690,
  projectW: 96,
  projectH: 30,
  fontSize: 11,
  groupFontSize: 9,
};

/** Rough advance widths for an 11 px sans label (Geist); generous so labels never touch. */
function textWidth(text: string, size: number) {
  let w = 0;
  for (const ch of text) {
    if (ch === " ") w += 0.28;
    else if (/[A-Z]/.test(ch)) w += 0.66;
    else if (/[0-9]/.test(ch)) w += 0.6;
    else if (/[a-z]/.test(ch))
      w += /[iljtf]/.test(ch) ? 0.3 : ch === "m" || ch === "w" ? 0.82 : 0.56;
    else w += 0.4;
  }
  return w * size;
}

/** A skill node is a dot followed by its label; (x, y) is the centre of that box. */
export function skillBox(name: string) {
  const w = Math.ceil(14 + textWidth(name, GRAPH.fontSize));
  return { w, h: 18, dotDx: -w / 2 + 5, textDx: -w / 2 + 13 };
}

/** Group captions are mono, uppercase and letter-spaced. */
export function groupLabelBox(group: string) {
  return { w: Math.ceil(group.length * GRAPH.groupFontSize * 0.8), h: 12 };
}
