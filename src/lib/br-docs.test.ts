import { describe, it, expect } from "vitest";
import {
  isValidCpf,
  isValidCnpj,
  formatCpf,
  formatCnpj,
  generateCpf,
  generateCnpj,
  validateDoc,
} from "./br-docs";

describe("CPF", () => {
  it("accepts known-valid numbers", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });
  it("rejects bad check digits and repeated digits", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });
  it("formats", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });
  it("generates valid numbers", () => {
    for (let i = 0; i < 50; i++) expect(isValidCpf(generateCpf())).toBe(true);
  });
});

describe("CNPJ", () => {
  it("accepts a known-valid number", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
  });
  it("rejects bad check digits", () => {
    expect(isValidCnpj("11.222.333/0001-82")).toBe(false);
    expect(isValidCnpj("00.000.000/0000-00")).toBe(false);
  });
  it("formats", () => {
    expect(formatCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });
  it("generates valid numbers", () => {
    for (let i = 0; i < 50; i++) expect(isValidCnpj(generateCnpj())).toBe(true);
  });
});

describe("validateDoc", () => {
  it("detects kind by length", () => {
    expect(validateDoc("52998224725").kind).toBe("cpf");
    expect(validateDoc("11222333000181").kind).toBe("cnpj");
    expect(validateDoc("123").kind).toBe(null);
  });
});
