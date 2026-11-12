/**
 * Site copy that summarises resume facts (not facts themselves).
 * Approved by the owner on 2026-11-12 — still edit freely. Facts themselves live in resume.ts.
 */

export const copy = {
  status: "APPROVED" as "PROPOSED" | "APPROVED",

  siteTitle: "Jugal Kakkat — Aspiring Agentic AI Engineer",
  metaDescription:
    "Jugal Kakkat — aspiring agentic AI engineer and CSE student at IIIT Kottayam. Multi-agent systems with LangGraph: Sherpa, Pathfinder and Shrinx.",

  hero: {
    kicker: "> agentic_ai_engineer.init()",
    /** Each verb maps to a resume fact: planner agent, RAG over MCP, sandboxed verification, checkpointed resume. */
    tagline: "I build multi-agent systems that plan, retrieve, verify and recover.",
    subLine:
      "Fourth-year CSE student at IIIT Kottayam, building with LangGraph, LangChain and CrewAI.",
  },

  about:
    "I'm a fourth-year B.Tech Computer Science and Engineering student at IIIT Kottayam, focused on agentic AI. I build LangGraph pipelines where agents plan, call tools and hand off to each other, and I care about what happens after the demo: evaluation with DeepEval, sandboxing generated code, crash-safe checkpoints and real deployments. Outside my own projects, I mentor at the college technical club and help run hackathons.",

  /**
   * Portrait for the About section. The owner will supply the image — drop it in
   * /public and fill this in (e.g. { src: "/portrait.webp", alt: "Jugal Kakkat", width: 800, height: 1000 }).
   */
  portrait: null as null | { src: string; alt: string; width: number; height: number },

  modelCard: {
    status: "open to opportunities",
  },

  contact: {
    heading: "Let's talk.",
    line: "Open to conversations about agentic AI roles and projects.",
  },
} as const;
