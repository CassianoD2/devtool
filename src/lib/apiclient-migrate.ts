/**
 * Migração única das chaves antigas `apiclient:*` (lista plana) para o novo
 * blob versionado `devtool:apiclient:store`. O núcleo (`migrateLegacy`) é puro;
 * `runMigration` é o orquestrador fino que toca no localStorage.
 */

import {
  APICLIENT_STORE_VERSION,
  emptyAuth,
  emptyKV,
  emptyMultipartField,
  emptyOptions,
  emptyStore,
  uid,
  type ApiClientStore,
  type HistoryEntry,
  type KV,
  type RequestSpec,
} from "./apiclient-model";

export const STORE_KEY = "devtool:apiclient:store";
export const LEGACY_KEYS = [
  "apiclient:current",
  "apiclient:saved",
  "apiclient:history",
  "apiclient:vars",
] as const;

export interface LegacyData {
  current?: unknown;
  saved?: unknown[];
  history?: unknown[];
  vars?: unknown[];
}

function safeParse(raw: string | null): unknown {
  if (raw == null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function str(x: unknown, fallback = ""): string {
  return typeof x === "string" ? x : fallback;
}

function normalizeKV(raw: unknown): KV {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(o.id) || uid(),
    key: str(o.key),
    value: str(o.value),
    enabled: o.enabled !== false,
    ...(o.secret === true ? { secret: true } : {}),
  };
}

function normalizeKVList(raw: unknown): KV[] {
  return Array.isArray(raw) && raw.length ? raw.map(normalizeKV) : [emptyKV()];
}

/** Converte um RequestSpec antigo (sem folderId/options/multipart/timestamps). */
export function normalizeRequest(raw: unknown, folderId: string | null = null): RequestSpec {
  const o = (raw ?? {}) as Record<string, unknown>;
  const now = Date.now();
  const auth = { ...emptyAuth(), ...(o.auth as object | undefined) };
  const bodyRaw = (o.body ?? {}) as Record<string, unknown>;
  const mode = ["none", "json", "text", "form", "multipart"].includes(str(bodyRaw.mode))
    ? (str(bodyRaw.mode) as RequestSpec["body"]["mode"])
    : "none";
  return {
    id: str(o.id) || uid(),
    name: str(o.name),
    folderId,
    method: str(o.method, "GET") || "GET",
    url: str(o.url),
    headers: normalizeKVList(o.headers),
    auth,
    body: {
      mode,
      text: str(bodyRaw.text),
      form: normalizeKVList(bodyRaw.form),
      multipart: Array.isArray(bodyRaw.multipart) && bodyRaw.multipart.length
        ? (bodyRaw.multipart as unknown[]).map((f) => {
            const mf = (f ?? {}) as Record<string, unknown>;
            return {
              id: str(mf.id) || uid(),
              key: str(mf.key),
              value: str(mf.value),
              enabled: mf.enabled !== false,
              kind: "text" as const,
            };
          })
        : [emptyMultipartField()],
    },
    options: { ...emptyOptions(), ...(o.options as object | undefined) },
    createdAt: typeof o.createdAt === "number" ? o.createdAt : now,
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : now,
  };
}

function normalizeHistory(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((h) => {
    const o = (h ?? {}) as Record<string, unknown>;
    const req = normalizeRequest({
      id: uid(),
      method: str(o.method, "GET"),
      url: str(o.url),
    });
    const status = typeof o.status === "number" ? o.status : 0;
    return {
      id: str(o.id) || uid(),
      at: typeof o.at === "number" ? o.at : Date.now(),
      request: req,
      response: status
        ? { status, statusText: "", timeMs: 0, size: 0, contentType: "" }
        : null,
    };
  });
}

export function readLegacy(ls?: Storage): LegacyData | null {
  const store = ls ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
  if (!store) return null;
  const current = safeParse(store.getItem("apiclient:current"));
  const saved = safeParse(store.getItem("apiclient:saved"));
  const history = safeParse(store.getItem("apiclient:history"));
  const vars = safeParse(store.getItem("apiclient:vars"));
  if (
    current === undefined &&
    saved === undefined &&
    history === undefined &&
    vars === undefined
  ) {
    return null;
  }
  return {
    current,
    saved: Array.isArray(saved) ? saved : undefined,
    history: Array.isArray(history) ? history : undefined,
    vars: Array.isArray(vars) ? vars : undefined,
  };
}

/** Núcleo puro: transforma os dados antigos num `ApiClientStore` completo. */
export function migrateLegacy(legacy: LegacyData): ApiClientStore {
  const store = emptyStore();

  store.requests = (legacy.saved ?? []).map((r) => normalizeRequest(r, null));

  if (legacy.current) {
    const cur = normalizeRequest(legacy.current, null);
    if (cur.url.trim() || cur.name.trim()) {
      if (!store.requests.some((r) => r.id === cur.id)) {
        store.requests.push({ ...cur, name: cur.name || "Rascunho" });
      }
    }
  }

  store.globals =
    Array.isArray(legacy.vars) && legacy.vars.length ? legacy.vars.map(normalizeKV) : [];

  store.history = normalizeHistory(legacy.history);

  return store;
}

export function isApiClientStore(x: unknown): x is ApiClientStore {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.version === "number" &&
    Array.isArray(o.folders) &&
    Array.isArray(o.requests) &&
    Array.isArray(o.environments) &&
    Array.isArray(o.globals) &&
    Array.isArray(o.history) &&
    (o.activeEnvId === null || typeof o.activeEnvId === "string")
  );
}

/**
 * Orquestrador. Retorna o store atual (migrando se preciso) ou `null` quando
 * não há `Storage` disponível — o chamador faz `?? emptyStore()`.
 */
export function runMigration(ls?: Storage): ApiClientStore | null {
  const store = ls ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
  if (!store) return null;

  const existing = safeParse(store.getItem(STORE_KEY));
  if (existing !== undefined) {
    return isApiClientStore(existing) ? existing : emptyStore();
  }

  const legacy = readLegacy(store);
  if (!legacy) {
    const fresh = emptyStore();
    try {
      store.setItem(STORE_KEY, JSON.stringify(fresh));
    } catch {
      /* quota — o hook avisa depois */
    }
    return fresh;
  }

  const migrated = { ...migrateLegacy(legacy), version: APICLIENT_STORE_VERSION };
  try {
    store.setItem(STORE_KEY, JSON.stringify(migrated));
    for (const k of LEGACY_KEYS) store.removeItem(k);
  } catch {
    /* quota — mantém as chaves legadas intactas */
  }
  return migrated;
}
