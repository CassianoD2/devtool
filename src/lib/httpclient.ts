import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { isTauri } from "./http";
import type { ParsedRequest } from "./curl";

export interface HttpResult {
  status: number;
  statusText: string;
  ok: boolean;
  headers: [string, string][];
  body: string;
  contentType: string;
  timeMs: number;
  size: number;
}

/** Dispara a requisição analisada. Usa o plugin HTTP do Tauri (sem CORS). */
export async function sendRequest(req: ParsedRequest): Promise<HttpResult> {
  const doFetch = isTauri() ? tauriFetch : window.fetch.bind(window);

  const headers = new Headers();
  for (const [k, v] of req.headers) headers.append(k, v);
  if (req.auth) {
    headers.set("Authorization", `Basic ${btoa(`${req.auth.user}:${req.auth.pass}`)}`);
  }

  const init: RequestInit = { method: req.method, headers };
  if (req.body && !["GET", "HEAD"].includes(req.method)) init.body = req.body;
  if (isTauri()) {
    // @ts-expect-error tauri-specific option
    init.maxRedirections = req.followRedirects ? 10 : 0;
    // @ts-expect-error tauri-specific option
    init.danger = req.insecure ? { acceptInvalidCerts: true, acceptInvalidHostnames: true } : undefined;
  }

  const started = performance.now();
  const res = await doFetch(req.url, init);
  const body = await res.text();
  const timeMs = Math.round(performance.now() - started);

  const resHeaders: [string, string][] = [];
  res.headers.forEach((value, key) => resHeaders.push([key, value]));

  return {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
    headers: resHeaders,
    body,
    contentType: res.headers.get("content-type") ?? "",
    timeMs,
    size: new Blob([body]).size,
  };
}

export function prettyIfJson(body: string, contentType: string): { text: string; lang: "json" | "xml" | "text" } {
  const ct = contentType.toLowerCase();
  if (ct.includes("json") || /^\s*[[{]/.test(body)) {
    try {
      return { text: JSON.stringify(JSON.parse(body), null, 2), lang: "json" };
    } catch {
      /* deixa como está */
    }
  }
  if (ct.includes("xml") || /^\s*<\?xml|^\s*<[a-zA-Z]/.test(body)) {
    return { text: body, lang: "xml" };
  }
  return { text: body, lang: "text" };
}
