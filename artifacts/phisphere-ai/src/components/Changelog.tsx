import { X, Sparkles, CheckCircle2, Bug, Zap, Shield, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const SEEN_KEY = "phisphere_changelog_seen";
const LATEST_VERSION = "2.4.0";

export function getChangelogUnread(): boolean {
  return localStorage.getItem(SEEN_KEY) !== LATEST_VERSION;
}

export function markChangelogSeen() {
  localStorage.setItem(SEEN_KEY, LATEST_VERSION);
}

const ENTRIES = [
  {
    version: "2.4.0",
    date: "March 2026",
    label: "Latest",
    labelColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    items: [
      { icon: Zap, color: "text-amber-400", text: "Session pinning — star important experiments for quick access" },
      { icon: CheckCircle2, color: "text-emerald-400", text: "Session tagging — organize experiments with custom tags" },
      { icon: Shield, color: "text-violet-400", text: "Session archiving — soft-delete experiments without losing data" },
      { icon: BarChart3, color: "text-blue-400", text: "Global Search (Cmd+K) — search across all sessions instantly" },
      { icon: Sparkles, color: "text-pink-400", text: "Version history — view past edits for each lab session" },
      { icon: CheckCircle2, color: "text-emerald-400", text: "PDF export — print any session as a formatted document" },
      { icon: CheckCircle2, color: "text-emerald-400", text: "In-app notifications with real-time toast messages" },
      { icon: CheckCircle2, color: "text-emerald-400", text: "GDPR cookie consent banner and account deletion" },
      { icon: CheckCircle2, color: "text-emerald-400", text: "Plan upgrade/downgrade flow in Billing page" },
    ],
  },
  {
    version: "2.3.0",
    date: "February 2026",
    label: "Previous",
    labelColor: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    items: [
      { icon: CheckCircle2, color: "text-emerald-400", text: "Billing page with promo code system (5 codes available)" },
      { icon: CheckCircle2, color: "text-emerald-400", text: "Invoice generator with print support" },
      { icon: CheckCircle2, color: "text-emerald-400", text: "Avatar photo upload and color picker in Settings" },
      { icon: CheckCircle2, color: "text-emerald-400", text: "Username change with password confirmation" },
      { icon: CheckCircle2, color: "text-emerald-400", text: "Profile dropdown in Control Panel header" },
    ],
  },
  {
    version: "2.2.0",
    date: "January 2026",
    label: "Earlier",
    labelColor: "bg-slate-500/15 text-slate-500 border-slate-500/20",
    items: [
      { icon: CheckCircle2, color: "text-emerald-400", text: "Mobile responsive sidebar with hamburger menu" },
      { icon: CheckCircle2, color: "text-emerald-400", text: "Session search by name and domain" },
      { icon: Bug, color: "text-red-400", text: "Fixed sidebar IIFE syntax error in session search" },
      { icon: CheckCircle2, color: "text-emerald-400", text: "CSV chart preview with Recharts integration" },
      { icon: CheckCircle2, color: "text-emerald-400", text: "Per-message inline confidence badge" },
      { icon: CheckCircle2, color: "text-emerald-400", text: "Protocol templates in New Session modal" },
      { icon: CheckCircle2, color: "text-emerald-400", text: "Audit log, Terms, Privacy, and Forgot Password pages" },
    ],
  },
];

interface ChangelogProps {
  open: boolean;
  onClose: () => void;
}

export function Changelog({ open, onClose }: ChangelogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9991] flex items-start justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-sm bg-[#0a1422] border-l border-white/10 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">What's New</h2>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {ENTRIES.map((entry) => (
            <div key={entry.version}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-white">v{entry.version}</span>
                <span className={cn("text-[10px] font-bold rounded-full border px-1.5 py-0.5", entry.labelColor)}>
                  {entry.label}
                </span>
                <span className="text-xs text-slate-600 ml-auto">{entry.date}</span>
              </div>
              <div className="space-y-2 border-l-2 border-white/5 pl-4">
                {entry.items.map(({ icon: Icon, color, text }, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Icon className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", color)} />
                    <span className="text-xs text-slate-400 leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 border-t border-white/5 px-5 py-3">
          <p className="text-xs text-slate-600 text-center">PhiSphere AI · Intelligent Lab Notebook Platform</p>
        </div>
      </div>
    </div>
  );
}
