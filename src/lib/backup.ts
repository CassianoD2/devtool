import type { Note } from "./notes";
import type { Task } from "./tasks";

export const BACKUP_VERSION = 1;

export interface PersonalBundle {
  app: "devtool";
  kind: "personal";
  version: number;
  exportedAt: string;
  notes: Note[];
  tasks: Task[];
}

export function exportBundle(notes: Note[], tasks: Task[]): string {
  const bundle: PersonalBundle = {
    app: "devtool",
    kind: "personal",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    notes,
    tasks,
  };
  return JSON.stringify(bundle, null, 2);
}

export function suggestedFilename(): string {
  return `devtool-pessoal-${new Date().toISOString().slice(0, 10)}.json`;
}

/** Valida e extrai notes/tasks de um JSON exportado. Lança Error se inválido. */
export function parseBundle(json: string): { notes: Note[]; tasks: Task[] } {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("Arquivo não é um JSON válido.");
  }
  if (!data || typeof data !== "object") throw new Error("Formato inesperado.");
  const b = data as Partial<PersonalBundle>;
  if (b.app !== "devtool" || b.kind !== "personal") {
    throw new Error("Não é um backup do DevTool (Pessoal).");
  }
  if (b.version !== BACKUP_VERSION) {
    throw new Error(`Versão de backup ${b.version} não suportada (esperado ${BACKUP_VERSION}).`);
  }
  if (!Array.isArray(b.notes) || !Array.isArray(b.tasks)) {
    throw new Error("Backup sem 'notes'/'tasks'.");
  }
  const notes = b.notes.filter(
    (n): n is Note =>
      !!n && typeof n.id === "string" && typeof n.body === "string",
  );
  const tasks = b.tasks.filter(
    (t): t is Task =>
      !!t &&
      typeof t.id === "string" &&
      typeof t.text === "string" &&
      typeof t.date === "string" &&
      typeof t.timeByDay === "object",
  );
  return { notes, tasks };
}
