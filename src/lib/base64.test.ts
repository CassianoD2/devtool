import { describe, it, expect } from "vitest";
import { encodeBase64, decodeBase64 } from "./base64";

describe("base64", () => {
  it("round-trips ASCII", () => {
    expect(decodeBase64(encodeBase64("hello world"))).toBe("hello world");
  });

  it("handles UTF-8 (accents, emoji)", () => {
    const s = "ação — café 🚀";
    expect(decodeBase64(encodeBase64(s))).toBe(s);
  });

  it("matches known vector", () => {
    expect(encodeBase64("abc")).toBe("YWJj");
  });

  it("produces URL-safe output without padding", () => {
    const enc = encodeBase64("<<???>>", true);
    expect(enc).not.toMatch(/[+/=]/);
    expect(decodeBase64(enc)).toBe("<<???>>");
  });

  it("accepts input with whitespace and missing padding", () => {
    expect(decodeBase64("YWJj\n")).toBe("abc");
    expect(decodeBase64("YW Jj")).toBe("abc"); // internal whitespace stripped
    expect(decodeBase64("YWJj")).toBe("abc");
  });

  it("throws on clearly invalid base64", () => {
    expect(() => decodeBase64("!!!!")).toThrow();
  });
});
