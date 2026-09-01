interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  raw: { header: string; payload: string; signature: string };
}

function b64urlToString(segment: string): string {
  const b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwt(token: string): JwtParts {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error("Um JWT deve ter 3 partes separadas por ponto.");
  }
  const [h, p, s] = parts;
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(b64urlToString(h));
  } catch {
    throw new Error("Header não é um JSON Base64URL válido.");
  }
  try {
    payload = JSON.parse(b64urlToString(p));
  } catch {
    throw new Error("Payload não é um JSON Base64URL válido.");
  }
  return { header, payload, signature: s, raw: { header: h, payload: p, signature: s } };
}

/** Human-readable notes about standard time claims. */
export function describeClaims(payload: Record<string, unknown>): string[] {
  const notes: string[] = [];
  const now = Date.now();
  const asDate = (v: unknown) =>
    typeof v === "number" ? new Date(v * 1000).toISOString() : null;

  const exp = asDate(payload.exp);
  if (exp) {
    const expired = (payload.exp as number) * 1000 < now;
    notes.push(`exp: ${exp} ${expired ? "— EXPIRADO" : "— válido"}`);
  }
  const iat = asDate(payload.iat);
  if (iat) notes.push(`iat: ${iat}`);
  const nbf = asDate(payload.nbf);
  if (nbf) {
    const notYet = (payload.nbf as number) * 1000 > now;
    notes.push(`nbf: ${nbf}${notYet ? " — ainda não válido" : ""}`);
  }
  return notes;
}

/** Verify an HS256/384/512 signature. Returns true/false; throws on malformed input. */
export async function verifyHmac(token: string, secret: string): Promise<boolean> {
  const parts = token.trim().split(".");
  if (parts.length !== 3) throw new Error("Token malformado.");
  const { header } = decodeJwt(token);
  const alg = String(header.alg ?? "");
  const hash = { HS256: "SHA-256", HS384: "SHA-384", HS512: "SHA-512" }[alg];
  if (!hash) throw new Error(`Algoritmo ${alg || "?"} não suportado para verificação HMAC.`);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash },
    false,
    ["verify"],
  );
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const sigB64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
  const sigPadded = sigB64.padEnd(sigB64.length + ((4 - (sigB64.length % 4)) % 4), "=");
  const sig = Uint8Array.from(atob(sigPadded), (c) => c.charCodeAt(0));
  return crypto.subtle.verify("HMAC", key, sig, data);
}
