import { describe, expect, it } from "vitest";
import {
  certifications,
  education,
  experience,
  identity,
  leadership,
  projects,
  skills,
} from "@/content/resume";
import { copy } from "@/content/copy";
import * as resume from "@/content/resume";

/** Collect every value stored under a key named `href`, anywhere in the content tree. */
function collectHrefs(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) {
    node.forEach((n) => collectHrefs(n, out));
  } else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "href" && typeof value === "string") out.push(value);
      else collectHrefs(value, out);
    }
  }
  return out;
}

/** Numbers in a chip, e.g. "0% → 85% correct-answer grading" → ["0", "85"]. */
function numbersIn(text: string): string[] {
  return text.match(/\d+(?:\.\d+)?/g) ?? [];
}

/** True if `num` appears in `text` as a whole number token (not part of a longer number). */
function containsNumber(text: string, num: string): boolean {
  const escaped = num.replace(".", "\\.");
  return new RegExp(`(?<![\\d.])${escaped}(?![\\d]|\\.\\d)`).test(text);
}

describe("resume content", () => {
  it("every link is an absolute https:, mailto: or tel: URL", () => {
    const hrefs = collectHrefs(resume);
    expect(hrefs.length).toBeGreaterThan(10);
    for (const href of hrefs) {
      expect(href, href).toMatch(/^(https:\/\/[^\s]+|mailto:[^\s]+|tel:\+\d+)$/);
    }
  });

  it("serves the resume PDF from /public", () => {
    expect(identity.resumePdfPath).toBe("/Jugal_Kakkat_Resume.pdf");
  });

  it("identity matches the resume", () => {
    expect(identity.name).toBe("Jugal Kakkat");
    expect(identity.headline).toBe("Aspiring Agentic AI Engineer");
    expect(identity.email.href).toBe("mailto:jugalkakkat@gmail.com");
    expect(identity.phone.href).toBe("tel:+917592028073");
    expect(identity.github.href).toBe("https://github.com/jugalkkt");
    expect(identity.linkedin.href).toBe("https://linkedin.com/in/jugalkkt");
  });

  it("the internship has only role, company, dates and certificate link", () => {
    expect(experience).toHaveLength(1);
    const [intern] = experience;
    expect(Object.keys(intern).sort()).toEqual(["certificate", "company", "dates", "role"]);
    expect(intern).toMatchObject({
      role: "Embedded Software Intern",
      company: "Linumiz",
      dates: "May 2025 – Jul 2025",
    });
    expect(intern).not.toHaveProperty("bullets");
  });

  it("skill groups are exactly the resume groups, agentic first", () => {
    expect(skills.map((g) => g.group)).toEqual([
      "Agentic AI",
      "Observability",
      "Testing & Debugging",
      "Languages",
      "Backend & APIs",
      "Frontend",
      "Databases",
      "Tools & Systems",
      "RTOS",
    ]);
    expect(skills.flatMap((g) => g.items)).toHaveLength(30);
  });

  it("features all three projects, Sherpa first, each with Live and Code links", () => {
    expect(projects.map((p) => p.name)).toEqual(["Sherpa", "Pathfinder", "Shrinx"]);
    for (const p of projects) {
      expect(p.live.href).toMatch(/^https:\/\//);
      expect(p.code.href).toMatch(/^https:\/\/github\.com\/jugalkkt\//);
      expect(p.bullets.length).toBeGreaterThan(0);
      expect(p.stats.length).toBeGreaterThan(0);
      expect(p.tech.length).toBeGreaterThan(0);
    }
  });

  it("every number in a stat chip appears in that project's bullets", () => {
    for (const p of projects) {
      const text = p.bullets.join(" ");
      for (const chip of p.stats) {
        for (const num of numbersIn(chip)) {
          expect(containsNumber(text, num), `${p.name}: "${chip}" → ${num}`).toBe(true);
        }
      }
    }
  });

  it("stat chips match the approved figures exactly", () => {
    const byName = Object.fromEntries(projects.map((p) => [p.name, p.stats]));
    expect(byName.Sherpa).toEqual([
      "4 agents",
      "2 MCP servers / 7 tools",
      "1.0 DeepEval faithfulness",
      "0% → 85% correct-answer grading",
      "25+ escape tests",
      "424 unit tests",
      "14 live LLM evals",
      "$0 API cost",
    ]);
    expect(byName.Pathfinder).toEqual([
      "ReAct agent",
      "search budget 1–8",
      "10/30/60 s backoff",
      "live step streaming",
    ]);
    expect(byName.Shrinx).toEqual([
      "62-char alphabet",
      "3.5 trillion-code keyspace",
      "7-day JWT expiry",
      "non-blocking bcrypt",
    ]);
  });

  it("leadership entry matches the resume", () => {
    expect(leadership).toHaveLength(1);
    expect(leadership[0]).toMatchObject({
      role: "Technical Club Mentor",
      organisation: "IIIT Kottayam",
      dates: "Sep 2025 – Aug 2026",
    });
    expect(leadership[0].bullets).toHaveLength(3);
  });

  it("education shows 2023 – Present and no Class 12", () => {
    expect(education).toHaveLength(1);
    expect(education[0].dates).toBe("2023 – Present");
    const serialised = JSON.stringify(resume);
    expect(serialised).not.toMatch(/Class 12|CBSE|Kailasanadha/);
  });

  it("lists both HackerRank certificates", () => {
    expect(certifications.map((c) => c.name)).toEqual([
      "HackerRank SQL (Intermediate)",
      "HackerRank Python (Basic)",
    ]);
  });
});

describe("proposed copy", () => {
  it("is marked PROPOSED until the owner approves it", () => {
    expect(copy.status).toBe("PROPOSED");
  });

  it("contains no banned self-descriptions", () => {
    const text = JSON.stringify(copy).toLowerCase();
    for (const word of ["passionate", "expert", "10x", "guru", "ninja", "rockstar"]) {
      expect(text, word).not.toContain(word);
    }
  });

  it("meta description is at most 155 characters", () => {
    expect(copy.metaDescription.length).toBeLessThanOrEqual(155);
  });
});
