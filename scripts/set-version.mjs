#!/usr/bin/env node
/**
 * Sincroniza a versão nos arquivos que o `@semantic-release/npm` não toca:
 *   - src-tauri/Cargo.toml   (version do pacote)
 *   - src-tauri/Cargo.lock   (entrada do pacote "devtool")
 *   - src-tauri/tauri.conf.json
 *
 * Uso:  node scripts/set-version.mjs <x.y.z>
 * Chamado pelo @semantic-release/exec (prepareCmd) durante o release.
 */
import { readFileSync, writeFileSync } from "node:fs";

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error(`set-version: versão inválida: ${JSON.stringify(version)}`);
  process.exit(1);
}

const CRATE = "devtool";
const edits = [];

// ---- Cargo.toml: primeira `version = "..."` dentro de [package] ----
{
  const path = "src-tauri/Cargo.toml";
  const src = readFileSync(path, "utf8");
  let inPackage = false;
  let changed = false;
  const out = src
    .split("\n")
    .map((line) => {
      const header = line.match(/^\s*\[([^\]]+)\]\s*$/);
      if (header) inPackage = header[1] === "package";
      if (inPackage && !changed && /^\s*version\s*=\s*".*"\s*$/.test(line)) {
        changed = true;
        return `version = "${version}"`;
      }
      return line;
    })
    .join("\n");
  if (!changed) throw new Error(`${path}: campo version em [package] não encontrado`);
  edits.push([path, src, out]);
}

// ---- Cargo.lock: bloco [[package]] com name = "devtool" ----
{
  const path = "src-tauri/Cargo.lock";
  const src = readFileSync(path, "utf8");
  const re = new RegExp(
    `(\\[\\[package\\]\\]\\nname = "${CRATE}"\\nversion = ")[^"]+(")`,
  );
  if (!re.test(src)) throw new Error(`${path}: pacote "${CRATE}" não encontrado`);
  edits.push([path, src, src.replace(re, `$1${version}$2`)]);
}

// ---- tauri.conf.json ----
{
  const path = "src-tauri/tauri.conf.json";
  const src = readFileSync(path, "utf8");
  const json = JSON.parse(src);
  json.version = version;
  edits.push([path, src, JSON.stringify(json, null, 2) + "\n"]);
}

for (const [path, before, after] of edits) {
  if (before === after) {
    console.log(`set-version: ${path} já em ${version}`);
    continue;
  }
  writeFileSync(path, after);
  console.log(`set-version: ${path} -> ${version}`);
}
