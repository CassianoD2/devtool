# DevTool — Canivete Suíço para Desenvolvimento

Aplicativo **desktop** que junta num só lugar as utilidades que a gente sempre
acaba procurando em cinco abas diferentes (e no Postman): formatadores, encoders,
cripto, consultas a APIs públicas brasileiras, ferramentas de rede e de texto.
**30 ferramentas**, janela nativa leve (Tauri), sem Electron e sem servidor.

## 100% offline

Todo o código e os assets — fontes (Inter, JetBrains Mono), Mermaid, highlight.js,
etc. — são **empacotados dentro do binário**. Nada é baixado da internet em tempo
de execução; o carregamento sob demanda (ex.: a ferramenta de Markdown) lê
arquivos locais, não a rede. Uma **CSP restritiva** em `src-tauri/tauri.conf.json`
(`default-src 'self'; script-src 'self'; connect-src 'self' …`) proíbe qualquer
script, estilo ou conexão externa.

As poucas ferramentas que **precisam** de rede para funcionar — CEP, CNPJ, DDD,
Bancos, Feriados, cURL/HTTP, API Client — fazem as requisições pelo **backend
Rust** (não pelo `fetch` da webview) e exibem um selo verde **"Conexão com
internet necessária"** no cabeçalho, além de um ícone de Wi-Fi na barra lateral.

## Linguagens & tecnologias

| Camada | Linguagem / ferramenta | Observações |
| --- | --- | --- |
| **Interface e lógica** | **TypeScript** (~8,5k linhas) + **React 19** | Toda a aplicação: UI, lógica das ferramentas e testes. `tsc --noEmit` sem erros. |
| Estilo | **CSS** + **Tailwind CSS v4** | Sistema de _design tokens_ (claro/escuro) em `src/styles.css`. |
| Editor de código | **CodeMirror 6** | Painéis de JSON/XML/YAML. |
| **Shell nativo** | **Rust** (edition 2021) — **~18 linhas** | Só registra os plugins do Tauri; nenhuma lógica de negócio no backend. |
| Runtime desktop | **Tauri 2** | WebView do sistema (WebKitGTK no Linux) — binário de ~25 MB. |
| Build / dev server | **Vite 7** | |
| Testes | **Vitest** | 136 testes sobre as funções puras de `src/lib`. |
| Ícones | **lucide-react** | |
| CI/CD | **YAML** (GitHub Actions) + **semantic-release** (Node) | |

Bibliotecas de apoio: `marked` + `DOMPurify` + `mermaid` + `highlight.js`
(Markdown), `fast-xml-parser`/`xml-formatter`, `yaml`, `date-fns`, `diff`,
`cronstrue`/`cron-parser`, `bcryptjs`, `spark-md5`, `uuid`.

## Ferramentas

| Categoria | Ferramentas |
| --- | --- |
| **Formatadores** | JSON (formatar/minificar/validar/ordenar chaves), XML, YAML, Conversor JSON ↔ YAML ↔ XML |
| **Encoders & Cripto** | Base64 (texto e arquivo, UTF-8/URL-safe), URL & Query String, JWT (decodificar + verificar HMAC), Hashes (MD5/SHA-1/256/384/512), UUID (v1/v4/v5/v7), Senha & bcrypt |
| **Sistemas & Rede** | Cron (explicar + próximas execuções), chmod / permissões (octal ↔ simbólico, bits especiais, umask), CIDR / Sub-rede (IPv4), **cURL / HTTP**¹ (analisar comando, converter para fetch/HTTPie/wget/PowerShell, disparar), **API Client**¹ (cliente HTTP tipo Postman: params, headers, body, auth, requests salvos, histórico, variáveis `{{…}}`) |
| **Consultas BR** | **CEP**¹ (ViaCEP + fallback BrasilAPI), **CNPJ**¹, **DDD**¹, **Bancos**¹, **Feriados**¹, CPF / CNPJ (validar e gerar, offline), PIX Copia e Cola (gerar/decodificar o BR Code EMV) |
| **Texto & Cores** | Diff de texto, Regex (grupos, flags, presets), Conversor de case, Epoch ↔ Data (com fuso), Base numérica (bin/oct/dec/hex, BigInt), Lorem Ipsum, Cor & Contraste (hex/rgb/hsl/hsv + WCAG), **Markdown Preview** (GFM, realce de código, diagramas Mermaid — carregado sob demanda) |

¹ Precisa de conexão com a internet.

## Como usar

### Pré-requisitos

- **Node.js 20+** (testado com 24) e npm
- **Rust** estável (`rustup`) — testado com 1.98
- **Dependências de sistema do Tauri** (Linux):
  - Arch / EndeavourOS: `sudo pacman -S --needed webkit2gtk-4.1 libsoup3 base-devel curl wget file openssl librsvg libappindicator-gtk3 xdotool`
  - Debian / Ubuntu: `sudo apt install libwebkit2gtk-4.1-dev libsoup-3.0-dev librsvg2-dev libappindicator3-dev libxdo-dev patchelf build-essential curl wget file libssl-dev`

### Desenvolvimento

```bash
npm install
npm run tauri dev      # abre a janela do app com hot-reload
```

### Build

```bash
npm run tauri build                 # instaladores da plataforma atual
npm run tauri build -- --no-bundle  # só o executável
```

Saída em `src-tauri/target/release/` (executável) e
`src-tauri/target/release/bundle/` (`.AppImage`/`.deb`/`.rpm` no Linux,
`.msi`/`.exe` no Windows, `.dmg` no macOS). `identifier` e ícones em
`src-tauri/tauri.conf.json`.

