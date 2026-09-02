import { forwardRef, useEffect, useMemo } from "react";
import { ChevronRight, ClipboardPaste, Info, Search, Settings, Wifi, Wrench } from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { TOOLS } from "../tools/registry";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type Tool,
  type ToolCategory,
} from "../tools/types";

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
    onSettings: () => void;
    hasUpdate?: boolean;
  }
>(function Sidebar(
  {
    activeId,
    onSelect,
    query,
    onQueryChange,
    onDetectClipboard,
    onAbout,
    onSettings,
    hasUpdate,
  },
  searchRef,
) {
  const [collapsed, setCollapsed] = useLocalStorage<Partial<Record<ToolCategory, boolean>>>(
    "devtool:sidebar:collapsed",
    {},
  );

  const searching = query.trim().length > 0;
  const filtered = useMemo(
    () => (searching ? TOOLS.filter((t) => matches(t, query)) : TOOLS),
    [query, searching],
  );

  const activeCat = TOOLS.find((t) => t.id === activeId)?.category;

  const visibleCats = useMemo(
    () => CATEGORY_ORDER.filter((c) => filtered.some((t) => t.category === c)),
    [filtered],
  );

  // ao trocar de ferramenta, garante que a categoria dela esteja aberta
  useEffect(() => {
    if (activeCat && collapsed[activeCat]) {
      setCollapsed((c) => ({ ...c, [activeCat]: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const allCollapsed = CATEGORY_ORDER.every((c) => collapsed[c]);
  const toggleAll = () => {
    const next = !allCollapsed;
    setCollapsed(Object.fromEntries(CATEGORY_ORDER.map((c) => [c, next])));
  };

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
            className="h-8 w-full rounded-md border border-line-strong bg-surface pr-2 pl-8 text-sm text-ink transition-colors placeholder:text-faint hover:border-faint"
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
        {!searching && (
          <div className="flex justify-end px-2 pb-1">
            <button
              onClick={toggleAll}
              className="rounded px-1.5 py-0.5 text-[11px] text-faint underline decoration-dotted underline-offset-2 transition-colors hover:bg-surface hover:text-accent"
            >
              {allCollapsed ? "expandir tudo" : "recolher tudo"}
            </button>
          </div>
        )}

        {visibleCats.map((cat, i) => {
          const tools = filtered.filter((t) => t.category === cat);
          const CatIcon = CATEGORY_ICONS[cat];
          const open = searching || !collapsed[cat];
          const activeHere = cat === activeCat;
          return (
            <div
              key={cat}
              className={i > 0 ? "mt-2 border-t border-line pt-2" : ""}
            >
              <button
                onClick={() =>
                  !searching && setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))
                }
                className={`group flex w-full items-center gap-1.5 rounded-md border border-transparent px-2 py-1.5 text-[11px] font-semibold tracking-wide uppercase transition-colors hover:border-line hover:bg-surface hover:text-ink ${
                  activeHere ? "text-ink" : "text-muted"
                }`}
              >
                <span
                  className={`grid size-4 shrink-0 place-items-center rounded-sm transition-colors group-hover:bg-inset group-hover:text-accent ${
                    activeHere ? "text-ink" : "text-muted"
                  }`}
                >
                  <ChevronRight
                    size={12}
                    className={`transition-transform ${open ? "rotate-90" : ""}`}
                  />
                </span>
                <CatIcon
                  size={12}
                  className={`shrink-0 ${activeHere ? "text-ink" : "text-muted"}`}
                />
                <span className="flex-1 truncate text-left">{CATEGORY_LABELS[cat]}</span>
                {!open && (
                  <span className="rounded bg-inset px-1.5 py-0.5 text-[10px] font-bold normal-case text-ink">
                    {tools.length}
                  </span>
                )}
              </button>

              {open && (
                <div className="mt-1 mb-1 flex flex-col gap-px">
                  {tools.map((t) => {
                    const active = t.id === activeId;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onSelect(t.id)}
                        className={`group relative flex items-center gap-2 rounded-md py-1.5 pr-2 pl-2.5 text-left text-sm transition-colors ${
                          active
                            ? "bg-accent-soft font-medium text-accent-soft-fg ring-1 ring-inset ring-accent/25"
                            : "text-muted hover:bg-surface hover:text-ink"
                        }`}
                      >
                        {active && (
                          <span className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-accent" />
                        )}
                        <Icon
                          size={15}
                          className={
                            active ? "text-accent" : "text-muted group-hover:text-ink"
                          }
                        />
                        <span className="truncate">{t.name}</span>
                        {t.needsInternet && (
                          <Wifi
                            size={12}
                            className="ml-auto shrink-0 text-emerald-500"
                            aria-label="Requer internet"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-faint">Nada encontrado.</p>
        )}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-line p-2">
        <button
          onClick={onSettings}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <Settings size={15} className="text-faint" />
          Configurações
          {hasUpdate && (
            <span
              className="ml-auto size-2 rounded-full bg-accent"
              title="Atualização disponível"
            />
          )}
        </button>
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
