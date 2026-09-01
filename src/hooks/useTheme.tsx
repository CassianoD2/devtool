import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePref = "system" | "light" | "dark";

interface ThemeCtx {
  /** user preference */
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
  /** resolved value currently applied */
  dark: boolean;
}

const Ctx = createContext<ThemeCtx | null>(null);
const KEY = "devtool:theme";

function readPref(): ThemePref {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as string) : "system";
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function systemDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>(readPref);
  const [sysDark, setSysDark] = useState(systemDark);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSysDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const dark = theme === "dark" || (theme === "system" && sysDark);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("dark", dark);
    el.classList.toggle("light", !dark);
  }, [dark]);

  const setTheme = useCallback((t: ThemePref) => {
    setThemeState(t);
    try {
      localStorage.setItem(KEY, JSON.stringify(t));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<ThemeCtx>(() => ({ theme, setTheme, dark }), [theme, setTheme, dark]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme precisa estar dentro de <ThemeProvider>");
  return ctx;
}
