import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Users, Calendar, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AcademicCitation {
  paperId: string;
  title: string;
  authors: string[];
  year: number | null;
  venue: string | null;
  doi: string | null;
  url: string;
  openAccessUrl: string | null;
  citationCount: number;
  abstract: string | null;
}

interface CitationListProps {
  citations: AcademicCitation[];
  className?: string;
  defaultExpanded?: boolean;
}

function CitationCard({ citation, index }: { citation: AcademicCitation; index: number }) {
  const [showAbstract, setShowAbstract] = useState(false);
  const displayAuthors =
    citation.authors.length > 3
      ? `${citation.authors.slice(0, 3).join(", ")} et al.`
      : citation.authors.join(", ");

  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.025] px-3.5 py-3 group hover:border-violet-500/20 hover:bg-violet-500/[0.03] transition-all">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-start gap-2 min-w-0">
          <span className="shrink-0 mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500/15 text-[9px] font-bold text-violet-400 ring-1 ring-violet-500/25">
            {index + 1}
          </span>
          <a
            href={citation.openAccessUrl ?? citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-slate-200 leading-snug hover:text-violet-300 transition-colors line-clamp-2 flex-1"
          >
            {citation.title}
          </a>
        </div>
        <a
          href={citation.openAccessUrl ?? citation.url}
          target="_blank"
          rel="noopener noreferrer"
          title={citation.openAccessUrl ? "Open access available" : "View on Semantic Scholar"}
          className={cn(
            "shrink-0 rounded-md p-1 transition-colors",
            citation.openAccessUrl
              ? "text-emerald-400 hover:bg-emerald-500/10"
              : "text-slate-500 hover:text-violet-400 hover:bg-violet-500/10"
          )}
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-6">
        {displayAuthors && (
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Users className="h-2.5 w-2.5 shrink-0" />
            {displayAuthors}
          </span>
        )}
        {(citation.year || citation.venue) && (
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <Calendar className="h-2.5 w-2.5 shrink-0" />
            {[citation.venue, citation.year].filter(Boolean).join(" · ")}
          </span>
        )}
        {citation.citationCount > 0 && (
          <span className="text-[10px] text-slate-600">
            {citation.citationCount.toLocaleString()} citations
          </span>
        )}
        {citation.openAccessUrl && (
          <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-1.5 py-0.5">
            Open Access
          </span>
        )}
      </div>

      {citation.abstract && (
        <div className="pl-6 mt-1.5">
          <button
            onClick={() => setShowAbstract((v) => !v)}
            className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
          >
            <Quote className="h-2.5 w-2.5" />
            {showAbstract ? "Hide abstract" : "Show abstract"}
          </button>
          {showAbstract && (
            <p className="mt-1 text-[10px] text-slate-400 leading-relaxed italic line-clamp-3">
              "{citation.abstract}{citation.abstract.length >= 300 ? "…" : ""}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function CitationList({ citations, className, defaultExpanded = false }: CitationListProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (citations.length === 0) return null;

  return (
    <div className={cn("mt-3 rounded-xl border border-violet-500/15 bg-violet-500/[0.04] overflow-hidden", className)}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-violet-500/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">
            Academic References
          </span>
          <span className="rounded-full bg-violet-500/20 border border-violet-500/25 px-1.5 py-0.5 text-[9px] font-bold text-violet-300">
            {citations.length}
          </span>
          <span className="text-[9px] text-slate-600 hidden sm:inline">via Semantic Scholar</span>
        </div>
        {expanded
          ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
          : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        }
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {citations.map((c, i) => (
            <CitationCard key={c.paperId} citation={c} index={i} />
          ))}
          <p className="text-[9px] text-slate-600 text-right pt-0.5">
            Real academic papers · Always verify before citing in your research
          </p>
        </div>
      )}
    </div>
  );
}
