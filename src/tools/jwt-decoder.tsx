import { useEffect, useState } from "react";
import { ToolBody, TwoPane, PaneHeading } from "../components/ToolLayout";
import { CodeArea } from "../components/ui/CodeArea";
import { Button, CopyButton, ErrorNote } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { decodeJwt, describeClaims, verifyHmac } from "../lib/jwt";

// jwt.io HS256 example — secret: your-256-bit-secret
const SAMPLE =
 "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export function JwtDecoder() {
  const [input, setInput] = useToolDraft("jwt-decoder");
  const [secret, setSecret] = useState("");
  const [verifyState, setVerifyState] = useState<null | "ok" | "bad" | string>(null);

  let header = "";
  let payload = "";
  let claims: string[] = [];
  let error: string | null = null;
  try {
    if (input.trim()) {
      const parts = decodeJwt(input);
      header = JSON.stringify(parts.header, null, 2);
      payload = JSON.stringify(parts.payload, null, 2);
      claims = describeClaims(parts.payload);
    }
  } catch (err) {
    error = (err as Error).message;
  }

  useEffect(() => {
    setVerifyState(null);
  }, [input, secret]);

  async function check() {
    try {
      setVerifyState((await verifyHmac(input, secret)) ? "ok" : "bad");
    } catch (err) {
      setVerifyState((err as Error).message);
    }
  }

  return (
    <ToolBody
      toolbar={
        <>
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.currentTarget.value)}
            placeholder="Segredo HMAC (opcional)"
            className="w-56 rounded-md border border-line-strong bg-surface-2 px-2 py-1.5 text-sm"
          />
          <Button onClick={check} disabled={!input.trim() || !secret}>
            Verificar assinatura
          </Button>
          {verifyState === "ok" && (
            <span className="text-sm font-medium text-green-600">✓ assinatura válida</span>
          )}
          {verifyState === "bad" && (
            <span className="text-sm font-medium text-red-600">✗ assinatura inválida</span>
          )}
          {verifyState && verifyState !== "ok" && verifyState !== "bad" && (
            <span className="text-sm text-amber-600">{verifyState}</span>
          )}
          <div className="ml-auto flex gap-1">
            <Button variant="ghost" onClick={() => setInput(SAMPLE)}>
              Exemplo
            </Button>
            <Button variant="ghost" onClick={() => setInput("")} disabled={!input}>
              Limpar
            </Button>
          </div>
        </>
      }
    >
      <TwoPane
        storageKey="jwt"
        left={
          <>
            <PaneHeading title="Token" />
            <CodeArea value={input} onChange={setInput} placeholder="Cole o JWT…" />
            {error && <ErrorNote message={error} />}
          </>
        }
        right={
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex min-h-0 flex-1 flex-col gap-1">
              <PaneHeading title="Header" actions={<CopyButton value={header} />} />
              <CodeArea value={header} language="json" readOnly />
            </div>
            <div className="flex min-h-0 flex-[2] flex-col gap-1">
              <PaneHeading title="Payload" actions={<CopyButton value={payload} />} />
              <CodeArea value={payload} language="json" readOnly />
            </div>
            {claims.length > 0 && (
              <ul className="shrink-0 space-y-0.5 rounded-md bg-surface-2 p-2 text-xs text-muted dark:text-faint">
                {claims.map((c) => (
                  <li key={c} className="font-mono">
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        }
      />
    </ToolBody>
  );
}
