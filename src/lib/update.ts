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

// ---------- auto-update (tauri-plugin-updater) ----------
// A detecção continua pela API do GitHub (fetchLatestRelease) — funciona no
// build web e traz as notas. As funções abaixo só entram no passo de INSTALAR:
// baixam o artefato assinado do release, conferem a assinatura e reiniciam.

/** Handle de update do plugin (não-nulo). Só existe dentro do Tauri. */
export type UpdateHandle = NonNullable<
  Awaited<ReturnType<typeof import("@tauri-apps/plugin-updater").check>>
>;

export interface UpdateProgress {
  /** bytes já baixados */
  downloaded: number;
  /** total em bytes, ou `null` quando o servidor não mandou Content-Length */
  total: number | null;
}

export type UpdateErrorKind = "not-appimage" | "network" | "signature" | "unknown";

/** Classifica o erro do updater numa categoria — puro, testado. */
export function updateErrorKind(err: unknown): UpdateErrorKind {
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
  if (msg.includes("appimage")) return "not-appimage";
  if (msg.includes("signature") || msg.includes("verify") || msg.includes("pubkey")) {
    return "signature";
  }
  if (
    msg.includes("network") ||
    msg.includes("connect") ||
    msg.includes("timed out") ||
    msg.includes("timeout") ||
    msg.includes("dns") ||
    msg.includes("sending request") ||
    msg.includes("error sending")
  ) {
    return "network";
  }
  return "unknown";
}

const UPDATE_ERROR_TEXT: Record<UpdateErrorKind, string> = {
  "not-appimage":
    "No Linux a atualização automática só funciona pelo AppImage. Baixe a nova versão na página do release.",
  network: "Não deu para baixar a atualização (sem conexão?). Tente de novo mais tarde.",
  signature: "A atualização baixada falhou na verificação de assinatura e foi descartada.",
  unknown: "Não foi possível instalar a atualização. Baixe manualmente na página do release.",
};

/** Mensagem amigável para um erro do updater. */
export function updateErrorMessage(err: unknown): string {
  return UPDATE_ERROR_TEXT[updateErrorKind(err)];
}

/** A plataforma troca o binário no lugar? Tauri e não-macOS (Gatekeeper). */
export async function canSelfUpdate(): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    const { platform } = await import("@tauri-apps/plugin-os");
    return platform() !== "macos";
  } catch {
    return true;
  }
}

/**
 * Consulta o endpoint de updates assinado. `null` fora do Tauri ou quando não há
 * versão nova / o `latest.json` ainda não foi publicado. Lança em erro real de
 * rede/assinatura — o chamador trata com `updateErrorMessage`.
 */
export async function checkForUpdate(): Promise<UpdateHandle | null> {
  if (!isTauri()) return null;
  const { check } = await import("@tauri-apps/plugin-updater");
  return await check();
}

/**
 * Baixa e instala o update, repassando o progresso. Não reinicia — chame
 * `relaunchApp()` quando o usuário confirmar. Lança em falha.
 */
export async function downloadAndInstallUpdate(
  handle: UpdateHandle,
  onProgress?: (p: UpdateProgress) => void,
): Promise<void> {
  let downloaded = 0;
  let total: number | null = null;
  await handle.downloadAndInstall((event) => {
    if (event.event === "Started") {
      total = event.data.contentLength ?? null;
      onProgress?.({ downloaded: 0, total });
    } else if (event.event === "Progress") {
      downloaded += event.data.chunkLength;
      onProgress?.({ downloaded, total });
    } else if (event.event === "Finished") {
      onProgress?.({ downloaded: total ?? downloaded, total });
    }
  });
}

/** Fecha e reabre o app (após um update instalado). */
export async function relaunchApp(): Promise<void> {
  const { relaunch } = await import("@tauri-apps/plugin-process");
  await relaunch();
}
