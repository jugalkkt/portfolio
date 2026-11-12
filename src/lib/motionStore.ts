/**
 * The site's "Pause animations" preference, shared by every toggle and (from Phase 2)
 * by useMotionPreference. Persisted in localStorage; storage failures are ignored.
 */
const KEY = "jk:motion-paused";
const listeners = new Set<() => void>();
let paused: boolean | null = null;

function read(): boolean {
  if (paused === null) {
    try {
      paused = window.localStorage.getItem(KEY) === "1";
    } catch {
      paused = false;
    }
  }
  return paused;
}

function apply(value: boolean) {
  document.documentElement.dataset.motion = value ? "paused" : "running";
}

export const motionStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    apply(read());
    return () => listeners.delete(listener);
  },
  getSnapshot: read,
  getServerSnapshot: () => false,
  set(value: boolean) {
    paused = value;
    try {
      window.localStorage.setItem(KEY, value ? "1" : "0");
    } catch {
      /* private mode etc. — keep the in-memory value */
    }
    apply(value);
    listeners.forEach((l) => l());
  },
};
