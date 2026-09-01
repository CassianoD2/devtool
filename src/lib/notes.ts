/** Bloco de anotações (Markdown). Lógica pura e imutável. */

export interface Note {
  id: string;
  body: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function createNote(now = Date.now()): Note {
  return { id: uid(), body: "", pinned: false, createdAt: now, updatedAt: now };
}

/** Título derivado: 1º cabeçalho `#`, senão a 1ª linha não vazia, senão "Sem título". */
export function noteTitle(body: string): string {
  const lines = body.split("\n");
  const heading = lines.find((l) => /^#{1,6}\s+\S/.test(l));
  const raw = heading
    ? heading.replace(/^#{1,6}\s+/, "")
    : (lines.find((l) => l.trim() !== "") ?? "");
  const clean = raw.replace(/[*_`~>#-]/g, "").trim();
  return clean.slice(0, 80) || "Sem título";
}

export function wordCount(body: string): number {
  const t = body.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt,
  );
}

export function searchNotes(notes: Note[], query: string): Note[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return notes;
  return notes.filter((n) => {
    const hay = `${noteTitle(n.body)}\n${n.body}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

export function updateNote(
  notes: Note[],
  id: string,
  patch: Partial<Note>,
  now = Date.now(),
): Note[] {
  return notes.map((n) =>
    n.id === id
      ? { ...n, ...patch, updatedAt: patch.body !== undefined ? now : n.updatedAt }
      : n,
  );
}

export function removeNote(notes: Note[], id: string): Note[] {
  return notes.filter((n) => n.id !== id);
}
