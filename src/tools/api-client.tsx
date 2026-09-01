import { useEffect, useMemo, useRef, useState } from "react";
import { CodeArea } from "../components/ui/CodeArea";
import { SplitPane } from "../components/ui/SplitPane";
import {
  Button,
  CopyButton,
  ErrorNote,
  Segmented,
  Select,
} from "../components/ui/primitives";
import { useToast } from "../components/ui/Toast";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { copyToClipboard } from "../lib/clipboard";
import { parseCurl, toCurl } from "../lib/curl";
import {
  emptyKV,
  emptyRequest,
  getQueryParams,
  listVarNames,
  METHODS,
  setQueryParams,
  specFromParsed,
  toSendable,
  type KV,
  type RequestSpec,
} from "../lib/apiclient";
import { prettyIfJson, sendRequest, type HttpResult } from "../lib/httpclient";

const inputCls =
 "rounded-md border border-line bg-surface px-2 py-1.5 text-sm";

interface HistoryEntry {
  id: string;
  method: string;
  url: string;
  status: number;
  at: number;
}

const METHOD_TONE: Record<string, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-blue-600 dark:text-blue-400",
  PUT: "text-amber-600 dark:text-amber-400",
  PATCH: "text-amber-600 dark:text-amber-400",
  DELETE: "text-red-600 dark:text-red-400",
};

function statusTone(s: number): string {
  if (s >= 500) return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
  if (s >= 400) return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  if (s >= 300) return "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300";
  if (s >= 200) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  return "bg-surface-2 text-ink";
}

// --- editable key/value table ---------------------------------------------

