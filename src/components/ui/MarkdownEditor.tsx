import { useEffect, useRef } from "react";
import Editor from "@toast-ui/editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import "@toast-ui/editor/dist/theme/toastui-editor-dark.css";
import codeSyntaxHighlight from "@toast-ui/editor-plugin-code-syntax-highlight";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-go";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-toml";
import "prismjs/components/prism-diff";
import { useTheme } from "../../hooks/useTheme";

const TOOLBAR = [
  ["heading", "bold", "italic", "strike"],
  ["hr", "quote"],
  ["ul", "ol", "task", "indent", "outdent"],
  ["table", "link", "image"],
  ["code", "codeblock"],
];

/**
 * Editor Markdown (Toast UI): alterna Markdown ↔ WYSIWYG, emite/consome Markdown
 * puro. Sem telemetria. Recriado ao trocar o tema.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (md: string) => void;
  placeholder?: string;
}) {
  const { dark } = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // (re)cria o editor quando o tema muda
  useEffect(() => {
    if (!hostRef.current) return;
    const ed = new Editor({
      el: hostRef.current,
      height: "100%",
      initialValue: value,
      initialEditType: "wysiwyg",
      previewStyle: "vertical",
      usageStatistics: false,
      theme: dark ? "dark" : "light",
      placeholder,
      autofocus: false,
      toolbarItems: TOOLBAR,
      plugins: [[codeSyntaxHighlight, { highlighter: Prism }]],
    });
    ed.on("change", () => onChangeRef.current(ed.getMarkdown()));
    editorRef.current = ed;
    return () => {
      ed.destroy();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dark]);

  // reflete mudanças externas de `value` (trocar de nota, "Formatar", importar)
  useEffect(() => {
    const ed = editorRef.current;
    if (ed && value !== ed.getMarkdown()) ed.setMarkdown(value, false);
  }, [value]);

  return (
    <div className="tui-host min-h-0 flex-1 overflow-hidden rounded-lg border border-line">
      <div ref={hostRef} className="h-full" />
      <style>{`
        .tui-host .toastui-editor-defaultUI { border: 0; }
        .tui-host .toastui-editor-defaultUI-toolbar { background: var(--color-surface-2); border-bottom: 1px solid var(--color-line); }
        .tui-host .toastui-editor-md-container,
        .tui-host .toastui-editor-ww-container { background: var(--color-surface); }
        .tui-host .toastui-editor-contents { font-family: var(--font-sans); font-size: 14px; }
        .tui-host .toastui-editor-contents pre,
        .tui-host .toastui-editor-contents code { font-family: var(--font-mono); }
        .tui-host .toastui-editor-mode-switch { background: var(--color-surface-2); border-top: 1px solid var(--color-line); }
        .tui-host .ProseMirror, .tui-host .toastui-editor-md-preview { color: var(--color-ink); }
      `}</style>
    </div>
  );
}
