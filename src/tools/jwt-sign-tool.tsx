import { useEffect, useState } from "react";
import { ToolBody, PaneHeading, TwoPane } from "../components/ToolLayout";
import { Button, CopyButton, Field, Input, Select } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { signJwt, withTimestamps, JWT_ALGS, type JwtAlg } from "../lib/jwtsign";

export function JwtSignTool() {
  const [payload, setPayload] = useToolDraft("jwt-sign");
  const [alg, setAlg] = useState<JwtAlg>("HS256");
  const [key, setKey] = useState("");
  const [expMin, setExpMin] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const keyKind = JWT_ALGS.find((a) => a.id === alg)!.key;

  useEffect(() => {
    let ok = true;
    if (!payload.trim()) {
      setToken("");
      setError(null);
      return;
    }
    signJwt("{}", payload, alg, key)
      .then((t) => ok && (setToken(t), setError(null)))
      .catch((e: Error) => ok && (setToken(""), setError(e.message)));
    return () => {
      ok = false;
    };
  }, [payload, alg, key]);

  return (
    <ToolBody
      toolbar={
        <>
          <Field label="Algoritmo">
            <Select value={alg} onChange={(e) => setAlg(e.currentTarget.value as JwtAlg)}>
              {JWT_ALGS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="exp (min)">
            <Input
              type="number"
              min={0}
              value={expMin}
              onChange={(e) => setExpMin(e.currentTarget.value)}
              placeholder="—"
              className="w-16"
            />
          </Field>
          <Button
            onClick={() => setPayload(withTimestamps(payload, Number(expMin) * 60 || undefined))}
            disabled={!payload.trim()}
          >
            + iat/exp
          </Button>
          <Button
            onClick={() => setPayload('{\n  "sub": "1234567890",\n  "name": "Ada Lovelace",\n  "admin": true\n}')}
          >
            Exemplo
          </Button>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <PaneHeading title={keyKind === "secret" ? "Segredo (HMAC)" : "Chave privada (PEM PKCS#8)"} />
          {keyKind === "secret" ? (
            <input
              value={key}
              onChange={(e) => setKey(e.currentTarget.value)}
              placeholder="segredo compartilhado…"
              className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 font-mono text-sm text-ink placeholder:text-faint"
            />
          ) : (
            <textarea
              value={key}
              onChange={(e) => setKey(e.currentTarget.value)}
              placeholder={"-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----"}
              className="h-24 resize-none rounded-md border border-line-strong bg-surface-2 px-3 py-2 font-mono text-xs text-ink placeholder:text-faint"
            />
          )}
        </div>

        <div className="min-h-0 flex-1">
          <TwoPane
            storageKey="tt:jwt-sign"
            left={
              <>
                <PaneHeading title="Payload (JSON)" />
                <textarea
                  autoFocus
                  value={payload}
                  onChange={(e) => setPayload(e.currentTarget.value)}
                  placeholder='{ "sub": "123" }'
                  className="min-h-0 flex-1 resize-none rounded-lg border border-line bg-surface p-3 font-mono text-sm text-ink placeholder:text-faint"
                />
              </>
            }
            right={
              <>
                <PaneHeading
                  title="Token assinado"
                  actions={token ? <CopyButton value={token} /> : undefined}
                />
                {error ? (
                  <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                ) : (
                  <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-line bg-surface p-3 font-mono text-xs break-all text-ink">
                    {token || <span className="text-faint">O JWT aparece aqui.</span>}
                  </div>
                )}
              </>
            }
          />
        </div>
        <p className="text-xs text-faint">
          Assinatura feita localmente (Web Crypto). Não cole chaves de produção.
        </p>
      </div>
    </ToolBody>
  );
}
