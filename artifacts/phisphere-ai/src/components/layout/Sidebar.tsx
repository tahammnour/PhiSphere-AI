import { format } from "date-fns";
import { useState, useRef, useEffect } from "react";
import {
  Plus, Trash2, Dna, FlaskConical, Atom, Book, Info, LogOut, LayoutDashboard,
  Settings, Brain, Leaf, Pill, ClipboardList, Layers, Star, BarChart3, Microscope,
  Search, X, ClipboardCheck, Pin, Archive, ArchiveRestore, Tag as TagIcon, Inbox, type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AzureStatusPanel } from "./AzureStatusPanel";
import { useLocation } from "wouter";
import type { LabSession } from "@workspace/api-client-react";
import { useAuth, getStoredUser } from "@/hooks/use-auth";
import { useSessionMeta } from "@/hooks/use-session-meta";

interface SidebarProps {
  sessions: LabSession[];
  selectedSessionId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

const DOMAIN_ICONS: Record<string, LucideIcon> = {
  biology: Dna, neuroscience: Brain, genetics: Microscope,
  pharmacology: Pill, chemistry: FlaskConical, materials: Layers,
  environmental: Leaf, clinical: ClipboardList, physics: Atom,
  astrophysics: Star, "data-science": BarChart3, general: Book,
};

const DOMAIN_COLORS: Record<string, string> = {
  biology: "text-emerald-400 bg-emerald-400/10",
  neuroscience: "text-violet-400 bg-violet-400/10",
  genetics: "text-teal-400 bg-teal-400/10",
  pharmacology: "text-rose-400 bg-rose-400/10",
  chemistry: "text-amber-400 bg-amber-400/10",
  materials: "text-cyan-400 bg-cyan-400/10",
  environmental: "text-green-400 bg-green-400/10",
  clinical: "text-blue-400 bg-blue-400/10",
  physics: "text-indigo-400 bg-indigo-400/10",
  astrophysics: "text-purple-400 bg-purple-400/10",
  "data-science": "text-orange-400 bg-orange-400/10",
  general: "text-slate-400 bg-slate-400/10",
};

const DOMAIN_BADGE_COLORS: Record<string, string> = {
  biology: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  neuroscience: "bg-violet-400/10 text-violet-400 border-violet-400/20",
  genetics: "bg-teal-400/10 text-teal-400 border-teal-400/20",
  pharmacology: "bg-rose-400/10 text-rose-400 border-rose-400/20",
  chemistry: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  materials: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
  environmental: "bg-green-400/10 text-green-400 border-green-400/20",
  clinical: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  physics: "bg-indigo-400/10 text-indigo-400 border-indigo-400/20",
  astrophysics: "bg-purple-400/10 text-purple-400 border-purple-400/20",
  "data-science": "bg-orange-400/10 text-orange-400 border-orange-400/20",
  general: "bg-slate-400/10 text-slate-400 border-slate-400/20",
};

const PLAN_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  monthly: { label: "Monthly", color: "text-blue-300 bg-blue-500/15 border-blue-500/25", dot: "bg-blue-400" },
  annual: { label: "Annual ✦", color: "text-indigo-300 bg-indigo-500/15 border-indigo-500/25", dot: "bg-indigo-400" },
  free: { label: "Free", color: "text-slate-400 bg-slate-500/10 border-slate-500/20", dot: "bg-slate-500" },
};

const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-teal-500 to-emerald-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
];

type FilterTab = "all" | "pinned" | "archived";

function TagInput({ sessionId, onClose }: { sessionId: number; onClose: () => void }) {
  const [value, setValue] = useState("");
  const { getMeta, addTag, removeTag } = useSessionMeta();
  const m = getMeta(sessionId);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => {
    const tag = value.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && tag.length <= 20) { addTag(sessionId, tag); setValue(""); }
  };

  return (
    <div className="mt-1.5 rounded-xl border border-white/8 bg-white/[0.03] p-2.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-1 mb-2">
        {(m.tags ?? []).map((t) => (
          <span key={t} className="flex items-center gap-0.5 rounded-full bg-primary/15 border border-primary/25 px-2 py-0.5 text-[10px] text-primary">
            {t}
            <button onClick={() => removeTag(sessionId, t)} className="ml-0.5 hover:text-red-400 transition-colors">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); submit(); }
            if (e.key === "Escape") onClose();
          }}
          placeholder="Add tag…"
          maxLength={20}
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-300 placeholder-slate-600 outline-none focus:border-primary/40 min-w-0 transition-colors"
        />
        <button onClick={submit} className="rounded-lg bg-primary/20 border border-primary/30 px-2.5 py-1.5 text-[11px] text-primary hover:bg-primary/30 transition-colors font-bold">+</button>
        <button onClick={onClose} className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-slate-500 hover:text-slate-300 transition-colors"><X className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

