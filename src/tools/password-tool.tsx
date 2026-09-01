import { useCallback, useEffect, useState } from "react";
import { ToolBody } from "../components/ToolLayout";
import { Button, Checkbox, CopyButton, Field, Select } from "../components/ui/primitives";
import {
  generatePassword,
  bcryptHash,
  bcryptCompare,
  type PasswordOptions,
} from "../lib/password";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line p-4 dark:border-line">
      <h3 className="mb-3 text-sm font-semibold text-ink">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

const inputCls =
 "rounded-md border border-line bg-surface px-2 py-1.5 text-sm";

export function PasswordTool() {
  const [opts, setOpts] = useState<PasswordOptions>({
    length: 20,
    lower: true,
    upper: true,
    digits: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  const [password, setPassword] = useState("");
  const [genError, setGenError] = useState<string | null>(null);

  const set = <K extends keyof PasswordOptions>(k: K, v: PasswordOptions[K]) =>
    setOpts((o) => ({ ...o, [k]: v }));

  const generate = useCallback(() => {
    try {
      setPassword(generatePassword(opts));
      setGenError(null);
    } catch (err) {
      setGenError((err as Error).message);
      setPassword("");
    }
  }, [opts]);

  useEffect(() => {
    generate();
  }, [generate]);

  const [plain, setPlain] = useState("");
  const [rounds, setRounds] = useState(10);
  const [hash, setHash] = useState("");

  const [verifyText, setVerifyText] = useState("");
  const [verifyHash, setVerifyHash] = useState("");
  const match =
    verifyText && verifyHash ? bcryptCompare(verifyText, verifyHash) : null;

  return (
    <ToolBody>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Gerador de senha">
          <div className="flex flex-wrap items-center gap-3">
            <Field label="Comprimento">
              <input
                type="number"
                min={4}
                max={256}
                value={opts.length}
                onChange={(e) => set("length", Number(e.currentTarget.value))}
                className={`w-20 ${inputCls}`}
              />
            </Field>
            <Checkbox label="a-z" checked={opts.lower} onChange={(v) => set("lower", v)} />
            <Checkbox label="A-Z" checked={opts.upper} onChange={(v) => set("upper", v)} />
            <Checkbox label="0-9" checked={opts.digits} onChange={(v) => set("digits", v)} />
            <Checkbox
              label="símbolos"
              checked={opts.symbols}
              onChange={(v) => set("symbols", v)}
            />
            <Checkbox
              label="sem ambíguos"
              checked={!!opts.excludeAmbiguous}
              onChange={(v) => set("excludeAmbiguous", v)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input readOnly value={password} className={`flex-1 font-mono ${inputCls}`} />
            <Button variant="primary" onClick={generate}>
              Gerar
            </Button>
            <CopyButton value={password} />
          </div>
          {genError && <p className="text-sm text-red-600">{genError}</p>}
        </Card>

        <Card title="Hash bcrypt">
          <div className="flex items-center gap-2">
            <input
              value={plain}
              onChange={(e) => setPlain(e.currentTarget.value)}
              placeholder="texto"
              className={`flex-1 ${inputCls}`}
            />
            <Field label="rounds">
              <Select
                value={String(rounds)}
                onChange={(e) => setRounds(Number(e.currentTarget.value))}
              >
                {[8, 10, 12, 14].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Button onClick={() => setHash(bcryptHash(plain, rounds))} disabled={!plain}>
              Gerar hash
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <input readOnly value={hash} className={`flex-1 font-mono text-xs ${inputCls}`} />
            <CopyButton value={hash} />
          </div>

          <hr className="border-line" />

          <div className="flex flex-col gap-2">
            <input
              value={verifyText}
              onChange={(e) => setVerifyText(e.currentTarget.value)}
              placeholder="texto a verificar"
              className={inputCls}
            />
            <input
              value={verifyHash}
              onChange={(e) => setVerifyHash(e.currentTarget.value)}
              placeholder="hash bcrypt"
              className={`font-mono text-xs ${inputCls}`}
            />
            {match !== null && (
              <span
                className={`text-sm font-medium ${match ? "text-green-600" : "text-red-600"}`}
              >
                {match ? "✓ confere" : "✗ não confere"}
              </span>
            )}
          </div>
        </Card>
      </div>
    </ToolBody>
  );
}
