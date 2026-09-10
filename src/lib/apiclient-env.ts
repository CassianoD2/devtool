/**
 * Ambientes nomeados + montagem final da requisição.
 * Precedência: variáveis do ambiente ativo vencem as globais.
 */

import { resolveVars, toSendable } from "./apiclient";
import {
  emptyEnvironment,
  type ApiClientStore,
  type Environment,
  type KV,
  type RequestSpec,
} from "./apiclient-model";
import type { ParsedRequest } from "./curl";

/** Variáveis efetivas: ambiente ativo primeiro (vence), depois globais. */
export function activeVars(store: ApiClientStore): KV[] {
  const env = store.environments.find((e) => e.id === store.activeEnvId);
  return [
    ...(env?.vars ?? []).filter((v) => v.enabled && v.key.trim()),
    ...store.globals.filter((v) => v.enabled && v.key.trim()),
  ];
}

/** Constrói o `ParsedRequest` pronto para envio, com vars resolvidas. */
export function resolveSpec(spec: RequestSpec, store: ApiClientStore): ParsedRequest {
  return toSendable(spec, activeVars(store));
}

/** Tokens `{{x}}` usados no request que nenhuma variável ativa cobre. */
export function missingVarNames(spec: RequestSpec, store: ApiClientStore): string[] {
  const re = /\{\{\s*([\w.-]+)\s*\}\}/g;
  const grab = (s: string) => [...s.matchAll(re)].map((m) => m[1]);
  const used = new Set<string>([
    ...grab(spec.url),
    ...spec.headers.flatMap((h) => [...grab(h.key), ...grab(h.value)]),
    ...grab(spec.body.text),
    ...spec.body.form.flatMap((f) => [...grab(f.key), ...grab(f.value)]),
    ...spec.body.multipart.flatMap((f) => [...grab(f.key), ...grab(f.value)]),
    ...grab(spec.auth.token),
    ...grab(spec.auth.user),
    ...grab(spec.auth.pass),
    ...grab(spec.auth.apikeyName),
    ...grab(spec.auth.apikeyValue),
  ]);
  const defined = new Set(activeVars(store).map((v) => v.key));
  return [...used].filter((n) => !defined.has(n));
}

/** Máscara para linhas marcadas como secretas (só afeta a exibição). */
export function maskValue(v: string): string {
  return v ? "•".repeat(Math.min(Math.max(v.length, 4), 12)) : "";
}

/** Aplica `{{vars}}` a um texto avulso (ex.: preview da URL). */
export function resolveText(text: string, store: ApiClientStore): string {
  return resolveVars(text, activeVars(store));
}

// ---------- CRUD de ambientes ----------

export function addEnvironment(
  store: ApiClientStore,
  name: string,
): { store: ApiClientStore; env: Environment } {
  const env = emptyEnvironment(name);
  return { store: { ...store, environments: [...store.environments, env] }, env };
}

export function renameEnvironment(
  store: ApiClientStore,
  id: string,
  name: string,
): ApiClientStore {
  return {
    ...store,
    environments: store.environments.map((e) => (e.id === id ? { ...e, name } : e)),
  };
}

export function deleteEnvironment(store: ApiClientStore, id: string): ApiClientStore {
  return {
    ...store,
    environments: store.environments.filter((e) => e.id !== id),
    activeEnvId: store.activeEnvId === id ? null : store.activeEnvId,
  };
}

export function setActiveEnv(store: ApiClientStore, id: string | null): ApiClientStore {
  const valid = id !== null && store.environments.some((e) => e.id === id);
  return { ...store, activeEnvId: valid ? id : null };
}

export function setEnvVars(
  store: ApiClientStore,
  id: string,
  vars: KV[],
): ApiClientStore {
  return {
    ...store,
    environments: store.environments.map((e) => (e.id === id ? { ...e, vars } : e)),
  };
}

export function setGlobals(store: ApiClientStore, vars: KV[]): ApiClientStore {
  return { ...store, globals: vars };
}
