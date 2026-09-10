/**
 * Exportar/importar o workspace do API Client num `.json` versionado.
 * Espelha o padrão de `src/lib/backup.ts`.
 */

import { isTauri } from "./http";
import { copyToClipboard } from "./clipboard";
import {
  emptyStore,
  type ApiClientStore,
  type Environment,
  type Folder,
  type HistoryEntry,
  type RequestSpec,
} from "./apiclient-model";
import { normalizeRequest } from "./apiclient-migrate";

export const APICLIENT_BACKUP_VERSION = 1;

export interface ApiClientBundle {
  app: "devtool";
  kind: "apiclient";
  version: number;
  exportedAt: string;
  store: ApiClientStore;
}

export function exportApiClient(store: ApiClientStore): string {
  const bundle: ApiClientBundle = {
    app: "devtool",
    kind: "apiclient",
    version: APICLIENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    store,
  };
  return JSON.stringify(bundle, null, 2);
}

export function suggestedApiClientFilename(): string {
  return `devtool-apiclient-${new Date().toISOString().slice(0, 10)}.json`;
}

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

function keepFolder(f: unknown): f is Folder {
  return (
    isObj(f) &&
    typeof f.id === "string" &&
    typeof f.name === "string" &&
    (f.parentId === null || typeof f.parentId === "string")
  );
}

function keepRequest(r: unknown): r is RequestSpec {
  return (
    isObj(r) &&
    typeof r.id === "string" &&
    typeof r.method === "string" &&
    typeof r.url === "string" &&
    isObj(r.body) &&
    isObj(r.auth) &&
    isObj(r.options)
  );
}

function keepEnv(e: unknown): e is Environment {
  return isObj(e) && typeof e.id === "string" && typeof e.name === "string" && Array.isArray(e.vars);
}

function keepHistory(h: unknown): h is HistoryEntry {
  return isObj(h) && typeof h.id === "string" && isObj(h.request);
}

/** Valida e extrai o `ApiClientStore` de um JSON exportado. Lança Error se inválido. */
export function parseApiClientBundle(json: string): ApiClientStore {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("Arquivo não é um JSON válido.");
  }
  if (!isObj(data)) throw new Error("Formato inesperado.");
  const b = data as Partial<ApiClientBundle>;
  if (b.app !== "devtool" || b.kind !== "apiclient") {
    throw new Error("Não é um backup do DevTool (API Client).");
  }
  if (b.version !== APICLIENT_BACKUP_VERSION) {
    throw new Error(
      `Versão de backup ${b.version} não suportada (esperado ${APICLIENT_BACKUP_VERSION}).`,
    );
  }
  const raw = isObj(b.store) ? (b.store as Record<string, unknown>) : {};
  const out = emptyStore();
  out.folders = Array.isArray(raw.folders) ? raw.folders.filter(keepFolder) : [];
  out.requests = Array.isArray(raw.requests)
    ? raw.requests
        .filter(keepRequest)
        .map((r) => {
          const o = r as unknown as Record<string, unknown>;
          return normalizeRequest(o, typeof o.folderId === "string" ? o.folderId : null);
        })
    : [];
  out.environments = Array.isArray(raw.environments) ? raw.environments.filter(keepEnv) : [];
  out.globals = Array.isArray(raw.globals) ? (raw.globals as ApiClientStore["globals"]) : [];
  out.history = Array.isArray(raw.history) ? raw.history.filter(keepHistory) : [];

  // integridade referencial
  const folderIds = new Set(out.folders.map((f) => f.id));
  out.folders = out.folders.map((f) =>
    f.parentId && !folderIds.has(f.parentId) ? { ...f, parentId: null } : f,
  );
  out.requests = out.requests.map((r) =>
    r.folderId && !folderIds.has(r.folderId) ? { ...r, folderId: null } : r,
  );
  const envIds = new Set(out.environments.map((e) => e.id));
  out.activeEnvId =
    typeof raw.activeEnvId === "string" && envIds.has(raw.activeEnvId) ? raw.activeEnvId : null;

  return out;
}

// ---------- salvar resposta em arquivo ----------

export function extensionForContentType(ct: string): string {
  const c = (ct || "").toLowerCase();
  if (c.includes("json")) return "json";
  if (c.includes("xml")) return "xml";
  if (c.includes("html")) return "html";
  if (c.includes("csv")) return "csv";
  if (c.includes("javascript")) return "js";
  if (c.includes("yaml")) return "yaml";
  return "txt";
}

function hostSlug(url: string): string {
  try {
    return new URL(url).hostname.replace(/[^\w.-]/g, "") || "resposta";
  } catch {
    return "resposta";
  }
}

export async function saveResponseFile(
  body: string,
  contentType: string,
  url: string,
): Promise<"saved" | "copied" | "cancelled"> {
  const name = `${hostSlug(url)}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${extensionForContentType(contentType)}`;
  if (isTauri()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({ defaultPath: name });
    if (!path) return "cancelled";
    await writeTextFile(path, body);
    return "saved";
  }
  await copyToClipboard(body);
  return "copied";
}

// ---------- busca no corpo da resposta ----------

export function filterBodyLines(
  text: string,
  query: string,
): { text: string; matches: number } {
  if (!query.trim()) return { text, matches: 0 };
  const q = query.toLowerCase();
  const lines = text.split("\n");
  const hit = lines.filter((l) => l.toLowerCase().includes(q));
  return { text: hit.join("\n"), matches: hit.length };
}
