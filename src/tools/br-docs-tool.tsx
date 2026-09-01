import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { Button, CopyButton } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { generateCpf, generateCnpj, validateDoc } from "../lib/br-docs";

export function BrDocsTool() {
  const [input, setInput] = useToolDraft("br-docs");
  const { kind, valid, formatted } = validateDoc(input);
  const hasDigits = input.replace(/\D/g, "").length > 0;

  return (
    <ToolBody
      toolbar={
        <>
          <Button onClick={() => setInput(generateCpf())}>Gerar CPF</Button>
          <Button onClick={() => setInput(generateCnpj())}>Gerar CNPJ</Button>
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
          <PaneHeading title="CPF ou CNPJ" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Digite ou cole um CPF/CNPJ…"
            className="rounded-md border border-line bg-surface px-3 py-2 font-mono text-base dark:border-line"
          />
        </div>

        {hasDigits && (
          <div className="rounded-lg border border-line p-4 dark:border-line">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
 !kind
                    ? "bg-surface-2 text-muted dark:text-faint"
                    : valid
                      ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                }`}
              >
                {!kind ? "Tamanho inválido" : valid ? `✓ ${kind.toUpperCase()} válido` : `✗ ${kind.toUpperCase()} inválido`}
              </span>
              {kind && (
                <>
                  <code className="font-mono text-lg">{formatted}</code>
                  <CopyButton value={formatted} />
                  <CopyButton value={formatted.replace(/\D/g, "")} label="Copiar só dígitos" />
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-muted">
              Validação apenas dos dígitos verificadores (mód-11). Não consulta a
              Receita — números gerados são fictícios, para testes.
            </p>
          </div>
        )}
      </div>
    </ToolBody>
  );
}
