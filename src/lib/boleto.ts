/** Decodifica linha digitável / código de barras de boletos. Puro, offline. */

const BANKS: Record<string, string> = {
  "001": "Banco do Brasil",
  "003": "Banco da Amazônia",
  "004": "Banco do Nordeste",
  "021": "Banestes",
  "033": "Santander",
  "036": "Banco Bradesco BBI",
  "037": "Banpará",
  "041": "Banrisul",
  "047": "Banese",
  "070": "BRB",
  "077": "Banco Inter",
  "084": "Uniprime Norte do Paraná",
  "104": "Caixa Econômica Federal",
  "197": "Stone",
  "208": "BTG Pactual",
  "212": "Banco Original",
  "218": "Banco BS2",
  "237": "Bradesco",
  "260": "Nu Pagamentos (Nubank)",
  "290": "PagSeguro",
  "336": "C6 Bank",
  "341": "Itaú Unibanco",
  "348": "Banco XP",
  "364": "Gerencianet (Efí)",
  "380": "PicPay",
  "422": "Banco Safra",
  "623": "Banco PAN",
  "633": "Banco Rendimento",
  "654": "Banco Digimais",
  "745": "Citibank",
  "748": "Sicredi",
  "756": "Sicoob",
};

export interface BoletoInfo {
  tipo: "cobranca" | "arrecadacao";
  banco?: string;
  bancoNome?: string;
  moeda?: string;
  valor: number | null;
  vencimento: string | null; // YYYY-MM-DD
  linhaDigitavel: string;
  codigoBarras: string;
  dvGeralOk: boolean;
}

const onlyDigits = (s: string) => s.replace(/\D/g, "");

function mod10(num: string): number {
  let sum = 0;
  let weight = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]) * weight;
    if (d > 9) d = Math.floor(d / 10) + (d % 10);
    sum += d;
    weight = weight === 2 ? 1 : 2;
  }
  const rest = sum % 10;
  return rest === 0 ? 0 : 10 - rest;
}

function mod11Barra(num: string): number {
  let sum = 0;
  let weight = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    sum += Number(num[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const rest = sum % 11;
  const dv = 11 - rest;
  return dv === 0 || dv === 10 || dv === 11 ? 1 : dv;
}

/** Fator de vencimento → data. Base 07/10/1997; reinício em 22/02/2025 (fator 1000). */
function fatorToDate(fator: number): string | null {
  if (fator <= 0) return null;
  const base = fator < 1000 ? Date.UTC(2025, 1, 22) : Date.UTC(1997, 9, 7);
  const ms = base + fator * 86400000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** Linha digitável de cobrança (47) → código de barras (44). */
function cobrancaLinhaToBarras(l: string): string {
  return (
    l.slice(0, 4) + l.slice(32, 33) + l.slice(33, 47) + l.slice(4, 9) + l.slice(10, 20) + l.slice(21, 31)
  );
}

export function parseBoleto(input: string): BoletoInfo {
  const raw = onlyDigits(input);
  let linha = "";
  let barras = "";
  let tipo: "cobranca" | "arrecadacao";

  if (raw.length === 47) {
    tipo = "cobranca";
    linha = raw;
    barras = cobrancaLinhaToBarras(raw);
  } else if (raw.length === 48) {
    tipo = "arrecadacao";
    linha = raw;
    barras =
      raw.slice(0, 11) + raw.slice(12, 23) + raw.slice(24, 35) + raw.slice(36, 47);
  } else if (raw.length === 44) {
    tipo = raw[0] === "8" ? "arrecadacao" : "cobranca";
    barras = raw;
  } else {
    throw new Error(
      `Esperado 47 (linha), 48 (arrecadação) ou 44 dígitos (código de barras); recebi ${raw.length}.`,
    );
  }

  if (tipo === "cobranca") {
    const banco = barras.slice(0, 3);
    const moeda = barras.slice(3, 4);
    const dvGeral = barras.slice(4, 5);
    const fator = Number(barras.slice(5, 9));
    const valor = Number(barras.slice(9, 19)) / 100;
    const check = mod11Barra(barras.slice(0, 4) + barras.slice(5));
    return {
      tipo,
      banco,
      bancoNome: BANKS[banco],
      moeda: moeda === "9" ? "Real (R$)" : moeda,
      valor: valor > 0 ? valor : null,
      vencimento: fatorToDate(fator),
      linhaDigitavel: linha,
      codigoBarras: barras,
      dvGeralOk: Number(dvGeral) === check,
    };
  }

  // arrecadação
  const valor = Number(barras.slice(4, 15)) / 100;
  return {
    tipo,
    valor: valor > 0 ? valor : null,
    vencimento: null,
    linhaDigitavel: linha,
    codigoBarras: barras,
    dvGeralOk: true,
  };
}

export { mod10, mod11Barra };
