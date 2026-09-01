export type Base = 2 | 8 | 10 | 16;

export const BASES: { value: Base; label: string; prefix: string }[] = [
  { value: 2, label: "Binário", prefix: "0b" },
  { value: 8, label: "Octal", prefix: "0o" },
  { value: 10, label: "Decimal", prefix: "" },
  { value: 16, label: "Hexadecimal", prefix: "0x" },
];

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

function parseBigIntInBase(text: string, base: Base): bigint {
  const clean = text
    .trim()
    .toLowerCase()
    .replace(/^0b|^0o|^0x/, "")
    .replace(/[_\s]/g, "");
  if (!clean) throw new Error("Entrada vazia.");
  let negative = false;
  let body = clean;
  if (body.startsWith("-")) {
    negative = true;
    body = body.slice(1);
  }
  let result = 0n;
  const b = BigInt(base);
  for (const ch of body) {
    const digit = DIGITS.indexOf(ch);
    if (digit < 0 || digit >= base) {
      throw new Error(`Dígito "${ch}" inválido para base ${base}.`);
    }
    result = result * b + BigInt(digit);
  }
  return negative ? -result : result;
}

function toStringInBase(value: bigint, base: Base): string {
  if (base === 10) return value.toString(10);
  const negative = value < 0n;
  let v = negative ? -value : value;
  if (v === 0n) return "0";
  const b = BigInt(base);
  let out = "";
  while (v > 0n) {
    out = DIGITS[Number(v % b)] + out;
    v = v / b;
  }
  return (negative ? "-" : "") + out;
}

export function convertNumberBase(
  input: string,
  from: Base,
): Record<Base, string> {
  const value = parseBigIntInBase(input, from);
  return {
    2: toStringInBase(value, 2),
    8: toStringInBase(value, 8),
    10: toStringInBase(value, 10),
    16: toStringInBase(value, 16),
  };
}
