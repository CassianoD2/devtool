import { describe, it, expect } from "vitest";
import {
  createTask,
  startTimer,
  stopTimer,
  toggleDone,
  adjustTime,
  setTime,
  removeTask,
  runningTask,
  visibleForDay,
  dayTotal,
  elapsedForDay,
  totalElapsed,
  staleRunning,
  formatClock,
  formatShort,
  parseDuration,
  isoDay,
  type Task,
} from "./tasks";

const T0 = new Date("2026-03-10T09:00:00").getTime();
const mk = (over: Partial<Task> = {}): Task => ({
  ...createTask("tarefa", "2026-03-10", T0),
  ...over,
});

describe("formatClock / formatShort / parseDuration", () => {
  it("formata relógio", () => {
    expect(formatClock(0)).toBe("0:00:00");
    expect(formatClock(90_000)).toBe("0:01:30");
    expect(formatClock(3_661_000)).toBe("1:01:01");
  });
  it("formata curto", () => {
    expect(formatShort(45_000)).toBe("45s");
    expect(formatShort(90_000)).toBe("1m");
    expect(formatShort(3_600_000)).toBe("1h");
    expect(formatShort(5_400_000)).toBe("1h 30m");
  });
  it("faz parse de várias formas", () => {
    expect(parseDuration("90")).toBe(90 * 60_000); // minutos
    expect(parseDuration("1:30")).toBe(90 * 60_000); // mm... na verdade h:mm
    expect(parseDuration("1:30:00")).toBe(5_400_000);
    expect(parseDuration("1h30m")).toBe(5_400_000);
    expect(parseDuration("45s")).toBe(45_000);
    expect(parseDuration("lixo")).toBeNull();
  });
});

describe("cronômetro", () => {
  it("acumula tempo ao parar", () => {
    let ts = [mk({ id: "a" })];
    ts = startTimer(ts, "a", T0);
    expect(runningTask(ts)?.id).toBe("a");
    ts = stopTimer(ts, "a", T0 + 600_000); // +10 min
    expect(ts[0].runningSince).toBeUndefined();
    expect(ts[0].timeByDay["2026-03-10"]).toBe(600_000);
    expect(totalElapsed(ts[0], T0 + 999_999)).toBe(600_000);
  });

  it("só um cronômetro ativo por vez", () => {
    let ts = [mk({ id: "a" }), mk({ id: "b" })];
    ts = startTimer(ts, "a", T0);
    ts = startTimer(ts, "b", T0 + 300_000); // 5 min depois — para 'a'
    expect(ts.find((t) => t.id === "a")?.runningSince).toBeUndefined();
    expect(ts.find((t) => t.id === "a")?.timeByDay["2026-03-10"]).toBe(300_000);
    expect(ts.find((t) => t.id === "b")?.runningSince).toBe(T0 + 300_000);
  });

  it("divide o tempo entre dias ao cruzar a meia-noite", () => {
    const start = new Date("2026-03-10T23:30:00").getTime();
    const end = new Date("2026-03-11T00:30:00").getTime();
    let ts = [mk({ id: "a" })];
    ts = startTimer(ts, "a", start);
    ts = stopTimer(ts, "a", end);
    expect(ts[0].timeByDay["2026-03-10"]).toBe(30 * 60_000);
    expect(ts[0].timeByDay["2026-03-11"]).toBe(30 * 60_000);
  });

  it("concluir credita o tempo em curso", () => {
    let ts = [mk({ id: "a" })];
    ts = startTimer(ts, "a", T0);
    ts = toggleDone(ts, "a", T0 + 120_000);
    expect(ts[0].done).toBe(true);
    expect(ts[0].completedAt).toBe(T0 + 120_000);
    expect(ts[0].runningSince).toBeUndefined();
    expect(ts[0].timeByDay["2026-03-10"]).toBe(120_000);
  });

  it("avisa cronômetro rodando há muito tempo", () => {
    const ts = [mk({ id: "a", runningSince: T0 })];
    expect(staleRunning(ts, T0 + 3_600_000)).toBeUndefined();
    expect(staleRunning(ts, T0 + 9 * 3_600_000)?.id).toBe("a");
  });
});

describe("ajuste manual", () => {
  it("+/- e definir", () => {
    let ts = [mk({ id: "a" })];
    ts = adjustTime(ts, "a", "2026-03-10", 300_000);
    expect(ts[0].timeByDay["2026-03-10"]).toBe(300_000);
    ts = adjustTime(ts, "a", "2026-03-10", -600_000); // não vai abaixo de 0
    expect(ts[0].timeByDay["2026-03-10"]).toBeUndefined();
    ts = setTime(ts, "a", "2026-03-10", 3_600_000);
    expect(ts[0].timeByDay["2026-03-10"]).toBe(3_600_000);
  });
});

describe("visão por dia e carry-over", () => {
  it("hoje traz pendências arrastadas de dias anteriores", () => {
    const ts = [
      mk({ id: "old-done", date: "2026-03-09", done: true }),
      mk({ id: "old-open", date: "2026-03-09", done: false }),
      mk({ id: "today", date: "2026-03-10" }),
    ];
    const ids = visibleForDay(ts, "2026-03-10", "2026-03-10").map((t) => t.id);
    expect(ids).toContain("today");
    expect(ids).toContain("old-open");
    expect(ids).not.toContain("old-done");
  });

  it("dia passado mostra tarefas do dia + as que tiveram tempo lançado nele", () => {
    const ts = [
      mk({ id: "a", date: "2026-03-09" }),
      mk({ id: "b", date: "2026-03-08", timeByDay: { "2026-03-09": 60_000 } }),
      mk({ id: "c", date: "2026-03-07" }),
    ];
    const ids = visibleForDay(ts, "2026-03-09", "2026-03-10").map((t) => t.id);
    expect(ids.sort()).toEqual(["a", "b"]);
  });

  it("total do dia soma por tarefa (inclui carregadas)", () => {
    const ts = [
      mk({ id: "a", date: "2026-03-10", timeByDay: { "2026-03-10": 600_000 } }),
      mk({ id: "b", date: "2026-03-09", timeByDay: { "2026-03-10": 300_000 } }),
    ];
    expect(dayTotal(ts, "2026-03-10", T0)).toBe(900_000);
    expect(elapsedForDay(ts[1], "2026-03-10", T0)).toBe(300_000);
  });
});

describe("CRUD", () => {
  it("cria com a data e texto", () => {
    const t = createTask("  fazer x  ", "2026-03-10", T0);
    expect(t.text).toBe("fazer x");
    expect(t.date).toBe("2026-03-10");
    expect(t.done).toBe(false);
    expect(t.timeByDay).toEqual({});
  });
  it("remove", () => {
    const ts = [mk({ id: "a" }), mk({ id: "b" })];
    expect(removeTask(ts, "a").map((t) => t.id)).toEqual(["b"]);
  });
  it("isoDay é local YYYY-MM-DD", () => {
    expect(isoDay(new Date("2026-03-10T15:00:00").getTime())).toBe("2026-03-10");
  });
});
