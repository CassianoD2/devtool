import { formatInTimeZone } from "date-fns-tz";
import { formatDistanceToNow } from "date-fns";

export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Accepts seconds or milliseconds since epoch and auto-detects which. */
export function parseEpoch(input: string): Date {
  const trimmed = input.trim();
  if (!/^-?\d+$/.test(trimmed)) throw new Error("Informe um número inteiro (epoch).");
  const n = Number(trimmed);
  // 10 digits or fewer -> treat as seconds
  const ms = Math.abs(n) < 1e11 ? n * 1000 : n;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) throw new Error("Epoch fora de faixa.");
  return d;
}

export function parseDateString(input: string): Date {
  const d = new Date(input.trim());
  if (Number.isNaN(d.getTime())) {
    throw new Error("Data não reconhecida. Ex.: 2026-08-31T12:00:00Z");
  }
  return d;
}

export interface EpochBreakdown {
  epochSeconds: number;
  epochMillis: number;
  iso: string;
  utc: string;
  inZone: string;
  relative: string;
}

export function describeInstant(d: Date, timeZone: string): EpochBreakdown {
  return {
    epochSeconds: Math.floor(d.getTime() / 1000),
    epochMillis: d.getTime(),
    iso: d.toISOString(),
    utc: formatInTimeZone(d, "UTC", "yyyy-MM-dd HH:mm:ss 'UTC'"),
    inZone: formatInTimeZone(d, timeZone, "yyyy-MM-dd HH:mm:ss XXX '('zzz')'"),
    relative: formatDistanceToNow(d, { addSuffix: true }),
  };
}
