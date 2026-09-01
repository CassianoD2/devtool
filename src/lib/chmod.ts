/** Permissões Unix: octal <-> simbólico, bits especiais, umask. Offline. */

export interface PermTriad {
  read: boolean;
  write: boolean;
  execute: boolean;
}
export interface PermSet {
  owner: PermTriad;
  group: PermTriad;
  other: PermTriad;
  setuid: boolean;
  setgid: boolean;
  sticky: boolean;
}

const EMPTY: PermTriad = { read: false, write: false, execute: false };

export function emptyPerms(): PermSet {
  return {
    owner: { ...EMPTY },
    group: { ...EMPTY },
    other: { ...EMPTY },
    setuid: false,
    setgid: false,
    sticky: false,
  };
}

function triadToDigit(t: PermTriad): number {
  return (t.read ? 4 : 0) + (t.write ? 2 : 0) + (t.execute ? 1 : 0);
}
function digitToTriad(d: number): PermTriad {
  return { read: !!(d & 4), write: !!(d & 2), execute: !!(d & 1) };
}

/** "755", "0755", "4755" -> PermSet. Throws on malformed input. */
export function parseOctal(input: string): PermSet {
  const m = input.trim().match(/^(0?)([0-7])?([0-7])([0-7])([0-7])$/);
  if (!m) throw new Error('Use 3 ou 4 dígitos octais, ex.: "755" ou "4755".');
  const special = m[2] ? Number(m[2]) : 0;
  const p = emptyPerms();
  p.owner = digitToTriad(Number(m[3]));
  p.group = digitToTriad(Number(m[4]));
  p.other = digitToTriad(Number(m[5]));
  p.setuid = !!(special & 4);
  p.setgid = !!(special & 2);
  p.sticky = !!(special & 1);
  return p;
}

export function toOctal(p: PermSet, fourDigit = true): string {
  const special =
    (p.setuid ? 4 : 0) + (p.setgid ? 2 : 0) + (p.sticky ? 1 : 0);
  const body = `${triadToDigit(p.owner)}${triadToDigit(p.group)}${triadToDigit(p.other)}`;
  return fourDigit ? `${special}${body}` : body;
}

/** "rwxr-xr-x" or "-rwxr-xr-x" (10 chars) -> PermSet. */
export function parseSymbolic(input: string): PermSet {
  let s = input.trim();
  if (s.length === 10) s = s.slice(1); // drop leading file-type char
  if (s.length !== 9 || !/^[rwxsStT-]{9}$/.test(s)) {
    throw new Error('Use 9 caracteres, ex.: "rwxr-xr-x".');
  }
  const p = emptyPerms();
  const read = (c: string) => c === "r";
  const write = (c: string) => c === "w";
  p.owner = { read: read(s[0]), write: write(s[1]), execute: "xs".includes(s[2].toLowerCase()) };
  p.group = { read: read(s[3]), write: write(s[4]), execute: "xs".includes(s[5].toLowerCase()) };
  p.other = { read: read(s[6]), write: write(s[7]), execute: "xt".includes(s[8].toLowerCase()) };
  p.setuid = "sS".includes(s[2]);
  p.setgid = "sS".includes(s[5]);
  p.sticky = "tT".includes(s[8]);
  return p;
}

export function toSymbolic(p: PermSet): string {
  const part = (t: PermTriad, special: boolean, kind: "s" | "t") => {
    const x = t.execute;
    let third = x ? "x" : "-";
    if (special) third = x ? kind : kind.toUpperCase();
    return `${t.read ? "r" : "-"}${t.write ? "w" : "-"}${third}`;
  };
  return (
    part(p.owner, p.setuid, "s") +
    part(p.group, p.setgid, "s") +
    part(p.other, p.sticky, "t")
  );
}

export function describePerms(p: PermSet): string {
  const who = (t: PermTriad) =>
    [t.read && "ler", t.write && "escrever", t.execute && "executar"]
      .filter(Boolean)
      .join(", ") || "sem acesso";
  const bits = [
    p.setuid && "setuid",
    p.setgid && "setgid",
    p.sticky && "sticky",
  ].filter(Boolean);
  return (
    `Dono: ${who(p.owner)}. Grupo: ${who(p.group)}. Outros: ${who(p.other)}.` +
    (bits.length ? ` Bits especiais: ${bits.join(", ")}.` : "")
  );
}

/** umask "022" -> resulting file/dir perms. */
export function applyUmask(umask: string): { file: string; dir: string } {
  const m = umask.trim().match(/^0?([0-7])([0-7])([0-7])$/);
  if (!m) throw new Error('umask com 3 dígitos octais, ex.: "022".');
  const mask = (Number(m[1]) << 6) | (Number(m[2]) << 3) | Number(m[3]);
  const fmt = (base: number) => {
    const v = base & ~mask;
    return `${(v >> 6) & 7}${(v >> 3) & 7}${v & 7}`;
  };
  return { file: fmt(0o666), dir: fmt(0o777) };
}
