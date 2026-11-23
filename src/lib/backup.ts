import type { Note } from "./notes";
import type { Task } from "./tasks";
import type { Column } from "./kanban";

export const BACKUP_VERSION = 1;

export interface PersonalBundle {
  app: "devtool";
  kind: "personal";
  version: number;
  exportedAt: string;
  notes: Note[];
  tasks: Task[];
  /** colunas do quadro; ausente em backups antigos */
  columns?: Column[];
}

export function exportBundle(notes: Note[], tasks: Task[], columns?: Column[]): string {
  const bundle: PersonalBundle = {
    app: "devtool",
    kind: "personal",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    notes,
    tasks,
    ...(columns ? { columns } : {}),
  };
  return JSON.stringify(bundle, null, 2);
}

export function suggestedFilename(): string {
  return `devtool-pessoal-${new Date().toISOString().slice(0, 10)}.json`;
}

/** Valida e extrai notes/tasks de um JSON exportado. Lança Error se inválido. */
export function parseBundle(json: string): { notes: Note[]; tasks: Task[]; columns?: Column[] } {
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
  const columns = Array.isArray(b.columns)
    ? b.columns.filter(
        (c): c is Column => !!c && typeof c.id === "string" && typeof c.title === "string",
      )
    : [];
  // quadro sem coluna aberta ou sem concluída não renderiza: descarta e usa o padrão
  const valid = columns.some((c) => !c.done) && columns.some((c) => c.done);
  return { notes, tasks, ...(valid ? { columns } : {}) };
}
