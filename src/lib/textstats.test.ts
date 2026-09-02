import { describe, it, expect } from "vitest";
import { textStats } from "./textstats";

describe("textStats", () => {
  it("conta chars, palavras e linhas", () => {
    const s = textStats("um dois tres\nquatro cinco");
    expect(s.words).toBe(5);
    expect(s.lines).toBe(2);
    expect(s.chars).toBe(25);
    expect(s.charsNoSpaces).toBe(21);
  });
  it("string vazia zera tudo", () => {
    const s = textStats("");
    expect(s).toMatchObject({ chars: 0, words: 0, lines: 0, paragraphs: 0, sentences: 0, bytes: 0 });
  });
  it("conta parágrafos separados por linha em branco", () => {
    expect(textStats("a\nb\n\nc\n\n\nd").paragraphs).toBe(3);
  });
  it("conta frases por pontuação terminal", () => {
    expect(textStats("Oi. Tudo bem? Sim! Fim").sentences).toBe(3);
  });
  it("bytes em UTF-8 (acentos contam 2)", () => {
    expect(textStats("ção").bytes).toBe(5);
    expect(textStats("ção").chars).toBe(3);
  });
  it("linha mais longa e tempo de leitura", () => {
    expect(textStats("curta\numa linha bem mais longa aqui").longestLine).toBe(29);
    expect(textStats(Array(400).fill("palavra").join(" ")).readingMinutes).toBe(2);
  });
});
