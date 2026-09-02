import { describe, it, expect } from "vitest";
import { applyLineOp } from "./lines";

describe("applyLineOp", () => {
  it("ordena A→Z e Z→A", () => {
    expect(applyLineOp("banana\nabacaxi\ncaju", "sort-asc")).toBe("abacaxi\nbanana\ncaju");
    expect(applyLineOp("banana\nabacaxi\ncaju", "sort-desc")).toBe("caju\nbanana\nabacaxi");
  });
  it("ordena natural (numérico)", () => {
    expect(applyLineOp("item10\nitem2\nitem1", "sort-natural")).toBe("item1\nitem2\nitem10");
  });
  it("ordena por tamanho", () => {
    expect(applyLineOp("ccc\na\nbb", "sort-length")).toBe("a\nbb\nccc");
  });
  it("remove duplicadas mantendo a primeira / a última", () => {
    expect(applyLineOp("a\nb\na\nc\nb", "dedupe")).toBe("a\nb\nc");
    expect(applyLineOp("a\nb\na\nc\nb", "dedupe-last")).toBe("a\nc\nb");
  });
  it("dedupe case-insensitive", () => {
    expect(applyLineOp("Foo\nfoo\nBAR", "dedupe", { caseInsensitive: true })).toBe("Foo\nBAR");
  });
  it("inverte a ordem", () => {
    expect(applyLineOp("1\n2\n3", "reverse")).toBe("3\n2\n1");
  });
  it("numera com padding", () => {
    expect(applyLineOp("a\nb", "number")).toBe("1. a\n2. b");
  });
  it("trim e remove vazias", () => {
    expect(applyLineOp("  a  \n\n b ", "trim")).toBe("a\n\nb");
    expect(applyLineOp("a\n\n  \nb", "remove-blank")).toBe("a\nb");
  });
  it("filtra por conteúdo (com invert)", () => {
    expect(applyLineOp("apple\nbanana\napricot", "filter-contains", { arg: "ap" })).toBe(
      "apple\napricot",
    );
    expect(
      applyLineOp("apple\nbanana\napricot", "filter-contains", { arg: "ap", invert: true }),
    ).toBe("banana");
  });
  it("filtra por regex e reclama de regex inválida", () => {
    expect(applyLineOp("a1\nb2\nc\nd3", "filter-regex", { arg: "\\d$" })).toBe("a1\nb2\nd3");
    expect(() => applyLineOp("x", "filter-regex", { arg: "(" })).toThrow(/Regex inválida/);
  });
  it("prefixo/sufixo", () => {
    expect(applyLineOp("a\nb", "prefix-suffix", { arg: "<li>|</li>" })).toBe(
      "<li>a</li>\n<li>b</li>",
    );
  });
  it("junta e quebra por delimitador", () => {
    expect(applyLineOp("a\nb\nc", "join", { arg: " | " })).toBe("a | b | c");
    expect(applyLineOp("a, b\nc,d", "split", { arg: "," })).toBe("a\nb\nc\nd");
  });
  it("shuffle é determinístico e preserva o conjunto", () => {
    const src = "a\nb\nc\nd\ne";
    const out = applyLineOp(src, "shuffle");
    expect(out.split("\n").sort()).toEqual(["a", "b", "c", "d", "e"]);
    expect(applyLineOp(src, "shuffle")).toBe(out);
  });
});
