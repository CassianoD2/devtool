/** Quadro estilo Trello sobre as tarefas: colunas, ordem dos cartões, etiquetas e checklist. Puro e imutável. */
import { bankTask, type ChecklistItem, type Priority, type Task } from "./tasks";

export interface Column {
  id: string;
  title: string;
  /** cartões nesta coluna contam como concluídos */
  done?: boolean;
}

export const DEFAULT_COLUMNS: Column[] = [
  { id: "todo", title: "A fazer" },
  { id: "doing", title: "Em andamento" },
  { id: "done", title: "Concluído", done: true },
];

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// ---------- colunas ----------

/** Coluna onde o cartão aparece. Mantém `done` e coluna coerentes, mesmo que a
 *  tarefa tenha sido concluída pela visão Lista (sem `columnId` atualizado). */
export function columnOf(task: Task, columns: Column[]): Column {
  const doneCol = columns.find((c) => c.done);
  const own = columns.find((c) => c.id === task.columnId);
  if (own && !!own.done === task.done) return own;
  if (task.done) return doneCol ?? columns[columns.length - 1];
  return columns.find((c) => !c.done) ?? columns[0];
}

/** Cartões da coluna na ordem de exibição. */
export function cardsIn(tasks: Task[], columns: Column[], columnId: string): Task[] {
  return tasks
    .filter((t) => columnOf(t, columns).id === columnId)
    .sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt) || a.createdAt - b.createdAt);
}

export function addColumn(columns: Column[], title: string): Column[] {
  const t = title.trim();
  if (!t) return columns;
  const col: Column = { id: uid(), title: t };
  // antes da coluna "concluído", para ela continuar sendo a última
  const doneIdx = columns.findIndex((c) => c.done);
  if (doneIdx === -1) return [...columns, col];
  return [...columns.slice(0, doneIdx), col, ...columns.slice(doneIdx)];
}

export function renameColumn(columns: Column[], id: string, title: string): Column[] {
  const t = title.trim();
  if (!t) return columns;
  return columns.map((c) => (c.id === id ? { ...c, title: t } : c));
}

/** Remove a coluna; os cartões vão para a primeira coluna restante equivalente
 *  (concluídos → coluna "concluído", senão a primeira aberta). Nunca remove a última coluna
 *  aberta nem a única coluna "concluído". */
export function removeColumn(columns: Column[], id: string): Column[] {
  const col = columns.find((c) => c.id === id);
  if (!col) return columns;
  const rest = columns.filter((c) => c.id !== id);
  if (!rest.some((c) => !c.done)) return columns;
  if (col.done && !rest.some((c) => c.done)) return columns;
  return rest;
}

export function moveColumn(columns: Column[], id: string, toIndex: number): Column[] {
  const from = columns.findIndex((c) => c.id === id);
  if (from === -1) return columns;
  const next = [...columns];
  const [col] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, col);
  return next;
}

// ---------- cartões ----------

/** Move o cartão para `toColumnId` na posição `index` (0 = topo). Atualiza `done`
 *  conforme a coluna (creditando o cronômetro ao concluir) e renumera a ordem. */
export function moveCard(
  tasks: Task[],
  columns: Column[],
  id: string,
  toColumnId: string,
  index: number,
  now = Date.now(),
): Task[] {
  const target = columns.find((c) => c.id === toColumnId);
  const card = tasks.find((t) => t.id === id);
  if (!target || !card) return tasks;

  let moved: Task = { ...card, columnId: target.id };
  if (!!target.done !== card.done) {
    moved = bankTask(moved, now);
    moved.done = !!target.done;
    moved.completedAt = target.done ? now : undefined;
  }

  const siblings = cardsIn(tasks, columns, target.id).filter((t) => t.id !== id);
  const at = Math.max(0, Math.min(index, siblings.length));
  const ordered = [...siblings.slice(0, at), moved, ...siblings.slice(at)];
  const orderOf = new Map(ordered.map((t, i) => [t.id, i]));

  return tasks.map((t) => {
    if (t.id === id) return { ...moved, order: orderOf.get(id) };
    return orderOf.has(t.id) ? { ...t, order: orderOf.get(t.id) } : t;
  });
}

