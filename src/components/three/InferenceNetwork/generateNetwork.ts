import { seededRandom } from "@/lib/seededRandom";

export type NetworkNode = {
  /** Index into `nodes`. */
  index: number;
  layer: number;
  /** Index within its layer. */
  slot: number;
  position: [number, number, number];
  bias: number;
};

export type NetworkEdge = {
  from: number;
  to: number;
  weight: number;
};

export type Network = {
  layerSizes: number[];
  nodes: NetworkNode[];
  edges: NetworkEdge[];
};

export const DEFAULT_SEED = 20260;
export const DEFAULT_LAYERS = [6, 10, 12, 10, 6];

/**
 * Pure, seeded network layout: layers along x, nodes spread on y with jitter on y/z.
 * Fully connected between adjacent layers; weights in [-1, 1], biases in [-0.5, 0.5].
 */
export function generateNetwork(seed = DEFAULT_SEED, layerSizes = DEFAULT_LAYERS): Network {
  const rand = seededRandom(seed);
  const span = (v: number) => (rand() * 2 - 1) * v;

  const layerGap = 1.6;
  const width = (layerSizes.length - 1) * layerGap;
  const nodes: NetworkNode[] = [];
  const layerStart: number[] = [];

  layerSizes.forEach((size, layer) => {
    layerStart.push(nodes.length);
    const height = 0.42 * Math.max(size - 1, 0);
    for (let slot = 0; slot < size; slot++) {
      const y = size === 1 ? 0 : height / 2 - (slot / (size - 1)) * height;
      nodes.push({
        index: nodes.length,
        layer,
        slot,
        position: [layer * layerGap - width / 2 + span(0.08), y + span(0.1), span(0.9)],
        bias: span(0.5),
      });
    }
  });

  const edges: NetworkEdge[] = [];
  for (let l = 0; l < layerSizes.length - 1; l++) {
    for (let i = 0; i < layerSizes[l]; i++) {
      for (let j = 0; j < layerSizes[l + 1]; j++) {
        edges.push({ from: layerStart[l] + i, to: layerStart[l + 1] + j, weight: span(1) });
      }
    }
  }

  return { layerSizes: [...layerSizes], nodes, edges };
}
