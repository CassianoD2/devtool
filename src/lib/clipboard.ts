import { writeText, readText } from "@tauri-apps/plugin-clipboard-manager";
import { isTauri } from "./http";

export async function copyToClipboard(text: string): Promise<void> {
  if (isTauri()) {
    await writeText(text);
    return;
  }
  await navigator.clipboard.writeText(text);
}

export async function readFromClipboard(): Promise<string> {
  if (isTauri()) return readText();
  return navigator.clipboard.readText();
}
