import { ShieldCheck, Eye, Loader2, RefreshCw, Brain, Sparkles, FileText, Search, Languages, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetAzureStatus, getGetAzureStatusQueryKey, type AzureStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type HealthStatus = "healthy" | "error" | "demo" | "unconfigured";

const SERVICE_META: Record<string, { label: string; icon: typeof Brain }> = {
  openai: { label: "Language Model", icon: Brain },
  contentSafety: { label: "Content Safety", icon: ShieldCheck },
  vision: { label: "AI Vision", icon: Eye },
  documentIntelligence: { label: "Doc Intelligence", icon: FileText },
  search: { label: "AI Search (RAG)", icon: Search },
  language: { label: "AI Language", icon: Languages },
  appInsights: { label: "App Insights", icon: Activity },
};

function StatusPill({ health }: { health: HealthStatus | undefined }) {
  if (!health || health === "unconfigured") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[9px] font-bold text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
        N/A
      </span>
    );
  }
  if (health === "healthy") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.9)]" />
        Active
      </span>
    );
  }
  if (health === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/25 px-2 py-0.5 text-[9px] font-bold text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_4px_rgba(248,113,113,0.9)]" />
        Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[9px] font-bold text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
      Not Set
    </span>
  );
}

export function AzureStatusPanel() {
  const queryClient = useQueryClient();
  const { data: status, isLoading, refetch } = useGetAzureStatus();

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: getGetAzureStatusQueryKey() });
    void refetch();
  };

  const s = status as AzureStatus | undefined;

  const services = [
    { key: "openai", health: s?.openai?.health as HealthStatus | undefined, ...SERVICE_META.openai },
    { key: "contentSafety", health: s?.contentSafety?.health as HealthStatus | undefined, ...SERVICE_META.contentSafety },
    { key: "vision", health: s?.vision?.health as HealthStatus | undefined, ...SERVICE_META.vision },
    { key: "documentIntelligence", health: s?.documentIntelligence?.health as HealthStatus | undefined, ...SERVICE_META.documentIntelligence },
    { key: "search", health: s?.search?.health as HealthStatus | undefined, ...SERVICE_META.search },
    { key: "language", health: s?.language?.health as HealthStatus | undefined, ...SERVICE_META.language },
    { key: "appInsights", health: s?.appInsights?.health as HealthStatus | undefined, ...SERVICE_META.appInsights },
  ];

  const allActive = services.every(svc => svc.health === "healthy");
  const hasError = services.some(svc => svc.health === "error");
  const activeCount = services.filter(svc => svc.health === "healthy").length;

  return (
    <div className="mx-3 mb-2 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className={cn("h-3 w-3", allActive ? "text-primary" : hasError ? "text-red-400" : "text-amber-400")} />
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Azure AI</span>
          <span className={cn(
            "ml-1 text-[9px] font-bold rounded-full px-1.5 py-0.5",
            activeCount === services.length
              ? "bg-emerald-500/10 text-emerald-400"
              : activeCount === 0
                ? "bg-slate-800 text-slate-500"
                : "bg-amber-500/10 text-amber-400"
          )}>
            {activeCount}/{services.length}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="rounded-lg p-1 text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all"
          title="Refresh status"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </button>
      </div>

      <div className="space-y-1.5">
        {services.map(({ key, health, label, icon: Icon }) => (
          <div key={key} className="flex items-center gap-2">
            <Icon className="h-3 w-3 text-slate-600 shrink-0" />
            <span className="text-[11px] text-slate-500 flex-1 truncate">{label}</span>
            <StatusPill health={health} />
          </div>
        ))}
      </div>

      {services.some(svc => svc.health === "unconfigured" || !svc.health) && (
        <p className="mt-2.5 text-[9px] text-slate-500 leading-snug border-t border-white/5 pt-2">
          Add Azure secrets in Replit to activate all AI services.
        </p>
      )}
    </div>
  );
}
