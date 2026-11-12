import { describe, expect, it } from "vitest";
import { projects } from "@/content/resume";
import { countable, joinParts, statParts } from "@/lib/statParts";

const nums = (s: string) => statParts(s).flatMap((p) => ("value" in p ? [p.raw] : []));

describe("statParts", () => {
  it("round-trips every resume stat exactly", () => {
    for (const s of projects.flatMap((p) => p.stats)) expect(joinParts(statParts(s))).toBe(s);
  });

  it("finds quantities, including decimals", () => {
    expect(nums("424 unit tests")).toEqual(["424"]);
    expect(nums("1.0 DeepEval faithfulness")).toEqual(["1.0"]);
    expect(statParts("3.5 trillion-code keyspace")[0]).toEqual({
      value: 3.5,
      decimals: 1,
      raw: "3.5",
    });
    expect(nums("2 MCP servers / 7 tools")).toEqual(["2", "7"]);
    expect(nums("0% → 85% correct-answer grading")).toEqual(["0", "85"]);
  });

  it("leaves ranges and sequences as text", () => {
    expect(nums("search budget 1–8")).toEqual([]);
    expect(nums("10/30/60 s backoff")).toEqual([]);
  });

  it("knows which chips count up", () => {
    expect(countable(statParts("$0 API cost"))).toBe(false);
    expect(countable(statParts("ReAct agent"))).toBe(false);
    expect(countable(statParts("62-char alphabet"))).toBe(true);
  });
});
