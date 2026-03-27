import { format } from "date-fns";
import { User, Sparkles, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { SafetyBadge, type SafetyCheckResult } from "./SafetyBadge";

interface GroundednessBadgeProps {
  score: number;
}

function GroundednessBadge({ score }: GroundednessBadgeProps) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
    pct >= 60 ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" :
    pct >= 40 ? "text-amber-400 bg-amber-400/10 border-amber-400/20" :
                "text-red-400 bg-red-400/10 border-red-400/20";
  const label =
    pct >= 80 ? "Well-grounded" :
    pct >= 60 ? "Mostly grounded" :
    pct >= 40 ? "Partially grounded" : "Low grounding";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide", color)}>
      <Gauge className="h-2.5 w-2.5" />
      {label} {pct}%
    </span>
  );
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  createdAt?: string | Date;
  isStreaming?: boolean;
  safety?: SafetyCheckResult;
  safetyBadgeId?: string;
  groundednessScore?: number | null;
}

export function MessageBubble({ role, content, createdAt, isStreaming, safety, safetyBadgeId, groundednessScore }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full animate-in fade-in slide-in-from-bottom-4 duration-500",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("flex max-w-[85%] gap-4", isUser ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        <div className="flex shrink-0 flex-col items-center">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl shadow-lg ring-1 ring-inset",
              isUser
                ? "bg-slate-800 ring-white/10 text-slate-300"
                : "bg-gradient-to-br from-primary to-blue-600 ring-primary/30 text-white shadow-primary/20"
            )}
          >
            {isUser ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </div>
        </div>

        {/* Message Content */}
        <div
          className={cn(
            "relative flex flex-col gap-2 rounded-2xl px-6 py-5 shadow-xl",
            isUser
              ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 text-slate-200 rounded-tr-sm"
              : "glass-panel bg-card/60 border border-primary/20 rounded-tl-sm"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <span className={cn("text-xs font-bold tracking-wide uppercase", isUser ? "text-slate-400" : "text-primary")}>
              {isUser ? "Researcher" : "PhiSphere AI"}
            </span>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {!isUser && !isStreaming && groundednessScore !== null && groundednessScore !== undefined && (
                <GroundednessBadge score={groundednessScore} />
              )}
              {!isUser && !isStreaming && safety && (
                <SafetyBadge safety={safety} id={safetyBadgeId} />
              )}
              {createdAt && (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {format(new Date(createdAt), "h:mm a")}
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="text-sm">
            {isUser ? (
              <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
            ) : (
              <MarkdownRenderer content={content} />
            )}

            {isStreaming && (
              <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-primary align-middle" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
