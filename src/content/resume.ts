/**
 * Single source of truth for every fact on the site.
 * Transcribed from the owner's resume. Do not add, round or reword facts here —
 * components render from this file and nothing factual is hard-coded in JSX.
 */

export type Link = {
  label: string;
  href: string;
};

export type SkillGroup = {
  group: string;
  items: string[];
};

/** Internship: role, company, dates and certificate link only (owner's instruction). */
export type ExperienceEntry = {
  role: string;
  company: string;
  dates: string;
  certificate: Link;
};

export type LeadershipEntry = {
  role: string;
  organisation: string;
  dates: string;
  bullets: string[];
};

export type Project = {
  id: "sherpa" | "pathfinder" | "shrinx";
  name: string;
  subtitle: string;
  live: Link;
  code: Link;
  bullets: string[];
  /** Exact figures from the resume bullets — guarded by tests/unit/content.test.ts. */
  stats: string[];
  tech: string[];
  note?: string;
};

export type EducationEntry = {
  dates: string;
  qualification: string;
  institution: string;
};

export type Certification = {
  name: string;
  href: string;
};

export const identity = {
  name: "Jugal Kakkat",
  headline: "Aspiring Agentic AI Engineer",
  context: "Fourth-year B.Tech Computer Science and Engineering student, IIIT Kottayam",
  email: { label: "jugalkakkat@gmail.com", href: "mailto:jugalkakkat@gmail.com" },
  phone: { label: "+91 7592028073", href: "tel:+917592028073" },
  github: { label: "jugalkkt", href: "https://github.com/jugalkkt" },
  linkedin: { label: "jugalkkt", href: "https://linkedin.com/in/jugalkkt" },
  /** Site-relative asset in /public (owner supplies the file). */
  resumePdfPath: "/Jugal_Kakkat_Resume.pdf",
} as const;

/** Display order: agentic first. Group names and items exactly as on the resume. */
export const skills: SkillGroup[] = [
  { group: "Agentic AI", items: ["LangGraph", "LangChain", "CrewAI"] },
  { group: "Observability", items: ["Langfuse"] },
  { group: "Testing & Debugging", items: ["pytest", "Streamlit AppTest", "DeepEval"] },
  { group: "Languages", items: ["Python", "C", "C++", "Bash"] },
  {
    group: "Backend & APIs",
    items: ["Node.js", "ExpressJS", "FastAPI", "REST APIs", "JWT Authentication"],
  },
  {
    group: "Frontend",
    items: ["HTML5", "CSS3", "JavaScript", "React", "Jinja2", "Streamlit"],
  },
  { group: "Databases", items: ["MySQL", "PostgreSQL", "MongoDB"] },
  { group: "Tools & Systems", items: ["Git", "GitHub", "Linux", "Unix Shell"] },
  { group: "RTOS", items: ["Zephyr RTOS"] },
];

export const experience: ExperienceEntry[] = [
  {
    role: "Embedded Software Intern",
    company: "Linumiz",
    dates: "May 2025 – Jul 2025",
    certificate: {
      label: "Certificate",
      href: "https://drive.google.com/file/d/1AHJPYin5DBENHdHd-ADtC52a7fr8Djbf/view?usp=sharing",
    },
  },
];

export const leadership: LeadershipEntry[] = [
  {
    role: "Technical Club Mentor",
    organisation: "IIIT Kottayam",
    dates: "Sep 2025 – Aug 2026",
    bullets: [
      "Conducted the Udbhav All-India Inter-IIT Hackathon round 1 for 100+ participants at IIITK",
      "Organised Techashy 2026, a national-level hackathon attracting participants across institutions",
      "Led workshops, CTFs, and internal hackathons to build technical culture in the college community",
    ],
  },
];

