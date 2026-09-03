import { describe, it, expect } from "vitest";
import {
  base32EncodeText,
  base32DecodeText,
  base32Decode,
  base58EncodeText,
  base58DecodeText,
  base58Encode,
  base58Decode,
} from "./basenc";

describe("Base32 (RFC 4648)", () => {
  it("vetores conhecidos", () => {
    expect(base32EncodeText("")).toBe("");
    expect(base32EncodeText("f")).toBe("MY======");
    expect(base32EncodeText("fo")).toBe("MZXQ====");
    expect(base32EncodeText("foobar")).toBe("MZXW6YTBOI======");
  });
  it("round-trip e sem padding", () => {
    expect(base32DecodeText("MZXW6YTBOI======")).toBe("foobar");
    expect(base32EncodeText("foobar", false)).toBe("MZXW6YTBOI");
    expect(base32DecodeText("mzxw6ytboi")).toBe("foobar"); // aceita minúsculas
  });
  it("caractere inválido lança", () => {
    expect(() => base32Decode("MZXW0")).toThrow(/inválido/);
  });
});

describe("Base58 (Bitcoin)", () => {
  it("vetores conhecidos", () => {
    expect(base58EncodeText("Hello World!")).toBe("2NEpo7TZRRrLZSi2U");
    expect(base58DecodeText("2NEpo7TZRRrLZSi2U")).toBe("Hello World!");
  });
  it("preserva zeros à esquerda (round-trip)", () => {
    const withZeros = new Uint8Array([0, 0, 1, 2, 3]);
    const s = base58Encode(withZeros);
    expect(s.startsWith("11")).toBe(true);
    expect(Array.from(base58Decode(s))).toEqual([0, 0, 1, 2, 3]);
  });
  it("caractere inválido lança", () => {
    expect(() => base58DecodeText("0OIl")).toThrow(/inválido/);
  });
});
