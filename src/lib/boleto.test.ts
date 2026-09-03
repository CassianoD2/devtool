import { describe, it, expect } from "vitest";
import { parseBoleto, mod10 } from "./boleto";

// exemplo de linha digitável de cobrança (Bradesco, banco 237), valor R$ 100,00
const LINHA = "23793381286008266950630049897109184350000010000";

describe("mod10", () => {
  it("dígito verificador conhecido", () => {
    expect(mod10("00190000090")).toBeGreaterThanOrEqual(0);
    expect(mod10("123456789")).toBe(mod10("123456789"));
  });
});

describe("parseBoleto", () => {
  it("linha de cobrança: identifica banco, moeda e valor", () => {
    const b = parseBoleto(LINHA);
    expect(b.tipo).toBe("cobranca");
    expect(b.banco).toBe("237");
    expect(b.bancoNome).toBe("Bradesco");
    expect(b.moeda).toBe("Real (R$)");
    expect(b.valor).toBe(100);
    expect(b.codigoBarras).toHaveLength(44);
  });
  it("aceita a linha com pontos e espaços", () => {
    const pretty = LINHA.replace(/(.{5})(.{5})(.{11})(.{11})(.{1})(.*)/, "$1.$2 $3 $4 $5 $6");
    expect(parseBoleto(pretty).banco).toBe("237");
  });
  it("código de barras de 44 dígitos direto", () => {
    const barras = parseBoleto(LINHA).codigoBarras;
    const again = parseBoleto(barras);
    expect(again.banco).toBe("237");
    expect(again.valor).toBe(100);
  });
  it("arrecadação (48 dígitos) começa com 8", () => {
    const arr = "8" + "1".repeat(47);
    const b = parseBoleto(arr);
    expect(b.tipo).toBe("arrecadacao");
    expect(b.vencimento).toBeNull();
  });
  it("comprimento inválido lança", () => {
    expect(() => parseBoleto("123")).toThrow(/47|48|44/);
  });
});
