import { describe, it, expect } from "vitest";
import { lookupDdd, dddsForUf, ALL_DDDS } from "./dddtable";

describe("lookupDdd", () => {
  it("resolve DDDs conhecidos", () => {
    expect(lookupDdd("11")).toMatchObject({ uf: "SP", regiao: "Sudeste" });
    expect(lookupDdd("(71) 99999-9999")).toMatchObject({ uf: "BA", regiao: "Nordeste" });
    expect(lookupDdd("61")).toMatchObject({ uf: "DF", regiao: "Centro-Oeste" });
  });
  it("DDD inexistente → null", () => {
    expect(lookupDdd("20")).toBeNull();
    expect(lookupDdd("00")).toBeNull();
  });
});

describe("dddsForUf", () => {
  it("lista os DDDs de uma UF", () => {
    expect(dddsForUf("sp").map((d) => d.ddd)).toEqual([
      "11", "12", "13", "14", "15", "16", "17", "18", "19",
    ]);
    expect(dddsForUf("DF").map((d) => d.ddd)).toEqual(["61"]);
  });
});

describe("ALL_DDDS", () => {
  it("está ordenado e toda entrada tem região", () => {
    expect(ALL_DDDS.length).toBeGreaterThan(60);
    expect(ALL_DDDS.every((d) => d.regiao && d.uf && d.ref)).toBe(true);
    const ordered = [...ALL_DDDS].sort((a, b) => a.ddd.localeCompare(b.ddd));
    expect(ALL_DDDS).toEqual(ordered);
  });
});
