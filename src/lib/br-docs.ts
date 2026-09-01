/** Offline CPF/CNPJ: validação, formatação e geração (dígitos verificadores mód-11). */

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

function mod11(digits: number[], weights: number[]): number {
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

// ---------- CPF ----------

export function isValidCpf(input: string): boolean {
  const n = onlyDigits(input);
  if (n.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(n)) return false;
  const d = n.split("").map(Number);
  const dv1 = mod11(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = mod11(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return dv1 === d[9] && dv2 === d[10];
}

export function formatCpf(input: string): string {
  const n = onlyDigits(input).padStart(11, "0").slice(0, 11);
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

export function generateCpf(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const dv1 = mod11(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = mod11([...base, dv1], [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return formatCpf([...base, dv1, dv2].join(""));
}

// ---------- CNPJ ----------

export function isValidCnpj(input: string): boolean {
  const n = onlyDigits(input);
  if (n.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(n)) return false;
  const d = n.split("").map(Number);
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const dv1 = mod11(d.slice(0, 12), w1);
  const dv2 = mod11(d.slice(0, 13), w2);
  return dv1 === d[12] && dv2 === d[13];
}

export function formatCnpj(input: string): string {
  const n = onlyDigits(input).padStart(14, "0").slice(0, 14);
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
}

export function generateCnpj(): string {
  const base = [
    ...Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)),
    0,
    0,
    0,
    1,
  ];
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const dv1 = mod11(base, w1);
  const dv2 = mod11([...base, dv1], w2);
  return formatCnpj([...base, dv1, dv2].join(""));
}

// ---------- combinado ----------

export type DocKind = "cpf" | "cnpj";

export function detectDoc(input: string): DocKind | null {
  const len = onlyDigits(input).length;
  if (len === 11) return "cpf";
  if (len === 14) return "cnpj";
  return null;
}

export function validateDoc(input: string): { kind: DocKind | null; valid: boolean; formatted: string } {
  const kind = detectDoc(input);
  if (kind === "cpf") return { kind, valid: isValidCpf(input), formatted: formatCpf(input) };
  if (kind === "cnpj") return { kind, valid: isValidCnpj(input), formatted: formatCnpj(input) };
  return { kind: null, valid: false, formatted: input.trim() };
}
