import { forwardPass, type Network } from "./generateNetwork";

/**
 * Per-node / per-edge timing buffers read by the shaders. A pass writes them once;
 * the GPU animates everything else from `uTime`, so there's no per-frame CPU work.
 */
export type PassBuffers = {
  /** Time the signal reaches each node (−∞ ⇒ never). */
  nodeArrive: Float32Array;
  nodeAct: Float32Array;
  /** Time a pulse departs along each edge, and its brightness (0 ⇒ no visible pulse). */
  edgeStart: Float32Array;
  edgeAmp: Float32Array;
};

export type PassOptions = {
  /** Seconds for a pulse to cross one layer gap. */
  hop: number;
  /** Only edges with |w_ij| · a_i above this carry a visible pulse. */
  threshold: number;
  /** Brightness multiplier (click-to-infer is brighter). */
  boost?: number;
};

export const FAR_PAST = -1e4;

export function createPassBuffers(net: Network): PassBuffers {
  return {
    nodeArrive: new Float32Array(net.nodes.length).fill(FAR_PAST),
    nodeAct: new Float32Array(net.nodes.length),
    edgeStart: new Float32Array(net.edges.length).fill(FAR_PAST),
    edgeAmp: new Float32Array(net.edges.length),
  };
}

/** Schedules one forward pass starting at `t0`; returns the number of visible edges. */
export function firePass(
  buffers: PassBuffers,
  net: Network,
  inputs: ArrayLike<number>,
  t0: number,
  { hop, threshold, boost = 1 }: PassOptions,
): number {
  const act = forwardPass(net, inputs);
  const lit = new Uint8Array(net.nodes.length);
  for (const n of net.nodes) if (n.layer === 0 && act[n.index] > 0.05) lit[n.index] = 1;

  let active = 0;
  net.edges.forEach((e, k) => {
    const strength = Math.abs(e.weight) * act[e.from];
    if (lit[e.from] && strength > threshold) {
      buffers.edgeStart[k] = t0 + net.nodes[e.from].layer * hop;
      buffers.edgeAmp[k] = Math.min(1, strength * boost);
      lit[e.to] = 1;
      active++;
    } else if (buffers.edgeStart[k] + hop * 4 < t0) {
      buffers.edgeAmp[k] = 0;
    }
  });

  for (const n of net.nodes) {
    if (!lit[n.index]) continue;
    buffers.nodeArrive[n.index] = t0 + n.layer * hop;
    buffers.nodeAct[n.index] = Math.min(1, act[n.index] * boost);
  }
  return active;
}
