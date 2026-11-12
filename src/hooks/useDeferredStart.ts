"use client";

import { useSyncExternalStore } from "react";
import { deferredStart } from "@/lib/deferredStart";

/** True once decorative WebGL may start (see lib/deferredStart). */
export function useDeferredStart(): boolean {
  return useSyncExternalStore(
    deferredStart.subscribe,
    deferredStart.getSnapshot,
    deferredStart.getServerSnapshot,
  );
}
