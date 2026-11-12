/**
 * Decorative WebGL (hero network, particle flow) starts once the page has loaded, so the
 * HTML, CSS and fonts never compete with three.js. On first visits the boot screen covers
 * that start-up; the static SVG poster covers it otherwise.
 */
let started = false;
let armed = false;
const listeners = new Set<() => void>();

function start() {
  if (started) return;
  started = true;
  listeners.forEach((l) => l());
}

function arm() {
  if (armed) return;
  armed = true;
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}

export const deferredStart = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    arm();
    return () => listeners.delete(listener);
  },
  getSnapshot: () => started,
  getServerSnapshot: () => false,
};

if (typeof window !== "undefined") arm();
