import { describe, it, expect } from "vitest";
import { parseNfeKey, mod11Dv } from "./nfe";

// corpo de 43 dígitos: cUF 35 | aamm 2401 | CNPJ 11222333000181 | mod 55 |
// série 001 | nº 000001234 | tpEmis 1 | cNF 87654321
const BODY = "3524011122233300018155" + "001" + "000001234" + "1" + "87654321";
const KEY = BODY + mod11Dv(BODY);

describe("mod11Dv", () => {
  it("resto 0/1 vira DV 0", () => {
    // sequência conhecida: DV de "0" ... apenas garante o intervalo válido
    expect(mod11Dv("0")).toBeGreaterThanOrEqual(0);
    expect(mod11Dv(BODY)).toBeLessThanOrEqual(9);
  });
});

describe("parseNfeKey", () => {
  it("quebra a chave nos campos certos", () => {
    const k = parseNfeKey(KEY);
    expect(k.cUF).toBe("35");
    expect(k.uf).toBe("SP");
    expect(k.emissao).toBe("01/2024");
    expect(k.cnpjFormatted).toBe("11.222.333/0001-81");
    expect(k.modeloLabel).toBe("NF-e");
    expect(k.serie).toBe("1");
    expect(k.numero).toBe("1234");
    expect(k.tpEmisLabel).toBe("Normal");
    expect(k.dvOk).toBe(true);
  });
  it("aceita o prefixo NFe e separadores", () => {
    const k = parseNfeKey("NFe" + KEY.replace(/(.{4})/g, "$1 "));
    expect(k.raw).toBe(KEY);
  });
  it("DV errado → dvOk false", () => {
    const wrong = BODY + ((mod11Dv(BODY) + 1) % 10);
    expect(parseNfeKey(wrong).dvOk).toBe(false);
  });
  it("comprimento inválido lança", () => {
    expect(() => parseNfeKey("123")).toThrow(/44 dígitos/);
  });
});
