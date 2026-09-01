export type CaseName =
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot"
  | "title"
  | "sentence"
  | "lower"
  | "upper";

export const CASES: { id: CaseName; label: string }[] = [
  { id: "camel", label: "camelCase" },
  { id: "pascal", label: "PascalCase" },
  { id: "snake", label: "snake_case" },
  { id: "kebab", label: "kebab-case" },
  { id: "constant", label: "CONSTANT_CASE" },
  { id: "dot", label: "dot.case" },
  { id: "title", label: "Title Case" },
  { id: "sentence", label: "Sentence case" },
  { id: "lower", label: "lower case" },
  { id: "upper", label: "UPPER CASE" },
];

/** Break an arbitrary string into lowercase words. */
export function toWords(input: string): string[] {
  return (
    input
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean)
      .map((w) => w.toLowerCase())
  );
}

export function convertCase(input: string, target: CaseName): string {
  // Preserve line structure: convert each line independently.
  return input
    .split("\n")
    .map((line) => convertLine(line, target))
    .join("\n");
}

function convertLine(line: string, target: CaseName): string {
  const words = toWords(line);
  if (words.length === 0) return line;
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
  switch (target) {
    case "camel":
      return words.map((w, i) => (i === 0 ? w : cap(w))).join("");
    case "pascal":
      return words.map(cap).join("");
    case "snake":
      return words.join("_");
    case "kebab":
      return words.join("-");
    case "constant":
      return words.join("_").toUpperCase();
    case "dot":
      return words.join(".");
    case "title":
      return words.map(cap).join(" ");
    case "sentence":
      return cap(words.join(" "));
    case "lower":
      return words.join(" ");
    case "upper":
      return words.join(" ").toUpperCase();
  }
}
