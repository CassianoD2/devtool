import { describe, it, expect } from "vitest";
import { decodeJwt, verifyHmac } from "./jwt";

// Canonical jwt.io HS256 example — signed with the secret "your-256-bit-secret".
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("decodeJwt", () => {
  it("decodes header and payload", () => {
    const { header, payload } = decodeJwt(TOKEN);
    expect(header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(payload).toMatchObject({ sub: "1234567890", name: "John Doe", iat: 1516239022 });
  });

  it("rejects tokens without three segments", () => {
    expect(() => decodeJwt("a.b")).toThrow(/3 partes/);
  });
});

describe("verifyHmac", () => {
  it("accepts the correct secret", async () => {
    expect(await verifyHmac(TOKEN, "your-256-bit-secret")).toBe(true);
  });

  it("rejects a wrong secret", async () => {
    expect(await verifyHmac(TOKEN, "nope")).toBe(false);
  });
});
