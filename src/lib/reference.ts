/** Tabelas de referência offline: HTTP status, MIME, portas, DNS, regex. Puro. */

export interface RefRow {
  a: string;
  b: string;
  c?: string;
}

export interface RefSection {
  id: string;
  label: string;
  cols: [string, string, string?];
  rows: RefRow[];
}

const httpStatus: RefRow[] = [
  { a: "100", b: "Continue", c: "cliente pode continuar a requisição" },
  { a: "101", b: "Switching Protocols", c: "upgrade (ex.: WebSocket)" },
  { a: "200", b: "OK", c: "sucesso" },
  { a: "201", b: "Created", c: "recurso criado (retorne Location)" },
  { a: "202", b: "Accepted", c: "aceito, processamento assíncrono" },
  { a: "204", b: "No Content", c: "sucesso sem corpo" },
  { a: "206", b: "Partial Content", c: "resposta a Range" },
  { a: "301", b: "Moved Permanently", c: "redirect permanente" },
  { a: "302", b: "Found", c: "redirect temporário" },
  { a: "303", b: "See Other", c: "GET no Location (pós-POST)" },
  { a: "304", b: "Not Modified", c: "cache válido (ETag/If-Modified-Since)" },
  { a: "307", b: "Temporary Redirect", c: "mantém o método" },
  { a: "308", b: "Permanent Redirect", c: "mantém o método" },
  { a: "400", b: "Bad Request", c: "requisição malformada" },
  { a: "401", b: "Unauthorized", c: "sem autenticação ou inválida" },
  { a: "403", b: "Forbidden", c: "autenticado mas sem permissão" },
  { a: "404", b: "Not Found", c: "recurso inexistente" },
  { a: "405", b: "Method Not Allowed", c: "método não suportado (Allow)" },
  { a: "409", b: "Conflict", c: "conflito de estado" },
  { a: "410", b: "Gone", c: "removido permanentemente" },
  { a: "412", b: "Precondition Failed", c: "If-Match/If-Unmodified falhou" },
  { a: "413", b: "Payload Too Large", c: "corpo grande demais" },
  { a: "415", b: "Unsupported Media Type", c: "Content-Type não aceito" },
  { a: "422", b: "Unprocessable Entity", c: "semântica inválida (validação)" },
  { a: "429", b: "Too Many Requests", c: "rate limit (Retry-After)" },
  { a: "500", b: "Internal Server Error", c: "erro genérico do servidor" },
  { a: "501", b: "Not Implemented", c: "método não implementado" },
  { a: "502", b: "Bad Gateway", c: "upstream inválido" },
  { a: "503", b: "Service Unavailable", c: "indisponível/manutenção" },
  { a: "504", b: "Gateway Timeout", c: "upstream não respondeu" },
];

const mime: RefRow[] = [
  { a: ".json", b: "application/json" },
  { a: ".js / .mjs", b: "text/javascript" },
  { a: ".ts", b: "video/mp2t (⚠ use text/plain p/ TS source)" },
  { a: ".html", b: "text/html" },
  { a: ".css", b: "text/css" },
  { a: ".csv", b: "text/csv" },
  { a: ".xml", b: "application/xml" },
  { a: ".txt", b: "text/plain" },
  { a: ".md", b: "text/markdown" },
  { a: ".pdf", b: "application/pdf" },
  { a: ".zip", b: "application/zip" },
  { a: ".gz", b: "application/gzip" },
  { a: ".tar", b: "application/x-tar" },
  { a: ".png", b: "image/png" },
  { a: ".jpg / .jpeg", b: "image/jpeg" },
  { a: ".gif", b: "image/gif" },
  { a: ".webp", b: "image/webp" },
  { a: ".svg", b: "image/svg+xml" },
  { a: ".ico", b: "image/vnd.microsoft.icon" },
  { a: ".mp4", b: "video/mp4" },
  { a: ".webm", b: "video/webm" },
  { a: ".mp3", b: "audio/mpeg" },
  { a: ".ogg", b: "audio/ogg" },
  { a: ".wav", b: "audio/wav" },
  { a: ".woff2", b: "font/woff2" },
  { a: ".woff", b: "font/woff" },
  { a: ".ttf", b: "font/ttf" },
  { a: ".wasm", b: "application/wasm" },
  { a: ".form (urlencoded)", b: "application/x-www-form-urlencoded" },
  { a: ".form (arquivo)", b: "multipart/form-data" },
  { a: "binário genérico", b: "application/octet-stream" },
];

