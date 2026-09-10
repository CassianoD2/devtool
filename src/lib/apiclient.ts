import type { ParsedRequest } from "./curl";
import {
  emptyKV,
  emptyRequest,
  uid,
  type KV,
  type MultipartField,
  type RequestSpec,
} from "./apiclient-model";

export {
  METHODS,
  emptyKV,
  emptyRequest,
  type KV,
  type MultipartField,
  type RequestSpec,
  type BodyMode,
  type AuthType,
} from "./apiclient-model";

/** Replace {{name}} with an enabled variable's value (leaves unknown vars as-is). */
export function resolveVars(text: string, vars: KV[]): string {
  return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, name) => {
    const v = vars.find((x) => x.enabled && x.key === name);
    return v ? v.value : m;
  });
}

export function listVarNames(text: string): string[] {
  return [...text.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)].map((m) => m[1]);
}

// ---------- query string <-> rows ----------

export function getQueryParams(url: string): { key: string; value: string }[] {
  const q = url.split("?")[1];
  if (!q) return [];
  return q
    .split("&")
    .filter(Boolean)
    .map((pair) => {
      const eq = pair.indexOf("=");
      const dec = (s: string) => {
        try {
          return decodeURIComponent(s.replace(/\+/g, " "));
        } catch {
          return s;
        }
      };
      return eq >= 0
        ? { key: dec(pair.slice(0, eq)), value: dec(pair.slice(eq + 1)) }
        : { key: dec(pair), value: "" };
    });
}

export function setQueryParams(
  url: string,
  params: { key: string; value: string }[],
): string {
  const [base, hash] = url.split("#");
  const path = base.split("?")[0];
  const usable = params.filter((p) => p.key.trim() !== "");
  const enc = (s: string) =>
    /\{\{.*\}\}/.test(s) ? s : encodeURIComponent(s);
  const q = usable.map((p) => `${enc(p.key)}=${enc(p.value)}`).join("&");
  return (q ? `${path}?${q}` : path) + (hash ? `#${hash}` : "");
}

// ---------- multipart ----------

/**
 * Monta um corpo `multipart/form-data` em texto puro (campos de texto apenas).
 * Retorna o corpo e o Content-Type com o boundary gerado.
 */
export function buildMultipartBody(
  fields: { key: string; value: string }[],
): { body: string; contentType: string } {
  const boundary = `----DevToolFormBoundary${uid().replace(/-/g, "")}`;
  const CRLF = "\r\n";
  const parts = fields.map(
    (f) =>
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="${f.key}"${CRLF}${CRLF}` +
      `${f.value}${CRLF}`,
  );
  const body = parts.join("") + `--${boundary}--${CRLF}`;
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

// ---------- build a sendable request ----------

export function toSendable(spec: RequestSpec, vars: KV[]): ParsedRequest {
  const r = (s: string) => resolveVars(s, vars);
  let url = r(spec.url.trim());

  const headers: [string, string][] = spec.headers
    .filter((h) => h.enabled && h.key.trim())
    .map((h) => [r(h.key.trim()), r(h.value)]);

  let auth: ParsedRequest["auth"];
  const a = spec.auth;
  if (a.type === "bearer" && a.token) {
    headers.push(["Authorization", `Bearer ${r(a.token)}`]);
  } else if (a.type === "basic") {
    auth = { user: r(a.user), pass: r(a.pass) };
  } else if (a.type === "apikey" && a.apikeyName) {
    if (a.apikeyIn === "header") {
      headers.push([r(a.apikeyName), r(a.apikeyValue)]);
    } else {
      const sep = url.includes("?") ? "&" : "?";
      url += `${sep}${encodeURIComponent(r(a.apikeyName))}=${encodeURIComponent(r(a.apikeyValue))}`;
    }
  }

  let body: string | undefined;
  const hasCT = headers.some(([k]) => k.toLowerCase() === "content-type");
  if (spec.body.mode === "json") {
    body = r(spec.body.text);
    if (!hasCT && body.trim()) headers.push(["Content-Type", "application/json"]);
  } else if (spec.body.mode === "text") {
    body = r(spec.body.text);
    if (!hasCT && body.trim()) headers.push(["Content-Type", "text/plain"]);
  } else if (spec.body.mode === "form") {
    body = spec.body.form
      .filter((f) => f.enabled && f.key.trim())
      .map((f) => `${encodeURIComponent(r(f.key))}=${encodeURIComponent(r(f.value))}`)
      .join("&");
    if (!hasCT) headers.push(["Content-Type", "application/x-www-form-urlencoded"]);
  } else if (spec.body.mode === "multipart") {
    const fields = spec.body.multipart
      .filter((f) => f.enabled && f.key.trim())
      .map((f) => ({ key: r(f.key), value: r(f.value) }));
    const built = buildMultipartBody(fields);
    body = built.body;
    if (!hasCT) headers.push(["Content-Type", built.contentType]);
  }

  return {
    method: spec.method,
    url,
    headers,
    body: body || undefined,
    auth,
    insecure: spec.options.insecure,
    followRedirects: spec.options.followRedirects,
    timeoutMs: spec.options.timeoutMs ?? undefined,
    warnings: [],
  };
}

/** Turn a parsed curl command into an editable request spec. */
export function specFromParsed(p: ParsedRequest, name = ""): RequestSpec {
  const spec = emptyRequest();
  spec.name = name;
  spec.method = p.method;
  spec.url = p.url;
  spec.headers = p.headers.length
    ? p.headers.map(([key, value]) => ({ id: uid(), key, value, enabled: true }))
    : [emptyKV()];
  if (p.auth) {
    spec.auth.type = "basic";
    spec.auth.user = p.auth.user;
    spec.auth.pass = p.auth.pass;
  }
  if (p.body) {
    const looksJson = /^\s*[[{]/.test(p.body);
    spec.body = {
      mode: looksJson ? "json" : "text",
      text: p.body,
      form: [emptyKV()],
      multipart: [{ id: uid(), key: "", value: "", enabled: true, kind: "text" } as MultipartField],
    };
  }
  spec.options.followRedirects = p.followRedirects;
  spec.options.insecure = p.insecure;
  return spec;
}
