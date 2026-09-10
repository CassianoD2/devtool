/** Tokens visuais compartilhados pelo workspace do API Client e pela ferramenta cURL. */

export const inputCls =
  "rounded-md border border-line-strong bg-surface-2 px-2 py-1.5 text-sm";

export const METHOD_TONE: Record<string, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-blue-600 dark:text-blue-400",
  PUT: "text-amber-600 dark:text-amber-400",
  PATCH: "text-amber-600 dark:text-amber-400",
  DELETE: "text-red-600 dark:text-red-400",
  HEAD: "text-muted",
  OPTIONS: "text-muted",
};

export function statusTone(s: number): string {
  if (s >= 500) return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
  if (s >= 400) return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  if (s >= 300) return "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300";
  if (s >= 200) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  return "bg-surface-2 text-ink";
}

export function relativeTime(at: number): string {
  const diff = Date.now() - at;
  const s = Math.round(diff / 1000);
  if (s < 60) return "agora";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return `${d} d`;
}
