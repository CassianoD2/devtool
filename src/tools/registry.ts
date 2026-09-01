import { lazy } from "react";
import type { Tool } from "./types";
import { ArrowLeftRight, Binary, Braces, Building2, Calculator, CalendarDays, CaseSensitive, Clock, Code, FileCode2, FileText, Fingerprint, GitCompare, Hash, IdCard, KeyRound, Landmark, Link2, LockKeyhole, MapPin, Network, Palette, Phone, QrCode, Regex, Send, ShieldCheck, Terminal, Timer, Type } from "lucide-react";
import { JsonFormatter } from "./json-formatter";
import { XmlFormatter } from "./xml-formatter";
import { YamlFormatter } from "./yaml-formatter";
import { DataConvert } from "./data-convert";
import { Base64Tool } from "./base64";
import { UrlTool } from "./url-tool";
import { JwtDecoder } from "./jwt-decoder";
import { HashTool } from "./hash-tool";
import { UuidTool } from "./uuid-tool";
import { PasswordTool } from "./password-tool";
import { CepTool, CnpjTool, DddTool, BanksTool, HolidaysTool } from "./brasil-tools";
import { BrDocsTool } from "./br-docs-tool";
import { PixTool } from "./pix-tool";
import { TextDiff } from "./text-diff";
import { RegexTester } from "./regex-tester";
import { CaseConverter } from "./case-converter";
import { TimestampTool } from "./timestamp-tool";
import { NumBaseTool } from "./numbase-tool";
import { LoremTool } from "./lorem-tool";
import { CronTool } from "./cron-tool";
import { ChmodTool } from "./chmod-tool";
import { CidrTool } from "./cidr-tool";
import { ColorTool } from "./color-tool";
import { CurlTool } from "./curl-tool";
import { ApiClient } from "./api-client";

// Carregado sob demanda: marked + DOMPurify + mermaid + highlight.js são pesados
// e só interessam a quem abre esta ferramenta.
const MarkdownTool = lazy(() =>
  import("./markdown-tool").then((m) => ({ default: m.MarkdownTool })),
);

