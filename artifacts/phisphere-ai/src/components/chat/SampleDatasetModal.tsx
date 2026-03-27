import { useState } from "react";
import { X, Database, FlaskConical, Atom, Dna, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  useListSampleDatasets,
  useLoadSampleDataset,
  type LabSession,
  type SampleDatasetMeta,
} from "@workspace/api-client-react";

interface SampleDatasetModalProps {
  sessionId: number;
  onClose: () => void;
  onLoaded: (session: LabSession) => void;
}

const DOMAIN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  biology: Dna,
  chemistry: FlaskConical,
  physics: Atom,
  general: Database,
};

export function SampleDatasetModal({ sessionId, onClose, onLoaded }: SampleDatasetModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: datasets, isLoading } = useListSampleDatasets();

  const loadMutation = useLoadSampleDataset({
    mutation: {
      onSuccess: (data) => {
        if (data.session) {
          onLoaded(data.session as LabSession);
        }
      },
    },
  });

  const handleLoad = () => {
    if (!selectedId) return;
    loadMutation.mutate({ id: sessionId, data: { datasetId: selectedId } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border/80 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">Load Sample Dataset</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Choose a pre-built dataset to explore AI data analysis capabilities
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
            </div>
          ) : (
            <div className="space-y-3">
              {(datasets ?? []).map((dataset: SampleDatasetMeta) => {
                const Icon = DOMAIN_ICONS[dataset.domain] ?? Database;
                const isSelected = selectedId === dataset.id;

                return (
                  <button
                    key={dataset.id}
                    onClick={() => setSelectedId(dataset.id)}
                    className={cn(
                      "w-full text-left rounded-xl border px-5 py-4 transition-all duration-150",
                      isSelected
                        ? "border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(0,201,177,0.1)]"
                        : "border-border/50 bg-card/30 hover:border-primary/30 hover:bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                        isSelected ? "border-primary/40 bg-primary/20" : "border-border/50 bg-muted/30"
                      )}>
                        <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{dataset.name}</span>
                          <span className="text-xs text-muted-foreground capitalize rounded-full bg-black/30 px-2 py-0.5 border border-white/10">
                            {dataset.domain}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{dataset.description}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                          <span>{dataset.rowCount} rows</span>
                          <span>·</span>
                          <span>{dataset.columns.length} columns</span>
                          <span>·</span>
                          <span className="font-mono truncate">
                            {dataset.columns.slice(0, 4).join(", ")}{dataset.columns.length > 4 ? "…" : ""}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/50 px-6 py-4">
          <Button variant="ghost" onClick={onClose} disabled={loadMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleLoad}
            disabled={!selectedId || loadMutation.isPending}
          >
            {loadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Load Dataset
              </>
            )}
          </Button>
        </div>

        {loadMutation.isError && (
          <div className="px-6 pb-4">
            <p className="text-xs text-red-400">
              {loadMutation.error instanceof Error ? loadMutation.error.message : "Failed to load dataset"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
