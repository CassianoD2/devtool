import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../components/ui/Toast";
import {
  HISTORY_CAP,
  emptyStore,
  type ApiClientStore,
  type Environment,
  type Folder,
  type HistoryEntry,
  type KV,
  type RequestSpec,
} from "../lib/apiclient-model";
import { STORE_KEY, runMigration } from "../lib/apiclient-migrate";
import * as tree from "../lib/apiclient-tree";
import * as env from "../lib/apiclient-env";

export interface ApiClientStoreApi {
  store: ApiClientStore;
  addFolder: (parentId: string | null, name?: string) => Folder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string, opts?: { cascade?: boolean }) => void;
  moveFolder: (id: string, parentId: string | null) => void;
  addRequest: (folderId: string | null, seed?: Partial<RequestSpec>) => RequestSpec;
  updateRequest: (id: string, patch: Partial<RequestSpec>) => void;
  renameRequest: (id: string, name: string) => void;
  deleteRequest: (id: string) => void;
  moveRequest: (id: string, folderId: string | null) => void;
  duplicateRequest: (id: string) => RequestSpec;
  addEnv: (name: string) => Environment;
  renameEnv: (id: string, name: string) => void;
  deleteEnv: (id: string) => void;
  setActiveEnv: (id: string | null) => void;
  setEnvVars: (id: string, vars: KV[]) => void;
  setGlobals: (vars: KV[]) => void;
  pushHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;
  replaceStore: (next: ApiClientStore) => void;
}

function sameRequest(a: RequestSpec, b: RequestSpec): boolean {
  return a.method === b.method && a.url === b.url && a.body.text === b.body.text;
}

export function useApiClientStore(): ApiClientStoreApi {
  const toast = useToast();
  const [store, setStoreRaw] = useState<ApiClientStore>(() => runMigration() ?? emptyStore());

  const ref = useRef(store);
  ref.current = store;

  // persistência com debounce; toast em quota cheia (useLocalStorage engoliria calado)
  const quotaWarned = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(store));
      } catch {
        if (!quotaWarned.current) {
          quotaWarned.current = true;
          toast("Armazenamento cheio — exporte e limpe o histórico.", "error");
        }
      }
    }, 300);
    return () => clearTimeout(t);
  }, [store, toast]);

  const addFolder = useCallback((parentId: string | null, name?: string) => {
    const r = tree.addFolder(ref.current, parentId, name);
    setStoreRaw(r.store);
    return r.folder;
  }, []);

  const addRequest = useCallback((folderId: string | null, seed?: Partial<RequestSpec>) => {
    const r = tree.addRequest(ref.current, folderId, seed);
    setStoreRaw(r.store);
    return r.request;
  }, []);

  const duplicateRequest = useCallback((id: string) => {
    const r = tree.duplicateRequest(ref.current, id);
    setStoreRaw(r.store);
    return r.request;
  }, []);

  const addEnv = useCallback((name: string) => {
    const r = env.addEnvironment(ref.current, name);
    setStoreRaw(r.store);
    return r.env;
  }, []);

  const pushHistory = useCallback((entry: HistoryEntry) => {
    setStoreRaw((s) => {
      const top = s.history[0];
      const rest = top && sameRequest(top.request, entry.request) ? s.history.slice(1) : s.history;
      return { ...s, history: [entry, ...rest].slice(0, HISTORY_CAP) };
    });
  }, []);

  return {
    store,
    addFolder,
    renameFolder: useCallback((id, name) => setStoreRaw((s) => tree.renameFolder(s, id, name)), []),
    deleteFolder: useCallback((id, opts) => setStoreRaw((s) => tree.deleteFolder(s, id, opts)), []),
    moveFolder: useCallback((id, parentId) => setStoreRaw((s) => tree.moveFolder(s, id, parentId)), []),
    addRequest,
    updateRequest: useCallback((id, patch) => setStoreRaw((s) => tree.updateRequest(s, id, patch)), []),
    renameRequest: useCallback((id, name) => setStoreRaw((s) => tree.renameRequest(s, id, name)), []),
    deleteRequest: useCallback((id) => setStoreRaw((s) => tree.deleteRequest(s, id)), []),
    moveRequest: useCallback((id, folderId) => setStoreRaw((s) => tree.moveRequest(s, id, folderId)), []),
    duplicateRequest,
    addEnv,
    renameEnv: useCallback((id, name) => setStoreRaw((s) => env.renameEnvironment(s, id, name)), []),
    deleteEnv: useCallback((id) => setStoreRaw((s) => env.deleteEnvironment(s, id)), []),
    setActiveEnv: useCallback((id) => setStoreRaw((s) => env.setActiveEnv(s, id)), []),
    setEnvVars: useCallback((id, vars) => setStoreRaw((s) => env.setEnvVars(s, id, vars)), []),
    setGlobals: useCallback((vars) => setStoreRaw((s) => env.setGlobals(s, vars)), []),
    pushHistory,
    clearHistory: useCallback(() => setStoreRaw((s) => ({ ...s, history: [] })), []),
    replaceStore: useCallback((next) => setStoreRaw(next), []),
  };
}
