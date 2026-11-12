import { describe, expect, it } from "vitest";
import { forwardPass, generateNetwork } from "@/components/three/InferenceNetwork/generateNetwork";
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

describe("forwardPass", () => {
  it("keeps inputs, outputs in (0,1), and is deterministic", () => {
    const net = generateNetwork(5);
    const inputs = [1, 0, 0.5, 0.2, 0.9, 0.1];
    const a = forwardPass(net, inputs);
    const b = forwardPass(net, inputs);
    expect(Array.from(a)).toEqual(Array.from(b));
    net.nodes.forEach((n) => {
      if (n.layer === 0) expect(a[n.index]).toBeCloseTo(inputs[n.slot]);
      else {
        expect(a[n.index]).toBeGreaterThan(0);
        expect(a[n.index]).toBeLessThan(1);
      }
    });
  });

  it("matches the textbook definition for a hidden node", () => {
    const net = generateNetwork(9, [2, 1]);
    const a = forwardPass(net, [1, 0.5], 1);
    const [e0, e1] = net.edges;
    const expected = 1 / (1 + Math.exp(-(e0.weight * 1 + e1.weight * 0.5 + net.nodes[2].bias)));
    expect(a[2]).toBeCloseTo(expected, 5);
  });
});
