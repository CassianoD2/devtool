import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { Button } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { textStats } from "../lib/textstats";

const SAMPLE =
  "O DevTool é um canivete suíço para desenvolvimento.\n\n" +
  "Reúne formatadores, encoders, consultas do Brasil e utilidades de texto num app nativo leve. " +
  "Tudo funciona offline — nada é baixado da internet em tempo de execução.";

const CARDS: { key: keyof ReturnType<typeof textStats>; label: string }[] = [
  { key: "words", label: "Palavras" },
  { key: "chars", label: "Caracteres" },
  { key: "charsNoSpaces", label: "Sem espaços" },
  { key: "lines", label: "Linhas" },
  { key: "paragraphs", label: "Parágrafos" },
  { key: "sentences", label: "Frases" },
  { key: "bytes", label: "Bytes (UTF-8)" },
  { key: "longestLine", label: "Linha mais longa" },
  { key: "avgWordLength", label: "Tam. médio da palavra" },
  { key: "readingMinutes", label: "Leitura (min)" },
];

export function TextStatsTool() {
  const [input, setInput] = useToolDraft("text-stats");
  const s = textStats(input);

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
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
          <PaneHeading title="Texto" />
          <textarea
            autoFocus
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Cole o texto para analisar…"
            className="min-h-0 flex-1 resize-none rounded-lg border border-line bg-surface p-3 font-mono text-sm leading-relaxed text-ink placeholder:text-faint"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {CARDS.map((c) => (
            <div key={c.key} className="rounded-lg border border-line bg-surface-2 px-3 py-2">
              <div className="font-mono text-lg text-ink tabular-nums">{s[c.key]}</div>
              <div className="text-[11px] text-muted">{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    </ToolBody>
  );
}
