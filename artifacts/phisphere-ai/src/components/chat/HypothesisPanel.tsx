import { useState } from "react";
import {
  X,
  RefreshCw,
  Lightbulb,
  Search,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
  Loader2,
  AlertCircle,
  TrendingUp,
  Microscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResult, ConfidenceLevel, Hypothesis, NextExperiment } from "@/hooks/use-analyze-session";

interface HypothesisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  onSendToChat: (text: string) => void;
  sessionName: string;
}

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const map: Record<ConfidenceLevel, { label: string; className: string }> = {
    high: {
      label: "High confidence",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    medium: {
      label: "Moderate confidence",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    low: {
      label: "Low confidence",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    },
  };
  const { label, className } = map[level] ?? map.medium;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0", className)}>
      {label}
    </span>
  );
}

function HypothesisCard({ hypothesis, onSendToChat }: { hypothesis: Hypothesis; onSendToChat: (t: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  const chatText = `Hypothesis: ${hypothesis.text}\n\nReasoning: ${hypothesis.reasoning}\n\nPlease elaborate on this hypothesis and suggest specific experimental tests.`;

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-2">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm text-slate-200 leading-relaxed">{hypothesis.text}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <ConfidenceBadge level={hypothesis.confidence} />
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Hide reasoning" : "Show reasoning"}
            </button>
          </div>
          {expanded && (
            <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3 italic">
              {hypothesis.reasoning}
            </p>
          )}
        </div>
        <button
          onClick={() => onSendToChat(chatText)}
          title="Discuss in chat"
          className="shrink-0 flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-2 py-1 text-[11px] text-primary hover:bg-primary/10 transition-colors"
        >
          <MessageSquarePlus className="h-3 w-3" />
          Discuss
        </button>
      </div>
    </div>
  );
}

function ExperimentCard({ experiment, onSendToChat }: { experiment: NextExperiment; onSendToChat: (t: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  const chatText = `Next Experiment: ${experiment.title}\n\nRationale: ${experiment.rationale}\n\nSuggested parameters: ${experiment.parameters}\n\nPlease help me design a detailed protocol for this experiment.`;

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-2">
      <div className="flex items-start gap-3">
        <FlaskConical className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm font-semibold text-slate-200">{experiment.title}</p>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Hide details" : "Show rationale & parameters"}
          </button>
          {expanded && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-slate-400">Rationale:</span> {experiment.rationale}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-slate-400">Parameters:</span> {experiment.parameters}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => onSendToChat(chatText)}
          title="Design protocol in chat"
          className="shrink-0 flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/5 px-2 py-1 text-[11px] text-blue-400 hover:bg-blue-500/10 transition-colors"
        >
          <MessageSquarePlus className="h-3 w-3" />
          Design
        </button>
      </div>
    </div>
  );
}

export function HypothesisPanel({
  isOpen,
  onClose,
  result,
  isLoading,
  error,
  onRegenerate,
  onSendToChat,
  sessionName,
}: HypothesisPanelProps) {
  if (!isOpen) return null;

  const handleSendAll = () => {
    if (!result) return;
    const parts: string[] = [];
    if (result.findings.length > 0) {
      parts.push(`Key findings from "${sessionName}":\n${result.findings.map((f, i) => `${i + 1}. ${f}`).join("\n")}`);
    }
    if (result.hypotheses.length > 0) {
      parts.push(`Hypotheses:\n${result.hypotheses.map((h, i) => `H${i + 1}: ${h.text} (${h.confidence} confidence)`).join("\n")}`);
    }
    if (result.nextExperiments.length > 0) {
      parts.push(`Suggested next experiments:\n${result.nextExperiments.map((e, i) => `${i + 1}. ${e.title}`).join("\n")}`);
    }
    onSendToChat(parts.join("\n\n") + "\n\nPlease help me prioritize these and suggest where to start.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border/60 bg-[#060D1A] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Microscope className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">AI Experiment Analysis</h2>
              <p className="text-xs text-muted-foreground">{sessionName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <button
                onClick={handleSendAll}
                className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Send all to chat
              </button>
            )}
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              title="Regenerate analysis"
              className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              {isLoading ? "Analyzing…" : "Regenerate"}
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-lg border border-border/50 bg-muted/20 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <Loader2 className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">Analyzing your experiment…</p>
                <p className="text-xs text-muted-foreground">Azure OpenAI is generating hypotheses and insights</p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-300">Analysis failed</p>
                <p className="text-xs text-red-400/80">{error}</p>
                <button
                  onClick={onRegenerate}
                  className="text-xs text-red-300 underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {result && !isLoading && (
            <>
              {/* Key Findings */}
              {result.findings.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="text-sm font-semibold text-foreground">Key Findings</h3>
                    <span className="text-[11px] text-muted-foreground">({result.findings.length})</span>
                  </div>
                  <ul className="space-y-2">
                    {result.findings.map((finding, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"
                      >
                        <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-slate-300 leading-relaxed">{finding}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Hypotheses */}
              {result.hypotheses.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-amber-400 shrink-0" />
                    <h3 className="text-sm font-semibold text-foreground">Hypotheses</h3>
                    <span className="text-[11px] text-muted-foreground">({result.hypotheses.length})</span>
                  </div>
                  <div className="space-y-3">
                    {result.hypotheses.map((h, i) => (
                      <HypothesisCard key={i} hypothesis={h} onSendToChat={onSendToChat} />
                    ))}
                  </div>
                </section>
              )}

              {/* Next Experiments */}
              {result.nextExperiments.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-blue-400 shrink-0" />
                    <h3 className="text-sm font-semibold text-foreground">Suggested Next Experiments</h3>
                    <span className="text-[11px] text-muted-foreground">({result.nextExperiments.length})</span>
                  </div>
                  <div className="space-y-3">
                    {result.nextExperiments.map((e, i) => (
                      <ExperimentCard key={i} experiment={e} onSendToChat={onSendToChat} />
                    ))}
                  </div>
                </section>
              )}

              {/* Generated timestamp */}
              <p className="text-center text-[10px] text-muted-foreground/60">
                Generated by Azure OpenAI · {new Date(result.generatedAt).toLocaleString()}
              </p>
            </>
          )}

          {!isLoading && !error && !result && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/10 flex items-center justify-center ring-1 ring-primary/20">
                <Microscope className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Ready to analyze</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Click "Regenerate" to run the AI analysis and generate hypotheses, findings, and next experiment suggestions.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer disclaimer */}
        <div className="shrink-0 border-t border-border/40 px-6 py-3">
          <p className="text-center text-[10px] text-muted-foreground/60">
            AI-generated hypotheses are suggestions only. Verify all findings independently before drawing conclusions.
          </p>
        </div>
      </div>
    </div>
  );
}
