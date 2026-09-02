/** Estatísticas de um bloco de texto. Puro. */

export interface TextStats {
  chars: number;
  charsNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
  sentences: number;
  bytes: number;
  longestLine: number;
  avgWordLength: number;
  /** minutos de leitura a ~200 palavras/min */
  readingMinutes: number;
}

const WORDS_PER_MINUTE = 200;

export function textStats(input: string): TextStats {
  const chars = [...input].length;
  const charsNoSpaces = [...input.replace(/\s/g, "")].length;

  const wordList = input.trim() === "" ? [] : input.trim().split(/\s+/);
  const words = wordList.length;

  const lineArr = input.split(/\r\n|\r|\n/);
  const lines = input === "" ? 0 : lineArr.length;
  const longestLine = lineArr.reduce((m, l) => Math.max(m, [...l].length), 0);

  const paragraphs = input
    .split(/\n[ \t]*\n/)
    .map((p) => p.trim())
    .filter(Boolean).length;

  const sentences = (input.match(/[.!?…]+(\s|$)/g) ?? []).length;

  const bytes = new TextEncoder().encode(input).length;

  const avgWordLength =
    words === 0 ? 0 : Math.round((wordList.join("").length / words) * 10) / 10;

  const readingMinutes = words === 0 ? 0 : Math.max(1, Math.round(words / WORDS_PER_MINUTE));

  return {
    chars,
    charsNoSpaces,
    words,
    lines,
    paragraphs,
    sentences,
    bytes,
    longestLine,
    avgWordLength,
    readingMinutes,
  };
}
