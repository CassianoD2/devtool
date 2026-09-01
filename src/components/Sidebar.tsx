import { forwardRef, useMemo } from "react";
import { ClipboardPaste, Info, Search, Wrench } from "lucide-react";
import { TOOLS } from "../tools/registry";
import { CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_ORDER, type Tool } from "../tools/types";

function matches(tool: Tool, q: string): boolean {
  const hay = `${tool.name} ${tool.blurb} ${tool.keywords.join(" ")}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

export const Sidebar = forwardRef<
  HTMLInputElement,
  {
    activeId: string;
    onSelect: (id: string) => void;
    query: string;
    onQueryChange: (q: string) => void;
    onDetectClipboard: () => void;
    onAbout: () => void;
  }
>(function Sidebar(
  { activeId, onSelect, query, onQueryChange, onDetectClipboard, onAbout },
  searchRef,
) {
  const filtered = useMemo(
    () => (query.trim() ? TOOLS.filter((t) => matches(t, query)) : TOOLS),
    [query],
  );

  return (
    <aside className="flex h-full w-full flex-col border-r border-line bg-surface-2">
      <div className="flex flex-col gap-2.5 p-3">
        <div className="flex items-center gap-2 px-0.5">
          <span className="grid size-6 place-items-center rounded-md bg-accent text-accent-fg">
            <Wrench size={14} />
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">DevTool</span>
        </div>

        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint"
          />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => onQueryChange(e.currentTarget.value)}
            placeholder="Buscar   ⌘K"
            className="h-8 w-full rounded-md border border-line bg-surface pr-2 pl-8 text-sm text-ink transition-colors placeholder:text-faint hover:border-line-strong"
          />
        </div>

        <button
          onClick={onDetectClipboard}
          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <ClipboardPaste size={13} />
          Detectar da área de transferência
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {CATEGORY_ORDER.map((cat) => {
          const tools = filtered.filter((t) => t.category === cat);
          if (tools.length === 0) return null;
          const CatIcon = CATEGORY_ICONS[cat];
          return (
            <div key={cat} className="mb-4">
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold tracking-wide text-faint uppercase">
                <CatIcon size={12} />
                {CATEGORY_LABELS[cat]}
              </div>
              <div className="mt-0.5 flex flex-col gap-px">
                {tools.map((t) => {
                  const active = t.id === activeId;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onSelect(t.id)}
                      className={`group relative flex items-center gap-2 rounded-md py-1.5 pr-2 pl-2.5 text-left text-sm transition-colors ${
                        active
                          ? "bg-accent-soft font-medium text-accent-soft-fg"
                          : "text-muted hover:bg-surface hover:text-ink"
                      }`}
                    >
                      {active && (
                        <span className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
                      )}
                      <Icon
                        size={15}
                        className={active ? "text-accent" : "text-faint group-hover:text-muted"}
                      />
                      <span className="truncate">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-faint">Nada encontrado.</p>
        )}
      </nav>

      <div className="border-t border-line p-2">
        <button
          onClick={onAbout}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <Info size={15} className="text-faint" />
          Sobre
        </button>
      </div>
    </aside>
  );
});
