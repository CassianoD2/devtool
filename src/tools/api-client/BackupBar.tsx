import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "../../components/ui/primitives";
import { useToast } from "../../components/ui/Toast";
import { isTauri } from "../../lib/http";
import { copyToClipboard } from "../../lib/clipboard";
import {
  exportApiClient,
  parseApiClientBundle,
  suggestedApiClientFilename,
} from "../../lib/apiclient-backup";
import { importPostmanV2_1 } from "../../lib/apiclient-postman";
import type { ApiClientStore } from "../../lib/apiclient-model";
import type { ApiClientStoreApi } from "../../hooks/useApiClientStore";

export function BackupBar({ actions }: { actions: ApiClientStoreApi }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const postmanRef = useRef<HTMLInputElement>(null);

  function apply(next: ApiClientStore, label: string) {
    const ok = window.confirm(
      `Importar ${next.folders.length} pasta(s), ${next.requests.length} request(s) e ${next.environments.length} ambiente(s) (${label})? Isso substitui o workspace atual.`,
    );
    if (!ok) return;
    try {
      localStorage.setItem("devtool:apiclient:store", JSON.stringify(next));
    } catch {
      /* o hook avisa se estourar a quota */
    }
    actions.replaceStore(next);
    window.location.reload();
  }

  async function doExport() {
    const json = exportApiClient(actions.store);
    try {
      if (isTauri()) {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");
        const path = await save({
          defaultPath: suggestedApiClientFilename(),
          filters: [{ name: "JSON", extensions: ["json"] }],
        });
        if (!path) return;
        await writeTextFile(path, json);
        toast("Workspace exportado");
      } else {
        await copyToClipboard(json);
        toast("Workspace copiado (JSON)");
      }
    } catch (err) {
      toast((err as Error).message || "Falha ao exportar", "error");
    }
  }

  async function pickFile(ref: React.RefObject<HTMLInputElement | null>, onText: (t: string) => void) {
    if (isTauri()) {
      try {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const { readTextFile } = await import("@tauri-apps/plugin-fs");
        const path = await open({ multiple: false, filters: [{ name: "JSON", extensions: ["json"] }] });
        if (typeof path !== "string") return;
        onText(await readTextFile(path));
      } catch (err) {
        toast((err as Error).message || "Falha ao importar", "error");
      }
    } else {
      ref.current?.click();
    }
  }

  const doImport = () =>
    pickFile(fileRef, (text) => {
      try {
        apply(parseApiClientBundle(text), "backup DevTool");
      } catch (err) {
        toast((err as Error).message, "error");
      }
    });

  const doImportPostman = () =>
    pickFile(postmanRef, (text) => {
      try {
        apply(importPostmanV2_1(JSON.parse(text)), "Postman v2.1");
      } catch (err) {
        toast((err as Error).message || "JSON do Postman inválido", "error");
      }
    });

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button variant="ghost" size="sm" onClick={doExport}>
        <Download size={14} /> Exportar
      </Button>
      <Button variant="ghost" size="sm" onClick={doImport}>
        <Upload size={14} /> Importar
      </Button>
      <Button variant="ghost" size="sm" onClick={doImportPostman}>
        <Upload size={14} /> Postman
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          if (f)
            f.text().then((t) => {
              try {
                apply(parseApiClientBundle(t), "backup DevTool");
              } catch (err) {
                toast((err as Error).message, "error");
              }
            });
        }}
      />
      <input
        ref={postmanRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          if (f)
            f.text().then((t) => {
              try {
                apply(importPostmanV2_1(JSON.parse(t)), "Postman v2.1");
              } catch (err) {
                toast((err as Error).message || "JSON do Postman inválido", "error");
              }
            });
        }}
      />
    </div>
  );
}
