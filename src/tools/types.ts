import type { ComponentType, LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";
import { Braces, Flag, KeyRound, Network, Type } from "lucide-react";

export type ToolCategory =
  | "formatters"
  | "encoders"
  | "sysadmin"
  | "brasil"
  | "text";

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  formatters: "Formatadores",
  encoders: "Encoders & Cripto",
  sysadmin: "Sistemas & Rede",
  brasil: "Consultas BR",
  text: "Texto & Cores",
};

export const CATEGORY_ICONS: Record<ToolCategory, LucideIcon> = {
  formatters: Braces,
  encoders: KeyRound,
  sysadmin: Network,
  brasil: Flag,
  text: Type,
};

export const CATEGORY_ORDER: ToolCategory[] = [
  "formatters",
  "encoders",
  "sysadmin",
  "brasil",
  "text",
];

export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  /** one-line description shown under the title */
  blurb: string;
  /** extra search terms */
  keywords: string[];
  icon: LucideIcon;
  Component: ComponentType | LazyExoticComponent<ComponentType>;
}
