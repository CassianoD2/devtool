import type { ComponentType, LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";
import { Braces, Flag, KeyRound, Network, NotebookPen, Type } from "lucide-react";

export type ToolCategory =
  | "personal"
  | "formatters"
  | "encoders"
  | "sysadmin"
  | "brasil"
  | "text";

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  personal: "Pessoal",
  formatters: "Formatadores",
  encoders: "Encoders & Cripto",
  sysadmin: "Sistemas & Rede",
  brasil: "Consultas BR",
  text: "Texto & Cores",
};

export const CATEGORY_ICONS: Record<ToolCategory, LucideIcon> = {
  personal: NotebookPen,
  formatters: Braces,
  encoders: KeyRound,
  sysadmin: Network,
  brasil: Flag,
  text: Type,
};

export const CATEGORY_ORDER: ToolCategory[] = [
  "personal",
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
  /** ferramenta faz requisições de rede para funcionar */
  needsInternet?: boolean;
  Component: ComponentType | LazyExoticComponent<ComponentType>;
}
