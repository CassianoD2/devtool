import { useEffect, useState } from "react";
import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { Button, CopyButton, Field, Select } from "../components/ui/primitives";
import { useNow } from "../hooks/useNow";
import { useToolDraft } from "../hooks/useToolDraft";
import {
  parseOtpauth,
  totpAt,
  secondsRemaining,
  DEFAULT_OTP,
  type OtpConfig,
  type OtpAlgo,
} from "../lib/totp";

const SAMPLE = "JBSWY3DPEHPK3PXP";

export function TotpTool() {
  const [secret, setSecret] = useToolDraft("totp");
  const [digits, setDigits] = useState(6);
  const [period, setPeriod] = useState(30);
  const [algorithm, setAlgorithm] = useState<OtpAlgo>("SHA-1");
  const [meta, setMeta] = useState<{ issuer?: string; label?: string }>({});

  const now = useNow(true);
  const [codes, setCodes] = useState<{ current: string; next: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // se colar um otpauth://, extrai os parâmetros
  useEffect(() => {
    if (secret.trim().toLowerCase().startsWith("otpauth://")) {
      try {
        const c = parseOtpauth(secret.trim());
        setSecret(c.secret);
        setDigits(c.digits);
        setPeriod(c.period);
        setAlgorithm(c.algorithm);
        setMeta({ issuer: c.issuer, label: c.label });
      } catch {
        /* deixa o erro aparecer no cálculo */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret]);

  const cfg: OtpConfig = { ...DEFAULT_OTP, secret: secret.trim(), digits, period, algorithm };
  const remaining = secret.trim() ? secondsRemaining(cfg, now) : 0;

  useEffect(() => {
    let ok = true;
    if (!secret.trim()) {
      setCodes(null);
      setError(null);
      return;
    }
    Promise.all([totpAt(cfg, now), totpAt(cfg, now + period * 1000)])
      .then(([current, next]) => {
        if (!ok) return;
        setCodes({ current, next });
        setError(null);
      })
      .catch((e: Error) => {
        if (!ok) return;
        setError(e.message);
        setCodes(null);
      });
    return () => {
      ok = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret, digits, period, algorithm, Math.floor(now / 1000)]);

  const pct = period ? (remaining / period) * 100 : 0;

  return (
    <ToolBody
      toolbar={
        <>
          <Button onClick={() => setSecret(SAMPLE)}>Exemplo</Button>
          <Field label="Dígitos">
            <Select value={digits} onChange={(e) => setDigits(Number(e.currentTarget.value))}>
              {[6, 7, 8].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Período">
            <Select value={period} onChange={(e) => setPeriod(Number(e.currentTarget.value))}>
              {[15, 30, 60].map((p) => (
                <option key={p} value={p}>
                  {p}s
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Algoritmo">
            <Select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.currentTarget.value as OtpAlgo)}
            >
              <option value="SHA-1">SHA-1</option>
              <option value="SHA-256">SHA-256</option>
              <option value="SHA-512">SHA-512</option>
            </Select>
          </Field>
          <div className="ml-auto">
            <Button variant="ghost" onClick={() => setSecret("")} disabled={!secret}>
              Limpar
            </Button>
          </div>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <PaneHeading title="Segredo (Base32) ou link otpauth://" />
          <input
            autoFocus
            value={secret}
            onChange={(e) => setSecret(e.currentTarget.value)}
            placeholder="JBSWY3DPEHPK3PXP  ou  otpauth://totp/…"
            className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 font-mono text-base text-ink placeholder:text-faint"
          />
          {meta.label && (
            <p className="text-xs text-muted">
              {meta.issuer ? `${meta.issuer} · ` : ""}
              {meta.label}
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {codes && (
          <div className="flex flex-wrap items-center gap-6 rounded-lg border border-line bg-surface-2 p-5">
            <div>
              <div className="text-[11px] text-muted uppercase">Código atual</div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-4xl tracking-[0.15em] text-ink tabular-nums">
                  {codes.current}
                </span>
                <CopyButton value={codes.current} />
              </div>
            </div>
            <div className="relative grid size-14 place-items-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-line)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="3"
                  strokeDasharray={`${(pct / 100) * 100.5} 100.5`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-mono text-sm text-muted tabular-nums">{remaining}s</span>
            </div>
            <div>
              <div className="text-[11px] text-muted uppercase">Próximo</div>
              <span className="font-mono text-xl text-muted tabular-nums">{codes.next}</span>
            </div>
          </div>
        )}

        <p className="text-xs text-faint">
          Tudo calculado localmente. Não guarde segredos de 2FA de produção aqui.
        </p>
      </div>
    </ToolBody>
  );
}
