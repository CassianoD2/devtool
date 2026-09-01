import { useState } from "react";
import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { CodeArea } from "../components/ui/CodeArea";
import { CopyButton, ErrorNote, Field, Segmented } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { buildPixCode, parsePixCode, type PixField } from "../lib/pix";

const inputCls =
 "rounded-md border border-line-strong bg-surface-2 px-2 py-1.5 text-sm";

function flatten(
  fields: PixField[],
  depth = 0,
): { id: string; name: string; value: string; depth: number }[] {
  return fields.flatMap((f) => [
    { id: f.id, name: f.name, value: f.children ? "" : f.value, depth },
    ...(f.children ? flatten(f.children, depth + 1) : []),
  ]);
}

function FieldRows({ fields }: { fields: PixField[] }) {
  return (
    <>
      {flatten(fields).map((row, i) => (
        <tr
          key={`${row.id}-${i}`}
          className="border-b border-line last:border-0"
        >
          <td
            className="px-3 py-1.5 font-mono text-faint"
            style={{ paddingLeft: 12 + row.depth * 16 }}
          >
            {row.id}
          </td>
          <td className="px-3 py-1.5">{row.name}</td>
          <td className="px-3 py-1.5 font-mono break-all">{row.value}</td>
        </tr>
      ))}
    </>
  );
}

export function PixTool() {
  const [mode, setMode] = useState<"build" | "decode">("build");

  // build
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [amount, setAmount] = useState("");
  const [txid, setTxid] = useState("");
  const [description, setDescription] = useState("");

  let built = "";
  let buildErr: string | null = null;
  if (mode === "build" && key.trim()) {
    try {
      built = buildPixCode({ key, merchantName: name, merchantCity: city, amount, txid, description });
    } catch (err) {
      buildErr = (err as Error).message;
    }
  }

  // decode
  const [code, setCode] = useToolDraft("pix-decode");
  let decoded: ReturnType<typeof parsePixCode> | null = null;
  let decodeErr: string | null = null;
  if (mode === "decode" && code.trim()) {
    try {
      decoded = parsePixCode(code);
    } catch (err) {
      decodeErr = (err as Error).message;
    }
  }

  return (
    <ToolBody
      toolbar={
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "build", label: "Gerar" },
            { value: "decode", label: "Decodificar" },
          ]}
        />
      }
    >
      {mode === "build" ? (
        <div className="flex h-full min-h-0 flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Chave PIX *">
              <input value={key} onChange={(e) => setKey(e.currentTarget.value)} placeholder="e-mail, CPF/CNPJ, telefone, aleatória" className={`w-full ${inputCls}`} />
            </Field>
            <Field label="Nome do recebedor">
              <input value={name} onChange={(e) => setName(e.currentTarget.value)} maxLength={25} className={`w-full ${inputCls}`} />
            </Field>
            <Field label="Cidade">
              <input value={city} onChange={(e) => setCity(e.currentTarget.value)} maxLength={15} className={`w-full ${inputCls}`} />
            </Field>
            <Field label="Valor (opcional)">
              <input value={amount} onChange={(e) => setAmount(e.currentTarget.value)} inputMode="decimal" placeholder="0.00" className={`w-full ${inputCls}`} />
            </Field>
            <Field label="txid (opcional)">
              <input value={txid} onChange={(e) => setTxid(e.currentTarget.value)} maxLength={25} className={`w-full ${inputCls}`} />
            </Field>
            <Field label="Descrição (opcional)">
              <input value={description} onChange={(e) => setDescription(e.currentTarget.value)} maxLength={40} className={`w-full ${inputCls}`} />
            </Field>
          </div>

          {buildErr && <ErrorNote message={buildErr} />}

          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <PaneHeading title="Copia e Cola" actions={<CopyButton value={built} />} />
            <CodeArea value={built} readOnly />
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <PaneHeading title="Código PIX" />
            <textarea
              autoFocus
              value={code}
              onChange={(e) => setCode(e.currentTarget.value)}
              placeholder="Cole o código copia e cola…"
              className="h-24 resize-y rounded-md border border-line-strong bg-surface-2 p-3 font-mono text-xs"
            />
          </div>
          {decodeErr && <ErrorNote message={decodeErr} />}
          {decoded && (
            <div className="min-h-0 flex-1 overflow-auto rounded-md border border-line">
              <div
                className={`px-3 py-2 text-sm font-medium ${
 decoded.crcValid
                    ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                    : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                }`}
              >
                {decoded.crcValid
                  ? `✓ CRC16 válido (${decoded.crcFound})`
                  : `✗ CRC16 confere? encontrado ${decoded.crcFound}, esperado ${decoded.crcExpected}`}
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <FieldRows fields={decoded.fields} />
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </ToolBody>
  );
}
