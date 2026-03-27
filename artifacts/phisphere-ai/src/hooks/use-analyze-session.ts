import { useState, useCallback } from "react";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface Hypothesis {
  text: string;
  confidence: ConfidenceLevel;
  reasoning: string;
}

export interface NextExperiment {
  title: string;
  rationale: string;
  parameters: string;
}

export interface AnalysisResult {
  findings: string[];
  hypotheses: Hypothesis[];
  nextExperiments: NextExperiment[];
  domain: string;
  generatedAt: string;
}

interface UseAnalyzeSessionReturn {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  analyze: () => Promise<void>;
  clear: () => void;
}

export function useAnalyzeSession(sessionId: number): UseAnalyzeSessionReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/lab-sessions/${sessionId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed (${response.status})`);
      }
      const data = (await response.json()) as AnalysisResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, analyze, clear };
}