export const TOOLS: Tool[] = [
  {
    id: "json-formatter",
    icon: Braces,
    name: "JSON",
    category: "formatters",
    blurb: "Formatar, minificar, validar e ordenar chaves",
    keywords: ["json", "pretty", "beautify", "minify", "lint"],
    Component: JsonFormatter,
  },
  {
    id: "xml-formatter",
    icon: Code,
    name: "XML",
    category: "formatters",
    blurb: "Formatar, minificar e validar XML",
    keywords: ["xml", "pretty", "beautify", "minify"],
    Component: XmlFormatter,
  },
  {
    id: "yaml-formatter",
    icon: FileCode2,
    name: "YAML",
    category: "formatters",
    blurb: "Normalizar e validar YAML",
    keywords: ["yaml", "yml"],
    Component: YamlFormatter,
  },
  {
    id: "data-convert",
    icon: ArrowLeftRight,
    name: "Conversor JSON / YAML / XML",
    category: "formatters",
    blurb: "Converter entre os três formatos",
    keywords: ["convert", "json", "yaml", "xml", "transformar"],
    Component: DataConvert,
  },
  {
    id: "base64",
    icon: Binary,
    name: "Base64",
    category: "encoders",
    blurb: "Codificar/decodificar texto e arquivos (UTF-8, URL-safe)",
    keywords: ["base64", "b64", "encode", "decode", "arquivo"],
    Component: Base64Tool,
  },
  {
    id: "url-tool",
    icon: Link2,
    name: "URL & Query String",
    category: "encoders",
    blurb: "Percent-encoding e análise de query string",
    keywords: ["url", "uri", "encode", "decode", "querystring", "params"],
    Component: UrlTool,
  },
  {
    id: "jwt-decoder",
    icon: KeyRound,
    name: "JWT",
    category: "encoders",
    blurb: "Decodificar header/payload e verificar assinatura HMAC",
    keywords: ["jwt", "token", "jose", "bearer", "hmac"],
    Component: JwtDecoder,
  },
  {
    id: "hash-tool",
    icon: Hash,
    name: "Hashes",
    category: "encoders",
    blurb: "MD5, SHA-1, SHA-256/384/512 de texto ou arquivo",
    keywords: ["hash", "md5", "sha", "sha256", "checksum", "digest"],
    Component: HashTool,
  },
  {
    id: "uuid-tool",
    icon: Fingerprint,
    name: "UUID",
    category: "encoders",
    blurb: "Gerar UUID v1/v4/v5/v7 em lote",
    keywords: ["uuid", "guid", "identificador", "v4", "v7"],
    Component: UuidTool,
  },
  {
    id: "password-tool",
    icon: LockKeyhole,
    name: "Senha & bcrypt",
    category: "encoders",
    blurb: "Gerar senhas fortes e hash bcrypt",
    keywords: ["senha", "password", "bcrypt", "gerador", "aleatório"],
    Component: PasswordTool,
  },
  {
    id: "cron",
    icon: Timer,
    name: "Cron",
    category: "sysadmin",
    blurb: "Explicar expressão cron e ver próximas execuções",
    keywords: ["cron", "crontab", "agendamento", "schedule", "quartz"],
    Component: CronTool,
  },
  {
    id: "chmod",
    icon: ShieldCheck,
    name: "chmod / permissões",
    category: "sysadmin",
    blurb: "Octal ↔ simbólico (rwx), bits especiais e umask",
    keywords: ["chmod", "permissão", "octal", "rwx", "umask", "setuid", "sticky"],
    Component: ChmodTool,
  },
  {
    id: "cidr",
    icon: Network,
    name: "CIDR / Sub-rede",
    category: "sysadmin",
    blurb: "Máscara, rede, broadcast, faixa de hosts (IPv4)",
    keywords: ["cidr", "subnet", "sub-rede", "ip", "máscara", "netmask", "rede"],
    Component: CidrTool,
  },
  {
    id: "curl",
    needsInternet: true,
    icon: Terminal,
    name: "cURL / HTTP",
    category: "sysadmin",
    blurb: "Analisar comando curl, converter (fetch/HTTPie/wget/PS) e disparar",
    keywords: ["curl", "http", "request", "requisição", "api", "rest", "fetch", "httpie", "wget"],
    Component: CurlTool,
  },
  {
    id: "api-client",
    needsInternet: true,
    icon: Send,
    name: "API Client",
    category: "sysadmin",
    blurb: "Cliente HTTP tipo Postman: params, headers, body, auth, salvos e variáveis",
    keywords: ["api", "client", "postman", "insomnia", "rest", "http", "request", "requisição", "endpoint"],
    Component: ApiClient,
  },
  {
    id: "cep",
    needsInternet: true,
    icon: MapPin,
    name: "CEP",
    category: "brasil",
    blurb: "Consultar endereço por CEP (ViaCEP + BrasilAPI)",
    keywords: ["cep", "endereço", "correios", "viacep"],
    Component: CepTool,
  },
  {
    id: "cnpj",
    needsInternet: true,
    icon: Building2,
    name: "CNPJ",
    category: "brasil",
    blurb: "Dados cadastrais de empresa por CNPJ",
    keywords: ["cnpj", "empresa", "receita", "razão social"],
    Component: CnpjTool,
  },
  {
    id: "ddd",
    needsInternet: true,
    icon: Phone,
    name: "DDD",
    category: "brasil",
    blurb: "Estado e cidades de um DDD",
    keywords: ["ddd", "telefone", "código de área"],
    Component: DddTool,
  },
  {
    id: "banks",
    needsInternet: true,
    icon: Landmark,
    name: "Bancos",
    category: "brasil",
    blurb: "Lista de bancos (código COMPE / ISPB)",
    keywords: ["banco", "compe", "ispb", "febraban"],
    Component: BanksTool,
  },
  {
    id: "holidays",
    needsInternet: true,
    icon: CalendarDays,
    name: "Feriados",
    category: "brasil",
    blurb: "Feriados nacionais de um ano",
    keywords: ["feriado", "holiday", "nacional", "calendário"],
    Component: HolidaysTool,
  },
  {
    id: "br-docs",
    icon: IdCard,
    name: "CPF / CNPJ",
    category: "brasil",
    blurb: "Validar e gerar (offline, dígitos verificadores)",
    keywords: ["cpf", "cnpj", "documento", "validar", "gerar", "mod11"],
    Component: BrDocsTool,
  },
  {
    id: "pix",
    icon: QrCode,
    name: "PIX Copia e Cola",
    category: "brasil",
    blurb: "Gerar e decodificar o BR Code (EMV) do PIX",
    keywords: ["pix", "brcode", "br code", "emv", "copia e cola", "qr"],
    Component: PixTool,
  },
  {
    id: "text-diff",
    icon: GitCompare,
    name: "Diff de texto",
    category: "text",
    blurb: "Comparar dois textos por linha ou palavra",
    keywords: ["diff", "comparar", "diferença", "merge"],
    Component: TextDiff,
  },
  {
    id: "regex-tester",
    icon: Regex,
    name: "Regex",
    category: "text",
    blurb: "Testar expressões regulares com grupos e flags",
    keywords: ["regex", "regexp", "expressão regular", "match", "pattern"],
    Component: RegexTester,
  },
  {
    id: "case-converter",
    icon: CaseSensitive,
    name: "Conversor de case",
    category: "text",
    blurb: "camelCase, snake_case, kebab-case, etc.",
    keywords: ["case", "camel", "snake", "kebab", "pascal", "slug"],
    Component: CaseConverter,
  },
  {
    id: "timestamp",
    icon: Clock,
    name: "Epoch & Data",
    category: "text",
    blurb: "Converter timestamp Unix ↔ data, com fuso",
    keywords: ["epoch", "unix", "timestamp", "data", "hora", "timezone"],
    Component: TimestampTool,
  },
  {
    id: "numbase",
    icon: Calculator,
    name: "Base numérica",
    category: "text",
    blurb: "Converter entre binário, octal, decimal e hexadecimal",
    keywords: ["binário", "hex", "octal", "decimal", "base", "radix"],
    Component: NumBaseTool,
  },
  {
    id: "lorem",
    icon: Type,
    name: "Lorem Ipsum",
    category: "text",
    blurb: "Gerar texto de preenchimento",
    keywords: ["lorem", "ipsum", "placeholder", "dummy", "texto"],
    Component: LoremTool,
  },
  {
    id: "color",
    icon: Palette,
    name: "Cor & Contraste",
    category: "text",
    blurb: "hex ↔ rgb ↔ hsl ↔ hsv e contraste WCAG",
    keywords: ["cor", "color", "hex", "rgb", "hsl", "contraste", "wcag", "acessibilidade"],
    Component: ColorTool,
  },
  {
    id: "markdown",
    icon: FileText,
    name: "Markdown Preview",
    category: "text",
    blurb: "Renderiza Markdown (GFM) com Mermaid e realce de código",
    keywords: ["markdown", "md", "gfm", "mermaid", "diagrama", "preview", "readme", "highlight"],
    Component: MarkdownTool,
  },
];

export const TOOLS_BY_ID = new Map(TOOLS.map((t) => [t.id, t]));
