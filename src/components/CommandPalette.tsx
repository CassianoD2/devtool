import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Search } from "lucide-react";
import { TOOLS } from "../tools/registry";
import { CATEGORY_LABELS } from "../tools/types";

export interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  run: () => void;
}

interface Item {
  key: string;
  label: string;
  hint: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  haystack: string;
  run: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onSelectTool,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  onSelectTool: (id: string) => void;
  actions: PaletteAction[];
}) {
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo<Item[]>(() => {
    const toolItems: Item[] = TOOLS.map((t) => ({
      key: `tool:${t.id}`,
      label: t.name,
      hint: CATEGORY_LABELS[t.category],
      icon: t.icon,
      haystack: `${t.name} ${t.blurb} ${t.keywords.join(" ")} ${CATEGORY_LABELS[t.category]}`.toLowerCase(),
      run: () => onSelectTool(t.id),
    }));
    const actionItems: Item[] = actions.map((a) => ({
      key: `act:${a.id}`,
      label: a.label,
      hint: a.hint ?? "Ação",
      icon: a.icon,
      haystack: `${a.label} ${a.hint ?? ""} ação`.toLowerCase(),
      run: a.run,
    }));
    return [...actionItems, ...toolItems];
  }, [actions, onSelectTool]);

  const filtered = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return items;
    return items.filter((it) => terms.every((t) => it.haystack.includes(t)));
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setSel((s) => Math.min(s, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${sel}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  if (!open) return null;

  const runAt = (i: number) => {
    const it = filtered[i];
    if (!it) return;
    onClose();
    it.run();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-[about_.14s_ease-out] w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSel((s) => (s + 1) % Math.max(1, filtered.length));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSel((s) => (s - 1 + filtered.length) % Math.max(1, filtered.length));
          } else if (e.key === "Enter") {
            e.preventDefault();
            runAt(sel);
          } else if (e.key === "Escape") {
            onClose();
          }
        }}
      >
        <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
          <Search size={16} className="text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Buscar ferramenta ou ação…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
        </div>
        <div ref={listRef} className="max-h-[52vh] overflow-auto p-1.5">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-faint">Nada encontrado.</p>
          )}
          {filtered.map((it, i) => {
            const Icon = it.icon;
            return (
              <button
                key={it.key}
                data-idx={i}
                onMouseMove={() => setSel(i)}
                onClick={() => runAt(i)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                  i === sel ? "bg-accent-soft text-accent-soft-fg" : "text-muted"
                }`}
              >
                <Icon size={15} className={i === sel ? "text-accent" : "text-faint"} />
                <span className="flex-1 truncate text-ink">{it.label}</span>
                <span className="shrink-0 text-[11px] text-faint">{it.hint}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
