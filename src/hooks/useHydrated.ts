"use client";

import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/** False during SSR and hydration, true once client-only snapshots (e.g. motion) are real. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}
