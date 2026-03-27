import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Beaker, ShieldAlert, Brain, Info, ShieldOff, EyeOff, Download, Printer, Clock, Tag, BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { MessageBubble } from "./MessageBubble";
import { DataUploadPanel } from "./DataUploadPanel";
import { ResponsibleAIPanel } from "./ResponsibleAIPanel";
import { VersionHistoryDrawer } from "./VersionHistoryDrawer";
import { HypothesisPanel } from "./HypothesisPanel";
import { PaperDraftDrawer } from "./PaperDraftDrawer";
import { useGetOpenaiConversation, useGetAzureStatus, type AzureStatus, type LabSession, type OpenaiConversation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useChatStream, type RecognizedEntity, type RagSource } from "@/hooks/use-chat-stream";
import { useSessionHistory } from "@/hooks/use-session-history";
import { useAnalyzeSession } from "@/hooks/use-analyze-session";
import { useDraftPaper } from "@/hooks/use-draft-paper";
import type { CsvExpData, ImageExpData } from "@/lib/experiment-types";
import type { SafetyCheckResult } from "./SafetyBadge";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  session: LabSession;
  conversation: OpenaiConversation;
}

function MessageSkeleton() {
  return (
    <div className="flex w-full justify-start animate-in fade-in duration-300">
      <div className="flex max-w-[85%] gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 ring-1 ring-white/10 animate-pulse" />
        <div className="flex flex-col gap-2 rounded-2xl px-6 py-5 glass-panel bg-card/60 border border-primary/20 rounded-tl-sm w-96">
          <div className="h-3 w-24 rounded-full bg-slate-700 animate-pulse" />
          <div className="space-y-2 mt-1">
            <div className="h-2.5 w-full rounded-full bg-slate-700/70 animate-pulse" />
            <div className="h-2.5 w-4/5 rounded-full bg-slate-700/70 animate-pulse" />
            <div className="h-2.5 w-3/5 rounded-full bg-slate-700/70 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AzureServiceBanner({ status }: { status: AzureStatus | undefined }) {
  if (!status) return null;

  const safetyUnconfigured = status.contentSafety.health === "unconfigured";
  const visionUnconfigured = status.vision.health === "unconfigured";
  const safetyError = status.contentSafety.health === "error";
  const visionError = status.vision.health === "error";

  const issues: Array<{ icon: React.ReactNode; text: string }> = [];

  if (safetyUnconfigured) {
    issues.push({
      icon: <ShieldOff className="h-3.5 w-3.5 shrink-0" />,
      text: "Safety checks temporarily unavailable — Azure AI Content Safety is not configured. Responses will include a notice.",
    });
  } else if (safetyError) {
    issues.push({
      icon: <ShieldOff className="h-3.5 w-3.5 shrink-0" />,
      text: "Azure AI Content Safety is experiencing errors. Safety checks may be unreliable.",
    });
  }

  if (visionUnconfigured) {
    issues.push({
      icon: <EyeOff className="h-3.5 w-3.5 shrink-0" />,
      text: "Image enrichment unavailable — Azure AI Vision is not configured. Images will be analyzed using the base language model only.",
    });
  } else if (visionError) {
    issues.push({
      icon: <EyeOff className="h-3.5 w-3.5 shrink-0" />,
      text: "Azure AI Vision is experiencing errors. Image analysis may be limited.",
    });
  }

  if (issues.length === 0) return null;

  return (
    <div className="border-b border-yellow-500/20 bg-yellow-500/5 px-6 py-2">
      <div className="mx-auto max-w-4xl space-y-1">
        {issues.map((issue, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-yellow-400/90">
            {issue.icon}
            <span>{issue.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatArea({ session: initialSession, conversation }: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [session, setSession] = useState<LabSession>(initialSession);
  const [isRAIPanelOpen, setIsRAIPanelOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHypothesisPanelOpen, setIsHypothesisPanelOpen] = useState(false);
  const [isPaperDraftOpen, setIsPaperDraftOpen] = useState(false);
  const [inputError, setInputError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { pushHistory } = useSessionHistory();
  const { result: analysisResult, isLoading: analysisLoading, error: analysisError, analyze, clear: clearAnalysis } = useAnalyzeSession(session.id);
  const { draft: paperDraft, isLoading: paperLoading, error: paperError, generate: generatePaper, clear: clearPaper } = useDraftPaper(session.id);

  useEffect(() => {
    if (initialSession.id !== session.id) {
      pushHistory(initialSession.id, { name: initialSession.name, description: initialSession.description ?? "" });
      clearAnalysis();
      clearPaper();
      setIsHypothesisPanelOpen(false);
      setIsPaperDraftOpen(false);
    }
    setSession(initialSession);
  }, [initialSession.id]);

  const { data: convData, isLoading: messagesLoading } = useGetOpenaiConversation(conversation.id);
  const { data: azureStatus } = useGetAzureStatus();
  const { sendMessage, isStreaming, streamedContent, streamedSafety, streamedEntities, streamedRagSources, streamedGroundedness } = useChatStream(conversation.id);

  async function handleRestoreVersion(name: string, description: string) {
    try {
      await fetch(`/api/lab-sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description }),
      });
      pushHistory(session.id, { name, description });
      queryClient.invalidateQueries({ queryKey: ["lab-sessions"] });
    } catch {
    }
  }

  const messages = convData?.messages ?? [];

  const lastAssistantMessage = (() => {
    if (isStreaming && streamedContent) {
      return {
        role: "assistant",
        content: streamedContent,
        safetyMetadata: streamedSafety ?? null,
        groundednessScore: streamedGroundedness?.score ?? null,
        groundednessJustification: streamedGroundedness?.justification ?? null,
        ragSources: streamedRagSources,
      };
    }
    const reversed = [...messages].reverse();
    const found = reversed.find((m) => m.role === "assistant");
    if (!found) return null;
    const foundTyped = found as { groundednessScore?: number | null; groundednessJustification?: string | null; ragChunkRefs?: { sourceFile: string; pageNumber: number; score: number; chunkIndex?: number; excerpt?: string }[] | null };
    return {
      role: found.role,
      content: found.content,
      safetyMetadata: found.safetyMetadata as SafetyCheckResult | null,
      groundednessScore: foundTyped.groundednessScore ?? null,
      groundednessJustification: foundTyped.groundednessJustification ?? null,
      ragChunkRefs: foundTyped.ragChunkRefs ?? null,
      ragSources: streamedRagSources,
    };
  })();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedContent]);

  const handleSendToChat = (text: string) => {
    setInput(text);
    setIsHypothesisPanelOpen(false);
  };

  const handleAnalyzeClick = () => {
    setIsHypothesisPanelOpen(true);
    if (!analysisResult) {
      void analyze();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStreaming) return;
    if (!input.trim()) {
      setInputError("Please enter a message before sending.");
      return;
    }
    setInputError("");

    const expData = session.experimentData as CsvExpData | ImageExpData | null | undefined;
    let sessionContext = `Domain: ${session.domain}. Description: ${session.description}`;
    if (expData?.type === "csv") {
      sessionContext += `. Uploaded CSV: ${expData.filename} (${expData.rowCount} rows, columns: ${expData.columns.join(", ")})`;
    } else if (expData?.type === "image") {
      sessionContext += `. Uploaded image: ${expData.filename}`;
    }

    sendMessage(input, sessionContext);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-full flex-col relative bg-[#040B16] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display font-bold text-foreground truncate">{session.name}</h2>
            <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider border border-primary/20">
              {session.domain}
            </span>
          </div>
          {session.description && (
            <p className="mt-1 text-sm text-muted-foreground truncate max-w-2xl">{session.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Secure Lab Environment
          </div>
          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = `/api/lab-sessions/${session.id}/export`;
              a.download = "";
              a.click();
            }}
            title="Export session as Markdown"
            className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => window.print()}
            title="Print session as PDF"
            className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print PDF</span>
          </button>
          <button
            onClick={() => setIsHistoryOpen(true)}
            title="Version history"
            className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </button>
          <button
            onClick={() => {
              setIsPaperDraftOpen(true);
              if (!paperDraft && !paperLoading) {
                void generatePaper();
              }
            }}
            title="Draft research paper"
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
              isPaperDraftOpen
                ? "border-violet-400/40 bg-violet-500/10 text-violet-300"
                : "border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Draft Paper</span>
          </button>
          <button
            id="tour-responsible-ai"
            onClick={() => setIsRAIPanelOpen((v) => !v)}
            title="Responsible AI Insights"
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
              isRAIPanelOpen
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Responsible AI</span>
          </button>
        </div>
      </header>

      {/* Azure Service Degradation Banner */}
      <div className="relative z-10 shrink-0">
        <AzureServiceBanner status={azureStatus} />
      </div>

      {/* Data Upload Panel */}
      <div className="relative z-10 shrink-0">
        <DataUploadPanel
          session={session}
          onDataLoaded={(updated) => setSession(updated)}
          onAnalyzeClick={handleAnalyzeClick}
        />
      </div>

      {/* Messages + Responsible AI Panel */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            {messagesLoading ? (
              <>
                <MessageSkeleton />
                <div className="flex w-full justify-end animate-in fade-in duration-300">
                  <div className="h-16 w-72 rounded-2xl bg-slate-800/70 animate-pulse" />
                </div>
                <MessageSkeleton />
              </>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-center px-4 py-10">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/10 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(0,201,177,0.15)] ring-1 ring-primary/20">
                  <Beaker className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-display font-bold glow-text mb-2">Notebook Initialized</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-8 leading-relaxed">
                  Detail your experimental protocol, upload data, or ask a scientific question to begin your analysis.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
                  {[
                    "Summarize the key steps in this experimental protocol:",
                    "Help me analyze this dataset and identify patterns:",
                    "What controls should I include in my experiment?",
                    "Generate a hypothesis based on the following observations:",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setInput(prompt)}
                      className="text-left rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] hover:border-white/15 transition-all leading-relaxed"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isFirstAssistant = msg.role === "assistant" &&
                  messages.slice(0, idx).every((m) => m.role !== "assistant");
                const msgTyped = msg as { groundednessScore?: number | null };
                return (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role as "user" | "assistant"}
                    content={msg.content}
                    createdAt={msg.createdAt}
                    safety={msg.role === "assistant" && msg.safetyMetadata ? msg.safetyMetadata as SafetyCheckResult : undefined}
                    safetyBadgeId={isFirstAssistant ? "tour-safety-badge" : undefined}
                    groundednessScore={msg.role === "assistant" ? (msgTyped.groundednessScore ?? null) : null}
                  />
                );
              })
            )}

            {isStreaming && (
              <>
                <MessageBubble
                  role="assistant"
                  content={streamedContent}
                  isStreaming
                  safety={streamedSafety ?? undefined}
                  groundednessScore={streamedGroundedness?.score ?? null}
                />
                {(streamedEntities.length > 0 || streamedRagSources.length > 0) && (
                  <div className="flex flex-col gap-2 animate-in fade-in duration-300 -mt-2">
                    {streamedEntities.length > 0 && (
                      <div className="flex items-start gap-2 flex-wrap ml-14">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0 mt-0.5">
                          <Tag className="h-3 w-3" />
                          <span className="font-semibold uppercase tracking-wider">Entities</span>
                        </div>
                        {streamedEntities.slice(0, 8).map((e, i) => (
                          <span
                            key={i}
                            title={`${e.category}${e.subcategory ? `/${e.subcategory}` : ""} — confidence: ${(e.confidenceScore * 100).toFixed(0)}%`}
                            className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary/80"
                          >
                            {e.text}
                          </span>
                        ))}
                      </div>
                    )}
                    {streamedRagSources.length > 0 && (
                      <div className="flex items-start gap-2 flex-wrap ml-14">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0 mt-0.5">
                          <BookOpen className="h-3 w-3" />
                          <span className="font-semibold uppercase tracking-wider">Sources</span>
                        </div>
                        {streamedRagSources.map((r, i) => (
                          <span
                            key={i}
                            title={`Relevance score: ${r.score.toFixed(3)}`}
                            className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/5 px-2 py-0.5 text-[10px] font-medium text-blue-400/80"
                          >
                            {r.sourceFile} p.{r.pageNumber}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <div ref={bottomRef} className="h-4" />
          </div>
        </div>

        {/* Responsible AI side panel */}
        <div className="relative shrink-0">
          <ResponsibleAIPanel
            isOpen={isRAIPanelOpen}
            onClose={() => setIsRAIPanelOpen(false)}
            lastAssistantMessage={lastAssistantMessage}
            sessionDomain={session.domain}
            ragSources={streamedRagSources}
          />
        </div>
      </div>

      {/* Input Area */}
      <div className="relative z-10 shrink-0 border-t border-border/50 bg-background/80 p-4 backdrop-blur-md sm:p-6">
        <div className="mx-auto max-w-4xl">
          <form
            onSubmit={handleSubmit}
            className={cn(
              "relative flex items-end gap-2 rounded-2xl border bg-card/50 p-2 shadow-lg transition-all",
              inputError
                ? "border-destructive/50 focus-within:ring-4 focus-within:ring-destructive/10"
                : "border-border focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10"
            )}
          >
            <Textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (inputError && e.target.value.trim()) setInputError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or provide experimental context (Shift+Enter for new line)..."
              className="max-h-48 min-h-[60px] flex-1 border-0 bg-transparent px-3 py-3 shadow-none focus-visible:ring-0 text-base"
              aria-invalid={!!inputError}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isStreaming}
              className="mb-1 mr-1 h-12 w-12 rounded-xl shrink-0"
            >
              {isStreaming ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
          {inputError ? (
            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-destructive">
              <Info className="h-3 w-3 shrink-0" />
              {inputError}
            </p>
          ) : (
            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3 shrink-0" />
              PhiSphere AI can make mistakes. Verify critical scientific findings independently.
            </div>
          )}
        </div>
      </div>

      {/* Version History Drawer */}
      <VersionHistoryDrawer
        sessionId={session.id}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRestore={handleRestoreVersion}
      />

      {/* Hypothesis / Experiment Planner Panel */}
      <HypothesisPanel
        isOpen={isHypothesisPanelOpen}
        onClose={() => setIsHypothesisPanelOpen(false)}
        result={analysisResult}
        isLoading={analysisLoading}
        error={analysisError}
        onRegenerate={() => void analyze()}
        onSendToChat={handleSendToChat}
        sessionName={session.name}
      />

      {/* Paper Draft Drawer */}
      <PaperDraftDrawer
        isOpen={isPaperDraftOpen}
        onClose={() => setIsPaperDraftOpen(false)}
        draft={paperDraft}
        isLoading={paperLoading}
        error={paperError}
        onRegenerate={() => { clearPaper(); void generatePaper(); }}
        sessionName={session.name}
      />
    </div>
  );
}
