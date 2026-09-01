import { describe, it, expect } from "vitest";
import { hashText } from "./hash";

// Node's webcrypto backs crypto.subtle under Vitest.
describe("hashText", () => {
  it("MD5 of 'abc'", async () => {
    expect(await hashText("abc", "MD5")).toBe("900150983cd24fb0d6963f7d28e17f72");
  });

  it("SHA-1 of 'abc'", async () => {
    expect(await hashText("abc", "SHA-1")).toBe(
      "a9993e364706816aba3e25717850c26c9cd0d89d",
    );
  });

  it("SHA-256 of 'abc'", async () => {
    expect(await hashText("abc", "SHA-256")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("SHA-512 of empty string", async () => {
    expect(await hashText("", "SHA-512")).toBe(
      "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce" +
        "47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
    );
  });
});