function KVEditor({
  rows,
  onChange,
  withToggle = true,
}: {
  rows: KV[];
  onChange: (rows: KV[]) => void;
  withToggle?: boolean;
}) {
  const withBlank = rows.some((r) => !r.key && !r.value) ? rows : [...rows, emptyKV()];
  const patch = (id: string, p: Partial<KV>) => {
    let next = withBlank.map((r) => (r.id === id ? { ...r, ...p } : r));
    if (next.every((r) => r.key || r.value)) next = [...next, emptyKV()];
    onChange(next);
  };
  const remove = (id: string) => {
    const next = withBlank.filter((r) => r.id !== id);
    onChange(next.length ? next : [emptyKV()]);
  };
  return (
    <table className="w-full text-sm">
      <tbody>
        {withBlank.map((r) => (
          <tr key={r.id} className="border-b border-line last:border-0">
            {withToggle && (
              <td className="w-8 px-2 py-1 text-center">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--color-accent)]"
                  checked={r.enabled}
                  onChange={(e) => patch(r.id, { enabled: e.currentTarget.checked })}
                />
              </td>
            )}
            <td className="py-1 pr-1">
              <input
                value={r.key}
                onChange={(e) => patch(r.id, { key: e.currentTarget.value })}
                placeholder="chave"
                className={`w-full font-mono ${inputCls}`}
              />
            </td>
            <td className="py-1 pr-1">
              <input
                value={r.value}
                onChange={(e) => patch(r.id, { value: e.currentTarget.value })}
                placeholder="valor"
                className={`w-full font-mono ${inputCls}`}
              />
            </td>
            <td className="w-8 px-1 text-center">
              <button
                onClick={() => remove(r.id)}
                className="text-faint hover:text-red-500"
                aria-label="remover"
              >
                ✕
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// --- main ----------------------------------------------------------------

export function ApiClient() {
  const toast = useToast();
  const [spec, setSpec] = useLocalStorage<RequestSpec>("apiclient:current", emptyRequest());
  const [saved, setSaved] = useLocalStorage<RequestSpec[]>("apiclient:saved", []);
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>("apiclient:history", []);
  const [vars, setVars] = useLocalStorage<KV[]>("apiclient:vars", []);

  const [reqTab, setReqTab] = useState<"params" | "headers" | "body" | "auth">("params");
  const [resTab, setResTab] = useState<"body" | "headers">("body");
  const [response, setResponse] = useState<HttpResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const update = (p: Partial<RequestSpec>) => setSpec({ ...spec, ...p });

  // Query params: kept in local state so a row keeps its React identity while
  // being typed. Re-synced from the URL only when the URL changes elsewhere
  // (URL bar, load, import).
  const kvFromUrl = (url: string): KV[] =>
    getQueryParams(url).map((p) => ({ ...emptyKV(), ...p }));
  const [paramState, setParamState] = useState<KV[]>(() => kvFromUrl(spec.url));
  const lastSyncedUrl = useRef(spec.url);
  useEffect(() => {
    if (spec.url !== lastSyncedUrl.current) {
      setParamState(kvFromUrl(spec.url));
      lastSyncedUrl.current = spec.url;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.url]);

  function editParams(rows: KV[]) {
    setParamState(rows);
    const url = setQueryParams(
      spec.url,
      rows.filter((r) => r.enabled && r.key.trim()).map((r) => ({ key: r.key, value: r.value })),
    );
    lastSyncedUrl.current = url;
    update({ url });
  }
  const paramCount = paramState.filter((r) => r.enabled && r.key.trim()).length;

  const missingVars = useMemo(() => {
    const used = new Set([
      ...listVarNames(spec.url),
      ...spec.headers.flatMap((h) => [...listVarNames(h.key), ...listVarNames(h.value)]),
      ...listVarNames(spec.body.text),
    ]);
    const defined = new Set(vars.filter((v) => v.enabled && v.key).map((v) => v.key));
    return [...used].filter((n) => !defined.has(n));
  }, [spec, vars]);

  const headerCount = spec.headers.filter((h) => h.enabled && h.key).length;

  async function send() {
    if (!spec.url.trim()) return;
    setSending(true);
    setError(null);
    setResTab("body");
    try {
      const res = await sendRequest(toSendable(spec, vars));
      setResponse(res);
      setHistory([
        { id: crypto.randomUUID(), method: spec.method, url: spec.url, status: res.status, at: Date.now() },
        ...history,
      ].slice(0, 30));
    } catch (err) {
      setResponse(null);
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  function saveCurrent() {
    const name = spec.name.trim() || `${spec.method} ${spec.url}`.slice(0, 60) || "Sem nome";
    const withName = { ...spec, name };
    setSpec(withName);
    const idx = saved.findIndex((s) => s.id === withName.id);
    const next = [...saved];
    if (idx >= 0) next[idx] = withName;
    else next.push(withName);
    setSaved(next);
    toast(idx >= 0 ? "Request atualizado" : "Request salvo");
  }

  function loadSpec(s: RequestSpec) {
    setSpec(structuredClone(s));
    setResponse(null);
    setError(null);
  }

  function doImport() {
    try {
      const parsed = parseCurl(importText);
      setSpec({ ...specFromParsed(parsed), id: spec.id, name: spec.name });
      setImportOpen(false);
      setImportText("");
      toast("cURL importado");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  async function copyCurl() {
    try {
      await copyToClipboard(toCurl(toSendable(spec, vars)));
      toast("cURL copiado");
    } catch {
      toast("Não foi possível copiar", "error");
    }
  }

  const pretty = response ? prettyIfJson(response.body, response.contentType) : null;

  const rail = (
    <aside className="flex h-full w-full flex-col gap-3 overflow-y-auto pr-2">
        <Button variant="ghost" onClick={() => loadSpec(emptyRequest())}>
          + Novo request
        </Button>

        <div>
          <div className="px-1 pb-1 text-xs font-semibold uppercase text-faint">Salvos</div>
          {saved.length === 0 && <p className="px-1 text-xs text-faint">Nenhum ainda.</p>}
          {saved.map((s) => (
            <div key={s.id} className="group flex items-center rounded hover:bg-surface-2">
              <button onClick={() => loadSpec(s)} className="flex-1 truncate px-2 py-1 text-left text-sm">
                <span className={`mr-1.5 font-mono text-xs ${METHOD_TONE[s.method] ?? ""}`}>{s.method}</span>
                {s.name || s.url}
              </button>
              <button
                onClick={() => setSaved(saved.filter((x) => x.id !== s.id))}
                className="px-1.5 text-faint opacity-0 group-hover:opacity-100 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-xs font-semibold uppercase text-faint">Histórico</span>
            {history.length > 0 && (
              <button onClick={() => setHistory([])} className="text-xs text-faint hover:text-red-500">
                limpar
              </button>
            )}
          </div>
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() =>
                loadSpec({ ...emptyRequest(), id: spec.id, method: h.method, url: h.url })
              }
              className="flex w-full items-center gap-1.5 truncate rounded px-2 py-1 text-left text-xs hover:bg-surface-2"
            >
              <span className={`font-mono ${METHOD_TONE[h.method] ?? ""}`}>{h.method}</span>
              <span className={`rounded px-1 ${statusTone(h.status)}`}>{h.status}</span>
              <span className="min-w-0 flex-1 truncate text-muted">{h.url}</span>
            </button>
          ))}
        </div>

        <div>
          <div className="px-1 pb-1 text-xs font-semibold uppercase text-faint">Variáveis</div>
          <KVEditor rows={vars} onChange={setVars} />
          <p className="px-1 pt-1 text-[11px] text-faint">Use como {"{{nome}}"} na URL, headers ou body.</p>
        </div>
    </aside>
  );

  const mainCol = (
    <div className="flex h-full min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={spec.method} onChange={(e) => update({ method: e.currentTarget.value })}>
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
          <input
            value={spec.url}
            onChange={(e) => update({ url: e.currentTarget.value })}
            placeholder="https://api.exemplo.com/rota  ·  {{base_url}}/users"
            className={`min-w-[220px] flex-1 font-mono ${inputCls}`}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button variant="primary" onClick={send} disabled={sending || !spec.url.trim()}>
            {sending ? "…" : "Enviar"}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={spec.name}
            onChange={(e) => update({ name: e.currentTarget.value })}
            placeholder="nome (para salvar)"
            className={`w-48 ${inputCls}`}
          />
          <Button variant="ghost" onClick={saveCurrent}>Salvar</Button>
          <Button variant="ghost" onClick={() => setImportOpen((v) => !v)}>Importar cURL</Button>
          <Button variant="ghost" onClick={copyCurl}>Copiar cURL</Button>
        </div>

        {importOpen && (
          <div className="flex flex-col gap-2 rounded-md border border-line p-2 dark:border-line">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.currentTarget.value)}
              placeholder="Cole aqui o comando curl…"
              className="h-20 resize-y rounded-md border border-line bg-surface p-2 font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={doImport} disabled={!importText.trim()}>
                Importar
              </Button>
              <Button variant="ghost" onClick={() => setImportOpen(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {missingVars.length > 0 && (
          <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            Variáveis sem valor: {missingVars.map((v) => `{{${v}}}`).join(", ")}
          </p>
        )}

        <SplitPane
          direction="vertical"
          storageKey="apiclient"
          initial={0.56}
          min={0.18}
          className="min-h-0 flex-1"
          first={
            <div className="flex h-full min-h-0 flex-col gap-2 pb-1">
          <Segmented
            value={reqTab}
            onChange={setReqTab}
            options={[
              { value: "params", label: `Params${paramCount ? ` (${paramCount})` : ""}` },
              { value: "headers", label: `Headers${headerCount ? ` (${headerCount})` : ""}` },
              { value: "body", label: spec.body.mode === "none" ? "Body" : `Body · ${spec.body.mode}` },
              { value: "auth", label: spec.auth.type === "none" ? "Auth" : `Auth · ${spec.auth.type}` },
            ]}
          />
          <div className="min-h-0 flex-1 overflow-auto rounded-md border border-line p-2 dark:border-line">
            {reqTab === "params" && (
              <KVEditor rows={paramState} onChange={editParams} />
            )}
            {reqTab === "headers" && (
              <KVEditor rows={spec.headers} onChange={(rows) => update({ headers: rows })} />
            )}
            {reqTab === "body" && (
              <div className="flex h-full flex-col gap-2">
                <Segmented
                  value={spec.body.mode}
                  onChange={(mode) => update({ body: { ...spec.body, mode } })}
                  options={[
                    { value: "none", label: "Nenhum" },
                    { value: "json", label: "JSON" },
                    { value: "text", label: "Texto" },
                    { value: "form", label: "Form" },
                  ]}
                />
                {spec.body.mode === "form" ? (
                  <KVEditor
                    rows={spec.body.form}
                    onChange={(form) => update({ body: { ...spec.body, form } })}
                  />
                ) : spec.body.mode !== "none" ? (
                  <div className="flex min-h-0 flex-1 flex-col">
                    <CodeArea
                      value={spec.body.text}
                      onChange={(text) => update({ body: { ...spec.body, text } })}
                      language={spec.body.mode === "json" ? "json" : "text"}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-faint">Sem corpo na requisição.</p>
                )}
              </div>
            )}
            {reqTab === "auth" && (
              <div className="flex flex-col gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <span className="text-muted">Tipo</span>
                  <Select
                    value={spec.auth.type}
                    onChange={(e) => update({ auth: { ...spec.auth, type: e.currentTarget.value as typeof spec.auth.type } })}
                  >
                    <option value="none">Nenhuma</option>
                    <option value="bearer">Bearer token</option>
                    <option value="basic">Basic</option>
                    <option value="apikey">API key</option>
                  </Select>
                </label>
                {spec.auth.type === "bearer" && (
                  <input
                    value={spec.auth.token}
                    onChange={(e) => update({ auth: { ...spec.auth, token: e.currentTarget.value } })}
                    placeholder="token"
                    className={`font-mono ${inputCls}`}
                  />
                )}
                {spec.auth.type === "basic" && (
                  <div className="flex gap-2">
                    <input
                      value={spec.auth.user}
                      onChange={(e) => update({ auth: { ...spec.auth, user: e.currentTarget.value } })}
                      placeholder="usuário"
                      className={`flex-1 ${inputCls}`}
                    />
                    <input
                      value={spec.auth.pass}
                      onChange={(e) => update({ auth: { ...spec.auth, pass: e.currentTarget.value } })}
                      placeholder="senha"
                      className={`flex-1 ${inputCls}`}
                    />
                  </div>
                )}
                {spec.auth.type === "apikey" && (
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={spec.auth.apikeyName}
                      onChange={(e) => update({ auth: { ...spec.auth, apikeyName: e.currentTarget.value } })}
                      placeholder="nome (ex.: X-API-Key)"
                      className={`${inputCls}`}
                    />
                    <input
                      value={spec.auth.apikeyValue}
                      onChange={(e) => update({ auth: { ...spec.auth, apikeyValue: e.currentTarget.value } })}
                      placeholder="valor"
                      className={`font-mono ${inputCls}`}
                    />
                    <Select
                      value={spec.auth.apikeyIn}
                      onChange={(e) => update({ auth: { ...spec.auth, apikeyIn: e.currentTarget.value as "header" | "query" } })}
                    >
                      <option value="header">no header</option>
                      <option value="query">na query</option>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>
            </div>
          }
          second={
            <div className="flex h-full min-h-0 flex-col gap-2 pt-1">
          <div className="flex items-center gap-3 text-sm">
            {sending && <span className="text-faint">Enviando…</span>}
            {error && <span className="text-red-600">{error}</span>}
            {response && !sending && (
              <>
                <span className={`rounded px-2 py-0.5 font-bold ${statusTone(response.status)}`}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-muted">{response.timeMs} ms</span>
                <span className="text-muted">{(response.size / 1024).toFixed(1)} KB</span>
                <span className="truncate text-faint">{response.contentType}</span>
                <div className="ml-auto">
                  <CopyButton value={pretty?.text ?? response.body} />
                </div>
              </>
            )}
            {!response && !sending && !error && (
              <span className="text-faint">A resposta aparece aqui.</span>
            )}
          </div>

          {response && !sending && (
            <>
              <Segmented
                value={resTab}
                onChange={setResTab}
                options={[
                  { value: "body", label: "Body" },
                  { value: "headers", label: `Headers (${response.headers.length})` },
                ]}
              />
              <div className="min-h-0 flex-1 overflow-auto rounded-md border border-line">
                {resTab === "body" ? (
                  <div className="flex h-full flex-col">
                    <CodeArea value={pretty?.text ?? ""} language={pretty?.lang ?? "text"} readOnly />
                  </div>
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
          }
        />
      </div>
  );

  return (
    <div className="flex h-full min-h-0">
      <SplitPane
        storageKey="apiclient-rail"
        mode="pixels"
        initial={224}
        minPx={150}
        maxPx={420}
        className="h-full w-full"
        first={rail}
        second={mainCol}
      />
    </div>
  );
}
