/** Validação / geração offline de PIS-PASEP, Título de Eleitor, RENAVAM e CNH. */

export const onlyDigits = (s: string) => s.replace(/\D/g, "");
const rnd = (n: number) => Math.floor(Math.random() * n);
const randDigits = (n: number) => Array.from({ length: n }, () => rnd(10));

export type ExtraDoc = "pis" | "titulo" | "renavam" | "cnh";

export const EXTRA_DOCS: { id: ExtraDoc; label: string; len: number }[] = [
  { id: "pis", label: "PIS / PASEP / NIT", len: 11 },
  { id: "titulo", label: "Título de Eleitor", len: 12 },
  { id: "renavam", label: "RENAVAM", len: 11 },
  { id: "cnh", label: "CNH", len: 11 },
];

// ---------- PIS / PASEP ----------

const PIS_W = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function pisDv(base10: number[]): number {
  const sum = base10.reduce((a, d, i) => a + d * PIS_W[i], 0);
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}
export function isValidPis(input: string): boolean {
  const n = onlyDigits(input);
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  const d = n.split("").map(Number);
  return pisDv(d.slice(0, 10)) === d[10];
}
export function generatePis(): string {
  const base = randDigits(10);
  return formatPis([...base, pisDv(base)].join(""));
}
export function formatPis(input: string): string {
  const n = onlyDigits(input).padStart(11, "0").slice(0, 11);
  return `${n.slice(0, 3)}.${n.slice(3, 8)}.${n.slice(8, 10)}-${n.slice(10)}`;
}

// ---------- Título de Eleitor ----------
// 8 dígitos sequenciais + 2 (UF, 01–28) + DV1 + DV2

function tituloDv(seq: number[], uf: number[]): [number, number] {
  let s1 = 0;
  for (let i = 0; i < 8; i++) s1 += seq[i] * (i + 2);
  let dv1 = s1 % 11;
  if (dv1 === 10) dv1 = 0;
  // SP (01) e MG (02): resto 0 → DV 1
  const ufNum = uf[0] * 10 + uf[1];
  if (dv1 === 0 && (ufNum === 1 || ufNum === 2)) dv1 = 1;

  let s2 = uf[0] * 7 + uf[1] * 8 + dv1 * 9;
  let dv2 = s2 % 11;
  if (dv2 === 10) dv2 = 0;
  if (dv2 === 0 && (ufNum === 1 || ufNum === 2)) dv2 = 1;
  return [dv1, dv2];
}
export function isValidTitulo(input: string): boolean {
  const n = onlyDigits(input);
  if (n.length !== 12) return false;
  const d = n.split("").map(Number);
  const uf = d[8] * 10 + d[9];
  if (uf < 1 || uf > 28) return false;
  const [dv1, dv2] = tituloDv(d.slice(0, 8), d.slice(8, 10));
  return dv1 === d[10] && dv2 === d[11];
}
export function generateTitulo(): string {
  const seq = randDigits(8);
  const ufNum = 1 + rnd(28);
  const uf = [Math.floor(ufNum / 10), ufNum % 10];
  const [dv1, dv2] = tituloDv(seq, uf);
  return [...seq, ...uf, dv1, dv2].join("");
}
export function formatTitulo(input: string): string {
  const n = onlyDigits(input).padStart(12, "0").slice(0, 12);
  return `${n.slice(0, 4)} ${n.slice(4, 8)} ${n.slice(8, 12)}`;
}

// ---------- RENAVAM ----------
// 10 dígitos base + 1 DV (mód-11 sobre os 10, pesos 2..9 cíclicos, da direita p/ esquerda)

export function renavamDv(base10: number[]): number {
  let sum = 0;
  let w = 2;
  for (let i = base10.length - 1; i >= 0; i--) {
    sum += base10[i] * w;
    w = w === 9 ? 2 : w + 1;
  }
  const r = (sum * 10) % 11;
  return r === 10 ? 0 : r;
}
export function isValidRenavam(input: string): boolean {
  const n = onlyDigits(input).padStart(11, "0");
  if (n.length !== 11 || /^0{11}$/.test(n)) return false;
  const d = n.split("").map(Number);
  return renavamDv(d.slice(0, 10)) === d[10];
}
export function generateRenavam(): string {
  const base = randDigits(10);
  return [...base, renavamDv(base)].join("");
}
export function formatRenavam(input: string): string {
  const n = onlyDigits(input).padStart(11, "0").slice(0, 11);
  return `${n.slice(0, 5)}.${n.slice(5, 10)}-${n.slice(10)}`;
}

// ---------- CNH ----------
// 9 base + 2 DV, com fator de correção quando um resto passa de 9

function cnhDvs(base9: number[]): [number, number] {
  let s1 = 0;
  for (let i = 0, w = 9; i < 9; i++, w--) s1 += base9[i] * w;
  let d1 = s1 % 11;
  let inc = 0;
  if (d1 >= 10) {
    d1 = 0;
    inc = 2;
  }
  let s2 = 0;
  for (let i = 0, w = 1; i < 9; i++, w++) s2 += base9[i] * w;
  let d2 = (s2 % 11) - inc;
  if (d2 < 0) d2 += 11;
  if (d2 >= 10) d2 = 0;
  return [d1, d2];
}
export function isValidCnh(input: string): boolean {
  const n = onlyDigits(input);
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  const d = n.split("").map(Number);
  const [d1, d2] = cnhDvs(d.slice(0, 9));
  return d1 === d[9] && d2 === d[10];
}
export function generateCnh(): string {
  const base = randDigits(9);
  const [d1, d2] = cnhDvs(base);
  return [...base, d1, d2].join("");
}

// ---------- fachada ----------

export function validateExtra(
  kind: ExtraDoc,
  input: string,
): { valid: boolean; formatted: string } {
  switch (kind) {
    case "pis":
      return { valid: isValidPis(input), formatted: formatPis(input) };
    case "titulo":
      return { valid: isValidTitulo(input), formatted: formatTitulo(input) };
    case "renavam":
      return { valid: isValidRenavam(input), formatted: formatRenavam(input) };
    case "cnh":
      return { valid: isValidCnh(input), formatted: onlyDigits(input).padStart(11, "0") };
  }
}

export function generateExtra(kind: ExtraDoc): string {
  return { pis: generatePis, titulo: generateTitulo, renavam: generateRenavam, cnh: generateCnh }[kind]();
}
