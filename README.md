# DevTool — Canivete Suíço para Desenvolvimento

App desktop (Tauri 2 + React + TypeScript) que reúne utilidades do dia a dia:
formatadores, encoders/cripto, consultas a APIs públicas brasileiras e
utilidades de texto — tudo offline, exceto as consultas online.

## Rodando

```bash
npm install
npm run tauri dev     # abre a janela do app com hot-reload
```

Outros scripts:

| Comando             | O que faz                                        |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | só o front-end no navegador (sem recursos Tauri) |
| `npm run test`      | testes unitários das funções puras (`src/lib`)   |
| `npm run typecheck` | `tsc --noEmit`                                    |
| `npm run build`     | build de produção do front-end                   |
| `npm run tauri dev` | app completo em modo desenvolvimento             |

## Ferramentas

- **Formatadores:** JSON (formatar/minificar/validar/ordenar chaves), XML, YAML,
  e conversor JSON ↔ YAML ↔ XML.
- **Encoders & Cripto:** Base64 (texto e arquivo, UTF-8/URL-safe), URL &
  query string, JWT (decodificar + verificar HMAC), Hashes (MD5/SHA-1/256/384/512),
  UUID (v1/v4/v5/v7), Senha & bcrypt.
- **Sistemas & Rede:** Cron (explicar + próximas execuções), chmod/permissões
  (octal ↔ simbólico, bits especiais, umask), CIDR/sub-rede (IPv4),
  cURL/HTTP (analisar comando, converter para fetch/HTTPie/wget/PowerShell,
  e disparar), **API Client** (cliente HTTP tipo Postman: método/URL, params,
  headers, body JSON/texto/form, auth Bearer/Basic/API-key, requests salvos,
  histórico e variáveis `{{...}}`; importa e exporta cURL).
- **Consultas BR:** CEP (ViaCEP + fallback BrasilAPI), CNPJ, DDD, Bancos,
  Feriados, CPF/CNPJ (validar e gerar offline), PIX Copia e Cola (gerar/decodificar).
- **Texto & Cores:** Diff, Regex, Conversor de case, Epoch ↔ Data, Base numérica,
  Lorem Ipsum, Cor & Contraste (hex/rgb/hsl/hsv + WCAG).

Atalhos e conveniências:

- `Ctrl+K` foca a busca da barra lateral.
- **UI redimensionável:** divisórias arrastáveis entre a barra lateral e o
  conteúdo, entre entrada/saída das ferramentas e (no API Client) entre
  requisição/resposta. Duplo-clique na divisória restaura. Os tamanhos ficam
  salvos (`devtool:split:*`). `<textarea>` livres têm alça de resize vertical.
- **Detecção da área de transferência:** ao focar a janela (ou pelo botão na barra
  lateral), o app olha o clipboard e sugere a ferramenta certa — JWT, JSON, cor,
  CIDR, cron, CPF/CNPJ, PIX, UUID, etc.
- **Tamanho/posição da janela** são lembrados entre sessões (`window-state`).

## Arquitetura

```
src/
  lib/         funções puras, sem React, cobertas por testes (*.test.ts)
  hooks/       useLocalStorage, useToolDraft, useTextTransform, useDark
  components/  AppShell (App.tsx), Sidebar, TransformTool, ApiTool, ui/
  tools/
    types.ts     interface Tool { id, name, category, blurb, keywords, Component }
    registry.ts  lista única de ferramentas
    *.tsx        um módulo por ferramenta
src-tauri/     backend Rust (só registra plugins: http, clipboard, dialog, os,
               window-state)
```

### Adicionar uma ferramenta

1. Crie a lógica pura em `src/lib/minha-coisa.ts` (+ `minha-coisa.test.ts`).
2. Crie o componente em `src/tools/minha-coisa.tsx` — geralmente basta embrulhar
   `<TransformTool>` (entrada→saída) ou `<ApiTool>` (consulta online).
3. Registre em `src/tools/registry.ts`.

As chamadas HTTP passam por `src/lib/http.ts`, que usa o plugin HTTP do Tauri
(sem limites de CORS) e cai no `fetch` do navegador quando rodando fora do app.

## Empacotamento

`npm run tauri build` gera os instaladores da plataforma atual
(`src-tauri/target/release/bundle/`); `--no-bundle` gera só o executável. O
`identifier` e os ícones estão em `src-tauri/tauri.conf.json`.

## CI/CD

**GitHub é a fonte da verdade; o Forgejo é um espelho (pull-mirror).**

| Workflow                    | Gatilho                | O que faz                                                                                        |
| --------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`  | push em `main`, PRs    | `commitlint` (só PR), `typecheck` + `test` + `build`, e `rustfmt` + `clippy -D warnings` + `cargo test` |
| `.github/workflows/release.yml` | push em `main`     | `semantic-release` decide a versão pelos commits, atualiza os 4 arquivos de versão, gera `CHANGELOG.md`, cria a tag `vX.Y.Z` e o Release; depois compila os bundles Tauri (Linux `.AppImage/.deb/.rpm`, Windows `.msi/.exe`, macOS `.dmg` universal) e anexa ao Release |

### Versionamento (semantic-release + Conventional Commits)

A versão sai das mensagens de commit — nada de bump manual:

| Prefixo do commit                    | Efeito         |
| ------------------------------------ | -------------- |
| `fix:` / `perf:`                     | patch (x.y.**z**) |
| `feat:`                              | minor (x.**y**.0) |
| `feat!:` ou `BREAKING CHANGE:` no corpo | major (**x**.0.0) |
| `chore:` `docs:` `refactor:` `test:` `ci:` `build:` `style:` | sem release |

`node scripts/set-version.mjs <x.y.z>` sincroniza `Cargo.toml`, `Cargo.lock` e
`tauri.conf.json` (o `package.json` é cuidado pelo `@semantic-release/npm`).
`npm run release:dry` mostra o que sairia, sem publicar.

> **Primeiro release:** por padrão o semantic-release começa em `1.0.0`. Para
> continuar de `0.x`, crie a tag `v0.1.0` no commit inicial **antes** de habilitar
> o workflow: `git tag v0.1.0 && git push origin v0.1.0`.

### Subir pro GitHub (conta pessoal)

O repositório ainda não tem remote. Use sua conta pessoal (`cassianod2`):

```bash
git config user.name  "Cassiano Mesquita"
git config user.email "cassianomesquita@hotmail.com"   # já feito localmente
gh auth switch --user cassianod2      # ou: gh auth login
gh repo create cassianod2/devtool --public --source=. --remote=origin --push
```

Se `main` tiver branch protection, permita o `github-actions[bot]` fazer bypass
(o `@semantic-release/git` precisa dar push do commit de release) **ou** troque o
`GITHUB_TOKEN` do workflow `version` por um PAT fine-grained em `secrets.GH_TOKEN`.

### Espelho no Forgejo

Na UI do Forgejo: **+ → New Migration → Git** → cole
`https://github.com/cassianod2/devtool` → marque **"This repository will be a
mirror"** → intervalo (ex.: `10m`). O Forgejo passa a puxar sozinho; não precisa
de token nem workflow do lado do Forgejo.
