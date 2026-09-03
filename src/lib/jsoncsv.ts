/** Conversão JSON (array de objetos) ↔ CSV (RFC 4180). Puro. */

export interface CsvOptions {
  delimiter: string;
  header: boolean;
  quoteAll: boolean;
}

export const CSV_DEFAULTS: CsvOptions = { delimiter: ",", header: true, quoteAll: false };

function csvCell(value: unknown, o: CsvOptions): string {
  const s =
    value == null
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  const mustQuote =
    o.quoteAll || s.includes(o.delimiter) || s.includes('"') || /[\r\n]/.test(s);
  return mustQuote ? `"${s.replace(/"/g, '""')}"` : s;
}

export function jsonToCsv(json: string, options: Partial<CsvOptions> = {}): string {
  const o = { ...CSV_DEFAULTS, ...options };
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (err) {
    throw new Error(`JSON inválido: ${(err as Error).message}`);
  }
  const rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0) return "";

  const cols: string[] = [];
  for (const r of rows) {
    if (r && typeof r === "object" && !Array.isArray(r)) {
      for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
    }
  }
  if (cols.length === 0) throw new Error("Esperado um array de objetos.");

  const lines: string[] = [];
  if (o.header) lines.push(cols.map((c) => csvCell(c, o)).join(o.delimiter));
  for (const r of rows) {
    const obj = (r ?? {}) as Record<string, unknown>;
    lines.push(cols.map((c) => csvCell(obj[c], o)).join(o.delimiter));
  }
  return lines.join("\n");
}

/** Parser RFC 4180 (aspas, campos multilinha, delimitador configurável). */
export function parseCsv(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const src = text.replace(/\r\n?/g, "\n");

  while (i < src.length) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else if (ch === '"') {
      inQuotes = true;
      i++;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
      i++;
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
    } else {
      field += ch;
      i++;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function csvToJson(text: string, delimiter = ","): string {
  const rows = parseCsv(text.trim(), delimiter);
  if (rows.length === 0) return "[]";
  const [head, ...body] = rows;
  const out = body.map((r) => {
    const obj: Record<string, string> = {};
    head.forEach((h, idx) => {
      obj[h] = r[idx] ?? "";
    });
    return obj;
  });
  return JSON.stringify(out, null, 2);
}
