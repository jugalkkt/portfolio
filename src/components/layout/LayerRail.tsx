"use client";

import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";
import { sections } from "@/content/sections";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { sectionPosition } from "@/lib/sectionProgress";

const GAP = 44; // px between rail nodes — equals the 44px hit target, so targets never overlap

/**
 * A3 — Layer Index rail (≥ 1024 px). Nodes are real links; the bright segment tracks
 * scroll through the section stack and the current node glows with an arriving pulse.
 * Reduced motion / paused: no fill animation or pulse, the active node still highlights.
 */
export function LayerRail() {
  const fill = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const motion = useMotionPreference();
  const animate = motion === "full";
  const height = (sections.length - 1) * GAP;

  useEffect(() => {
    let tops: number[] = [];
    let raf = 0;
    const measureTops = () => {
      tops = sections.map((s) => {
        const el = document.getElementById(s.id);
        return el ? el.getBoundingClientRect().top + window.scrollY : 0;
      });
    };
    const update = () => {
      raf = 0;
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const { index, position } = atBottom
        ? { index: sections.length - 1, position: sections.length - 1 }
        : sectionPosition(tops, window.scrollY + window.innerHeight * 0.5);
      if (fill.current)
        fill.current.style.transform = `scaleY(${position / (sections.length - 1)})`;
      setActive(index);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const ro = new ResizeObserver(() => {
      measureTops();
      onScroll();
    });
    ro.observe(document.body);
    measureTops();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <nav
      aria-label="Layer index"
      className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 lg:block xl:right-5"
    >
      <div className="relative w-11" style={{ height: height + 44 }}>
        {/* Track and scroll-progress fill (transform only). */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[22px] w-px -translate-x-1/2 bg-line"
          style={{ height }}
        />
        <span
          ref={fill}
          aria-hidden="true"
          className={clsx(
            "absolute left-1/2 top-[22px] w-px origin-top -translate-x-1/2 bg-gradient-to-b from-signal to-activation",
            animate ? "transition-transform duration-150 ease-out" : "hidden",
          )}
          style={{ height, transform: "scaleY(0)" }}
        />
        <ol>
          {sections.map((s, i) => {
            const current = i === active;
            return (
              <li key={s.id} className="absolute left-0" style={{ top: i * GAP }}>
                <a
                  href={`#${s.id}`}
                  aria-label={`${s.layer}: ${s.nav}`}
                  aria-current={current ? "true" : undefined}
                  className="group relative flex size-11 items-center justify-center rounded-full"
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "relative block size-2 rounded-full border transition-colors duration-300",
                      current
                        ? "border-signal bg-signal shadow-[0_0_10px_var(--signal)]"
                        : i < active
                          ? "border-signal/70 bg-bg"
                          : "border-line-strong bg-bg",
                    )}
                  >
                    {current && animate ? (
                      <span
                        key={active}
                        className="rail-pulse absolute inset-[-5px] rounded-full border border-signal"
                      />
                    ) : null}
                  </span>
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "pointer-events-none absolute right-11 whitespace-nowrap rounded-chip border border-line bg-bg-raised/95 px-2 py-1 font-mono text-label opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100",
                      current ? "text-signal" : "text-muted",
                    )}
                  >
                    {s.layer}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
