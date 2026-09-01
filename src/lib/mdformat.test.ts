import { describe, it, expect } from "vitest";
import { formatMarkdown } from "./mdformat";

describe("formatMarkdown", () => {
  it("normaliza o documento Markdown", async () => {
    const out = await formatMarkdown("#   Título\n\n\n\n-    um\n-  dois\n");
    expect(out).toBe("# Título\n\n- um\n- dois\n");
  });

  it("formata código embutido nas cercas (js)", async () => {
    const src = "texto\n\n```js\nconst x   =1\n```\n";
    const out = await formatMarkdown(src);
    expect(out).toContain("const x = 1;");
  });

  it("deixa linguagem desconhecida intacta", async () => {
    const src = "```rust\nfn  main( ){}\n```\n";
    const out = await formatMarkdown(src);
    expect(out).toContain("fn  main( ){}");
  });

  it("é idempotente para entrada já formatada", async () => {
    const good = "# A\n\nParágrafo.\n\n- x\n- y\n";
    expect(await formatMarkdown(good)).toBe(good);
  });

  it("código embutido inválido não quebra — o bloco fica intacto", async () => {
    const src = "```js\nconst = = =\n```\n";
    const out = await formatMarkdown(src);
    expect(out).toContain("const = = =");
  });

  it("string vazia passa direto", async () => {
    expect(await formatMarkdown("")).toBe("");
  });
});
