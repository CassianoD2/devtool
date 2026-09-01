import { useMemo, useState } from "react";
import { ToolBody, TwoPane, PaneHeading } from "../components/ToolLayout";
import { Button, Checkbox, Segmented } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { computeDiff, type DiffMode } from "../lib/textdiff";

export function TextDiff() {
  const [a, setA] = useToolDraft("text-diff:a");
  const [b, setB] = useToolDraft("text-diff:b");
  const [mode, setMode] = useState<DiffMode>("lines");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const { parts, stats } = useMemo(
    () => computeDiff(a, b, { mode, ignoreCase, ignoreWhitespace }),
    [a, b, mode, ignoreCase, ignoreWhitespace],
  );

  const ta =
 "min-h-0 flex-1 resize-y rounded-md border border-line-strong bg-surface-2 p-3 font-mono text-sm";

  return (
    <ToolBody
      toolbar={
        <>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "lines", label: "Por linha" },
              { value: "words", label: "Por palavra" },
            ]}
          />
          <Checkbox label="Ignorar caixa" checked={ignoreCase} onChange={setIgnoreCase} />
          {mode === "lines" && (
            <Checkbox
              label="Ignorar espaços"
              checked={ignoreWhitespace}
              onChange={setIgnoreWhitespace}
            />
          )}
          <span className="text-xs">
            <span className="text-green-600">+{stats.added}</span>{" "}
            <span className="text-red-600">−{stats.removed}</span>
          </span>
          <div className="ml-auto">
            <Button
              variant="ghost"
              onClick={() => {
                setA("");
                setB("");
              }}
              disabled={!a && !b}
            >
              Limpar
            </Button>
          </div>
        </>
      }
    >
      <div className="grid h-full min-h-0 grid-rows-[1fr_1.2fr] gap-3">
        <TwoPane
        storageKey="diff"
          left={
            <>
              <PaneHeading title="Original (A)" />
              <textarea value={a} onChange={(e) => setA(e.currentTarget.value)} className={ta} />
            </>
          }
          right={
            <>
              <PaneHeading title="Modificado (B)" />
              <textarea value={b} onChange={(e) => setB(e.currentTarget.value)} className={ta} />
            </>
          }
        />
        <div className="flex min-h-0 flex-col gap-1.5">
          <PaneHeading title="Diferença" />
          <pre className="min-h-0 flex-1 overflow-auto rounded-md border border-line p-3 font-mono text-xs whitespace-pre-wrap">
            {parts.map((p, i) => (
              <span
                key={i}
                className={
                  p.added
                    ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300"
                    : p.removed
                      ? "bg-red-100 text-red-800 line-through dark:bg-red-500/20 dark:text-red-300"
                      : "text-muted"
                }
              >
                {p.value}
              </span>
            ))}
          </pre>
        </div>
      </div>
    </ToolBody>
  );
}
