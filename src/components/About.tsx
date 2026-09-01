import { useEffect, useState } from "react";
import { Code2, Globe, Mail, Wrench, X } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { isTauri } from "../lib/http";
import { TOOLS } from "../tools/registry";
import { Button } from "./ui/primitives";

/**
 * ▸▸▸ Edite este bloco para ajustar o "Sobre". ◂◂◂
 * É a única coisa que precisa mudar para personalizar seus dados.
 */
const DEV = {
  name: "Cassiano Mesquita",
  role: "Desenvolvedor",
  blurb:
    "Desenvolvedor back-end e de automações. Curto scripts de shell, infraestrutura e ferramentas que tiram atrito do dia a dia. O DevTool nasceu para não precisar abrir cinco sites (e o Postman) toda vez.",
  location: "Brasil",
  email: "cassianomesquita@hotmail.com",
  emailBackup: "cassianomesquita@gmail.com", // "" para esconder
  github: "https://github.com/cassianod2",
  site: "https://cassianomesquita.dev",
};

const STACK = ["Tauri 2", "Rust", "React 19", "TypeScript", "Tailwind v4", "Vite"];

async function open(url: string) {
  try {
    if (isTauri()) await openUrl(url);
    else window.open(url, "_blank");
  } catch {
    /* ignore */
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function About({ open: isOpen, onClose }: { open: boolean; onClose: () => void }) {
  const [version, setVersion] = useState("0.1.0");

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    if (isTauri()) {
      import("@tauri-apps/api/app")
        .then((m) => m.getVersion())
        .then(setVersion)
        .catch(() => {});
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-[about_.16s_ease-out] w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="relative flex items-center gap-3 border-b border-line bg-surface-2 px-5 py-4">
          <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-fg">
            <Wrench size={20} />
          </span>
          <div>
            <div className="text-[15px] font-semibold text-ink">DevTool</div>
            <div className="text-xs text-muted">
              Canivete suíço para desenvolvimento · v{version}
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 grid size-7 place-items-center rounded-md text-faint hover:bg-surface hover:text-ink"
            aria-label="Fechar"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <p className="text-sm leading-relaxed text-muted">
            {TOOLS.length} ferramentas offline (formatadores, encoders, consultas
            BR, rede, texto) num app nativo leve — sem Electron, sem servidor.
          </p>

          {/* developer */}
          <div className="rounded-xl border border-line p-4">
            <div className="mb-1 text-[11px] font-semibold tracking-wide text-faint uppercase">
              Desenvolvido por
            </div>
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent-soft-fg">
                {initials(DEV.name)}
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-ink">{DEV.name}</div>
                <div className="text-xs text-muted">
                  {DEV.role}
                  {DEV.location ? ` · ${DEV.location}` : ""}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{DEV.blurb}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {DEV.email && (
                <Button size="sm" onClick={() => open(`mailto:${DEV.email}`)}>
                  <Mail size={14} />
                  E-mail
                </Button>
              )}
              {DEV.github && (
                <Button size="sm" onClick={() => open(DEV.github)}>
                  <Code2 size={14} />
                  GitHub
                </Button>
              )}
              {DEV.site && (
                <Button size="sm" onClick={() => open(DEV.site)}>
                  <Globe size={14} />
                  Site
                </Button>
              )}
            </div>
            {DEV.emailBackup && (
              <button
                onClick={() => open(`mailto:${DEV.emailBackup}`)}
                className="mt-2 text-xs text-faint transition-colors hover:text-muted"
              >
                backup: {DEV.emailBackup}
              </button>
            )}
          </div>

          {/* stack */}
          <div>
            <div className="mb-2 text-[11px] font-semibold tracking-wide text-faint uppercase">
              Feito com
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STACK.map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-inset px-2 py-0.5 text-xs font-medium text-muted"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes about{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
