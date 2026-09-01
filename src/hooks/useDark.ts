import { useTheme } from "./useTheme";

/** Back-compat shim — the resolved dark flag now comes from <ThemeProvider>. */
export function useDark(): boolean {
  return useTheme().dark;
}
