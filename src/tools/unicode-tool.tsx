import { useMemo } from "react";
import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { Button } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { inspectText, normalize, stripDiacritics, type NormForm } from "../lib/unicode";

const SAMPLE = "Olá 👋 — café​com bug";
const FORMS: NormForm[] = ["NFC", "NFD", "NFKC", "NFKD"];

export function UnicodeTool() {
  const [input, setInput] = useToolDraft("unicode");
  const rows = useMemo(() => inspectText(input).slice(0, 2000), [input]);

  return (
    <ToolBody
      toolbar={
        <>
          <Button onClick={() => setInput(SAMPLE)}>Exemplo</Button>
          {FORMS.map((f) => (
            <Button key={f} variant="ghost" onClick={() => setInput(normalize(input, f))} disabled={!input}>
              {f}
            </Button>
          ))}
          <Button variant="ghost" onClick={() => setInput(stripDiacritics(input))} disabled={!input}>
            sem acento
          </Button>
          <div className="ml-auto">
            <Button variant="ghost" onClick={() => setInput("")} disabled={!input}>
              Limpar
            </Button>
          </div>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <PaneHeading title="Texto" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Cole o texto para inspecionar caractere a caractere…"
            className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 font-mono text-base text-ink placeholder:text-faint"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-2 text-left text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Char</th>
                <th className="px-3 py-2 font-medium">Code point</th>
                <th className="px-3 py-2 font-medium">Categoria</th>
                <th className="px-3 py-2 font-medium">Bloco</th>
                <th className="px-3 py-2 font-medium">UTF-8</th>
                <th className="px-3 py-2 font-medium">UTF-16</th>
                <th className="px-3 py-2 font-medium">HTML</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-line hover:bg-surface-2/60">
                  <td className="px-3 py-1 text-center font-mono text-base">
                    {r.invisible ? (
                      <span className="rounded bg-inset px-1 text-[10px] text-muted">
                        {r.name || "invis."}
                      </span>
                    ) : (
                      r.char
                    )}
                  </td>
                  <td className="px-3 py-1 font-mono text-ink">{r.hex}</td>
                  <td className="px-3 py-1 text-muted">{r.category}</td>
                  <td className="px-3 py-1 text-muted">{r.block}</td>
                  <td className="px-3 py-1 font-mono text-muted">{r.utf8}</td>
                  <td className="px-3 py-1 font-mono text-muted">{r.utf16}</td>
                  <td className="px-3 py-1 font-mono text-muted">{r.htmlEntity}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-faint">
                    Nada para inspecionar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ToolBody>
  );
}
