import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  tone: "info" | "error";
}

const ToastContext = createContext<(message: string, tone?: "info" | "error") => void>(
  () => {},
);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, tone: "info" | "error" = "info") => {
    const id = nextId.current++;
    setItems((cur) => [...cur, { id, message, tone }]);
    setTimeout(() => {
      setItems((cur) => cur.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="animate-[toast_.16s_ease-out] pointer-events-auto flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-lg"
          >
            {t.tone === "error" ? (
              <XCircle size={15} className="text-red-500" />
            ) : (
              <CheckCircle2 size={15} className="text-emerald-500" />
            )}
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes toast{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
    </ToastContext.Provider>
  );
}
