import { useEffect, useRef, useState } from "react";
import { History, Trash2 } from "lucide-react";

/** Dropdown com as últimas entradas de uma ferramenta. */
export function HistoryMenu({
  history,
  onPick,
  onClear,
}: {
  history: string[];
  onPick: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDoc);
    return () => window.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (history.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Histórico de entradas"
        className="grid size-6 place-items-center rounded text-faint transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <History size={14} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 max-h-72 w-80 overflow-auto rounded-lg border border-line bg-surface p-1 shadow-xl">
          {history.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                onPick(item);
                setOpen(false);
              }}
              className="block w-full truncate rounded px-2 py-1.5 text-left font-mono text-xs text-muted hover:bg-surface-2 hover:text-ink"
              title={item}
            >
              {item.replace(/\s+/g, " ").slice(0, 120)}
            </button>
          ))}
          <button
            onClick={() => {
              onClear();
              setOpen(false);
            }}
            className="mt-1 flex w-full items-center gap-1.5 rounded border-t border-line px-2 py-1.5 text-left text-xs text-faint hover:text-red-500"
          >
            <Trash2 size={12} />
            Limpar histórico
          </button>
        </div>
      )}
    </div>
  );
}
