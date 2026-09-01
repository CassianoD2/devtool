import { XMLParser, XMLBuilder } from "fast-xml-parser";
import xmlFormat from "xml-formatter";
import { parseJsonOrThrow } from "./json";
import { yamlToJsonValue, jsonValueToYaml } from "./yaml";
import { validateXml } from "./xml";

export type DataFormat = "json" | "yaml" | "xml";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: true,
  trimValues: true,
});
const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  indentBy: "  ",
});

/** Parse any supported format into a plain JS value. */
export function parseData(input: string, from: DataFormat): unknown {
  switch (from) {
    case "json":
      return parseJsonOrThrow(input);
    case "yaml":
      return yamlToJsonValue(input);
    case "xml": {
      const invalid = validateXml(input);
      if (invalid) throw new Error(invalid);
      return xmlParser.parse(input);
    }
  }
}

/**
 * Wrap a value so the XML builder always produces exactly ONE root element
 * (otherwise xml-formatter throws "Found multiple root nodes"). A single-key
 * object whose value is not an array is kept as-is so its key becomes the root.
 */
function xmlRootWrap(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) return { root: { item: value } };
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length === 1 && !Array.isArray((value as Record<string, unknown>)[keys[0]])) {
      return value as Record<string, unknown>;
    }
    return { root: value };
  }
  return { root: value };
}

/** Serialize a plain JS value into the requested format. */
export function serializeData(value: unknown, to: DataFormat): string {
  switch (to) {
    case "json":
      return JSON.stringify(value, null, 2);
    case "yaml":
      return jsonValueToYaml(value);
    case "xml": {
      const built = xmlBuilder.build(xmlRootWrap(value));
      return xmlFormat(String(built), {
        indentation: "  ",
        lineSeparator: "\n",
        collapseContent: true,
      });
    }
  }
}

export function convertData(
  input: string,
  from: DataFormat,
  to: DataFormat,
): string {
  if (!input.trim()) throw new Error("Entrada vazia.");
  if (from === to) return input;
  return serializeData(parseData(input, from), to);
}
