import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { Button, CopyButton } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { parseNfeKey } from "../lib/nfe";

const SAMPLE = "35240111222333000181550010000012341876543218";

export function NfeKeyTool() {
  const [input, setInput] = useToolDraft("nfe-key");
  const digits = input.replace(/\D/g, "").replace(/^NFe/i, "");

  let parsed: ReturnType<typeof parseNfeKey> | null = null;
  let error: string | null = null;
  if (digits.length > 0) {
    try {
      parsed = parseNfeKey(input);
    } catch (e) {
      error = (e as Error).message;
    }
  }

  const rows = parsed
    ? [
        ["UF", `${parsed.uf} (código ${parsed.cUF})`],
        ["Emissão", parsed.emissao],
        ["CNPJ emitente", parsed.cnpjFormatted],
        ["Modelo", `${parsed.modelo} — ${parsed.modeloLabel}`],
        ["Série", parsed.serie],
        ["Número da NF", parsed.numero],
        ["Tipo de emissão", `${parsed.tpEmis} — ${parsed.tpEmisLabel}`],
        ["Código numérico (cNF)", parsed.cNF],
        ["Dígito verificador", parsed.cDV],
      ]
    : [];

  return (
    <ToolBody
      toolbar={
        <>
          <Button onClick={() => setInput(SAMPLE)}>Exemplo</Button>
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
          <PaneHeading title="Chave de acesso (44 dígitos)" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Cole a chave da NF-e / NFC-e…"
            className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 font-mono text-base text-ink placeholder:text-faint"
          />
        </div>

        {error && (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
            {error}
          </p>
        )}

        {parsed && (
          <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-line">
            <div
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold ${
                parsed.dvOk
                  ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
              }`}
            >
              {parsed.dvOk ? "✓ Dígito verificador confere" : "✗ Dígito verificador não confere"}
              <span className="ml-auto">
                <CopyButton value={parsed.raw} label="Copiar chave" />
              </span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k} className="border-t border-line">
                    <td className="w-52 px-4 py-1.5 text-muted">{k}</td>
                    <td className="px-4 py-1.5 font-mono text-ink">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-2 text-xs text-faint">
              Só decodifica a chave — não consulta a SEFAZ.
            </p>
          </div>
        )}
      </div>
    </ToolBody>
  );
}
