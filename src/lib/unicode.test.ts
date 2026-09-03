import { describe, it, expect } from "vitest";
import { inspectChar, inspectText, normalize, stripDiacritics } from "./unicode";

describe("inspectChar", () => {
  it("ASCII 'A'", () => {
    const c = inspectChar("A");
    expect(c).toMatchObject({
      codePoint: 65,
      hex: "U+0041",
      category: "Letra",
      block: "Basic Latin (ASCII)",
      utf8: "41",
      htmlEntity: "&#65;",
      invisible: false,
    });
  });
  it("Euro € — currency, 3 bytes UTF-8, entidade nomeada", () => {
    const c = inspectChar("€");
    expect(c.hex).toBe("U+20AC");
    expect(c.utf8).toBe("e2 82 ac");
    expect(c.htmlEntity).toBe("&euro;");
    expect(c.block).toBe("Currency Symbols");
  });
  it("emoji fora do BMP", () => {
    const c = inspectChar("😀");
    expect(c.codePoint).toBe(0x1f600);
    expect(c.hex).toBe("U+1F600");
    expect(c.block).toBe("Emoticons");
  });
  it("caracteres invisíveis são marcados", () => {
    expect(inspectChar("​").invisible).toBe(true); // ZWSP
    expect(inspectChar(" ").name).toBe("NO-BREAK SPACE");
    expect(inspectChar(" ").invisible).toBe(true);
  });
});

describe("inspectText", () => {
  it("uma entrada por code point", () => {
    const rows = inspectText("a€😀");
    expect(rows.map((r) => r.hex)).toEqual(["U+0061", "U+20AC", "U+1F600"]);
  });
});

describe("normalize / stripDiacritics", () => {
  it("NFC vs NFD mudam o tamanho", () => {
    const nfd = normalize("á", "NFD");
    expect(nfd.length).toBe(2);
    expect(normalize(nfd, "NFC")).toBe("á");
  });
  it("remove acentos", () => {
    expect(stripDiacritics("ação, coração")).toBe("acao, coracao");
  });
});
