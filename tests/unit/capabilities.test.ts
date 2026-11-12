import { describe, expect, it } from "vitest";
import { lowerTier, pickTier, type DeviceInfo } from "@/lib/capabilities";

const desktop: DeviceInfo = {
  webgl2: true,
  deviceMemory: 8,
  cores: 8,
  coarsePointer: false,
  viewportWidth: 1440,
};

describe("pickTier", () => {
  it("high on a capable desktop", () => expect(pickTier(desktop)).toBe("high"));
  it("static without WebGL2", () => expect(pickTier({ ...desktop, webgl2: false })).toBe("static"));
  it("low on touch / phones / tiny memory", () => {
    expect(pickTier({ ...desktop, coarsePointer: true })).toBe("low");
    expect(pickTier({ ...desktop, viewportWidth: 390 })).toBe("low");
    expect(pickTier({ ...desktop, deviceMemory: 2 })).toBe("low");
  });
  it("medium on tablets and modest machines", () => {
    expect(pickTier({ ...desktop, viewportWidth: 800 })).toBe("medium");
    expect(pickTier({ ...desktop, cores: 4 })).toBe("medium");
  });
  it("unknown memory/cores does not downgrade", () =>
    expect(pickTier({ ...desktop, deviceMemory: undefined, cores: undefined })).toBe("high"));
});

describe("lowerTier", () => {
  it("steps down and bottoms out at static", () => {
    expect(lowerTier("high")).toBe("medium");
    expect(lowerTier("low")).toBe("static");
    expect(lowerTier("static")).toBe("static");
  });
});
