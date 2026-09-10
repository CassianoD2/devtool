import { Eye, EyeOff } from "lucide-react";
import { inputCls } from "./shared";

export interface KVBase {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  secret?: boolean;
}

/**
 * Tabela editável de chave/valor. Genérica: serve params, headers, form,
 * multipart, vars de ambiente e globais. Campos extra do objeto (ex.: `kind`
 * do multipart) são preservados pelo spread em cada patch.
 */
export function KVEditor<T extends KVBase>({
  rows,
  onChange,
  emptyRow,
  withToggle = true,
  withSecret = false,
  keyPlaceholder = "chave",
  valuePlaceholder = "valor",
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  emptyRow: () => T;
  withToggle?: boolean;
  withSecret?: boolean;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const withBlank: T[] = rows.some((r) => !r.key && !r.value) ? rows : [...rows, emptyRow()];

  const patch = (id: string, p: Partial<T>) => {
    let next: T[] = withBlank.map((r) => (r.id === id ? { ...r, ...p } : r));
    if (next.every((r) => r.key || r.value)) next = [...next, emptyRow()];
    onChange(next);
  };
  const remove = (id: string) => {
    const next = withBlank.filter((r) => r.id !== id);
    onChange(next.length ? next : [emptyRow()]);
  };

  return (
    <table className="w-full text-sm">
      <tbody>
        {withBlank.map((r) => (
          <tr key={r.id} className="border-b border-line last:border-0">
            {withToggle && (
              <td className="w-8 px-2 py-1 text-center">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--color-accent)]"
                  checked={r.enabled}
                  onChange={(e) => patch(r.id, { enabled: e.currentTarget.checked } as Partial<T>)}
                />
              </td>
            )}
            <td className="py-1 pr-1">
              <input
                value={r.key}
                onChange={(e) => patch(r.id, { key: e.currentTarget.value } as Partial<T>)}
                placeholder={keyPlaceholder}
                className={`w-full font-mono ${inputCls}`}
              />
            </td>
            <td className="py-1 pr-1">
              <input
                value={r.value}
                type={withSecret && r.secret ? "password" : "text"}
                onChange={(e) => patch(r.id, { value: e.currentTarget.value } as Partial<T>)}
                placeholder={valuePlaceholder}
                className={`w-full font-mono ${inputCls}`}
              />
            </td>
            {withSecret && (
              <td className="w-8 px-1 text-center">
                <button
                  onClick={() => patch(r.id, { secret: !r.secret } as Partial<T>)}
                  className="text-faint hover:text-ink"
                  aria-label={r.secret ? "Mostrar valor" : "Marcar como secreto"}
                  title={r.secret ? "Secreto (mascarado)" : "Marcar como secreto"}
                >
                  {r.secret ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </td>
            )}
            <td className="w-8 px-1 text-center">
              <button
                onClick={() => remove(r.id)}
                className="text-faint hover:text-red-500"
                aria-label="remover"
              >
                ✕
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
