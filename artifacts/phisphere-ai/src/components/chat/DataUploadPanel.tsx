import { useRef, useState } from "react";
import { Upload, FlaskConical, Database, Loader2, FileText, CheckCircle2, XCircle, ChevronDown, ChevronUp, FileSpreadsheet, ImageIcon, Microscope, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUploadLabSessionFile,
  getListLabSessionsQueryKey,
  type LabSession,
} from "@workspace/api-client-react";
import { CsvPreviewCard } from "./CsvPreviewCard";
import { ImagePreviewCard } from "./ImagePreviewCard";
import { SampleDatasetModal } from "./SampleDatasetModal";
import { OpenMLImportModal } from "./OpenMLImportModal";
import { VisionAnalysisCard } from "./VisionAnalysisCard";
import type { CsvExpData, ImageExpData, PdfExpData } from "@/lib/experiment-types";

interface DataUploadPanelProps {
  session: LabSession;
  onDataLoaded: (session: LabSession) => void;
  onAnalyzeClick?: () => void;
}

export function DataUploadPanel({ session, onDataLoaded, onAnalyzeClick }: DataUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showOpenMLModal, setShowOpenMLModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useUploadLabSessionFile({
    mutation: {
      onSuccess: (data) => {
        if (data.session) {
          onDataLoaded(data.session as LabSession);
          queryClient.invalidateQueries({ queryKey: getListLabSessionsQueryKey() });
        }
      },
    },
  });

  const handleFile = (file: File) => {
    uploadMutation.mutate({ id: session.id, data: { file } });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const expData = session.experimentData as CsvExpData | ImageExpData | PdfExpData | null | undefined;
  const hasData = !!expData;

  function getDataSummary() {
    if (!expData) return null;
    if (expData.type === "csv") {
      return {
        icon: <FileSpreadsheet className="h-3.5 w-3.5 text-primary shrink-0" />,
        name: expData.filename,
        detail: `${expData.rowCount.toLocaleString()} rows · ${expData.columns.length} cols`,
        color: "border-primary/20 bg-primary/5",
        textColor: "text-primary",
      };
    }
    if (expData.type === "image") {
      return {
        icon: <ImageIcon className="h-3.5 w-3.5 text-violet-400 shrink-0" />,
        name: expData.filename,
        detail: "Image · AI Vision analysis",
        color: "border-violet-500/20 bg-violet-500/5",
        textColor: "text-violet-400",
      };
    }
    if (expData.type === "pdf") {
      return {
        icon: <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />,
        name: expData.filename,
        detail: `${expData.pageCount} pages · ${expData.chunkCount} chunks indexed for RAG`,
        color: "border-blue-500/20 bg-blue-500/5",
        textColor: "text-blue-400",
      };
    }
    return null;
  }

  const summary = getDataSummary();

  return (
    <div className="border-b border-border/40 bg-slate-950/60">
      <div className="mx-auto max-w-4xl">
        {hasData && summary ? (
          <>
            {/* Compact summary bar — always visible */}
            <div className="flex items-center gap-2 px-4 py-2">
              <div className={cn("flex items-center gap-2 flex-1 min-w-0 rounded-lg border px-3 py-1.5", summary.color)}>
                {summary.icon}
                <span className={cn("text-xs font-medium truncate", summary.textColor)}>{summary.name}</span>
                <span className="text-[11px] text-muted-foreground ml-1 shrink-0">{summary.detail}</span>
              </div>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/20 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all shrink-0"
                title={expanded ? "Hide data preview" : "Show data preview"}
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                <span>{expanded ? "Hide" : "Show data"}</span>
              </button>
              {onAnalyzeClick && (
                <button
                  onClick={onAnalyzeClick}
                  className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-all shrink-0"
                  title="Generate hypotheses and insights with AI"
                >
                  <Microscope className="h-3.5 w-3.5" />
                  <span>Analyze</span>
                </button>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1.5"
                title="Replace file"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Replace</span>
              </button>
            </div>

            {/* Expandable preview panel */}
            {expanded && (
              <div className="px-4 pb-4 space-y-3">
                {expData.type === "csv" ? (
                  <CsvPreviewCard data={expData} />
                ) : expData.type === "image" ? (
                  <>
                    <ImagePreviewCard data={expData} />
                    <VisionAnalysisCard vision={expData.visionAnalysis ?? { available: false, analyzedAt: new Date().toISOString() }} />
                  </>
                ) : expData.type === "pdf" ? (
                  <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                    <FileText className="h-5 w-5 shrink-0 text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{expData.filename}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {expData.pageCount} pages · {expData.chunkCount} chunks indexed for RAG
                      </p>
                      {expData.documentIntelligence && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {expData.documentIntelligence.available ? (
                            <><CheckCircle2 className="h-3 w-3 text-emerald-400" /><span className="text-[10px] text-emerald-400">Document Intelligence extracted text</span></>
                          ) : (
                            <><XCircle className="h-3 w-3 text-amber-400" /><span className="text-[10px] text-amber-400">Document Intelligence not configured</span></>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <div className="p-4 space-y-3">
            <div
              id="tour-file-upload"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !uploadMutation.isPending && fileRef.current?.click()}
              className={cn(
                "relative flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed px-5 py-4 transition-all overflow-hidden",
                uploadMutation.isPending ? "cursor-default border-primary/40 bg-primary/5" :
                isDragging
                  ? "border-primary/80 bg-primary/5 scale-[1.01]"
                  : "border-border/50 bg-card/30 hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              {uploadMutation.isPending && (
                <div className="absolute inset-0 upload-shimmer pointer-events-none" />
              )}
              {uploadMutation.isPending ? (
                <Loader2 className="h-6 w-6 shrink-0 text-primary animate-spin" />
              ) : (
                <Upload className={cn("h-6 w-6 shrink-0", isDragging ? "text-primary" : "text-muted-foreground")} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-300">
                  {uploadMutation.isPending ? "Analyzing file with Azure AI…" : "Drop a file or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  CSV (data analysis) · PDF protocol (RAG) · Images (AI vision) · Max 20 MB
                </p>
                {uploadMutation.isError && (
                  <p className="mt-1 text-xs text-red-400">
                    {uploadMutation.error instanceof Error ? uploadMutation.error.message : "Upload failed"}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                id="tour-sample-data"
                className="shrink-0 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSampleModal(true);
                }}
              >
                <Database className="h-3.5 w-3.5 mr-1.5" />
                Load Sample
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOpenMLModal(true);
                }}
              >
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                OpenML
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Attach experimental data to enable AI-powered data analysis and pattern recognition.
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".csv,.pdf,image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {showSampleModal && (
        <SampleDatasetModal
          sessionId={session.id}
          onClose={() => setShowSampleModal(false)}
          onLoaded={(updatedSession) => {
            onDataLoaded(updatedSession);
            queryClient.invalidateQueries({ queryKey: getListLabSessionsQueryKey() });
            setShowSampleModal(false);
          }}
        />
      )}
      {showOpenMLModal && (
        <OpenMLImportModal
          sessionId={session.id}
          onClose={() => setShowOpenMLModal(false)}
          onImported={(updatedSession) => {
            onDataLoaded(updatedSession);
            queryClient.invalidateQueries({ queryKey: getListLabSessionsQueryKey() });
            setShowOpenMLModal(false);
          }}
        />
      )}
    </div>
  );
}
