import cronstrue from "cronstrue";
import "cronstrue/locales/pt_BR";
import { CronExpressionParser } from "cron-parser";

export interface CronInfo {
  description: string;
  nextRuns: string[];
  fields: { label: string; value: string }[];
  error?: string;
}

const FIELD_LABELS_5 = ["Minuto", "Hora", "Dia do mês", "Mês", "Dia da semana"];
const FIELD_LABELS_6 = ["Segundo", ...FIELD_LABELS_5];

export function describeCron(expr: string, tz?: string): CronInfo {
  const trimmed = expr.trim();
  if (!trimmed) {
    return { description: "", nextRuns: [], fields: [] };
  }

  let description = "";
  try {
    description = cronstrue.toString(trimmed, { locale: "pt_BR", use24HourTimeFormat: true });
  } catch (err) {
    // cronstrue throws a plain string like "Error: Expression has only 3 parts."
    const msg = err instanceof Error ? err.message : String(err);
    return {
      description: "",
      nextRuns: [],
      fields: [],
      error: msg.replace(/^Error:\s*/, ""),
    };
  }

  const parts = trimmed.split(/\s+/);
  const labels = parts.length >= 6 ? FIELD_LABELS_6 : FIELD_LABELS_5;
  const fields = parts.slice(0, labels.length).map((value, i) => ({
    label: labels[i],
    value,
  }));

  let nextRuns: string[] = [];
  try {
    const it = CronExpressionParser.parse(trimmed, tz ? { tz } : undefined);
    nextRuns = Array.from({ length: 5 }, () =>
      it.next().toDate().toLocaleString("pt-BR", tz ? { timeZone: tz } : undefined),
    );
  } catch {
    // cronstrue understood it but cron-parser couldn't project runs (e.g. 6-field
    // second-precision on some inputs) — description alone is still useful.
  }

  return { description, nextRuns, fields };
}

export const CRON_PRESETS: { label: string; expr: string }[] = [
  { label: "Todo minuto", expr: "* * * * *" },
  { label: "A cada 5 min", expr: "*/5 * * * *" },
  { label: "De hora em hora", expr: "0 * * * *" },
  { label: "Todo dia às 3h", expr: "0 3 * * *" },
  { label: "Segunda a sexta às 9h", expr: "0 9 * * 1-5" },
  { label: "Todo dia 1º às 0h", expr: "0 0 1 * *" },
];
