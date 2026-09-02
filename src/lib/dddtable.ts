/** Tabela de DDDs do Brasil → UF e região. Puro, offline. */

export interface DddInfo {
  ddd: string;
  uf: string;
  regiao: string;
  /** cidades/áreas de referência do DDD */
  ref: string;
}

const UF_REGIAO: Record<string, string> = {
  AC: "Norte", AL: "Nordeste", AP: "Norte", AM: "Norte", BA: "Nordeste",
  CE: "Nordeste", DF: "Centro-Oeste", ES: "Sudeste", GO: "Centro-Oeste",
  MA: "Nordeste", MT: "Centro-Oeste", MS: "Centro-Oeste", MG: "Sudeste",
  PA: "Norte", PB: "Nordeste", PR: "Sul", PE: "Nordeste", PI: "Nordeste",
  RJ: "Sudeste", RN: "Nordeste", RS: "Sul", RO: "Norte", RR: "Norte",
  SC: "Sul", SP: "Sudeste", SE: "Nordeste", TO: "Norte",
};

const RAW: Record<string, [string, string]> = {
  "11": ["SP", "São Paulo (capital e região metropolitana)"],
  "12": ["SP", "Vale do Paraíba (São José dos Campos)"],
  "13": ["SP", "Baixada Santista (Santos)"],
  "14": ["SP", "Bauru, Marília"],
  "15": ["SP", "Sorocaba"],
  "16": ["SP", "Ribeirão Preto"],
  "17": ["SP", "São José do Rio Preto"],
  "18": ["SP", "Presidente Prudente"],
  "19": ["SP", "Campinas"],
  "21": ["RJ", "Rio de Janeiro (capital e RM)"],
  "22": ["RJ", "Campos dos Goytacazes"],
  "24": ["RJ", "Volta Redonda, Petrópolis"],
  "27": ["ES", "Vitória"],
  "28": ["ES", "Cachoeiro de Itapemirim"],
  "31": ["MG", "Belo Horizonte"],
  "32": ["MG", "Juiz de Fora"],
  "33": ["MG", "Governador Valadares"],
  "34": ["MG", "Uberlândia"],
  "35": ["MG", "Poços de Caldas, Varginha"],
  "37": ["MG", "Divinópolis"],
  "38": ["MG", "Montes Claros"],
  "41": ["PR", "Curitiba"],
  "42": ["PR", "Ponta Grossa"],
  "43": ["PR", "Londrina"],
  "44": ["PR", "Maringá"],
  "45": ["PR", "Foz do Iguaçu, Cascavel"],
  "46": ["PR", "Francisco Beltrão"],
  "47": ["SC", "Joinville, Blumenau"],
  "48": ["SC", "Florianópolis"],
  "49": ["SC", "Chapecó"],
  "51": ["RS", "Porto Alegre"],
  "53": ["RS", "Pelotas"],
  "54": ["RS", "Caxias do Sul"],
  "55": ["RS", "Santa Maria"],
  "61": ["DF", "Brasília e entorno"],
  "62": ["GO", "Goiânia"],
  "63": ["TO", "Palmas"],
  "64": ["GO", "Rio Verde"],
  "65": ["MT", "Cuiabá"],
  "66": ["MT", "Rondonópolis"],
  "67": ["MS", "Campo Grande"],
  "68": ["AC", "Rio Branco"],
  "69": ["RO", "Porto Velho"],
  "71": ["BA", "Salvador"],
  "73": ["BA", "Ilhéus, Itabuna"],
  "74": ["BA", "Juazeiro"],
  "75": ["BA", "Feira de Santana"],
  "77": ["BA", "Barreiras, Vitória da Conquista"],
  "79": ["SE", "Aracaju"],
  "81": ["PE", "Recife"],
  "82": ["AL", "Maceió"],
  "83": ["PB", "João Pessoa"],
  "84": ["RN", "Natal"],
  "85": ["CE", "Fortaleza"],
  "86": ["PI", "Teresina"],
  "87": ["PE", "Petrolina"],
  "88": ["CE", "Juazeiro do Norte"],
  "89": ["PI", "Picos"],
  "91": ["PA", "Belém"],
  "92": ["AM", "Manaus"],
  "93": ["PA", "Santarém"],
  "94": ["PA", "Marabá"],
  "95": ["RR", "Boa Vista"],
  "96": ["AP", "Macapá"],
  "97": ["AM", "Coari, Tefé"],
  "98": ["MA", "São Luís"],
  "99": ["MA", "Imperatriz"],
};

export const ALL_DDDS: DddInfo[] = Object.entries(RAW)
  .map(([ddd, [uf, ref]]) => ({ ddd, uf, ref, regiao: UF_REGIAO[uf] }))
  .sort((a, b) => a.ddd.localeCompare(b.ddd));

export function lookupDdd(input: string): DddInfo | null {
  const ddd = input.replace(/\D/g, "").slice(0, 2);
  const hit = RAW[ddd];
  return hit ? { ddd, uf: hit[0], ref: hit[1], regiao: UF_REGIAO[hit[0]] } : null;
}

export function dddsForUf(uf: string): DddInfo[] {
  const u = uf.trim().toUpperCase();
  return ALL_DDDS.filter((d) => d.uf === u);
}
