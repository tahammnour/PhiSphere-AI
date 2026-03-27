import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  FlaskConical, Plus, Brain, ShieldCheck, Eye, BookOpen,
  ArrowRight, Database, BarChart3, Zap, LogOut, Settings,
  ExternalLink, Microscope, ChevronRight, User, CreditCard, Camera,
  Bell, Pin, Archive, Activity, Shield, Target, Globe,
  FileText, Search, Languages, GraduationCap,
} from "lucide-react";
import { getStoredUser, useAuth } from "@/hooks/use-auth";
import { useGetAzureStatus, useListLabSessions } from "@workspace/api-client-react";
import { Changelog, getChangelogUnread, markChangelogSeen } from "@/components/Changelog";
import { useSessionMeta } from "@/hooks/use-session-meta";

const AVATAR_COLORS: Record<string, { from: string; to: string }> = {
  blue: { from: "from-blue-600", to: "to-indigo-600" },
  violet: { from: "from-violet-600", to: "to-purple-600" },
  emerald: { from: "from-emerald-500", to: "to-teal-600" },
  rose: { from: "from-rose-500", to: "to-pink-600" },
  amber: { from: "from-amber-500", to: "to-orange-600" },
  cyan: { from: "from-cyan-500", to: "to-blue-600" },
};

type HealthStatus = "healthy" | "error" | "demo" | "unconfigured";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
};

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  monthly: { label: "Monthly Plan", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  annual: { label: "Annual Plan", color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" },
  free: { label: "Free Plan", color: "text-slate-400 bg-slate-400/10 border-slate-400/20" },
};

const RESOURCES = [
  { label: "OpenML Datasets", desc: "Open machine learning dataset repository", href: "https://www.openml.org/", icon: Database, color: "text-blue-400" },
  { label: "Kaggle Sensor Datasets", desc: "Browse sensor & IoT datasets for lab experiments", href: "https://www.kaggle.com/datasets?search=sensor", icon: BarChart3, color: "text-indigo-400" },
  { label: "Azure ML Examples", desc: "Azure Machine Learning code examples & notebooks", href: "https://github.com/Azure/azureml-examples", icon: Zap, color: "text-violet-400" },
  { label: "Python OpenAI Demos", desc: "Azure OpenAI Python samples & prompting patterns", href: "https://github.com/Azure-Samples/python-openai-demos", icon: Brain, color: "text-blue-400" },
  { label: "Content Safety Studio", desc: "Test & configure Azure AI Content Safety policies", href: "https://contentsafety.cognitive.azure.com/", icon: ShieldCheck, color: "text-emerald-400" },
  { label: "Responsible AI Toolbox", desc: "Microsoft RAI tools: fairness, explainability & more", href: "https://github.com/microsoft/responsible-ai-toolbox", icon: BookOpen, color: "text-amber-400" },
];

function ServiceDot({ health }: { health?: HealthStatus }) {
  if (health === "healthy") return <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] shrink-0" />;
  if (health === "error") return <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)] shrink-0" />;
  return <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)] shrink-0" />;
}

function ServiceBadge({ health }: { health?: HealthStatus }) {
  if (health === "healthy") return <span className="text-xs font-bold text-emerald-400">Active</span>;
  if (health === "error") return <span className="text-xs font-bold text-red-400">Error</span>;
  if (health === "unconfigured" || !health) return <span className="text-xs font-bold text-slate-500">Not Set</span>;
  return <span className="text-xs font-bold text-amber-400">Demo</span>;
}

