import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ClipboardPaste, Cog, Info, Star, SunMoon, Wifi, X } from "lucide-react";
import { About } from "./components/About";
import { CommandPalette, type PaletteAction } from "./components/CommandPalette";
import { Settings } from "./components/Settings";
import { Sidebar } from "./components/Sidebar";
import { SplitPane } from "./components/ui/SplitPane";
import { ToastProvider } from "./components/ui/Toast";
import { Button } from "./components/ui/primitives";
import { CATEGORY_LABELS } from "./tools/types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useTheme } from "./hooks/useTheme";
import { useClipboardDetect } from "./hooks/useClipboardDetect";
import type { Suggestion } from "./lib/detect";
import { getAppVersion, isNewer, type ReleaseInfo } from "./lib/update";
import { TOOLS, TOOLS_BY_ID } from "./tools/registry";

function App() {
  const [activeId, setActiveId] = useLocalStorage("devtool:active", TOOLS[0].id);
  const [query, setQuery] = useState("");
  const [nonce, setNonce] = useState(0);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { hit, check, dismiss } = useClipboardDetect();
  const { dark, setTheme } = useTheme();

  const [foundRelease] = useLocalStorage<ReleaseInfo | null>("devtool:updates:release", null);
  const [appVer, setAppVer] = useState<string | null>(null);
  useEffect(() => {
    getAppVersion().then(setAppVer);
  }, []);
  const hasUpdate = !!foundRelease && !!appVer && isNewer(foundRelease.version, appVer);

  const [favorites, setFavorites] = useLocalStorage<string[]>("devtool:favorites", []);
  const [recents, setRecents] = useLocalStorage<string[]>("devtool:recents", []);
  const toggleFavorite = useCallback(
    (id: string) =>
      setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
    [setFavorites],
  );
  const selectTool = useCallback(
    (id: string) => {
      setActiveId(id);
      setRecents((r) => [id, ...r.filter((x) => x !== id)].slice(0, 8));
    },
    [setActiveId, setRecents],
  );

  const active = TOOLS_BY_ID.get(activeId) ?? TOOLS[0];

  const openSuggestion = useCallback(
    (s: Suggestion, text: string) => {
      try {
        localStorage.setItem(
          `devtool:draft:${s.draftKey ?? s.toolId}`,
          JSON.stringify(text),
        );
      } catch {
        /* ignore */
      }
      selectTool(s.toolId);
      setNonce((n) => n + 1);
      dismiss();
    },
    [selectTool, dismiss],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const paletteActions: PaletteAction[] = [
    {
      id: "theme",
      label: `Tema: mudar para ${dark ? "claro" : "escuro"}`,
      hint: "Aparência",
      icon: SunMoon,
      run: () => setTheme(dark ? "light" : "dark"),
    },
    {
      id: "favorite",
      label: favorites.includes(active.id)
        ? `Desfavoritar “${active.name}”`
        : `Favoritar “${active.name}”`,
      hint: "Barra lateral",
      icon: Star,
      run: () => toggleFavorite(active.id),
    },
    {
      id: "detect",
      label: "Colar e detectar ferramenta",
      hint: "Área de transferência",
      icon: ClipboardPaste,
      run: () => check(true),
    },
    { id: "settings", label: "Abrir Configurações", hint: "Ação", icon: Cog, run: () => setSettingsOpen(true) },
    { id: "about", label: "Abrir Sobre", hint: "Ação", icon: Info, run: () => setAboutOpen(true) },
  ];

  const ActiveIcon = active.icon;
  const mainPane = (
    <main className="flex h-full w-full min-w-0 flex-col bg-surface">
      <header className="flex items-center gap-3 border-b border-line px-6 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-muted">
          <ActiveIcon size={17} />
        </span>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-wide text-muted uppercase">
            {CATEGORY_LABELS[active.category]}
          </div>
          <h1 className="truncate text-[15px] leading-tight font-semibold text-ink">
            {active.name}
          </h1>
        </div>
        <button
          onClick={() => toggleFavorite(active.id)}
          title={favorites.includes(active.id) ? "Desfavoritar" : "Favoritar"}
          aria-label={favorites.includes(active.id) ? "Desfavoritar" : "Favoritar"}
          className={`grid size-7 shrink-0 place-items-center rounded-md border transition-colors ${
            favorites.includes(active.id)
              ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
              : "border-line-strong bg-surface-2 text-faint hover:text-amber-500"
          }`}
        >
          <Star size={14} fill={favorites.includes(active.id) ? "currentColor" : "none"} />
        </button>
        <p className="ml-2 hidden truncate text-sm text-muted xl:block">{active.blurb}</p>
        {active.needsInternet && (
          <span
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
            title="Esta ferramenta faz requisições de rede"
          >
            <Wifi size={13} />
            Conexão com internet necessária
          </span>
        )}
      </header>

      {hit && (
        <div className="flex flex-wrap items-center gap-2 border-b border-accent/30 bg-accent-soft px-6 py-2 text-sm">
          <ClipboardPaste size={15} className="text-accent" />
          <span className="text-accent-soft-fg">
            Área de transferência: {hit.suggestions[0].label}
          </span>
          {hit.suggestions.map((s) => (
            <Button
              key={s.toolId}
              variant="primary"
              size="sm"
              onClick={() => openSuggestion(s, hit.text)}
            >
              Abrir em {TOOLS_BY_ID.get(s.toolId)?.name ?? s.toolId}
            </Button>
          ))}
          <button
            onClick={dismiss}
            className="ml-auto grid size-6 place-items-center rounded-md text-accent-soft-fg/70 hover:bg-accent/10 hover:text-accent-soft-fg"
            aria-label="Dispensar"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden p-6">
        <Suspense
          fallback={
            <div className="grid h-full place-items-center text-sm text-faint">
              Carregando…
            </div>
          }
        >
          <active.Component key={`${active.id}:${nonce}`} />
        </Suspense>
      </div>
    </main>
  );

  return (
    <ToastProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-bg text-ink">
        <SplitPane
          storageKey="sidebar"
          mode="pixels"
          initial={256}
          minPx={190}
          maxPx={460}
          className="h-full w-full"
          first={
            <Sidebar
              ref={searchRef}
              activeId={active.id}
              onSelect={selectTool}
              query={query}
              onQueryChange={setQuery}
              onDetectClipboard={() => check(true)}
              onAbout={() => setAboutOpen(true)}
              onSettings={() => setSettingsOpen(true)}
              hasUpdate={hasUpdate}
              favorites={favorites}
              recents={recents}
              onToggleFavorite={toggleFavorite}
            />
          }
          second={mainPane}
        />
      </div>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectTool={selectTool}
        actions={paletteActions}
      />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <About open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </ToastProvider>
  );
}

export default App;
