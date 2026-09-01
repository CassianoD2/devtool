import { useCallback, useEffect, useState } from "react";
import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { CodeArea } from "../components/ui/CodeArea";
import { Button, Checkbox, CopyButton, Field, Select } from "../components/ui/primitives";
import {
  generateUuids,
  UUID_V5_DNS,
  UUID_V5_URL,
  type UuidVersion,
} from "../lib/uuid";

export function UuidTool() {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [namespace, setNamespace] = useState(UUID_V5_DNS);
  const [name, setName] = useState("exemplo.com");
  const [output, setOutput] = useState("");

  const regenerate = useCallback(() => {
    try {
      setOutput(
        generateUuids({ version, count, uppercase, hyphens, namespace, name }).join("\n"),
      );
    } catch (err) {
      setOutput((err as Error).message);
    }
  }, [version, count, uppercase, hyphens, namespace, name]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  return (
    <ToolBody
      toolbar={
        <>
          <Field label="Versão">
            <Select
              value={version}
              onChange={(e) => setVersion(e.currentTarget.value as UuidVersion)}
            >
              <option value="v4">v4 (aleatório)</option>
              <option value="v7">v7 (ordenável por tempo)</option>
              <option value="v1">v1 (timestamp + MAC)</option>
              <option value="v5">v5 (namespace + nome)</option>
              <option value="nil">nil</option>
            </Select>
          </Field>
          <Field label="Quantidade">
            <input
              type="number"
              min={1}
              max={1000}
              value={count}
              onChange={(e) => setCount(Number(e.currentTarget.value))}
              className="w-20 rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
            />
          </Field>
          <Checkbox label="Maiúsculas" checked={uppercase} onChange={setUppercase} />
          <Checkbox label="Com hífens" checked={hyphens} onChange={setHyphens} />
          <Button variant="primary" onClick={regenerate}>
            Gerar
          </Button>
          <div className="ml-auto">
            <CopyButton value={output} label="Copiar tudo" />
          </div>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-2">
        {version === "v5" && (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-surface-2 p-2">
            <Field label="Namespace">
              <Select
                value={namespace}
                onChange={(e) => setNamespace(e.currentTarget.value)}
              >
                <option value={UUID_V5_DNS}>DNS</option>
                <option value={UUID_V5_URL}>URL</option>
              </Select>
            </Field>
            <Field label="Nome">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                className="w-56 rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
              />
            </Field>
          </div>
        )}
        <PaneHeading title="Resultado" />
        <div className="flex min-h-0 flex-1 flex-col">
          <CodeArea value={output} readOnly />
        </div>
      </div>
    </ToolBody>
  );
}
