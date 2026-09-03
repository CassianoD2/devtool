/** Geração de TOTP/HOTP (RFC 6238 / 4226). Puro — HMAC via Web Crypto. */

import { base32Decode } from "./basenc";

export type OtpAlgo = "SHA-1" | "SHA-256" | "SHA-512";

export interface OtpConfig {
  secret: string; // base32
  digits: number;
  period: number;
  algorithm: OtpAlgo;
  issuer?: string;
  label?: string;
}

export const DEFAULT_OTP: OtpConfig = {
  secret: "",
  digits: 6,
  period: 30,
  algorithm: "SHA-1",
};

/** Lê `otpauth://totp/Issuer:acc?secret=...&issuer=...&digits=6&period=30&algorithm=SHA1` */
export function parseOtpauth(uri: string): OtpConfig {
  let u: URL;
  try {
    u = new URL(uri.trim());
  } catch {
    throw new Error("URI otpauth inválida.");
  }
  if (u.protocol !== "otpauth:") throw new Error("Esperado um link otpauth://…");
  const p = u.searchParams;
  const secret = (p.get("secret") ?? "").replace(/\s/g, "");
  if (!secret) throw new Error("otpauth sem parâmetro `secret`.");
  const algoRaw = (p.get("algorithm") ?? "SHA1").toUpperCase();
  const algorithm: OtpAlgo =
    algoRaw === "SHA256" ? "SHA-256" : algoRaw === "SHA512" ? "SHA-512" : "SHA-1";
  const label = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
  return {
    secret,
    digits: Number(p.get("digits")) || 6,
    period: Number(p.get("period")) || 30,
    algorithm,
    issuer: p.get("issuer") ?? label.split(":")[0] ?? undefined,
    label,
  };
}

function counterBytes(counter: number): Uint8Array {
  const buf = new Uint8Array(8);
  let n = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = n & 0xff;
    n = Math.floor(n / 256);
  }
  return buf;
}

async function hotp(config: OtpConfig, counter: number): Promise<string> {
  const keyData = base32Decode(config.secret);
  if (keyData.length === 0) throw new Error("Segredo Base32 vazio ou inválido.");
  const key = await crypto.subtle.importKey(
    "raw",
    keyData as unknown as BufferSource,
    { name: "HMAC", hash: config.algorithm },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, counterBytes(counter) as unknown as BufferSource),
  );
  const offset = mac[mac.length - 1] & 0x0f;
  const bin =
    ((mac[offset] & 0x7f) << 24) |
    ((mac[offset + 1] & 0xff) << 16) |
    ((mac[offset + 2] & 0xff) << 8) |
    (mac[offset + 3] & 0xff);
  return String(bin % 10 ** config.digits).padStart(config.digits, "0");
}

export async function totpAt(config: OtpConfig, epochMs: number): Promise<string> {
  return hotp(config, Math.floor(epochMs / 1000 / config.period));
}

export function secondsRemaining(config: OtpConfig, epochMs: number): number {
  const s = Math.floor(epochMs / 1000);
  return config.period - (s % config.period);
}

export { hotp };
