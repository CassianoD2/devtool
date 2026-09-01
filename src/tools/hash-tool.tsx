import { useEffect, useState } from "react";
import { ToolBody, TwoPane, PaneHeading } from "../components/ToolLayout";
import { CodeArea } from "../components/ui/CodeArea";
import { Button, CopyButton } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { hashAll, hashBytes, HASH_ALGOS, type HashAlgo } from "../lib/hash";

export function HashTool() {
  const [input, setInput] = useToolDraft("hash-tool");
  const [rows, setRows] = useState<Record<HashAlgo, string> | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!input) {
      setRows(null);
      return;
    }
    hashAll(input).then((r) => {
      if (!cancelled) setRows(r);
    });
    return () => {
      cancelled = true;
    };
  }, [input]);

  async function hashFile(file: File) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const entries = await Promise.all(
      HASH_ALGOS.map(async (a) => [a, await hashBytes(bytes, a)] as const),
    );
    setRows(Object.fromEntries(entries) as Record<HashAlgo, string>);
    setFileName(file.name);
    setInput("");
  }

  return (
    <ToolBody
      toolbar={
        <>
          <label className="cursor-pointer">
            <span className="inline-flex items-center rounded-md bg-surface-2 px-2.5 py-1.5 text-sm font-medium text-ink hover:bg-surface-2 hover:border-line-strong border border-line">
              Hash de arquivo
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                if (f) void hashFile(f);
                e.currentTarget.value = "";
              }}
            />
          </label>
          {fileName && (
            <span className="text-sm text-muted">arquivo: {fileName}</span>
          )}
          <div className="ml-auto">
            <Button
              variant="ghost"
              onClick={() => {
                setInput("");
                setRows(null);
                setFileName(null);
              }}
              disabled={!input && !rows}
            >
              Limpar
            </Button>
          </div>
        </>
      }
    >
      <TwoPane
        storageKey="hash"
        left={
          <>
            <PaneHeading title="Texto" />
            <CodeArea
              value={input}
              onChange={(v) => {
                setInput(v);
                setFileName(null);
              }}
              placeholder="Texto para gerar hash…"
            />
          </>
        }
        right={
          <>
            <PaneHeading title="Digests" />
            <div className="min-h-0 flex-1 overflow-auto rounded-md border border-line">
              <table className="w-full text-sm">
                <tbody>
                  {HASH_ALGOS.map((algo) => (
                    <tr
                      key={algo}
                      className="border-b border-line last:border-0"
                    >
                      <td className="w-24 px-3 py-2 font-semibold text-muted">
                        {algo}
                      </td>
                      <td className="px-2 py-2 font-mono text-xs break-all">
                        {rows?.[algo] ?? "—"}
                      </td>
                      <td className="px-1 py-1 text-right">
                        {rows?.[algo] && <CopyButton value={rows[algo]} label="⧉" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        }
      />
    </ToolBody>
  );
}
