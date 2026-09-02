import { useState } from "react";
import { TransformTool } from "../components/TransformTool";
import { Checkbox, Field, Input, Select } from "../components/ui/primitives";
import { applyLineOp, LINE_OPS, type LineOp } from "../lib/lines";

const SAMPLE = "banana\nAbacaxi\ncaju\nbanana\n\n  laranja  \nacerola";

const NEEDS_ARG: Record<string, "text" | "regex" | undefined> = Object.fromEntries(
  LINE_OPS.map((o) => [o.id, o.arg]),
);

export function LineTools() {
  const [op, setOp] = useState<LineOp>("sort-asc");
  const [arg, setArg] = useState("");
  const [caseInsensitive, setCI] = useState(false);
  const [invert, setInvert] = useState(false);

  const argKind = NEEDS_ARG[op];
  const isFilter = op === "filter-contains" || op === "filter-regex";
  const isSort = op.startsWith("sort") || op.startsWith("dedupe");

  return (
    <TransformTool
      toolId="line-tools"
      sample={SAMPLE}
      deps={[op, arg, caseInsensitive, invert]}
      transform={(input) => applyLineOp(input, op, { arg, caseInsensitive, invert })}
      inputPlaceholder="Uma linha por item…"
      toolbar={
        <>
          <Field label="Operação">
            <Select value={op} onChange={(e) => setOp(e.currentTarget.value as LineOp)}>
              {LINE_OPS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          {argKind && (
            <Input
              value={arg}
              onChange={(e) => setArg(e.currentTarget.value)}
              placeholder={
                op === "prefix-suffix"
                  ? "prefixo|sufixo"
                  : argKind === "regex"
                    ? "expressão"
                    : op === "join" || op === "split"
                      ? "delimitador"
                      : "termo"
              }
              className="w-40"
            />
          )}
          {(isSort || isFilter) && (
            <Checkbox label="ignorar caixa" checked={caseInsensitive} onChange={setCI} />
          )}
          {isFilter && <Checkbox label="inverter" checked={invert} onChange={setInvert} />}
        </>
      }
    />
  );
}
