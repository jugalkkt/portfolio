import { generateNetwork, type Network } from "@/components/three/InferenceNetwork/generateNetwork";

export type PosterNode = { x: number; y: number; r: number; glow: number; depth: number };
export type PosterEdge = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
  strength: number;
};

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** One frozen forward pass: a_j = σ(Σ w_ij a_i + b_j), layer by layer. */
export function forwardPass(net: Network, inputs: number[]): number[] {
  const act = new Array<number>(net.nodes.length).fill(0);
  net.nodes.filter((n) => n.layer === 0).forEach((n, i) => (act[n.index] = inputs[i] ?? 0));
  for (let l = 1; l < net.layerSizes.length; l++) {
    for (const node of net.nodes.filter((n) => n.layer === l)) {
      const sum = net.edges
        .filter((e) => e.to === node.index)
        .reduce((s, e) => s + e.weight * act[e.from], 0);
      act[node.index] = sigmoid(2.2 * (sum + node.bias));
    }
  }
  return act;
}

/** Projects the seeded network to 2D (slight y-rotation + perspective) with one pass highlighted. */
export function buildPoster(width = 800, height = 600) {
  const net = generateNetwork();
  const act = forwardPass(net, [1, 0.25, 0.9, 0.1, 0.75, 0.4]);
  const theta = -0.5;
  const scale = 112;
  const camera = 9;

  const projected = net.nodes.map((n) => {
    const [x, y, z] = n.position;
    const xr = x * Math.cos(theta) + z * Math.sin(theta);
    const zr = -x * Math.sin(theta) + z * Math.cos(theta);
    const f = camera / (camera + zr);
    return { x: width / 2 + xr * scale * f, y: height / 2 - y * scale * f, f, zr };
  });

  const edges: PosterEdge[] = net.edges.map((e) => {
    const a = projected[e.from];
    const b = projected[e.to];
    const strength = Math.abs(e.weight) * act[e.from];
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, strength, active: strength > 0.62 };
  });

  const nodes: PosterNode[] = projected.map((p, i) => ({
    x: p.x,
    y: p.y,
    r: 4.2 * p.f,
    depth: p.zr,
    glow: act[i],
  }));

  return { width, height, nodes, edges };
}
