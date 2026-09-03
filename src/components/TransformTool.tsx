import { useEffect, type ReactNode } from "react";
import { ToolBody, TwoPane, PaneHeading } from "./ToolLayout";
import { CodeArea, type CodeLang } from "./ui/CodeArea";
import { HistoryMenu } from "./ui/HistoryMenu";
import { Button, CopyButton, ErrorNote } from "./ui/primitives";
import { useTextTransform } from "../hooks/useTextTransform";
import { useToolHistory } from "../hooks/useToolHistory";

/**
 * Standard input → output tool. `transform` returns the output string or throws
 * an Error whose message is shown inline.
 */
export function TransformTool({
  toolId,
  transform,
  deps = [],
  sample = "",
  inputLang = "text",
  outputLang = "text",
  toolbar,
  inputPlaceholder = "Cole o conteúdo aqui…",
}: {
  toolId: string;
  transform: (input: string) => string;
  deps?: unknown[];
  sample?: string;
  inputLang?: CodeLang;
  outputLang?: CodeLang;
  toolbar?: ReactNode;
  inputPlaceholder?: string;
}) {
  const { input, setInput, output, error, clear, loadSample } = useTextTransform(
    toolId,
    transform,
    deps,
    sample,
  );
  const { history, push, clear: clearHistory } = useToolHistory(toolId);

  // guarda a entrada no histórico ~1,5s depois de parar de digitar
  useEffect(() => {
    if (!input.trim()) return;
    const t = setTimeout(() => push(input), 1500);
    return () => clearTimeout(t);
  }, [input, push]);

  return (
    <ToolBody
      toolbar={
        <>
          {toolbar}
          <div className="ml-auto flex items-center gap-1">
            {sample && (
              <Button variant="ghost" onClick={loadSample}>
                Exemplo
              </Button>
            )}
            <Button variant="ghost" onClick={clear} disabled={!input}>
              Limpar
            </Button>
          </div>
        </>
      }
    >
      <TwoPane
        storageKey={`tt:${toolId}`}
        left={
          <>
            <PaneHeading
              title="Entrada"
              actions={
                <HistoryMenu history={history} onPick={setInput} onClear={clearHistory} />
              }
            />
            <CodeArea
              value={input}
              onChange={setInput}
              language={inputLang}
              placeholder={inputPlaceholder}
            />
          </>
        }
        right={
          <>
            <PaneHeading
              title="Saída"
              actions={<CopyButton value={output} />}
            />
            {error ? (
              <ErrorNote message={error} />
            ) : (
              <CodeArea value={output} language={outputLang} readOnly />
            )}
          </>
        }
      />
    </ToolBody>
  );
}
