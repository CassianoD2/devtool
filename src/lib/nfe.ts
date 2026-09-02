/** Decodifica a chave de acesso de NF-e / NFC-e (44 dígitos). Puro, offline. */

const UF_BY_CODE: Record<string, string> = {
  "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
  "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL",
  "28": "SE", "29": "BA", "31": "MG", "32": "ES", "33": "RJ", "35": "SP", "41": "PR",
  "42": "SC", "43": "RS", "50": "MS", "51": "MT", "52": "GO", "53": "DF",
};

const MODELO: Record<string, string> = { "55": "NF-e", "65": "NFC-e" };
const TP_EMIS: Record<string, string> = {
  "1": "Normal",
  "2": "Contingência FS-IA",
  "3": "Contingência SCAN",
  "4": "Contingência DPEC",
  "5": "Contingência FS-DA",
  "6": "Contingência SVC-AN",
  "7": "Contingência SVC-RS",
  "9": "Contingência off-line NFC-e",
};

export interface NfeKey {
  raw: string;
  cUF: string;
  uf: string;
  aamm: string;
  emissao: string; // MM/AAAA
  cnpj: string;
  cnpjFormatted: string;
  modelo: string;
  modeloLabel: string;
  serie: string;
  numero: string;
  tpEmis: string;
  tpEmisLabel: string;
  cNF: string;
  cDV: string;
  dvOk: boolean;
}

/** DV por módulo 11 com pesos 2..9 cíclicos, da direita para a esquerda. */
export function mod11Dv(digits: string): number {
  let sum = 0;
  let weight = 2;
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += Number(digits[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const rest = sum % 11;
  return rest === 0 || rest === 1 ? 0 : 11 - rest;
}

export function parseNfeKey(input: string): NfeKey {
  const raw = input.replace(/^NFe/i, "").replace(/\D/g, "");
  if (raw.length !== 44) {
    throw new Error(`A chave deve ter 44 dígitos (recebi ${raw.length}).`);
  }
  const cUF = raw.slice(0, 2);
  const aamm = raw.slice(2, 6);
  const cnpj = raw.slice(6, 20);
  const modelo = raw.slice(20, 22);
  const serie = raw.slice(22, 25);
  const numero = raw.slice(25, 34);
  const tpEmis = raw.slice(34, 35);
  const cNF = raw.slice(35, 43);
  const cDV = raw.slice(43, 44);

  const mm = aamm.slice(2);
  return {
    raw,
    cUF,
    uf: UF_BY_CODE[cUF] ?? "?",
    aamm,
    emissao: `${mm}/20${aamm.slice(0, 2)}`,
    cnpj,
    cnpjFormatted: cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5"),
    modelo,
    modeloLabel: MODELO[modelo] ?? "?",
    serie: String(Number(serie)),
    numero: String(Number(numero)),
    tpEmis,
    tpEmisLabel: TP_EMIS[tpEmis] ?? "?",
    cNF,
    cDV,
    dvOk: mod11Dv(raw.slice(0, 43)) === Number(cDV),
  };
}
