import { useEffect, useState, type ReactNode } from "react";
import { Check, Pause, Play, Trash2, X } from "lucide-react";
import { Button, Select } from "../../components/ui/primitives";
import { useNow } from "../../hooks/useNow";
import {
  PRIORITIES,
  addChecklistItem,
  addLabel,
  checklistProgress,
  columnOf,
  labelColor,
  removeChecklistItem,
  toggleChecklistItem,
  type Column,
} from "../../lib/kanban";
import {
  formatClock,
  formatShort,
  parseDuration,
  todayISO,
  totalElapsed,
  type Priority,
  type Task,
} from "../../lib/tasks";

const FIELD =
  "w-full rounded-md border border-line-strong bg-surface-2 px-2 text-sm text-ink placeholder:text-faint";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">{title}</div>
      {children}
    </div>
  );
}

/** Detalhes do cartão: título, descrição, prioridade, prazo, etiquetas, checklist e tempo. */
export function CardModal({
  task,
  columns,
  labelSuggestions,
  onPatch,
  onMove,
  onToggleTimer,
  onSetToday,
  onDelete,
  onClose,
}: {
  task: Task;
  columns: Column[];
  labelSuggestions: string[];
  onPatch: (patch: Partial<Task>) => void;
  onMove: (columnId: string) => void;
  onToggleTimer: () => void;
  /** grava o tempo (ms) do dia de hoje */
  onSetToday: (ms: number) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const running = task.runningSince != null;
  const now = useNow(running);
  const [title, setTitle] = useState(task.text);
  const [labelDraft, setLabelDraft] = useState("");
  const [itemDraft, setItemDraft] = useState("");
  const [timeEdit, setTimeEdit] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const commitTitle = () => {
    const v = title.trim();
    if (v && v !== task.text) onPatch({ text: v });
    else setTitle(task.text);
  };
  const progress = checklistProgress(task.checklist);
  const col = columnOf(task, columns);
  const total = totalElapsed(task, now);
  const todayMs = task.timeByDay[todayISO()] ?? 0;

  function commitTime() {
    const ms = timeEdit != null ? parseDuration(timeEdit) : null;
    if (ms != null) onSetToday(ms);
    setTimeEdit(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-label="Detalhes do cartão"
        className="w-full max-w-2xl rounded-xl border border-line-strong bg-surface p-4 shadow-xl"
      >
        <div className="flex items-start gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-lg font-semibold text-ink hover:border-line focus:border-line-strong focus:bg-surface-2"
          />
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
        <p className="px-1.5 text-xs text-faint">
          na coluna <span className="text-muted">{col.title}</span>
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_14rem]">
          <div className="flex min-w-0 flex-col gap-4">
            <Section title="Descrição">
              <textarea
                value={task.note ?? ""}
                onChange={(e) => onPatch({ note: e.currentTarget.value })}
                rows={5}
                placeholder="Detalhes, links, contexto…"
                className={`${FIELD} resize-y py-1.5`}
              />
            </Section>

            <Section
              title={`Checklist${progress.total ? ` · ${progress.done}/${progress.total}` : ""}`}
            >
              {progress.total > 0 && (
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-inset">
                  <div
                    className="h-full bg-accent transition-[width]"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
              )}
              <ul className="flex flex-col">
                {(task.checklist ?? []).map((i) => (
                  <li key={i.id} className="group flex items-center gap-2 py-1">
                    <button
                      onClick={() => onPatch({ checklist: toggleChecklistItem(task.checklist, i.id) })}
                      className={`grid size-4 shrink-0 place-items-center rounded border ${
                        i.done
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-line-strong hover:border-faint"
                      }`}
                      aria-label={i.done ? "Desmarcar item" : "Marcar item"}
                    >
                      {i.done && <Check size={11} />}
                    </button>
                    <span className={`flex-1 text-sm ${i.done ? "text-faint line-through" : "text-ink"}`}>
                      {i.text}
                    </span>
                    <button
                      onClick={() => onPatch({ checklist: removeChecklistItem(task.checklist, i.id) })}
                      className="hidden text-faint hover:text-red-500 group-hover:block"
                      aria-label="Remover item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-1 flex gap-2">
                <input
                  value={itemDraft}
                  onChange={(e) => setItemDraft(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || !itemDraft.trim()) return;
                    onPatch({ checklist: addChecklistItem(task.checklist, itemDraft) });
                    setItemDraft("");
                  }}
                  placeholder="Novo item e Enter…"
                  className={`${FIELD} h-8`}
                />
              </div>
            </Section>
          </div>

          <div className="flex flex-col gap-4">
            <Section title="Coluna">
              <Select value={col.id} onChange={(e) => onMove(e.currentTarget.value)}>
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </Section>

            <Section title="Prioridade">
              <Select
                value={task.priority ?? ""}
                onChange={(e) => onPatch({ priority: (e.currentTarget.value || undefined) as Priority | undefined })}
              >
                <option value="">Sem prioridade</option>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Section>

            <Section title="Prazo">
              <div className="flex gap-1">
                <input
                  type="date"
                  value={task.due ?? ""}
                  onChange={(e) => onPatch({ due: e.currentTarget.value || undefined })}
                  className={`${FIELD} h-8`}
                />
                {task.due && (
                  <button
                    onClick={() => onPatch({ due: undefined })}
                    className="grid size-8 shrink-0 place-items-center rounded-md border border-line-strong text-muted hover:text-ink"
                    aria-label="Limpar prazo"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </Section>

            <Section title="Etiquetas">
              <div className="mb-1.5 flex flex-wrap gap-1">
                {(task.labels ?? []).map((l) => (
                  <button
                    key={l}
                    onClick={() => onPatch({ labels: (task.labels ?? []).filter((x) => x !== l) })}
                    title="Remover etiqueta"
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${labelColor(l)}`}
                  >
                    {l} ×
                  </button>
                ))}
              </div>
              <input
                list="devtool-labels"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || !labelDraft.trim()) return;
                  onPatch({ labels: addLabel(task.labels, labelDraft) });
                  setLabelDraft("");
                }}
                placeholder="Etiqueta e Enter…"
                className={`${FIELD} h-8`}
              />
              <datalist id="devtool-labels">
                {labelSuggestions
                  .filter((l) => !(task.labels ?? []).includes(l))
                  .map((l) => (
                    <option key={l} value={l} />
                  ))}
              </datalist>
            </Section>

            <Section title="Tempo">
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleTimer}
                  className={`grid size-8 shrink-0 place-items-center rounded-md border ${
                    running
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line-strong bg-surface-2 text-muted hover:text-ink"
                  }`}
                  title={running ? "Parar" : "Iniciar cronômetro"}
                >
                  {running ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <div className="min-w-0 text-xs text-muted">
                  <div className="font-mono text-sm text-ink">{formatClock(total)}</div>
                  total
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                hoje:
                {timeEdit != null ? (
                  <input
                    autoFocus
                    value={timeEdit}
                    onChange={(e) => setTimeEdit(e.currentTarget.value)}
                    onBlur={commitTime}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitTime();
                      if (e.key === "Escape") setTimeEdit(null);
                    }}
                    placeholder="1:30 / 90m"
                    className="w-20 rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 text-right font-mono text-xs text-ink"
                  />
                ) : (
                  <button
                    onClick={() => setTimeEdit(formatClock(todayMs))}
                    className="font-mono hover:text-ink"
                    title="Editar tempo de hoje"
                  >
                    {formatShort(todayMs) === "0s" ? "0m" : formatShort(todayMs)}
                  </button>
                )}
              </div>
            </Section>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-3">
          <Button
            variant="danger"
            size="sm"
            onClick={() => window.confirm("Excluir este cartão?") && onDelete()}
          >
            <Trash2 size={13} />
            Excluir cartão
          </Button>
          <Button size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
