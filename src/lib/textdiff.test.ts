import { describe, it, expect } from "vitest";
import { computeDiff } from "./textdiff";

describe("computeDiff", () => {
  it("counts a single changed line", () => {
    const { stats } = computeDiff("a\nb\nc\n", "a\nB\nc\n", { mode: "lines" });
    expect(stats.added).toBe(1);
    expect(stats.removed).toBe(1);
  });

  it("reports no changes for identical input", () => {
    const { parts, stats } = computeDiff("same\n", "same\n");
    expect(stats.added).toBe(0);
    expect(stats.removed).toBe(0);
    expect(parts.every((p) => !p.added && !p.removed)).toBe(true);
  });

  it("word mode isolates the changed token", () => {
    const { parts } = computeDiff("the quick fox", "the slow fox", { mode: "words" });
    expect(parts.some((p) => p.added && p.value.includes("slow"))).toBe(true);
    expect(parts.some((p) => p.removed && p.value.includes("quick"))).toBe(true);
  });

  it("ignoreCase treats case-only edits as unchanged", () => {
    const { stats } = computeDiff("Hello", "hello", { mode: "words", ignoreCase: true });
    expect(stats.added).toBe(0);
    expect(stats.removed).toBe(0);
  });
});
