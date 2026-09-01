import { useState } from "react";
import { TransformTool } from "../components/TransformTool";
import { Checkbox, Field, Segmented } from "../components/ui/primitives";
import { formatJson, minifyJson, type IndentStyle } from "../lib/json";

const SAMPLE = '{"nome":"DevTool","versao":1,"tags":["json","xml","cep"],"ativo":true}';

export function JsonFormatter() {
  const [mode, setMode] = useState<"pretty" | "minify">("pretty");
  const [indent, setIndent] = useState<IndentStyle>("2");
  const [sortKeys, setSortKeys] = useState(false);

  return (
    <TransformTool
      toolId="json-formatter"
      sample={SAMPLE}
      inputLang="json"
      outputLang="json"
      deps={[mode, indent, sortKeys]}
      transform={(input) =>
        mode === "minify" ? minifyJson(input) : formatJson(input, { indent, sortKeys })
      }
      toolbar={
        <>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "pretty", label: "Formatar" },
              { value: "minify", label: "Minificar" },
            ]}
          />
          {mode === "pretty" && (
            <Field label="Indentação">
              <Segmented
                value={indent}
                onChange={setIndent}
                options={[
                  { value: "2", label: "2" },
                  { value: "4", label: "4" },
                  { value: "tab", label: "Tab" },
                ]}
              />
            </Field>
          )}
          {mode === "pretty" && (
            <Checkbox label="Ordenar chaves" checked={sortKeys} onChange={setSortKeys} />
          )}
        </>
      }
    />
  );
}
