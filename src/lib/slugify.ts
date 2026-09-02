/** Texto → slug de URL. Puro, sem dependências. */

export interface SlugOptions {
  separator?: string;
  lowercase?: boolean;
  stripDiacritics?: boolean;
  /** só letras, números e o separador; senão mantém `._~` também */
  strict?: boolean;
  maxLength?: number;
}

const DEFAULTS: Required<SlugOptions> = {
  separator: "-",
  lowercase: true,
  stripDiacritics: true,
  strict: true,
  maxLength: 0,
};

const reEscape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function slugify(input: string, options: SlugOptions = {}): string {
  const o = { ...DEFAULTS, ...options };
  let s = input.normalize("NFKD");
  if (o.stripDiacritics) s = s.replace(/[\u0300-\u036f]/g, "");
  if (o.lowercase) s = s.toLowerCase();

  // ß, æ, œ e cia. → aproximações comuns
  s = s
    .replace(/ß/g, "ss")
    .replace(/æ/gi, "ae")
    .replace(/œ/gi, "oe")
    .replace(/ø/gi, "o")
    .replace(/đ/gi, "d")
    .replace(/ł/gi, "l");

  const keep = o.strict ? "a-zA-Z0-9" : "a-zA-Z0-9._~";
  s = s.replace(new RegExp(`[^${keep}]+`, "g"), o.separator);

  // colapsa e apara separadores
  if (o.separator) {
    const sep = reEscape(o.separator);
    s = s.replace(new RegExp(`${sep}{2,}`, "g"), o.separator);
    s = s.replace(new RegExp(`^${sep}+|${sep}+$`, "g"), "");
  }

  if (o.maxLength > 0 && s.length > o.maxLength) {
    s = s.slice(0, o.maxLength);
    if (o.separator) s = s.replace(new RegExp(`${reEscape(o.separator)}+$`), "");
  }
  return s;
}

/** Aplica linha a linha, preservando a estrutura. */
export function slugifyLines(input: string, options: SlugOptions = {}): string {
  return input
    .split("\n")
    .map((l) => (l.trim() === "" ? l : slugify(l, options)))
    .join("\n");
}
