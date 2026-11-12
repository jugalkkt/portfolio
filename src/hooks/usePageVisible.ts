"use client";

import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}

/** False while the tab is hidden — every animation loop pauses. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !document.hidden,
    () => true,
  );
}
