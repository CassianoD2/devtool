import { useState } from "react";
import { TransformTool } from "../components/TransformTool";
import { Checkbox, Field, Input } from "../components/ui/primitives";
import { slugifyLines } from "../lib/slugify";

const SAMPLE = "Meu Primeiro Post — Olá, Mundo!\nConfigurações de Rede (avançado)";

export function SlugifyTool() {
  const [separator, setSeparator] = useState("-");
  const [lowercase, setLowercase] = useState(true);
  const [stripDiacritics, setStrip] = useState(true);
  const [strict, setStrict] = useState(true);
  const [maxLength, setMaxLength] = useState("");

  return (
    <TransformTool
      toolId="slugify"
      sample={SAMPLE}
      deps={[separator, lowercase, stripDiacritics, strict, maxLength]}
      transform={(input) =>
        slugifyLines(input, {
          separator,
          lowercase,
          stripDiacritics,
          strict,
          maxLength: Number(maxLength) || 0,
        })
      }
      inputPlaceholder="Um título por linha…"
      toolbar={
        <>
          <Field label="Separador">
            <Input
              value={separator}
              onChange={(e) => setSeparator(e.currentTarget.value)}
              className="w-14"
            />
          </Field>
          <Field label="Máx.">
            <Input
              type="number"
              min={0}
              value={maxLength}
              onChange={(e) => setMaxLength(e.currentTarget.value)}
              placeholder="0"
              className="w-16"
            />
          </Field>
          <Checkbox label="minúsculas" checked={lowercase} onChange={setLowercase} />
          <Checkbox label="sem acento" checked={stripDiacritics} onChange={setStrip} />
          <Checkbox label="estrito (só a-z0-9)" checked={strict} onChange={setStrict} />
        </>
      }
    />
  );
}
