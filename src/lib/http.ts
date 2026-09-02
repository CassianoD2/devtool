import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Abre uma URL no navegador do sistema (ou nova aba fora do Tauri). */
export async function openExternal(url: string): Promise<void> {
  try {
    if (isTauri()) {
      const m = await import("@tauri-apps/plugin-opener");
      await m.openUrl(url);
    } else {
      window.open(url, "_blank");
    }
  } catch {
    /* ignore */
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * GET a JSON document. Uses Tauri's HTTP plugin inside the app (no CORS limits);
 * falls back to the browser's fetch when running the bare Vite dev server.
 */
export async function getJson<T>(url: string): Promise<T> {
  const doFetch = isTauri() ? tauriFetch : window.fetch.bind(window);
  let res: Response;
  try {
    res = await doFetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    throw new HttpError(0, `Falha de rede: ${(err as Error).message}`);
  }
  if (!res.ok) {
    throw new HttpError(res.status, `HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}
