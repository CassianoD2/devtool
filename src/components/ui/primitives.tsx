import { useState, type ButtonHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { AlertCircle, Check, ChevronDown, Copy } from "lucide-react";
import { copyToClipboard } from "../../lib/clipboard";
import { useToast } from "./Toast";

// ---------------------------------------------------------------- Button

const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-100 active:scale-[.97] disabled:pointer-events-none disabled:opacity-40";
const BTN_SIZE = { sm: "h-7 px-2", md: "h-8 px-3" } as const;
const BTN_VARIANT = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover shadow-sm",
  default:
    "border border-line-strong bg-surface-2 text-ink hover:border-faint",
  ghost:
    "border border-line bg-surface-2/60 text-muted hover:border-line-strong hover:bg-surface-2 hover:text-ink",
  danger:
    "border border-red-300 text-red-600 hover:bg-red-500/10 dark:border-red-900/60 dark:text-red-400",
} as const;

export function Button({
  variant = "default",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BTN_VARIANT;
  size?: keyof typeof BTN_SIZE;
}) {
  return (
    <button
      className={`${BTN_BASE} ${BTN_SIZE[size]} ${BTN_VARIANT[variant]} ${className}`}
      {...props}
    />
  );
}

export function IconButton({
  label,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- Select

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative inline-flex">
      <select
        className={`h-8 appearance-none rounded-md border border-line-strong bg-surface-2 pr-7 pl-2.5 text-sm text-ink transition-colors hover:border-faint ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-faint"
      />
    </div>
  );
}

// ---------------------------------------------------------------- Input

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-8 rounded-md border border-line-strong bg-surface-2 px-2.5 text-sm text-ink transition-colors placeholder:text-faint hover:border-faint ${className}`}
      {...props}
    />
  );
}

// ---------------------------------------------------------------- Field

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-sm text-muted">
      <span className="whitespace-nowrap">{label}</span>
      {children}
    </label>
  );
}

// ---------------------------------------------------------------- Segmented

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex h-8 items-center gap-0.5 rounded-md border border-line bg-inset p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`h-[26px] rounded-[5px] px-2.5 text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-surface-2 text-ink shadow-sm ring-1 ring-line-strong"
              : "text-muted hover:bg-surface-2/60 hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Checkbox

export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted select-none hover:text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
        className="size-4 rounded border-line accent-[var(--color-accent)]"
      />
      {label}
    </label>
  );
}

// ---------------------------------------------------------------- CopyButton

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const toast = useToast();
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await copyToClipboard(value);
      setDone(true);
      setTimeout(() => setDone(false), 1200);
      toast("Copiado");
    } catch {
      toast("Não foi possível copiar", "error");
    }
  }

  const Icon = done ? Check : Copy;
  if (!label || label === "⧉") {
    return (
      <IconButton label="Copiar" onClick={copy} disabled={!value}>
        <Icon size={14} className={done ? "text-emerald-500" : ""} />
      </IconButton>
    );
  }
  return (
    <Button variant="ghost" size="sm" onClick={copy} disabled={!value}>
      <Icon size={14} className={done ? "text-emerald-500" : ""} />
      {label}
    </Button>
  );
}

// ---------------------------------------------------------------- ErrorNote

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
      <AlertCircle size={15} className="mt-0.5 shrink-0" />
      <span className="min-w-0 break-words">{message}</span>
    </div>
  );
}
