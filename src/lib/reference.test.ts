import { describe, it, expect } from "vitest";
import { REFERENCE, searchReference } from "./reference";

describe("REFERENCE", () => {
  it("tem as 5 seções e linhas bem formadas", () => {
    expect(REFERENCE.map((s) => s.id)).toEqual(["http", "mime", "ports", "dns", "regex"]);
    for (const sec of REFERENCE) {
      expect(sec.rows.length).toBeGreaterThan(5);
      expect(sec.rows.every((r) => r.a && r.b)).toBe(true);
    }
  });
});

describe("searchReference", () => {
  it("sem query devolve tudo", () => {
    expect(searchReference("")).toEqual(REFERENCE);
  });
  it("filtra por termo e some seções vazias", () => {
    const r = searchReference("dmarc");
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("dns");
  });
  it("busca em qualquer coluna", () => {
    expect(searchReference("rate limit")[0].rows[0].a).toBe("429");
    expect(searchReference("postgres").some((s) => s.id === "ports")).toBe(true);
  });
});
