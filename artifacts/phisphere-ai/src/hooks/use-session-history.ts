import { useCallback } from "react";

export interface HistoryEntry {
  name: string;
  description: string;
  savedAt: string;
}

function historyKey(id: number) {
  return `phisphere_session_history_${id}`;
}

export function useSessionHistory() {
  const getHistory = useCallback((id: number): HistoryEntry[] => {
    try {
      return JSON.parse(localStorage.getItem(historyKey(id)) ?? "[]");
    } catch {
      return [];
    }
  }, []);

  const pushHistory = useCallback((id: number, entry: Omit<HistoryEntry, "savedAt">) => {
    const key = historyKey(id);
    const existing: HistoryEntry[] = (() => {
      try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
    })();
    const newEntry: HistoryEntry = { ...entry, savedAt: new Date().toISOString() };
    const updated = [newEntry, ...existing].slice(0, 20);
    localStorage.setItem(key, JSON.stringify(updated));
  }, []);

  return { getHistory, pushHistory };
}