export default function ControlPanel() {
  const [, navigate] = useLocation();
  const { logout } = useAuth();
  const [user, setUser] = useState(getStoredUser());
  const { data: status } = useGetAzureStatus();
  const { data: sessions = [] } = useListLabSessions();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(() => getChangelogUnread());
  const { getMeta } = useSessionMeta();

  const avatarColor = localStorage.getItem("phisphere_avatar_color") ?? "blue";
  const avatarImage = localStorage.getItem("phisphere_avatar_image");
  const displayName = localStorage.getItem("phisphere_display_name") ?? "";
  const ac = AVATAR_COLORS[avatarColor] ?? AVATAR_COLORS.blue;
  const displayInitial = (displayName || user?.username || "?").charAt(0).toUpperCase();
  const effectiveName = displayName.trim() || user?.username || "Researcher";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const cs = status?.contentSafety as { health?: HealthStatus } | undefined;
  const vision = status?.vision as { health?: HealthStatus } | undefined;
  const openai = (status as Record<string, unknown>)?.openai as { health?: HealthStatus } | undefined;
  const docIntel = (status as Record<string, unknown>)?.documentIntelligence as { health?: HealthStatus } | undefined;
  const search = (status as Record<string, unknown>)?.search as { health?: HealthStatus } | undefined;
  const language = (status as Record<string, unknown>)?.language as { health?: HealthStatus } | undefined;
  const appInsights = (status as Record<string, unknown>)?.appInsights as { health?: HealthStatus } | undefined;

  const planInfo = PLAN_LABELS[user?.plan ?? "free"] ?? PLAN_LABELS.free;

  const handleLogout = async () => {
    await logout();
    navigate("/landing");
  };

  interface MetricsDashboard {
    totalSessions: number;
    totalConversations: number;
    totalMessages: number;
    assistantMessages: number;
    safetyCheckedCount: number;
    safetyPassedCount: number;
    safetyFlaggedCount: number;
    safetyBlockedCount: number;
    safetyPassRate: number | null;
    avgGroundedness: number | null;
    groundednessEvaluatedCount: number;
    ragEnabledMessages: number;
    openmlImports: number;
    azureServicesActive: number;
    azureServicesTotal: number;
  }

  const [metrics, setMetrics] = useState<MetricsDashboard | null>(null);

  useEffect(() => {
    fetch("/api/metrics/dashboard")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setMetrics(data); })
      .catch(() => {});
  }, []);

  const demoSessions = sessions.filter((s) => s.name.includes("Demo") || s.name.includes("⚗️") || s.name.includes("🌿") || s.name.includes("🔬"));
  const recentSessions = sessions.slice(0, 4);
  const pinnedCount = sessions.filter((s) => getMeta(s.id).pinned).length;
  const archivedCount = sessions.filter((s) => getMeta(s.id).archived).length;

  const openChangelog = () => {
    setChangelogOpen(true);
    markChangelogSeen();
    setHasUnread(false);
  };

  return (
    <div className="min-h-screen bg-[#040B16] text-foreground overflow-y-auto">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/3 w-[700px] h-[700px] bg-blue-600/4 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/4 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-10"
        >
          <img src="/images/phisphere-logo.png" alt="PhiSphere AI" className="h-9 w-auto" />
          <div className="flex items-center gap-2">
          {/* Changelog bell */}
          <button
            onClick={openChangelog}
            className="relative rounded-xl border border-white/8 bg-white/[0.03] p-2 hover:bg-white/[0.07] transition-colors"
            title="What's New"
          >
            <Bell className="h-4 w-4 text-slate-400" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
            )}
          </button>
          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.06] hover:border-white/15 transition-all"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white leading-none mb-0.5">{effectiveName}</p>
                <span className={`text-[10px] font-bold rounded-full border px-1.5 py-0.5 ${planInfo.color}`}>{planInfo.label}</span>
              </div>
              <div className="relative h-9 w-9 shrink-0 rounded-full overflow-hidden">
                {avatarImage ? (
                  <img src={avatarImage} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${ac.from} ${ac.to} text-sm font-bold text-white`}>
                    {displayInitial}
                  </div>
                )}
              </div>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/10 bg-[#0d1829] shadow-2xl shadow-black/50 overflow-hidden z-50"
                >
                  {/* User info header */}
                  <div className="flex items-center gap-3 px-4 py-4 border-b border-white/8">
                    <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden">
                      {avatarImage ? (
                        <img src={avatarImage} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${ac.from} ${ac.to} text-lg font-bold text-white`}>
                          {displayInitial}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{effectiveName}</p>
                      <p className="text-xs text-slate-500 truncate">@{user?.username}</p>
                      <span className={`text-[10px] font-bold rounded-full border px-1.5 py-0.5 ${planInfo.color}`}>{planInfo.label}</span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <User className="h-4 w-4 text-blue-400 shrink-0" />
                      Profile &amp; Settings
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Camera className="h-4 w-4 text-violet-400 shrink-0" />
                      Change Photo or Avatar
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/billing"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <CreditCard className="h-4 w-4 text-indigo-400 shrink-0" />
                      Billing &amp; Invoices
                    </button>
                  </div>

                  <div className="border-t border-white/8 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/8 transition-colors"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>
        </motion.div>

        {/* ── WELCOME HERO ── */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 via-indigo-600/8 to-violet-600/5 p-8 mb-6 relative overflow-hidden"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.05, 0.15] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-1/2 right-10 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none"
          />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">Welcome back,</p>
              <h1 className="text-3xl font-display font-bold text-white mb-3">
                {user?.username ?? "Researcher"} 👋
              </h1>
              <p className="text-slate-400 max-w-lg">
                Your AI lab notebook is ready. Start a new experiment, load a demo, or explore the datasets below.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/lab")}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]"
              >
                <FlaskConical className="h-4 w-4" />
                Open Lab Notebook
                <ArrowRight className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/lab")}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-300 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Experiment
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ── STATS ROW ── */}
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: "Lab Sessions", value: sessions.length },
            { label: "Pinned", value: pinnedCount, icon: Pin },
            { label: "Archived", value: archivedCount, icon: Archive },
            { label: "Plan", value: planInfo.label.replace(" Plan", "") },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-center">
              <p className="text-2xl font-display font-bold text-white mb-1">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── USAGE DASHBOARD ── */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="mb-6">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Usage Dashboard</h2>
              <button onClick={() => navigate("/billing")} className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors">Manage Plan →</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Sessions Created",
                  value: sessions.length,
                  limit: user?.plan === "annual" ? null : 50,
                  color: "bg-blue-500",
                  desc: user?.plan === "annual" ? "Unlimited (Annual Plan)" : `${Math.max(0, 50 - sessions.length)} remaining`,
                },
                {
                  label: "AI Services",
                  value: [openai?.health, cs?.health, vision?.health, docIntel?.health, search?.health, language?.health, appInsights?.health].filter(h => h === "healthy").length + 1,
                  limit: 8,
                  color: "bg-emerald-500",
                  desc: "Azure AI integrations active",
                },
                {
                  label: "Experiments Archived",
                  value: archivedCount,
                  limit: null,
                  color: "bg-violet-500",
                  desc: "Soft-deleted, recoverable",
                },
              ].map(({ label, value, limit, color, desc }) => (
                <div key={label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">{label}</span>
                    <span className="text-xs font-bold text-white">{value}{limit ? `/${limit}` : ""}</span>
                  </div>
                  {limit && (
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-500`}
                        style={{ width: `${Math.min(100, (value / limit) * 100)}%` }}
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* ── AI SERVICES STATUS ── */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="lg:col-span-1">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white">AI Services</h2>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Live Status</span>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Brain, label: "Azure OpenAI", health: openai?.health, desc: "GPT-4o scientific reasoning" },
                  { icon: ShieldCheck, label: "Content Safety", health: cs?.health, desc: "Fail-closed response screening" },
                  { icon: Eye, label: "AI Vision", health: vision?.health, desc: "Image & OCR analysis" },
                  { icon: FileText, label: "Document Intelligence", health: docIntel?.health, desc: "PDF extraction for RAG" },
                  { icon: Search, label: "AI Search", health: search?.health, desc: "RAG grounding & citations" },
                  { icon: Languages, label: "AI Language", health: language?.health, desc: "Entity recognition (NER)" },
                  { icon: Activity, label: "Application Insights", health: appInsights?.health, desc: "Telemetry & event tracking" },
                  { icon: GraduationCap, label: "Azure ML", health: "healthy" as HealthStatus, desc: "RAI Toolbox notebooks" },
                ].map(({ icon: Icon, label, health, desc }) => (
                  <div key={label} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <ServiceDot health={health} />
                    <Icon className="h-4 w-4 text-slate-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-300 truncate">{label}</p>
                      <p className="text-[10px] text-slate-600">{desc}</p>
                    </div>
                    <ServiceBadge health={health} />
                  </div>
                ))}
              </div>
              {[cs?.health, vision?.health, openai?.health, docIntel?.health, search?.health, language?.health, appInsights?.health].some(h => h === "unconfigured" || !h) && (
                <div className="mt-4 rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-2.5">
                  <p className="text-[11px] text-slate-300 font-semibold mb-0.5">Azure Secrets Required</p>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Some services are unconfigured. See <code className="text-blue-400">.env.example</code> for the full list of Azure credentials needed to enable all 8 services.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── RECENT SESSIONS ── */}
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="lg:col-span-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white">Lab Sessions</h2>
                <button
                  onClick={() => navigate("/lab")}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Microscope className="h-10 w-10 text-slate-700 mb-3" />
                  <p className="text-sm text-slate-500 mb-4">No sessions yet. Start your first experiment!</p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    onClick={() => navigate("/lab")}
                    className="flex items-center gap-2 rounded-xl bg-blue-600/20 border border-blue-600/30 px-4 py-2 text-xs font-bold text-blue-400 hover:bg-blue-600/30 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create First Session
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <motion.button
                      key={session.id}
                      whileHover={{ x: 3, backgroundColor: "rgba(255,255,255,0.05)" }}
                      onClick={() => navigate("/lab")}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                    >
                      <FlaskConical className="h-4 w-4 text-blue-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{session.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{session.domain}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 shrink-0" />
                    </motion.button>
                  ))}
                  {sessions.length > 4 && (
                    <p className="text-xs text-slate-600 text-center pt-1">+{sessions.length - 4} more sessions in the lab notebook</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── PLATFORM METRICS ── */}
        {metrics && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="mb-6">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white">Platform Metrics</h2>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Hackathon KPIs</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  { label: "Total Messages", value: metrics.totalMessages, icon: BarChart3, color: "text-blue-400" },
                  { label: "AI Responses", value: metrics.assistantMessages, icon: Brain, color: "text-indigo-400" },
                  { label: "Safety Pass Rate", value: metrics.safetyPassRate !== null ? `${(metrics.safetyPassRate * 100).toFixed(1)}%` : "N/A", icon: Shield, color: "text-emerald-400" },
                  { label: "Avg Groundedness", value: metrics.avgGroundedness !== null ? `${(metrics.avgGroundedness * 100).toFixed(0)}%` : "N/A", icon: Target, color: "text-teal-400" },
                  { label: "RAG-Grounded", value: metrics.ragEnabledMessages, icon: Database, color: "text-violet-400" },
                  { label: "Azure Services", value: `${metrics.azureServicesActive}/${metrics.azureServicesTotal}`, icon: Zap, color: "text-amber-400" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                    <Icon className={`h-4 w-4 ${color} mx-auto mb-1.5`} />
                    <p className="text-lg font-display font-bold text-white">{value}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {(metrics.safetyFlaggedCount > 0 || metrics.safetyBlockedCount > 0 || metrics.openmlImports > 0) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {metrics.safetyFlaggedCount > 0 && (
                    <span className="text-[10px] rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 px-2 py-0.5">
                      {metrics.safetyFlaggedCount} flagged
                    </span>
                  )}
                  {metrics.safetyBlockedCount > 0 && (
                    <span className="text-[10px] rounded-full border border-red-500/20 bg-red-500/10 text-red-400 px-2 py-0.5">
                      {metrics.safetyBlockedCount} blocked
                    </span>
                  )}
                  {metrics.openmlImports > 0 && (
                    <span className="text-[10px] rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 px-2 py-0.5">
                      <Globe className="h-2.5 w-2.5 inline mr-0.5" /> {metrics.openmlImports} OpenML imports
                    </span>
                  )}
                  {metrics.groundednessEvaluatedCount > 0 && (
                    <span className="text-[10px] rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-400 px-2 py-0.5">
                      {metrics.groundednessEvaluatedCount} groundedness evaluations
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── RESOURCES ── */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Research Resources & Datasets</h2>
            <span className="text-xs text-slate-500">Curated for lab notebook AI</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESOURCES.map(({ label, desc, href, icon: Icon, color }, i) => (
              <motion.a
                key={label}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.15)", boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}
                className="group flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition-all"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <p className="text-sm font-semibold text-slate-200 truncate">{label}</p>
                    <ExternalLink className="h-3 w-3 text-slate-600 shrink-0 group-hover:text-slate-400 transition-colors" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* ── FOOTER ── */}
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show" className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-slate-600">© 2026 PhiSphere AI. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <button onClick={() => navigate("/about")} className="hover:text-slate-400 transition-colors">About & Architecture</button>
            <button onClick={() => navigate("/landing")} className="hover:text-slate-400 transition-colors">Landing Page</button>
          </div>
        </motion.div>

      </div>

      <Changelog open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </div>
  );
}
