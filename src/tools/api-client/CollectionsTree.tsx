import { useState } from "react";
import {
  ChevronRight,
  Copy,
  FilePlus2,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import type { ApiClientStoreApi } from "../../hooks/useApiClientStore";
import {
  folderChildren,
  isDescendant,
  requestChildren,
} from "../../lib/apiclient-tree";
import type { Folder, RequestSpec } from "../../lib/apiclient-model";
import { METHOD_TONE } from "./shared";

function RenameInput({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (v: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(initial);
  return (
    <input
      autoFocus
      value={v}
      onChange={(e) => setV(e.currentTarget.value)}
      onBlur={() => onCommit(v.trim() || initial)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") onCancel();
      }}
      className="min-w-0 flex-1 rounded border border-line-strong bg-surface-2 px-1 py-0.5 text-sm"
    />
  );
}

function MoveSelect({
  value,
  options,
  onPick,
}: {
  value: string | null;
  options: Folder[];
  onPick: (id: string | null) => void;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onPick(e.currentTarget.value || null)}
      title="Mover para…"
      className="max-w-[90px] rounded border border-line bg-surface-2 px-1 py-0.5 text-[11px] text-muted"
    >
      <option value="">Raiz</option>
      {options.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  );
}

export function CollectionsTree({
  actions,
  openRequestId,
  onOpenRequest,
  expanded,
  onToggleExpand,
}: {
  actions: ApiClientStoreApi;
  openRequestId: string | null;
  onOpenRequest: (id: string) => void;
  expanded: string[];
  onToggleExpand: (id: string) => void;
}) {
  const { store } = actions;
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const folderOptions = (excludeId?: string): Folder[] =>
    store.folders.filter(
      (f) => f.id !== excludeId && !(excludeId && isDescendant(store.folders, excludeId, f.id)),
    );

  const renderRequest = (r: RequestSpec, depth: number) => {
    const active = r.id === openRequestId;
    return (
      <div
        key={r.id}
        className={`group flex items-center gap-1 rounded pr-1 ${
          active ? "bg-accent-soft text-accent-soft-fg" : "hover:bg-surface-2"
        }`}
        style={{ paddingLeft: depth * 14 + 8 }}
      >
        {renamingId === r.id ? (
          <RenameInput
            initial={r.name}
            onCommit={(v) => {
              actions.renameRequest(r.id, v);
              setRenamingId(null);
            }}
            onCancel={() => setRenamingId(null)}
          />
        ) : (
          <button
            onClick={() => onOpenRequest(r.id)}
            className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left text-sm"
          >
            <span className={`font-mono text-[10px] ${METHOD_TONE[r.method] ?? "text-muted"}`}>
              {r.method}
            </span>
            <span className="truncate">{r.name || r.url || "Sem nome"}</span>
          </button>
        )}
        <div className="hidden items-center gap-0.5 group-hover:flex">
          <MoveSelect
            value={r.folderId}
            options={folderOptions()}
            onPick={(id) => actions.moveRequest(r.id, id)}
          />
          <button onClick={() => setRenamingId(r.id)} className="text-faint hover:text-ink" aria-label="Renomear">
            <Pencil size={13} />
          </button>
          <button
            onClick={() => {
              const dup = actions.duplicateRequest(r.id);
              onOpenRequest(dup.id);
            }}
            className="text-faint hover:text-ink"
            aria-label="Duplicar"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Excluir o request "${r.name || r.url}"?`)) actions.deleteRequest(r.id);
            }}
            className="text-faint hover:text-red-500"
            aria-label="Excluir"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  };

  const renderFolder = (f: Folder, depth: number) => {
    const open = expanded.includes(f.id);
    const subFolders = folderChildren(store.folders, f.id);
    const subReqs = requestChildren(store.requests, f.id);
    return (
      <div key={f.id}>
        <div
          className="group flex items-center gap-1 rounded pr-1 hover:bg-surface-2"
          style={{ paddingLeft: depth * 14 + 2 }}
        >
          <button
            onClick={() => onToggleExpand(f.id)}
            className="grid size-5 shrink-0 place-items-center text-faint"
            aria-label={open ? "Recolher" : "Expandir"}
          >
            <ChevronRight size={13} className={`transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
          {renamingId === f.id ? (
            <RenameInput
              initial={f.name}
              onCommit={(v) => {
                actions.renameFolder(f.id, v);
                setRenamingId(null);
              }}
              onCancel={() => setRenamingId(null)}
            />
          ) : (
            <button
              onClick={() => onToggleExpand(f.id)}
              className="min-w-0 flex-1 truncate py-1 text-left text-sm font-medium"
            >
              {f.name}
            </button>
          )}
          <div className="hidden items-center gap-0.5 group-hover:flex">
            <MoveSelect
              value={f.parentId}
              options={folderOptions(f.id)}
              onPick={(id) => actions.moveFolder(f.id, id)}
            />
            <button
              onClick={() => {
                const req = actions.addRequest(f.id, { name: "Novo request" });
                if (!open) onToggleExpand(f.id);
                onOpenRequest(req.id);
              }}
              className="text-faint hover:text-ink"
              aria-label="Novo request"
            >
              <FilePlus2 size={13} />
            </button>
            <button
              onClick={() => {
                const sub = actions.addFolder(f.id);
                if (!open) onToggleExpand(f.id);
                setRenamingId(sub.id);
              }}
              className="text-faint hover:text-ink"
              aria-label="Nova subpasta"
            >
              <FolderPlus size={13} />
            </button>
            <button onClick={() => setRenamingId(f.id)} className="text-faint hover:text-ink" aria-label="Renomear">
              <Pencil size={13} />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Excluir a pasta "${f.name}" e todo o conteúdo?`))
                  actions.deleteFolder(f.id);
              }}
              className="text-faint hover:text-red-500"
              aria-label="Excluir"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        {open && (
          <div>
            {subFolders.map((sf) => renderFolder(sf, depth + 1))}
            {subReqs.map((r) => renderRequest(r, depth + 1))}
            {subFolders.length === 0 && subReqs.length === 0 && (
              <p className="py-1 text-[11px] text-faint" style={{ paddingLeft: (depth + 1) * 14 + 8 }}>
                vazia
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const rootFolders = folderChildren(store.folders, null);
  const rootReqs = requestChildren(store.requests, null);

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 px-1">
        <button
          onClick={() => {
            const r = actions.addRequest(null, { name: "Novo request" });
            onOpenRequest(r.id);
          }}
          className="flex flex-1 items-center gap-1.5 rounded px-1.5 py-1 text-xs text-muted hover:bg-surface-2 hover:text-ink"
        >
          <FilePlus2 size={13} /> Novo request
        </button>
        <button
          onClick={() => {
            const f = actions.addFolder(null);
            setRenamingId(f.id);
          }}
          className="flex items-center gap-1.5 rounded px-1.5 py-1 text-xs text-muted hover:bg-surface-2 hover:text-ink"
        >
          <FolderPlus size={13} /> Pasta
        </button>
      </div>

      {rootFolders.map((f) => renderFolder(f, 0))}
      {rootReqs.map((r) => renderRequest(r, 0))}
      {rootFolders.length === 0 && rootReqs.length === 0 && (
        <p className="px-2 py-2 text-xs text-faint">
          Nenhuma coleção ainda. Crie um request ou uma pasta.
        </p>
      )}
    </div>
  );
}
