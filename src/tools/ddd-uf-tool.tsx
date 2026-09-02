import { useMemo, useState } from "react";
import { ToolBody } from "../components/ToolLayout";
import { Input } from "../components/ui/primitives";
import { ALL_DDDS, lookupDdd } from "../lib/dddtable";

export function DddUfTool() {
  const [q, setQ] = useState("");

  const hit = useMemo(() => (/\d/.test(q) ? lookupDdd(q) : null), [q]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return ALL_DDDS;
    return ALL_DDDS.filter(
      (d) =>
        d.ddd.includes(term) ||
        d.uf.toLowerCase().includes(term) ||
        d.regiao.toLowerCase().includes(term) ||
        d.ref.toLowerCase().includes(term),
    );
  }, [q]);

  return (
    <ToolBody
      toolbar={
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          placeholder="DDD, UF, região ou cidade…"
          className="w-64"
        />
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        {hit && (
          <div className="rounded-lg border border-accent bg-accent-soft px-4 py-3">
            <span className="font-mono text-2xl text-ink">{hit.ddd}</span>
            <span className="ml-3 text-lg font-semibold text-ink">{hit.uf}</span>
            <span className="ml-2 text-sm text-muted">· {hit.regiao}</span>
            <div className="mt-1 text-sm text-muted">{hit.ref}</div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-2 text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">DDD</th>
                <th className="px-4 py-2 font-medium">UF</th>
                <th className="px-4 py-2 font-medium">Região</th>
                <th className="px-4 py-2 font-medium">Referência</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.ddd} className="border-t border-line hover:bg-surface-2/60">
                  <td className="px-4 py-1.5 font-mono text-ink">{d.ddd}</td>
                  <td className="px-4 py-1.5 font-semibold text-ink">{d.uf}</td>
                  <td className="px-4 py-1.5 text-muted">{d.regiao}</td>
                  <td className="px-4 py-1.5 text-muted">{d.ref}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-faint">
                    Nada encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-faint">
          Tabela offline (DDD → UF). Para a lista de cidades de um DDD, use a ferramenta “DDD”.
        </p>
      </div>
    </ToolBody>
  );
}
