import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { Button, CopyButton } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { parseBoleto } from "../lib/boleto";

const SAMPLE = "23793381286008266950630049897109184350000010000";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const brDate = (iso: string) => iso.split("-").reverse().join("/");

export function BoletoTool() {
  const [input, setInput] = useToolDraft("boleto");
  const digits = input.replace(/\D/g, "");

  let parsed: ReturnType<typeof parseBoleto> | null = null;
  let error: string | null = null;
  if (digits.length > 0) {
    try {
      parsed = parseBoleto(input);
    } catch (e) {
      error = (e as Error).message;
    }
  }

  const rows: [string, string][] = parsed
    ? parsed.tipo === "cobranca"
      ? [
          ["Tipo", "Cobrança"],
          ["Banco", parsed.bancoNome ? `${parsed.banco} — ${parsed.bancoNome}` : (parsed.banco ?? "?")],
          ["Moeda", parsed.moeda ?? "?"],
          ["Valor", parsed.valor != null ? brl(parsed.valor) : "não informado"],
          ["Vencimento", parsed.vencimento ? brDate(parsed.vencimento) : "não informado"],
          ["Código de barras", parsed.codigoBarras],
        ]
      : [
          ["Tipo", "Arrecadação / concessionária"],
          ["Valor", parsed.valor != null ? brl(parsed.valor) : "não informado"],
          ["Código de barras", parsed.codigoBarras],
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
          <PaneHeading title="Linha digitável ou código de barras" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Cole a linha digitável (47/48) ou o código de barras (44)…"
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
            {parsed.tipo === "cobranca" && (
              <div
                className={`px-4 py-2 text-sm font-semibold ${
                  parsed.dvGeralOk
                    ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                }`}
              >
                {parsed.dvGeralOk
                  ? "✓ Dígito verificador geral confere"
                  : "⚠ Dígito verificador geral não confere"}
              </div>
            )}
            <table className="w-full text-sm">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k} className="border-t border-line">
                    <td className="w-44 px-4 py-1.5 align-top text-muted">{k}</td>
                    <td className="px-4 py-1.5 font-mono break-all text-ink">
                      {v}
                      {k === "Código de barras" && (
                        <span className="ml-2 align-middle">
                          <CopyButton value={v} />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-2 text-xs text-faint">
              Decodifica offline os campos da linha. Não valida contra o banco.
            </p>
          </div>
        )}
      </div>
    </ToolBody>
  );
}
