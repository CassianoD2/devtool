import { useEffect, useState } from "react";
import {
  Download,
  Monitor,
  Moon,
  RefreshCw,
  RotateCcw,
  Settings as Gear,
  Sun,
  Trash2,
  Wifi,
  X,
} from "lucide-react";
import { useTheme, type ThemePref } from "../hooks/useTheme";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { copyToClipboard } from "../lib/clipboard";
import { openExternal } from "../lib/http";
import {
  fetchLatestRelease,
  getAppVersion,
  isNewer,
  type ReleaseInfo,
} from "../lib/update";
import { Button } from "./ui/primitives";
import { useToast } from "./ui/Toast";

type UpdateStatus = "idle" | "checking" | "current" | "available" | "error";

function clearKeys(prefix: string) {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
  return keys.length;
}

const THEME_OPTS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold tracking-wide text-faint uppercase">
        {title}
      </div>
      {children}
    </div>
  );
}

export function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme, dark } = useTheme();
  const toast = useToast();

  const [upStatus, setUpStatus] = useState<UpdateStatus>("idle");
  const [release, setRelease] = useLocalStorage<ReleaseInfo | null>(
    "devtool:updates:release",
    null,
  );
  const [current, setCurrent] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) getAppVersion().then(setCurrent);
  }, [open]);

  useEffect(() => {
    if (open && release && current && isNewer(release.version, current)) {
      setUpStatus("available");
    }
  }, [open, release, current]);

  async function checkUpdates() {
    setUpStatus("checking");
    setShowNotes(false);
    try {
      const latest = await fetchLatestRelease();
      const cur = current ?? (await getAppVersion());
      if (cur && isNewer(latest.version, cur)) {
        setRelease(latest);
        setUpStatus("available");
      } else {
        setRelease(null);
        setUpStatus("current");
      }
    } catch {
      setUpStatus("error");
    }
  }

  async function openRelease() {
    if (!release) return;
    const ok = await openExternal(release.url);
    if (ok) {
      toast("Abrindo a página do release no navegador…");
    } else if (await copyToClipboard(release.url).then(() => true).catch(() => false)) {
      toast("Não abriu o navegador — link copiado.", "error");
    } else {
      toast("Não foi possível abrir nem copiar o link.", "error");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-[about_.16s_ease-out] w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center gap-3 border-b border-line bg-surface-2 px-5 py-4">
          <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-fg">
            <Gear size={19} />
          </span>
          <div className="text-[15px] font-semibold text-ink">Configurações</div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 grid size-7 place-items-center rounded-md text-faint hover:bg-surface hover:text-ink"
            aria-label="Fechar"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-6 px-5 py-5">
          <Section title="Aparência">
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTS.map((o) => {
                const Icon = o.icon;
                const active = theme === o.value;
                return (
                  <button
                    key={o.value}
                    onClick={() => setTheme(o.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-sm transition-colors ${
                      active
                        ? "border-accent bg-accent-soft text-accent-soft-fg"
                        : "border-line-strong bg-surface-2 text-muted hover:border-faint hover:text-ink"
                    }`}
                  >
                    <Icon size={18} />
                    {o.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-faint">
              Tema atual: {dark ? "escuro" : "claro"}
              {theme === "system" ? " (seguindo o sistema)" : ""}.
            </p>
          </Section>

          <Section title="Layout">
            <Button
              onClick={() => {
                const n = clearKeys("devtool:split:");
                toast(`${n} divisória(s) restaurada(s)`);
                setTimeout(() => window.location.reload(), 400);
              }}
            >
              <RotateCcw size={14} />
              Restaurar tamanhos dos painéis
            </Button>
          </Section>

          <Section title="Dados">
            <p className="mb-2 text-xs text-faint">
              Tudo fica só neste computador (localStorage): entradas das ferramentas,
              requests salvos e histórico do API Client, variáveis, tamanhos de painel,
              Anotações e Tarefas. As Anotações e Tarefas têm{" "}
              <span className="text-muted">Exportar / Importar</span> próprio na barra
              da ferramenta — use antes de limpar.
            </p>
            <Button
              variant="danger"
              onClick={() => {
                if (
                  !window.confirm(
                    "Apagar TODOS os dados salvos do DevTool (drafts, requests, histórico, variáveis, layout)? Não dá pra desfazer.",
                  )
                )
                  return;
                const keep = localStorage.getItem("devtool:theme");
                clearKeys("devtool:");
                if (keep) localStorage.setItem("devtool:theme", keep);
                window.location.reload();
              }}
            >
              <Trash2 size={14} />
              Limpar dados salvos
            </Button>
          </Section>

          <Section title="Atualizações">
            <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
              Verifica as releases publicadas no GitHub. Nada é baixado sozinho.
              <span
                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 dark:text-emerald-400"
                title="Só esta ação usa a internet"
              >
                <Wifi size={11} />
                requer internet
              </span>
            </p>
            <Button onClick={checkUpdates} disabled={upStatus === "checking"}>
              <RefreshCw
                size={14}
                className={upStatus === "checking" ? "animate-spin" : ""}
              />
              {upStatus === "checking" ? "Verificando…" : "Verificar agora"}
            </Button>

            {upStatus === "current" && (
              <p className="mt-2 text-xs text-faint">
                Você está na versão mais recente{current ? ` (v${current})` : ""}.
              </p>
            )}
            {upStatus === "error" && (
              <p className="mt-2 text-xs text-red-500">
                Não foi possível verificar (sem conexão?).
              </p>
            )}
            {upStatus === "available" && release && (
              <div className="mt-2 rounded-lg border border-accent bg-accent-soft p-3">
                <div className="text-sm font-medium text-ink">
                  Nova versão: v{release.version}
                </div>
                {current && (
                  <div className="text-xs text-muted">Você tem a v{current}.</div>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" onClick={openRelease}>
                    <Download size={14} />
                    Baixar
                  </Button>
                  {release.notes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotes((s) => !s)}
                    >
                      {showNotes ? "Ocultar notas" : "Ver notas"}
                    </Button>
                  )}
                </div>
                {showNotes && release.notes && (
                  <pre className="mt-2 max-h-48 overflow-auto rounded border border-line bg-surface p-2 text-[11px] leading-relaxed whitespace-pre-wrap text-muted">
                    {release.notes}
                  </pre>
                )}
                <button
                  type="button"
                  onClick={openRelease}
                  className="mt-2 block max-w-full truncate text-left text-[11px] text-faint hover:text-accent"
                  title={release.url}
                >
                  {release.url}
                </button>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
