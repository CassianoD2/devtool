/** Analisa um comando `curl` e converte para outros formatos. Tudo offline. */

export interface ParsedRequest {
  method: string;
  url: string;
  headers: [string, string][];
  body?: string;
  auth?: { user: string; pass: string };
  insecure: boolean;
  followRedirects: boolean;
  warnings: string[];
}

/** Tokeniza respeitando aspas simples/duplas e continuação de linha com "\". */
export function tokenizeCommand(input: string): string[] {
  const s = input.replace(/\\\r?\n/g, " ").trim();
  const tokens: string[] = [];
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    let tok = "";
    while (i < s.length && !/\s/.test(s[i])) {
      const c = s[i];
      if (c === "'") {
        const end = s.indexOf("'", i + 1);
        if (end === -1) {
          tok += s.slice(i + 1);
          i = s.length;
        } else {
          tok += s.slice(i + 1, end);
          i = end + 1;
        }
      } else if (c === '"') {
        i++;
        while (i < s.length && s[i] !== '"') {
          if (s[i] === "\\" && i + 1 < s.length && '"\\$`'.includes(s[i + 1])) {
            tok += s[i + 1];
            i += 2;
          } else {
            tok += s[i];
            i++;
          }
        }
        i++; // closing quote
      } else if (c === "\\" && i + 1 < s.length) {
        tok += s[i + 1];
        i += 2;
      } else {
        tok += c;
        i++;
      }
    }
    tokens.push(tok);
  }
  return tokens;
}

const DATA_FLAGS = new Set([
  "-d",
  "--data",
  "--data-raw",
  "--data-ascii",
  "--data-binary",
]);

export function parseCurl(command: string): ParsedRequest {
  let tokens = tokenizeCommand(command);
  if (tokens[0] === "curl") tokens = tokens.slice(1);
  if (tokens.length === 0) throw new Error("Comando curl vazio.");

  const req: ParsedRequest = {
    method: "",
    url: "",
    headers: [],
    insecure: false,
    followRedirects: false,
    warnings: [],
  };
  const dataParts: string[] = [];
  let isForm = false;
  let getWithData = false;
  let explicitMethod = "";

  const next = (i: number, flag: string) => {
    if (i + 1 >= tokens.length) throw new Error(`Faltou o valor de ${flag}.`);
    return tokens[i + 1];
  };

  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i];

    // --flag=value
    let inlineValue: string | undefined;
    if (t.startsWith("--") && t.includes("=")) {
      const eq = t.indexOf("=");
      inlineValue = t.slice(eq + 1);
      t = t.slice(0, eq);
    }
    const val = (flag: string) => {
      if (inlineValue !== undefined) return inlineValue;
      const v = next(i, flag);
      i++;
      return v;
    };

    if (t === "-X" || t === "--request") {
      explicitMethod = val(t).toUpperCase();
    } else if (t === "-H" || t === "--header") {
      const h = val(t);
      const idx = h.indexOf(":");
      if (idx > 0) req.headers.push([h.slice(0, idx).trim(), h.slice(idx + 1).trim()]);
    } else if (DATA_FLAGS.has(t)) {
      dataParts.push(val(t));
    } else if (t === "--data-urlencode") {
      const raw = val(t);
      const eq = raw.indexOf("=");
      dataParts.push(
        eq >= 0
          ? `${raw.slice(0, eq)}=${encodeURIComponent(raw.slice(eq + 1))}`
          : encodeURIComponent(raw),
      );
    } else if (t === "-F" || t === "--form") {
      isForm = true;
      dataParts.push(val(t));
    } else if (t === "-G" || t === "--get") {
      getWithData = true;
    } else if (t === "-u" || t === "--user") {
      const raw = val(t);
      const idx = raw.indexOf(":");
      req.auth = {
        user: idx >= 0 ? raw.slice(0, idx) : raw,
        pass: idx >= 0 ? raw.slice(idx + 1) : "",
      };
    } else if (t === "-A" || t === "--user-agent") {
      req.headers.push(["User-Agent", val(t)]);
    } else if (t === "-e" || t === "--referer") {
      req.headers.push(["Referer", val(t)]);
    } else if (t === "-b" || t === "--cookie") {
      req.headers.push(["Cookie", val(t)]);
    } else if (t === "-k" || t === "--insecure") {
      req.insecure = true;
    } else if (t === "-L" || t === "--location") {
      req.followRedirects = true;
    } else if (t === "-I" || t === "--head") {
      explicitMethod = explicitMethod || "HEAD";
    } else if (t === "--url") {
      req.url = val(t);
    } else if (t === "--compressed") {
      // sem efeito prático aqui
    } else if (t === "-s" || t === "--silent" || t === "-S" || t === "--show-error" || t === "-v" || t === "--verbose" || t === "-i" || t === "--include" || t === "-#" || t === "--progress-bar" || t === "-f" || t === "--fail") {
      // flags de saída/verbosidade — ignoradas
    } else if (t === "-o" || t === "--output" || t === "-w" || t === "--write-out" || t === "--retry" || t === "--connect-timeout" || t === "-m" || t === "--max-time") {
      val(t); // consome o argumento
      req.warnings.push(`Flag ${t} ignorada.`);
    } else if (t === "-x" || t === "--proxy") {
      val(t);
      req.warnings.push("Proxy (-x) não é aplicado ao disparar aqui.");
    } else if (t.startsWith("-") && t !== "-") {
      req.warnings.push(`Flag desconhecida ignorada: ${t}`);
    } else if (!req.url) {
      req.url = t;
    } else {
      req.warnings.push(`Argumento extra ignorado: ${t}`);
    }
  }

  if (!req.url) throw new Error("Nenhuma URL encontrada no comando.");

  if (dataParts.length > 0 && !isForm) {
    const joined = dataParts.join("&");
    if (getWithData) {
      req.url += (req.url.includes("?") ? "&" : "?") + joined;
    } else {
      req.body = joined;
      if (!req.headers.some(([k]) => k.toLowerCase() === "content-type")) {
        req.headers.push(["Content-Type", "application/x-www-form-urlencoded"]);
      }
    }
  } else if (isForm) {
    req.body = dataParts.join("\n");
    req.warnings.push("Corpo multipart (-F) é mostrado como texto; o envio real usa form-data.");
  }

  req.method =
    explicitMethod || (req.body && !getWithData ? "POST" : "GET");
  return req;
}

