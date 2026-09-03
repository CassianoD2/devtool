import { describe, it, expect } from "vitest";
import { signJwt, withTimestamps } from "./jwtsign";
import { decodeJwt } from "./jwt";

describe("signJwt — HS256", () => {
  it("token válido, 3 partes, header e payload corretos", async () => {
    const t = await signJwt("{}", JSON.stringify({ sub: "123", name: "Ana" }), "HS256", "segredo");
    expect(t.split(".")).toHaveLength(3);
    const { header, payload } = decodeJwt(t);
    expect(header).toMatchObject({ alg: "HS256", typ: "JWT" });
    expect(payload).toMatchObject({ sub: "123", name: "Ana" });
  });

  it("assinatura determinística p/ mesmo segredo+conteúdo", async () => {
    const a = await signJwt("{}", '{"a":1}', "HS512", "k");
    const b = await signJwt("{}", '{"a":1}', "HS512", "k");
    expect(a).toBe(b);
  });

  it("muda com o segredo", async () => {
    const a = await signJwt("{}", '{"a":1}', "HS256", "k1");
    const b = await signJwt("{}", '{"a":1}', "HS256", "k2");
    expect(a).not.toBe(b);
  });

  it("erros legíveis", async () => {
    await expect(signJwt("{", "{}", "HS256", "k")).rejects.toThrow(/Header/);
    await expect(signJwt("{}", "{", "HS256", "k")).rejects.toThrow(/Payload/);
    await expect(signJwt("{}", "{}", "HS256", "")).rejects.toThrow(/segredo/);
  });
});

describe("signJwt — RS256 (par de chaves gerado no teste)", () => {
  it("assina e o decode bate", async () => {
    const kp = await crypto.subtle.generateKey(
      { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      true,
      ["sign", "verify"],
    );
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
    let bin = "";
    for (const b of pkcs8) bin += String.fromCharCode(b);
    const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(bin).replace(/(.{64})/g, "$1\n")}\n-----END PRIVATE KEY-----`;

    const t = await signJwt("{}", '{"sub":"x"}', "RS256", pem);
    const { header, payload } = decodeJwt(t);
    expect(header).toMatchObject({ alg: "RS256" });
    expect(payload).toMatchObject({ sub: "x" });
  });
});

describe("withTimestamps", () => {
  it("acrescenta iat e exp", () => {
    const out = JSON.parse(withTimestamps('{"sub":"a"}', 3600));
    expect(typeof out.iat).toBe("number");
    expect(out.exp - out.iat).toBe(3600);
  });
});
