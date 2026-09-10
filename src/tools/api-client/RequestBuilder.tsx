import { useEffect, useRef, useState } from "react";
import { CodeArea } from "../../components/ui/CodeArea";
import { Button, Checkbox, Segmented, Select } from "../../components/ui/primitives";
import { useToast } from "../../components/ui/Toast";
import { copyToClipboard } from "../../lib/clipboard";
import { parseCurl, toCurl } from "../../lib/curl";
import {
  getQueryParams,
  setQueryParams,
  specFromParsed,
} from "../../lib/apiclient";
import { missingVarNames, resolveSpec } from "../../lib/apiclient-env";
import {
  METHODS,
  emptyKV,
  emptyMultipartField,
  type ApiClientStore,
  type KV,
  type RequestSpec,
} from "../../lib/apiclient-model";
import type { ApiClientStoreApi } from "../../hooks/useApiClientStore";
import { KVEditor } from "./KVEditor";
import { inputCls } from "./shared";

type ReqTab = "params" | "headers" | "body" | "auth" | "options";

export function RequestBuilder({
  req,
  store,
  actions,
  reqTab,
  setReqTab,
  onSend,
  sending,
}: {
  req: RequestSpec;
  store: ApiClientStore;
  actions: ApiClientStoreApi;
  reqTab: ReqTab;
  setReqTab: (t: ReqTab) => void;
  onSend: () => void;
  sending: boolean;
}) {
  const toast = useToast();
  const update = (p: Partial<RequestSpec>) => actions.updateRequest(req.id, p);

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  // Params <-> URL: estado local para preservar identidade das linhas ao digitar.
  const kvFromUrl = (url: string): KV[] => getQueryParams(url).map((p) => ({ ...emptyKV(), ...p }));
  const [paramState, setParamState] = useState<KV[]>(() => kvFromUrl(req.url));
  const lastSyncedUrl = useRef(req.url);
  useEffect(() => {
    if (req.url !== lastSyncedUrl.current) {
      setParamState(kvFromUrl(req.url));
      lastSyncedUrl.current = req.url;
    }
  }, [req.url]);

  function editParams(rows: KV[]) {
    setParamState(rows);
    const url = setQueryParams(
      req.url,
      rows.filter((r) => r.enabled && r.key.trim()).map((r) => ({ key: r.key, value: r.value })),
    );
    lastSyncedUrl.current = url;
    update({ url });
  }
  const paramCount = paramState.filter((r) => r.enabled && r.key.trim()).length;
  const headerCount = req.headers.filter((h) => h.enabled && h.key).length;
  const missing = missingVarNames(req, store);

  async function copyCurl() {
    try {
      await copyToClipboard(toCurl(resolveSpec(req, store)));
      toast("cURL copiado");
    } catch {
      toast("Não foi possível copiar", "error");
    }
  }

  function doImport() {
    try {
      const parsed = specFromParsed(parseCurl(importText));
      update({
        method: parsed.method,
        url: parsed.url,
        headers: parsed.headers,
        auth: parsed.auth,
        body: parsed.body,
        options: { ...req.options, followRedirects: parsed.options.followRedirects, insecure: parsed.options.insecure },
      });
      setImportOpen(false);
      setImportText("");
      toast("cURL importado");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={req.method} onChange={(e) => update({ method: e.currentTarget.value })}>
          {METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </Select>
        <input
          value={req.url}
          onChange={(e) => update({ url: e.currentTarget.value })}
          placeholder="https://api.exemplo.com/rota  ·  {{base_url}}/users"
          className={`min-w-[220px] flex-1 font-mono ${inputCls}`}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
        />
        <Button variant="primary" onClick={onSend} disabled={sending || !req.url.trim()}>
          {sending ? "…" : "Enviar"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={req.name}
          onChange={(e) => update({ name: e.currentTarget.value })}
          placeholder="nome do request"
          className={`w-52 ${inputCls}`}
        />
        <Button variant="ghost" onClick={() => setImportOpen((v) => !v)}>
          Importar cURL
        </Button>
        <Button variant="ghost" onClick={copyCurl}>
          Copiar cURL
        </Button>
        <span className="text-[11px] text-faint">salva automaticamente</span>
      </div>

      {importOpen && (
        <div className="flex flex-col gap-2 rounded-md border border-line p-2">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.currentTarget.value)}
            placeholder="Cole aqui o comando curl…"
            className="h-20 resize-y rounded-md border border-line-strong bg-surface-2 p-2 font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button variant="primary" onClick={doImport} disabled={!importText.trim()}>
              Importar
            </Button>
            <Button variant="ghost" onClick={() => setImportOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Variáveis sem valor: {missing.map((v) => `{{${v}}}`).join(", ")}
        </p>
      )}

      <Segmented
        value={reqTab}
        onChange={setReqTab}
        options={[
          { value: "params", label: `Params${paramCount ? ` (${paramCount})` : ""}` },
          { value: "headers", label: `Headers${headerCount ? ` (${headerCount})` : ""}` },
          { value: "body", label: req.body.mode === "none" ? "Body" : `Body · ${req.body.mode}` },
          { value: "auth", label: req.auth.type === "none" ? "Auth" : `Auth · ${req.auth.type}` },
          { value: "options", label: "Opções" },
        ]}
      />

      <div className="min-h-0 flex-1 overflow-auto rounded-md border border-line p-2">
        {reqTab === "params" && (
          <KVEditor rows={paramState} onChange={editParams} emptyRow={emptyKV} />
        )}

        {reqTab === "headers" && (
          <KVEditor
            rows={req.headers}
            onChange={(rows) => update({ headers: rows })}
            emptyRow={emptyKV}
          />
        )}

        {reqTab === "body" && (
          <div className="flex h-full flex-col gap-2">
            <Segmented
              value={req.body.mode}
              onChange={(mode) => update({ body: { ...req.body, mode } })}
              options={[
                { value: "none", label: "Nenhum" },
                { value: "json", label: "JSON" },
                { value: "text", label: "Texto" },
                { value: "form", label: "Form" },
                { value: "multipart", label: "Multipart" },
              ]}
            />
            {req.body.mode === "form" ? (
              <KVEditor
                rows={req.body.form}
                onChange={(form) => update({ body: { ...req.body, form } })}
                emptyRow={emptyKV}
              />
            ) : req.body.mode === "multipart" ? (
              <>
                <KVEditor
                  rows={req.body.multipart}
                  onChange={(multipart) => update({ body: { ...req.body, multipart } })}
                  emptyRow={emptyMultipartField}
                />
                <p className="text-[11px] text-faint">Só campos de texto por ora (upload de arquivo virá depois).</p>
              </>
            ) : req.body.mode !== "none" ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <CodeArea
                  value={req.body.text}
                  onChange={(text) => update({ body: { ...req.body, text } })}
                  language={req.body.mode === "json" ? "json" : "text"}
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
                value={req.auth.type}
                onChange={(e) =>
                  update({ auth: { ...req.auth, type: e.currentTarget.value as typeof req.auth.type } })
                }
              >
                <option value="none">Nenhuma</option>
                <option value="bearer">Bearer token</option>
                <option value="basic">Basic</option>
                <option value="apikey">API key</option>
              </Select>
            </label>
            {req.auth.type === "bearer" && (
              <input
                value={req.auth.token}
                onChange={(e) => update({ auth: { ...req.auth, token: e.currentTarget.value } })}
                placeholder="token"
                className={`font-mono ${inputCls}`}
              />
            )}
            {req.auth.type === "basic" && (
              <div className="flex gap-2">
                <input
                  value={req.auth.user}
                  onChange={(e) => update({ auth: { ...req.auth, user: e.currentTarget.value } })}
                  placeholder="usuário"
                  className={`flex-1 ${inputCls}`}
                />
                <input
                  value={req.auth.pass}
                  onChange={(e) => update({ auth: { ...req.auth, pass: e.currentTarget.value } })}
                  placeholder="senha"
                  className={`flex-1 ${inputCls}`}
                />
              </div>
            )}
            {req.auth.type === "apikey" && (
              <div className="flex flex-wrap gap-2">
                <input
                  value={req.auth.apikeyName}
                  onChange={(e) => update({ auth: { ...req.auth, apikeyName: e.currentTarget.value } })}
                  placeholder="nome (ex.: X-API-Key)"
                  className={inputCls}
                />
                <input
                  value={req.auth.apikeyValue}
                  onChange={(e) => update({ auth: { ...req.auth, apikeyValue: e.currentTarget.value } })}
                  placeholder="valor"
                  className={`font-mono ${inputCls}`}
                />
                <Select
                  value={req.auth.apikeyIn}
                  onChange={(e) =>
                    update({ auth: { ...req.auth, apikeyIn: e.currentTarget.value as "header" | "query" } })
                  }
                >
                  <option value="header">no header</option>
                  <option value="query">na query</option>
                </Select>
              </div>
            )}
          </div>
        )}

        {reqTab === "options" && (
          <div className="flex flex-col gap-3 text-sm">
            <label className="flex items-center gap-2">
              <span className="text-muted">Timeout (ms)</span>
              <input
                type="number"
                min={0}
                value={req.options.timeoutMs ?? ""}
                onChange={(e) => {
                  const n = e.currentTarget.value.trim();
                  update({ options: { ...req.options, timeoutMs: n ? Math.max(0, Number(n)) : null } });
                }}
                placeholder="sem limite"
                className={`w-32 ${inputCls}`}
              />
            </label>
            <Checkbox
              label="Seguir redirecionamentos"
              checked={req.options.followRedirects}
              onChange={(v) => update({ options: { ...req.options, followRedirects: v } })}
            />
            <Checkbox
              label="Ignorar certificado TLS inválido"
              checked={req.options.insecure}
              onChange={(v) => update({ options: { ...req.options, insecure: v } })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
