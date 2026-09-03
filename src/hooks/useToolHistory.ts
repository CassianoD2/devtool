import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

const CAP = 12;
const MIN_LEN = 3;

/** Guarda as últimas entradas distintas de uma ferramenta em `devtool:history:<id>`. */
export function useToolHistory(toolId: string) {
  const [history, setHistory] = useLocalStorage<string[]>(`devtool:history:${toolId}`, []);

  const push = useCallback(
    (value: string) => {
      const v = value.trim();
      if (v.length < MIN_LEN) return;
      setHistory((h) => {
        if (h[0] === value) return h;
        return [value, ...h.filter((x) => x !== value)].slice(0, CAP);
      });
    },
    [setHistory],
  );

  const clear = useCallback(() => setHistory([]), [setHistory]);

  return { history, push, clear };
}
