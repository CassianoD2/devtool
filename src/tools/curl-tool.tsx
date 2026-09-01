import { useMemo, useState } from "react";
import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { CodeArea } from "../components/ui/CodeArea";
import { Button, CopyButton, ErrorNote, Field, Segmented, Select } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { parseCurl, EXPORTERS, type ParsedRequest } from "../lib/curl";
import { sendRequest, prettyIfJson, type HttpResult } from "../lib/httpclient";

const SAMPLE = `curl -X POST 'https://httpbin.org/post?debug=1' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json' \\
  -d '{"nome":"DevTool","itens":[1,2,3]}'`;

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  PATCH: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

function statusTone(status: number): string {
  if (status >= 500) return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
  if (status >= 400) return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  if (status >= 300) return "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300";
  if (status >= 200) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  return "bg-surface-2 text-ink";
}

function KVTable({ rows }: { rows: [string, string][] }) {
  if (rows.length === 0) return <p className="px-3 py-2 text-sm text-faint">(nenhum)</p>;
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={i} className="border-b border-line last:border-0">
            <td className="px-3 py-1.5 font-mono font-medium text-accent align-top dark:text-indigo-400">{k}</td>
            <td className="px-3 py-1.5 font-mono break-all">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CurlTool() {
  const [command, setCommand] = useToolDraft("curl", "");
  const [view, setView] = useState<"parsed" | "export" | "response">("parsed");
  const [exporter, setExporter] = useState("fetch");
  const [response, setResponse] = useState<HttpResult | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const parsed = useMemo<{ req: ParsedRequest | null; error: string | null }>(() => {
    if (!command.trim()) return { req: null, error: null };
    try {
      return { req: parseCurl(command), error: null };
    } catch (err) {
      return { req: null, error: (err as Error).message };
    }
  }, [command]);

  const exportText = useMemo(() => {
    if (!parsed.req) return "";
    return EXPORTERS.find((e) => e.id === exporter)!.fn(parsed.req);
  }, [parsed.req, exporter]);

  async function send() {
    if (!parsed.req) return;
    setSending(true);
    setSendError(null);
    setView("response");
    try {
      setResponse(await sendRequest(parsed.req));
    } catch (err) {
      setResponse(null);
      setSendError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  const pretty = response ? prettyIfJson(response.body, response.contentType) : null;

  return (
    <ToolBody
      toolbar={
        <>
          <Button variant="primary" onClick={send} disabled={!parsed.req || sending}>
            {sending ? "Enviando…" : "▶ Enviar"}
          </Button>
          <Field label="Converter">
            <Select value={exporter} onChange={(e) => setExporter(e.currentTarget.value)}>
              {EXPORTERS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="ml-auto flex gap-1">
            <Button variant="ghost" onClick={() => setCommand(SAMPLE)}>Exemplo</Button>
            <Button variant="ghost" onClick={() => setCommand("")} disabled={!command}>Limpar</Button>
          </div>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <PaneHeading title="Comando cURL" />
          <textarea
            autoFocus
            value={command}
            onChange={(e) => setCommand(e.currentTarget.value)}
            placeholder="Cole um comando curl (ex.: 'Copiar como cURL' do DevTools)…"
            className="h-28 resize-y rounded-md border border-line-strong bg-surface-2 p-3 font-mono text-xs"
          />
        </div>

        {parsed.error && <ErrorNote message={parsed.error} />}

        {parsed.req && (
          <>
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${METHOD_COLORS[parsed.req.method] ?? "bg-surface-2 text-ink"}`}>
                {parsed.req.method}
              </span>
              <code className="min-w-0 flex-1 truncate font-mono text-sm">{parsed.req.url}</code>
              <Segmented
                value={view}
                onChange={setView}
                options={[
                  { value: "parsed", label: "Análise" },
                  { value: "export", label: "Conversão" },
                  { value: "response", label: "Resposta" },
                ]}
              />
            </div>

            {parsed.req.warnings.length > 0 && (
              <ul className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {parsed.req.warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            )}

            <div className="min-h-0 flex-1 overflow-auto rounded-md border border-line">
              {view === "parsed" && (
                <div className="divide-y divide-line">
                  <div>
                    <div className="bg-surface-2 px-3 py-1.5 text-xs font-semibold uppercase text-muted">Headers</div>
                    <KVTable rows={parsed.req.headers} />
                  </div>
                  {parsed.req.auth && (
                    <div className="px-3 py-2 text-sm">
                      <span className="text-muted">Auth básica: </span>
                      <code className="font-mono">{parsed.req.auth.user}:{"•".repeat(parsed.req.auth.pass.length)}</code>
                    </div>
                  )}
                  <div>
                    <div className="bg-surface-2 px-3 py-1.5 text-xs font-semibold uppercase text-muted">Corpo</div>
                    <pre className="max-h-64 overflow-auto px-3 py-2 font-mono text-xs whitespace-pre-wrap">
                      {parsed.req.body || "(vazio)"}
                    </pre>
                  </div>
                </div>
              )}

              {view === "export" && (
                <div className="relative h-full">
                  <div className="absolute right-2 top-2 z-10">
                    <CopyButton value={exportText} />
                  </div>
                  <pre className="h-full overflow-auto p-3 font-mono text-xs whitespace-pre-wrap">{exportText}</pre>
                </div>
              )}

              {view === "response" && (
                <div className="flex h-full flex-col">
                  {sending && <p className="p-3 text-sm text-faint">Enviando…</p>}
                  {sendError && <div className="p-3"><ErrorNote message={sendError} /></div>}
                  {response && !sending && (
                    <>
                      <div className="flex flex-wrap items-center gap-3 border-b border-line px-3 py-2 text-sm">
                        <span className={`rounded px-2 py-0.5 font-bold ${statusTone(response.status)}`}>
                          {response.status} {response.statusText}
                        </span>
                        <span className="text-muted">{response.timeMs} ms</span>
                        <span className="text-muted">{(response.size / 1024).toFixed(1)} KB</span>
                        <span className="text-faint">{response.contentType}</span>
                        <div className="ml-auto"><CopyButton value={pretty?.text ?? response.body} /></div>
                      </div>
                      <details className="border-b border-line">
                        <summary className="cursor-pointer px-3 py-1.5 text-xs font-semibold uppercase text-muted">
                          Headers da resposta ({response.headers.length})
                        </summary>
                        <KVTable rows={response.headers} />
                      </details>
                      <div className="flex min-h-0 flex-1 flex-col p-2">
                        <CodeArea value={pretty?.text ?? ""} language={pretty?.lang ?? "text"} readOnly />
                      </div>
                    </>
                  )}
                  {!response && !sending && !sendError && (
                    <p className="p-3 text-sm text-faint">Clique em “Enviar” para disparar a requisição.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ToolBody>
  );
}
