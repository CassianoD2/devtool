import type { ReactNode } from "react";
import { SplitPane } from "./ui/SplitPane";
import { useMediaQuery } from "../hooks/useMediaQuery";

/** Vertical stack: a toolbar row on top, then the working area filling the rest. */
export function ToolBody({
  toolbar,
  children,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {toolbar != null && (
        <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * Two panes with a draggable divider between them. Side by side on wide screens,
 * stacked (also draggable) when narrow. Remembers the split per `storageKey`.
 */
export function TwoPane({
  left,
  right,
  storageKey = "twopane",
}: {
  left: ReactNode;
  right: ReactNode;
  storageKey?: string;
}) {
  const vertical = useMediaQuery("(max-width: 1023px)");
  return (
    <SplitPane
      storageKey={storageKey}
      direction={vertical ? "vertical" : "horizontal"}
      className="h-full"
      first={
        <div className={`flex h-full min-h-0 flex-col gap-1.5 ${vertical ? "pb-1" : "pr-1"}`}>
          {left}
        </div>
      }
      second={
        <div className={`flex h-full min-h-0 flex-col gap-1.5 ${vertical ? "pt-1" : "pl-1"}`}>
          {right}
        </div>
      }
    />
  );
}

export function PaneHeading({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex h-8 shrink-0 items-center justify-between">
      <span className="text-[11px] font-semibold tracking-wide text-faint uppercase">
        {title}
      </span>
      <div className="flex items-center gap-1">{actions}</div>
    </div>
  );
}
