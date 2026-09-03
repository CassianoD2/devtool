import { useState } from "react";
import { TransformTool } from "../components/TransformTool";
import { Checkbox, Field, Segmented, Select } from "../components/ui/primitives";
import {
  base32EncodeText,
  base32DecodeText,
  base58EncodeText,
  base58DecodeText,
} from "../lib/basenc";

export function BasencTool() {
  const [base, setBase] = useState<"32" | "58">("32");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [pad, setPad] = useState(true);

  return (
    <TransformTool
      toolId="basenc"
      sample={mode === "encode" ? "Olá, mundo!" : base === "32" ? "JRUE4L2SN5RGK3TU" : "2NEpo7TZRRrLZSi2U"}
      deps={[base, mode, pad]}
      transform={(input) => {
        if (base === "32") {
          return mode === "encode" ? base32EncodeText(input, pad) : base32DecodeText(input);
        }
        return mode === "encode" ? base58EncodeText(input) : base58DecodeText(input);
      }}
      toolbar={
        <>
          <Field label="Base">
            <Select value={base} onChange={(e) => setBase(e.currentTarget.value as "32" | "58")}>
              <option value="32">Base32 (RFC 4648)</option>
              <option value="58">Base58 (Bitcoin)</option>
            </Select>
          </Field>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "encode", label: "Codificar" },
              { value: "decode", label: "Decodificar" },
            ]}
          />
          {base === "32" && mode === "encode" && (
            <Checkbox label="padding =" checked={pad} onChange={setPad} />
          )}
        </>
      }
    />
  );
}
