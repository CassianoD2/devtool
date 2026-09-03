import { describe, it, expect } from "vitest";
import { formatSql, minifySql } from "./sqlfmt";

describe("formatSql", () => {
  it("quebra e indenta, keywords em maiúsculas por padrão", () => {
    const out = formatSql("select id,nome from users where ativo=1 order by nome");
    expect(out).toContain("SELECT");
    expect(out).toContain("FROM\n  users");
    expect(out).toContain("WHERE");
    expect(out.split("\n").length).toBeGreaterThan(3);
  });
  it("respeita keywordCase lower e dialeto", () => {
    const out = formatSql("SELECT 1", { keywordCase: "lower", language: "postgresql" });
    expect(out).toBe("select\n  1");
  });
  it("erro legível em SQL sem sentido de tokenização", () => {
    expect(() => formatSql("SELECT 'aberto")).toThrow(/formatar/i);
  });
});

describe("minifySql", () => {
  it("colapsa espaços e remove comentários", () => {
    const src = "SELECT  a,\n  b -- coluna\nFROM   t /* tabela */ WHERE x = 1 ;";
    expect(minifySql(src)).toBe("SELECT a,b FROM t WHERE x = 1;");
  });
});
