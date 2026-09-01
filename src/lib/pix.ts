/** PIX "Copia e Cola" (BR Code / EMV MPM) — gerar e decodificar. Tudo offline. */

// ---------- CRC16-CCITT (0x1021, init 0xFFFF) ----------

export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// ---------- TLV ----------

function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, "0") + value;
}

export interface PixParams {
  key: string;
  merchantName: string;
  merchantCity: string;
  amount?: number | string;
  txid?: string;
  description?: string;
}

const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "");

export function buildPixCode(p: PixParams): string {
  const key = p.key.trim();
  if (!key) throw new Error("Informe a chave PIX.");
  const name = stripAccents(p.merchantName.trim() || "N").slice(0, 25).toUpperCase();
  const city = stripAccents(p.merchantCity.trim() || "BRASIL").slice(0, 15).toUpperCase();

  const gui = tlv("00", "br.gov.bcb.pix");
  const merchantAccount =
    gui +
    tlv("01", key) +
    (p.description ? tlv("02", stripAccents(p.description).slice(0, 40)) : "");

  const amountStr =
    p.amount != null && String(p.amount).trim() !== ""
      ? Number(p.amount).toFixed(2)
      : "";
  if (amountStr && !(Number(amountStr) > 0)) throw new Error("Valor inválido.");

  const txid = (p.txid?.trim() || "***").slice(0, 25);

  let payload =
    tlv("00", "01") +
    tlv("26", merchantAccount) +
    tlv("52", "0000") +
    tlv("53", "986") +
    (amountStr ? tlv("54", amountStr) : "") +
    tlv("58", "BR") +
    tlv("59", name) +
    tlv("60", city) +
    tlv("62", tlv("05", txid));

  payload += "6304";
  return payload + crc16(payload);
}

// ---------- decode ----------

export interface PixField {
  id: string;
  name: string;
  value: string;
  children?: PixField[];
}

const NAMES: Record<string, string> = {
  "00": "Payload Format Indicator",
  "01": "Point of Initiation Method",
  "26": "Merchant Account Information (PIX)",
  "52": "Merchant Category Code",
  "53": "Transaction Currency",
  "54": "Transaction Amount",
  "58": "Country Code",
  "59": "Merchant Name",
  "60": "Merchant City",
  "62": "Additional Data Field Template",
  "63": "CRC16",
};
const SUB_NAMES: Record<string, string> = {
  "00": "GUI",
  "01": "Chave PIX",
  "02": "Descrição",
  "05": "Reference Label (txid)",
};

function parseTlv(input: string, names: Record<string, string>): PixField[] {
  const fields: PixField[] = [];
  let i = 0;
  while (i + 4 <= input.length) {
    const id = input.slice(i, i + 2);
    const len = Number(input.slice(i + 2, i + 4));
    if (Number.isNaN(len)) throw new Error(`Comprimento inválido no campo ${id}.`);
    const value = input.slice(i + 4, i + 4 + len);
    if (value.length !== len) throw new Error(`Campo ${id} truncado.`);
    const field: PixField = { id, name: names[id] ?? `Campo ${id}`, value };
    if (id === "26" || id === "62") field.children = parseTlv(value, SUB_NAMES);
    fields.push(field);
    i += 4 + len;
  }
  return fields;
}

export interface PixDecoded {
  fields: PixField[];
  crcValid: boolean;
  crcExpected: string;
  crcFound: string;
}

export function parsePixCode(code: string): PixDecoded {
  // trim outer whitespace and drop line breaks a paste may carry, but keep
  // spaces that legitimately appear inside fields like Merchant Name / City.
  const input = code.trim().replace(/[\r\n\t]+/g, "");
  if (input.length < 8) throw new Error("Código muito curto.");
  const fields = parseTlv(input, NAMES);

  const crcFound = input.slice(-4).toUpperCase();
  const crcExpected = crc16(input.slice(0, -4));
  return {
    fields,
    crcFound,
    crcExpected,
    crcValid: crcFound === crcExpected,
  };
}
