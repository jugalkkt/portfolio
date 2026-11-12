/**
 * Decorative WebGL (hero network, particle flow) starts only after the page is loaded and
 * the visitor first interacts — pointer move, touch, scroll or key — or IDLE_MS after load
 * if they never do. The static SVG poster covers the wait, so the content is readable and
 * interactive before any shader compiles (keeps INP/TBT low on phones).
 */
const IDLE_MS = 6000;
const EVENTS = ["pointermove", "pointerdown", "touchstart", "wheel", "scroll", "keydown"] as const;

let started = false;
let armed = false;
let loaded = false;
let interacted = false;
const listeners = new Set<() => void>();

function start() {
  if (started) return;
  started = true;
  for (const e of EVENTS) window.removeEventListener(e, onInteract, true);
  listeners.forEach((l) => l());
}

// An interaction before `load` still counts; it just takes effect once the page has loaded.
function onInteract() {
  interacted = true;
  if (loaded) start();
}

function arm() {
  if (armed) return;
  armed = true;
  for (const e of EVENTS) window.addEventListener(e, onInteract, { capture: true, passive: true });
  const afterLoad = () => {
    loaded = true;
    if (interacted) start();
    else setTimeout(start, IDLE_MS);
  };
  if (document.readyState === "complete") afterLoad();
  else window.addEventListener("load", afterLoad, { once: true });
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

// Listen from the moment this module runs (before hydration), so early input counts.
if (typeof window !== "undefined") arm();