export const projects: Project[] = [
  {
    id: "sherpa",
    name: "Sherpa",
    subtitle: "Multi-Agent AI Study Companion",
    live: { label: "Live", href: "https://sherpa-study.streamlit.app" },
    code: { label: "Code", href: "https://github.com/jugalkkt/sherpa" },
    bullets: [
      "Built a 4-agent learning pipeline in LangGraph (planner, explainer, quiz, coach) with human-in-the-loop approval and SQLite checkpointing for crash-safe session resume, running on a self-hosted Qwen2.5-7B via Ollama at $0 API cost.",
      "Grounded explanations in the user’s own notes through an agentic tool-calling RAG loop over 2 MCP servers (7 tools: path-traversal-safe file search and per-session memory), scoring 1.0 faithfulness in DeepEval LLM-as-judge evals.",
      "Eliminated hallucinated quiz answers by running generated code in a 2-layer sandbox (AST allowlist + resource-limited subprocess with audit-hook tripwire); correct answers once graded 0% now score 85%, hardened against 25+ escape tests.",
      "Deployed on Streamlit Cloud with an on-demand Kaggle T4 GPU behind an authenticated ngrok tunnel: one-click start in ~2 min, auto-shutdown after 30 min idle; backed by 424 unit tests and 14 live LLM evals.",
    ],
    stats: [
      "4 agents",
      "2 MCP servers / 7 tools",
      "1.0 DeepEval faithfulness",
      "0% → 85% correct-answer grading",
      "25+ escape tests",
      "424 unit tests",
      "14 live LLM evals",
      "$0 API cost",
    ],
    tech: [
      "LangGraph",
      "Ollama",
      "Qwen2.5-7B",
      "MCP",
      "SQLite",
      "DeepEval",
      "Streamlit",
      "Kaggle T4",
      "ngrok",
    ],
    note: "Live demo boots a GPU on demand (~2 min).",
  },
  {
    id: "pathfinder",
    name: "Pathfinder",
    subtitle: "Autonomous Web Research Agent",
    live: { label: "Live", href: "https://pathfinder99.streamlit.app" },
    code: { label: "Code", href: "https://github.com/jugalkkt/pathfinder" },
    bullets: [
      "Built a ReAct research agent in LangGraph on gpt-oss-20b (Groq) that plans queries, searches the web via DuckDuckGo and writes a sourced summary.",
      "Capped LLM cost with a configurable search budget (1–8) held in graph state, forcing the agent to summarise once it is spent.",
      "Streamed every graph step live to a Streamlit UI using LangGraph’s update and custom stream modes, including search retries with 10/30/60 s backoff against rate limits.",
      "Deployed on Streamlit Community Cloud with browser-persisted history and Markdown export.",
    ],
    stats: ["ReAct agent", "search budget 1–8", "10/30/60 s backoff", "live step streaming"],
    tech: ["LangGraph", "gpt-oss-20b", "Groq", "DuckDuckGo", "Streamlit"],
  },
  {
    id: "shrinx",
    name: "Shrinx",
    subtitle: "URL Shortener",
    live: { label: "Live", href: "https://shrinx-coral.vercel.app" },
    code: { label: "Code", href: "https://github.com/jugalkkt/shrinx" },
    bullets: [
      "Built a full-stack URL shortener with FastAPI, MongoDB Atlas and Jinja2 server-side rendering.",
      "Engineered a collision-safe short-code generator using Python’s secrets module over a 62-character alphabet, yielding a 3.5 trillion-code keyspace.",
      "Implemented stateless JWT authentication with bcrypt password hashing, HttpOnly + SameSite session cookies and 7-day token expiry, offloading CPU-bound hashing to a thread pool to keep the async event loop non-blocking under concurrent requests.",
    ],
    stats: [
      "62-char alphabet",
      "3.5 trillion-code keyspace",
      "7-day JWT expiry",
      "non-blocking bcrypt",
    ],
    tech: ["FastAPI", "MongoDB Atlas", "Jinja2", "JWT", "bcrypt"],
  },
];

export const education: EducationEntry[] = [
  {
    dates: "2023 – Present",
    qualification: "B.Tech, Computer Science and Engineering",
    institution: "Indian Institute of Information Technology Kottayam",
  },
];

export const certifications: Certification[] = [
  {
    name: "HackerRank SQL (Intermediate)",
    href: "https://www.hackerrank.com/certificates/aa7854f88348",
  },
  {
    name: "HackerRank Python (Basic)",
    href: "https://www.hackerrank.com/certificates/3d8dc6f8c9b5",
  },
];
