import { describe, it, expect } from "vitest";
import {
  DEFAULT_COLUMNS,
  addCard,
  addChecklistItem,
  addColumn,
  addLabel,
  allLabels,
  cardsIn,
  checklistProgress,
  columnOf,
  dueStatus,
  labelColor,
  matchesFilter,
  moveCard,
  moveColumn,
  removeChecklistItem,
  removeColumn,
  renameColumn,
  toggleChecklistItem,
} from "./kanban";
import { createTask, startTimer, totalElapsed, type Task } from "./tasks";

const T0 = new Date("2026-03-10T09:00:00").getTime();
const cols = DEFAULT_COLUMNS;
const mk = (text: string, over: Partial<Task> = {}): Task => ({
  ...createTask(text, "2026-03-10", T0),
  ...over,
});
const ids = (ts: Task[]) => ts.map((t) => t.text);

describe("columnOf", () => {
  it("tarefa sem columnId cai na primeira coluna aberta, ou na concluída se done", () => {
    expect(columnOf(mk("a"), cols).id).toBe("todo");
    expect(columnOf(mk("b", { done: true }), cols).id).toBe("done");
  });
  it("respeita columnId válido", () => {
    expect(columnOf(mk("a", { columnId: "doing" }), cols).id).toBe("doing");
  });
  it("concluir pela lista (done sem mudar columnId) joga o cartão em 'concluído'", () => {
    expect(columnOf(mk("a", { columnId: "doing", done: true }), cols).id).toBe("done");
  });
  it("reabrir cartão que estava em 'concluído' devolve para coluna aberta", () => {
    expect(columnOf(mk("a", { columnId: "done", done: false }), cols).id).toBe("todo");
  });
  it("columnId de coluna removida é ignorado", () => {
    expect(columnOf(mk("a", { columnId: "sumiu" }), cols).id).toBe("todo");
  });
});

describe("cardsIn / moveCard / addCard", () => {
  const base = () => {
    let ts: Task[] = [];
    for (const [i, n] of ["a", "b", "c"].entries()) {
      ts = addCard(ts, cols, "todo", { ...createTask(n, "2026-03-10", T0 + i) }, T0);
    }
    return ts;
  };

  it("addCard acrescenta no fim da coluna", () => {
    expect(ids(cardsIn(base(), cols, "todo"))).toEqual(["a", "b", "c"]);
  });

  it("reordena dentro da coluna", () => {
    const ts = base();
    const c = ts.find((t) => t.text === "c")!;
    expect(ids(cardsIn(moveCard(ts, cols, c.id, "todo", 0), cols, "todo"))).toEqual(["c", "a", "b"]);
    const a = ts.find((t) => t.text === "a")!;
    expect(ids(cardsIn(moveCard(ts, cols, a.id, "todo", 2), cols, "todo"))).toEqual(["b", "c", "a"]);
  });

  it("move para outra coluna no índice pedido", () => {
    let ts = base();
    const [a, b, c] = ["a", "b", "c"].map((n) => ts.find((t) => t.text === n)!);
    ts = moveCard(ts, cols, a.id, "doing", 0);
    ts = moveCard(ts, cols, b.id, "doing", 0);
    ts = moveCard(ts, cols, c.id, "doing", 1);
    expect(ids(cardsIn(ts, cols, "doing"))).toEqual(["b", "c", "a"]);
    expect(cardsIn(ts, cols, "todo")).toEqual([]);
  });

  it("índice fora do intervalo é limitado", () => {
    const ts = base();
    const a = ts.find((t) => t.text === "a")!;
    expect(ids(cardsIn(moveCard(ts, cols, a.id, "todo", 99), cols, "todo"))).toEqual(["b", "c", "a"]);
    expect(ids(cardsIn(moveCard(ts, cols, a.id, "todo", -5), cols, "todo"))).toEqual(["a", "b", "c"]);
  });

  it("mover para coluna concluída marca done e completedAt; sair desmarca", () => {
    const ts = base();
    const a = ts.find((t) => t.text === "a")!;
    const done = moveCard(ts, cols, a.id, "done", 0, T0 + 1000);
    const moved = done.find((t) => t.id === a.id)!;
    expect(moved.done).toBe(true);
    expect(moved.completedAt).toBe(T0 + 1000);
    const back = moveCard(done, cols, a.id, "doing", 0);
    const reopened = back.find((t) => t.id === a.id)!;
    expect(reopened.done).toBe(false);
    expect(reopened.completedAt).toBeUndefined();
  });

  it("concluir cartão com cronômetro rodando credita o tempo", () => {
    let ts = base();
    const a = ts.find((t) => t.text === "a")!;
    ts = startTimer(ts, a.id, T0);
    ts = moveCard(ts, cols, a.id, "done", 0, T0 + 60_000);
    const moved = ts.find((t) => t.id === a.id)!;
    expect(moved.runningSince).toBeUndefined();
    expect(totalElapsed(moved, T0 + 999_999)).toBe(60_000);
  });

  it("coluna ou cartão inexistente não altera nada", () => {
    const ts = base();
    expect(moveCard(ts, cols, ts[0].id, "nada", 0)).toBe(ts);
    expect(moveCard(ts, cols, "nada", "todo", 0)).toBe(ts);
  });

  it("não muta a entrada", () => {
    const ts = base();
    const snap = JSON.stringify(ts);
    moveCard(ts, cols, ts[0].id, "doing", 0);
    expect(JSON.stringify(ts)).toBe(snap);
  });
});

