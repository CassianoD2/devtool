import { describe, it, expect } from "vitest";
import { slugify, slugifyLines } from "./slugify";

describe("slugify", () => {
  it("remove acentos e espaços por padrão", () => {
    expect(slugify("Olá, Mundo Cruel!")).toBe("ola-mundo-cruel");
    expect(slugify("São Paulo — Brasil")).toBe("sao-paulo-brasil");
  });
  it("colapsa e apara o separador", () => {
    expect(slugify("  a   b  ")).toBe("a-b");
    expect(slugify("---a---b---")).toBe("a-b");
  });
  it("respeita separador customizado", () => {
    expect(slugify("foo bar baz", { separator: "_" })).toBe("foo_bar_baz");
  });
  it("mantém caixa quando lowercase=false", () => {
    expect(slugify("Foo Bar", { lowercase: false })).toBe("Foo-Bar");
  });
  it("modo não-estrito mantém . _ ~", () => {
    expect(slugify("v1.2.3_final", { strict: false })).toBe("v1.2.3_final");
    expect(slugify("v1.2.3_final")).toBe("v1-2-3-final");
  });
  it("aplica maxLength sem deixar separador solto no fim", () => {
    expect(slugify("uma frase bem grande aqui", { maxLength: 8 })).toBe("uma-fras");
    expect(slugify("abcde fghij", { maxLength: 6 })).toBe("abcde");
  });
  it("transliteração de ß/æ/ø", () => {
    expect(slugify("Straße")).toBe("strasse");
  });
  it("slugifyLines preserva linhas em branco", () => {
    expect(slugifyLines("Título Um\n\nOutro Título")).toBe("titulo-um\n\noutro-titulo");
  });
});
