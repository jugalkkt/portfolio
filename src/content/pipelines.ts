/**
 * A4 pipeline graphs as data. Every node traces to a phrase in the resume bullets
 * (see `source`). Coordinates are hand-placed per layout: `desktop` (horizontal)
 * and `mobile` (vertical variant, not a scaled-down desktop graph).
 */
import type { Project } from "./resume";

export type NodeKind = "agent" | "gate" | "tool" | "store" | "io" | "badge";
export type Point = [number, number];
export type Layout = "desktop" | "mobile";

export type PipelineNode = {
  id: string;
  label: string;
  sub?: string;
  kind: NodeKind;
  /** Resume phrase the node is drawn from — also used as its tooltip. */
  source: string;
  at: Record<Layout, Point>;
};

export type PipelineEdge = {
  from: string;
  to: string;
  /** Execution order for token animation (Phase 4). */
  order: number;
  dashed?: boolean;
  bidirectional?: boolean;
  label?: string;
  /** Optional waypoints per layout for orthogonal routing. */
  via?: Partial<Record<Layout, Point[]>>;
  labelAt?: Partial<Record<Layout, Point>>;
};

export type Pipeline = {
  project: Project["id"];
  summary: string;
  viewBox: Record<Layout, [number, number]>;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
};

const sherpa: Pipeline = {
  project: "sherpa",
  summary:
    "Sherpa pipeline: planner, human-in-the-loop approval, explainer, quiz and coach agents. The explainer retrieves from the user's notes over 2 MCP servers with 7 tools; quiz code runs in a 2-layer sandbox; every agent checkpoints to SQLite. Runs on Qwen2.5-7B via Ollama.",
  viewBox: { desktop: [720, 310], mobile: [360, 510] },
  nodes: [
    {
      id: "planner",
      label: "Planner",
      kind: "agent",
      source: "4-agent learning pipeline in LangGraph (planner, explainer, quiz, coach)",
      at: { desktop: [70, 120], mobile: [70, 40] },
    },
    // Owner confirmed (2026-11-12): HITL approval comes after the planner.
    {
      id: "hitl",
      label: "HITL approval",
      kind: "gate",
      source: "with human-in-the-loop approval",
      at: { desktop: [190, 120], mobile: [70, 115] },
    },
    {
      id: "explainer",
      label: "Explainer",
      kind: "agent",
      source:
        "Grounded explanations in the user’s own notes through an agentic tool-calling RAG loop",
      at: { desktop: [320, 120], mobile: [70, 190] },
    },
    {
      id: "quiz",
      label: "Quiz",
      kind: "agent",
      source: "running generated code in a 2-layer sandbox",
      at: { desktop: [490, 120], mobile: [70, 265] },
    },
    {
      id: "coach",
      label: "Coach",
      kind: "agent",
      source: "4-agent learning pipeline in LangGraph (planner, explainer, quiz, coach)",
      at: { desktop: [630, 120], mobile: [70, 340] },
    },
    {
      id: "notes",
      label: "User notes",
      kind: "io",
      source: "Grounded explanations in the user’s own notes",
      at: { desktop: [130, 215], mobile: [255, 115] },
    },
    {
      id: "mcp",
      label: "MCP servers (2)",
      sub: "7 tools",
      kind: "tool",
      source: "2 MCP servers (7 tools: path-traversal-safe file search and per-session memory)",
      at: { desktop: [320, 215], mobile: [255, 190] },
    },
    {
      id: "sandbox",
      label: "2-layer sandbox",
      sub: "AST allowlist → subprocess",
      kind: "tool",
      source:
        "2-layer sandbox (AST allowlist + resource-limited subprocess with audit-hook tripwire)",
      at: { desktop: [490, 215], mobile: [255, 265] },
    },
    {
      id: "sqlite",
      label: "SQLite checkpoint",
      kind: "store",
      source: "SQLite checkpointing for crash-safe session resume",
      at: { desktop: [320, 30], mobile: [120, 420] },
    },
    {
      id: "model",
      label: "Qwen2.5-7B via Ollama",
      kind: "badge",
      source: "running on a self-hosted Qwen2.5-7B via Ollama at $0 API cost",
      at: { desktop: [620, 285], mobile: [180, 485] },
    },
  ],
  edges: [
    { from: "planner", to: "hitl", order: 1 },
    { from: "hitl", to: "explainer", order: 2 },
    { from: "notes", to: "mcp", order: 3 },
    { from: "explainer", to: "mcp", order: 3, bidirectional: true },
    { from: "explainer", to: "quiz", order: 4 },
    { from: "quiz", to: "sandbox", order: 5 },
    { from: "quiz", to: "coach", order: 6 },
    {
      from: "planner",
      to: "sqlite",
      order: 7,
      dashed: true,
      via: {
        desktop: [[70, 30]],
        mobile: [
          [14, 40],
          [14, 420],
        ],
      },
    },
    {
      from: "explainer",
      to: "sqlite",
      order: 7,
      dashed: true,
      via: {
        mobile: [
          [14, 190],
          [14, 420],
        ],
      },
    },
    {
      from: "quiz",
      to: "sqlite",
      order: 7,
      dashed: true,
      via: {
        desktop: [[490, 30]],
        mobile: [
          [14, 265],
          [14, 420],
        ],
      },
    },
    {
      from: "coach",
      to: "sqlite",
      order: 7,
      dashed: true,
      via: {
        desktop: [[630, 30]],
        mobile: [
          [14, 340],
          [14, 420],
        ],
      },
    },
  ],
};

