import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { Button, CopyButton, ErrorNote } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { parseCidr } from "../lib/cidr";

const PRESETS = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/24", "192.168.15.37/22"];

export function CidrTool() {
  const [input, setInput] = useToolDraft("cidr", "192.168.0.0/24");

  let info: ReturnType<typeof parseCidr> | null = null;
  let error: string | null = null;
  try {
    if (input.trim()) info = parseCidr(input);
  } catch (err) {
    error = (err as Error).message;
  }

  const rows: [string, string][] = info
    ? [
        ["Rede (CIDR)", info.cidr],
        ["Endereço", info.address],
        ["Máscara", info.netmask],
        ["Wildcard", info.wildcard],
        ["Rede", info.network],
        ["Broadcast", info.broadcast],
        ["Primeiro host", info.firstHost],
        ["Último host", info.lastHost],
        ["Total de endereços", info.hostCount.toLocaleString("pt-BR")],
        ["Hosts utilizáveis", info.usableCount.toLocaleString("pt-BR")],
        ["Classe", info.ipClass],
        ["Tipo", info.type],
      ]
    : [];

  return (
    <ToolBody
      toolbar={
        <>
          {PRESETS.map((p) => (
            <Button key={p} variant="ghost" onClick={() => setInput(p)}>
              {p}
            </Button>
          ))}
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <PaneHeading title="IP / CIDR" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="192.168.0.10/24  ·  10.0.0.0 255.255.255.0"
            className="rounded-md border border-line bg-surface px-3 py-2 font-mono text-base dark:border-line"
          />
        </div>

        {error && <ErrorNote message={error} />}

        {info && (
          <div className="overflow-hidden rounded-md border border-line">
            <table className="w-full text-sm">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr
                    key={k}
                    className="border-b border-line last:border-0"
                  >
                    <td className="w-48 px-3 py-2 font-medium text-muted">{k}</td>
                    <td className="px-3 py-2 font-mono">{v}</td>
                    <td className="px-1 py-1 text-right">
                      <CopyButton value={v} label="⧉" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ToolBody>
  );
}
