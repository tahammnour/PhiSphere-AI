import type { LanguageResult } from "./azure-language";

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

const SEMANTIC_SCHOLAR_API = "https://api.semanticscholar.org/graph/v1";
const REQUEST_TIMEOUT_MS = 8000;

function extractSearchTerms(
  text: string,
  entityResult?: LanguageResult | null,
  maxTerms = 4
): string[] {
  const terms: string[] = [];

  if (entityResult?.available && entityResult.entities.length > 0) {
    const highConfidence = entityResult.entities
      .filter((e) => e.confidenceScore >= 0.85)
      .slice(0, 3)
      .map((e) => e.text);
    terms.push(...highConfidence);
  }

  if (terms.length < 2) {
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
      "been", "being", "have", "has", "had", "do", "does", "did", "will",
      "would", "could", "should", "may", "might", "can", "this", "that",
      "these", "those", "it", "its", "i", "we", "you", "he", "she", "they",
      "what", "which", "who", "how", "when", "where", "why", "please", "help",
      "tell", "show", "explain", "describe", "analyze", "analysis", "data",
      "result", "results", "experiment", "sample", "test", "value", "values",
      "using", "use", "used", "my", "our", "your",
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !stopWords.has(w));

    const freq = new Map<string, number>();
    for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);

    const topWords = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([w]) => w);

    for (const w of topWords) {
      if (!terms.some((t) => t.toLowerCase() === w)) {
        terms.push(w);
      }
    }
  }

  return terms.slice(0, maxTerms);
}

async function searchSemanticScholar(
  query: string,
  limit = 3
): Promise<AcademicCitation[]> {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
    fields: "paperId,title,authors,year,venue,externalIds,openAccessPdf,citationCount,abstract",
  });

  const url = `${SEMANTIC_SCHOLAR_API}/paper/search?${params}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "PhiSphere-AI/1.0 (lab notebook scientific assistant)",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(`[Citations] Semantic Scholar returned HTTP ${res.status} for query "${query}"`);
      return [];
    }

    const data = (await res.json()) as {
      data?: Array<{
        paperId?: string;
        title?: string;
        authors?: Array<{ name?: string }>;
        year?: number;
        venue?: string;
        externalIds?: { DOI?: string };
        openAccessPdf?: { url?: string };
        citationCount?: number;
        abstract?: string;
      }>;
    };

    return (data.data ?? [])
      .filter((p) => p.paperId && p.title)
      .map((p) => {
        const doi = p.externalIds?.DOI ?? null;
        const url = doi
          ? `https://doi.org/${doi}`
          : `https://www.semanticscholar.org/paper/${p.paperId}`;
        return {
          paperId: p.paperId ?? "",
          title: p.title ?? "",
          authors: (p.authors ?? []).map((a) => a.name ?? "").filter(Boolean).slice(0, 5),
          year: p.year ?? null,
          venue: p.venue ?? null,
          doi,
          url,
          openAccessUrl: p.openAccessPdf?.url ?? null,
          citationCount: p.citationCount ?? 0,
          abstract: p.abstract ? p.abstract.slice(0, 300) : null,
        };
      });
  } catch (err) {
    console.warn(`[Citations] Fetch error for query "${query}":`, err instanceof Error ? err.message : String(err));
    return [];
  }
}

export async function fetchCitations(
  responseText: string,
  entityResult?: LanguageResult | null,
  maxCitations = 3
): Promise<AcademicCitation[]> {
  try {
    const terms = extractSearchTerms(responseText, entityResult);
    if (terms.length === 0) return [];

    const query = terms.slice(0, 3).join(" ");
    console.log(`[Citations] Searching Semantic Scholar for: "${query}"`);

    const results = await searchSemanticScholar(query, maxCitations + 2);

    const seen = new Set<string>();
    const deduped = results.filter((p) => {
      if (seen.has(p.paperId)) return false;
      seen.add(p.paperId);
      return true;
    });

    return deduped.slice(0, maxCitations);
  } catch (err) {
    console.warn("[Citations] fetchCitations failed:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

export function isCitationsAvailable(): boolean {
  return true;
}
