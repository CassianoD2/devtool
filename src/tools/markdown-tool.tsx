import { useEffect, useMemo, useRef, useState } from "react";
import mermaid from "mermaid";
import { Sparkles } from "lucide-react";
import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { SplitPane } from "../components/ui/SplitPane";
import { MarkdownEditor } from "../components/ui/MarkdownEditor";
import { Button, CopyButton, ErrorNote, Segmented } from "../components/ui/primitives";
import { useToast } from "../components/ui/Toast";
import { useToolDraft } from "../hooks/useToolDraft";
import { useTheme } from "../hooks/useTheme";
import { renderMarkdown, MARKDOWN_SAMPLE } from "../lib/markdown";

type View = "split" | "preview" | "editor";

export function MarkdownTool() {
  const [source, setSource] = useToolDraft("markdown", "");
  const [view, setView] = useState<View>("split");
  const [fmtError, setFmtError] = useState<string | null>(null);
  const { dark } = useTheme();
  const toast = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

  async function format() {
    setFmtError(null);
    try {
      const { formatMarkdown } = await import("../lib/mdformat");
      setSource(await formatMarkdown(source));
      toast("Formatado");
    } catch (err) {
      setFmtError((err as Error).message);
    }
  }

  // parse é barato; o custo é o mermaid.run, então debouncamos a fonte
  const [debounced, setDebounced] = useState(source);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(source), 200);
    return () => clearTimeout(t);
  }, [source]);

  const { html, mermaidBlocks } = useMemo(
    () => (debounced.trim() ? renderMarkdown(debounced) : { html: "", mermaidBlocks: [] }),
    [debounced],
  );

  // injeta o HTML e roda o mermaid nos blocos, re-render ao trocar o tema
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    el.innerHTML = html;
    if (mermaidBlocks.length === 0) return;

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: dark ? "dark" : "default",
      fontFamily: "inherit",
    });
    const nodes = Array.from(el.querySelectorAll<HTMLElement>(".mermaid"));
    // mermaid já renderiza um diagrama de erro inline por bloco inválido
    mermaid.run({ nodes }).catch(() => {});
  }, [html, mermaidBlocks.length, dark]);

  const editor = (
    <div className="flex h-full min-h-0 flex-col gap-1.5">
      <PaneHeading title="Markdown" />
      <MarkdownEditor
        value={source}
        onChange={setSource}
        placeholder="Escreva ou cole Markdown (GFM, ```mermaid, ```ts …)"
      />
    </div>
  );

  const preview = (
    <div className="flex h-full min-h-0 flex-col gap-1.5">
      <PaneHeading
        title="Preview"
        actions={html ? <CopyButton value={html} label="HTML" /> : undefined}
      />
      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-line bg-surface">
        {html ? (
          <div ref={previewRef} className="md-prose px-5 py-4" />
        ) : (
          <p className="px-5 py-4 text-sm text-faint">O preview aparece aqui.</p>
        )}
      </div>
    </div>
  );

  return (
    <ToolBody
      toolbar={
        <>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "split", label: "Editor + Preview" },
              { value: "preview", label: "Só preview" },
              { value: "editor", label: "Só editor" },
            ]}
          />
          <div className="ml-auto flex gap-1">
            <Button variant="ghost" onClick={format} disabled={!source.trim()}>
              <Sparkles size={14} />
              Formatar
            </Button>
            <Button variant="ghost" onClick={() => setSource(MARKDOWN_SAMPLE)}>
              Exemplo
            </Button>
            <Button variant="ghost" onClick={() => setSource("")} disabled={!source}>
              Limpar
            </Button>
          </div>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-2">
        {fmtError && <ErrorNote message={fmtError} />}
        <div className="min-h-0 flex-1">
          {view === "split" ? (
            <SplitPane storageKey="markdown" className="h-full" first={editor} second={preview} />
          ) : view === "editor" ? (
            editor
          ) : (
            preview
          )}
        </div>
      </div>

      <style>{`
        .md-prose { color: var(--color-ink); font-size: 14px; line-height: 1.7; }
        .md-prose > :first-child { margin-top: 0; }
        .md-prose h1, .md-prose h2, .md-prose h3, .md-prose h4 {
          font-weight: 650; line-height: 1.25; margin: 1.6em 0 .6em; color: var(--color-ink);
        }
        .md-prose h1 { font-size: 1.6em; }
        .md-prose h2 { font-size: 1.3em; padding-bottom: .25em; border-bottom: 1px solid var(--color-line); }
        .md-prose h3 { font-size: 1.1em; }
        .md-prose p, .md-prose ul, .md-prose ol, .md-prose blockquote, .md-prose table, .md-prose pre { margin: .8em 0; }
        .md-prose ul, .md-prose ol { padding-left: 1.5em; }
        .md-prose li { margin: .25em 0; }
        .md-prose li > input[type="checkbox"] { margin-right: .5em; accent-color: var(--color-accent); }
        .md-prose a { color: var(--color-accent); text-decoration: underline; text-underline-offset: 2px; }
        .md-prose strong { font-weight: 650; color: var(--color-ink); }
        .md-prose blockquote {
          border-left: 3px solid var(--color-accent); padding: .2em 0 .2em 1em;
          color: var(--color-muted); background: color-mix(in oklab, var(--color-accent) 6%, transparent);
          border-radius: 0 4px 4px 0;
        }
        .md-prose hr { border: 0; border-top: 1px solid var(--color-line); margin: 1.5em 0; }
        .md-prose code {
          font-family: var(--font-mono); font-size: .88em;
          background: var(--color-inset); border: 1px solid var(--color-line);
          padding: .12em .38em; border-radius: 4px;
        }
        .md-prose pre {
          background: var(--color-inset); border: 1px solid var(--color-line);
          border-radius: 8px; padding: .9em 1em; overflow-x: auto;
        }
        .md-prose pre code { background: none; border: 0; padding: 0; font-size: 12.5px; line-height: 1.6; }
        .md-prose table { border-collapse: collapse; display: block; overflow-x: auto; }
        .md-prose th, .md-prose td { border: 1px solid var(--color-line); padding: .45em .75em; text-align: left; }
        .md-prose th { background: var(--color-surface-2); font-weight: 600; }
        .md-prose img { max-width: 100%; border-radius: 6px; }
        .md-prose .mermaid { display: flex; justify-content: center; margin: 1em 0; }
        .md-prose .mermaid svg { max-width: 100%; height: auto; }
        /* highlight.js — tokens do app */
        .md-prose .hljs-comment, .md-prose .hljs-quote { color: var(--color-faint); font-style: italic; }
        .md-prose .hljs-keyword, .md-prose .hljs-selector-tag, .md-prose .hljs-literal,
        .md-prose .hljs-section, .md-prose .hljs-link { color: var(--color-accent); }
        .md-prose .hljs-string, .md-prose .hljs-attr, .md-prose .hljs-addition { color: #2f9e44; }
        .md-prose .hljs-number, .md-prose .hljs-built_in, .md-prose .hljs-meta,
        .md-prose .hljs-deletion { color: #e8590c; }
        .md-prose .hljs-title, .md-prose .hljs-name, .md-prose .hljs-type { color: var(--color-ink); font-weight: 600; }
        .md-prose .hljs-variable, .md-prose .hljs-template-variable, .md-prose .hljs-attribute { color: var(--color-muted); }
      `}</style>
    </ToolBody>
  );
}
