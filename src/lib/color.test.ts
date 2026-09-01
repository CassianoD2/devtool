import { describe, it, expect } from "vitest";
import { parseColor, formatColor, rgbToHsl, contrast } from "./color";

describe("parseColor", () => {
  it("parses #rgb shorthand", () => {
    expect(parseColor("#f00")).toMatchObject({ r: 255, g: 0, b: 0, a: 1 });
  });
  it("parses #rrggbb", () => {
    expect(parseColor("#3b82f6")).toMatchObject({ r: 59, g: 130, b: 246 });
  });
  it("parses #rrggbbaa", () => {
    expect(parseColor("#00000080").a).toBeCloseTo(0.5, 1);
  });
  it("parses rgb() and hsl()", () => {
    expect(parseColor("rgb(59, 130, 246)")).toMatchObject({ r: 59, g: 130, b: 246 });
    expect(parseColor("hsl(0, 100%, 50%)")).toMatchObject({ r: 255, g: 0, b: 0 });
  });
  it("throws on nonsense", () => {
    expect(() => parseColor("banana")).toThrow();
  });
});

describe("conversions", () => {
  it("hex -> hsl -> matches", () => {
    expect(rgbToHsl(parseColor("#3b82f6"))).toEqual({ h: 217, s: 91, l: 60 });
  });
  it("formatColor emits all notations", () => {
    const f = formatColor(parseColor("#ff0000"));
    expect(f.hex).toBe("#ff0000");
    expect(f.rgb).toBe("rgb(255, 0, 0)");
    expect(f.hsl).toBe("hsl(0, 100%, 50%)");
    expect(f.hsv).toBe("hsv(0, 100%, 100%)");
  });
});

describe("contrast (WCAG)", () => {
  it("black on white is 21:1 and passes everything", () => {
    const r = contrast(parseColor("#000"), parseColor("#fff"));
    expect(r.ratio).toBe(21);
    expect(r.aaNormal && r.aaaNormal).toBe(true);
  });
  it("mid grey on white fails AA normal", () => {
    const r = contrast(parseColor("#999999"), parseColor("#ffffff"));
    expect(r.ratio).toBeGreaterThan(2.5);
    expect(r.ratio).toBeLessThan(3.2);
    expect(r.aaNormal).toBe(false);
  });
  it("#767676 on white is the classic AA-normal threshold", () => {
    const r = contrast(parseColor("#767676"), parseColor("#ffffff"));
    expect(r.aaNormal).toBe(true);
    expect(r.aaaNormal).toBe(false);
  });
});
