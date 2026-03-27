import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, RotateCcw, History } from "lucide-react";
import { useSessionHistory } from "@/hooks/use-session-history";
import { cn } from "@/lib/utils";

interface VersionHistoryDrawerProps {
  sessionId: number;
  isOpen: boolean;
  onClose: () => void;
  onRestore?: (name: string, description: string) => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function VersionHistoryDrawer({ sessionId, isOpen, onClose, onRestore }: VersionHistoryDrawerProps) {
  const { getHistory } = useSessionHistory();
  const [restoredIdx, setRestoredIdx] = useState<number | null>(null);

  const entries = getHistory(sessionId);

  function handleRestore(idx: number) {
    const entry = entries[idx];
    if (!entry) return;
    setRestoredIdx(idx);
    onRestore?.(entry.name, entry.description);
    setTimeout(() => setRestoredIdx(null), 1500);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full z-50 w-full max-w-sm border-l border-white/10 bg-[#090f1c] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 ring-1 ring-indigo-500/30">
                  <History className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Version History</h2>
                  <p className="text-[11px] text-slate-500">Up to 20 name / description snapshots</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/60 ring-1 ring-white/8 mb-4">
                    <Clock className="h-8 w-8 text-slate-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400 mb-1">No history yet</p>
                  <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                    Snapshots are saved automatically each time you rename or redescribe this session.
                  </p>
                </div>
              ) : (
                entries.map((entry, idx) => (
                  <motion.div
                    key={`${entry.savedAt}-${idx}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={cn(
                      "group rounded-xl border p-3.5 transition-all",
                      idx === 0
                        ? "border-primary/30 bg-primary/5"
                        : "border-white/6 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-semibold text-white leading-tight truncate">{entry.name}</p>
                      {idx === 0 && (
                        <span className="shrink-0 text-[10px] font-bold text-primary border border-primary/40 bg-primary/10 rounded-full px-2 py-0.5">
                          Current
                        </span>
                      )}
                    </div>
                    {entry.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">{entry.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(entry.savedAt)}
                      </span>
                      {idx !== 0 && (
                        <button
                          onClick={() => handleRestore(idx)}
                          className={cn(
                            "flex items-center gap-1.5 text-[11px] font-semibold rounded-lg px-2.5 py-1 transition-all",
                            restoredIdx === idx
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20"
                          )}
                        >
                          <RotateCcw className="h-3 w-3" />
                          {restoredIdx === idx ? "Restored!" : "Restore"}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/8 px-5 py-3 shrink-0">
              <p className="text-[11px] text-slate-600 text-center">
                History is stored locally in your browser
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
