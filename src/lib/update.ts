/** Verificação de atualizações via GitHub Releases. Sem auto-instalação:
 *  só compara a versão e aponta para a página do Release. */

import { getJson, isTauri } from "./http";

export const REPO = "CassianoD2/devtool";
export const LATEST_RELEASE_API = `https://api.github.com/repos/${REPO}/releases/latest`;
export const RELEASES_PAGE = `https://github.com/${REPO}/releases/latest`;

export interface ReleaseInfo {
  /** sem o "v", ex.: "1.3.0" */
  version: string;
  /** tag original, ex.: "v1.3.0" */
  tag: string;
  /** html_url da release */
  url: string;
  /** corpo em markdown; pode ser "" */
  notes: string;
  /** ISO 8601; pode ser "" */
  publishedAt: string;
}

const stripV = (s: string) => s.trim().replace(/^v/i, "");

function parts(v: string): { nums: number[]; pre: string } {
  const [core, ...rest] = stripV(v).split("-");
  const nums = core.split(".").map((n) => Number.parseInt(n, 10) || 0);
  while (nums.length < 3) nums.push(0);
  return { nums: nums.slice(0, 3), pre: rest.join("-") };
}

/** -1 se a < b, 0 se iguais, 1 se a > b. Numérico por segmento (x.y.z);
 *  um sufixo de pré-lançamento ("-rc.1") perde do release final. */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const pa = parts(a);
  const pb = parts(b);
  for (let i = 0; i < 3; i++) {
    if (pa.nums[i] !== pb.nums[i]) return pa.nums[i] < pb.nums[i] ? -1 : 1;
  }
  if (pa.pre === pb.pre) return 0;
  if (!pa.pre) return 1; // a é final, b é pré
  if (!pb.pre) return -1;
  return pa.pre < pb.pre ? -1 : 1;
}

/** `candidate` é uma versão mais nova que `current`? */
export function isNewer(candidate: string, current: string): boolean {
  return compareSemver(candidate, current) > 0;
}

interface GithubRelease {
  tag_name?: string;
  name?: string;
  html_url?: string;
  body?: string | null;
  published_at?: string | null;
}

/** Normaliza a resposta de `releases/latest` da API do GitHub. */
export function parseRelease(json: unknown): ReleaseInfo {
  const r = (json ?? {}) as GithubRelease;
  const tag = (r.tag_name || r.name || "").trim();
  if (!tag) throw new Error("Resposta do GitHub sem tag de versão.");
  return {
    version: stripV(tag),
    tag,
    url: r.html_url || RELEASES_PAGE,
    notes: (r.body || "").trim(),
    publishedAt: r.published_at || "",
  };
}

export async function fetchLatestRelease(): Promise<ReleaseInfo> {
  return parseRelease(await getJson<unknown>(LATEST_RELEASE_API));
}

/** Versão do app em runtime (Tauri). `null` fora do Tauri ou em erro. */
export async function getAppVersion(): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    const m = await import("@tauri-apps/api/app");
    return await m.getVersion();
  } catch {
    return null;
  }
}
