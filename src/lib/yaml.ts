import { parse, stringify, parseDocument } from "yaml";

/** Validate YAML; returns null when valid or the first error message otherwise. */
export function validateYaml(input: string): string | null {
  if (!input.trim()) return "Entrada vazia.";
  const doc = parseDocument(input);
  if (doc.errors.length > 0) {
    const e = doc.errors[0];
    return `${e.message}`;
  }
  return null;
}

/** Re-emit YAML in a normalized form. Throws on invalid input. */
export function formatYaml(input: string, indent = 2): string {
  const invalid = validateYaml(input);
  if (invalid) throw new Error(invalid);
  return stringify(parse(input), { indent });
}

export function yamlToJsonValue(input: string): unknown {
  const invalid = validateYaml(input);
  if (invalid) throw new Error(invalid);
  return parse(input);
}

export function jsonValueToYaml(value: unknown, indent = 2): string {
  return stringify(value, { indent });
}
