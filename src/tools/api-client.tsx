import { useCallback, useState } from "react";
import { SplitPane } from "../components/ui/SplitPane";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useApiClientStore } from "../hooks/useApiClientStore";
import { emptyHistoryEntry, type HistoryEntry } from "../lib/apiclient-model";
import { resolveSpec } from "../lib/apiclient-env";
import { sendRequest, type HttpResult } from "../lib/httpclient";
import { CollectionsTree } from "./api-client/CollectionsTree";
import { EnvironmentsPanel } from "./api-client/EnvironmentsPanel";
import { HistoryPanel } from "./api-client/HistoryPanel";
import { RequestBuilder } from "./api-client/RequestBuilder";
import { ResponseViewer } from "./api-client/ResponseViewer";
import { BackupBar } from "./api-client/BackupBar";

type ReqTab = "params" | "headers" | "body" | "auth" | "options";

interface UiState {
  openRequestId: string | null;
  expandedFolderIds: string[];
  reqTab: ReqTab;
  bodyView: "pretty" | "raw";
}

const DEFAULT_UI: UiState = {
  openRequestId: null,
  expandedFolderIds: [],
  reqTab: "params",
  bodyView: "pretty",
};

/** Último resultado exibido (não vai no `ApiClientStore` versionado — corpo pode ser grande). */
interface LastResult {
  requestId: string;
  response: HttpResult | null;
  error: string | null;
}

/** Acima disso não persiste o corpo (evita estourar a quota do localStorage). */
const MAX_PERSIST_SIZE = 2_000_000;

export function ApiClientWorkspace() {
  const actions = useApiClientStore();
  const { store } = actions;
  const [ui, setUi] = useLocalStorage<UiState>("devtool:apiclient:ui", DEFAULT_UI);
  const [lastResult, setLastResult] = useLocalStorage<LastResult | null>(
    "devtool:apiclient:lastresult",
    null,
  );

  const openReq =
    store.requests.find((r) => r.id === ui.openRequestId) ?? store.requests[0] ?? null;

  const [response, setResponse] = useState<HttpResult | null>(() =>
    lastResult && openReq && lastResult.requestId === openReq.id ? lastResult.response : null,
  );
  const [error, setError] = useState<string | null>(() =>
    lastResult && openReq && lastResult.requestId === openReq.id ? lastResult.error : null,
  );
  const [sending, setSending] = useState(false);

  function persistResult(requestId: string, res: HttpResult | null, err: string | null) {
    if (res && res.size > MAX_PERSIST_SIZE) {
      setLastResult(null); // corpo grande demais — não persiste, some após reload
      return;
    }
    setLastResult({ requestId, response: res, error: err });
  }

  const patchUi = useCallback(
    (p: Partial<UiState>) => setUi((prev) => ({ ...prev, ...p })),
    [setUi],
  );

  const openRequest = useCallback(
    (id: string) => {
      if (lastResult && lastResult.requestId === id) {
        setResponse(lastResult.response);
        setError(lastResult.error);
      } else {
        setResponse(null);
        setError(null);
      }
      patchUi({ openRequestId: id });
    },
    [patchUi, lastResult],
  );

  const toggleExpand = useCallback(
    (id: string) =>
      setUi((prev) => ({
        ...prev,
        expandedFolderIds: prev.expandedFolderIds.includes(id)
          ? prev.expandedFolderIds.filter((x) => x !== id)
          : [...prev.expandedFolderIds, id],
      })),
    [setUi],
  );

  async function send() {
    if (!openReq) return;
    setSending(true);
    setError(null);
    try {
      const res = await sendRequest(resolveSpec(openReq, store));
      setResponse(res);
      persistResult(openReq.id, res, null);
      actions.pushHistory(
        emptyHistoryEntry(openReq, {
          status: res.status,
          statusText: res.statusText,
          timeMs: res.timeMs,
          size: res.size,
          contentType: res.contentType,
        }),
      );
    } catch (err) {
      setResponse(null);
      const msg = (err as Error).message;
      setError(msg);
      persistResult(openReq.id, null, msg);
      actions.pushHistory(emptyHistoryEntry(openReq, null, msg));
    } finally {
      setSending(false);
    }
  }

  function restore(entry: HistoryEntry) {
    const snap = entry.request;
    if (
      openReq &&
      openReq.method === snap.method &&
      openReq.url === snap.url &&
      openReq.body.text === snap.body.text
    ) {
      return; // já é esse request
    }
    const folderId = snap.folderId && store.folders.some((f) => f.id === snap.folderId)
      ? snap.folderId
      : null;
    const created = actions.addRequest(folderId, {
      name: snap.name || `${snap.method} ${snap.url}`.slice(0, 60) || "Do histórico",
      method: snap.method,
      url: snap.url,
      headers: structuredClone(snap.headers),
      auth: structuredClone(snap.auth),
      body: structuredClone(snap.body),
      options: structuredClone(snap.options),
    });
    openRequest(created.id);
  }

  const rail = (
    <aside className="flex h-full w-full flex-col gap-4 overflow-y-auto pr-2">
      <section>
        <div className="px-1 pb-1 text-[11px] font-semibold text-faint uppercase">Coleções</div>
        <CollectionsTree
          actions={actions}
          openRequestId={openReq?.id ?? null}
          onOpenRequest={openRequest}
          expanded={ui.expandedFolderIds}
          onToggleExpand={toggleExpand}
        />
      </section>

      <section>
        <div className="px-1 pb-1 text-[11px] font-semibold text-faint uppercase">Ambiente</div>
        <EnvironmentsPanel actions={actions} />
      </section>

      <section>
        <HistoryPanel actions={actions} onRestore={restore} />
      </section>
    </aside>
  );

  const mainCol = (
    <div className="flex h-full min-w-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <BackupBar actions={actions} />
      </div>

      {openReq ? (
        <SplitPane
          direction="vertical"
          storageKey="apiclient"
          initial={0.56}
          min={0.18}
          className="min-h-0 flex-1"
          first={
            <RequestBuilder
              key={openReq.id}
              req={openReq}
              store={store}
              actions={actions}
              reqTab={ui.reqTab}
              setReqTab={(t) => patchUi({ reqTab: t })}
              onSend={send}
              sending={sending}
            />
          }
          second={
            <ResponseViewer
              response={response}
              error={error}
              sending={sending}
              url={openReq.url}
              bodyView={ui.bodyView}
              setBodyView={(v) => patchUi({ bodyView: v })}
            />
          }
        />
      ) : (
        <div className="grid flex-1 place-items-center text-sm text-faint">
          Crie um request na barra lateral para começar.
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full min-h-0">
      <SplitPane
        storageKey="apiclient-rail"
        mode="pixels"
        initial={264}
        minPx={200}
        maxPx={460}
        className="h-full w-full"
        first={rail}
        second={mainCol}
      />
    </div>
  );
}
