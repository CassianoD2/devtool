import { marked, type Tokens } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import jsonLang from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import sql from "highlight.js/lib/languages/sql";
import yamlLang from "highlight.js/lib/languages/yaml";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import diffLang from "highlight.js/lib/languages/diff";
import markdownLang from "highlight.js/lib/languages/markdown";

let languagesReady = false;
function ensureLanguages() {
  if (languagesReady) return;
  const langs: [string, unknown][] = [
    ["javascript", javascript],
    ["typescript", typescript],
    ["json", jsonLang],
    ["bash", bash],
    ["python", python],
    ["rust", rust],
    ["css", css],
    ["xml", xml], // cobre html também (alias)
    ["sql", sql],
    ["yaml", yamlLang],
    ["go", go],
    ["java", java],
    ["c", c],
    ["cpp", cpp],
    ["dockerfile", dockerfile],
    ["diff", diffLang],
    ["markdown", markdownLang],
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const [name, def] of langs) hljs.registerLanguage(name, def as any);
  languagesReady = true;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface MarkdownRenderResult {
  html: string;
  /** fonte crua de cada bloco ```mermaid, na ordem em que aparecem */
  mermaidBlocks: string[];
}

/** Markdown (GFM) -> HTML sanitizado. Blocos ```mermaid viram <div class="mermaid">
 *  (renderizados depois, no DOM, por quem chamar mermaid.run); demais blocos de
 *  código ganham realce de sintaxe via highlight.js quando a linguagem é conhecida. */
export function renderMarkdown(source: string): MarkdownRenderResult {
  ensureLanguages();
  const mermaidBlocks: string[] = [];

  const renderer = new marked.Renderer();
  renderer.code = ({ text, lang }: Tokens.Code): string => {
    const language = (lang ?? "").trim().split(/\s+/)[0]?.toLowerCase();
    if (language === "mermaid") {
      const index = mermaidBlocks.length;
      mermaidBlocks.push(text);
      return `<div class="mermaid" data-mermaid-index="${index}">${escapeHtml(text)}</div>`;
    }
    if (language && hljs.getLanguage(language)) {
      const value = hljs.highlight(text, { language }).value;
      return `<pre><code class="hljs language-${language}">${value}</code></pre>`;
    }
    return `<pre><code class="hljs">${escapeHtml(text)}</code></pre>`;
  };

  const rawHtml = marked.parse(source, {
    renderer,
    gfm: true,
    breaks: false,
    async: false,
  }) as string;

  const html = DOMPurify.sanitize(rawHtml);
  return { html, mermaidBlocks };
}

export const MARKDOWN_SAMPLE = `# DevTool Markdown

Suporte a **GFM**, blocos de código com _highlight_ e diagramas **Mermaid** —
tudo renderizado localmente, offline.

## Lista de tarefas

- [x] Parser com \`marked\`
- [x] Sanitização com \`DOMPurify\`
- [ ] Exportar para PDF

## Tabela

| Ferramenta | Categoria         |
| ---------- | ----------------- |
| JSON       | Formatadores       |
| cURL       | Sistemas & Rede    |
| PIX        | Consultas BR       |

## Código

\`\`\`ts
function saudacao(nome: string) {
  return \`Olá, \${nome}!\`;
}
\`\`\`

## Diagrama

\`\`\`mermaid
flowchart LR
  A[Editar Markdown] --> B{Tem bloco mermaid?}
  B -- Sim --> C[Renderizar SVG]
  B -- Não --> D[Só HTML]
\`\`\`

> Cole seu próprio \`.md\` aqui — nada sai da sua máquina.
`;
