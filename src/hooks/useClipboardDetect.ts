import { useCallback, useEffect, useRef, useState } from "react";
import { readFromClipboard } from "../lib/clipboard";
import { isTauri } from "../lib/http";
import { detectContent, type Suggestion } from "../lib/detect";

export interface ClipboardHit {
  text: string;
  suggestions: Suggestion[];
}

/**
 * Peeks the clipboard on window focus (and on demand) and, when the content
 * matches a known shape, exposes tool suggestions. Silent on permission errors.
 */
export function useClipboardDetect() {
  const [hit, setHit] = useState<ClipboardHit | null>(null);
  const lastSeen = useRef<string>("");

  const check = useCallback(async (manual = false) => {
    let text = "";
    try {
      text = await readFromClipboard();
    } catch {
      return;
    }
    if (!text) return;
    if (!manual && text === lastSeen.current) return;
    lastSeen.current = text;
    const suggestions = detectContent(text);
    if (suggestions.length) setHit({ text, suggestions });
    else if (manual) setHit(null);
  }, []);

  const dismiss = useCallback(() => {
    setHit(null);
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (isTauri()) {
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        getCurrentWindow()
          .onFocusChanged(({ payload: focused }) => {
            if (focused) void check();
          })
          .then((un) => {
            cleanup = un;
          });
      });
    } else {
      const handler = () => void check();
      window.addEventListener("focus", handler);
      cleanup = () => window.removeEventListener("focus", handler);
    }
    void check();
    return () => cleanup?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { hit, check, dismiss };
}
