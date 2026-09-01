import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";

interface SplitPaneProps {
  /** unique key to remember this split's size */
  storageKey: string;
  direction?: "horizontal" | "vertical";
  /** "fraction": first pane is a % of the container. "pixels": fixed px. */
  mode?: "fraction" | "pixels";
  /** initial size — a fraction (0..1) or px, matching `mode` */
  initial?: number;
  /** min size each pane keeps (fraction) — fraction mode only */
  min?: number;
  /** px bounds — pixels mode only */
  minPx?: number;
  maxPx?: number;
  first: ReactNode;
  second: ReactNode;
  className?: string;
}

/**
 * Two panes separated by a draggable divider, size remembered under `storageKey`.
 * Double-click the divider to reset to the initial size.
 */
export function SplitPane({
  storageKey,
  direction = "horizontal",
  mode = "fraction",
  initial = mode === "pixels" ? 260 : 0.5,
  min = 0.15,
  minPx = 160,
  maxPx = 640,
  first,
  second,
  className = "",
}: SplitPaneProps) {
  const [size, setSize] = useLocalStorage(`devtool:split:${storageKey}`, initial);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const isRow = direction === "horizontal";
  const isPx = mode === "pixels";

  const clamp = useCallback(
    (v: number) =>
      isPx
        ? Math.min(maxPx, Math.max(minPx, v))
        : Math.min(1 - min, Math.max(min, v)),
    [isPx, maxPx, minPx, min],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const offset = isRow ? e.clientX - rect.left : e.clientY - rect.top;
      setSize(clamp(isPx ? offset : offset / (isRow ? rect.width : rect.height)));
    },
    [isRow, isPx, clamp, setSize],
  );

  const stop = useCallback(() => {
    setDragging(false);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", stop);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, [onPointerMove]);

  useEffect(() => () => stop(), [stop]);

  const start = () => {
    setDragging(true);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stop);
    document.body.style.userSelect = "none";
    document.body.style.cursor = isRow ? "col-resize" : "row-resize";
  };

  const clamped = clamp(size);
  const firstSize = isPx ? `${clamped}px` : `${clamped * 100}%`;

  return (
    <div
      ref={containerRef}
      className={`flex min-h-0 min-w-0 ${isRow ? "flex-row" : "flex-col"} ${className}`}
    >
      <div
        className="min-h-0 min-w-0 overflow-hidden"
        style={isRow ? { width: firstSize, flex: "none" } : { height: firstSize, flex: "none" }}
      >
        {first}
      </div>

      <div
        onPointerDown={start}
        onDoubleClick={() => setSize(initial)}
        title="Arraste para redimensionar · duplo-clique para restaurar"
        className={`group flex shrink-0 items-center justify-center ${
          isRow ? "w-2 cursor-col-resize" : "h-2 cursor-row-resize"
        }`}
      >
        <div
          className={`rounded-full transition-colors ${
            dragging ? "bg-accent" : "bg-line-strong group-hover:bg-accent/60"
          } ${isRow ? "h-10 w-1" : "h-1 w-10"}`}
        />
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{second}</div>
    </div>
  );
}