const pathfinder: Pipeline = {
  project: "pathfinder",
  summary:
    "Pathfinder ReAct loop: a query goes to Plan, which searches the web via DuckDuckGo and observes the results, looping back to Plan. A search budget of 1–8 in graph state forces Summarise once it is spent, producing a sourced summary. Searches retry with 10/30/60 s backoff. Runs on gpt-oss-20b via Groq.",
  viewBox: { desktop: [720, 300], mobile: [360, 620] },
  nodes: [
    {
      id: "query",
      label: "Query",
      kind: "io",
      source: "plans queries",
      at: { desktop: [70, 110], mobile: [180, 30] },
    },
    {
      id: "plan",
      label: "Plan",
      kind: "agent",
      source: "ReAct research agent in LangGraph … that plans queries",
      at: { desktop: [220, 110], mobile: [180, 110] },
    },
    {
      id: "search",
      label: "Search",
      sub: "DuckDuckGo",
      kind: "tool",
      source: "searches the web via DuckDuckGo",
      at: { desktop: [390, 110], mobile: [180, 200] },
    },
    {
      id: "observe",
      label: "Observe",
      kind: "agent",
      source: "ReAct research agent",
      at: { desktop: [390, 215], mobile: [180, 290] },
    },
    {
      id: "summarise",
      label: "Summarise",
      kind: "agent",
      source: "forcing the agent to summarise once it is spent",
      at: { desktop: [590, 110], mobile: [180, 380] },
    },
    {
      id: "output",
      label: "Sourced summary",
      kind: "io",
      source: "writes a sourced summary",
      at: { desktop: [590, 215], mobile: [180, 460] },
    },
    {
      id: "budget",
      label: "budget 1–8 · graph state",
      kind: "badge",
      source: "configurable search budget (1–8) held in graph state",
      at: { desktop: [100, 215], mobile: [180, 525] },
    },
    {
      id: "retry",
      label: "retry 10s → 30s → 60s",
      kind: "badge",
      source: "search retries with 10/30/60 s backoff against rate limits",
      at: { desktop: [390, 280], mobile: [180, 560] },
    },
    {
      id: "model",
      label: "gpt-oss-20b · Groq",
      kind: "badge",
      source: "on gpt-oss-20b (Groq)",
      at: { desktop: [590, 280], mobile: [180, 595] },
    },
  ],
  edges: [
    { from: "query", to: "plan", order: 1 },
    { from: "plan", to: "search", order: 2 },
    { from: "search", to: "observe", order: 3 },
    {
      from: "observe",
      to: "plan",
      order: 4,
      via: {
        desktop: [[220, 215]],
        mobile: [
          [310, 290],
          [310, 110],
        ],
      },
    },
    {
      from: "plan",
      to: "summarise",
      order: 5,
      label: "budget spent",
      via: {
        desktop: [
          [220, 36],
          [590, 36],
        ],
        mobile: [
          [50, 110],
          [50, 380],
        ],
      },
      labelAt: { desktop: [405, 36], mobile: [50, 245] },
    },
    { from: "summarise", to: "output", order: 6 },
  ],
};

