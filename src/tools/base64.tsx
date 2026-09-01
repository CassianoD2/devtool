import { useState } from "react";
import { ToolBody, TwoPane, PaneHeading } from "../components/ToolLayout";
import { CodeArea } from "../components/ui/CodeArea";
import {
  Button,
  Checkbox,
  CopyButton,
  ErrorNote,
  Segmented,
} from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { encodeBase64, decodeBase64, bytesToBase64 } from "../lib/base64";

export function Base64Tool() {
  const [input, setInput] = useToolDraft("base64");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [urlSafe, setUrlSafe] = useState(false);

  let output = "";
  let error: string | null = null;
  try {
    if (input.trim()) {
      output = mode === "encode" ? encodeBase64(input, urlSafe) : decodeBase64(input);
    }
  } catch (err) {
    error = (err as Error).message;
  }

  async function loadFile(file: File) {
    const buf = new Uint8Array(await file.arrayBuffer());
    setInput(bytesToBase64(buf));
    setMode("decode");
  }

  return (
    <ToolBody
      toolbar={
        <>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "encode", label: "Codificar" },
              { value: "decode", label: "Decodificar" },
            ]}
          />
          {mode === "encode" && (
            <Checkbox label="URL-safe" checked={urlSafe} onChange={setUrlSafe} />
          )}
          <label className="cursor-pointer">
            <span className="inline-flex items-center rounded-md bg-surface-2 px-2.5 py-1.5 text-sm font-medium text-ink hover:bg-surface-2 hover:border-line-strong border border-line">
              Arquivo → Base64
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                if (f) void loadFile(f);
                e.currentTarget.value = "";
              }}
            />
          </label>
          <div className="ml-auto">
            <Button variant="ghost" onClick={() => setInput("")} disabled={!input}>
              Limpar
            </Button>
          </div>
        </>
      }
    >
      <TwoPane
        storageKey="base64"
        left={
          <>
            <PaneHeading title={mode === "encode" ? "Texto" : "Base64"} />
            <CodeArea
              value={input}
              onChange={setInput}
              placeholder={mode === "encode" ? "Texto a codificar…" : "Base64 a decodificar…"}
            />
          </>
        }
        right={
          <>
            <PaneHeading
              title={mode === "encode" ? "Base64" : "Texto"}
              actions={<CopyButton value={output} />}
            />
            {error ? <ErrorNote message={error} /> : <CodeArea value={output} readOnly />}
          </>
        }
      />
    </ToolBody>
  );
}