### Scripts npm

| Comando | O que faz |
| --- | --- |
| `npm run tauri dev` | app completo, hot-reload |
| `npm run dev` | só o front-end no navegador (sem recursos nativos) |
| `npm run build` | build de produção do front-end (`tsc` + `vite build`) |
| `npm run test` | testes unitários (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check` | `typecheck` + `test` |
| `npm run set-version <x.y.z>` | sincroniza a versão nos arquivos do Rust/Tauri |
| `npm run release:dry` | prévia do próximo release (semantic-release, sem publicar) |

## Recursos da interface

- **`Ctrl+K`** foca a busca da barra lateral.
- **Categorias retráteis:** clique no título para recolher/expandir (mostra um
  contador quando recolhida); "recolher tudo / expandir tudo" no topo. O estado é
  salvo; a categoria da ferramenta ativa abre sozinha; durante uma busca, tudo
  fica expandido.
- **UI redimensionável:** divisórias arrastáveis entre a barra lateral e o
  conteúdo, entre entrada/saída das ferramentas e (no API Client) entre
  requisição/resposta. Duplo-clique restaura. Tamanhos persistidos.
- **Detecção da área de transferência:** ao focar a janela (ou pelo botão na
  barra lateral), o app olha o clipboard e sugere a ferramenta certa — JWT, JSON,
  cor, CIDR, cron, CPF/CNPJ, PIX, UUID, URL, timestamp, Base64, comando `curl`.
- **Configurações:** tema **Claro / Escuro / Sistema**, restaurar tamanhos de
  painéis, limpar dados salvos.
- **Sobre:** dados do desenvolvedor e da stack.
- **Persistência local:** última ferramenta, rascunho de cada ferramenta,
  tamanho/posição da janela, requests e variáveis do API Client — tudo em
  `localStorage`, só nesta máquina.

## Arquitetura

```
src/
  lib/          funções PURAS (sem React), 1:1 com um teste (*.test.ts)
  hooks/        useLocalStorage, useToolDraft, useTextTransform, useTheme, …
  components/
    App.tsx        shell: barra lateral + cabeçalho + painel da ferramenta
    Sidebar.tsx    busca, categorias retráteis, footer (Config./Sobre)
    TransformTool  layout genérico entrada→saída
    ApiTool        layout genérico de consulta online
    SplitPane      divisória arrastável reutilizável
    ui/            Button, Select, Segmented, CodeArea, Toast, …
  tools/
    types.ts       interface Tool { id, name, category, blurb, keywords,
                                     icon, needsInternet?, Component }
    registry.ts    lista única — a fonte da verdade das ferramentas
    *.tsx          um módulo por ferramenta
src-tauri/         shell Rust: registra plugins (http, clipboard-manager,
                   dialog, os, window-state, opener) + CSP. Sem comandos custom.
scripts/          set-version.mjs (usado pelo release)
.github/workflows ci.yml, release.yml
```

**Princípio central:** toda lógica não-trivial vive em `src/lib/*.ts` como função
pura, com teste. Os arquivos em `src/tools/*.tsx` são só a "casca" de UI —
geralmente uma chamada a `<TransformTool>` (entrada→saída) ou `<ApiTool>`
(consulta online).

### Adicionar uma ferramenta

1. Lógica pura em `src/lib/minha-coisa.ts` (+ `minha-coisa.test.ts`).
2. Componente em `src/tools/minha-coisa.tsx` (embrulhe `<TransformTool>` ou
   `<ApiTool>` quando der).
3. Registre em `src/tools/registry.ts` (id, nome, categoria, `icon`, e
   `needsInternet: true` se fizer requisições).

### Rede

Chamadas HTTP passam por `src/lib/http.ts`, que usa o **plugin HTTP do Tauri**
(feito em Rust, sem limites de CORS) e cai no `fetch` do navegador só quando
rodando fora do app (`npm run dev`). No app empacotado, o `fetch` da webview
nunca alcança a internet — a CSP bloqueia.

## Testes

```bash
npm run test
```

136 testes (Vitest) cobrindo as funções puras de `src/lib`: parsing/serialização,
dígitos verificadores de CPF/CNPJ, CRC16 do PIX, conversão de bases, cálculo de
sub-rede, contraste WCAG, sanitização do Markdown (ambiente jsdom), etc.

## CI/CD

- `.github/workflows/ci.yml` (push / PR): `typecheck` + `test` + `build`;
  `rustfmt` + `clippy -D warnings` + `cargo test`; `commitlint` nos PRs.
- `.github/workflows/release.yml` (push em `main`): `semantic-release` calcula a
  versão pelos commits, gera `CHANGELOG.md` + tag + Release e compila os bundles
  Tauri (Linux `.AppImage/.deb/.rpm`, Windows `.msi/.exe`, macOS `.dmg`),
  anexando-os ao Release.

Commits seguem **Conventional Commits**: `fix:` → patch, `feat:` → minor,
`feat!:` / `BREAKING CHANGE:` → major; `chore:`/`docs:`/`refactor:`/`test:`/`ci:`
não geram release. `npm run release:dry` mostra o que sairia sem publicar;
`node scripts/set-version.mjs <x.y.z>` sincroniza a versão nos arquivos do Rust/Tauri.

## Licença

[MIT](LICENSE) © Cassiano Mesquita.

---

Feito por **Cassiano Mesquita** · [github.com/cassianod2](https://github.com/cassianod2) · [cassianomesquita.dev](https://cassianomesquita.dev)
