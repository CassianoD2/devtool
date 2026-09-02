#!/usr/bin/env node
/**
 * Garante que a versão está igual nos três arquivos que o release sincroniza:
 *   - package.json
 *   - src-tauri/tauri.conf.json
 *   - src-tauri/Cargo.toml  ([package].version)
 *
 * Pega um scripts/set-version.mjs que silenciosamente não editou algum arquivo.
 * Roda no CI (todo push / PR). Uso: node scripts/check-versions.mjs
 */
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8")).version;
const conf = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8")).version;

const toml = readFileSync("src-tauri/Cargo.toml", "utf8");
const pkgBlock = (toml.split(/^\[package\]\s*$/m)[1] ?? "").split(/^\[/m)[0];
const crate = pkgBlock.match(/^\s*version\s*=\s*"([^"]+)"/m)?.[1];

const found = {
  "package.json": pkg,
  "src-tauri/tauri.conf.json": conf,
  "src-tauri/Cargo.toml": crate,
};

const uniq = [...new Set(Object.values(found))];
if (uniq.length !== 1 || !uniq[0]) {
  console.error("Versões divergentes ou ausentes:");
  for (const [file, v] of Object.entries(found)) {
    console.error(`  ${file}: ${v ?? "(não encontrada)"}`);
  }
  process.exit(1);
}

console.log(`Versões consistentes: ${uniq[0]}`);
