import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { CodeArea } from "../../components/ui/CodeArea";
import { Button, CopyButton, ErrorNote, Segmented } from "../../components/ui/primitives";
import { useToast } from "../../components/ui/Toast";
import { prettyIfJson, type HttpResult } from "../../lib/httpclient";
import { filterBodyLines, saveResponseFile } from "../../lib/apiclient-backup";
import { statusTone } from "./shared";

export function ResponseViewer({
  response,
  error,
  sending,
  url,
  bodyView,
  setBodyView,
}: {
  response: HttpResult | null;
  error: string | null;
  sending: boolean;
  url: string;
  bodyView: "pretty" | "raw";
  setBodyView: (v: "pretty" | "raw") => void;
}) {
  const toast = useToast();
  const [resTab, setResTab] = useState<"body" | "headers">("body");
  const [search, setSearch] = useState("");

  const pretty = useMemo(
    () => (response ? prettyIfJson(response.body, response.contentType) : null),
    [response],
  );

  const shownText = bodyView === "raw" ? (response?.body ?? "") : (pretty?.text ?? "");
  const shownLang = bodyView === "raw" ? "text" : (pretty?.lang ?? "text");
  const filtered = useMemo(() => filterBodyLines(shownText, search), [shownText, search]);

  async function onSave() {
    if (!response) return;
    try {
      const r = await saveResponseFile(response.body, response.contentType, url);
      if (r === "saved") toast("Resposta salva");
      else if (r === "copied") toast("Resposta copiada (JSON)");
    } catch (err) {
      toast((err as Error).message || "Falha ao salvar", "error");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 pt-1">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {sending && <span className="text-faint">Enviando…</span>}
        {error && !sending && <span className="text-red-600">{error}</span>}
        {response && !sending && (
          <>
            <span className={`rounded px-2 py-0.5 font-bold ${statusTone(response.status)}`}>
              {response.status} {response.statusText}
            </span>
            <span className="text-muted">{response.timeMs} ms</span>
            <span className="text-muted">{(response.size / 1024).toFixed(1)} KB</span>
            <span className="truncate text-faint">{response.contentType}</span>
            <div className="ml-auto flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={onSave}>
                <Save size={14} />
                Salvar
              </Button>
              <CopyButton value={bodyView === "raw" ? response.body : (pretty?.text ?? response.body)} />
            </div>
          </>
        )}
        {!response && !sending && !error && (
          <span className="text-faint">A resposta aparece aqui.</span>
        )}
      </div>

      {response && !sending && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              value={resTab}
              onChange={setResTab}
              options={[
                { value: "body", label: "Body" },
                { value: "headers", label: `Headers (${response.headers.length})` },
              ]}
            />
            {resTab === "body" && (
              <>
                <Segmented
                  value={bodyView}
                  onChange={setBodyView}
                  options={[
                    { value: "pretty", label: "Formatado" },
                    { value: "raw", label: "Bruto" },
                  ]}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  placeholder="filtrar linhas…"
                  className="h-8 min-w-[140px] flex-1 rounded-md border border-line-strong bg-surface-2 px-2.5 text-sm"
                />
                {search.trim() && (
                  <span className="text-xs text-faint">{filtered.matches} ocorrência(s)</span>
                )}
              </>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-auto rounded-md border border-line">
            {resTab === "body" ? (
              <CodeArea
                value={search.trim() ? filtered.text : shownText}
                language={shownLang}
                readOnly
              />
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {response.headers.map(([k, v], i) => (
                    <tr key={i} className="border-b border-line last:border-0">
                      <td className="px-3 py-1.5 font-mono font-medium text-accent">{k}</td>
                      <td className="px-3 py-1.5 font-mono break-all">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {error && !sending && <ErrorNote message={error} />}
    </div>
  );
}
