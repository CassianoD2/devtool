import { useState } from "react";
import { TransformTool } from "../components/TransformTool";
import { Field, Segmented, Select } from "../components/ui/primitives";
import {
  escapeString,
  unescapeString,
  ESCAPE_TARGETS,
  type EscapeTarget,
} from "../lib/escape";

const SAMPLE = 'Ele disse: "olá"\ncaminho\\novo\ttab';

export function EscapeTool() {
  const [target, setTarget] = useState<EscapeTarget>("json");
  const [mode, setMode] = useState<"escape" | "unescape">("escape");

  return (
    <TransformTool
      toolId="escape"
      sample={SAMPLE}
      deps={[target, mode]}
      transform={(input) =>
        mode === "escape" ? escapeString(input, target) : unescapeString(input, target)
      }
      toolbar={
        <>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "escape", label: "Escapar" },
              { value: "unescape", label: "Desescapar" },
            ]}
          />
          <Field label="Alvo">
            <Select
              value={target}
              onChange={(e) => setTarget(e.currentTarget.value as EscapeTarget)}
            >
              {ESCAPE_TARGETS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
        </>
      }
    />
  );
}