export function Sidebar({ sessions, selectedSessionId, onSelect, onNew, onDelete, isLoading }: SidebarProps) {
  const [, navigate] = useLocation();
  const { logout } = useAuth();
  const storedUser = getStoredUser();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [tagInputFor, setTagInputFor] = useState<number | null>(null);
  const { getMeta, togglePin, toggleArchive } = useSessionMeta();

  const handleLogout = async () => {
    await logout();
    navigate("/landing");
  };

  const avatarGradient = storedUser
    ? AVATAR_GRADIENTS[storedUser.username.charCodeAt(0) % AVATAR_GRADIENTS.length]
    : AVATAR_GRADIENTS[0];

  const baseFiltered = sessions.filter((s) => {
    const m = getMeta(s.id);
    if (filter === "pinned") return m.pinned && !m.archived;
    if (filter === "archived") return !!m.archived;
    return !m.archived;
  });

  const filteredSessions = search.trim()
    ? baseFiltered.filter((s) => {
        const m = getMeta(s.id);
        return (
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.domain.toLowerCase().includes(search.toLowerCase()) ||
          m.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
        );
      })
    : baseFiltered;

  const sorted = [...filteredSessions].sort((a, b) => {
    const ap = getMeta(a.id).pinned ? 1 : 0;
    const bp = getMeta(b.id).pinned ? 1 : 0;
    return bp - ap;
  });

  const planInfo = PLAN_LABELS[storedUser?.plan ?? "free"] ?? PLAN_LABELS.free;

  return (
    <div className="flex h-full w-72 flex-col bg-[#070d1a] relative z-20" style={{ boxShadow: "1px 0 0 0 rgba(255,255,255,0.05)" }}>

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Logo */}
      <div className="flex shrink-0 items-center px-5 py-4">
        <img src="/images/phisphere-logo.png" alt="PhiSphere AI" className="h-8 w-auto" />
      </div>

      {/* User card */}
      {storedUser && (
        <div className="mx-3 mb-3 rounded-2xl border border-white/6 bg-white/[0.03] p-3 flex items-center gap-3">
          <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGradient} text-sm font-bold text-white shadow-lg`}>
            {storedUser.username.charAt(0).toUpperCase()}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#070d1a] shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">{storedUser.username}</p>
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mt-0.5",
              planInfo.color
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", planInfo.dot)} />
              {planInfo.label}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="shrink-0 rounded-xl p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/8 transition-all"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* New session button */}
      <div className="px-3 pb-3 shrink-0">
        <button
          id="tour-new-session"
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-teal-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-[0_2px_20px_rgba(0,201,177,0.25)] hover:shadow-[0_4px_25px_rgba(0,201,177,0.4)] hover:-translate-y-0.5 transition-all active:translate-y-0"
        >
          <Plus className="h-4 w-4" />
          New Lab Session
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 min-h-0">

        {/* Filter tabs */}
        <div className="flex gap-1 mb-2.5 rounded-xl bg-white/[0.03] border border-white/5 p-0.5">
          {([
            { id: "all", label: "All", icon: Inbox },
            { id: "pinned", label: "Pinned", icon: Pin },
            { id: "archived", label: "Archived", icon: Archive },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold transition-all",
                filter === id
                  ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
              )}
            >
              <Icon className="h-2.5 w-2.5" />{label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions & tags…"
            className="w-full rounded-xl border border-white/8 bg-white/[0.03] pl-9 pr-8 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-primary/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-primary/15 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Section label */}
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 px-1 mb-2">
          {filter === "all" ? "Experiments" : filter === "pinned" ? "Pinned" : "Archived"}
          {sorted.length > 0 && <span className="ml-1.5 text-slate-700">({sorted.length})</span>}
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-white/[0.04]" />
            ))}
          </div>
        ) : filter === "archived" && sorted.length === 0 ? (
          <div className="py-10 text-center">
            <Archive className="h-8 w-8 text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">No archived sessions</p>
          </div>
        ) : filter === "pinned" && sorted.length === 0 ? (
          <div className="py-10 text-center">
            <Pin className="h-8 w-8 text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">No pinned sessions</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/6 mx-auto mb-3">
              <Microscope className="h-7 w-7 text-slate-600" />
            </div>
            <p className="text-xs font-semibold text-slate-400 mb-1">No experiments yet</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">Create your first lab session<br />to get started</p>
          </div>
        ) : sorted.length === 0 && search ? (
          <div className="py-8 text-center">
            <Search className="h-7 w-7 text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No results for "{search}"</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sorted.map((session) => {
              const Icon = DOMAIN_ICONS[session.domain] || Book;
              const domainColor = DOMAIN_COLORS[session.domain] ?? DOMAIN_COLORS.general;
              const badgeColor = DOMAIN_BADGE_COLORS[session.domain] ?? DOMAIN_BADGE_COLORS.general;
              const isSelected = selectedSessionId === session.id;
              const m = getMeta(session.id);

              return (
                <div key={session.id}>
                  <div
                    onClick={() => { if (tagInputFor !== session.id) onSelect(session.id); }}
                    className={cn(
                      "group relative flex cursor-pointer flex-col gap-1.5 rounded-xl p-3 text-sm transition-all duration-200",
                      isSelected
                        ? "bg-primary/8 shadow-[inset_2px_0_0_rgba(0,201,177,0.9),inset_0_0_20px_rgba(0,201,177,0.04)] border border-primary/20"
                        : "border border-transparent hover:bg-white/[0.04] hover:border-white/8"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", domainColor)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className={cn(
                            "text-xs font-semibold truncate leading-tight",
                            isSelected ? "text-white" : "text-slate-200"
                          )}>
                            {session.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-600">{format(new Date(session.createdAt), "MMM d")}</span>
                            <span className={cn("inline-flex rounded-full border px-1.5 py-px text-[9px] font-semibold capitalize", badgeColor)}>
                              {session.domain.replace("-", " ")}
                            </span>
                            {m.pinned && <Pin className="h-2.5 w-2.5 text-amber-400" />}
                            {m.archived && <span className="text-[9px] font-bold text-violet-400">archived</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePin(session.id); }}
                          title={m.pinned ? "Unpin" : "Pin"}
                          className={cn("rounded-lg p-1 transition-colors", m.pinned ? "text-amber-400" : "text-slate-600 hover:text-amber-400 hover:bg-amber-400/8")}
                        >
                          <Pin className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setTagInputFor(tagInputFor === session.id ? null : session.id); }}
                          title="Tags"
                          className={cn("rounded-lg p-1 transition-colors", tagInputFor === session.id ? "text-primary" : "text-slate-600 hover:text-primary hover:bg-primary/8")}
                        >
                          <TagIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleArchive(session.id); }}
                          title={m.archived ? "Restore" : "Archive"}
                          className="rounded-lg p-1 text-slate-600 hover:text-violet-400 hover:bg-violet-400/8 transition-colors"
                        >
                          {m.archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Permanently delete this session and all its data?")) {
                              onDelete(session.id);
                            }
                          }}
                          className="rounded-lg p-1 text-slate-600 hover:text-red-400 hover:bg-red-400/8 transition-colors"
                          aria-label="Delete session"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Tags row */}
                    {m.tags && m.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pl-9">
                        {m.tags.map((t) => (
                          <span key={t} className="rounded-full bg-primary/10 border border-primary/20 px-1.5 py-px text-[9px] text-primary font-medium">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {tagInputFor === session.id && (
                    <TagInput sessionId={session.id} onClose={() => setTagInputFor(null)} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/5">
        <AzureStatusPanel />
        <div className="px-2 py-2 grid grid-cols-4 gap-1">
          {[
            { icon: LayoutDashboard, label: "Home", onClick: () => navigate("/") },
            { icon: ClipboardCheck, label: "Audit", onClick: () => navigate("/audit-log") },
            { icon: Settings, label: "Settings", onClick: () => navigate("/settings") },
            { icon: Info, label: "About", onClick: () => navigate("/about") },
          ].map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-slate-600 hover:text-slate-300 hover:bg-white/[0.04] transition-all"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[9px] font-semibold tracking-wide">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
