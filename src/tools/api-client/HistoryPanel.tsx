import type { ApiClientStoreApi } from "../../hooks/useApiClientStore";
import type { HistoryEntry } from "../../lib/apiclient-model";
import { METHOD_TONE, relativeTime, statusTone } from "./shared";

export function HistoryPanel({
  actions,
  onRestore,
}: {
  actions: ApiClientStoreApi;
  onRestore: (entry: HistoryEntry) => void;
}) {
  const { store } = actions;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="text-[11px] font-semibold text-faint uppercase">Histórico</span>
        {store.history.length > 0 && (
          <button
            onClick={actions.clearHistory}
            className="text-[11px] text-faint hover:text-red-500"
          >
            limpar
          </button>
        )}
      </div>
      {store.history.length === 0 && (
        <p className="px-1 text-xs text-faint">Nada enviado ainda.</p>
      )}
      {store.history.map((h) => (
        <button
          key={h.id}
          onClick={() => onRestore(h)}
          title="Restaurar este request"
          className="flex w-full items-center gap-1.5 truncate rounded px-1.5 py-1 text-left text-xs hover:bg-surface-2"
        >
          <span className={`font-mono ${METHOD_TONE[h.request.method] ?? "text-muted"}`}>
            {h.request.method}
          </span>
          {h.response ? (
            <span className={`rounded px-1 ${statusTone(h.response.status)}`}>{h.response.status}</span>
          ) : (
            <span className="rounded bg-red-100 px-1 text-red-700 dark:bg-red-500/20 dark:text-red-300">
              erro
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-muted">{h.request.url}</span>
          <span className="shrink-0 text-faint">{relativeTime(h.at)}</span>
        </button>
      ))}
    </div>
  );
}
