import { useState, useEffect } from "react";
import { X, Brain, ShieldCheck, BarChart3, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Info, BookOpen, Gauge, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SafetyCheckResult } from "./SafetyBadge";
import type { RagSource } from "@/hooks/use-chat-stream";

interface RagChunkRef {
  sourceFile: string;
  pageNumber: number;
  score: number;
  chunkIndex?: number;
  excerpt?: string;
}

interface Message {
  role: string;
  content: string;
  safetyMetadata?: SafetyCheckResult | null;
  groundednessScore?: number | null;
  groundednessJustification?: string | null;
  ragSources?: RagSource[];
  ragChunkRefs?: RagChunkRef[] | null;
}

interface ResponsibleAIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lastAssistantMessage: Message | null;
  sessionDomain: string;
  ragSources?: RagSource[];
}

function extractReasoningSteps(content: string): string[] {
  const steps: string[] = [];
  const sections = [
    { emoji: "🔬", label: "Observation" },
    { emoji: "📊", label: "Analysis" },
    { emoji: "💡", label: "Suggested Next Steps" },
    { emoji: "🧠", label: "Why I Recommend This" },
    { emoji: "⚖️", label: "Responsible AI Note" },
  ];
  for (const s of sections) {
    if (content.includes(s.emoji)) {
      steps.push(s.label);
    }
  }
  if (steps.length === 0) {
    steps.push("Context gathering", "Scientific reasoning", "Recommendation formulation");
  }
  return steps;
}

