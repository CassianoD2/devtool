import { describe, it, expect } from "vitest";
import { compareSemver, isNewer, parseRelease } from "./update";

describe("compareSemver", () => {
  it("iguais → 0 (com e sem prefixo v)", () => {
    expect(compareSemver("1.2.0", "1.2.0")).toBe(0);
    expect(compareSemver("v1.2.0", "1.2.0")).toBe(0);
  });
  it("compara numericamente, não lexicalmente", () => {
    expect(compareSemver("1.10.0", "1.9.0")).toBe(1);
    expect(compareSemver("1.9.0", "1.10.0")).toBe(-1);
  });
  it("patch e major", () => {
    expect(compareSemver("1.2.0", "1.2.1")).toBe(-1);
    expect(compareSemver("2.0.0", "1.9.9")).toBe(1);
  });
  it("pré-lançamento perde do final", () => {
    expect(compareSemver("1.2.0-rc.1", "1.2.0")).toBe(-1);
    expect(compareSemver("1.2.0", "1.2.0-rc.1")).toBe(1);
    expect(compareSemver("1.2.0-rc.1", "1.2.0-rc.2")).toBe(-1);
  });
});

describe("isNewer", () => {
  it("detecta versão mais nova", () => {
    expect(isNewer("1.3.0", "1.2.0")).toBe(true);
    expect(isNewer("1.2.0", "1.2.0")).toBe(false);
    expect(isNewer("1.1.0", "1.2.0")).toBe(false);
  });
});

describe("parseRelease", () => {
  const payload = {
    tag_name: "v1.3.0",
    name: "v1.3.0",
    html_url: "https://github.com/CassianoD2/devtool/releases/tag/v1.3.0",
    body: "## Features\n- coisa nova",
    published_at: "2026-09-10T12:00:00Z",
  };
  it("normaliza o payload da API", () => {
    expect(parseRelease(payload)).toEqual({
      version: "1.3.0",
      tag: "v1.3.0",
      url: "https://github.com/CassianoD2/devtool/releases/tag/v1.3.0",
      notes: "## Features\n- coisa nova",
      publishedAt: "2026-09-10T12:00:00Z",
    });
  });
  it("tolera body ausente", () => {
    expect(parseRelease({ tag_name: "v2.0.0" }).notes).toBe("");
    expect(parseRelease({ tag_name: "v2.0.0", body: null }).notes).toBe("");
  });
  it("usa name quando não há tag_name", () => {
    expect(parseRelease({ name: "v1.4.2" }).version).toBe("1.4.2");
  });
  it("lança sem tag", () => {
    expect(() => parseRelease({})).toThrow();
    expect(() => parseRelease(null)).toThrow();
  });
});
