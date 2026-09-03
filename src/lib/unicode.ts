/** Inspeção de texto Unicode caractere a caractere. Puro. */

export interface CharInfo {
  char: string;
  codePoint: number;
  hex: string; // U+XXXX
  category: string;
  block: string;
  utf8: string; // "e2 82 ac"
  utf16: string; // "20ac"
  htmlEntity: string; // "&#8364;" ou "&euro;"
  name: string;
  invisible: boolean;
}

/** Blocos Unicode mais comuns (início, fim, nome). Não é exaustivo. */
const BLOCKS: [number, number, string][] = [
  [0x0000, 0x007f, "Basic Latin (ASCII)"],
  [0x0080, 0x00ff, "Latin-1 Supplement"],
  [0x0100, 0x017f, "Latin Extended-A"],
  [0x0180, 0x024f, "Latin Extended-B"],
  [0x0250, 0x02af, "IPA Extensions"],
  [0x0300, 0x036f, "Combining Diacritical Marks"],
  [0x0370, 0x03ff, "Greek and Coptic"],
  [0x0400, 0x04ff, "Cyrillic"],
  [0x0590, 0x05ff, "Hebrew"],
  [0x0600, 0x06ff, "Arabic"],
  [0x1e00, 0x1eff, "Latin Extended Additional"],
  [0x2000, 0x206f, "General Punctuation"],
  [0x2070, 0x209f, "Superscripts and Subscripts"],
  [0x20a0, 0x20cf, "Currency Symbols"],
  [0x2100, 0x214f, "Letterlike Symbols"],
  [0x2190, 0x21ff, "Arrows"],
  [0x2200, 0x22ff, "Mathematical Operators"],
  [0x2300, 0x23ff, "Miscellaneous Technical"],
  [0x2500, 0x257f, "Box Drawing"],
  [0x2600, 0x26ff, "Miscellaneous Symbols"],
  [0x2700, 0x27bf, "Dingbats"],
  [0x3000, 0x303f, "CJK Symbols and Punctuation"],
  [0x3040, 0x309f, "Hiragana"],
  [0x30a0, 0x30ff, "Katakana"],
  [0x4e00, 0x9fff, "CJK Unified Ideographs"],
  [0xac00, 0xd7af, "Hangul Syllables"],
  [0xe000, 0xf8ff, "Private Use Area"],
  [0xfe00, 0xfe0f, "Variation Selectors"],
  [0x1f300, 0x1f5ff, "Miscellaneous Symbols and Pictographs"],
  [0x1f600, 0x1f64f, "Emoticons"],
  [0x1f680, 0x1f6ff, "Transport and Map Symbols"],
  [0x1f900, 0x1f9ff, "Supplemental Symbols and Pictographs"],
];

const NAMED_ENTITIES: Record<number, string> = {
  34: "quot", 38: "amp", 60: "lt", 62: "gt", 160: "nbsp", 169: "copy", 174: "reg",
  8211: "ndash", 8212: "mdash", 8216: "lsquo", 8217: "rsquo", 8220: "ldquo",
  8221: "rdquo", 8226: "bull", 8230: "hellip", 8364: "euro", 8482: "trade",
};

const CONTROL_NAMES: Record<number, string> = {
  0: "NULL", 8: "BACKSPACE", 9: "TAB", 10: "LINE FEED", 13: "CARRIAGE RETURN",
  27: "ESCAPE", 32: "SPACE", 127: "DELETE", 160: "NO-BREAK SPACE",
  0x200b: "ZERO WIDTH SPACE", 0x200c: "ZERO WIDTH NON-JOINER",
  0x200d: "ZERO WIDTH JOINER", 0x200e: "LEFT-TO-RIGHT MARK",
  0x200f: "RIGHT-TO-LEFT MARK", 0x2028: "LINE SEPARATOR", 0x2029: "PARAGRAPH SEPARATOR",
  0x202f: "NARROW NO-BREAK SPACE", 0xfeff: "BYTE ORDER MARK",
};

const INVISIBLE = new Set([
  0x09, 0x0a, 0x0d, 0x20, 0xa0, 0xad, 0x200b, 0x200c, 0x200d, 0x200e, 0x200f,
  0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff,
]);

function categoryOf(cp: number): string {
  const s = String.fromCodePoint(cp);
  const tests: [string, RegExp][] = [
    ["Letra", /\p{L}/u],
    ["Número", /\p{N}/u],
    ["Pontuação", /\p{P}/u],
    ["Símbolo", /\p{S}/u],
    ["Marca", /\p{M}/u],
    ["Espaço", /\p{Zs}/u],
    ["Separador", /\p{Z}/u],
    ["Controle", /\p{Cc}/u],
    ["Formato", /\p{Cf}/u],
  ];
  for (const [label, re] of tests) if (re.test(s)) return label;
  return "Outro";
}

function blockOf(cp: number): string {
  for (const [lo, hi, name] of BLOCKS) if (cp >= lo && cp <= hi) return name;
  return "—";
}

export function inspectChar(char: string): CharInfo {
  const cp = char.codePointAt(0)!;
  const utf8 = Array.from(new TextEncoder().encode(char))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
  const utf16 = Array.from({ length: char.length }, (_, i) =>
    char.charCodeAt(i).toString(16).padStart(4, "0"),
  ).join(" ");
  const named = NAMED_ENTITIES[cp];
  return {
    char,
    codePoint: cp,
    hex: "U+" + cp.toString(16).toUpperCase().padStart(4, "0"),
    category: categoryOf(cp),
    block: blockOf(cp),
    utf8,
    utf16,
    htmlEntity: named ? `&${named};` : `&#${cp};`,
    name: CONTROL_NAMES[cp] ?? "",
    invisible: INVISIBLE.has(cp) || (cp >= 0 && cp < 0x20) || (cp >= 0x7f && cp < 0xa0),
  };
}

export function inspectText(text: string): CharInfo[] {
  // Array.from itera por code point (trata pares substitutos)
  return Array.from(text).map(inspectChar);
}

export type NormForm = "NFC" | "NFD" | "NFKC" | "NFKD";

export function normalize(text: string, form: NormForm): string {
  return text.normalize(form);
}

export function stripDiacritics(text: string): string {
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}
