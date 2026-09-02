/** Parse / serialização de arquivos .env. Puro. */

export type DotenvFormat = "json" | "shell" | "compose" | "env";

export const DOTENV_FORMATS: { id: DotenvFormat; label: string }[] = [
  { id: "json", label: "JSON" },
  { id: "shell", label: "export FOO=bar" },
  { id: "compose", label: "environment: (compose)" },
  { id: "env", label: ".env (normaliza)" },
];

/** Lê um arquivo .env → objeto. Suporta `export `, aspas, `#`, `\n` em aspas duplas. */
export function parseEnv(input: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = input.split(/\r?\n/);
  for (let raw of lines) {
    raw = raw.trim();
    if (raw === "" || raw.startsWith("#")) continue;
    raw = raw.replace(/^export\s+/, "");
    const eq = raw.indexOf("=");
    if (eq === -1) continue;
    const key = raw.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(key)) continue;
    let val = raw.slice(eq + 1).trim();

    if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
      val = val
        .slice(1, -1)
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    } else if (val.startsWith("'") && val.endsWith("'") && val.length >= 2) {
      val = val.slice(1, -1);
    } else {
      // remove comentário inline não-citado
      const hash = val.indexOf(" #");
      if (hash !== -1) val = val.slice(0, hash).trim();
    }
    out[key] = val;
  }
  return out;
}

const needsDoubleQuotes = (v: string) => /[\n\r\t"'#\s]/.test(v) || v === "";
function envQuote(v: string): string {
  if (!needsDoubleQuotes(v)) return v;
  return `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`;
}

export function toFormat(env: Record<string, string>, format: DotenvFormat): string {
  const entries = Object.entries(env);
  switch (format) {
    case "json":
      return JSON.stringify(env, null, 2);
    case "shell":
      return entries.map(([k, v]) => `export ${k}=${envQuote(v)}`).join("\n");
    case "compose":
      return ["environment:", ...entries.map(([k, v]) => `  - ${k}=${v}`)].join("\n");
    case "env":
      return entries.map(([k, v]) => `${k}=${envQuote(v)}`).join("\n");
  }
}

/** JSON (objeto plano) → .env */
export function jsonToEnv(json: string): string {
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch (err) {
    throw new Error(`JSON inválido: ${(err as Error).message}`);
  }
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("Esperado um objeto JSON plano ({ CHAVE: valor }).");
  }
  return Object.entries(obj as Record<string, unknown>)
    .map(([k, v]) => `${k}=${envQuote(v == null ? "" : String(v))}`)
    .join("\n");
}
