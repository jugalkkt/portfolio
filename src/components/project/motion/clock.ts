/**
 * Minimal pausable timeline for scripted diagram animations. `sleep` and `tween` resolve
 * on clock time, which only advances while playing — pausing freezes tokens mid-edge and
 * resuming continues. `destroy` rejects every pending step with `Cancelled`.
 */
export class Cancelled extends Error {
  constructor() {
    super("cancelled");
  }
}

type Tween = {
  start: number;
  dur: number;
  fn: (t: number) => void;
  resolve: () => void;
  reject: (e: Error) => void;
};

export class Clock {
  now = 0;
  private tweens: Tween[] = [];
  private playing = false;
  private dead = false;
  private raf = 0;
  private last = 0;

  constructor(
    private readonly schedule: (cb: (t: number) => void) => number = (cb) =>
      requestAnimationFrame(cb),
    private readonly unschedule: (id: number) => void = (id) => cancelAnimationFrame(id),
  ) {}

  get isPlaying() {
    return this.playing;
  }

  play() {
    if (this.playing || this.dead) return;
    this.playing = true;
    this.last = -1;
    this.raf = this.schedule(this.frame);
  }

  pause() {
    this.playing = false;
    this.unschedule(this.raf);
  }

  /** Advance by `ms` (frame callback, also used directly by tests). */
  advance(ms: number) {
    this.now += ms;
    for (const tw of [...this.tweens]) {
      const t = Math.min((this.now - tw.start) / tw.dur, 1);
      tw.fn(t);
      if (t >= 1) {
        this.tweens.splice(this.tweens.indexOf(tw), 1);
        tw.resolve();
      }
    }
  }

  private frame = (time: number) => {
    if (!this.playing) return;
    // Clamp long gaps (tab switch, jank) so animations never leap.
    if (this.last >= 0) this.advance(Math.min(time - this.last, 50));
    this.last = time;
    this.raf = this.schedule(this.frame);
  };

  tween(dur: number, fn: (t: number) => void): Promise<void> {
    if (this.dead) return Promise.reject(new Cancelled());
    return new Promise((resolve, reject) => {
      fn(0);
      this.tweens.push({ start: this.now, dur: Math.max(dur, 1), fn, resolve, reject });
    });
  }

  sleep(ms: number) {
    return this.tween(ms, () => {});
  }

  destroy() {
    this.dead = true;
    this.pause();
    for (const tw of this.tweens.splice(0)) tw.reject(new Cancelled());
  }
}

export type Pt = [number, number];

/** Total length and cumulative segment lengths of a polyline. */
export function polyline(points: Pt[]) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(
      cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]),
    );
  }
  const length = cum[cum.length - 1];
  return {
    length,
    /** Point at fraction `t` ∈ [0, 1] of the total length. */
    at(t: number): Pt {
      const d = Math.min(Math.max(t, 0), 1) * length;
      let i = 1;
      while (i < cum.length - 1 && cum[i] < d) i++;
      const seg = cum[i] - cum[i - 1] || 1;
      const f = (d - cum[i - 1]) / seg;
      const a = points[i - 1];
      const b = points[i];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    },
  };
}

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
