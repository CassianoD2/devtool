import { useState } from "react";
import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { CopyButton, ErrorNote } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { parseColor, formatColor, contrast, type Rgb } from "../lib/color";

const inputCls =
 "rounded-md border border-line-strong bg-surface-2 px-3 py-2 font-mono text-sm";

function safeParse(v: string): { rgb: Rgb | null; error: string | null } {
  try {
    return { rgb: parseColor(v), error: null };
  } catch (err) {
    return { rgb: null, error: (err as Error).message };
  }
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
 ok
          ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
      }`}
    >
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

export function ColorTool() {
  const [fg, setFg] = useToolDraft("color", "#3b82f6");
  const [bg, setBg] = useState("#ffffff");

  const { rgb: fgRgb, error: fgErr } = safeParse(fg);
  const { rgb: bgRgb } = safeParse(bg);

  const conv = fgRgb ? formatColor(fgRgb) : null;
  const ratio = fgRgb && bgRgb ? contrast(fgRgb, bgRgb) : null;
  const css = (c: Rgb) => `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;

  return (
    <ToolBody>
      <div className="flex h-full min-h-0 flex-col gap-5">
        <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
          <div
            className="size-32 shrink-0 rounded-lg border border-line"
            style={{ background: fgRgb ? css(fgRgb) : "transparent" }}
          />
          <div className="flex flex-col gap-2">
            <PaneHeading title="Cor" />
            <input
              autoFocus
              value={fg}
              onChange={(e) => setFg(e.currentTarget.value)}
              placeholder="#3b82f6  ·  rgb(59 130 246)  ·  hsl(217 91% 60%)"
              className={inputCls}
            />
            {fgErr && <ErrorNote message={fgErr} />}
            {conv && (
              <table className="text-sm">
                <tbody>
                  {Object.entries(conv).map(([k, v]) => (
                    <tr key={k}>
                      <td className="py-1 pr-3 text-muted uppercase">{k}</td>
                      <td className="py-1 pr-2 font-mono">{v}</td>
                      <td>
                        <CopyButton value={v} label="⧉" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-line p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink">
            Contraste WCAG
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-muted">Fundo</label>
            <input value={bg} onChange={(e) => setBg(e.currentTarget.value)} className={`w-48 ${inputCls}`} />
            {ratio && (
              <span className="text-lg font-semibold">
                {ratio.ratio.toFixed(2)}
                <span className="text-sm font-normal text-faint"> : 1</span>
              </span>
            )}
          </div>

          {ratio && fgRgb && bgRgb && (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge ok={ratio.aaNormal} label="AA texto normal" />
                <Badge ok={ratio.aaLarge} label="AA texto grande" />
                <Badge ok={ratio.aaaNormal} label="AAA texto normal" />
                <Badge ok={ratio.aaaLarge} label="AAA texto grande" />
              </div>
              <div
                className="mt-3 rounded-md p-4"
                style={{ background: css(bgRgb), color: css(fgRgb) }}
              >
                <p className="text-base">Texto normal — o rato roeu a roupa do rei de Roma.</p>
                <p className="text-xl font-bold">Texto grande — 1234567890</p>
              </div>
            </>
          )}
        </div>
      </div>
    </ToolBody>
  );
}
