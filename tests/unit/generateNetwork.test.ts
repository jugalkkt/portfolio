import { describe, expect, it } from "vitest";
import { generateNetwork } from "@/components/three/InferenceNetwork/generateNetwork";
import { seededRandom } from "@/lib/seededRandom";

describe("seededRandom", () => {
  it("is deterministic and in [0, 1)", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("differs between seeds", () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });
});

describe("generateNetwork", () => {
  it("is deterministic for a seed", () => {
    expect(generateNetwork(7)).toEqual(generateNetwork(7));
  });

  it("respects layer sizes and connects adjacent layers fully", () => {
    const net = generateNetwork(1, [6, 10, 12, 10, 6]);
    expect(net.nodes).toHaveLength(44);
    expect(net.edges).toHaveLength(6 * 10 + 10 * 12 + 12 * 10 + 10 * 6);
    for (const e of net.edges) {
      expect(net.nodes[e.to].layer).toBe(net.nodes[e.from].layer + 1);
    }
  });

  it("produces no NaNs", () => {
    const net = generateNetwork(3, [1, 4, 1]);
    const values = [
      ...net.nodes.flatMap((n) => [...n.position, n.bias]),
      ...net.edges.map((e) => e.weight),
    ];
    expect(values.every(Number.isFinite)).toBe(true);
  });
});
