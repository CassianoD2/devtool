import { useState } from "react";
import type { SqlLanguage } from "sql-formatter";
import { TransformTool } from "../components/TransformTool";
import { Checkbox, Field, Select } from "../components/ui/primitives";
import { formatSql, minifySql, SQL_DIALECTS } from "../lib/sqlfmt";

const SAMPLE =
  "select u.id, u.name, count(o.id) as orders from users u left join orders o on o.user_id = u.id where u.active = 1 group by u.id, u.name having count(o.id) > 3 order by orders desc limit 10;";

export function SqlFormatTool() {
  const [language, setLanguage] = useState<SqlLanguage>("sql");
  const [keywordCase, setKw] = useState<"preserve" | "upper" | "lower">("upper");
  const [minify, setMinify] = useState(false);

  return (
    <TransformTool
      toolId="sql-format"
      sample={SAMPLE}
      deps={[language, keywordCase, minify]}
      transform={(input) =>
        minify ? minifySql(input) : formatSql(input, { language, keywordCase })
      }
      inputPlaceholder="Cole o SQL aqui…"
      toolbar={
        <>
          <Field label="Dialeto">
            <Select
              value={language}
              onChange={(e) => setLanguage(e.currentTarget.value as SqlLanguage)}
              disabled={minify}
            >
              {SQL_DIALECTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Palavras-chave">
            <Select
              value={keywordCase}
              onChange={(e) => setKw(e.currentTarget.value as typeof keywordCase)}
              disabled={minify}
            >
              <option value="upper">MAIÚSCULAS</option>
              <option value="lower">minúsculas</option>
              <option value="preserve">preservar</option>
            </Select>
          </Field>
          <Checkbox label="minificar" checked={minify} onChange={setMinify} />
        </>
      }
    />
  );
}
