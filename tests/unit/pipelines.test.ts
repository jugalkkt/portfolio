import { describe, expect, it } from "vitest";
import { pipelines, type Layout } from "@/content/pipelines";
import { projects } from "@/content/resume";
import { edgePoints, nodeBox } from "@/components/project/pipelineGeometry";

const layouts: Layout[] = ["desktop", "mobile"];

describe("pipelines", () => {
  it("exists for every project", () => {
    expect(Object.keys(pipelines).sort()).toEqual(projects.map((p) => p.id).sort());
  });

  for (const pipeline of Object.values(pipelines)) {
    describe(pipeline.project, () => {
      it("edges reference known nodes and produce finite paths", () => {
        for (const layout of layouts) {
          for (const edge of pipeline.edges) {
            const pts = edgePoints(pipeline, edge, layout);
            expect(pts.flat().every(Number.isFinite)).toBe(true);
          }
        }
      });

      it("nodes fit inside the viewBox", () => {
        for (const layout of layouts) {
          const [w, h] = pipeline.viewBox[layout];
          for (const node of pipeline.nodes) {
            const b = nodeBox(node, layout);
            expect(b.cx - b.w / 2, `${node.id} ${layout} left`).toBeGreaterThanOrEqual(0);
            expect(b.cx + b.w / 2, `${node.id} ${layout} right`).toBeLessThanOrEqual(w);
            expect(b.cy - b.h / 2, `${node.id} ${layout} top`).toBeGreaterThanOrEqual(0);
            expect(b.cy + b.h / 2, `${node.id} ${layout} bottom`).toBeLessThanOrEqual(h);
          }
        }
      });

      it("nodes do not overlap", () => {
        for (const layout of layouts) {
          const boxes = pipeline.nodes.map((n) => ({ id: n.id, ...nodeBox(n, layout) }));
          for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
              const a = boxes[i];
              const b = boxes[j];
              const overlap =
                Math.abs(a.cx - b.cx) < (a.w + b.w) / 2 && Math.abs(a.cy - b.cy) < (a.h + b.h) / 2;
              expect(overlap, `${a.id} × ${b.id} (${layout})`).toBe(false);
            }
          }
        }
      });

      it("every node cites a resume phrase from the project's bullets", () => {
        const project = projects.find((p) => p.id === pipeline.project)!;
        const text = project.bullets.join(" ");
        for (const node of pipeline.nodes) {
          for (const fragment of node.source.split(" … ")) {
            expect(text, `${node.id}: "${fragment}"`).toContain(fragment);
          }
        }
      });
    });
  }
});
