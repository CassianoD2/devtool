import { useCallback, useEffect, useState } from "react";
import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { Button, Checkbox, CopyButton, Field, Segmented } from "../components/ui/primitives";
import { generateLorem, type LoremUnit } from "../lib/lorem";

export function LoremTool() {
  const [unit, setUnit] = useState<LoremUnit>("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState("");

  const generate = useCallback(() => {
    setOutput(generateLorem({ unit, count, startWithLorem }));
  }, [unit, count, startWithLorem]);

  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <ToolBody
      toolbar={
        <>
          <Segmented
            value={unit}
            onChange={setUnit}
            options={[
              { value: "paragraphs", label: "Parágrafos" },
              { value: "sentences", label: "Frases" },
              { value: "words", label: "Palavras" },
            ]}
          />
          <Field label="Quantidade">
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(Number(e.currentTarget.value))}
              className="w-20 rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
            />
          </Field>
          <Checkbox
            label="Começar com “Lorem ipsum”"
            checked={startWithLorem}
            onChange={setStartWithLorem}
          />
          <Button variant="primary" onClick={generate}>
            Gerar
          </Button>
          <div className="ml-auto">
            <CopyButton value={output} />
          </div>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-1.5">
        <PaneHeading title="Texto" />
        <textarea
          readOnly
          value={output}
          className="min-h-0 flex-1 resize-y rounded-md border border-line bg-surface p-3 text-sm leading-relaxed dark:border-line"
        />
      </div>
    </ToolBody>
  );
}
