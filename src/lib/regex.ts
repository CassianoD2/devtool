export interface RegexMatch {
  index: number;
  match: string;
  groups: string[];
  namedGroups: Record<string, string>;
}

export interface RegexResult {
  matches: RegexMatch[];
  error?: string;
}

export const REGEX_PRESETS: { label: string; pattern: string; flags: string }[] = [
  { label: "E-mail", pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.-]+", flags: "g" },
  { label: "URL", pattern: "https?://[^\\s]+", flags: "g" },
  { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g" },
  { label: "Data ISO", pattern: "(\\d{4})-(\\d{2})-(\\d{2})", flags: "g" },
  { label: "CEP", pattern: "\\d{5}-?\\d{3}", flags: "g" },
  { label: "UUID", pattern: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", flags: "gi" },
];

export function runRegex(pattern: string, flags: string, text: string): RegexResult {
  if (!pattern) return { matches: [] };
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
  } catch (err) {
    return { matches: [], error: (err as Error).message };
  }

  const matches: RegexMatch[] = [];
  let m: RegExpExecArray | null;
  let guard = 0;
  while ((m = re.exec(text)) !== null) {
    matches.push({
      index: m.index,
      match: m[0],
      groups: m.slice(1).map((g) => g ?? ""),
      namedGroups: { ...(m.groups ?? {}) } as Record<string, string>,
    });
    if (m[0] === "") re.lastIndex++;
    if (++guard > 100000) break;
  }
  return { matches };
}
