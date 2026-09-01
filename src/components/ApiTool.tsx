import { useEffect, useRef, useState, type ReactNode } from "react";
import { ToolBody } from "./ToolLayout";
import { Button, CopyButton, ErrorNote } from "./ui/primitives";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface ApiToolProps<T> {
  toolId: string;
  inputMode?: "text" | "none";
  placeholder?: string;
  sample?: string;
  buttonLabel?: string;
  run: (query: string) => Promise<T>;
  renderResult: (data: T) => ReactNode;
  /** run immediately on mount (for inputless queries like "list banks") */
  autoRun?: boolean;
}

export function ApiTool<T>({
  toolId,
  inputMode = "text",
  placeholder,
  sample,
  buttonLabel = "Consultar",
  run,
  renderResult,
  autoRun = false,
}: ApiToolProps<T>) {
  const [query, setQuery] = useLocalStorage(`devtool:query:${toolId}`, "");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  async function submit(q: string) {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await run(q);
      if (id === reqId.current) setData(result);
    } catch (err) {
      if (id === reqId.current) {
        setError((err as Error).message);
        setData(null);
      }
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (autoRun) void submit("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  const raw = data != null ? JSON.stringify(data, null, 2) : "";

  return (
    <ToolBody
      toolbar={
        <form
          className="flex w-full items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(query);
          }}
        >
          {inputMode === "text" && (
            <>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder={placeholder}
                className="w-64 rounded-md border border-line bg-surface px-3 py-1.5 text-sm"
              />
              {sample && (
                <Button type="button" variant="ghost" onClick={() => setQuery(sample)}>
                  Exemplo
                </Button>
              )}
            </>
          )}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Consultando…" : buttonLabel}
          </Button>
        </form>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto">
        {error && <ErrorNote message={error} />}
        {data != null && (
          <>
            <div className="rounded-lg border border-line p-4 dark:border-line">
              {renderResult(data)}
            </div>
            <details className="rounded-lg border border-line">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-2 text-sm font-medium text-muted">
                JSON bruto
                <CopyButton value={raw} />
              </summary>
              <pre className="max-h-80 overflow-auto border-t border-line px-4 py-3 font-mono text-xs dark:border-line">
                {raw}
              </pre>
            </details>
          </>
        )}
        {data == null && !error && !loading && (
          <p className="text-sm text-faint">
            {inputMode === "text"
              ? "Informe um valor e clique em Consultar."
              : "Carregando…"}
          </p>
        )}
      </div>
    </ToolBody>
  );
}

/** Simple definition list used by several result renderers. */
export function DefList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-medium text-muted">{k}</dt>
          <dd className="break-words">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
