import { describe, it, expect } from "vitest";
import { escapeString, unescapeString, ESCAPE_TARGETS } from "./escape";

describe("escapeString / unescapeString", () => {
  it("json: escapa aspas e quebras, round-trip", () => {
    expect(escapeString('linha "1"\nlinha 2', "json")).toBe('linha \\"1\\"\\nlinha 2');
    expect(unescapeString('a\\tb\\"c', "json")).toBe('a\tb"c');
  });
  it("js/c: hex para controle, round-trip", () => {
    expect(escapeString("a\tb\n\x01", "js")).toBe("a\\tb\\n\\x01");
    expect(unescapeString("a\\tb\\x41", "c")).toBe("a\tbA");
  });
  it("shell: aspas simples POSIX", () => {
    expect(escapeString("it's ok", "shell")).toBe("'it'\\''s ok'");
    expect(unescapeString("'it'\\''s ok'", "shell")).toBe("it's ok");
  });
  it("sql: dobra aspas", () => {
    expect(escapeString("O'Brien", "sql")).toBe("O''Brien");
    expect(unescapeString("O''Brien", "sql")).toBe("O'Brien");
  });
  it("html: entidades e volta", () => {
    expect(escapeString('<a href="x">&', "html")).toBe("&lt;a href=&quot;x&quot;&gt;&amp;");
    expect(unescapeString("&lt;b&gt;&amp;&#39;&#x41;", "html")).toBe("<b>&'A");
  });
  it("url: encode/decode componente", () => {
    expect(escapeString("a b/c?d=1", "url")).toBe("a%20b%2Fc%3Fd%3D1");
    expect(unescapeString("a%20b%2Fc", "url")).toBe("a b/c");
  });
  it("regexp: escapa metacaracteres e volta", () => {
    expect(escapeString("a.b*c(d)", "regexp")).toBe("a\\.b\\*c\\(d\\)");
    expect(unescapeString("a\\.b\\*c", "regexp")).toBe("a.b*c");
  });
  it("csv: só cita quando precisa", () => {
    expect(escapeString("simples", "csv")).toBe("simples");
    expect(escapeString('a,"b"\nc', "csv")).toBe('"a,""b""\nc"');
    expect(unescapeString('"a,""b"""', "csv")).toBe('a,"b"');
  });
  it("erros legíveis em entrada inválida", () => {
    expect(() => unescapeString("%zz", "url")).toThrow();
    expect(() => unescapeString('bad\\', "json")).toThrow();
  });
  it("todos os alvos têm label", () => {
    expect(ESCAPE_TARGETS.every((t) => t.id && t.label)).toBe(true);
  });
});
