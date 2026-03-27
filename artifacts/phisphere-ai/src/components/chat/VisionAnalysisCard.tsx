import { Eye, FileText, Tag, CheckCircle2, EyeOff } from "lucide-react";

interface VisionResult {
  available: boolean;
  caption?: string;
  captionConfidence?: number;
  ocrText?: string;
  objects?: Array<{ name: string; confidence: number }>;
  analyzedAt: string;
  error?: string;
}

interface VisionAnalysisCardProps {
  vision: VisionResult;
}

export function VisionAnalysisCard({ vision }: VisionAnalysisCardProps) {
  if (!vision.available) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-400">
        <EyeOff className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">Image enrichment unavailable</span> — Azure AI Vision is not configured. Proceeding with standard analysis using image content only.
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
        <Eye className="h-4 w-4" />
        Azure AI Vision Analysis
      </div>

      {vision.caption && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <CheckCircle2 className="h-3 w-3" /> Caption
          </div>
          <p className="text-sm text-slate-200 italic">
            "{vision.caption}"
            <span className="ml-2 text-[10px] text-slate-500 not-italic">
              ({Math.round((vision.captionConfidence ?? 0) * 100)}% confidence)
            </span>
          </p>
        </div>
      )}

      {vision.ocrText && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <FileText className="h-3 w-3" /> Extracted Text (OCR)
          </div>
          <pre className="text-xs text-slate-300 bg-slate-900/60 rounded-lg p-3 whitespace-pre-wrap font-mono overflow-auto max-h-32">
            {vision.ocrText}
          </pre>
        </div>
      )}

      {vision.objects && vision.objects.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <Tag className="h-3 w-3" /> Detected Objects
          </div>
          <div className="flex flex-wrap gap-1.5">
            {vision.objects.map((obj, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-border/50 px-2.5 py-1 text-xs text-slate-300"
              >
                {obj.name}
                <span className="text-slate-500">
                  {Math.round(obj.confidence * 100)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
