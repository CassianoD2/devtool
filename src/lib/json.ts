export type IndentStyle = "2" | "4" | "tab";

export function indentChars(style: IndentStyle): string | number {
  if (style === "tab") return "\t";
  return Number(style);
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort((a, b) => a.localeCompare(b))
        .map((k) => [k, sortValue((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

export interface FormatJsonOptions {
  indent?: IndentStyle;
  sortKeys?: boolean;
}

/** Pretty-print JSON. Throws SyntaxError with a helpful message on invalid input. */
export function formatJson(input: string, opts: FormatJsonOptions = {}): string {
  const parsed = parseJsonOrThrow(input);
  const value = opts.sortKeys ? sortValue(parsed) : parsed;
  return JSON.stringify(value, null, indentChars(opts.indent ?? "2"));
}

/** Collapse JSON to a single line. */
export function minifyJson(input: string): string {
  return JSON.stringify(parseJsonOrThrow(input));
}

export function parseJsonOrThrow(input: string): unknown {
  const text = input.trim();
  if (!text) throw new SyntaxError("Entrada vazia.");
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new SyntaxError(describeJsonError(text, err as Error));
  }
}

/** Turn a raw JSON.parse error into a message that points at a line/column. */
function describeJsonError(text: string, err: Error): string {
  // V8 messages carry "line X column Y" in newer builds, "position N" in older.
  const lineCol = /line (\d+) column (\d+)/.exec(err.message);
  if (lineCol) {
    return `${cleanMessage(err.message)} (linha ${lineCol[1]}, coluna ${lineCol[2]})`;
  }
  const posMatch = /position (\d+)/.exec(err.message);
  if (posMatch) {
    const pos = Number(posMatch[1]);
    const before = text.slice(0, pos);
    const line = before.split("\n").length;
    const col = pos - before.lastIndexOf("\n");
    return `${cleanMessage(err.message)} (linha ${line}, coluna ${col})`;
  }
  return cleanMessage(err.message);
}

/** Strip the noisy ", "<input snippet>" is not valid JSON" / " in JSON..." tails. */
function cleanMessage(message: string): string {
  return message
    .replace(/,\s*"[\s\S]*?"\s+is not valid JSON\.?$/, "")
    .replace(/ in JSON at position.*/, "")
    .replace(/ in JSON$/, "")
    .trim();
}
