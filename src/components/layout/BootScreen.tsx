import type { CSSProperties } from "react";
import { identity } from "@/content/resume";
import { sections } from "@/content/sections";

/**
 * A short opening screen: the name, then a forward pass through the site's seven layers,
 * before the curtain lifts. It covers the hero's WebGL start-up, so the network is already
 * live when the page appears.
 *
 * Pure CSS: it times itself out without JS, never takes pointer input, and is skipped for
 * reduced or paused motion and on repeat visits in the same tab session (layout's head script).
 */
export function BootScreen() {
  return (
    <div className="boot" aria-hidden="true">
      <div className="flex w-full max-w-md flex-col items-center gap-8 px-6">
        <p className="boot-name text-h2 font-semibold tracking-[-0.03em] text-text">
          {identity.name}
        </p>
        <div className="flex w-full flex-col items-center gap-3">
          <div className="boot-layers relative flex w-full justify-between">
            <span className="boot-line" />
            <span className="boot-line is-fill" />
            {sections.map((s, i) => (
              <span key={s.id} className="boot-node" style={{ "--i": i } as CSSProperties} />
            ))}
          </div>
          <div className="relative h-4 w-full font-mono text-label uppercase tracking-[0.12em]">
            {sections.map((s, i) => (
              <span
                key={s.id}
                className={i === sections.length - 1 ? "boot-label is-last" : "boot-label"}
                style={{ "--i": i } as CSSProperties}
              >
                {s.layer}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
