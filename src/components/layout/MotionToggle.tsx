"use client";

import { Pause, Play } from "lucide-react";
import { useSyncExternalStore } from "react";
import { motionStore } from "@/lib/motionStore";
import { clsx } from "clsx";

/** "Pause animations" control (WCAG 2.2.2). Phase 1: UI + persisted state only. */
export function MotionToggle({
  className,
  display = "inline-flex",
  showLabel = false,
}: {
  className?: string;
  /** Display utilities (e.g. "hidden lg:inline-flex"), kept separate to avoid class conflicts. */
  display?: string;
  showLabel?: boolean;
}) {
  const paused = useSyncExternalStore(
    motionStore.subscribe,
    motionStore.getSnapshot,
    motionStore.getServerSnapshot,
  );
  const Icon = paused ? Play : Pause;
  const label = paused ? "Play animations" : "Pause animations";

  return (
    <button
      type="button"
      aria-pressed={paused}
      aria-label={showLabel ? undefined : "Pause animations"}
      title={label}
      onClick={() => motionStore.set(!paused)}
      className={clsx(
        display,
        "min-h-11 min-w-11 items-center justify-center gap-2 rounded-chip border border-line px-3 text-small text-muted transition-colors duration-150 hover:border-line-strong hover:text-text",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {showLabel ? <span>Pause animations</span> : null}
    </button>
  );
}
