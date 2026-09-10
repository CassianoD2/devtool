/**
 * Operações imutáveis sobre a árvore de coleções (pastas + requests).
 * Todo mutador devolve um novo `ApiClientStore`; nada é alterado no lugar.
 */

import {
  emptyFolder,
  emptyRequest,
  uid,
  type ApiClientStore,
  type Folder,
  type RequestSpec,
} from "./apiclient-model";

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });

export function folderChildren(folders: Folder[], parentId: string | null): Folder[] {
  return folders.filter((f) => f.parentId === parentId).sort(byName);
}

export function requestChildren(
  requests: RequestSpec[],
  folderId: string | null,
): RequestSpec[] {
  return requests.filter((r) => r.folderId === folderId).sort(byName);
}

/** Caminho da raiz até a pasta `id`, inclusive. Vazio se `id` não existe. */
export function folderPath(folders: Folder[], id: string): Folder[] {
  const map = new Map(folders.map((f) => [f.id, f]));
  const path: Folder[] = [];
  let cur = map.get(id);
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    path.unshift(cur);
    cur = cur.parentId ? map.get(cur.parentId) : undefined;
  }
  return path;
}

/** `nodeId` está dentro da subárvore de `ancestorId`? (`isDescendant(x, x)` = false) */
export function isDescendant(
  folders: Folder[],
  ancestorId: string,
  nodeId: string,
): boolean {
  if (ancestorId === nodeId) return false;
  const map = new Map(folders.map((f) => [f.id, f]));
  let cur = map.get(nodeId);
  const seen = new Set<string>();
  while (cur && cur.parentId && !seen.has(cur.id)) {
    seen.add(cur.id);
    if (cur.parentId === ancestorId) return true;
    cur = map.get(cur.parentId);
  }
  return false;
}

export function addFolder(
  store: ApiClientStore,
  parentId: string | null,
  name = "Nova pasta",
): { store: ApiClientStore; folder: Folder } {
  const folder = { ...emptyFolder(parentId, name) };
  return { store: { ...store, folders: [...store.folders, folder] }, folder };
}

export function renameFolder(
  store: ApiClientStore,
  id: string,
  name: string,
): ApiClientStore {
  return {
    ...store,
    folders: store.folders.map((f) =>
      f.id === id ? { ...f, name, updatedAt: Date.now() } : f,
    ),
  };
}

export function renameRequest(
  store: ApiClientStore,
  id: string,
  name: string,
): ApiClientStore {
  return updateRequest(store, id, { name });
}

export function moveFolder(
  store: ApiClientStore,
  id: string,
  newParentId: string | null,
): ApiClientStore {
  if (newParentId === id) return store;
  if (newParentId !== null && !store.folders.some((f) => f.id === newParentId)) return store;
  if (newParentId !== null && isDescendant(store.folders, id, newParentId)) return store;
  const target = store.folders.find((f) => f.id === id);
  if (!target || target.parentId === newParentId) return store;
  return {
    ...store,
    folders: store.folders.map((f) =>
      f.id === id ? { ...f, parentId: newParentId, updatedAt: Date.now() } : f,
    ),
  };
}

export function moveRequest(
  store: ApiClientStore,
  id: string,
  newFolderId: string | null,
): ApiClientStore {
  if (newFolderId !== null && !store.folders.some((f) => f.id === newFolderId)) return store;
  return updateRequest(store, id, { folderId: newFolderId });
}

/** Coleta a pasta `id` e todas as descendentes. */
function subtreeFolderIds(folders: Folder[], id: string): Set<string> {
  const ids = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of folders) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
        ids.add(f.id);
        grew = true;
      }
    }
  }
  return ids;
}

export function deleteFolder(
  store: ApiClientStore,
  id: string,
  opts: { cascade?: boolean } = {},
): ApiClientStore {
  const cascade = opts.cascade ?? true;
  const target = store.folders.find((f) => f.id === id);
  if (!target) return store;

  if (cascade) {
    const doomed = subtreeFolderIds(store.folders, id);
    return {
      ...store,
      folders: store.folders.filter((f) => !doomed.has(f.id)),
      requests: store.requests.filter((r) => !(r.folderId && doomed.has(r.folderId))),
    };
  }

  // reparenta filhos diretos e requests para o pai da pasta removida
  return {
    ...store,
    folders: store.folders
      .filter((f) => f.id !== id)
      .map((f) => (f.parentId === id ? { ...f, parentId: target.parentId, updatedAt: Date.now() } : f)),
    requests: store.requests.map((r) =>
      r.folderId === id ? { ...r, folderId: target.parentId, updatedAt: Date.now() } : r,
    ),
  };
}

export function deleteRequest(store: ApiClientStore, id: string): ApiClientStore {
  return { ...store, requests: store.requests.filter((r) => r.id !== id) };
}

export function addRequest(
  store: ApiClientStore,
  folderId: string | null,
  seed?: Partial<RequestSpec>,
): { store: ApiClientStore; request: RequestSpec } {
  const request: RequestSpec = { ...emptyRequest(folderId), ...seed, folderId };
  return { store: { ...store, requests: [...store.requests, request] }, request };
}

export function updateRequest(
  store: ApiClientStore,
  id: string,
  patch: Partial<RequestSpec>,
): ApiClientStore {
  return {
    ...store,
    requests: store.requests.map((r) =>
      r.id === id ? { ...r, ...patch, id: r.id, createdAt: r.createdAt, updatedAt: Date.now() } : r,
    ),
  };
}

export function duplicateRequest(
  store: ApiClientStore,
  id: string,
): { store: ApiClientStore; request: RequestSpec } {
  const src = store.requests.find((r) => r.id === id);
  if (!src) return { store, request: src as unknown as RequestSpec };
  const now = Date.now();
  const request: RequestSpec = {
    ...structuredClone(src),
    id: uid(),
    name: `${src.name || "Sem nome"} (cópia)`,
    createdAt: now,
    updatedAt: now,
  };
  return { store: { ...store, requests: [...store.requests, request] }, request };
}
