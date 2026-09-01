import { useMemo, useState } from "react";
import { Pin, PinOff, Plus, Sparkles, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ToolBody } from "../components/ToolLayout";
import { SplitPane } from "../components/ui/SplitPane";
import { MarkdownEditor } from "../components/ui/MarkdownEditor";
import { BackupButtons } from "../components/ui/BackupButtons";
import { Button, CopyButton, ErrorNote } from "../components/ui/primitives";
import { useToast } from "../components/ui/Toast";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { copyToClipboard } from "../lib/clipboard";
import {
  createNote,
  noteTitle,
  removeNote,
  searchNotes,
  sortNotes,
  updateNote,
  wordCount,
  type Note,
} from "../lib/notes";

export function NotesTool() {
  const toast = useToast();
  const [notes, setNotes] = useLocalStorage<Note[]>("devtool:notes", []);
  const [activeId, setActiveId] = useLocalStorage<string>("devtool:notes:active", "");
  const [query, setQuery] = useState("");
  const [fmtError, setFmtError] = useState<string | null>(null);

  const list = useMemo(
    () => sortNotes(searchNotes(notes, query)),
    [notes, query],
  );
  const active = notes.find((n) => n.id === activeId) ?? list[0];

  function newNote() {
    const n = createNote();
    setNotes((prev) => [n, ...prev]);
    setActiveId(n.id);
    setQuery("");
  }

  function patchActive(patch: Partial<Note>) {
    if (!active) return;
    setNotes((prev) => updateNote(prev, active.id, patch));
  }

  async function format() {
    if (!active) return;
    setFmtError(null);
    try {
      const { formatMarkdown } = await import("../lib/mdformat");
      patchActive({ body: await formatMarkdown(active.body) });
      toast("Formatado");
    } catch (err) {
      setFmtError((err as Error).message);
    }
  }

  async function copyHtml() {
    if (!active) return;
    const { renderMarkdown } = await import("../lib/markdown");
    await copyToClipboard(renderMarkdown(active.body).html);
    toast("HTML copiado");
  }

  const rail = (
    <div className="flex h-full min-h-0 flex-col gap-2 pr-1">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder="Buscar notas…"
          className="h-8 min-w-0 flex-1 rounded-md border border-line-strong bg-surface-2 px-2.5 text-sm text-ink placeholder:text-faint"
        />
        <Button size="sm" variant="primary" onClick={newNote}>
          <Plus size={14} />
          Nova
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-line">
        {list.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-faint">
            {notes.length === 0 ? "Nenhuma nota ainda." : "Nada encontrado."}
          </p>
        )}
        {list.map((n) => {
          const isActive = n.id === active?.id;
          return (
            <button
              key={n.id}
              onClick={() => setActiveId(n.id)}
              className={`group flex w-full items-start gap-2 border-b border-line px-3 py-2 text-left last:border-0 ${
                isActive ? "bg-accent-soft" : "hover:bg-surface-2"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate text-sm ${isActive ? "font-medium text-accent-soft-fg" : "text-ink"}`}
                >
                  {noteTitle(n.body)}
                </div>
                <div className="text-[11px] text-faint">
                  editado {formatDistanceToNow(n.updatedAt, { addSuffix: true, locale: ptBR })}
                </div>
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setNotes((prev) => updateNote(prev, n.id, { pinned: !n.pinned }));
                }}
                className={`shrink-0 rounded p-0.5 ${n.pinned ? "text-accent" : "text-faint opacity-0 group-hover:opacity-100 hover:text-muted"}`}
                title={n.pinned ? "Desafixar" : "Fixar"}
              >
                {n.pinned ? <Pin size={13} /> : <PinOff size={13} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const editor = (
    <div className="flex h-full min-h-0 flex-col gap-2 pl-1">
      {active ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-ink">
              {noteTitle(active.body)}
            </span>
            <span className="text-xs text-faint">{wordCount(active.body)} palavras</span>
            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={format}>
                <Sparkles size={14} />
                Formatar
              </Button>
              <CopyButton value={active.body} label="Markdown" />
              <Button size="sm" variant="ghost" onClick={copyHtml}>
                HTML
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  if (!window.confirm("Excluir esta nota?")) return;
                  setNotes((prev) => removeNote(prev, active.id));
                }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
          {fmtError && <ErrorNote message={fmtError} />}
          <MarkdownEditor
            key={active.id}
            value={active.body}
            onChange={(md) => patchActive({ body: md })}
            placeholder="Escreva em Markdown… (alterne para o modo visual na barra do editor)"
          />
        </>
      ) : (
        <div className="grid h-full place-items-center">
          <Button variant="primary" onClick={newNote}>
            <Plus size={15} />
            Criar primeira nota
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <ToolBody
      toolbar={
        <>
          <span className="text-xs text-faint">
            {notes.length} nota{notes.length === 1 ? "" : "s"} · guardadas só neste computador
          </span>
          <div className="ml-auto flex gap-1">
            <BackupButtons />
          </div>
        </>
      }
    >
      <SplitPane
        storageKey="notes"
        mode="pixels"
        initial={280}
        minPx={200}
        maxPx={520}
        className="h-full"
        first={rail}
        second={editor}
      />
    </ToolBody>
  );
}
