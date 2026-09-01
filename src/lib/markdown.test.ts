// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown — GFM", () => {
  it("renders headings, tables and task lists", () => {
    const { html } = renderMarkdown(
      "# Título\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] feito\n- [ ] pendente",
    );
    expect(html).toContain("<h1>Título</h1>");
    expect(html).toContain("<table>");
    expect(html).toContain("<td>1</td>");
    expect(html).toMatch(/<input[^>]*type="checkbox"[^>]*>/);
    expect(html).toMatch(/<input[^>]*checked[^>]*>/);
  });

  it("keeps inline code escaped", () => {
    const { html } = renderMarkdown("use `a < b` aqui");
    expect(html).toContain("<code>a &lt; b</code>");
  });
});

describe("renderMarkdown — code highlighting", () => {
  it("adds hljs classes for a known language", () => {
    const { html } = renderMarkdown("```ts\nconst x: number = 1;\n```");
    expect(html).toContain('<code class="hljs language-ts">');
    expect(html).toContain("hljs-keyword");
  });

  it("escapes an unknown language block without crashing", () => {
    const { html } = renderMarkdown("```wat\n<b> & </b>\n```");
    expect(html).toContain('<code class="hljs">');
    expect(html).toContain("&lt;b&gt; &amp; &lt;/b&gt;");
  });
});

describe("renderMarkdown — mermaid", () => {
  it("turns a mermaid fence into a placeholder div and captures the source", () => {
    const src = "flowchart LR\n  A --> B";
    const { html, mermaidBlocks } = renderMarkdown("```mermaid\n" + src + "\n```");
    expect(html).toContain('<div class="mermaid" data-mermaid-index="0">');
    expect(mermaidBlocks).toEqual([src]);
  });

  it("indexes multiple mermaid blocks in order", () => {
    const { html, mermaidBlocks } = renderMarkdown(
      "```mermaid\nA\n```\n\ntexto\n\n```mermaid\nB\n```",
    );
    expect(mermaidBlocks).toEqual(["A", "B"]);
    expect(html).toContain('data-mermaid-index="0"');
    expect(html).toContain('data-mermaid-index="1"');
  });
});

describe("renderMarkdown — sanitization", () => {
  it("strips <script> and inline event handlers", () => {
    const { html } = renderMarkdown(
      "texto\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>",
    );
    expect(html).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("onerror");
  });

  it("neutralizes javascript: links", () => {
    const { html } = renderMarkdown("[clique](javascript:alert(1))");
    expect(html).not.toContain("javascript:alert");
  });
});
