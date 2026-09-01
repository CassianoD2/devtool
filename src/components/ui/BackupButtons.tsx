import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { isTauri } from "../../lib/http";
import { copyToClipboard } from "../../lib/clipboard";
import { exportBundle, parseBundle, suggestedFilename } from "../../lib/backup";
import { Button } from "./primitives";
import { useToast } from "./Toast";

const NOTES_KEY = "devtool:notes";
const TASKS_KEY = "devtool:tasks";
const read = (k: string) => {
  try {
    return JSON.parse(localStorage.getItem(k) ?? "[]");
  } catch {
    return [];
  }
};

/** Exportar/Importar o "Pessoal" (notas + tarefas) num .json. Tudo local. */
export function BackupButtons() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  async function doExport() {
    const json = exportBundle(read(NOTES_KEY), read(TASKS_KEY));
    try {
      if (isTauri()) {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");
        const path = await save({
          defaultPath: suggestedFilename(),
          filters: [{ name: "JSON", extensions: ["json"] }],
        });
        if (!path) return;
        await writeTextFile(path, json);
        toast("Backup exportado");
      } else {
        await copyToClipboard(json);
        toast("Backup copiado (JSON)");
      }
    } catch (err) {
      toast((err as Error).message || "Falha ao exportar", "error");
    }
  }

  function applyBundle(json: string) {
    try {
      const { notes, tasks } = parseBundle(json);
      if (
        !window.confirm(
          `Importar ${notes.length} nota(s) e ${tasks.length} tarefa(s)? Isso substitui as atuais.`,
        )
      )
        return;
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
      window.location.reload();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  async function doImport() {
    if (isTauri()) {
      try {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const { readTextFile } = await import("@tauri-apps/plugin-fs");
        const path = await open({
          multiple: false,
          filters: [{ name: "JSON", extensions: ["json"] }],
        });
        if (typeof path !== "string") return;
        applyBundle(await readTextFile(path));
      } catch (err) {
        toast((err as Error).message || "Falha ao importar", "error");
      }
    } else {
      fileRef.current?.click();
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={doExport}>
        <Download size={14} />
        Exportar
      </Button>
      <Button variant="ghost" size="sm" onClick={doImport}>
        <Upload size={14} />
        Importar
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          if (f) f.text().then(applyBundle);
        }}
      />
    </>
  );
}
