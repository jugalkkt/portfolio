import { describe, expect, it } from "vitest";
import { Cancelled, Clock, polyline } from "@/components/project/motion/clock";

const manual = () =>
  new Clock(
    () => 0,
    () => {},
  );

describe("Clock", () => {
  it("resolves tweens on clock time and reports progress", async () => {
    const c = manual();
    const seen: number[] = [];
    const done = c.tween(100, (t) => seen.push(t));
    c.advance(50);
    c.advance(60);
    await done;
    expect(seen).toEqual([0, 0.5, 1]);
  });

  it("does not advance while nobody advances it (paused)", async () => {
    const c = manual();
    let finished = false;
    c.sleep(100).then(() => (finished = true));
    await Promise.resolve();
    expect(finished).toBe(false);
    c.advance(100);
    await Promise.resolve();
    expect(finished).toBe(true);
  });

  it("rejects pending steps with Cancelled on destroy", async () => {
    const c = manual();
    const p = c.sleep(1000);
    c.destroy();
    await expect(p).rejects.toBeInstanceOf(Cancelled);
    await expect(c.sleep(10)).rejects.toBeInstanceOf(Cancelled);
  });
});

describe("polyline", () => {
  it("interpolates by length across segments", () => {
    const p = polyline([
      [0, 0],
      [10, 0],
      [10, 10],
    ]);
    expect(p.length).toBe(20);
    expect(p.at(0)).toEqual([0, 0]);
    expect(p.at(0.25)).toEqual([5, 0]);
    expect(p.at(0.75)).toEqual([10, 5]);
    expect(p.at(1)).toEqual([10, 10]);
  });
});
