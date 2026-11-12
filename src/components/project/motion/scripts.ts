import type { Pipeline } from "@/content/pipelines";
import type { GraphContext } from "./graphContext";

/** Fire-and-forget step (e.g. a checkpoint write) that must not block the main token. */
const bg = (p: Promise<unknown>) => void p.catch(() => {});

/**
 * Sherpa: planner → HITL approval → explainer ⇄ MCP (RAG over the user's notes) → quiz →
 * 2-layer sandbox → coach. Every agent step also writes a SQLite checkpoint.
 */
async function sherpa(ctx: GraphContext) {
  const checkpoint = (agent: string) =>
    bg(ctx.move(`${agent}>sqlite`, { token: `ckpt-${agent}`, kind: "ghost", hide: true }));
  const hitl = ctx.box("hitl");
  for (;;) {
    ctx.flash("planner");
    checkpoint("planner");
    await ctx.move("planner>hitl");
    // "human-in-the-loop approval": the token waits at the gate until approved.
    ctx.active("hitl", true);
    await ctx.sleep(450);
    await ctx.caption("✓ approved", hitl.cx, hitl.cy - hitl.h / 2 - 9, 380);
    ctx.active("hitl", false);
    await ctx.move("hitl>explainer");
    ctx.flash("explainer");
    checkpoint("explainer");
    // Tool-calling RAG loop: explainer ⇄ MCP servers, grounded in the user's notes.
    await Promise.all([
      ctx.move("explainer>mcp"),
      ctx.move("notes>mcp", { token: "notes", kind: "activation", hide: true }),
    ]);
    ctx.flash("mcp", 400);
    await ctx.sleep(250);
    await ctx.move("explainer>mcp", { reverse: true });
    await ctx.move("explainer>quiz");
    ctx.flash("quiz");
    checkpoint("quiz");
    // Generated code runs in a 2-layer sandbox before it can grade anything.
    await ctx.move("quiz>sandbox");
    await ctx.boundaries("sandbox", 2, 500);
    await ctx.move("quiz>sandbox", { reverse: true });
    await ctx.move("quiz>coach");
    ctx.flash("coach", 700);
    checkpoint("coach");
    await ctx.sleep(900);
    ctx.hide("a");
    await ctx.sleep(700);
  }
}

/**
 * Pathfinder: a ReAct loop. The search budget held in graph state counts down 8 → 0;
 * when it is spent the agent is forced onto the Summarise edge. One search retries with
 * the 10/30/60 s backoff.
 */
async function pathfinder(ctx: GraphContext) {
  const search = ctx.box("search");
  for (;;) {
    let budget = 8;
    ctx.setLabel("budget", `budget ${budget}/8 · graph state`);
    await ctx.move("query>plan");
    while (budget > 0) {
      ctx.flash("plan", 300);
      await ctx.move("plan>search");
      if (budget === 6) {
        // Rate-limited once: back off 10 s → 30 s → 60 s (time-compressed).
        ctx.active("retry", true);
        for (const s of ["10s", "30s", "60s"]) {
          await Promise.all([
            ctx.working("search", 520),
            ctx.caption(
              `retry · ${s}`,
              search.cx,
              search.cy - search.h / 2 - 9,
              200,
              "var(--activation)",
            ),
          ]);
        }
        ctx.active("retry", false);
      }
      await ctx.move("search>observe");
      budget--;
      ctx.setLabel("budget", `budget ${budget}/8 · graph state`);
      ctx.flash("budget", 260);
      await ctx.move("observe>plan");
    }
    // Budget spent → summarise is forced.
    ctx.forced("plan>summarise", true);
    await ctx.move("plan>summarise");
    ctx.flash("summarise", 500);
    await ctx.move("summarise>output");
    ctx.active("output", true);
    await ctx.sleep(1400);
    ctx.active("output", false);
    ctx.forced("plan>summarise", false);
    ctx.hide("a");
    await ctx.sleep(600);
  }
}

/**
 * Shrinx: an auth request hashes with bcrypt in a thread pool while a second request
 * passes straight through FastAPI (the event loop stays non-blocking), gets a short code,
 * is stored in MongoDB Atlas and rendered back with Jinja2.
 */
async function shrinx(ctx: GraphContext) {
  const request = async () => {
    await ctx.move("client>fastapi", { token: "req" });
    ctx.flash("fastapi", 300);
    await ctx.move("fastapi>codegen", { token: "req" });
    ctx.flash("codegen", 300);
    await ctx.move("codegen>mongo", { token: "req", hide: true });
    ctx.flash("mongo", 400);
    await ctx.move("fastapi>client", { token: "res", kind: "activation", hide: true });
  };
  for (;;) {
    await ctx.move("auth>bcrypt", { token: "auth", kind: "activation" });
    // CPU-bound hashing offloaded to a thread pool …
    await Promise.all([ctx.working("bcrypt", 2600), ctx.sleep(250).then(request)]);
    // … then the JWT is issued and set as an HttpOnly + SameSite cookie.
    await ctx.move("bcrypt>jwt", { token: "auth", kind: "activation" });
    ctx.flash("jwt", 400);
    await ctx.move("jwt>cookie", { token: "auth", kind: "activation" });
    ctx.active("cookie", true);
    await ctx.sleep(900);
    ctx.active("cookie", false);
    ctx.hide("auth");
    await ctx.sleep(800);
  }
}

export const scripts: Record<Pipeline["project"], (ctx: GraphContext) => Promise<void>> = {
  sherpa,
  pathfinder,
  shrinx,
};
