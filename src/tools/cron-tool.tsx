import { useMemo } from "react";
import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { Button, ErrorNote } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { describeCron, CRON_PRESETS } from "../lib/cron";

export function CronTool() {
  const [expr, setExpr] = useToolDraft("cron", "*/5 * * * *");
  const info = useMemo(() => describeCron(expr), [expr]);

  return (
    <ToolBody
      toolbar={
        <>
          {CRON_PRESETS.map((p) => (
            <Button key={p.expr} variant="ghost" onClick={() => setExpr(p.expr)}>
              {p.label}
            </Button>
          ))}
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <PaneHeading title="Expressão cron" />
          <input
            autoFocus
            value={expr}
            onChange={(e) => setExpr(e.currentTarget.value)}
            placeholder="min hora dia-mês mês dia-semana"
            className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 font-mono text-base"
          />
        </div>

        {info.error && <ErrorNote message={info.error} />}

        {info.description && (
          <>
            <p className="rounded-lg border border-line-strong bg-surface-2-2 p-4 text-lg">
              {info.description}
            </p>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <PaneHeading title="Campos" />
                <table className="mt-1.5 w-full text-sm">
                  <tbody>
                    {info.fields.map((f) => (
                      <tr
                        key={f.label}
                        className="border-b border-line last:border-0"
                      >
                        <td className="px-3 py-1.5 text-muted">{f.label}</td>
                        <td className="px-3 py-1.5 font-mono">{f.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <PaneHeading title="Próximas execuções" />
                <ul className="mt-1.5 space-y-1 text-sm">
                  {info.nextRuns.length > 0 ? (
                    info.nextRuns.map((r, i) => (
                      <li key={i} className="font-mono text-muted">
                        {r}
                      </li>
                    ))
                  ) : (
                    <li className="text-faint">
                      (não foi possível projetar execuções para esta expressão)
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </ToolBody>
  );
}
