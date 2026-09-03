import { useState } from "react";
import { TransformTool } from "../components/TransformTool";
import { Checkbox, Field, Segmented, Select } from "../components/ui/primitives";
import { jsonToCsv, csvToJson } from "../lib/jsoncsv";

const SAMPLE_JSON = `[
  { "id": 1, "nome": "Ana", "cidade": "São Paulo" },
  { "id": 2, "nome": "Bruno", "cidade": "Recife", "vip": true }
]`;

const SAMPLE_CSV = `id,nome,cidade\n1,Ana,São Paulo\n2,Bruno,"Recife, PE"`;

const DELIMS: Record<string, string> = { ",": ",", ";": ";", "\t": "tab", "|": "|" };

export function JsonCsvTool() {
  const [dir, setDir] = useState<"j2c" | "c2j">("j2c");
  const [delimiter, setDelimiter] = useState(",");
  const [header, setHeader] = useState(true);
  const [quoteAll, setQuoteAll] = useState(false);

  return (
    <TransformTool
      toolId="json-csv"
      sample={dir === "j2c" ? SAMPLE_JSON : SAMPLE_CSV}
      deps={[dir, delimiter, header, quoteAll]}
      inputLang={dir === "j2c" ? "json" : "text"}
      outputLang={dir === "c2j" ? "json" : "text"}
      inputPlaceholder={dir === "j2c" ? "Array de objetos JSON…" : "Cole o CSV…"}
      transform={(input) =>
        dir === "j2c"
          ? jsonToCsv(input, { delimiter, header, quoteAll })
          : csvToJson(input, delimiter)
      }
      toolbar={
        <>
          <Segmented
            value={dir}
            onChange={setDir}
            options={[
              { value: "j2c", label: "JSON → CSV" },
              { value: "c2j", label: "CSV → JSON" },
            ]}
          />
          <Field label="Delimitador">
            <Select value={delimiter} onChange={(e) => setDelimiter(e.currentTarget.value)}>
              {Object.entries(DELIMS).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          {dir === "j2c" && (
            <>
              <Checkbox label="cabeçalho" checked={header} onChange={setHeader} />
              <Checkbox label="citar tudo" checked={quoteAll} onChange={setQuoteAll} />
            </>
          )}
        </>
      }
    />
  );
}
