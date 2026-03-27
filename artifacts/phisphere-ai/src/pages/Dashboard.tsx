import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { NewSessionModal } from "@/components/sessions/NewSessionModal";
import { useWorkspace } from "@/hooks/use-workspace";
import { OnboardingTour, useShouldShowTour } from "@/components/onboarding/OnboardingTour";
import { Microscope, Sparkles, Menu, FlaskConical, Shield, Brain, Gauge, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";

interface EvalSummary {
  totalMessages: number;
  safetyCheckedCount: number;
  flaggedCount: number;
  blockedCount: number;
  passedCount: number;
  avgGroundedness: number | null;
  groundednessEvaluatedCount: number;
}

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [demoError, setDemoError] = useState("");
  const [evalSummary, setEvalSummary] = useState<EvalSummary | null>(null);

  useEffect(() => {
    fetch("/api/evaluation/summary")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setEvalSummary(data); })
      .catch(() => {});
  }, []);
  const { show: showTour, dismiss: dismissTour } = useShouldShowTour();
  const {
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    selectedSession,
    selectedConversation,
    isLoading,
    createSession,
    deleteSession,
    isCreating,
    refetchSessions,
  } = useWorkspace();

  const handleLoadDemos = async () => {
    setIsDemoLoading(true);
    setDemoError("");
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      if (res.ok) {
        await refetchSessions();
        const updatedSessions = await fetch("/api/lab-sessions").then((r) => r.json()).catch(() => []);
        const firstDemo = Array.isArray(updatedSessions)
          ? updatedSessions.find((s: { name: string; id: number }) =>
              s.name.includes("Demo") || s.name.includes("⚗️") || s.name.includes("🌿") || s.name.includes("🔬")
            )
          : null;
        if (firstDemo) {
          setSelectedSessionId(firstDemo.id);
        }
      } else {
        setDemoError("Failed to load demo experiments. Please try again.");
      }
    } catch {
      setDemoError("Network error loading demos. Please check your connection.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const hasDemo = sessions.some((s) => s.name.includes("Demo") || s.name.includes("⚗️") || s.name.includes("🌿") || s.name.includes("🔬"));

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30 selection:text-primary-foreground">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 md:relative md:flex md:shrink-0 transition-transform duration-300",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <Sidebar
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelect={(id) => { setSelectedSessionId(id); setMobileSidebarOpen(false); }}
          onNew={() => { setIsModalOpen(true); setMobileSidebarOpen(false); }}
          onDelete={deleteSession}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col min-w-0 w-full">
        {/* Mobile header bar */}
        <div className="md:hidden flex items-center gap-3 border-b border-border/50 bg-background/90 px-4 py-3 shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src="/images/phisphere-logo.png" alt="PhiSphere AI" className="h-7 w-auto" />
        </div>
        {selectedSession && selectedConversation ? (
          <ChatArea
            session={selectedSession}
            conversation={selectedConversation}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
              <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-blue-500/4 rounded-full blur-[80px]" />
              <div className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] bg-indigo-500/4 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
              {/* Icon */}
              <div className="mx-auto mb-8 relative w-fit">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-teal-500/15 to-blue-500/20 border border-primary/20 shadow-[0_0_40px_rgba(0,201,177,0.15)] mx-auto">
                  <Microscope className="h-10 w-10 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow-[0_0_8px_rgba(0,201,177,0.6)]">
                  <Sparkles className="h-3 w-3 text-slate-950" />
                </div>
              </div>

              {/* Title + subtitle */}
              <h2 className="mb-3 text-2xl font-display font-bold text-white tracking-tight">
                Welcome to PhiSphere AI
              </h2>
              <p className="mb-8 text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                Your intelligent lab notebook — reason over protocols, analyze sensor data, and discover scientific insights safely with Azure AI.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                {[
                  { icon: FlaskConical, label: "12 Science Domains", color: "text-amber-400 bg-amber-400/8 border-amber-400/20" },
                  { icon: Shield, label: "Azure Content Safety", color: "text-blue-400 bg-blue-400/8 border-blue-400/20" },
                  { icon: Brain, label: "AI Reasoning", color: "text-violet-400 bg-violet-400/8 border-violet-400/20" },
                ].map(({ icon: Icon, label, color }) => (
                  <span key={label} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", color)}>
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                ))}
              </div>

              {/* Safety & Trust summary card */}
              {evalSummary && evalSummary.safetyCheckedCount > 0 && (
                <div className="mb-6 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Shield className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Safety &amp; Trust Summary</span>
                    <span className="ml-auto text-[10px] text-slate-600">All sessions</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { icon: Shield, label: "Checked", value: evalSummary.safetyCheckedCount, color: "text-slate-300" },
                      { icon: ShieldCheck, label: "Passed", value: evalSummary.passedCount, color: "text-emerald-400" },
                      { icon: ShieldAlert, label: "Flagged", value: evalSummary.flaggedCount, color: "text-amber-400" },
                      { icon: ShieldX, label: "Blocked", value: evalSummary.blockedCount, color: "text-red-400" },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className="rounded-xl bg-black/20 border border-white/5 px-2 py-2 text-center">
                        <Icon className={cn("h-3.5 w-3.5 mx-auto mb-1", color)} />
                        <p className={cn("text-base font-bold", color)}>{value}</p>
                        <p className="text-[10px] text-slate-600 mt-px uppercase tracking-wide">{label}</p>
                      </div>
                    ))}
                  </div>
                  {evalSummary.avgGroundedness !== null && evalSummary.groundednessEvaluatedCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Gauge className="h-3 w-3 text-primary shrink-0" />
                      <div className="h-1.5 flex-1 rounded-full bg-slate-800">
                        <div
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            evalSummary.avgGroundedness >= 0.8 ? "bg-emerald-400" :
                            evalSummary.avgGroundedness >= 0.6 ? "bg-yellow-400" : "bg-amber-400"
                          )}
                          style={{ width: `${Math.round(evalSummary.avgGroundedness * 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-primary tabular-nums">
                        {Math.round(evalSummary.avgGroundedness * 100)}%
                      </span>
                      <span className="text-[10px] text-slate-600">avg. grounded</span>
                    </div>
                  )}
                </div>
              )}

              {/* CTA */}
              <button
                id="tour-new-session"
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-teal-400 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-[0_4px_20px_rgba(0,201,177,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(0,201,177,0.45)] active:translate-y-0 mb-3"
              >
                <Sparkles className="h-4 w-4" />
                Start a New Experiment
              </button>

              {!hasDemo && (
                <>
                  <button
                    onClick={handleLoadDemos}
                    disabled={isDemoLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-8 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] hover:border-white/12 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDemoLoading ? (
                      <>
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-600 border-t-slate-300 animate-spin" />
                        Loading demo experiments…
                      </>
                    ) : (
                      "Load Demo Experiments"
                    )}
                  </button>
                  {demoError && (
                    <p className="mt-2 text-xs text-red-400 text-center">{demoError}</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <NewSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createSession}
        isCreating={isCreating}
      />

      {/* Onboarding Tour */}
      {showTour && <OnboardingTour onComplete={dismissTour} />}
    </div>
  );
}
