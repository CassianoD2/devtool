/** Tarefas diárias com cronômetro de tempo realizado. Tudo puro e imutável. */

export interface Task {
  id: string;
  text: string;
  /** dia de origem, "YYYY-MM-DD" (local) */
  date: string;
  done: boolean;
  createdAt: number;
  completedAt?: number;
  /** tempo realizado em ms, particionado por dia */
  timeByDay: Record<string, number>;
  /** epoch ms de quando o cronômetro foi iniciado; ausente = parado */
  runningSince?: number;
  note?: string;
}

const DAY_MS = 86_400_000;
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const pad = (n: number) => String(n).padStart(2, "0");

export function isoDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function todayISO(): string {
  return isoDay(Date.now());
}
function dayStartMs(iso: string): number {
  return new Date(`${iso}T00:00:00`).getTime();
}

// ---------- formatação / parsing de duração ----------

export function formatClock(ms: number): string {
  const t = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${h}:${pad(m)}:${pad(s)}`;
}

export function formatShort(ms: number): string {
  const t = Math.max(0, Math.round(ms / 1000));
  if (t < 60) return `${t}s`;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Aceita "1:30:00", "90:00", "90m", "1h30m", "1h", "45s" ou número puro (= minutos). */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(parseFloat(s) * 60_000);
  const clock = s.match(/^(\d+):([0-5]?\d)(?::([0-5]?\d))?$/);
  if (clock) {
    const [, a, b, c] = clock;
    return c
      ? (+a * 3600 + +b * 60 + +c) * 1000
      : (+a * 60 + +b) * 60_000;
  }
  const units = s.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?$/);
  if (units && (units[1] || units[2] || units[3])) {
    return (
      (+(units[1] || 0) * 3600 + +(units[2] || 0) * 60 + +(units[3] || 0)) * 1000
    );
  }
  return null;
}

// ---------- tempo por dia ----------

function splitAcrossDays(start: number, end: number): Record<string, number> {
  const out: Record<string, number> = {};
  let cur = start;
  while (cur < end) {
    const iso = isoDay(cur);
    const segEnd = Math.min(end, dayStartMs(iso) + DAY_MS);
    out[iso] = (out[iso] ?? 0) + (segEnd - cur);
    cur = segEnd;
  }
  return out;
}

function addTimeMaps(
  a: Record<string, number>,
  b: Record<string, number>,
): Record<string, number> {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const next = (out[k] ?? 0) + v;
    if (next > 0) out[k] = next;
    else delete out[k];
  }
  return out;
}

/** Encerra o cronômetro de uma tarefa e credita o tempo decorrido por dia. */
function bank(task: Task, now: number): Task {
  if (task.runningSince == null) return task;
  return {
    ...task,
    timeByDay: addTimeMaps(task.timeByDay, splitAcrossDays(task.runningSince, now)),
    runningSince: undefined,
  };
}

/** Tempo total (todos os dias) + o que está correndo agora. */
export function totalElapsed(task: Task, now: number): number {
  const base = Object.values(task.timeByDay).reduce((s, v) => s + v, 0);
  return base + (task.runningSince != null ? Math.max(0, now - task.runningSince) : 0);
}

/** Tempo realizado numa tarefa num dia específico (inclui o cronômetro em curso). */
export function elapsedForDay(task: Task, dayISO: string, now: number): number {
  let ms = task.timeByDay[dayISO] ?? 0;
  if (task.runningSince != null) {
    ms += splitAcrossDays(task.runningSince, now)[dayISO] ?? 0;
  }
  return ms;
}

export function dayTotal(tasks: Task[], dayISO: string, now: number): number {
  return tasks.reduce((s, t) => s + elapsedForDay(t, dayISO, now), 0);
}

// ---------- períodos (dia / semana / mês) ----------

export type Period = "day" | "week" | "month";

function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** Intervalo inclusivo [início, fim] em ISO do período que contém `dayISO`.
 *  Semana começa no domingo; mês vai do dia 1 ao último. */
export function periodRange(dayISO: string, period: Period): [string, string] {
  if (period === "day") return [dayISO, dayISO];
  const d = parseISO(dayISO);
  if (period === "week") {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return [isoDay(start.getTime()), isoDay(end.getTime())];
  }
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return [isoDay(start.getTime()), isoDay(end.getTime())];
}

/** Dias ISO de `startISO` até `endISO`, inclusive. */
export function enumerateDays(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const end = parseISO(endISO);
  let cur = parseISO(startISO);
  while (cur.getTime() <= end.getTime()) {
    out.push(isoDay(cur.getTime()));
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  return out;
}

/** Avança (`dir` +1) ou retrocede (`dir` -1) um período a partir de `dayISO`.
 *  Para "month", devolve o 1º dia do mês deslocado (sem overflow de data). */
export function shiftPeriod(dayISO: string, period: Period, dir: number): string {
  const d = parseISO(dayISO);
  if (period === "day") {
    return isoDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + dir).getTime());
  }
  if (period === "week") {
    return isoDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * dir).getTime());
  }
  return isoDay(new Date(d.getFullYear(), d.getMonth() + dir, 1).getTime());
}

/** Tempo realizado somado em todas as tarefas ao longo do intervalo. */
export function rangeTotal(
  tasks: Task[],
  startISO: string,
  endISO: string,
  now: number,
): number {
  return enumerateDays(startISO, endISO).reduce(
    (s, day) => s + dayTotal(tasks, day, now),
    0,
  );
}

export interface DayGroup {
  date: string;
  tasks: Task[];
}
export interface GroupedTasks {
  /** pendências vencidas (só quando o intervalo inclui hoje) */
  overdue: Task[];
  /** um grupo por dia do intervalo que tenha tarefas */
  days: DayGroup[];
}

const byDoneThenCreated = (a: Task, b: Task) =>
  Number(a.done) - Number(b.done) || a.createdAt - b.createdAt;

/** Agrupa tarefas por `date` dentro do intervalo. Quando o intervalo inclui
 *  hoje, as não-concluídas com data anterior a hoje saem num bloco "atrasadas". */
export function groupByDate(
  tasks: Task[],
  startISO: string,
  endISO: string,
  todayISO: string,
): GroupedTasks {
  const includesToday = startISO <= todayISO && todayISO <= endISO;
  const isOverdue = (t: Task) => includesToday && !t.done && t.date < todayISO;

  const overdue = tasks
    .filter(isOverdue)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

  const days = enumerateDays(startISO, endISO)
    .map((date) => ({
      date,
      tasks: tasks
        .filter((t) => t.date === date && !isOverdue(t))
        .sort(byDoneThenCreated),
    }))
    .filter((g) => g.tasks.length > 0);

  return { overdue, days };
}

// ---------- operações (retornam novo array) ----------

export function createTask(text: string, dateISO: string, now = Date.now()): Task {
  return {
    id: uid(),
    text: text.trim(),
    date: dateISO,
    done: false,
    createdAt: now,
    timeByDay: {},
  };
}

export function runningTask(tasks: Task[]): Task | undefined {
  return tasks.find((t) => t.runningSince != null);
}

/** Inicia o cronômetro numa tarefa; para qualquer outro que estiver rodando. */
export function startTimer(tasks: Task[], id: string, now = Date.now()): Task[] {
  return tasks.map((t) => {
    if (t.id === id) return t.runningSince != null ? t : { ...t, runningSince: now };
    return t.runningSince != null ? bank(t, now) : t;
  });
}

export function stopTimer(tasks: Task[], id: string, now = Date.now()): Task[] {
  return tasks.map((t) => (t.id === id ? bank(t, now) : t));
}

export function toggleDone(tasks: Task[], id: string, now = Date.now()): Task[] {
  return tasks.map((t) => {
    if (t.id !== id) return t;
    const next = bank(t, now); // se estava rodando, credita antes
    const done = !t.done;
    return { ...next, done, completedAt: done ? now : undefined };
  });
}

export function adjustTime(
  tasks: Task[],
  id: string,
  dayISO: string,
  deltaMs: number,
): Task[] {
  return tasks.map((t) =>
    t.id === id
      ? { ...t, timeByDay: addTimeMaps(t.timeByDay, { [dayISO]: deltaMs }) }
      : t,
  );
}

export function setTime(
  tasks: Task[],
  id: string,
  dayISO: string,
  ms: number,
): Task[] {
  return tasks.map((t) => {
    if (t.id !== id) return t;
    const timeByDay = { ...t.timeByDay };
    if (ms > 0) timeByDay[dayISO] = ms;
    else delete timeByDay[dayISO];
    return { ...t, timeByDay };
  });
}

export function updateTask(tasks: Task[], id: string, patch: Partial<Task>): Task[] {
  return tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
}

export function removeTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((t) => t.id !== id);
}

// ---------- seleção por dia ----------

/** Tarefas visíveis num dia. Para "hoje", inclui pendências arrastadas de dias
 *  anteriores; para dias passados, o que pertence ao dia ou teve tempo lançado nele. */
export function visibleForDay(
  tasks: Task[],
  dayISO: string,
  todayIso: string,
): Task[] {
  const rows =
    dayISO === todayIso
      ? tasks.filter((t) => t.date === dayISO || (t.date < dayISO && !t.done))
      : tasks.filter((t) => t.date === dayISO || (t.timeByDay[dayISO] ?? 0) > 0);
  return [...rows].sort(
    (a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt,
  );
}

/** Tarefa cujo cronômetro roda há mais que `thresholdMs` (padrão 8h). */
export function staleRunning(
  tasks: Task[],
  now = Date.now(),
  thresholdMs = 8 * 3600_000,
): Task | undefined {
  return tasks.find(
    (t) => t.runningSince != null && now - t.runningSince > thresholdMs,
  );
}
