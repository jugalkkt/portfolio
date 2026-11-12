"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { inputSkills, outputSections } from "@/content/heroNetwork";
import { useInView } from "@/hooks/useInView";
import { useMotionPreference, type MotionPreference } from "@/hooks/useMotionPreference";
import { usePageVisible } from "@/hooks/usePageVisible";
import { detectDevice, lowerTier, pickTier, type QualityTier } from "@/lib/capabilities";
import { HeroBridge } from "@/components/three/InferenceNetwork/bridge";
import { clsx } from "clsx";

// All three.js code lives in this lazily loaded chunk; the SVG poster covers until it paints.
const HeroCanvas = dynamic(() => import("@/components/three/HeroCanvas"), { ssr: false });

/** Clicks on these are content, not "empty space" for click-to-infer. */
const CONTENT = "a, button, h1, p, [data-hero-content]";

let detectedTier: QualityTier | null = null;
const noSubscribe = () => () => {};
const getDetectedTier = () => (detectedTier ??= pickTier(detectDevice()));
const getDebug = () => new URLSearchParams(window.location.search).get("debug") === "1";
/** ?debug=1&tier=high|medium|low pins the tier (no auto-downgrade) for tuning and tests. */
const getForcedTier = (): QualityTier | null => {
  const params = new URLSearchParams(window.location.search);
  const t = params.get("tier");
  return params.get("debug") === "1" && (t === "high" || t === "medium" || t === "low") ? t : null;
};

export function HeroVisual({ poster, className }: { poster: ReactNode; className?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const [bridge] = useState(() => new HeroBridge());
  const [downgrades, setDowngrades] = useState(0);
  const [ready, setReady] = useState(false);

  // Server render and hydration use "static" (the poster); the real tier is read after.
  const detected = useSyncExternalStore(noSubscribe, getDetectedTier, () => "static" as const);
  const debug = useSyncExternalStore(noSubscribe, getDebug, () => false);
  const forced = useSyncExternalStore(noSubscribe, getForcedTier, () => null);
  let tier: QualityTier = forced ?? detected;
  if (!forced) for (let i = 0; i < downgrades; i++) tier = lowerTier(tier);

  const motion = useMotionPreference();
  const visible = usePageVisible();
  const inView = useInView(container);
  const webgl = tier !== "static" && motion !== "reduced";
  const active = webgl && motion === "full" && inView && visible;

  // Pointer → bridge. Listeners sit on the hero section so text stays selectable.
  useEffect(() => {
    if (!webgl) return;
    const box = container.current;
    const section = box?.closest("section");
    if (!section || !box) return;

    const move = (e: PointerEvent | MouseEvent) => {
      const r = box.getBoundingClientRect();
      bridge.setPointer(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
    };
    const leave = () => bridge.leave();
    const click = (e: MouseEvent) => {
      if ((e.target as Element).closest(CONTENT)) return;
      move(e);
      bridge.click();
    };
    section.addEventListener("pointermove", move, { passive: true });
    section.addEventListener("pointerleave", leave);
    section.addEventListener("click", click);
    return () => {
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", leave);
      section.removeEventListener("click", click);
    };
  }, [webgl, bridge]);

  // Hover label + output-node navigation. DOM writes only on change / while hovered.
  useEffect(() => {
    let current = -1;
    const section = container.current?.closest("section");
    bridge.onHover((index, kind, slot, x, y) => {
      const el = label.current;
      if (!el) return;
      if (index !== current) {
        current = index;
        if (kind) {
          el.textContent =
            kind === "input" ? `input · ${inputSkills[slot]}` : `${outputSections[slot].label} →`;
          el.dataset.kind = kind;
          el.style.opacity = "1";
        } else {
          el.style.opacity = "0";
        }
        if (section) section.style.cursor = kind === "output" ? "pointer" : "";
      }
      if (kind) {
        // Keep the label inside the (overflow-hidden) hero box.
        const half = el.offsetWidth / 2 + 8;
        const cx = Math.max(half, Math.min(x, (container.current?.clientWidth ?? 0) - half));
        el.style.transform = `translate(${Math.round(cx)}px, ${Math.round(y)}px) translate(-50%, -160%)`;
      }
    });
    bridge.onNavigate((slot) => {
      document
        .getElementById(outputSections[slot].id)
        ?.scrollIntoView({ behavior: motion === "full" ? "smooth" : "auto" });
    });
  }, [bridge, motion]);

  const onSlow = useCallback(() => setDowngrades((d) => d + 1), []);
  const onReady = useCallback(() => setReady(true), []);
  const showCanvas = webgl && ready;

  return (
    <div ref={container} aria-hidden="true" className={clsx("pointer-events-none", className)}>
      <div
        className={clsx(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-out",
          showCanvas ? "opacity-0" : "opacity-100",
        )}
      >
        {poster}
      </div>
      {webgl ? (
        <div
          className={clsx(
            "absolute inset-0 transition-opacity duration-700 ease-out",
            showCanvas ? "opacity-100" : "opacity-0",
          )}
        >
          <HeroCanvas
            tier={tier as Exclude<QualityTier, "static">}
            active={active}
            bridge={bridge}
            onSlow={onSlow}
            onReady={onReady}
          />
        </div>
      ) : null}
      <div
        ref={label}
        className="absolute left-0 top-0 whitespace-nowrap rounded-chip border border-line-strong bg-bg-raised/90 px-2 py-1 font-mono text-label text-text opacity-0 transition-opacity duration-150 data-[kind=output]:border-signal/60 data-[kind=output]:text-signal"
      />
      {debug ? <DebugOverlay bridge={bridge} tier={tier} motion={motion} active={active} /> : null}
    </div>
  );
}

function DebugOverlay({
  bridge,
  tier,
  motion,
  active,
}: {
  bridge: HeroBridge;
  tier: QualityTier;
  motion: MotionPreference;
  active: boolean;
}) {
  const [stats, setStats] = useState(() => ({ ...bridge.stats }));
  useEffect(() => {
    (window as unknown as { __heroBridge?: HeroBridge }).__heroBridge = bridge;
    const id = setInterval(() => setStats({ ...bridge.stats }), 500);
    return () => clearInterval(id);
  }, [bridge]);
  return (
    <pre
      data-testid="hero-debug"
      className="fixed bottom-3 left-3 z-50 rounded-chip border border-line bg-bg-inset/95 px-3 py-2 font-mono text-label text-signal"
    >
      {`fps ${stats.fps}  edges ${stats.activeEdges}  calls ${stats.calls}\ntier ${tier}  motion ${motion}  ${active ? "running" : "idle"}`}
    </pre>
  );
}
