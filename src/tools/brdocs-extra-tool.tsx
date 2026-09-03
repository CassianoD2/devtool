import { useState } from "react";
import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { Button, CopyButton, Field, Select } from "../components/ui/primitives";
import {
  validateExtra,
  generateExtra,
  onlyDigits,
  EXTRA_DOCS,
  type ExtraDoc,
} from "../lib/brdocs-extra";

export function BrDocsExtraTool() {
  const [kind, setKind] = useState<ExtraDoc>("pis");
  const [input, setInput] = useState("");

  const meta = EXTRA_DOCS.find((d) => d.id === kind)!;
  const digits = onlyDigits(input);
  const has = digits.length > 0;
  const { valid, formatted } = validateExtra(kind, input);

  return (
    <ToolBody
      toolbar={
        <>
          <Field label="Documento">
            <Select
              value={kind}
              onChange={(e) => {
                setKind(e.currentTarget.value as ExtraDoc);
                setInput("");
              }}
            >
              {EXTRA_DOCS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
          <Button onClick={() => setInput(generateExtra(kind))}>Gerar</Button>
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
          <PaneHeading title={`${meta.label} (${meta.len} dígitos)`} />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder={`Digite ou cole um ${meta.label}…`}
            className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 font-mono text-base text-ink placeholder:text-faint"
          />
        </div>

        {has && (
          <div className="rounded-lg border border-line p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                  digits.length !== meta.len
                    ? "bg-surface-2 text-muted dark:text-faint"
                    : valid
                      ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                }`}
              >
                {digits.length !== meta.len
                  ? `Tem ${digits.length} dígitos (esperado ${meta.len})`
                  : valid
                    ? "✓ Dígitos verificadores conferem"
                    : "✗ Dígitos verificadores não conferem"}
              </span>
              {digits.length === meta.len && (
                <>
                  <code className="font-mono text-lg text-ink">{formatted}</code>
                  <CopyButton value={formatted} />
                  <CopyButton value={digits} label="Copiar só dígitos" />
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-muted">
              Validação apenas dos dígitos verificadores, offline. Números gerados são
              fictícios (para testes).
            </p>
          </div>
        )}
      </div>
    </ToolBody>
  );
}
