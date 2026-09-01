import type { ParsedRequest } from "./curl";

export type BodyMode = "none" | "json" | "text" | "form";
export type AuthType = "none" | "bearer" | "basic" | "apikey";

export interface KV {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestSpec {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: KV[];
  auth: {
    type: AuthType;
    token: string;
    user: string;
    pass: string;
    apikeyName: string;
    apikeyValue: string;
    apikeyIn: "header" | "query";
  };
  body: { mode: BodyMode; text: string; form: KV[] };
}

export const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function emptyKV(): KV {
  return { id: uid(), key: "", value: "", enabled: true };
}

export function emptyRequest(): RequestSpec {
  return {
    id: uid(),
    name: "",
    method: "GET",
    url: "",
    headers: [emptyKV()],
    auth: {
      type: "none",
      token: "",
      user: "",
      pass: "",
      apikeyName: "",
      apikeyValue: "",
      apikeyIn: "header",
    },
    body: { mode: "none", text: "", form: [emptyKV()] },
  };
}

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
  }

  return {
    method: spec.method,
    url,
    headers,
    body: body || undefined,
    auth,
    insecure: false,
    followRedirects: true,
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
    };
  }
  return spec;
}
