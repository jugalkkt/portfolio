"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { usePageVisible } from "@/hooks/usePageVisible";
import { useQualityTier } from "@/hooks/useQualityTier";
import { useDeferredStart } from "@/hooks/useDeferredStart";
import { particleFragment, particleVertex } from "./particleShaders";

const COUNT = { high: 1500, medium: 800 } as const;
const MAX_LABELS = 8;
const DPR_CAP = 1.5;

type Layout = {
  emitter: [number, number];
  length: number;
  labels: Float32Array;
  labelCount: number;
};

/** Document-space anchors: hero output layer → Contact, plus each section's layer label. */
function measure(): Layout {
  const sy = window.scrollY;
  const hero = document.querySelector("[data-hero-visual]")?.getBoundingClientRect();
  const contact = document.getElementById("contact")?.getBoundingClientRect();
  const emitter: [number, number] = hero
    ? [hero.left + hero.width * 0.82, hero.top + sy + hero.height * 0.5]
    : [window.innerWidth * 0.8, window.innerHeight * 0.5];
  const end = contact ? contact.top + sy + contact.height * 0.6 : document.body.scrollHeight;
  const labels = new Float32Array(MAX_LABELS * 2);
  const els = Array.from(document.querySelectorAll("[data-layer-label]")).slice(0, MAX_LABELS);
  els.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    labels[i * 2] = r.left + 16;
    labels[i * 2 + 1] = r.top + sy + r.height / 2;
  });
  return { emitter, length: Math.max(end - emitter[1], 1), labels, labelCount: els.length };
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
  return sh;
}

/**
 * A2 — one fixed, page-wide WebGL2 canvas (separate from the hero's R3F canvas so the
 * hero can idle off-screen while this keeps flowing). One draw call; all motion on the GPU.
 */
export function ParticleFlow() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { tier, debug } = useQualityTier();
  const motion = useMotionPreference();
  const visible = usePageVisible();
  const [stats, setStats] = useState("");
  // Flow time survives pause / tab-hide restarts so particles never jump.
  const flow = useRef(0);

  const count = tier === "high" || tier === "medium" ? COUNT[tier] : 0;
  // Off on low/static tiers, phones and reduced motion (§5 A2, §9.3).
  const go = useDeferredStart();
  const enabled = go && count > 0 && motion !== "reduced";
  const running = enabled && motion === "full" && visible;

  useEffect(() => {
    const el = canvas.current;
    if (!enabled || !el) return;
    const gl = el.getContext("webgl2", { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) return;

    let program: WebGLProgram;
    try {
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, particleVertex));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, particleFragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(program) ?? "link");
    } catch {
      return; // Decorative only: fail silently, the page is unaffected.
    }

    const seeds = new Float32Array(count).map((_, i) => i);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "aSeed");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 1, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    const u = (name: string) => gl.getUniformLocation(program, name);
    const uTime = u("uTime");
    const uScroll = u("uScroll");
    const uView = u("uView");
    const uEmitter = u("uEmitter");
    const uLength = u("uLength");
    const uDpr = u("uDpr");
    const uLabels = u("uLabels");
    const uLabelCount = u("uLabelCount");
    gl.uniform3f(u("uSignal"), 0x4f / 255, 0xd1 / 255, 0xe8 / 255);
    gl.uniform3f(u("uActivation"), 0x8b / 255, 0x7c / 255, 0xf6 / 255);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let layout = measure();
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      el.width = Math.round(window.innerWidth * dpr);
      el.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, el.width, el.height);
      layout = measure();
      if (debug) (window as unknown as { __particleLayout?: Layout }).__particleLayout = layout;
      draw();
    };
    const ro = new ResizeObserver(() => {
      layout = measure();
      draw();
    });
    ro.observe(document.body);
    window.addEventListener("resize", resize);

    function draw() {
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform1f(uTime, flow.current);
      gl!.uniform1f(uScroll, window.scrollY);
      gl!.uniform2f(uView, window.innerWidth, window.innerHeight);
      gl!.uniform2f(uEmitter, layout.emitter[0], layout.emitter[1]);
      gl!.uniform1f(uLength, layout.length);
      gl!.uniform1f(uDpr, dpr);
      gl!.uniform2fv(uLabels, layout.labels);
      gl!.uniform1i(uLabelCount, layout.labelCount);
      gl!.drawArrays(gl!.POINTS, 0, count);
    }

    // Static frame when paused (a settled field); the loop only runs in full motion.
    let raf = 0;
    let lastT = performance.now();
    let lastScroll = window.scrollY;
    let boost = 0;
    let frames = 0;
    let windowStart = lastT;
    const onScroll = () => {
      if (!running) draw();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - lastT) / 1000, 1 / 20);
      lastT = now;
      // Scroll velocity briefly speeds up the flow (eased, capped at 2×).
      const v = Math.abs(window.scrollY - lastScroll) / Math.max(dt, 1e-3);
      lastScroll = window.scrollY;
      boost += (Math.min(v / 1500, 1) - boost) * 0.08;
      flow.current += dt * (1 + boost);
      draw();
      if (debug) {
        frames++;
        if (now - windowStart >= 1000) {
          setStats(
            `particles ${count} · fps ${Math.round((frames * 1000) / (now - windowStart))} · flow ×${(1 + boost).toFixed(2)}`,
          );
          frames = 0;
          windowStart = now;
        }
      }
    };

    resize();
    if (running) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    };
  }, [enabled, running, count, debug]);

  if (!enabled) return null;
  return (
    <>
      <canvas
        ref={canvas}
        aria-hidden="true"
        data-particle-flow
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
      {debug ? (
        <pre
          data-testid="particle-debug"
          className="fixed bottom-3 right-3 z-50 rounded-chip border border-line bg-bg-inset/95 px-3 py-2 font-mono text-label text-signal"
        >
          {stats || `particles ${count}`}
        </pre>
      ) : null}
    </>
  );
}
