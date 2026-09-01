import { useEffect } from "react";
import { Monitor, Moon, RotateCcw, Settings as Gear, Sun, Trash2, X } from "lucide-react";
import { useTheme, type ThemePref } from "../hooks/useTheme";
import { Button } from "./ui/primitives";
import { useToast } from "./ui/Toast";

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
              requests salvos e histórico do API Client, variáveis, tamanhos de painel.
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
        </div>
      </div>
    </div>
  );
}
