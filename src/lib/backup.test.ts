import { describe, it, expect } from "vitest";
import { exportBundle, parseBundle, BACKUP_VERSION } from "./backup";
import { createNote } from "./notes";
import { createTask } from "./tasks";

const notes = [createNote(1), createNote(2)];
const tasks = [createTask("a", "2026-03-10", 1), createTask("b", "2026-03-10", 2)];

describe("backup", () => {
  it("round-trip export -> parse", () => {
    const json = exportBundle(notes, tasks);
    const parsed = JSON.parse(json);
    expect(parsed.app).toBe("devtool");
    expect(parsed.version).toBe(BACKUP_VERSION);
    const back = parseBundle(json);
    expect(back.notes).toHaveLength(2);
    expect(back.tasks.map((t) => t.text)).toEqual(["a", "b"]);
  });

  it("rejeita JSON inválido", () => {
    expect(() => parseBundle("{not json")).toThrow(/JSON/i);
  });

  it("rejeita bundle de outro app", () => {
    expect(() => parseBundle(JSON.stringify({ app: "outro", kind: "personal", version: 1 }))).toThrow(
      /DevTool/,
    );
  });

  it("rejeita versão diferente", () => {
    expect(() =>
      parseBundle(
        JSON.stringify({ app: "devtool", kind: "personal", version: 999, notes: [], tasks: [] }),
      ),
    ).toThrow(/vers/i);
  });

  it("filtra itens malformados", () => {
    const json = JSON.stringify({
      app: "devtool",
      kind: "personal",
      version: BACKUP_VERSION,
      notes: [{ id: "ok", body: "x" }, { id: 5 }, null],
      tasks: [{ id: "t", text: "x", date: "2026-01-01", timeByDay: {} }, { text: "sem id" }],
    });
    const { notes: n, tasks: t } = parseBundle(json);
    expect(n).toHaveLength(1);
    expect(t).toHaveLength(1);
  });
});
