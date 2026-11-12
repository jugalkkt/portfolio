import { describe, expect, it } from "vitest";
import { SOFTWARE_GL, lowerTier, pickTier, type DeviceInfo } from "@/lib/capabilities";

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
  it("static on software WebGL", () =>
    expect(pickTier({ ...desktop, softwareGl: true })).toBe("static"));
  it("recognises CPU renderers", () => {
    for (const r of [
      "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)",
      "llvmpipe (LLVM 15.0.7, 256 bits)",
      "ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0)",
    ])
      expect(SOFTWARE_GL.test(r)).toBe(true);
    expect(
      SOFTWARE_GL.test("ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)"),
    ).toBe(false);
    expect(SOFTWARE_GL.test("Apple GPU")).toBe(false);
  });
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
