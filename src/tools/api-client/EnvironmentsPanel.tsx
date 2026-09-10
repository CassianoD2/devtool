import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Select } from "../../components/ui/primitives";
import type { ApiClientStoreApi } from "../../hooks/useApiClientStore";
import { emptyKV } from "../../lib/apiclient-model";
import { KVEditor } from "./KVEditor";

export function EnvironmentsPanel({ actions }: { actions: ApiClientStoreApi }) {
  const { store } = actions;
  const activeEnv = store.environments.find((e) => e.id === store.activeEnvId) ?? null;
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Select
          value={store.activeEnvId ?? ""}
          onChange={(e) => actions.setActiveEnv(e.currentTarget.value || null)}
          className="min-w-0 flex-1"
        >
          <option value="">Sem ambiente (só globais)</option>
          {store.environments.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
        <button
          onClick={() => {
            const env = actions.addEnv(`Ambiente ${store.environments.length + 1}`);
            actions.setActiveEnv(env.id);
            setRenameVal(env.name);
            setRenaming(true);
          }}
          className="grid size-7 shrink-0 place-items-center rounded-md border border-line text-muted hover:text-ink"
          aria-label="Novo ambiente"
          title="Novo ambiente"
        >
          <Plus size={14} />
        </button>
      </div>

      {activeEnv && (
        <div className="flex flex-col gap-1.5 rounded-md border border-line p-2">
          <div className="flex items-center gap-1.5">
            {renaming ? (
              <input
                autoFocus
                value={renameVal}
                onChange={(e) => setRenameVal(e.currentTarget.value)}
                onBlur={() => {
                  actions.renameEnv(activeEnv.id, renameVal.trim() || activeEnv.name);
                  setRenaming(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                className="min-w-0 flex-1 rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 text-sm"
              />
            ) : (
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{activeEnv.name}</span>
            )}
            <button
              onClick={() => {
                setRenameVal(activeEnv.name);
                setRenaming(true);
              }}
              className="text-faint hover:text-ink"
              aria-label="Renomear ambiente"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Excluir o ambiente "${activeEnv.name}"?`))
                  actions.deleteEnv(activeEnv.id);
              }}
              className="text-faint hover:text-red-500"
              aria-label="Excluir ambiente"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <KVEditor
            rows={activeEnv.vars}
            onChange={(vars) => actions.setEnvVars(activeEnv.id, vars)}
            emptyRow={emptyKV}
            withSecret
          />
        </div>
      )}

      <details className="rounded-md border border-line p-2">
        <summary className="cursor-pointer text-xs font-semibold text-faint uppercase">
          Globais
        </summary>
        <div className="pt-1.5">
          <KVEditor
            rows={store.globals.length ? store.globals : [emptyKV()]}
            onChange={actions.setGlobals}
            emptyRow={emptyKV}
            withSecret
          />
        </div>
      </details>

      <p className="px-1 text-[11px] text-faint">
        Use {"{{nome}}"} na URL, headers, params ou body. O ambiente ativo vence as globais.
        Valores ficam em texto puro no armazenamento local — “secreto” só oculta na tela.
      </p>
    </div>
  );
}
