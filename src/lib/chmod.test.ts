import { describe, it, expect } from "vitest";
import {
  parseOctal,
  toOctal,
  toSymbolic,
  parseSymbolic,
  applyUmask,
} from "./chmod";

describe("chmod octal <-> symbolic", () => {
  it("755 -> rwxr-xr-x", () => {
    expect(toSymbolic(parseOctal("755"))).toBe("rwxr-xr-x");
  });
  it("644 -> rw-r--r--", () => {
    expect(toSymbolic(parseOctal("644"))).toBe("rw-r--r--");
  });
  it("round-trips through symbolic", () => {
    expect(toOctal(parseSymbolic("rwxr-xr-x"))).toBe("0755");
    expect(toOctal(parseSymbolic("-rw-rw-r--"))).toBe("0664");
  });
  it("handles the setuid bit (4755 -> rwsr-xr-x)", () => {
    const p = parseOctal("4755");
    expect(p.setuid).toBe(true);
    expect(toSymbolic(p)).toBe("rwsr-xr-x");
    expect(toOctal(p)).toBe("4755");
  });
  it("handles sticky (1777 -> rwxrwxrwt)", () => {
    expect(toSymbolic(parseOctal("1777"))).toBe("rwxrwxrwt");
  });
  it("rejects garbage", () => {
    expect(() => parseOctal("9")).toThrow();
    expect(() => parseSymbolic("rw")).toThrow();
  });
});

describe("applyUmask", () => {
  it("022 -> 644 files, 755 dirs", () => {
    expect(applyUmask("022")).toEqual({ file: "644", dir: "755" });
  });
  it("077 -> 600 files, 700 dirs", () => {
    expect(applyUmask("077")).toEqual({ file: "600", dir: "700" });
  });
});
