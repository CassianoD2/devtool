/**
 * Importador de coleções Postman v2.1 → `ApiClientStore`. Puro, sem I/O.
 * Cobre pastas aninhadas, headers, body raw/urlencoded/formdata, auth
 * bearer/basic/apikey e as variáveis da coleção (viram um Environment).
 */

import {
  emptyAuth,
  emptyOptions,
  emptyStore,
  uid,
  type ApiClientStore,
  type KV,
  type MultipartField,
  type RequestAuth,
  type RequestSpec,
} from "./apiclient-model";

function str(x: unknown, fallback = ""): string {
  return typeof x === "string" ? x : fallback;
}

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

function toKV(list: unknown): KV[] {
  if (!Array.isArray(list)) return [];
  return list.map((raw) => {
    const o = isObj(raw) ? raw : {};
    return {
      id: uid(),
      key: str(o.key),
      value: str(o.value),
      enabled: o.disabled !== true,
    };
  });
}

/** Postman guarda auth como lista `[{key,value}]` por tipo. */
function authVal(arr: unknown, key: string): string {
  if (!Array.isArray(arr)) return "";
  const hit = arr.find((x) => isObj(x) && x.key === key);
  return hit && isObj(hit) ? str(hit.value) : "";
}

function mapAuth(raw: unknown): RequestAuth {
  const auth = emptyAuth();
  if (!isObj(raw)) return auth;
  const type = str(raw.type);
  if (type === "bearer") {
    auth.type = "bearer";
    auth.token = authVal(raw.bearer, "token");
  } else if (type === "basic") {
    auth.type = "basic";
    auth.user = authVal(raw.basic, "username");
    auth.pass = authVal(raw.basic, "password");
  } else if (type === "apikey") {
    auth.type = "apikey";
    auth.apikeyName = authVal(raw.apikey, "key");
    auth.apikeyValue = authVal(raw.apikey, "value");
    auth.apikeyIn = authVal(raw.apikey, "in") === "query" ? "query" : "header";
  }
  return auth;
}

function mapUrl(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (isObj(raw)) {
    if (typeof raw.raw === "string") return raw.raw;
    const host = Array.isArray(raw.host) ? raw.host.join(".") : str(raw.host);
    const path = Array.isArray(raw.path) ? raw.path.join("/") : str(raw.path);
    const proto = str(raw.protocol, "https");
    if (host) return `${proto}://${host}${path ? `/${path}` : ""}`;
  }
  return "";
}

function mapBody(raw: unknown): RequestSpec["body"] {
  const empty: RequestSpec["body"] = {
    mode: "none",
    text: "",
    form: [{ id: uid(), key: "", value: "", enabled: true }],
    multipart: [{ id: uid(), key: "", value: "", enabled: true, kind: "text" }],
  };
  if (!isObj(raw)) return empty;
  const mode = str(raw.mode);
  if (mode === "raw") {
    const lang = isObj(raw.options) && isObj(raw.options.raw) ? str(raw.options.raw.language) : "";
    const text = str(raw.raw);
    return { ...empty, mode: lang === "json" || /^\s*[[{]/.test(text) ? "json" : "text", text };
  }
  if (mode === "urlencoded") {
    const form = toKV(raw.urlencoded);
    return { ...empty, mode: "form", form: form.length ? form : empty.form };
  }
  if (mode === "formdata") {
    const fields: MultipartField[] = (Array.isArray(raw.formdata) ? raw.formdata : [])
      .filter((f) => isObj(f) && f.type !== "file")
      .map((f) => {
        const o = f as Record<string, unknown>;
        return {
          id: uid(),
          key: str(o.key),
          value: str(o.value),
          enabled: o.disabled !== true,
          kind: "text" as const,
        };
      });
    return { ...empty, mode: "multipart", multipart: fields.length ? fields : empty.multipart };
  }
  if (mode === "graphql" && isObj(raw.graphql)) {
    return { ...empty, mode: "json", text: JSON.stringify(raw.graphql, null, 2) };
  }
  return empty;
}

function mapRequest(item: Record<string, unknown>, folderId: string | null): RequestSpec {
  const req = isObj(item.request) ? item.request : {};
  const now = Date.now();
  return {
    id: uid(),
    name: str(item.name) || str(req.method, "GET") || "Sem nome",
    folderId,
    method: str(req.method, "GET").toUpperCase() || "GET",
    url: mapUrl(req.url),
    headers: toKV(req.header).length
      ? toKV(req.header)
      : [{ id: uid(), key: "", value: "", enabled: true }],
    auth: mapAuth(req.auth),
    body: mapBody(req.body),
    options: emptyOptions(),
    createdAt: now,
    updatedAt: now,
  };
}

/** Importa uma coleção Postman v2.1. Entrada malformada → store vazio (não lança). */
export function importPostmanV2_1(json: unknown): ApiClientStore {
  const store = emptyStore();
  const root = isObj(json) ? json : {};
  const items = Array.isArray(root.item) ? root.item : [];
  const collName = isObj(root.info) ? str(root.info.name) : "";

  const walk = (list: unknown[], parentId: string | null) => {
    for (const raw of list) {
      if (!isObj(raw)) continue;
      if (Array.isArray(raw.item)) {
        const now = Date.now();
        const folder = {
          id: uid(),
          name: str(raw.name) || "Pasta",
          parentId,
          createdAt: now,
          updatedAt: now,
        };
        store.folders.push(folder);
        walk(raw.item, folder.id);
      } else if (isObj(raw.request) || typeof raw.request === "string") {
        store.requests.push(mapRequest(raw, parentId));
      }
    }
  };
  walk(items, null);

  const vars = toKV(root.variable);
  if (vars.length) {
    store.environments.push({
      id: uid(),
      name: collName || "Postman",
      vars,
    });
  }

  return store;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
/** Ainda não implementado — ver plano (stub tipado). */
export function importInsomniaV4(_json: unknown): ApiClientStore {
  throw new Error("Importação do Insomnia ainda não implementada.");
}

/** Ainda não implementado — ver plano (stub tipado). */
export function importOpenApi(_doc: unknown): ApiClientStore {
  throw new Error("Importação de OpenAPI ainda não implementada.");
}
