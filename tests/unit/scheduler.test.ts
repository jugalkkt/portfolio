import { describe, expect, it } from "vitest";
import { generateNetwork } from "@/components/three/InferenceNetwork/generateNetwork";
import {
  createPassBuffers,
  FAR_PAST,
  firePass,
} from "@/components/three/InferenceNetwork/scheduler";
import { inputSkills, outputSections } from "@/content/heroNetwork";
import { skills } from "@/content/resume";

const opts = { hop: 0.5, threshold: 0.3 };

describe("firePass", () => {
  it("lights a sparse sub-graph, layer by layer", () => {
    const net = generateNetwork();
    const buf = createPassBuffers(net);
    const active = firePass(buf, net, [1, 1, 1, 1, 1, 1], 10, opts);
    expect(active).toBeGreaterThan(0);
    expect(active).toBeLessThan(net.edges.length);
    net.edges.forEach((e, k) => {
      if (buf.edgeAmp[k] > 0)
        expect(buf.edgeStart[k]).toBeCloseTo(10 + net.nodes[e.from].layer * 0.5);
    });
  });

  it("only propagates from active inputs", () => {
    const net = generateNetwork();
    const buf = createPassBuffers(net);
    firePass(buf, net, [1, 0, 0, 0, 0, 0], 0, opts);
    net.edges.forEach((e, k) => {
      const from = net.nodes[e.from];
      if (from.layer === 0 && from.slot !== 0) expect(buf.edgeAmp[k]).toBe(0);
    });
    expect(buf.nodeArrive[1]).toBe(FAR_PAST);
  });

  it("pulses arrive at a node no earlier than it is lit", () => {
    const net = generateNetwork();
    const buf = createPassBuffers(net);
    firePass(buf, net, [1, 0.6, 0.9, 0.2, 0.8, 0.5], 0, opts);
    net.edges.forEach((e, k) => {
      if (buf.edgeAmp[k] > 0) expect(buf.nodeArrive[e.to]).toBeCloseTo(buf.edgeStart[k] + 0.5);
    });
  });
});

describe("hero network labels", () => {
  it("input nodes are real resume skills, output nodes are the six sections", () => {
    const all = skills.flatMap((g) => g.items);
    expect(inputSkills).toHaveLength(6);
    for (const s of inputSkills) expect(all).toContain(s);
    expect(outputSections.map((s) => s.id)).toEqual([
      "about",
      "projects",
      "skills",
      "experience",
      "education",
      "contact",
    ]);
  });
});
