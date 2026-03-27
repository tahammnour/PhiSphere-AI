import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, ShieldCheck, ShieldAlert, ShieldX, Shield,
  ChevronDown, ChevronUp, ClipboardList, TrendingUp, Dna,
  FlaskConical, Atom, Book, Brain, Leaf, Pill, ClipboardList as ClipList,
  Layers, Star, BarChart3, Microscope, AlertCircle, Gauge, Filter, Calendar, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SafetySummary {
  checkedCount: number;
  blockedCount: number;
  flaggedCount: number;
  passedCount: number;
  avgGroundedness?: number | null;
  groundednessEvaluatedCount?: number;
}

interface RagChunkRef {
  sourceFile: string;
  pageNumber: number;
  score: number;
  chunkIndex?: number;
  excerpt?: string;
}

interface AuditEvent {
  messageId: number;
  role: string;
  sessionId: number;
  userId?: number | null;
  query?: string | null;
  contentPreview: string;
  createdAt: string;
  safety: {
    status: string;
    available: boolean;
    checkedAt: string;
    categories: { category: string; severity: number }[];
    blockedCategories: string[];
    flaggedCategories: string[];
  };
  groundednessScore?: number | null;
  groundednessJustification?: string | null;
  ragChunkRefs?: RagChunkRef[] | null;
  modelDeployment?: string | null;
}

interface AuditData {
  sessionId: number;
  sessionName: string;
  domain: string;
  totalMessages: number;
  summary: SafetySummary;
  events: AuditEvent[];
}

interface LabSessionBasic {
  id: number;
  name: string;
  domain: string;
}

const STATUS_CONFIG = {
  passed: { icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/15", label: "Passed" },
  flagged: { icon: ShieldAlert, color: "text-amber-400", bg: "bg-amber-500/5 border-amber-500/15", label: "Flagged" },
  blocked: { icon: ShieldX, color: "text-red-400", bg: "bg-red-500/5 border-red-500/15", label: "Blocked" },
  unavailable: { icon: Shield, color: "text-slate-400", bg: "bg-slate-500/5 border-slate-500/15", label: "Unavailable" },
};

const DOMAIN_ICONS: Record<string, typeof Book> = {
  biology: Dna, neuroscience: Brain, genetics: Microscope,
  pharmacology: Pill, chemistry: FlaskConical, materials: Layers,
  environmental: Leaf, clinical: ClipList, physics: Atom,
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

function GroundednessBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const barColor =
    pct >= 80 ? "bg-emerald-400" :
    pct >= 60 ? "bg-yellow-400" :
    pct >= 40 ? "bg-amber-400" : "bg-red-400";
  const textColor =
    pct >= 80 ? "text-emerald-400" :
    pct >= 60 ? "text-yellow-400" :
    pct >= 40 ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <Gauge className={cn("h-3 w-3 shrink-0", textColor)} />
      <div className="h-1 flex-1 rounded-full bg-slate-800">
        <div className={cn("h-1 rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-[10px] font-semibold tabular-nums", textColor)}>{pct}%</span>
      <span className="text-[10px] text-slate-600">grounded</span>
    </div>
  );
}

