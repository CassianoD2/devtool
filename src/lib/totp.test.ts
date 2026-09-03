import { describe, it, expect } from "vitest";
import { parseOtpauth, totpAt, hotp, secondsRemaining, DEFAULT_OTP } from "./totp";

// RFC 4226 Appendix D — segredo ASCII "12345678901234567890" = base32 abaixo
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("HOTP (RFC 4226)", () => {
  it.each([
    [0, "755224"],
    [1, "287082"],
    [2, "359152"],
    [9, "520489"],
  ])("counter %i → %s", async (counter, expected) => {
    expect(await hotp({ ...DEFAULT_OTP, secret: RFC_SECRET }, counter)).toBe(expected);
  });
});

describe("TOTP (RFC 6238, SHA-1)", () => {
  it("t=59s → 94287082 (8 dígitos)", async () => {
    const cfg = { ...DEFAULT_OTP, secret: RFC_SECRET, digits: 8 };
    expect(await totpAt(cfg, 59_000)).toBe("94287082");
  });
});

describe("secondsRemaining", () => {
  it("conta o tempo até a próxima janela", () => {
    expect(secondsRemaining(DEFAULT_OTP, 0)).toBe(30);
    expect(secondsRemaining(DEFAULT_OTP, 10_000)).toBe(20);
    expect(secondsRemaining(DEFAULT_OTP, 29_000)).toBe(1);
  });
});

describe("parseOtpauth", () => {
  it("extrai secret, issuer, digits, period, algorithm", () => {
    const c = parseOtpauth(
      "otpauth://totp/GitHub:alice?secret=" + RFC_SECRET + "&issuer=GitHub&digits=8&period=60&algorithm=SHA256",
    );
    expect(c).toMatchObject({
      secret: RFC_SECRET,
      issuer: "GitHub",
      digits: 8,
      period: 60,
      algorithm: "SHA-256",
    });
  });
  it("defaults quando os params faltam", () => {
    const c = parseOtpauth("otpauth://totp/acc?secret=" + RFC_SECRET);
    expect(c).toMatchObject({ digits: 6, period: 30, algorithm: "SHA-1" });
  });
  it("rejeita URI não-otpauth e sem secret", () => {
    expect(() => parseOtpauth("https://x")).toThrow();
    expect(() => parseOtpauth("otpauth://totp/acc")).toThrow(/secret/);
  });
});
