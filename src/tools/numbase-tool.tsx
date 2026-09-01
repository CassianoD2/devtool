import { useState } from "react";
import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { Button, CopyButton, ErrorNote, Field, Select } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { BASES, convertNumberBase, type Base } from "../lib/numbase";

export function NumBaseTool() {
  const [input, setInput] = useToolDraft("numbase");
  const [from, setFrom] = useState<Base>(10);

  let rows: Record<Base, string> | null = null;
  let error: string | null = null;
  try {
    if (input.trim()) rows = convertNumberBase(input, from);
  } catch (err) {
    error = (err as Error).message;
  }

  return (
    <ToolBody
      toolbar={
        <>
          <Field label="Base de entrada">
            <Select
              value={String(from)}
              onChange={(e) => setFrom(Number(e.currentTarget.value) as Base)}
            >
              {BASES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label} (base {b.value})
                </option>
              ))}
            </Select>
          </Field>
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
          <PaneHeading title="Número" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="ex.: 255  ou  0xFF  ou  1010"
            className="rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm dark:border-line"
          />
        </div>
        {error && <ErrorNote message={error} />}
        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full text-sm">
            <tbody>
              {BASES.map((b) => (
                <tr
                  key={b.value}
                  className="border-b border-line last:border-0"
                >
                  <td className="w-40 px-3 py-2 font-medium text-muted">
                    {b.label}
                  </td>
                  <td className="px-3 py-2 font-mono break-all">
                    {rows ? `${b.prefix}${rows[b.value]}` : "—"}
                  </td>
                  <td className="px-1 py-1 text-right">
                    {rows && <CopyButton value={rows[b.value]} label="⧉" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ToolBody>
  );
}
