/** Operações sobre listas de linhas. Tudo puro. */

export type LineOp =
  | "sort-asc"
  | "sort-desc"
  | "sort-natural"
  | "sort-length"
  | "dedupe"
  | "dedupe-last"
  | "reverse"
  | "shuffle"
  | "number"
  | "trim"
  | "remove-blank"
  | "filter-contains"
  | "filter-regex"
  | "prefix-suffix"
  | "join"
  | "split";

export const LINE_OPS: { id: LineOp; label: string; arg?: "text" | "regex" }[] = [
  { id: "sort-asc", label: "Ordenar A→Z" },
  { id: "sort-desc", label: "Ordenar Z→A" },
  { id: "sort-natural", label: "Ordenar natural (1,2,10)" },
  { id: "sort-length", label: "Ordenar por tamanho" },
  { id: "dedupe", label: "Remover duplicadas (1ª)" },
  { id: "dedupe-last", label: "Remover duplicadas (última)" },
  { id: "reverse", label: "Inverter ordem" },
  { id: "shuffle", label: "Embaralhar" },
  { id: "number", label: "Numerar" },
  { id: "trim", label: "Trim por linha" },
  { id: "remove-blank", label: "Remover linhas vazias" },
  { id: "filter-contains", label: "Manter linhas que contêm…", arg: "text" },
  { id: "filter-regex", label: "Manter linhas que casam regex…", arg: "regex" },
  { id: "prefix-suffix", label: "Prefixo/sufixo…", arg: "text" },
  { id: "join", label: "Juntar com delimitador…", arg: "text" },
  { id: "split", label: "Quebrar por delimitador…", arg: "text" },
];

export interface LineOptions {
  caseInsensitive?: boolean;
  invert?: boolean;
  /** para prefix-suffix: "pre|post"; para join/split: o delimitador; para filtros: o termo */
  arg?: string;
}

const naturalCompare = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function applyLineOp(input: string, op: LineOp, opts: LineOptions = {}): string {
  const nl = input.includes("\r\n") ? "\r\n" : "\n";
  let lines = input.split(/\r?\n/);
  const fold = (s: string) => (opts.caseInsensitive ? s.toLowerCase() : s);

  switch (op) {
    case "sort-asc":
      lines = [...lines].sort((a, b) => fold(a).localeCompare(fold(b)));
      break;
    case "sort-desc":
      lines = [...lines].sort((a, b) => fold(b).localeCompare(fold(a)));
      break;
    case "sort-natural":
      lines = [...lines].sort((a, b) => naturalCompare(fold(a), fold(b)));
      break;
    case "sort-length":
      lines = [...lines].sort((a, b) => a.length - b.length || a.localeCompare(b));
      break;
    case "dedupe": {
      const seen = new Set<string>();
      lines = lines.filter((l) => {
        const k = fold(l);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      break;
    }
    case "dedupe-last": {
      const lastIdx = new Map<string, number>();
      lines.forEach((l, i) => lastIdx.set(fold(l), i));
      lines = lines.filter((l, i) => lastIdx.get(fold(l)) === i);
      break;
    }
    case "reverse":
      lines = [...lines].reverse();
      break;
    case "shuffle": {
      const rnd = mulberry32(lines.join("\n").length + lines.length);
      lines = [...lines];
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
      }
      break;
    }
    case "number": {
      const width = String(lines.length).length;
      lines = lines.map((l, i) => `${String(i + 1).padStart(width, " ")}. ${l}`);
      break;
    }
    case "trim":
      lines = lines.map((l) => l.trim());
      break;
    case "remove-blank":
      lines = lines.filter((l) => l.trim() !== "");
      break;
    case "filter-contains": {
      const term = fold(opts.arg ?? "");
      lines = lines.filter((l) => {
        const hit = term !== "" && fold(l).includes(term);
        return opts.invert ? !hit : hit;
      });
      break;
    }
    case "filter-regex": {
      let re: RegExp;
      try {
        re = new RegExp(opts.arg ?? "", opts.caseInsensitive ? "i" : "");
      } catch (err) {
        throw new Error(`Regex inválida: ${(err as Error).message}`);
      }
      lines = lines.filter((l) => (opts.invert ? !re.test(l) : re.test(l)));
      break;
    }
    case "prefix-suffix": {
      const [pre = "", post = ""] = (opts.arg ?? "").split("|");
      lines = lines.map((l) => `${pre}${l}${post}`);
      break;
    }
    case "join":
      return lines.join(opts.arg ?? ", ");
    case "split": {
      const delim = opts.arg ?? ",";
      return lines.flatMap((l) => l.split(delim).map((s) => s.trim())).join(nl);
    }
  }
  return lines.join(nl);
}