const ports: RefRow[] = [
  { a: "20 / 21", b: "FTP", c: "dados / controle" },
  { a: "22", b: "SSH / SFTP" },
  { a: "23", b: "Telnet" },
  { a: "25", b: "SMTP", c: "envio de e-mail" },
  { a: "53", b: "DNS", c: "UDP e TCP" },
  { a: "67 / 68", b: "DHCP" },
  { a: "80", b: "HTTP" },
  { a: "110", b: "POP3" },
  { a: "123", b: "NTP" },
  { a: "143", b: "IMAP" },
  { a: "389", b: "LDAP" },
  { a: "443", b: "HTTPS / HTTP-3 (QUIC UDP)" },
  { a: "465 / 587", b: "SMTP (TLS / submissão)" },
  { a: "514", b: "Syslog" },
  { a: "636", b: "LDAPS" },
  { a: "993", b: "IMAPS" },
  { a: "995", b: "POP3S" },
  { a: "1433", b: "SQL Server" },
  { a: "1521", b: "Oracle DB" },
  { a: "2049", b: "NFS" },
  { a: "3000", b: "dev (Node/React comum)" },
  { a: "3306", b: "MySQL / MariaDB" },
  { a: "3389", b: "RDP" },
  { a: "5432", b: "PostgreSQL" },
  { a: "5672", b: "AMQP (RabbitMQ)" },
  { a: "6379", b: "Redis" },
  { a: "8080", b: "HTTP alternativo / proxy" },
  { a: "8443", b: "HTTPS alternativo" },
  { a: "9000", b: "PHP-FPM / MinIO / SonarQube" },
  { a: "9092", b: "Kafka" },
  { a: "9200", b: "Elasticsearch" },
  { a: "27017", b: "MongoDB" },
];

const dns: RefRow[] = [
  { a: "A", b: "IPv4 do host", c: "example.com. 300 IN A 93.184.216.34" },
  { a: "AAAA", b: "IPv6 do host" },
  { a: "CNAME", b: "alias para outro nome", c: "não pode coexistir com outros no mesmo nome" },
  { a: "MX", b: "servidor de e-mail", c: "10 mail.example.com. (prioridade menor = preferido)" },
  { a: "TXT", b: "texto livre (SPF, verificações)" },
  { a: "NS", b: "servidores autoritativos da zona" },
  { a: "SOA", b: "início de autoridade (serial, refresh, TTL)" },
  { a: "SRV", b: "serviço + porta", c: "_sip._tcp 10 60 5060 sipserver.example.com." },
  { a: "PTR", b: "DNS reverso (IP → nome)" },
  { a: "CAA", b: "quais CAs podem emitir cert", c: '0 issue "letsencrypt.org"' },
  {
    a: "SPF (TXT)",
    b: "remetentes autorizados",
    c: 'v=spf1 include:_spf.google.com ip4:1.2.3.4 -all  (~all=softfail, -all=fail)',
  },
  {
    a: "DKIM (TXT)",
    b: "chave pública p/ assinatura",
    c: "selector._domainkey.example.com  v=DKIM1; k=rsa; p=MIGf...",
  },
  {
    a: "DMARC (TXT)",
    b: "política de alinhamento SPF/DKIM",
    c: "_dmarc.example.com  v=DMARC1; p=reject; rua=mailto:dmarc@example.com; pct=100",
  },
];

const regex: RefRow[] = [
  { a: "\\d  \\D", b: "dígito / não-dígito" },
  { a: "\\w  \\W", b: "[A-Za-z0-9_] / o oposto" },
  { a: "\\s  \\S", b: "espaço / não-espaço" },
  { a: "\\b  \\B", b: "borda de palavra / não-borda" },
  { a: ".", b: "qualquer char (menos \\n, salvo flag s)" },
  { a: "^  $", b: "início / fim (linha, com flag m)" },
  { a: "*  +  ?", b: "0+, 1+, 0 ou 1" },
  { a: "{n}  {n,}  {n,m}", b: "quantificador exato / mínimo / faixa" },
  { a: "*?  +?  ??", b: "versão preguiçosa (lazy)" },
  { a: "[abc]  [^abc]  [a-z]", b: "classe / negada / faixa" },
  { a: "(…)", b: "grupo de captura" },
  { a: "(?:…)", b: "grupo sem captura" },
  { a: "(?<nome>…)", b: "grupo nomeado" },
  { a: "\\1  \\k<nome>", b: "referência a grupo" },
  { a: "(?=…)  (?!…)", b: "lookahead positivo / negativo" },
  { a: "(?<=…)  (?<!…)", b: "lookbehind positivo / negativo" },
  { a: "a|b", b: "alternância" },
  { a: "\\p{L}  \\p{N}", b: "categoria Unicode (precisa da flag u)" },
  { a: "flags", b: "g global · i ignore-case · m multiline · s dotAll · u unicode · y sticky" },
];

export const REFERENCE: RefSection[] = [
  { id: "http", label: "HTTP status", cols: ["Código", "Nome", "Quando"], rows: httpStatus },
  { id: "mime", label: "MIME types", cols: ["Extensão", "Content-Type"], rows: mime },
  { id: "ports", label: "Portas", cols: ["Porta", "Serviço", "Obs."], rows: ports },
  { id: "dns", label: "DNS", cols: ["Registro", "Para quê", "Exemplo"], rows: dns },
  { id: "regex", label: "Regex", cols: ["Token", "Significado"], rows: regex },
];

export function searchReference(query: string): RefSection[] {
  const q = query.trim().toLowerCase();
  if (!q) return REFERENCE;
  return REFERENCE.map((sec) => ({
    ...sec,
    rows: sec.rows.filter((r) =>
      `${r.a} ${r.b} ${r.c ?? ""}`.toLowerCase().includes(q),
    ),
  })).filter((sec) => sec.rows.length > 0);
}
