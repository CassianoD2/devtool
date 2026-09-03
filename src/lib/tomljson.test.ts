import { describe, it, expect } from "vitest";
import { tomlToJson, jsonToToml, formatToml } from "./tomljson";

const TOML = `title = "DevTool"
[owner]
name = "Cassiano"
[deps]
react = "19"`;

describe("tomlToJson", () => {
  it("converte tabelas aninhadas", () => {
    expect(JSON.parse(tomlToJson(TOML))).toEqual({
      title: "DevTool",
      owner: { name: "Cassiano" },
      deps: { react: "19" },
    });
  });
  it("erro legível em TOML inválido", () => {
    expect(() => tomlToJson("x = ")).toThrow(/TOML inválido/);
  });
});

describe("jsonToToml", () => {
  it("objeto → TOML e round-trip", () => {
    const out = jsonToToml('{"a":1,"b":{"c":true}}');
    expect(out).toContain("a = 1");
    expect(JSON.parse(tomlToJson(out))).toEqual({ a: 1, b: { c: true } });
  });
  it("rejeita array/escalar no topo", () => {
    expect(() => jsonToToml("[1,2]")).toThrow(/tabela/);
    expect(() => jsonToToml("nope")).toThrow(/JSON inválido/);
  });
});

describe("formatToml", () => {
  it("normaliza espaçamento", () => {
    expect(formatToml('a="1"')).toBe('a = "1"\n');
  });
});
