import { describe, it, expect } from "vitest";
import { convertNumberBase } from "./numbase";

describe("convertNumberBase", () => {
  it("converts decimal 255 to every base", () => {
    expect(convertNumberBase("255", 10)).toEqual({
      2: "11111111",
      8: "377",
      10: "255",
      16: "ff",
    });
  });

  it("accepts prefixed hex input", () => {
    expect(convertNumberBase("0xFF", 16)[10]).toBe("255");
  });

  it("handles very large values with BigInt precision", () => {
    const big = "123456789012345678901234567890";
    expect(convertNumberBase(big, 10)[10]).toBe(big);
  });

  it("supports negative numbers", () => {
    expect(convertNumberBase("-10", 10)[2]).toBe("-1010");
  });

  it("rejects digits outside the base", () => {
    expect(() => convertNumberBase("2", 2)).toThrow(/inválido/);
  });
});
