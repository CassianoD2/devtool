import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, ChevronLeft, ChevronRight, Pause, Play, Plus, Trash2 } from "lucide-react";
import { ToolBody } from "../components/ToolLayout";
import { BackupButtons } from "../components/ui/BackupButtons";
import { Button, Segmented } from "../components/ui/primitives";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useNow } from "../hooks/useNow";
import {
  adjustTime,
  createTask,
  dayTotal,
  elapsedForDay,
  formatClock,
  formatShort,
  groupByDate,
  parseDuration,
  periodRange,
  rangeTotal,
  removeTask,
  runningTask,
  setTime,
  shiftPeriod,
  staleRunning,
  startTimer,
  stopTimer,
  todayISO,
  toggleDone,
  totalElapsed,
  updateTask,
  visibleForDay,
  type Period,
  type Task,
} from "../lib/tasks";

const human = (iso: string) => format(parseISO(iso), "dd/MM");
const weekday = (iso: string) => format(parseISO(iso), "EEE dd/MM", { locale: ptBR });

const PERIODS: { value: Period; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

export function TasksTool() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("devtool:tasks", []);
  const [period, setPeriod] = useLocalStorage<Period>("devtool:tasks:period", "day");
  const [viewDate, setViewDate] = useState(todayISO());
  const [draft, setDraft] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [timeId, setTimeId] = useState<string | null>(null);
  const [timeDay, setTimeDay] = useState(todayISO());
  const [timeVal, setTimeVal] = useState("");
  const [addDayISO, setAddDayISO] = useState<string | null>(null);
  const [addDayVal, setAddDayVal] = useState("");

  const running = runningTask(tasks);
  const now = useNow(!!running);
  const today = todayISO();
  const [rangeStart, rangeEnd] = periodRange(viewDate, period);
  const periodHasToday = rangeStart <= today && today <= rangeEnd;
  const stale = staleRunning(tasks, now);

  const dayRows = useMemo(
    () => (period === "day" ? visibleForDay(tasks, viewDate, today) : []),
    [tasks, viewDate, today, period],
  );
  const grouped = useMemo(
    () => (period === "day" ? null : groupByDate(tasks, rangeStart, rangeEnd, today)),
    [tasks, rangeStart, rangeEnd, today, period],
  );

  const allRows =
    period === "day"
      ? dayRows
      : [...grouped!.overdue, ...grouped!.days.flatMap((d) => d.tasks)];
  const doneCount = allRows.filter((t) => t.done).length;
  const periodMs =
    period === "day"
      ? dayTotal(tasks, viewDate, now)
      : rangeTotal(tasks, rangeStart, rangeEnd, now);
  const footerWhen =
    period === "day"
      ? viewDate === today
        ? "de hoje"
        : "do dia"
      : period === "week"
        ? "da semana"
        : "do mês";
  const periodLabel =
    period === "day"
      ? viewDate === today
        ? "hoje"
        : human(viewDate)
      : period === "week"
        ? `${human(rangeStart)} – ${human(rangeEnd)}`
        : format(parseISO(viewDate), "MMMM yyyy", { locale: ptBR });

  function addOn(dateISO: string, text: string) {
    const v = text.trim();
    if (!v) return;
    setTasks((prev) => [...prev, createTask(v, dateISO)]);
  }
  function add() {
    addOn(viewDate, draft);
    setDraft("");
  }
  function commitAddDay() {
    if (addDayISO) addOn(addDayISO, addDayVal);
    setAddDayISO(null);
    setAddDayVal("");
  }
  const commitEdit = () => {
    if (editId) setTasks((prev) => updateTask(prev, editId, { text: editVal.trim() || "—" }));
    setEditId(null);
  };
  const commitTime = () => {
    if (timeId) {
      const ms = parseDuration(timeVal);
      if (ms != null) setTasks((prev) => setTime(prev, timeId, timeDay, ms));
    }
    setTimeId(null);
  };

  function renderRow(t: Task, dayISO: string, overdue = false) {
    const dayMs = elapsedForDay(t, dayISO, now);
    const totMs = totalElapsed(t, now);
    const isRun = t.runningSince != null;
    return (
      <div
        key={`${dayISO}:${t.id}`}
        className="group flex items-center gap-2.5 border-b border-line px-3 py-2 last:border-0"
      >
        <button
          onClick={() => setTasks((prev) => toggleDone(prev, t.id, now))}
          className={`grid size-5 shrink-0 place-items-center rounded border ${
            t.done
              ? "border-accent bg-accent text-accent-fg"
              : "border-line-strong hover:border-faint"
          }`}
        >
          {t.done && <Check size={13} />}
        </button>

        <div className="min-w-0 flex-1">
          {editId === t.id ? (
            <input
              autoFocus
              value={editVal}
              onChange={(e) => setEditVal(e.currentTarget.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setEditId(null);
              }}
              className="w-full rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 text-sm text-ink"
            />
          ) : (
            <span
              onDoubleClick={() => {
                setEditId(t.id);
                setEditVal(t.text);
              }}
              className={`text-sm ${t.done ? "text-faint line-through" : "text-ink"}`}
            >
              {t.text}
            </span>
          )}
          {overdue ? (
            <span className="ml-2 rounded bg-red-500/15 px-1 text-[10px] text-red-600 dark:text-red-400">
              atrasada · {human(t.date)}
            </span>
          ) : (
            t.date !== dayISO && (
              <span className="ml-2 rounded bg-inset px-1 text-[10px] text-muted">
                ↩ {human(t.date)}
              </span>
            )
          )}
        </div>

        {/* ajustes rápidos (hover) */}
        <div className="hidden items-center gap-1 group-hover:flex">
          <button
            onClick={() => setTasks((prev) => adjustTime(prev, t.id, dayISO, -300_000))}
            className="rounded px-1 text-xs text-faint hover:text-ink"
          >
            −5m
          </button>
          <button
            onClick={() => setTasks((prev) => adjustTime(prev, t.id, dayISO, 300_000))}
            className="rounded px-1 text-xs text-faint hover:text-ink"
          >
            +5m
          </button>
          <button
            onClick={() => setTasks((prev) => removeTask(prev, t.id))}
            className="rounded p-0.5 text-faint hover:text-red-500"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* tempo do dia (clique p/ editar) */}
        {timeId === t.id && timeDay === dayISO ? (
          <input
            autoFocus
            value={timeVal}
            onChange={(e) => setTimeVal(e.currentTarget.value)}
            onBlur={commitTime}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTime();
              if (e.key === "Escape") setTimeId(null);
            }}
            placeholder="1:30 / 90m"
            className="w-20 rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 text-right font-mono text-xs text-ink"
          />
        ) : (
          <button
            onClick={() => {
              setTimeId(t.id);
              setTimeDay(dayISO);
              setTimeVal(formatClock(dayMs));
            }}
            className="shrink-0 text-right font-mono text-xs tabular-nums text-muted hover:text-ink"
            title={totMs !== dayMs ? `total: ${formatShort(totMs)}` : "editar tempo"}
          >
            {formatClock(dayMs)}
            {totMs !== dayMs && (
              <span className="ml-1 text-[10px] text-faint">({formatShort(totMs)})</span>
            )}
          </button>
        )}

        <button
          onClick={() =>
            setTasks((prev) =>
              isRun ? stopTimer(prev, t.id, now) : startTimer(prev, t.id, now),
            )
          }
          className={`grid size-7 shrink-0 place-items-center rounded-md border ${
            isRun
              ? "border-accent bg-accent text-accent-fg"
              : "border-line-strong bg-surface-2 text-muted hover:text-ink"
          }`}
          title={isRun ? "Parar" : "Iniciar cronômetro"}
        >
          {isRun ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>
    );
  }

  function groupHeader(date: string) {
    return (
      <div className="flex items-center gap-2 bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted">
        <span className="capitalize text-ink">{weekday(date)}</span>
        {date === today && (
          <span className="rounded bg-accent-soft px-1 text-[10px] text-accent-soft-fg">hoje</span>
        )}
        <span className="font-mono text-faint">{formatClock(dayTotal(tasks, date, now))}</span>
        {addDayISO === date ? (
          <input
            autoFocus
            value={addDayVal}
            onChange={(e) => setAddDayVal(e.currentTarget.value)}
            onBlur={commitAddDay}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAddDay();
              if (e.key === "Escape") {
                setAddDayISO(null);
                setAddDayVal("");
              }
            }}
            placeholder="Nova tarefa e Enter…"
            className="ml-auto h-6 w-56 rounded border border-line-strong bg-surface px-2 text-xs text-ink placeholder:text-faint"
          />
        ) : (
          <button
            onClick={() => {
              setAddDayISO(date);
              setAddDayVal("");
            }}
            className="ml-auto grid size-5 place-items-center rounded border border-line-strong text-muted hover:text-ink"
            title={`Nova tarefa em ${human(date)}`}
          >
            <Plus size={12} />
          </button>
        )}
      </div>
    );
  }

  return (
    <ToolBody
      toolbar={
        <>
          <Segmented value={period} onChange={setPeriod} options={PERIODS} />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewDate((d) => shiftPeriod(d, period, -1))}
              className="grid size-7 place-items-center rounded-md border border-line-strong bg-surface-2 text-muted hover:text-ink"
            >
              <ChevronLeft size={15} />
            </button>
            <input
              type="date"
              value={viewDate}
              onChange={(e) => setViewDate(e.currentTarget.value || today)}
              className="h-7 rounded-md border border-line-strong bg-surface-2 px-2 text-sm text-ink"
            />
            <button
              onClick={() => setViewDate((d) => shiftPeriod(d, period, 1))}
              className="grid size-7 place-items-center rounded-md border border-line-strong bg-surface-2 text-muted hover:text-ink"
            >
              <ChevronRight size={15} />
            </button>
            {!periodHasToday && (
              <Button size="sm" variant="ghost" onClick={() => setViewDate(today)}>
                Hoje
              </Button>
            )}
          </div>
          <span className="text-xs capitalize text-faint">{periodLabel}</span>
          <div className="ml-auto flex gap-1">
            <BackupButtons />
          </div>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        {stale && (
          <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
            Cronômetro de “{stale.text}” rodando há {formatShort(now - (stale.runningSince ?? now))}.
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTasks((prev) => stopTimer(prev, stale.id, now))}
            >
              Parar
            </Button>
          </div>
        )}

        {period === "day" && (
          <div className="flex gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder={
                viewDate === today
                  ? "Nova tarefa e Enter…"
                  : `Nova tarefa em ${human(viewDate)} e Enter…`
              }
              className="h-9 min-w-0 flex-1 rounded-md border border-line-strong bg-surface-2 px-3 text-sm text-ink placeholder:text-faint"
            />
            <Button variant="primary" onClick={add} disabled={!draft.trim()}>
              <Plus size={15} />
              Adicionar
            </Button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-line">
          {period === "day" ? (
            <>
              {dayRows.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-faint">
                  {viewDate === today ? "Sem tarefas para hoje." : "Nada neste dia."}
                </p>
              )}
              {dayRows.map((t) => renderRow(t, viewDate))}
            </>
          ) : grouped!.overdue.length === 0 && grouped!.days.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-faint">Nada neste período.</p>
          ) : (
            <>
              {grouped!.overdue.length > 0 && (
                <div>
                  <div className="bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    Atrasadas · {grouped!.overdue.length}
                  </div>
                  {grouped!.overdue.map((t) => renderRow(t, t.date, true))}
                </div>
              )}
              {grouped!.days.map((g) => (
                <div key={g.date}>
                  {groupHeader(g.date)}
                  {g.tasks.map((t) => renderRow(t, g.date))}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-muted">
          <span>
            <Check size={13} className="inline" /> {doneCount}/{allRows.length}
          </span>
          <span className="font-mono">
            tempo {footerWhen}: {formatClock(periodMs)}
          </span>
          {running && (
            <span className="ml-auto inline-flex items-center gap-1 text-accent">
              <span className="size-2 animate-pulse rounded-full bg-accent" />
              {running.text}
            </span>
          )}
        </div>
      </div>
    </ToolBody>
  );
}