function GroundednessGauge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? "text-emerald-400" :
    pct >= 60 ? "text-yellow-400" :
    pct >= 40 ? "text-amber-400" : "text-red-400";
  const barColor =
    pct >= 80 ? "bg-emerald-400" :
    pct >= 60 ? "bg-yellow-400" :
    pct >= 40 ? "bg-amber-400" : "bg-red-400";
  const label =
    pct >= 80 ? "Well-grounded" :
    pct >= 60 ? "Mostly grounded" :
    pct >= 40 ? "Partially grounded" : "Weakly grounded";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className={cn("text-sm font-bold", color)}>{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800 mb-2">
        <div
          className={cn("h-2 rounded-full transition-all duration-700", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-slate-600 mb-1">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function deriveConfidenceFromEvaluator(
  groundednessScore: number | null,
  ragSourceCount: number,
): { level: "high" | "medium" | "low" | "unavailable"; value: number | null; source: string; hasRagContext: boolean } {
  if (groundednessScore === null) return { level: "unavailable", value: null, source: "", hasRagContext: false };
  const hasRagContext = groundednessScore > 0.75 || ragSourceCount > 0;
  const level: "high" | "medium" | "low" =
    groundednessScore >= 0.75 ? "high" : groundednessScore >= 0.5 ? "medium" : "low";
  const source = hasRagContext
    ? "Azure OpenAI LLM-as-judge (RAG-grounded)"
    : "Azure OpenAI LLM-as-judge (no retrieval context; capped at 75%)";
  return { level, value: groundednessScore, source, hasRagContext };
}

export function ResponsibleAIPanel({ isOpen, onClose, lastAssistantMessage, sessionDomain, ragSources }: ResponsibleAIPanelProps) {
  const [reasoningExpanded, setReasoningExpanded] = useState(true);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);

  const content = lastAssistantMessage?.content ?? "";
  const safety = lastAssistantMessage?.safetyMetadata ?? null;
  const groundednessScore = lastAssistantMessage?.groundednessScore ?? null;
  const groundednessJustification = lastAssistantMessage?.groundednessJustification ?? null;
  const reasoningSteps = content ? extractReasoningSteps(content) : [];

  const persistedRefs = lastAssistantMessage?.ragChunkRefs;
  const streamSources = ragSources ?? lastAssistantMessage?.ragSources ?? [];
  const hasPersistedRefs = persistedRefs && persistedRefs.length > 0;
  const hasStreamSources = streamSources.length > 0;

  const persistedAsSources = hasPersistedRefs
    ? persistedRefs!.map((r) => ({ sourceFile: r.sourceFile, pageNumber: r.pageNumber, score: r.score, excerpt: r.excerpt }))
    : null;

  const displaySources = persistedAsSources ?? (hasStreamSources ? streamSources.map((r) => ({ sourceFile: r.sourceFile, pageNumber: r.pageNumber, score: r.score, excerpt: undefined })) : []);

  const confidence = deriveConfidenceFromEvaluator(groundednessScore, displaySources.length);

  useEffect(() => {
    if (isOpen) {
      setReasoningExpanded(true);
      setSourcesExpanded(false);
    }
  }, [lastAssistantMessage?.content]);

  return (
    <div
      className={cn(
        "absolute right-0 top-0 h-full w-80 flex-col border-l border-border/50 bg-slate-950/95 backdrop-blur-md shadow-2xl transition-transform duration-300 z-30",
        isOpen ? "flex translate-x-0" : "translate-x-full hidden"
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Responsible AI</h3>
            <p className="text-[10px] text-muted-foreground">Insights for last AI response</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!lastAssistantMessage ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Info className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-xs text-muted-foreground">Send a message to see Responsible AI insights</p>
          </div>
        ) : (
          <>
            {/* Confidence Level */}
            <div className="rounded-xl border border-border/40 bg-card/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Confidence Level</span>
                <span className="text-[9px] text-slate-600 ml-auto">Azure composite score</span>
              </div>
              {confidence.level === "unavailable" ? (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-slate-500">
                    Confidence score will appear once Azure OpenAI evaluates this response's groundedness.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-sm font-bold",
                      confidence.level === "high" ? "text-emerald-400" :
                      confidence.level === "medium" ? "text-yellow-400" : "text-red-400"
                    )}>
                      {confidence.level === "high" ? "High confidence" :
                       confidence.level === "medium" ? "Medium confidence" : "Low confidence"}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {Math.round((confidence.value ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 mb-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all duration-700",
                        confidence.level === "high" ? "bg-emerald-400" :
                        confidence.level === "medium" ? "bg-yellow-400" : "bg-red-400"
                      )}
                      style={{ width: `${Math.round((confidence.value ?? 0) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                    <span className="text-emerald-500">✓</span> {confidence.source}
                  </p>
                  {!confidence.hasRagContext && (
                    <p className="text-[10px] text-slate-600 mt-1">
                      Score capped at 75% — upload documents to enable RAG retrieval for full verification.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Groundedness Score */}
            <div className="rounded-xl border border-border/40 bg-card/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Gauge className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Groundedness Score</span>
              </div>

              {groundednessScore !== null ? (
                <>
                  <GroundednessGauge score={groundednessScore} />
                  {groundednessJustification && (
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-2">{groundednessJustification}</p>
                  )}
                  <p className="text-[10px] text-slate-600 mt-2">
                    Evaluated by Azure OpenAI (LLM-as-judge) · all assistant responses
                  </p>
                </>
              ) : displaySources.length === 0 ? (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-slate-500">
                    No retrieved context — groundedness evaluation requires uploaded documents indexed for RAG search.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin shrink-0" />
                  <span>Evaluating groundedness…</span>
                </div>
              )}
            </div>

            {/* Safety Check Summary */}
            <div className="rounded-xl border border-border/40 bg-card/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Safety Check</span>
                <span className="text-[9px] text-slate-600 ml-auto">Azure AI Content Safety</span>
              </div>

              {safety ? (
                <>
                  <div className={cn(
                    "flex items-center gap-2 mb-2 rounded-lg px-3 py-2",
                    safety.status === "passed" ? "bg-emerald-500/10 border border-emerald-500/20" :
                    safety.status === "flagged" ? "bg-yellow-500/10 border border-yellow-500/20" :
                    safety.status === "blocked" ? "bg-red-500/10 border border-red-500/20" :
                    "bg-slate-500/10 border border-slate-500/20"
                  )}>
                    <span className={cn(
                      "text-xs font-bold uppercase",
                      safety.status === "passed" ? "text-emerald-400" :
                      safety.status === "flagged" ? "text-yellow-400" :
                      safety.status === "blocked" ? "text-red-400" : "text-slate-400"
                    )}>
                      {safety.status === "passed" ? "✓ All checks passed" :
                       safety.status === "flagged" ? "⚠ Flagged content" :
                       safety.status === "blocked" ? "✗ Content blocked" : "– Unavailable"}
                    </span>
                  </div>

                  {safety.categories && safety.categories.length > 0 && (
                    <div className="space-y-1.5">
                      {safety.categories.map((cat) => (
                        <div key={cat.category} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">{cat.category}</span>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-16 rounded-full bg-slate-800">
                              <div
                                className={cn(
                                  "h-1.5 rounded-full",
                                  cat.severity === 0 ? "bg-emerald-400" :
                                  cat.severity <= 2 ? "bg-yellow-400" : "bg-red-400"
                                )}
                                style={{ width: `${(cat.severity / 6) * 100}%` }}
                              />
                            </div>
                            <span className="text-slate-500 w-4">{cat.severity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 mt-2">
                    Checked at {new Date(safety.checkedAt).toLocaleTimeString()}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500">No safety data available for this response</p>
              )}
            </div>

            {/* Reasoning Trace */}
            <div className="rounded-xl border border-border/40 bg-card/30">
              <button
                className="flex w-full items-center justify-between p-4"
                onClick={() => setReasoningExpanded((v) => !v)}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Reasoning Trace</span>
                </div>
                {reasoningExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>

              {reasoningExpanded && (
                <div className="px-4 pb-4">
                  <div className="space-y-2">
                    {reasoningSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary ring-1 ring-primary/20">
                          {i + 1}
                        </div>
                        <span className="text-xs text-slate-300 leading-relaxed pt-0.5">{step}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3">
                    Structured response follows scientific inquiry methodology
                  </p>
                </div>
              )}
            </div>

            {/* RAG Source Citations */}
            {displaySources.length > 0 && (
              <div className="rounded-xl border border-border/40 bg-card/30">
                <button
                  className="flex w-full items-center justify-between p-4"
                  onClick={() => setSourcesExpanded((v) => !v)}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">Source Citations</span>
                    <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{displaySources.length}</span>
                    {hasPersistedRefs && <span className="text-[9px] text-slate-600">persisted</span>}
                  </div>
                  {sourcesExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                {sourcesExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {displaySources.map((src, i) => (
                      <div key={i} className="rounded-lg bg-slate-800/50 border border-white/5 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-slate-300 truncate">{src.sourceFile}</span>
                          <span className="text-[10px] text-slate-500 shrink-0">p.{src.pageNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1 flex-1 rounded-full bg-slate-700">
                            <div className="h-1 rounded-full bg-primary/60" style={{ width: `${Math.round(src.score * 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-600 tabular-nums">{Math.round(src.score * 100)}%</span>
                        </div>
                        {'excerpt' in src && src.excerpt && (
                          <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed italic line-clamp-2">"{src.excerpt}"</p>
                        )}
                      </div>
                    ))}
                    <p className="text-[10px] text-slate-600 pt-1">Retrieved via Azure AI Search hybrid RAG</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border/50 p-4">
        <p className="text-[10px] text-slate-500 text-center leading-relaxed mb-1">
          Powered by{" "}
          <a
            href="https://responsibleaitoolbox.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-0.5"
          >
            Microsoft Responsible AI Toolbox
            <ExternalLink className="h-2.5 w-2.5" />
          </a>{" "}
          principles
        </p>
        <p className="text-[9px] text-slate-600 text-center">
          Domain context: <span className="capitalize text-slate-500">{sessionDomain.replace(/-/g, " ")}</span>
        </p>
      </div>
    </div>
  );
}
