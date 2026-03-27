import { useState } from "react";
import { Globe, Search, Loader2, Database, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { LabSession } from "@workspace/api-client-react";

interface OpenMLDataset {
  id: number;
  name: string;
  rows: number;
  features: number;
  format: string;
}

interface OpenMLImportModalProps {
  sessionId: number;
  onClose: () => void;
  onImported: (session: LabSession) => void;
}

const SUGGESTED = [
  { id: 61, name: "Iris", rows: 150, features: 5, format: "ARFF" },
  { id: 1464, name: "Blood Transfusion", rows: 748, features: 5, format: "ARFF" },
  { id: 1480, name: "Ilpd (Indian Liver Patient)", rows: 583, features: 11, format: "ARFF" },
  { id: 40966, name: "MiceProtein", rows: 1080, features: 82, format: "ARFF" },
  { id: 4534, name: "PhishingWebsites", rows: 11055, features: 31, format: "ARFF" },
];

export function OpenMLImportModal({ sessionId, onClose, onImported }: OpenMLImportModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OpenMLDataset[]>(SUGGESTED);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [manualId, setManualId] = useState("");

  const doSearch = async () => {
    if (!query.trim()) {
      setResults(SUGGESTED);
      return;
    }
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/openml/search?q=${encodeURIComponent(query.trim())}&limit=10`);
      const data = await res.json();
      setResults(data.datasets ?? []);
      if ((data.datasets ?? []).length === 0) {
        setError("No datasets found. Try a different search term or enter an ID directly.");
      }
    } catch {
      setError("Search failed. You can still import by dataset ID below.");
    } finally {
      setSearching(false);
    }
  };

  const doImport = async (datasetId: number) => {
    setImporting(datasetId);
    setError("");
    try {
      const res = await fetch(`/api/lab-sessions/${sessionId}/import-openml`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Import failed" }));
        setError(err.error ?? `Import failed (HTTP ${res.status})`);
        return;
      }
      const data = await res.json();
      if (data.session) {
        onImported(data.session as LabSession);
      }
    } catch {
      setError("Network error during import");
    } finally {
      setImporting(null);
    }
  };

  const handleManualImport = () => {
    const id = parseInt(manualId.trim(), 10);
    if (!id || id <= 0) {
      setError("Please enter a valid positive dataset ID");
      return;
    }
    doImport(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-border/60 bg-slate-950 shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-100">Import from OpenML</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="Search datasets (e.g. iris, sensor, protein)..."
                className="w-full rounded-lg border border-border/50 bg-slate-900/80 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            <Button size="sm" variant="outline" onClick={doSearch} disabled={searching} className="shrink-0">
              {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                {query.trim() ? "Results" : "Suggested Datasets"}
              </p>
              {results.map((ds) => (
                <div
                  key={ds.id}
                  className="flex items-center gap-3 rounded-lg border border-border/30 bg-slate-900/40 px-3 py-2.5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
                >
                  <Database className="h-4 w-4 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{ds.name}</p>
                    <p className="text-[11px] text-slate-500">
                      ID #{ds.id} &middot; {ds.rows.toLocaleString()} rows &middot; {ds.features} features &middot; {ds.format}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10 opacity-80 group-hover:opacity-100"
                    disabled={importing !== null}
                    onClick={() => doImport(ds.id)}
                  >
                    {importing === ds.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Import"}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-border/30">
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleManualImport()}
              placeholder="Dataset ID (e.g. 61)"
              className="w-32 rounded-lg border border-border/50 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualImport}
              disabled={importing !== null || !manualId.trim()}
              className="text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            >
              {importing !== null && !results.some((r) => r.id === importing) ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              Import by ID
            </Button>
            <a
              href="https://www.openml.org/search?type=data"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              Browse OpenML <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {error && (
            <p className="text-xs text-red-400 px-1">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
