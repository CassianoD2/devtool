import bcrypt from "bcryptjs";

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>/?",
};

export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous?: boolean;
}

export function generatePassword(opts: PasswordOptions): string {
  let pool = "";
  if (opts.lower) pool += SETS.lower;
  if (opts.upper) pool += SETS.upper;
  if (opts.digits) pool += SETS.digits;
  if (opts.symbols) pool += SETS.symbols;
  if (opts.excludeAmbiguous) pool = pool.replace(/[Il1O0o]/g, "");
  if (!pool) throw new Error("Selecione ao menos um conjunto de caracteres.");

  const len = Math.max(4, Math.min(256, Math.floor(opts.length)));
  const bytes = new Uint32Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += pool[bytes[i] % pool.length];
  return out;
}

export function bcryptHash(text: string, rounds = 10): string {
  return bcrypt.hashSync(text, Math.max(4, Math.min(15, rounds)));
}

export function bcryptCompare(text: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(text, hash);
  } catch {
    return false;
  }
}
