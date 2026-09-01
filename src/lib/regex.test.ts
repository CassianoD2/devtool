import { describe, it, expect } from "vitest";
import { runRegex } from "./regex";

describe("runRegex", () => {
  it("captures numbered groups", () => {
    const { matches } = runRegex("(\\d{4})-(\\d{2})", "", "ref 2026-08 e 2025-12");
    expect(matches).toHaveLength(2);
    expect(matches[0]).toMatchObject({ match: "2026-08", index: 4, groups: ["2026", "08"] });
  });

  it("captures named groups", () => {
    const { matches } = runRegex("(?<y>\\d{4})", "", "2026");
    expect(matches[0].namedGroups).toEqual({ y: "2026" });
  });

  it("reports invalid patterns instead of throwing", () => {
    const { error, matches } = runRegex("(", "", "x");
    expect(error).toBeTruthy();
    expect(matches).toEqual([]);
  });

  it("does not hang on zero-width matches", () => {
    const { matches } = runRegex("a*", "", "aba");
    expect(matches.length).toBeGreaterThan(0);
  });
});
