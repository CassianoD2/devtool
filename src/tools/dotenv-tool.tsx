import { useState } from "react";
import { TransformTool } from "../components/TransformTool";
import { Field, Segmented, Select } from "../components/ui/primitives";
import { parseEnv, toFormat, jsonToEnv, DOTENV_FORMATS, type DotenvFormat } from "../lib/dotenv";

const SAMPLE_ENV = `# banco
export DATABASE_URL="postgres://user:pass@localhost:5432/app"
PORT=3000
DEBUG=true
GREETING="olá\\nmundo"`;

const SAMPLE_JSON = `{
  "DATABASE_URL": "postgres://user:pass@localhost:5432/app",
  "PORT": "3000",
  "DEBUG": "true"
}`;

export function DotenvTool() {
  const [dir, setDir] = useState<"to" | "from">("to");
  const [format, setFormat] = useState<DotenvFormat>("json");

  return (
    <TransformTool
      toolId="dotenv"
      sample={dir === "to" ? SAMPLE_ENV : SAMPLE_JSON}
      deps={[dir, format]}
      inputLang={dir === "from" ? "json" : "text"}
      outputLang={dir === "to" && format === "json" ? "json" : "text"}
      inputPlaceholder={dir === "to" ? "Cole o .env aqui…" : "Cole um objeto JSON plano…"}
      transform={(input) =>
        dir === "to" ? toFormat(parseEnv(input), format) : jsonToEnv(input)
      }
      toolbar={
        <>
          <Segmented
            value={dir}
            onChange={setDir}
            options={[
              { value: "to", label: ".env →" },
              { value: "from", label: "→ .env" },
            ]}
          />
          {dir === "to" && (
            <Field label="Formato">
              <Select
                value={format}
                onChange={(e) => setFormat(e.currentTarget.value as DotenvFormat)}
              >
                {DOTENV_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </>
      }
    />
  );
}
