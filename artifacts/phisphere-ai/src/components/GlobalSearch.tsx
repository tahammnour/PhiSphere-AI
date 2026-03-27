import { useState, useEffect, useRef } from "react";
import { Search, X, FlaskConical, Dna, Brain, Microscope, Pill, FlaskConical as ChemIcon, Layers, Leaf, ClipboardList, Atom, Star, BarChart3, Book, Tag, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import type { LabSession } from "@workspace/api-client-react";
import { useSessionMeta } from "@/hooks/use-session-meta";

interface GlobalSearchProps {
  sessions: LabSession[];
  onSelectSession: (id: number) => void;
  open: boolean;
  onClose: () => void;
}

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  biology: Dna, neuroscience: Brain, genetics: Microscope,
  pharmacology: Pill, chemistry: ChemIcon, materials: Layers,
  environmental: Leaf, clinical: ClipboardList, physics: Atom,
  astrophysics: Star, "data-science": BarChart3, general: Book,
};

export function GlobalSearch({ sessions, onSelectSession, open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const { getMeta } = useSessionMeta();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!open) return;
        onClose();
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const q = query.trim().toLowerCase();
  const results = q
    ? sessions.filter((s) => {
        const m = getMeta(s.id);
        return (
          s.name.toLowerCase().includes(q) ||
          s.domain.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          m.tags?.some((t) => t.toLowerCase().includes(q))
        );
      })
    : sessions.slice(0, 8);

  const pinned = results.filter((s) => getMeta(s.id).pinned);
  const rest = results.filter((s) => !getMeta(s.id).pinned);
  const grouped = [...pinned, ...rest];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#0d1829] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sessions, domains, tags…"
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-600 hover:text-slate-400">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-500 font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto py-2">
          {grouped.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              {q ? `No sessions matching "${query}"` : "No sessions yet"}
            </div>
          ) : (
            <>
              {!q && <p className="px-4 pb-1 text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Recent Sessions</p>}
              {grouped.map((session) => {
                const Icon = DOMAIN_ICONS[session.domain] || Book;
                const m = getMeta(session.id);
                return (
                  <button
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      navigate("/lab");
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-slate-200 truncate">{session.name}</span>
                        {m.pinned && <Pin className="h-3 w-3 text-amber-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500 capitalize">{session.domain}</span>
                        {m.tags?.length ? (
                          <div className="flex gap-1">
                            {m.tags.slice(0, 3).map((t) => (
                              <span key={t} className="flex items-center gap-0.5 rounded px-1 py-0 text-[9px] bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                <Tag className="h-2 w-2" />{t}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors shrink-0">Open →</span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        <div className="border-t border-white/5 px-4 py-2 flex items-center gap-4 text-[10px] text-slate-600">
          <span><kbd className="font-mono bg-white/5 border border-white/10 rounded px-1">↑↓</kbd> Navigate</span>
          <span><kbd className="font-mono bg-white/5 border border-white/10 rounded px-1">↵</kbd> Open</span>
          <span><kbd className="font-mono bg-white/5 border border-white/10 rounded px-1">ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
