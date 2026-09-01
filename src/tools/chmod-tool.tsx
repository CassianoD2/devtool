import { useState } from "react";
import { ToolBody } from "../components/ToolLayout";
import { CopyButton } from "../components/ui/primitives";
import {
  parseOctal,
  toOctal,
  toSymbolic,
  describePerms,
  applyUmask,
  type PermSet,
  type PermTriad,
} from "../lib/chmod";

const inputCls =
 "rounded-md border border-line-strong bg-surface-2 px-2 py-1.5 text-sm";

const ROLES: { key: keyof Pick<PermSet, "owner" | "group" | "other">; label: string }[] = [
  { key: "owner", label: "Dono" },
  { key: "group", label: "Grupo" },
  { key: "other", label: "Outros" },
];
const PERMS: { key: keyof PermTriad; label: string }[] = [
  { key: "read", label: "r" },
  { key: "write", label: "w" },
  { key: "execute", label: "x" },
];

export function ChmodTool() {
  const [perms, setPerms] = useState<PermSet>(() => parseOctal("644"));
  const [octalDraft, setOctalDraft] = useState("0644");
  const [octalErr, setOctalErr] = useState<string | null>(null);

  const octal = toOctal(perms);
  const symbolic = toSymbolic(perms);

  function commitOctal(v: string) {
    setOctalDraft(v);
    try {
      setPerms(parseOctal(v));
      setOctalErr(null);
    } catch (err) {
      setOctalErr((err as Error).message);
    }
  }

  function toggle(role: "owner" | "group" | "other", perm: keyof PermTriad) {
    setPerms((p) => {
      const next = { ...p, [role]: { ...p[role], [perm]: !p[role][perm] } };
      setOctalDraft(toOctal(next));
      setOctalErr(null);
      return next;
    });
  }
  function toggleSpecial(bit: "setuid" | "setgid" | "sticky") {
    setPerms((p) => {
      const next = { ...p, [bit]: !p[bit] };
      setOctalDraft(toOctal(next));
      return next;
    });
  }

  const [umask, setUmask] = useState("022");
  let umaskResult: { file: string; dir: string } | null = null;
  let umaskErr: string | null = null;
  try {
    umaskResult = applyUmask(umask);
  } catch (err) {
    umaskErr = (err as Error).message;
  }

  return (
    <ToolBody>
      <div className="flex h-full min-h-0 flex-col gap-5">
        <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
          <table className="text-sm">
            <thead>
              <tr className="text-muted">
                <th className="px-3 py-1 text-left font-medium"></th>
                {PERMS.map((p) => (
                  <th key={p.key} className="px-3 py-1 font-mono">
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map((role) => (
                <tr key={role.key}>
                  <td className="px-3 py-1.5 font-medium">{role.label}</td>
                  {PERMS.map((perm) => (
                    <td key={perm.key} className="px-3 py-1.5 text-center">
                      <input
                        type="checkbox"
                        className="size-4 accent-[var(--color-accent)]"
                        checked={perms[role.key][perm.key]}
                        onChange={() => toggle(role.key, perm.key)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-line">
                <td className="px-3 py-1.5 font-medium">Especial</td>
                <td className="px-2 py-1.5 text-center text-xs">
                  <label className="flex flex-col items-center gap-0.5">
                    <input type="checkbox" className="size-4 accent-[var(--color-accent)]" checked={perms.setuid} onChange={() => toggleSpecial("setuid")} />
                    setuid
                  </label>
                </td>
                <td className="px-2 py-1.5 text-center text-xs">
                  <label className="flex flex-col items-center gap-0.5">
                    <input type="checkbox" className="size-4 accent-[var(--color-accent)]" checked={perms.setgid} onChange={() => toggleSpecial("setgid")} />
                    setgid
                  </label>
                </td>
                <td className="px-2 py-1.5 text-center text-xs">
                  <label className="flex flex-col items-center gap-0.5">
                    <input type="checkbox" className="size-4 accent-[var(--color-accent)]" checked={perms.sticky} onChange={() => toggleSpecial("sticky")} />
                    sticky
                  </label>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-muted">Octal</label>
              <input value={octalDraft} onChange={(e) => commitOctal(e.currentTarget.value)} className={`w-24 font-mono ${inputCls}`} />
              <span className="rounded bg-surface-2 px-2 py-1 font-mono text-lg">{octal}</span>
              <CopyButton value={octal} label="⧉" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-muted">Simbólico</label>
              <span className="rounded bg-surface-2 px-2 py-1 font-mono text-lg">-{symbolic}</span>
              <CopyButton value={symbolic} label="⧉" />
            </div>
            {octalErr && <p className="text-sm text-red-600">{octalErr}</p>}
            <p className="text-sm text-muted">{describePerms(perms)}</p>
            <p className="font-mono text-xs text-faint">chmod {octal} arquivo</p>
          </div>
        </div>

        <div className="rounded-lg border border-line p-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">umask</h3>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <input value={umask} onChange={(e) => setUmask(e.currentTarget.value)} className={`w-20 font-mono ${inputCls}`} />
            {umaskErr ? (
              <span className="text-red-600">{umaskErr}</span>
            ) : (
              <>
                <span>
                  arquivos novos: <code className="font-mono">{umaskResult!.file}</code>
                </span>
                <span>
                  diretórios novos: <code className="font-mono">{umaskResult!.dir}</code>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </ToolBody>
  );
}
