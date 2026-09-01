import { useState } from "react";
import { ToolBody, TwoPane, PaneHeading } from "../components/ToolLayout";
import { CodeArea } from "../components/ui/CodeArea";
import { Button, CopyButton, ErrorNote, Segmented } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { encodeUrlComponent, decodeUrlComponent, parseQuery } from "../lib/url";

const SAMPLE = "https://api.exemplo.com/busca?q=são paulo&page=2&tags=a,b#top";

export function UrlTool() {
  const [input, setInput] = useToolDraft("url-tool");
  const [mode, setMode] = useState<"encode" | "decode" | "query">("query");

  let output = "";
  let params: { key: string; value: string }[] = [];
  let base: string | undefined;
  let error: string | null = null;
  try {
    if (input.trim()) {
      if (mode === "encode") output = encodeUrlComponent(input);
      else if (mode === "decode") output = decodeUrlComponent(input);
      else {
        const parsed = parseQuery(input);
        params = parsed.params;
        base = parsed.base;
      }
    }
  } catch (err) {
    error = (err as Error).message;
  }

  return (
    <ToolBody
      toolbar={
        <>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "query", label: "Query string" },
              { value: "encode", label: "Codificar" },
              { value: "decode", label: "Decodificar" },
            ]}
          />
          <div className="ml-auto flex gap-1">
            <Button variant="ghost" onClick={() => setInput(SAMPLE)}>
              Exemplo
            </Button>
            <Button variant="ghost" onClick={() => setInput("")} disabled={!input}>
              Limpar
            </Button>
          </div>
        </>
      }
    >
      <TwoPane
        storageKey="url"
        left={
          <>
            <PaneHeading title="Entrada" />
            <CodeArea value={input} onChange={setInput} placeholder="URL ou texto…" />
          </>
        }
        right={
          mode === "query" ? (
            <>
              <PaneHeading title="Parâmetros" />
              {error ? (
                <ErrorNote message={error} />
              ) : (
                <div className="min-h-0 flex-1 overflow-auto rounded-md border border-line">
                  {base && (
                    <div className="border-b border-line px-3 py-2 text-xs text-muted">
                      base: <span className="font-mono">{base}</span>
                    </div>
                  )}
                  <table className="w-full text-sm">
                    <tbody>
                      {params.map((p, i) => (
                        <tr
                          key={i}
                          className="border-b border-line last:border-0"
                        >
                          <td className="w-1/3 px-3 py-1.5 font-mono font-medium text-accent">
                            {p.key}
                          </td>
                          <td className="px-3 py-1.5 font-mono break-all">{p.value}</td>
                        </tr>
                      ))}
                      {params.length === 0 && (
                        <tr>
                          <td className="px-3 py-2 text-faint">
                            Nenhum parâmetro.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              <PaneHeading title="Saída" actions={<CopyButton value={output} />} />
              {error ? (
                <ErrorNote message={error} />
              ) : (
                <CodeArea value={output} readOnly />
              )}
            </>
          )
        }
      />
    </ToolBody>
  );
}
