/** Escapar / desescapar strings em vários alvos. Puro. */

export type EscapeTarget =
  | "json"
  | "js"
  | "shell"
  | "sql"
  | "html"
  | "xml"
  | "url"
  | "regexp"
  | "c"
  | "csv"
  | "backslash";

export const ESCAPE_TARGETS: { id: EscapeTarget; label: string }[] = [
  { id: "json", label: "String JSON" },
  { id: "js", label: "String JS" },
  { id: "shell", label: "Shell (aspas simples POSIX)" },
  { id: "sql", label: "String SQL" },
  { id: "html", label: "HTML" },
  { id: "xml", label: "XML" },
  { id: "url", label: "URL (componente)" },
  { id: "regexp", label: "RegExp" },
  { id: "c", label: "C / Java" },
  { id: "csv", label: "Campo CSV" },
  { id: "backslash", label: "Backslash genérico" },
];

const HTML_ENC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const HTML_DEC: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
  nbsp: "\u00a0",
};

function cLikeEscape(s: string): string {
  return s.replace(/[\\"\n\r\t\f\v\u0000-\u001f]/g, (ch) => {
    switch (ch) {
      case "\\":
        return "\\\\";
      case '"':
        return '\\"';
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "\t":
        return "\\t";
      case "\f":
        return "\\f";
      case "\v":
        return "\\v";
      default:
        return "\\x" + ch.charCodeAt(0).toString(16).padStart(2, "0");
    }
  });
}
function cLikeUnescape(s: string): string {
  return s.replace(/\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|.)/g, (_, g: string) => {
    if (g[0] === "x") return String.fromCharCode(parseInt(g.slice(1), 16));
    if (g[0] === "u") return String.fromCharCode(parseInt(g.slice(1), 16));
    const map: Record<string, string> = {
      n: "\n",
      r: "\r",
      t: "\t",
      f: "\f",
      v: "\v",
      "0": "\0",
      "\\": "\\",
      '"': '"',
      "'": "'",
      "`": "`",
    };
    return map[g] ?? g;
  });
}

export function escapeString(input: string, target: EscapeTarget): string {
  switch (target) {
    case "json":
      return JSON.stringify(input).slice(1, -1);
    case "js":
    case "c":
      return cLikeEscape(input);
    case "backslash":
      return input.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\t/g, "\\t");
    case "shell":
      // aspas simples POSIX: fecha, escapa a aspa, reabre
      return "'" + input.replace(/'/g, "'\\''") + "'";
    case "sql":
      return input.replace(/'/g, "''");
    case "html":
    case "xml":
      return input.replace(/[&<>"']/g, (c) => HTML_ENC[c]);
    case "url":
      return encodeURIComponent(input);
    case "regexp":
      return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    case "csv":
      return /[",\n\r]/.test(input) ? `"${input.replace(/"/g, '""')}"` : input;
  }
}

export function unescapeString(input: string, target: EscapeTarget): string {
  switch (target) {
    case "json":
      try {
        return JSON.parse(`"${input.replace(/\r?\n/g, "\\n")}"`) as string;
      } catch {
        throw new Error("String JSON inválida para desescapar.");
      }
    case "js":
    case "c":
    case "backslash":
      return cLikeUnescape(input);
    case "shell":
      return input.replace(/^'/, "").replace(/'$/, "").replace(/'\\''/g, "'");
    case "sql":
      return input.replace(/''/g, "'");
    case "html":
    case "xml":
      return input
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/&([a-zA-Z#0-9]+);/g, (m, name: string) => HTML_DEC[name] ?? m);
    case "url":
      try {
        return decodeURIComponent(input);
      } catch {
        throw new Error("Sequência de URL inválida para decodificar.");
      }
    case "regexp":
      return input.replace(/\\([.*+?^${}()|[\]\\])/g, "$1");
    case "csv":
      return input.startsWith('"') && input.endsWith('"')
        ? input.slice(1, -1).replace(/""/g, '"')
        : input;
  }
}
