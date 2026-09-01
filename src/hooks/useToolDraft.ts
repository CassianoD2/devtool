import { useLocalStorage } from "./useLocalStorage";

/** Per-tool input text, remembered between sessions. */
export function useToolDraft(
  toolId: string,
  initial = "",
): [string, (value: string) => void] {
  const [value, setValue] = useLocalStorage<string>(`devtool:draft:${toolId}`, initial);
  return [value, setValue];
}
