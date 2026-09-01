import { diffLines, diffWords, type Change } from "diff";

export type DiffMode = "lines" | "words";

export interface DiffOptions {
  mode?: DiffMode;
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
}

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

export function computeDiff(
  a: string,
  b: string,
  opts: DiffOptions = {},
): { parts: Change[]; stats: DiffStats } {
  const mode = opts.mode ?? "lines";
  const common = { ignoreCase: opts.ignoreCase };
  const parts =
    mode === "words"
      ? diffWords(a, b, common)
      : diffLines(a, b, { ...common, ignoreWhitespace: opts.ignoreWhitespace });

  const stats: DiffStats = { added: 0, removed: 0, unchanged: 0 };
  for (const part of parts) {
    const units =
      mode === "lines"
        ? part.value.split("\n").filter((_, i, arr) => i < arr.length - 1 || arr[i] !== "").length
        : part.value.trim()
          ? part.value.trim().split(/\s+/).length
          : 0;
    if (part.added) stats.added += units;
    else if (part.removed) stats.removed += units;
    else stats.unchanged += units;
  }
  return { parts, stats };
}
