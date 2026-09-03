/** TOML ↔ JSON — wrapper fino sobre `smol-toml`. */

import { parse as tomlParse, stringify as tomlStringify } from "smol-toml";

export function tomlToJson(input: string): string {
  let data: unknown;
  try {
    data = tomlParse(input);
  } catch (err) {
    throw new Error(`TOML inválido: ${(err as Error).message}`);
  }
  return JSON.stringify(data, null, 2);
}

export function jsonToToml(input: string): string {
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (err) {
    throw new Error(`JSON inválido: ${(err as Error).message}`);
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("O topo do TOML precisa ser um objeto (tabela).");
  }
  try {
    return tomlStringify(data as Record<string, unknown>);
  } catch (err) {
    throw new Error(`Não foi possível gerar TOML: ${(err as Error).message}`);
  }
}

/** Normaliza (parse + stringify) para validar/arrumar TOML. */
export function formatToml(input: string): string {
  let data: unknown;
  try {
    data = tomlParse(input);
  } catch (err) {
    throw new Error(`TOML inválido: ${(err as Error).message}`);
  }
  return tomlStringify(data as Record<string, unknown>);
}
