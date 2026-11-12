/**
 * Channel between the DOM (pointer events, hover label, debug overlay) and the
 * R3F frame loop. All mutation goes through methods; nothing here re-renders React.
 */
export type HoverKind = "input" | "output";
type HoverFn = (index: number, kind: HoverKind | null, slot: number, x: number, y: number) => void;

export class HeroBridge {
  readonly pointer = { x: 0, y: 0, ndcX: 0, ndcY: 0, inside: false };
  readonly stats = { fps: 0, activeEdges: 0, calls: 0 };
  /** Debug/testing only: screen positions (px, canvas box) of labelled nodes, [x0, y0, x1, y1…]. */
  screen: Float32Array = new Float32Array(0);
  /** Debug/testing only: index of the first output node. */
  firstOutput = -1;
  private moved = false;
  private clicks = 0;
  private invalidateFn: () => void = () => {};
  private hoverFn: HoverFn = () => {};
  private navigateFn: (slot: number) => void = () => {};

  /** Pointer position relative to the canvas box. */
  setPointer(x: number, y: number, width: number, height: number) {
    const p = this.pointer;
    p.x = x;
    p.y = y;
    p.ndcX = (x / width) * 2 - 1;
    p.ndcY = -((y / height) * 2 - 1);
    p.inside = x >= 0 && y >= 0 && x <= width && y <= height;
    this.moved = true;
    this.invalidateFn();
  }

  leave() {
    this.pointer.inside = false;
    this.invalidateFn();
  }

  click() {
    this.clicks++;
    this.invalidateFn();
  }

  takeMoved(): boolean {
    const m = this.moved;
    this.moved = false;
    return m;
  }

  takeClicks(): number {
    const c = this.clicks;
    this.clicks = 0;
    return c;
  }

  setInvalidate(fn: () => void) {
    this.invalidateFn = fn;
  }
  onHover(fn: HoverFn) {
    this.hoverFn = fn;
  }
  onNavigate(fn: (slot: number) => void) {
    this.navigateFn = fn;
  }

  hover: HoverFn = (...args) => this.hoverFn(...args);
  navigate(slot: number) {
    this.navigateFn(slot);
  }

  report(stats: Partial<HeroBridge["stats"]>) {
    Object.assign(this.stats, stats);
  }
}
