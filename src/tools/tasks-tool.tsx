import { useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { Check, ChevronLeft, ChevronRight, Pause, Play, Plus, Trash2 } from "lucide-react";
import { ToolBody } from "../components/ToolLayout";
import { BackupButtons } from "../components/ui/BackupButtons";
import { Button } from "../components/ui/primitives";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useNow } from "../hooks/useNow";
import {
  adjustTime,
  createTask,
  dayTotal,
  elapsedForDay,
  formatClock,
  formatShort,
  parseDuration,
  removeTask,
  runningTask,
  setTime,
  staleRunning,
  startTimer,
  stopTimer,
  todayISO,
  toggleDone,
  totalElapsed,
  updateTask,
  visibleForDay,
  type Task,
} from "../lib/tasks";

const shift = (iso: string, days: number) =>
  format(addDays(parseISO(iso), days), "yyyy-MM-dd");
const human = (iso: string) => format(parseISO(iso), "dd/MM");

export function TasksTool() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("devtool:tasks", []);
  const [viewDate, setViewDate] = useState(todayISO());
  const [draft, setDraft] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [timeId, setTimeId] = useState<string | null>(null);
  const [timeVal, setTimeVal] = useState("");

  const running = runningTask(tasks);
  const now = useNow(!!running);
  const today = todayISO();
  const isToday = viewDate === today;
  const rows = useMemo(
    () => visibleForDay(tasks, viewDate, today),
    [tasks, viewDate, today],
  );
  const doneCount = rows.filter((t) => t.done).length;
  const stale = staleRunning(tasks, now);

  function add() {
    const text = draft.trim();
    if (!text) return;
    setTasks((prev) => [...prev, createTask(text, today)]);
    setDraft("");
  }
  const commitEdit = () => {
    if (editId) setTasks((prev) => updateTask(prev, editId, { text: editVal.trim() || "—" }));
    setEditId(null);
  };
  const commitTime = () => {
    if (timeId) {
      const ms = parseDuration(timeVal);
      if (ms != null) setTasks((prev) => setTime(prev, timeId, viewDate, ms));
    }
    setTimeId(null);
  };

  return (
    <ToolBody
      toolbar={
        <>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewDate((d) => shift(d, -1))}
              className="grid size-7 place-items-center rounded-md border border-line-strong bg-surface-2 text-muted hover:text-ink"
            >
              <ChevronLeft size={15} />
            </button>
            <input
              type="date"
              value={viewDate}
              max={today}
              onChange={(e) => setViewDate(e.currentTarget.value || today)}
              className="h-7 rounded-md border border-line-strong bg-surface-2 px-2 text-sm text-ink"
            />
            <button
              onClick={() => setViewDate((d) => (d < today ? shift(d, 1) : d))}
              disabled={isToday}
              className="grid size-7 place-items-center rounded-md border border-line-strong bg-surface-2 text-muted hover:text-ink disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
            {!isToday && (
              <Button size="sm" variant="ghost" onClick={() => setViewDate(today)}>
                Hoje
              </Button>
            )}
          </div>
          <span className="text-xs text-faint">
            {isToday ? "hoje" : human(viewDate)}
          </span>
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

        {isToday && (
          <div className="flex gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Nova tarefa e Enter…"
              className="h-9 min-w-0 flex-1 rounded-md border border-line-strong bg-surface-2 px-3 text-sm text-ink placeholder:text-faint"
            />
            <Button variant="primary" onClick={add} disabled={!draft.trim()}>
              <Plus size={15} />
              Adicionar
            </Button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-line">
          {rows.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-faint">
              {isToday ? "Sem tarefas para hoje." : "Nada neste dia."}
            </p>
          )}
          {rows.map((t) => {
            const dayMs = elapsedForDay(t, viewDate, now);
            const totMs = totalElapsed(t, now);
            const isRun = t.runningSince != null;
            return (
              <div
                key={t.id}
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
                  {t.date !== viewDate && (
                    <span className="ml-2 rounded bg-inset px-1 text-[10px] text-muted">
                      ↩ {human(t.date)}
                    </span>
                  )}
                </div>

                {/* ajustes rápidos (hover) */}
                <div className="hidden items-center gap-1 group-hover:flex">
                  <button
                    onClick={() => setTasks((prev) => adjustTime(prev, t.id, viewDate, -300_000))}
                    className="rounded px-1 text-xs text-faint hover:text-ink"
                  >
                    −5m
                  </button>
                  <button
                    onClick={() => setTasks((prev) => adjustTime(prev, t.id, viewDate, 300_000))}
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
                {timeId === t.id ? (
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
                      setTimeVal(formatClock(dayMs));
                    }}
                    className="shrink-0 text-right font-mono text-xs tabular-nums text-muted hover:text-ink"
                    title={
                      totMs !== dayMs ? `total: ${formatShort(totMs)}` : "editar tempo"
                    }
                  >
                    {formatClock(dayMs)}
                    {totMs !== dayMs && (
                      <span className="ml-1 text-[10px] text-faint">
                        ({formatShort(totMs)})
                      </span>
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
          })}
        </div>

        <div className="flex items-center gap-3 text-sm text-muted">
          <span>
            <Check size={13} className="inline" /> {doneCount}/{rows.length}
          </span>
          <span className="font-mono">
            tempo {isToday ? "de hoje" : "do dia"}: {formatClock(dayTotal(tasks, viewDate, now))}
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
