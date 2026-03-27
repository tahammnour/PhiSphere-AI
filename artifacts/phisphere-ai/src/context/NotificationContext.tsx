import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextValue {
  notify: (n: Omit<Notification, "id">) => void;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

const ICONS: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />,
  error: <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />,
  info: <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />,
};

const BORDER: Record<NotificationType, string> = {
  success: "border-emerald-500/30",
  error: "border-red-500/30",
  info: "border-blue-500/30",
  warning: "border-amber-500/30",
};

function Toast({ n, onDismiss }: { n: Notification; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const dur = n.duration ?? 5000;
    timer.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(n.id), 300);
    }, dur);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [n.id, n.duration, onDismiss]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border bg-[#0d1829]/95 backdrop-blur-xl px-4 py-3.5 shadow-2xl shadow-black/50 max-w-sm w-full transition-all duration-300",
        BORDER[n.type],
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
      {ICONS[n.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug">{n.title}</p>
        {n.message && <p className="text-xs text-slate-400 mt-0.5 leading-snug">{n.message}</p>}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(n.id), 300); }}
        className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((n: Omit<Notification, "id">) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev.slice(-3), { ...n, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {notifications.map((n) => (
          <div key={n.id} className="pointer-events-auto">
            <Toast n={n} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
