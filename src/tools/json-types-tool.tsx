import { useState } from "react";
import { TransformTool } from "../components/TransformTool";
import { Field, Input, Select } from "../components/ui/primitives";
import { jsonToTypes, TYPE_TARGETS, type TypeTarget } from "../lib/jsontypes";

const SAMPLE = `{
  "id": 42,
  "name": "Ada",
  "active": true,
  "roles": ["admin", "dev"],
  "profile": { "city": "São Paulo", "since": 2019 },
  "orders": [
    { "id": 1, "total": 99.9, "paid": true },
    { "id": 2, "total": 12.5 }
  ]
}`;

const LANG: Record<TypeTarget, "json" | "text"> = {
  ts: "text",
  go: "text",
  zod: "text",
  sql: "text",
};

export function JsonTypesTool() {
  const [target, setTarget] = useState<TypeTarget>("ts");
  const [rootName, setRootName] = useState("Root");

  return (
    <TransformTool
      toolId="json-types"
      sample={SAMPLE}
      deps={[target, rootName]}
      inputLang="json"
      outputLang={LANG[target]}
      inputPlaceholder="Cole um exemplo de JSON…"
      transform={(input) => jsonToTypes(input, target, rootName || "Root")}
      toolbar={
        <>
          <Field label="Gerar">
            <Select value={target} onChange={(e) => setTarget(e.currentTarget.value as TypeTarget)}>
              {TYPE_TARGETS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nome raiz">
            <Input
              value={rootName}
              onChange={(e) => setRootName(e.currentTarget.value)}
              className="w-32"
            />
          </Field>
        </>
      }
    />
  );
}
