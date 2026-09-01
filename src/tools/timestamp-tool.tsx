import { useEffect, useState } from "react";
import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { Button, CopyButton, ErrorNote, Field, Segmented } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import {
  describeInstant,
  localTimeZone,
  parseDateString,
  parseEpoch,
  type EpochBreakdown,
} from "../lib/datetime";

export function TimestampTool() {
  const [input, setInput] = useToolDraft("timestamp");
  const [mode, setMode] = useState<"epoch" | "date">("epoch");
  const [tz, setTz] = useState(localTimeZone());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  let result: EpochBreakdown | null = null;
  let error: string | null = null;
  try {
    if (input.trim()) {
      const d = mode === "epoch" ? parseEpoch(input) : parseDateString(input);
      result = describeInstant(d, tz);
    }
  } catch (err) {
    error = (err as Error).message;
  }

  const rows: [string, string][] = result
    ? [
        ["Epoch (s)", String(result.epochSeconds)],
        ["Epoch (ms)", String(result.epochMillis)],
        ["ISO 8601", result.iso],
        ["UTC", result.utc],
        [tz, result.inZone],
        ["Relativo", result.relative],
      ]
    : [];

  return (
    <ToolBody
      toolbar={
        <>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "epoch", label: "Epoch → data" },
              { value: "date", label: "Data → epoch" },
            ]}
          />
          <Field label="Fuso">
            <input
              value={tz}
              onChange={(e) => setTz(e.currentTarget.value)}
              className="w-52 rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
            />
          </Field>
          <Button
            onClick={() =>
              setInput(
                mode === "epoch"
                  ? String(Math.floor(Date.now() / 1000))
                  : new Date().toISOString(),
              )
            }
          >
            Agora
          </Button>
          <span className="ml-auto text-xs text-faint">
            agora: {Math.floor(now / 1000)}
          </span>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <PaneHeading title={mode === "epoch" ? "Epoch" : "Data"} />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder={mode === "epoch" ? "1700000000" : "2026-08-31T12:00:00Z"}
            className="rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm dark:border-line"
          />
        </div>
        {error && <ErrorNote message={error} />}
        {result && (
          <div className="overflow-hidden rounded-md border border-line">
            <table className="w-full text-sm">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr
                    key={k}
                    className="border-b border-line last:border-0"
                  >
                    <td className="w-44 px-3 py-2 font-medium text-muted">{k}</td>
                    <td className="px-3 py-2 font-mono break-all">{v}</td>
                    <td className="px-1 py-1 text-right">
                      <CopyButton value={v} label="⧉" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ToolBody>
  );
}
