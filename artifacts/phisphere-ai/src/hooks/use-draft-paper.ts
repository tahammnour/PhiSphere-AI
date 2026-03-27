import { useState, useCallback } from "react";
import type { PaperDraft } from "@/components/chat/PaperDraftDrawer";

export function useDraftPaper(sessionId: number) {
  const [draft, setDraft] = useState<PaperDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lab-sessions/${sessionId}/draft-paper`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as PaperDraft;
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const clear = useCallback(() => {
    setDraft(null);
    setError(null);
  }, []);

  return { draft, isLoading, error, generate, clear };
}
