import { useState } from "react";
import { TransformTool } from "../components/TransformTool";
import { Field, Segmented } from "../components/ui/primitives";
import { formatXml, minifyXml, type XmlIndent } from "../lib/xml";

const SAMPLE =
  '<catalog><book id="bk101"><author>Gambardella</author><title>XML Guide</title><price>44.95</price></book></catalog>';

export function XmlFormatter() {
  const [mode, setMode] = useState<"pretty" | "minify">("pretty");
  const [indent, setIndent] = useState<XmlIndent>("2");

  return (
    <TransformTool
      toolId="xml-formatter"
      sample={SAMPLE}
      inputLang="xml"
      outputLang="xml"
      deps={[mode, indent]}
      transform={(input) =>
        mode === "minify" ? minifyXml(input) : formatXml(input, { indent })
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
        </>
      }
    />
  );
}
