import { useMemo } from "react";
import { useToolDraft } from "./useToolDraft";

export interface TextTransformState {
  input: string;
  setInput: (value: string) => void;
  output: string;
  error: string | null;
  clear: () => void;
  loadSample: () => void;
}

/**
 * Wires a tool's persisted input to a pure `transform` that returns a string or
 * throws on invalid input. Re-runs whenever `input` or `deps` change.
 */
export function useTextTransform(
  toolId: string,
  transform: (input: string) => string,
  deps: unknown[] = [],
  sample = "",
): TextTransformState {
  const [input, setInput] = useToolDraft(toolId);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null };
    try {
      return { output: transform(input), error: null };
    } catch (err) {
      return { output: "", error: (err as Error).message };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, ...deps]);

  return {
    input,
    setInput,
    output,
    error,
    clear: () => setInput(""),
    loadSample: () => setInput(sample),
  };
}
