/**
 * Modelo de dados do workspace do API Client: coleções em pastas, ambientes
 * nomeados, histórico com snapshot completo. Tudo puro — sem React, sem I/O.
 */

export const APICLIENT_STORE_VERSION = 1;
export const HISTORY_CAP = 30;

export const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export type BodyMode = "none" | "json" | "text" | "form" | "multipart";
export type AuthType = "none" | "bearer" | "basic" | "apikey";

export function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/** Linha chave/valor. `secret` só mascara na tela — o valor fica em texto puro. */
export interface KV {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  secret?: boolean;
}

/** Campo de um corpo multipart. `file` fica adiado — só `text` na v1. */
export interface MultipartField {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  kind: "text";
}

export interface RequestAuth {
  type: AuthType;
  token: string;
  user: string;
  pass: string;
  apikeyName: string;
  apikeyValue: string;
  apikeyIn: "header" | "query";
}

export interface RequestBody {
  mode: BodyMode;
  text: string;
  form: KV[];
  multipart: MultipartField[];
}

export interface RequestOptions {
  /** null = sem timeout explícito. */
  timeoutMs: number | null;
  followRedirects: boolean;
  insecure: boolean;
}

export interface RequestSpec {
  id: string;
  name: string;
  /** null = na raiz da coleção. */
  folderId: string | null;
  method: string;
  url: string;
  /** Espelha a query string de `url`, mas preserva linhas desabilitadas/em branco. */
  params: KV[];
  headers: KV[];
  auth: RequestAuth;
  body: RequestBody;
  options: RequestOptions;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  /** null = na raiz. */
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Environment {
  id: string;
  name: string;
  vars: KV[];
}

/** Resumo da resposta guardado no histórico — nunca inclui o corpo. */
export interface ResponseSummary {
  status: number;
  statusText: string;
  timeMs: number;
  size: number;
  contentType: string;
}

export interface HistoryEntry {
  id: string;
  at: number;
  /** Snapshot profundo do request → restauração completa. */
  request: RequestSpec;
  response: ResponseSummary | null;
  error?: string;
}

export interface ApiClientStore {
  version: number;
  folders: Folder[];
  requests: RequestSpec[];
  environments: Environment[];
  globals: KV[];
  activeEnvId: string | null;
  history: HistoryEntry[];
}

// ---------- fábricas ----------

export function emptyKV(): KV {
  return { id: uid(), key: "", value: "", enabled: true };
}

export function emptyMultipartField(): MultipartField {
  return { id: uid(), key: "", value: "", enabled: true, kind: "text" };
}

export function emptyAuth(): RequestAuth {
  return {
    type: "none",
    token: "",
    user: "",
    pass: "",
    apikeyName: "",
    apikeyValue: "",
    apikeyIn: "header",
  };
}

export function emptyOptions(): RequestOptions {
  return { timeoutMs: null, followRedirects: true, insecure: false };
}

export function emptyRequest(folderId: string | null = null): RequestSpec {
  const now = Date.now();
  return {
    id: uid(),
    name: "",
    folderId,
    method: "GET",
    url: "",
    params: [emptyKV()],
    headers: [emptyKV()],
    auth: emptyAuth(),
    body: { mode: "none", text: "", form: [emptyKV()], multipart: [emptyMultipartField()] },
    options: emptyOptions(),
    createdAt: now,
    updatedAt: now,
  };
}

export function emptyFolder(parentId: string | null = null, name = "Nova pasta"): Folder {
  const now = Date.now();
  return { id: uid(), name, parentId, createdAt: now, updatedAt: now };
}

export function emptyEnvironment(name: string): Environment {
  return { id: uid(), name, vars: [emptyKV()] };
}

export function emptyHistoryEntry(
  request: RequestSpec,
  response: ResponseSummary | null,
  error?: string,
): HistoryEntry {
  return {
    id: uid(),
    at: Date.now(),
    request: structuredClone(request),
    response,
    error,
  };
}

export function emptyStore(): ApiClientStore {
  return {
    version: APICLIENT_STORE_VERSION,
    folders: [],
    requests: [],
    environments: [],
    globals: [],
    activeEnvId: null,
    history: [],
  };
}
