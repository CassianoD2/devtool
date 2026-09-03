/** Assina JWTs (HMAC, RSA e ECDSA) via Web Crypto. Puro. */

export type JwtAlg =
  | "HS256"
  | "HS384"
  | "HS512"
  | "RS256"
  | "RS384"
  | "RS512"
  | "ES256"
  | "ES384"
  | "ES512";

export const JWT_ALGS: { id: JwtAlg; label: string; key: "secret" | "pem" }[] = [
  { id: "HS256", label: "HS256 (HMAC-SHA256)", key: "secret" },
  { id: "HS384", label: "HS384 (HMAC-SHA384)", key: "secret" },
  { id: "HS512", label: "HS512 (HMAC-SHA512)", key: "secret" },
  { id: "RS256", label: "RS256 (RSA-SHA256)", key: "pem" },
  { id: "RS384", label: "RS384 (RSA-SHA384)", key: "pem" },
  { id: "RS512", label: "RS512 (RSA-SHA512)", key: "pem" },
  { id: "ES256", label: "ES256 (ECDSA P-256)", key: "pem" },
  { id: "ES384", label: "ES384 (ECDSA P-384)", key: "pem" },
  { id: "ES512", label: "ES512 (ECDSA P-521)", key: "pem" },
];

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const byte of b) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const b64urlStr = (s: string) => b64url(enc.encode(s));

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

const HASH = (alg: JwtAlg) =>
  alg.endsWith("256") ? "SHA-256" : alg.endsWith("384") ? "SHA-384" : "SHA-512";
const EC_CURVE = (alg: JwtAlg) =>
  alg === "ES256" ? "P-256" : alg === "ES384" ? "P-384" : "P-521";

async function importSigningKey(alg: JwtAlg, keyMaterial: string): Promise<CryptoKey> {
  if (alg.startsWith("HS")) {
    return crypto.subtle.importKey(
      "raw",
      enc.encode(keyMaterial) as unknown as BufferSource,
      { name: "HMAC", hash: HASH(alg) },
      false,
      ["sign"],
    );
  }
  const pkcs8 = pemToArrayBuffer(keyMaterial);
  if (alg.startsWith("RS")) {
    return crypto.subtle.importKey(
      "pkcs8",
      pkcs8,
      { name: "RSASSA-PKCS1-v1_5", hash: HASH(alg) },
      false,
      ["sign"],
    );
  }
  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "ECDSA", namedCurve: EC_CURVE(alg) },
    false,
    ["sign"],
  );
}

function signParams(alg: JwtAlg): AlgorithmIdentifier | EcdsaParams {
  if (alg.startsWith("HS")) return { name: "HMAC" };
  if (alg.startsWith("RS")) return { name: "RSASSA-PKCS1-v1_5" };
  return { name: "ECDSA", hash: HASH(alg) };
}

/** `payload` e `header` são strings JSON. `keyMaterial` = segredo (HS) ou PEM PKCS#8 (RS/ES). */
export async function signJwt(
  headerJson: string,
  payloadJson: string,
  alg: JwtAlg,
  keyMaterial: string,
): Promise<string> {
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = { ...(JSON.parse(headerJson || "{}") as object), alg, typ: "JWT" };
  } catch {
    throw new Error("Header não é um JSON válido.");
  }
  try {
    payload = JSON.parse(payloadJson || "{}") as Record<string, unknown>;
  } catch {
    throw new Error("Payload não é um JSON válido.");
  }
  if (!keyMaterial.trim()) throw new Error("Informe o segredo ou a chave privada (PEM).");

  const signingInput = `${b64urlStr(JSON.stringify(header))}.${b64urlStr(JSON.stringify(payload))}`;
  let key: CryptoKey;
  try {
    key = await importSigningKey(alg, keyMaterial.trim());
  } catch (e) {
    throw new Error(`Chave inválida para ${alg}: ${(e as Error).message}`);
  }
  const sig = await crypto.subtle.sign(
    signParams(alg),
    key,
    enc.encode(signingInput) as unknown as BufferSource,
  );
  return `${signingInput}.${b64url(sig)}`;
}

/** Adiciona `iat` (agora) e opcionalmente `exp` (agora + segundos) a um payload JSON. */
export function withTimestamps(payloadJson: string, expiresInSec?: number): string {
  let p: Record<string, unknown>;
  try {
    p = JSON.parse(payloadJson || "{}") as Record<string, unknown>;
  } catch {
    return payloadJson;
  }
  const now = Math.floor(Date.now() / 1000);
  p.iat = now;
  if (expiresInSec && expiresInSec > 0) p.exp = now + expiresInSec;
  return JSON.stringify(p, null, 2);
}
