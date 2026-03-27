import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type SafetyStatus = "passed" | "flagged" | "blocked" | "unavailable";

export interface SafetyCheckResult {
  status: SafetyStatus;
  categories: Array<{ category: string; severity: number }>;
  blockedCategories: string[];
  flaggedCategories: string[];
  available: boolean;
  checkedAt: string;
}

interface SafetyBadgeProps {
  safety: SafetyCheckResult;
  id?: string;
}

const STATUS_CONFIG = {
  passed: {
    icon: ShieldCheck,
    label: "Safety Passed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    tooltip: "Azure AI Content Safety scanned this response and found no safety concerns.",
  },
  flagged: {
    icon: ShieldAlert,
    label: "Safety Warning",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    tooltip: "Azure AI Content Safety flagged borderline content in this response. It has been allowed but may require review.",
  },
  blocked: {
    icon: ShieldX,
    label: "Content Blocked",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    tooltip: "Azure AI Content Safety blocked this response due to unsafe content.",
  },
  unavailable: {
    icon: ShieldOff,
    label: "Safety Check N/A",
    color: "text-slate-500",
    bg: "bg-slate-500/10 border-slate-500/20",
    tooltip: "Azure AI Content Safety is not configured. Responses are not safety-screened.",
  },
};

export function SafetyBadge({ safety, id }: SafetyBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = STATUS_CONFIG[safety.status];
  const Icon = config.icon;

  const flaggedList = [
    ...safety.blockedCategories.map((c) => `${c} (blocked)`),
    ...safety.flaggedCategories.map((c) => `${c} (flagged)`),
  ];

  return (
    <div id={id} className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all hover:opacity-80",
          config.bg,
          config.color
        )}
        aria-label={`Safety check: ${safety.status}`}
      >
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-border/80 bg-slate-900 p-4 shadow-2xl text-xs">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={cn("h-4 w-4", config.color)} />
            <span className={cn("font-bold", config.color)}>Azure AI Content Safety</span>
          </div>
          <p className="text-slate-300 leading-relaxed mb-2">{config.tooltip}</p>

          {flaggedList.length > 0 && (
            <div className="border-t border-border/50 pt-2">
              <p className="text-slate-400 mb-1">Categories:</p>
              <ul className="space-y-0.5">
                {flaggedList.map((item) => (
                  <li key={item} className="text-slate-300">• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {safety.categories.length > 0 && flaggedList.length === 0 && (
            <div className="border-t border-border/50 pt-2">
              <p className="text-slate-400 mb-1">Severity scores (0–6):</p>
              <ul className="space-y-0.5">
                {safety.categories.map((c) => (
                  <li key={c.category} className="flex justify-between text-slate-300">
                    <span>{c.category}</span>
                    <span className={c.severity === 0 ? "text-emerald-400" : "text-yellow-400"}>{c.severity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-2 text-[10px] text-slate-500">
            Checked at {new Date(safety.checkedAt).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}
