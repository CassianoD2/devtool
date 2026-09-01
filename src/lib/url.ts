export function encodeUrlComponent(text: string): string {
  return encodeURIComponent(text);
}

export function decodeUrlComponent(text: string): string {
  try {
    return decodeURIComponent(text.replace(/\+/g, " "));
  } catch {
    throw new Error("Sequência percent-encoding inválida.");
  }
}

export interface QueryParam {
  key: string;
  value: string;
}

/** Parse a URL or a bare query string into its parts. */
export function parseQuery(input: string): {
  base?: string;
  params: QueryParam[];
} {
  const trimmed = input.trim();
  let queryPart = trimmed;
  let base: string | undefined;

  const qIndex = trimmed.indexOf("?");
  if (qIndex >= 0) {
    base = trimmed.slice(0, qIndex);
    queryPart = trimmed.slice(qIndex + 1);
  } else if (/^https?:\/\//i.test(trimmed)) {
    base = trimmed;
    queryPart = "";
  }

  const hashIndex = queryPart.indexOf("#");
  if (hashIndex >= 0) queryPart = queryPart.slice(0, hashIndex);

  const params: QueryParam[] = [];
  if (queryPart) {
    for (const pair of queryPart.split("&")) {
      if (!pair) continue;
      const eq = pair.indexOf("=");
      const rawKey = eq >= 0 ? pair.slice(0, eq) : pair;
      const rawValue = eq >= 0 ? pair.slice(eq + 1) : "";
      params.push({
        key: safeDecode(rawKey),
        value: safeDecode(rawValue),
      });
    }
  }
  return { base, params };
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s;
  }
}
