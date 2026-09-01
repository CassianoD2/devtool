import { useCallback, useEffect, useState } from "react";

/** Persisted state backed by localStorage, resilient to unavailable storage. */
export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked — ignore */
    }
  }, [key, value]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => setValue(next),
    [],
  );

  return [value, set];
}
