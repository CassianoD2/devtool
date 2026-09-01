import * as prettier from "prettier/standalone";
import * as pluginMarkdown from "prettier/plugins/markdown";
import * as pluginBabel from "prettier/plugins/babel";
import * as pluginEstree from "prettier/plugins/estree";
import * as pluginPostcss from "prettier/plugins/postcss";
import * as pluginHtml from "prettier/plugins/html";
import * as pluginYaml from "prettier/plugins/yaml";
import * as pluginGraphql from "prettier/plugins/graphql";
import type { Plugin } from "prettier";

const PLUGINS: Plugin[] = [
  pluginMarkdown,
  pluginBabel,
  pluginEstree,
  pluginPostcss,
  pluginHtml,
  pluginYaml,
  pluginGraphql,
] as unknown as Plugin[];

/**
 * Formata um documento Markdown com o Prettier e, junto, o código dentro das
 * cercas ```` ``` ```` cuja linguagem o Prettier conhece (js/ts/json/css/scss/
 * html/yaml/graphql). Linguagens desconhecidas ficam intactas.
 * Lança Error com mensagem legível em caso de sintaxe inválida.
 */
export async function formatMarkdown(source: string): Promise<string> {
  if (!source.trim()) return source;
  try {
    return await prettier.format(source, {
      parser: "markdown",
      plugins: PLUGINS,
      proseWrap: "preserve",
      embeddedLanguageFormatting: "auto",
      tabWidth: 2,
    });
  } catch (err) {
    const e = err as { message?: string; loc?: { start?: { line: number; column: number } } };
    const where = e.loc?.start ? ` (linha ${e.loc.start.line})` : "";
    throw new Error(`Não foi possível formatar${where}: ${e.message ?? String(err)}`);
  }
}
