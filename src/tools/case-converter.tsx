import { useState } from "react";
import { TransformTool } from "../components/TransformTool";
import { Field, Select } from "../components/ui/primitives";
import { convertCase, CASES, type CaseName } from "../lib/casing";

const SAMPLE = "primeiroNomeDoUsuario\nHTTPResponseCode\nminha-classe-css";

export function CaseConverter() {
  const [target, setTarget] = useState<CaseName>("snake");
  return (
    <TransformTool
      toolId="case-converter"
      sample={SAMPLE}
      deps={[target]}
      transform={(input) => convertCase(input, target)}
      toolbar={
        <Field label="Converter para">
          <Select
            value={target}
            onChange={(e) => setTarget(e.currentTarget.value as CaseName)}
          >
            {CASES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      }
    />
  );
}
