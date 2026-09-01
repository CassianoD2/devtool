import xmlFormat from "xml-formatter";
import { XMLValidator } from "fast-xml-parser";

export type XmlIndent = "2" | "4" | "tab";

export interface FormatXmlOptions {
  indent?: XmlIndent;
  collapseContent?: boolean;
}

function indentation(style: XmlIndent): string {
  if (style === "tab") return "\t";
  return " ".repeat(Number(style));
}

/** Validate an XML string; returns null when valid or a message when not. */
export function validateXml(input: string): string | null {
  const result = XMLValidator.validate(input, { allowBooleanAttributes: true });
  if (result === true) return null;
  const { code, msg, line, col } = result.err;
  return `${code}: ${msg} (linha ${line}, coluna ${col})`;
}

/** Pretty-print XML. Throws Error with a validation message on invalid input. */
export function formatXml(input: string, opts: FormatXmlOptions = {}): string {
  const text = input.trim();
  if (!text) throw new Error("Entrada vazia.");
  const invalid = validateXml(text);
  if (invalid) throw new Error(invalid);
  return xmlFormat(text, {
    indentation: indentation(opts.indent ?? "2"),
    collapseContent: opts.collapseContent ?? true,
    lineSeparator: "\n",
    whiteSpaceAtEndOfSelfclosingTag: true,
  });
}

/** Collapse XML to a single line. */
export function minifyXml(input: string): string {
  const text = input.trim();
  if (!text) throw new Error("Entrada vazia.");
  const invalid = validateXml(text);
  if (invalid) throw new Error(invalid);
  return xmlFormat.minify(text, { filter: (node) => node.type !== "Comment" });
}