function AuditTableRow({ event }: { event: AuditEvent }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const cfg = STATUS_CONFIG[event.safety.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unavailable;
  const Icon = cfg.icon;
  const hasDetail = event.safety.categories.length > 0 || !!event.groundednessJustification || (event.ragChunkRefs && event.ragChunkRefs.length > 0);
  const gPct = event.groundednessScore !== null && event.groundednessScore !== undefined
    ? Math.round(event.groundednessScore * 100) : null;

  return (
    <>
      <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
        <td className="py-2.5 pl-4 pr-2 text-[11px] text-slate-500 whitespace-nowrap">
          {format(new Date(event.createdAt), "MMM d, HH:mm")}
        </td>
        <td className="py-2.5 px-2">
          <span className="text-[11px] text-slate-500">
            {event.userId != null ? `User #${event.userId}` : "anonymous"}
          </span>
        </td>
        <td className="py-2.5 px-2">
          <span className="rounded-full bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-slate-400 capitalize">{event.role}</span>
        </td>
        <td className="py-2.5 px-2 max-w-[180px]">
          {event.query ? (
            <span className="text-[11px] text-slate-400 truncate block" title={event.query}>
              {event.query.length > 50 ? event.query.slice(0, 50) + "…" : event.query}
            </span>
          ) : (
            <span className="text-[10px] text-slate-600">—</span>
          )}
        </td>
        <td className="py-2.5 px-2 max-w-[180px]">
          <span className="text-[11px] text-slate-500 truncate block" title={event.contentPreview}>
            {event.contentPreview.length > 60 ? event.contentPreview.slice(0, 60) + "…" : event.contentPreview}
          </span>
        </td>
        <td className="py-2.5 px-2">
          <div className="flex items-center gap-1.5">
            <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
            <span className={cn("text-[11px] font-semibold", cfg.color)}>{cfg.label}</span>
          </div>
          {(event.safety.blockedCategories.length > 0 || event.safety.flaggedCategories.length > 0) && (
            <div className="flex flex-wrap gap-0.5 mt-1">
              {[...event.safety.blockedCategories.map((c) => ({ c, t: "blocked" as const })),
                ...event.safety.flaggedCategories.map((c) => ({ c, t: "flagged" as const }))].map(({ c, t }) => (
                <span key={c + t} className={cn(
                  "rounded px-1 py-px text-[9px] font-semibold uppercase",
                  t === "blocked" ? "bg-red-400/10 text-red-400" : "bg-amber-400/10 text-amber-400"
                )}>{c}</span>
              ))}
            </div>
          )}
        </td>
        <td className="py-2.5 px-2">
          {gPct !== null ? (
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-14 rounded-full bg-slate-800">
                <div
                  className={cn("h-1 rounded-full", gPct >= 75 ? "bg-emerald-400" : gPct >= 50 ? "bg-yellow-400" : "bg-red-400")}
                  style={{ width: `${gPct}%` }}
                />
              </div>
              <span className={cn("text-[11px] font-semibold tabular-nums", gPct >= 75 ? "text-emerald-400" : gPct >= 50 ? "text-yellow-400" : "text-red-400")}>
                {gPct}%
              </span>
            </div>
          ) : event.role === "assistant" ? (
            <span className="text-[10px] text-slate-600 italic">not evaluated</span>
          ) : (
            <span className="text-[10px] text-slate-700">—</span>
          )}
        </td>
        <td className="py-2.5 px-2">
          {event.ragChunkRefs && event.ragChunkRefs.length > 0 ? (
            <span className="text-[11px] text-primary tabular-nums">{event.ragChunkRefs.length} src</span>
          ) : (
            <span className="text-[10px] text-slate-600">—</span>
          )}
        </td>
        <td className="py-2.5 pl-2 pr-4">
          {event.modelDeployment ? (
            <span className="rounded px-1.5 py-0.5 bg-primary/8 border border-primary/15 text-[9px] text-primary/80">Azure OpenAI</span>
          ) : (
            <span className="text-[10px] text-slate-600">—</span>
          )}
        </td>
        <td className="py-2.5 pl-2 pr-4">
          {hasDetail && (
            <button
              onClick={() => setDetailOpen((v) => !v)}
              className="rounded p-1 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            >
              {detailOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </td>
      </tr>
      {detailOpen && hasDetail && (
        <tr className="border-b border-white/[0.04]">
          <td colSpan={10} className="px-4 pb-4 pt-1">
            <div className="space-y-3 pl-2">
              {event.safety.categories.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {event.safety.categories.map((cat) => (
                    <div key={cat.category} className="rounded-lg bg-black/20 px-3 py-2 border border-white/5">
                      <p className="text-[10px] text-slate-500 capitalize mb-1">{cat.category}</p>
                      <div className="h-1 rounded-full bg-slate-800">
                        <div
                          className={cn("h-1 rounded-full", cat.severity >= 4 ? "bg-red-400" : cat.severity >= 2 ? "bg-amber-400" : "bg-emerald-400")}
                          style={{ width: `${(cat.severity / 7) * 100}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-600 mt-0.5">Severity {cat.severity}/7</p>
                    </div>
                  ))}
                </div>
              )}
              {event.groundednessJustification && (
                <div className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Gauge className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Groundedness Justification</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{event.groundednessJustification}</p>
                </div>
              )}
              {event.ragChunkRefs && event.ragChunkRefs.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">RAG Source Citations</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {event.ragChunkRefs.map((ref, i) => (
                      <div key={i} className="rounded-lg bg-black/20 border border-white/5 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-slate-300 truncate">{ref.sourceFile}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-slate-500">p.{ref.pageNumber}</span>
                            <span className="text-[10px] text-primary tabular-nums">{Math.round(ref.score * 100)}%</span>
                          </div>
                        </div>
                        {ref.excerpt && (
                          <p className="text-[10px] text-slate-500 line-clamp-2 italic mt-1">"{ref.excerpt}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

type StatusFilter = "all" | "passed" | "flagged" | "blocked";

export default function AuditLog() {
  const [, navigate] = useLocation();
  const [sessions, setSessions] = useState<LabSessionBasic[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetch("/api/lab-sessions")
      .then((r) => r.json())
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const loadAudit = async (id: number) => {
    setSelectedId(id);
    setIsLoading(true);
    setError("");
    setAuditData(null);
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    try {
      const res = await fetch(`/api/lab-sessions/${id}/audit`);
      if (res.ok) {
        setAuditData(await res.json());
      } else {
        setError("Failed to load audit data.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    if (!auditData) return [];
    return auditData.events.filter((e) => {
      if (statusFilter !== "all" && e.safety.status !== statusFilter) return false;
      if (dateFrom) {
        const from = new Date(dateFrom + "T00:00:00");
        if (new Date(e.createdAt) < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo + "T23:59:59");
        if (new Date(e.createdAt) > to) return false;
      }
      return true;
    });
  }, [auditData, statusFilter, dateFrom, dateTo]);

  const summary = auditData?.summary;
  const safetyScore = summary
    ? Math.round(((summary.passedCount) / Math.max(summary.checkedCount, 1)) * 100)
    : null;
  const avgGrndPct = summary?.avgGroundedness != null
    ? Math.round(summary.avgGroundedness * 100)
    : null;

  const hasFilters = statusFilter !== "all" || dateFrom !== "" || dateTo !== "";

  return (
    <div className="min-h-screen bg-[#040B16] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/4 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        {/* Back */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Control Panel
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <ClipboardList className="h-7 w-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Safety Audit Log</h1>
            <p className="text-sm text-slate-500 mt-0.5">Content safety &amp; groundedness records for all lab sessions</p>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-slate-300">{sessions.length} sessions</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          {/* Session list */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-1 mb-3">Select a Session</p>
            {sessions.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">
                <Microscope className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No sessions found.</p>
              </div>
            ) : (
              sessions.map((s) => {
                const Icon = DOMAIN_ICONS[s.domain] || Book;
                const domainColor = DOMAIN_COLORS[s.domain] ?? DOMAIN_COLORS.general;
                const isSelected = selectedId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => loadAudit(s.id)}
                    className={cn(
                      "w-full text-left rounded-2xl border px-4 py-3 transition-all flex items-center gap-3",
                      isSelected
                        ? "border-primary/30 bg-primary/8 shadow-[inset_2px_0_0_rgba(0,201,177,0.8)]"
                        : "border-white/6 bg-white/[0.02] hover:border-primary/20 hover:bg-white/[0.04]"
                    )}
                  >
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", domainColor)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-semibold truncate", isSelected ? "text-white" : "text-slate-300")}>{s.name}</p>
                      <p className="text-[11px] text-slate-600 capitalize mt-0.5">{s.domain.replace("-", " ")}</p>
                    </div>
                    {isSelected && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Content area */}
          <div className="space-y-4">
            {!selectedId && (
              <div className="rounded-3xl border border-white/6 bg-white/[0.02] p-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/15 mx-auto mb-4">
                  <ShieldCheck className="h-8 w-8 text-blue-400" />
                </div>
                <p className="text-base font-semibold text-slate-400 mb-1">Select a session</p>
                <p className="text-sm text-slate-600">Choose a lab session from the left to view its full content safety audit trail.</p>
              </div>
            )}

            {isLoading && (
              <div className="rounded-3xl border border-white/6 bg-white/[0.02] p-16 text-center">
                <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
                <p className="text-sm text-slate-500">Loading audit data…</p>
              </div>
            )}

            {error && !isLoading && (
              <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {auditData && !isLoading && (
              <>
                {/* Stats */}
                <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-bold text-white">{auditData.sessionName}</p>
                      <p className="text-xs text-slate-500 capitalize mt-0.5">{auditData.domain.replace("-", " ")} · {auditData.totalMessages} messages</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {avgGrndPct !== null && (
                        <div className="text-right">
                          <p className={cn("text-2xl font-bold", avgGrndPct >= 80 ? "text-emerald-400" : avgGrndPct >= 60 ? "text-yellow-400" : "text-amber-400")}>
                            {avgGrndPct}%
                          </p>
                          <p className="text-[10px] text-slate-600 uppercase tracking-wider">Avg. grounded</p>
                        </div>
                      )}
                      {safetyScore !== null && (
                        <div className="text-right">
                          <p className={cn("text-2xl font-bold", safetyScore >= 90 ? "text-emerald-400" : safetyScore >= 70 ? "text-amber-400" : "text-red-400")}>
                            {safetyScore}%
                          </p>
                          <p className="text-[10px] text-slate-600 uppercase tracking-wider">Safety score</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Total", value: auditData.totalMessages, color: "text-white", bg: "bg-white/[0.04] border-white/6" },
                      { label: "Passed", value: summary?.passedCount ?? 0, color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/15" },
                      { label: "Flagged", value: summary?.flaggedCount ?? 0, color: "text-amber-400", bg: "bg-amber-500/5 border-amber-500/15" },
                      { label: "Blocked", value: summary?.blockedCount ?? 0, color: "text-red-400", bg: "bg-red-500/5 border-red-500/15" },
                    ].map((stat) => (
                      <div key={stat.label} className={cn("rounded-xl border px-3 py-3 text-center", stat.bg)}>
                        <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {safetyScore !== null && (
                    <div className="mt-1">
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            safetyScore >= 90 ? "bg-emerald-400" : safetyScore >= 70 ? "bg-amber-400" : "bg-red-400"
                          )}
                          style={{ width: `${safetyScore}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Filters */}
                <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Filters</span>
                    {hasFilters && (
                      <button
                        onClick={() => { setStatusFilter("all"); setDateFrom(""); setDateTo(""); }}
                        className="ml-auto text-[10px] text-primary hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Status filter */}
                    <div className="flex gap-1">
                      {(["all", "passed", "flagged", "blocked"] as StatusFilter[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition-all border",
                            statusFilter === s
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-white/[0.03] border-white/6 text-slate-500 hover:text-slate-300"
                          )}
                        >
                          {s === "all" ? "All" : s}
                        </button>
                      ))}
                    </div>

                    {/* Date range */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Calendar className="h-3 w-3 text-slate-600" />
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="rounded-lg bg-white/[0.03] border border-white/8 px-2 py-1 text-[11px] text-slate-400 focus:outline-none focus:border-primary/40"
                        placeholder="From"
                      />
                      <span className="text-slate-600 text-[10px]">to</span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="rounded-lg bg-white/[0.03] border border-white/8 px-2 py-1 text-[11px] text-slate-400 focus:outline-none focus:border-primary/40"
                        placeholder="To"
                      />
                    </div>
                  </div>
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-8 text-center">
                    <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-emerald-300 mb-1">
                      {hasFilters ? "No events match filters" : "All Clear"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {hasFilters
                        ? "Try adjusting your filters to see more events."
                        : "No audit events recorded yet."}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04]">
                      <Info className="h-3 w-3 text-slate-600" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                        {filteredEvents.length} {hasFilters ? "filtered" : ""} Audit Events
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[820px] text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                            {["Timestamp", "User", "Role", "Query", "Response Preview", "Safety", "Groundedness", "RAG Refs", "Model", ""].map((h) => (
                              <th key={h} className="py-2 px-2 first:pl-4 last:pr-4 text-[9px] font-bold uppercase tracking-widest text-slate-600 whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEvents.map((event) => (
                            <AuditTableRow key={event.messageId} event={event} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
