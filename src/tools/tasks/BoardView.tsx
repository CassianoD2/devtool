import { useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import {
  AlignLeft,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Flag,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { ToolBody } from "../../components/ToolLayout";
import { BackupButtons } from "../../components/ui/BackupButtons";
import { Button, Select } from "../../components/ui/primitives";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useNow } from "../../hooks/useNow";
import {
  DEFAULT_COLUMNS,
  PRIORITIES,
  addCard,
  addColumn,
  allLabels,
  cardsIn,
  checklistProgress,
  dueStatus,
  labelColor,
  matchesFilter,
  moveCard,
  moveColumn,
  removeColumn,
  renameColumn,
  type Column,
  type DueStatus,
} from "../../lib/kanban";
import {
  createTask,
  formatShort,
  removeTask,
  runningTask,
  setTime,
  startTimer,
  stopTimer,
  todayISO,
  totalElapsed,
  updateTask,
  type Task,
} from "../../lib/tasks";
import { CardModal } from "./CardModal";

const DUE_CLS: Record<DueStatus, string> = {
  none: "",
  overdue: "bg-red-500/15 text-red-600 dark:text-red-400",
  today: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  soon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  later: "bg-inset text-muted",
  done: "bg-green-500/15 text-green-700 dark:text-green-400",
};

interface Drop {
  col: string;
  /** posição entre os cartões visíveis, sem contar o cartão arrastado */
  index: number;
}

/** Visão Quadro (estilo Trello) das tarefas: colunas, cartões arrastáveis e detalhes. */
export function BoardView({ viewSwitch }: { viewSwitch: ReactNode }) {
  const [tasks, setTasks] = useLocalStorage<Task[]>("devtool:tasks", []);
  const [columns, setColumns] = useLocalStorage<Column[]>("devtool:tasks:columns", DEFAULT_COLUMNS);
  const [query, setQuery] = useState("");
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const [addingCol, setAddingCol] = useState(false);
  const [colDraft, setColDraft] = useState("");
  const [addTo, setAddTo] = useState<string | null>(null);
  const [cardDraft, setCardDraft] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const colRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const running = runningTask(tasks);
  const now = useNow(!!running);
  const today = todayISO();
  const labels = useMemo(() => allLabels(tasks), [tasks]);
  const filtering = query.trim() !== "" || labelFilter != null;
  const open = tasks.find((t) => t.id === openId) ?? null;

  const visibleIn = (colId: string) =>
    cardsIn(tasks, columns, colId).filter((t) => matchesFilter(t, query, labelFilter));

  function submitCard(colId: string) {
    const text = cardDraft.trim();
    if (!text) return;
    setTasks((prev) => addCard(prev, columns, colId, createTask(text, today)));
    setCardDraft("");
  }

  function submitColumn() {
    setColumns((prev) => addColumn(prev, colDraft));
    setColDraft("");
    setAddingCol(false);
  }

  function commitRename() {
    if (renaming) setColumns((prev) => renameColumn(prev, renaming, renameVal));
    setRenaming(null);
  }

  function deleteColumn(col: Column) {
    const n = cardsIn(tasks, columns, col.id).length;
    const msg = n
      ? `Excluir a coluna “${col.title}”? Os ${n} cartão(ões) vão para outra coluna.`
      : `Excluir a coluna “${col.title}”?`;
    if (window.confirm(msg)) setColumns((prev) => removeColumn(prev, col.id));
  }

  // ----- drag & drop (HTML5) -----

  function onDragOverColumn(e: DragEvent, colId: string) {
    if (!dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const box = colRefs.current[colId];
    if (!box) return;
    let index = 0;
    for (const el of box.querySelectorAll<HTMLElement>("[data-card]")) {
      if (el.dataset.card === dragId) continue;
      const r = el.getBoundingClientRect();
      if (e.clientY > r.top + r.height / 2) index++;
    }
    setDrop((d) => (d && d.col === colId && d.index === index ? d : { col: colId, index }));
  }

  function onDropColumn(e: DragEvent, colId: string) {
    e.preventDefault();
    const id = dragId;
    const at = drop && drop.col === colId ? drop.index : null;
    endDrag();
    if (!id || at == null) return;
    // índice entre os visíveis -> índice na lista completa da coluna
    const full = cardsIn(tasks, columns, colId).filter((t) => t.id !== id);
    const vis = visibleIn(colId).filter((t) => t.id !== id);
    const target = at < vis.length ? full.indexOf(vis[at]) : full.length;
    setTasks((prev) => moveCard(prev, columns, id, colId, target));
  }

  function endDrag() {
    setDragId(null);
    setDrop(null);
  }

  const indicator = <div className="h-0.5 rounded-full bg-accent" />;

  function renderCard(t: Task) {
    const isRun = t.runningSince != null;
    const due = dueStatus(t, today);
    const cl = checklistProgress(t.checklist);
    const prio = PRIORITIES.find((p) => p.value === t.priority);
    const total = totalElapsed(t, now);
    return (
      <div
        key={t.id}
        data-card={t.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", t.id);
          setDragId(t.id);
        }}
        onDragEnd={endDrag}
        onClick={() => setOpenId(t.id)}
        className={`group cursor-pointer rounded-lg border border-line bg-surface p-2.5 shadow-sm transition-colors hover:border-line-strong ${
          dragId === t.id ? "opacity-40" : ""
        } ${isRun ? "ring-1 ring-accent" : ""}`}
      >
        {(t.labels?.length ?? 0) > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {t.labels!.map((l) => (
              <span key={l} className={`rounded px-1.5 py-px text-[10px] font-medium ${labelColor(l)}`}>
                {l}
              </span>
            ))}
          </div>
        )}
        <div className={`text-sm ${t.done ? "text-faint line-through" : "text-ink"}`}>{t.text}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
          {prio && (
            <span className={`inline-flex items-center gap-0.5 ${prio.cls}`} title={`Prioridade ${prio.label.toLowerCase()}`}>
              <Flag size={11} />
              {prio.label}
            </span>
          )}
          {t.due && (
            <span className={`inline-flex items-center gap-1 rounded px-1 py-px ${DUE_CLS[due]}`}>
              <CalendarDays size={11} />
              {format(parseISO(t.due), "dd/MM")}
            </span>
          )}
          {t.note && <AlignLeft size={12} aria-label="Tem descrição" />}
          {cl.total > 0 && (
            <span
              className={`inline-flex items-center gap-1 ${cl.done === cl.total ? "text-green-600 dark:text-green-400" : ""}`}
            >
              <CheckSquare size={12} />
              {cl.done}/{cl.total}
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5">
            {(total > 0 || isRun) && <span className="font-mono tabular-nums">{formatShort(total)}</span>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTasks((prev) => (isRun ? stopTimer(prev, t.id) : startTimer(prev, t.id)));
              }}
              className={`grid size-5 place-items-center rounded border ${
                isRun
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line-strong text-muted opacity-0 hover:text-ink group-hover:opacity-100"
              }`}
              title={isRun ? "Parar" : "Iniciar cronômetro"}
            >
              {isRun ? <Pause size={11} /> : <Play size={11} />}
            </button>
          </span>
        </div>
      </div>
    );
  }

  /** Cartões da coluna, com o indicador de soltura antes do `dropAt`-ésimo cartão
   *  (contando sem o arrastado). O arrastado permanece no DOM, esmaecido. */
  function renderCards(cards: Task[], dropAt: number | null) {
    const out: ReactNode[] = [];
    let k = 0;
    for (const t of cards) {
      if (t.id !== dragId) {
        if (dropAt === k) out.push(<div key="drop">{indicator}</div>);
        k++;
      }
      out.push(renderCard(t));
    }
    if (dropAt != null && dropAt >= k) out.push(<div key="drop">{indicator}</div>);
    return out;
  }

  function renderColumn(col: Column, i: number) {
    const cards = visibleIn(col.id);
    const total = cardsIn(tasks, columns, col.id).length;
    const shown = cards.filter((t) => t.id !== dragId);
    const dropHere = drop?.col === col.id;
    return (
      <section
        key={col.id}
        className={`flex max-h-full w-72 shrink-0 flex-col rounded-xl border bg-inset ${
          dropHere ? "border-accent" : "border-line"
        }`}
      >
        <header className="group flex items-center gap-1 px-3 pt-2.5 pb-1.5">
          {renaming === col.id ? (
            <input
              autoFocus
              value={renameVal}
              onChange={(e) => setRenameVal(e.currentTarget.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setRenaming(null);
              }}
              className="min-w-0 flex-1 rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 text-sm font-semibold text-ink"
            />
          ) : (
            <h3
              onDoubleClick={() => {
                setRenaming(col.id);
                setRenameVal(col.title);
              }}
              title="Duplo clique para renomear"
              className="min-w-0 flex-1 truncate text-sm font-semibold text-ink"
            >
              {col.title}
              <span className="ml-1.5 text-xs font-normal text-faint">
                {filtering ? `${cards.length}/${total}` : total}
              </span>
            </h3>
          )}
          <div className="hidden items-center group-hover:flex">
            <button
              disabled={i === 0}
              onClick={() => setColumns((prev) => moveColumn(prev, col.id, i - 1))}
              className="rounded p-0.5 text-faint hover:text-ink disabled:opacity-30"
              aria-label="Mover coluna para a esquerda"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={i === columns.length - 1}
              onClick={() => setColumns((prev) => moveColumn(prev, col.id, i + 1))}
              className="rounded p-0.5 text-faint hover:text-ink disabled:opacity-30"
              aria-label="Mover coluna para a direita"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => deleteColumn(col)}
              className="rounded p-0.5 text-faint hover:text-red-500"
              aria-label="Excluir coluna"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </header>

        <div
          ref={(el) => {
            colRefs.current[col.id] = el;
          }}
          onDragOver={(e) => onDragOverColumn(e, col.id)}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setDrop((d) => (d?.col === col.id ? null : d));
            }
          }}
          onDrop={(e) => onDropColumn(e, col.id)}
          className="flex min-h-12 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-1"
        >
          {renderCards(cards, dropHere ? drop.index : null)}
          {shown.length === 0 && !dropHere && !dragId && (
            <p className="py-3 text-center text-xs text-faint">
              {filtering && total > 0 ? "Nenhum cartão no filtro." : "Sem cartões."}
            </p>
          )}
        </div>

        <footer className="p-2 pt-1">
          {addTo === col.id ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                autoFocus
                rows={2}
                value={cardDraft}
                onChange={(e) => setCardDraft(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitCard(col.id);
                  }
                  if (e.key === "Escape") {
                    setAddTo(null);
                    setCardDraft("");
                  }
                }}
                placeholder="Título do cartão… (Enter adiciona)"
                className="resize-none rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-faint"
              />
              <div className="flex items-center gap-1">
                <Button variant="primary" size="sm" onClick={() => submitCard(col.id)} disabled={!cardDraft.trim()}>
                  Adicionar
                </Button>
                <button
                  onClick={() => {
                    setAddTo(null);
                    setCardDraft("");
                  }}
                  className="grid size-7 place-items-center rounded text-muted hover:text-ink"
                  aria-label="Cancelar"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setAddTo(col.id);
                setCardDraft("");
              }}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink"
            >
              <Plus size={14} />
              Adicionar cartão
            </button>
          )}
        </footer>
      </section>
    );
  }

  return (
    <ToolBody
      toolbar={
        <>
          {viewSwitch}
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder="Buscar cartões…"
              className="h-8 w-48 rounded-md border border-line-strong bg-surface-2 pr-2 pl-7 text-sm text-ink placeholder:text-faint"
            />
          </div>
          {labels.length > 0 && (
            <Select value={labelFilter ?? ""} onChange={(e) => setLabelFilter(e.currentTarget.value || null)}>
              <option value="">Todas as etiquetas</option>
              {labels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          )}
          {filtering && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setQuery("");
                setLabelFilter(null);
              }}
            >
              Limpar filtro
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {running && (
              <button
                onClick={() => setOpenId(running.id)}
                className="inline-flex max-w-48 items-center gap-1 truncate text-xs text-accent"
                title="Abrir cartão em andamento"
              >
                <span className="size-2 shrink-0 animate-pulse rounded-full bg-accent" />
                <span className="truncate">{running.text}</span>
              </button>
            )}
            <BackupButtons />
          </div>
        </>
      }
    >
      <div className="flex h-full min-h-0 items-start gap-3 overflow-x-auto pb-2">
        {columns.map(renderColumn)}

        <div className="w-72 shrink-0">
          {addingCol ? (
            <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-inset p-2">
              <input
                autoFocus
                value={colDraft}
                onChange={(e) => setColDraft(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitColumn();
                  if (e.key === "Escape") {
                    setAddingCol(false);
                    setColDraft("");
                  }
                }}
                placeholder="Nome da coluna…"
                className="h-8 rounded-md border border-line-strong bg-surface px-2 text-sm text-ink placeholder:text-faint"
              />
              <div className="flex items-center gap-1">
                <Button variant="primary" size="sm" onClick={submitColumn} disabled={!colDraft.trim()}>
                  Adicionar coluna
                </Button>
                <button
                  onClick={() => {
                    setAddingCol(false);
                    setColDraft("");
                  }}
                  className="grid size-7 place-items-center rounded text-muted hover:text-ink"
                  aria-label="Cancelar"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingCol(true)}
              className="flex w-full items-center gap-1.5 rounded-xl border border-dashed border-line-strong px-3 py-2.5 text-sm text-muted hover:bg-inset hover:text-ink"
            >
              <Plus size={14} />
              Adicionar coluna
            </button>
          )}
        </div>
      </div>

      {open && (
        <CardModal
          task={open}
          columns={columns}
          labelSuggestions={labels}
          onClose={() => setOpenId(null)}
          onPatch={(patch) => setTasks((prev) => updateTask(prev, open.id, patch))}
          onMove={(colId) =>
            setTasks((prev) => moveCard(prev, columns, open.id, colId, cardsIn(prev, columns, colId).length))
          }
          onToggleTimer={() =>
            setTasks((prev) => (open.runningSince != null ? stopTimer(prev, open.id) : startTimer(prev, open.id)))
          }
          onSetToday={(ms) => setTasks((prev) => setTime(prev, open.id, today, ms))}
          onDelete={() => {
            setTasks((prev) => removeTask(prev, open.id));
            setOpenId(null);
          }}
        />
      )}
    </ToolBody>
  );
}
