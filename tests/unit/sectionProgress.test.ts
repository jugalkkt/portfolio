import { describe, expect, it } from "vitest";
import { sectionPosition } from "@/lib/sectionProgress";

const tops = [0, 1000, 1500, 3000];

describe("sectionPosition", () => {
  it("starts at the first section", () =>
    expect(sectionPosition(tops, 0)).toEqual({ index: 0, position: 0 }));
  it("interpolates between section tops", () => {
    expect(sectionPosition(tops, 500)).toEqual({ index: 0, position: 0.5 });
    expect(sectionPosition(tops, 1250)).toEqual({ index: 1, position: 1.5 });
  });
  it("snaps to a section exactly at its top", () =>
    expect(sectionPosition(tops, 1500).index).toBe(2));
  it("clamps at the last section", () =>
    expect(sectionPosition(tops, 9999)).toEqual({ index: 3, position: 3 }));
  it("handles an empty list", () =>
    expect(sectionPosition([], 10)).toEqual({ index: 0, position: 0 }));
});
