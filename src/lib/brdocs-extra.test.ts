import { describe, it, expect } from "vitest";
import {
  isValidPis,
  generatePis,
  isValidTitulo,
  generateTitulo,
  isValidRenavam,
  generateRenavam,
  isValidCnh,
  generateCnh,
  validateExtra,
  generateExtra,
  EXTRA_DOCS,
} from "./brdocs-extra";

const flipLast = (s: string) => {
  const n = s.replace(/\D/g, "");
  return n.slice(0, -1) + ((Number(n.slice(-1)) + 1) % 10);
};

describe("PIS / PASEP", () => {
  it("gera válido; DV errado e repetido são rejeitados", () => {
    for (let i = 0; i < 30; i++) {
      const ok = generatePis();
      expect(isValidPis(ok)).toBe(true);
      expect(isValidPis(flipLast(ok))).toBe(false);
    }
    expect(isValidPis("11111111111")).toBe(false); // repetido
  });
});

describe("Título de Eleitor", () => {
  it("gera sempre válido; rejeita UF fora de 01–28", () => {
    for (let i = 0; i < 40; i++) expect(isValidTitulo(generateTitulo())).toBe(true);
    expect(isValidTitulo("000000000000")).toBe(false);
  });
});

describe("RENAVAM", () => {
  it("gera sempre válido", () => {
    for (let i = 0; i < 30; i++) expect(isValidRenavam(generateRenavam())).toBe(true);
    expect(isValidRenavam("00000000000")).toBe(false);
  });
});

describe("CNH", () => {
  it("gera sempre válido; rejeita dígitos repetidos", () => {
    for (let i = 0; i < 40; i++) expect(isValidCnh(generateCnh())).toBe(true);
    expect(isValidCnh("11111111111")).toBe(false);
  });
});

describe("fachada", () => {
  it("validateExtra/generateExtra fecham para todos os tipos", () => {
    for (const { id } of EXTRA_DOCS) {
      const gen = generateExtra(id);
      expect(validateExtra(id, gen).valid).toBe(true);
    }
  });
});
