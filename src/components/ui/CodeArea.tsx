import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import type { Extension } from "@codemirror/state";
import { useDark } from "../../hooks/useDark";

export type CodeLang = "json" | "xml" | "yaml" | "text";

function langExtension(lang: CodeLang): Extension[] {
  switch (lang) {
    case "json":
      return [json()];
    case "xml":
      return [xml()];
    case "yaml":
      return [yaml()];
    default:
      return [];
  }
}

export function CodeArea({
  value,
  onChange,
  language = "text",
  readOnly = false,
  placeholder,
}: {
  value: string;
  onChange?: (value: string) => void;
  language?: CodeLang;
  readOnly?: boolean;
  placeholder?: string;
}) {
  const dark = useDark();
  const extensions = useMemo(
    () => [...langExtension(language), EditorView.lineWrapping],
    [language],
  );

  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-line bg-surface">
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={dark ? "dark" : "light"}
        extensions={extensions}
        editable={!readOnly}
        readOnly={readOnly}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          foldGutter: language !== "text",
          highlightActiveLine: !readOnly,
          autocompletion: false,
        }}
        height="100%"
        style={{ height: "100%" }}
      />
    </div>
  );
}
