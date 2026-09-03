import { useMemo, useState } from "react";
import { ToolBody } from "../components/ToolLayout";
import { Input } from "../components/ui/primitives";
import { REFERENCE, searchReference } from "../lib/reference";

export function ReferenceTool() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<string>("http");

  const searching = query.trim().length > 0;
  const sections = useMemo(() => searchReference(query), [query]);
  const visible = searching ? sections : sections.filter((s) => s.id === tab);

  return (
    <ToolBody
      toolbar={
        <>
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Buscar em todas as tabelas…"
            className="w-64"
          />
          {!searching &&
            REFERENCE.map((s) => (
              <button
                key={s.id}
                onClick={() => setTab(s.id)}
                className={`h-8 rounded-md px-3 text-sm font-medium transition-colors ${
                  tab === s.id
                    ? "bg-accent-soft text-accent-soft-fg ring-1 ring-inset ring-accent/25"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
        </>
      }
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-auto">
        {visible.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-faint">Nada encontrado.</p>
        )}
        {visible.map((sec) => (
          <div key={sec.id} className="overflow-hidden rounded-lg border border-line">
            {searching && (
              <div className="bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted uppercase">
                {sec.label}
              </div>
            )}
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted">
                <tr>
                  {sec.cols.map((c, i) => (
                    <th key={i} className="px-3 py-2 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sec.rows.map((r, i) => (
                  <tr key={i} className="border-t border-line hover:bg-surface-2/50">
                    <td className="px-3 py-1.5 font-mono whitespace-nowrap text-ink">{r.a}</td>
                    <td className="px-3 py-1.5 text-ink">{r.b}</td>
                    {sec.cols.length > 2 && (
                      <td className="px-3 py-1.5 font-mono text-xs text-muted">{r.c}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </ToolBody>
  );
}
