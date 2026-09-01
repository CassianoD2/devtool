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
  periodRange,
  enumerateDays,
  shiftPeriod,
  rangeTotal,
  groupByDate,
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

describe("períodos dia/semana/mês", () => {
  it("periodRange: dia é ele mesmo", () => {
    expect(periodRange("2026-03-10", "day")).toEqual(["2026-03-10", "2026-03-10"]);
  });
  it("periodRange: semana começa no domingo", () => {
    // 2026-03-10 é uma terça → domingo 08, sábado 14
    expect(periodRange("2026-03-10", "week")).toEqual(["2026-03-08", "2026-03-14"]);
    // um domingo mapeia para ele mesmo como início
    expect(periodRange("2026-03-08", "week")).toEqual(["2026-03-08", "2026-03-14"]);
  });
  it("periodRange: mês do dia 1 ao último (inclui fevereiro)", () => {
    expect(periodRange("2026-02-17", "month")).toEqual(["2026-02-01", "2026-02-28"]);
    expect(periodRange("2024-02-10", "month")).toEqual(["2024-02-01", "2024-02-29"]);
    expect(periodRange("2026-03-31", "month")).toEqual(["2026-03-01", "2026-03-31"]);
  });

  it("enumerateDays: extremos, contagem e cruzando mês", () => {
    expect(enumerateDays("2026-03-10", "2026-03-10")).toEqual(["2026-03-10"]);
    const wk = enumerateDays("2026-03-08", "2026-03-14");
    expect(wk).toHaveLength(7);
    expect(wk[0]).toBe("2026-03-08");
    expect(wk[6]).toBe("2026-03-14");
    const cross = enumerateDays("2026-02-27", "2026-03-02");
    expect(cross).toEqual(["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
  });

  it("shiftPeriod: dia ±1, semana ±7, mês vai pro dia 1 sem overflow", () => {
    expect(shiftPeriod("2026-03-10", "day", 1)).toBe("2026-03-11");
    expect(shiftPeriod("2026-03-01", "day", -1)).toBe("2026-02-28");
    expect(shiftPeriod("2026-03-10", "week", 1)).toBe("2026-03-17");
    expect(shiftPeriod("2026-03-10", "week", -1)).toBe("2026-03-03");
    expect(shiftPeriod("2026-01-31", "month", 1)).toBe("2026-02-01");
    expect(shiftPeriod("2026-03-15", "month", -1)).toBe("2026-02-01");
  });

  it("rangeTotal soma o tempo de todos os dias do intervalo", () => {
    const ts = [
      mk({ id: "a", timeByDay: { "2026-03-08": 600_000, "2026-03-10": 300_000 } }),
      mk({ id: "b", timeByDay: { "2026-03-09": 120_000, "2026-03-20": 999_000 } }),
    ];
    expect(rangeTotal(ts, "2026-03-08", "2026-03-14", T0)).toBe(1_020_000);
  });

  describe("groupByDate", () => {
    it("agrupa por data, ordenado, um grupo por dia com tarefa", () => {
      const ts = [
        mk({ id: "seg1", date: "2026-03-09", createdAt: 2 }),
        mk({ id: "seg2", date: "2026-03-09", createdAt: 1 }),
        mk({ id: "qua", date: "2026-03-11" }),
      ];
      const g = groupByDate(ts, "2026-03-08", "2026-03-14", "2026-03-09");
      expect(g.days.map((d) => d.date)).toEqual(["2026-03-09", "2026-03-11"]);
      expect(g.days[0].tasks.map((t) => t.id)).toEqual(["seg2", "seg1"]);
    });

    it("com hoje no intervalo, pendência vencida vai pra 'overdue' e sai dos dias", () => {
      const ts = [
        mk({ id: "old-open", date: "2026-03-09", done: false }),
        mk({ id: "old-done", date: "2026-03-09", done: true }),
        mk({ id: "today", date: "2026-03-11" }),
      ];
      const g = groupByDate(ts, "2026-03-08", "2026-03-14", "2026-03-11");
      expect(g.overdue.map((t) => t.id)).toEqual(["old-open"]);
      const dayIds = g.days.flatMap((d) => d.tasks.map((t) => t.id));
      expect(dayIds).toContain("old-done");
      expect(dayIds).toContain("today");
      expect(dayIds).not.toContain("old-open");
    });

    it("intervalo sem hoje: nada de overdue, tudo agrupado por data", () => {
      const ts = [
        mk({ id: "x", date: "2026-01-05", done: false }),
        mk({ id: "y", date: "2026-01-06", done: true }),
      ];
      const g = groupByDate(ts, "2026-01-01", "2026-01-31", "2026-03-11");
      expect(g.overdue).toEqual([]);
      expect(g.days.flatMap((d) => d.tasks.map((t) => t.id)).sort()).toEqual(["x", "y"]);
    });

    it("tarefa futura fica no próprio dia, nunca em overdue", () => {
      const ts = [mk({ id: "fut", date: "2026-03-20", done: false })];
      const g = groupByDate(ts, "2026-03-15", "2026-03-21", "2026-03-11");
      expect(g.overdue).toEqual([]);
      expect(g.days).toEqual([{ date: "2026-03-20", tasks: [ts[0]] }]);
    });
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
