/** Heurística: dado um texto (ex.: da área de transferência), sugere ferramentas. */

import { onlyDigits } from "./br-docs";

export interface Suggestion {
  toolId: string;
  label: string;
  /** localStorage draft key to populate, when it differs from toolId */
  draftKey?: string;
}

const isProbablyJson = (s: string) => {
  const t = s.trim();
  if (!/^[[{]/.test(t)) return false;
  try {
    JSON.parse(t);
    return true;
  } catch {
    return false;
  }
};

export function detectContent(raw: string): Suggestion[] {
  const s = raw.trim();
  if (!s || s.length > 100_000) return [];
  const out: Suggestion[] = [];
  const add = (toolId: string, label: string, draftKey?: string) =>
    out.push({ toolId, label, draftKey });

  if (/^[\w-]+\.[\w-]+\.[\w-]+$/.test(s) && s.split(".").length === 3) {
    add("jwt-decoder", "Parece um JWT");
  }
  if (isProbablyJson(s)) add("json-formatter", "JSON válido");
  else if (/^\s*<\?xml|^\s*<[a-zA-Z][\w:-]*(\s|>)/.test(s)) add("xml-formatter", "Parece XML");

  if (/^\s*curl\s+/i.test(s) && /https?:\/\//i.test(s)) add("curl", "Comando cURL", "curl");
  if (/^https?:\/\/\S+$/i.test(s)) add("url-tool", "É uma URL");

  if (/^#?[0-9a-fA-F]{3,8}$/.test(s) && [3, 4, 6, 8].includes(s.replace("#", "").length)) {
    add("color", "Parece uma cor hex");
  }
  if (/^(rgb|hsl)a?\([^)]+\)$/i.test(s)) add("color", "Cor CSS");

  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s)) {
    add("uuid-tool", "É um UUID");
  }

  if (
    /^([\d*/,\-?LW#]+\s+){4,5}[\d*/,\-?LW#]+$/.test(s) &&
    /[*/]/.test(s) &&
    !/^\d{1,3}(\.\d{1,3}){3}/.test(s)
  ) {
    add("cron", "Parece uma expressão cron");
  }

  if (/^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(s)) add("cidr", "Endereço IPv4");

  if (/^-?\d{9,13}$/.test(s)) add("timestamp", "Pode ser um timestamp");

  const digits = onlyDigits(s);
  if ((digits.length === 11 || digits.length === 14) && /^[\d.\-/\s]+$/.test(s)) {
    add("br-docs", digits.length === 11 ? "Parece um CPF" : "Parece um CNPJ");
  }

  if (/^000201/.test(s) || /br\.gov\.bcb\.pix/i.test(s))
    add("pix", "PIX Copia e Cola", "pix-decode");

  if (/^[A-Za-z0-9+/]{16,}={0,2}$/.test(s) && s.length % 4 === 0 && !isProbablyJson(s)) {
    add("base64", "Pode ser Base64");
  }

  // dedupe by toolId, keep first label
  const seen = new Set<string>();
  return out.filter((x) => (seen.has(x.toolId) ? false : seen.add(x.toolId)));
}
