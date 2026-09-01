import { useState } from "react";
import { TransformTool } from "../components/TransformTool";
import { Field, Segmented } from "../components/ui/primitives";
import { convertData, type DataFormat } from "../lib/convert";

const SAMPLE = '{"servico":"cep","provedores":["viacep","brasilapi"],"timeoutMs":4000}';
const LANG = { json: "json", yaml: "yaml", xml: "xml" } as const;
const OPTS = [
  { value: "json" as const, label: "JSON" },
  { value: "yaml" as const, label: "YAML" },
  { value: "xml" as const, label: "XML" },
];

export function DataConvert() {
  const [from, setFrom] = useState<DataFormat>("json");
  const [to, setTo] = useState<DataFormat>("yaml");

  return (
    <TransformTool
      toolId="data-convert"
      sample={SAMPLE}
      inputLang={LANG[from]}
      outputLang={LANG[to]}
      deps={[from, to]}
      transform={(input) => convertData(input, from, to)}
      toolbar={
        <>
          <Field label="De">
            <Segmented value={from} onChange={setFrom} options={OPTS} />
          </Field>
          <Field label="Para">
            <Segmented value={to} onChange={setTo} options={OPTS} />
          </Field>
        </>
      }
    />
  );
}
