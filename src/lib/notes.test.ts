import { describe, it, expect } from "vitest";
import {
  createNote,
  noteTitle,
  wordCount,
  sortNotes,
  searchNotes,
  updateNote,
  removeNote,
  type Note,
} from "./notes";

const mk = (over: Partial<Note> = {}): Note => ({ ...createNote(1000), ...over });

describe("noteTitle", () => {
  it("usa o primeiro cabeçalho", () => {
    expect(noteTitle("bla\n\n## Reunião de sexta\ntexto")).toBe("Reunião de sexta");
  });
  it("cai pra primeira linha não vazia", () => {
    expect(noteTitle("\n\n  comprar pão e leite\nmais coisas")).toBe(
      "comprar pão e leite",
    );
  });
  it("tira marcações e limita", () => {
    expect(noteTitle("**Ideia:** _fazer algo_")).toBe("Ideia: fazer algo");
  });
  it("vazio -> Sem título", () => {
    expect(noteTitle("   \n  ")).toBe("Sem título");
  });
});

describe("wordCount", () => {
  it("conta palavras", () => {
    expect(wordCount("um dois três")).toBe(3);
    expect(wordCount("   ")).toBe(0);
  });
});

describe("sortNotes", () => {
  it("fixadas primeiro, depois mais recentes", () => {
    const a = mk({ id: "a", updatedAt: 10 });
    const b = mk({ id: "b", updatedAt: 30 });
    const c = mk({ id: "c", updatedAt: 20, pinned: true });
    expect(sortNotes([a, b, c]).map((n) => n.id)).toEqual(["c", "b", "a"]);
  });
});

describe("searchNotes", () => {
  const notes = [
    mk({ id: "a", body: "# Deploy\ncomando kubectl" }),
    mk({ id: "b", body: "lista de compras" }),
  ];
  it("busca por título e corpo, todos os termos", () => {
    expect(searchNotes(notes, "deploy kubectl").map((n) => n.id)).toEqual(["a"]);
    expect(searchNotes(notes, "compras").map((n) => n.id)).toEqual(["b"]);
    expect(searchNotes(notes, "").length).toBe(2);
  });
});

describe("updateNote", () => {
  it("mexe em updatedAt só quando o body muda", () => {
    const notes = [mk({ id: "a", updatedAt: 1 })];
    expect(updateNote(notes, "a", { pinned: true }, 99)[0].updatedAt).toBe(1);
    expect(updateNote(notes, "a", { body: "x" }, 99)[0].updatedAt).toBe(99);
  });
  it("remove", () => {
    expect(removeNote([mk({ id: "a" }), mk({ id: "b" })], "a").map((n) => n.id)).toEqual([
      "b",
    ]);
  });
});
