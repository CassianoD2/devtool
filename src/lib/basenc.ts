/** Base32 (RFC 4648) e Base58 (alfabeto Bitcoin). Puro. */

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const enc = new TextEncoder();
const dec = new TextDecoder();

// ---------------- Base32 ----------------

export function base32Encode(bytes: Uint8Array, pad = true): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  if (pad) while (out.length % 8 !== 0) out += "=";
  return out;
}

export function base32Decode(input: string): Uint8Array {
  const clean = input.replace(/=+$/, "").replace(/\s/g, "").toUpperCase();
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`Caractere Base32 inválido: “${ch}”`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export const base32EncodeText = (s: string, pad = true) => base32Encode(enc.encode(s), pad);
export const base32DecodeText = (s: string) => dec.decode(base32Decode(s));

// ---------------- Base58 ----------------

export function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  const digits = [0];
  for (const b of bytes) {
    let carry = b;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = "";
  for (const b of bytes) {
    if (b === 0) out += B58_ALPHABET[0];
    else break;
  }
  for (let i = digits.length - 1; i >= 0; i--) out += B58_ALPHABET[digits[i]];
  return out;
}

export function base58Decode(input: string): Uint8Array {
  const s = input.trim();
  if (s === "") return new Uint8Array();
  const bytes = [0];
  for (const ch of s) {
    const val = B58_ALPHABET.indexOf(ch);
    if (val === -1) throw new Error(`Caractere Base58 inválido: “${ch}”`);
    let carry = val;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  let leading = 0;
  for (const ch of s) {
    if (ch === B58_ALPHABET[0]) leading++;
    else break;
  }
  const out = new Uint8Array(leading + bytes.length);
  for (let i = 0; i < bytes.length; i++) out[leading + bytes.length - 1 - i] = bytes[i];
  return out;
}

export const base58EncodeText = (s: string) => base58Encode(enc.encode(s));
export const base58DecodeText = (s: string) => dec.decode(base58Decode(s));
