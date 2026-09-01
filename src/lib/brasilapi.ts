import { getJson, HttpError } from "./http";

const BRASIL_API = "https://brasilapi.com.br/api";

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export interface CepResult {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service?: string;
}

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/** Look up a CEP. Tries ViaCEP first, falls back to BrasilAPI. */
export async function lookupCep(cepRaw: string): Promise<CepResult> {
  const cep = onlyDigits(cepRaw);
  if (cep.length !== 8) throw new Error("CEP deve ter 8 dígitos.");

  try {
    const via = await getJson<ViaCepResponse>(
      `https://viacep.com.br/ws/${cep}/json/`,
    );
    if (via.erro) throw new Error("CEP não encontrado.");
    return {
      cep: via.cep,
      state: via.uf,
      city: via.localidade,
      neighborhood: via.bairro,
      street: via.logradouro,
      service: "viacep",
    };
  } catch (err) {
    if (err instanceof Error && err.message === "CEP não encontrado.") throw err;
    // network / 5xx / parse — try the fallback
    return getJson<CepResult>(`${BRASIL_API}/cep/v2/${cep}`).catch(() => {
      throw new Error(
        err instanceof HttpError
          ? `ViaCEP falhou (${err.status || "rede"}) e o fallback também.`
          : "Não foi possível consultar o CEP.",
      );
    });
  }
}

export interface CnpjResult {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  descricao_situacao_cadastral: string;
  data_inicio_atividade: string;
  cnae_fiscal_descricao: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  ddd_telefone_1: string;
  [key: string]: unknown;
}

export async function lookupCnpj(cnpjRaw: string): Promise<CnpjResult> {
  const cnpj = onlyDigits(cnpjRaw);
  if (cnpj.length !== 14) throw new Error("CNPJ deve ter 14 dígitos.");
  try {
    return await getJson<CnpjResult>(`${BRASIL_API}/cnpj/v1/${cnpj}`);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) {
      throw new Error("CNPJ não encontrado.");
    }
    throw err;
  }
}

export interface DddResult {
  state: string;
  cities: string[];
}

export async function lookupDdd(dddRaw: string): Promise<DddResult> {
  const ddd = onlyDigits(dddRaw);
  if (ddd.length !== 2) throw new Error("DDD deve ter 2 dígitos.");
  try {
    return await getJson<DddResult>(`${BRASIL_API}/ddd/v1/${ddd}`);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) {
      throw new Error("DDD não encontrado.");
    }
    throw err;
  }
}

export interface Bank {
  ispb: string;
  name: string | null;
  code: number | null;
  fullName: string | null;
}

export async function listBanks(): Promise<Bank[]> {
  return getJson<Bank[]>(`${BRASIL_API}/banks/v1`);
}

export interface Holiday {
  date: string;
  name: string;
  type: string;
}

export async function listHolidays(year: number): Promise<Holiday[]> {
  if (!Number.isInteger(year) || year < 1900 || year > 2199) {
    throw new Error("Informe um ano entre 1900 e 2199.");
  }
  try {
    return await getJson<Holiday[]>(`${BRASIL_API}/feriados/v1/${year}`);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) {
      throw new Error("Ano fora do intervalo suportado pela API.");
    }
    throw err;
  }
}