// ---------- exportadores ----------

function headerLines(req: ParsedRequest): [string, string][] {
  const h = [...req.headers];
  if (req.auth) {
    h.push(["Authorization", `Basic ${btoa(`${req.auth.user}:${req.auth.pass}`)}`]);
  }
  return h;
}

export function toCurl(req: ParsedRequest): string {
  const parts = [`curl -X ${req.method} '${req.url}'`];
  for (const [k, v] of req.headers) parts.push(`  -H '${k}: ${v}'`);
  if (req.auth) parts.push(`  -u '${req.auth.user}:${req.auth.pass}'`);
  if (req.insecure) parts.push("  -k");
  if (req.followRedirects) parts.push("  -L");
  if (req.body) parts.push(`  -d '${req.body.replace(/'/g, "'\\''")}'`);
  return parts.join(" \\\n");
}

export function toFetch(req: ParsedRequest): string {
  const headers = Object.fromEntries(headerLines(req));
  const init: Record<string, unknown> = { method: req.method };
  if (Object.keys(headers).length) init.headers = headers;
  if (req.body) init.body = req.body;
  return `fetch(${JSON.stringify(req.url)}, ${JSON.stringify(init, null, 2)})\n  .then(r => r.json())\n  .then(console.log);`;
}

export function toHttpie(req: ParsedRequest): string {
  const parts = ["http", req.method, `'${req.url}'`];
  for (const [k, v] of headerLines(req)) parts.push(`'${k}:${v}'`);
  let cmd = parts.join(" ");
  if (req.body) cmd = `echo '${req.body.replace(/'/g, "'\\''")}' | ${cmd}`;
  return cmd;
}

export function toWget(req: ParsedRequest): string {
  const parts = [`wget --method=${req.method}`];
  for (const [k, v] of headerLines(req)) parts.push(`  --header='${k}: ${v}'`);
  if (req.body) parts.push(`  --body-data='${req.body.replace(/'/g, "'\\''")}'`);
  if (req.insecure) parts.push("  --no-check-certificate");
  parts.push(`  -qO- '${req.url}'`);
  return parts.join(" \\\n");
}

export function toPowerShell(req: ParsedRequest): string {
  const h = headerLines(req);
  const lines: string[] = [];
  if (h.length) {
    lines.push("$headers = @{");
    for (const [k, v] of h) lines.push(`  '${k}' = '${v.replace(/'/g, "''")}'`);
    lines.push("}");
  }
  let call = `Invoke-RestMethod -Method ${req.method} -Uri '${req.url}'`;
  if (h.length) call += " -Headers $headers";
  if (req.body) call += ` -Body '${req.body.replace(/'/g, "''")}'`;
  if (req.insecure) call += " -SkipCertificateCheck";
  lines.push(call);
  return lines.join("\n");
}

export const EXPORTERS: { id: string; label: string; fn: (r: ParsedRequest) => string }[] = [
  { id: "curl", label: "curl", fn: toCurl },
  { id: "fetch", label: "JS fetch", fn: toFetch },
  { id: "httpie", label: "HTTPie", fn: toHttpie },
  { id: "wget", label: "wget", fn: toWget },
  { id: "powershell", label: "PowerShell", fn: toPowerShell },
];