/** Cria um cartão no fim da coluna. */
export function addCard(
  tasks: Task[],
  columns: Column[],
  columnId: string,
  card: Task,
  now = Date.now(),
): Task[] {
  const target = columns.find((c) => c.id === columnId);
  if (!target) return tasks;
  const base: Task = {
    ...card,
    columnId: target.id,
    done: !!target.done,
    completedAt: target.done ? now : undefined,
  };
  const next = [...tasks, base];
  return moveCard(next, columns, card.id, target.id, cardsIn(tasks, columns, target.id).length, now);
}

// ---------- etiquetas ----------

export const LABEL_COLORS = [
  "bg-red-500/20 text-red-700 dark:text-red-300",
  "bg-orange-500/20 text-orange-700 dark:text-orange-300",
  "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  "bg-green-500/20 text-green-700 dark:text-green-300",
  "bg-sky-500/20 text-sky-700 dark:text-sky-300",
  "bg-violet-500/20 text-violet-700 dark:text-violet-300",
  "bg-pink-500/20 text-pink-700 dark:text-pink-300",
] as const;

/** Cor estável por nome (sem cadastro de etiquetas). */
export function labelColor(label: string): string {
  let h = 0;
  for (const ch of label.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return LABEL_COLORS[h % LABEL_COLORS.length];
}

export function addLabel(labels: string[] | undefined, label: string): string[] {
  const l = label.trim();
  const cur = labels ?? [];
  if (!l || cur.some((x) => x.toLowerCase() === l.toLowerCase())) return cur;
  return [...cur, l];
}

export function allLabels(tasks: Task[]): string[] {
  return [...new Set(tasks.flatMap((t) => t.labels ?? []))].sort((a, b) => a.localeCompare(b));
}

// ---------- prioridade / prazo ----------

export const PRIORITIES: { value: Priority; label: string; cls: string }[] = [
  { value: "low", label: "Baixa", cls: "text-sky-600 dark:text-sky-400" },
  { value: "medium", label: "Média", cls: "text-amber-600 dark:text-amber-400" },
  { value: "high", label: "Alta", cls: "text-red-600 dark:text-red-400" },
];

export type DueStatus = "none" | "overdue" | "today" | "soon" | "later" | "done";

/** Situação do prazo; cartão concluído nunca fica "atrasado". */
export function dueStatus(task: Task, todayISO: string): DueStatus {
  if (!task.due) return "none";
  if (task.done) return "done";
  if (task.due < todayISO) return "overdue";
  if (task.due === todayISO) return "today";
  const diff = (Date.parse(`${task.due}T00:00:00Z`) - Date.parse(`${todayISO}T00:00:00Z`)) / 86_400_000;
  return diff <= 2 ? "soon" : "later";
}

// ---------- checklist ----------

export function addChecklistItem(list: ChecklistItem[] | undefined, text: string): ChecklistItem[] {
  const t = text.trim();
  const cur = list ?? [];
  return t ? [...cur, { id: uid(), text: t, done: false }] : cur;
}

export function toggleChecklistItem(list: ChecklistItem[] | undefined, id: string): ChecklistItem[] {
  return (list ?? []).map((i) => (i.id === id ? { ...i, done: !i.done } : i));
}

export function removeChecklistItem(list: ChecklistItem[] | undefined, id: string): ChecklistItem[] {
  return (list ?? []).filter((i) => i.id !== id);
}

export function checklistProgress(list: ChecklistItem[] | undefined): { done: number; total: number } {
  const l = list ?? [];
  return { done: l.filter((i) => i.done).length, total: l.length };
}

// ---------- filtro ----------

export function matchesFilter(task: Task, query: string, label: string | null): boolean {
  if (label && !(task.labels ?? []).some((l) => l.toLowerCase() === label.toLowerCase())) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    task.text.toLowerCase().includes(q) ||
    (task.note ?? "").toLowerCase().includes(q) ||
    (task.labels ?? []).some((l) => l.toLowerCase().includes(q))
  );
}