describe("colunas", () => {
  it("addColumn insere antes da coluna concluída e ignora título vazio", () => {
    const next = addColumn(cols, " Revisão ");
    expect(next.map((c) => c.title)).toEqual(["A fazer", "Em andamento", "Revisão", "Concluído"]);
    expect(addColumn(cols, "   ")).toBe(cols);
  });
  it("renameColumn", () => {
    expect(renameColumn(cols, "todo", "Backlog")[0].title).toBe("Backlog");
    expect(renameColumn(cols, "todo", " ")).toBe(cols);
  });
  it("removeColumn preserva ao menos uma coluna aberta e uma concluída", () => {
    expect(removeColumn(cols, "doing").map((c) => c.id)).toEqual(["todo", "done"]);
    const so1 = removeColumn(cols, "doing");
    expect(removeColumn(so1, "todo")).toBe(so1);
    expect(removeColumn(cols, "done")).toBe(cols);
  });
  it("cartões de coluna removida aparecem na primeira coluna aberta", () => {
    const ts = [mk("a", { columnId: "doing" })];
    const next = removeColumn(cols, "doing");
    expect(columnOf(ts[0], next).id).toBe("todo");
  });
  it("moveColumn", () => {
    expect(moveColumn(cols, "doing", 0).map((c) => c.id)).toEqual(["doing", "todo", "done"]);
    expect(moveColumn(cols, "nada", 0)).toBe(cols);
  });
});

describe("etiquetas", () => {
  it("addLabel ignora vazio e duplicata sem diferenciar caixa", () => {
    expect(addLabel(undefined, " bug ")).toEqual(["bug"]);
    expect(addLabel(["bug"], "BUG")).toEqual(["bug"]);
    expect(addLabel(["bug"], "")).toEqual(["bug"]);
  });
  it("labelColor é estável e ignora caixa", () => {
    expect(labelColor("Bug")).toBe(labelColor("bug"));
  });
  it("allLabels agrega sem repetir", () => {
    const ts = [mk("a", { labels: ["x", "y"] }), mk("b", { labels: ["y", "z"] }), mk("c")];
    expect(allLabels(ts)).toEqual(["x", "y", "z"]);
  });
});

describe("dueStatus", () => {
  const today = "2026-03-10";
  it.each([
    [undefined, false, "none"],
    ["2026-03-09", false, "overdue"],
    ["2026-03-10", false, "today"],
    ["2026-03-12", false, "soon"],
    ["2026-03-13", false, "later"],
    ["2026-03-01", true, "done"],
  ])("due=%s done=%s -> %s", (due, done, expected) => {
    expect(dueStatus(mk("a", { due, done }), today)).toBe(expected);
  });
});

describe("checklist", () => {
  it("add / toggle / remove / progress", () => {
    let l = addChecklistItem(undefined, "um");
    l = addChecklistItem(l, "dois");
    l = addChecklistItem(l, "  ");
    expect(l).toHaveLength(2);
    l = toggleChecklistItem(l, l[0].id);
    expect(checklistProgress(l)).toEqual({ done: 1, total: 2 });
    l = removeChecklistItem(l, l[0].id);
    expect(checklistProgress(l)).toEqual({ done: 0, total: 1 });
    expect(checklistProgress(undefined)).toEqual({ done: 0, total: 0 });
  });
});

describe("matchesFilter", () => {
  const t = mk("Corrigir login", { note: "falha no OAuth", labels: ["bug"] });
  it("busca em título, descrição e etiquetas", () => {
    expect(matchesFilter(t, "login", null)).toBe(true);
    expect(matchesFilter(t, "oauth", null)).toBe(true);
    expect(matchesFilter(t, "BUG", null)).toBe(true);
    expect(matchesFilter(t, "outra", null)).toBe(false);
  });
  it("filtra por etiqueta exata", () => {
    expect(matchesFilter(t, "", "bug")).toBe(true);
    expect(matchesFilter(t, "", "feature")).toBe(false);
  });
});