const shrinx: Pipeline = {
  project: "shrinx",
  summary:
    "Shrinx request flow: the client calls FastAPI, which generates a short code with Python's secrets module over a 62-character alphabet and stores it in MongoDB Atlas; responses are rendered with Jinja2. Auth requests are hashed with bcrypt in a thread pool, issue a JWT and set an HttpOnly, SameSite cookie.",
  viewBox: { desktop: [720, 250], mobile: [360, 660] },
  nodes: [
    {
      id: "client",
      label: "Client",
      kind: "io",
      source: "full-stack URL shortener",
      at: { desktop: [70, 60], mobile: [180, 30] },
    },
    {
      id: "fastapi",
      label: "FastAPI",
      kind: "agent",
      source: "full-stack URL shortener with FastAPI",
      at: { desktop: [220, 60], mobile: [180, 110] },
    },
    {
      id: "codegen",
      label: "Short-code generator",
      sub: "secrets · 62-char alphabet",
      kind: "tool",
      source:
        "collision-safe short-code generator using Python’s secrets module over a 62-character alphabet",
      at: { desktop: [410, 60], mobile: [180, 200] },
    },
    {
      id: "mongo",
      label: "MongoDB Atlas",
      kind: "store",
      source: "MongoDB Atlas",
      at: { desktop: [610, 60], mobile: [180, 290] },
    },
    {
      id: "auth",
      label: "Auth request",
      kind: "io",
      source: "stateless JWT authentication",
      at: { desktop: [70, 190], mobile: [180, 390] },
    },
    {
      id: "bcrypt",
      label: "bcrypt",
      sub: "thread pool",
      kind: "tool",
      source: "bcrypt password hashing … offloading CPU-bound hashing to a thread pool",
      at: { desktop: [240, 190], mobile: [180, 470] },
    },
    {
      id: "jwt",
      label: "JWT",
      sub: "7-day expiry",
      kind: "agent",
      source: "stateless JWT authentication … 7-day token expiry",
      at: { desktop: [400, 190], mobile: [180, 555] },
    },
    {
      id: "cookie",
      label: "HttpOnly + SameSite cookie",
      kind: "io",
      source: "HttpOnly + SameSite session cookies",
      at: { desktop: [590, 190], mobile: [180, 630] },
    },
  ],
  edges: [
    { from: "client", to: "fastapi", order: 1 },
    { from: "fastapi", to: "codegen", order: 2 },
    { from: "codegen", to: "mongo", order: 3 },
    {
      from: "fastapi",
      to: "client",
      order: 4,
      label: "Jinja2 SSR",
      via: {
        desktop: [
          [220, 122],
          [70, 122],
        ],
        mobile: [
          [320, 110],
          [320, 30],
        ],
      },
      labelAt: { desktop: [145, 122], mobile: [320, 70] },
    },
    { from: "auth", to: "bcrypt", order: 1 },
    { from: "bcrypt", to: "jwt", order: 2 },
    { from: "jwt", to: "cookie", order: 3 },
  ],
};

export const pipelines: Record<Project["id"], Pipeline> = { sherpa, pathfinder, shrinx };
