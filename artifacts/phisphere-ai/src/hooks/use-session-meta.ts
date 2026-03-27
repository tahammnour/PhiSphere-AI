import { useState, useCallback } from "react";

const META_KEY = "phisphere_session_meta";

export interface SessionMeta {
  pinned?: boolean;
  archived?: boolean;
  tags?: string[];
}

type MetaMap = Record<number, SessionMeta>;

function loadMeta(): MetaMap {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveMeta(map: MetaMap) {
  localStorage.setItem(META_KEY, JSON.stringify(map));
}

export function useSessionMeta() {
  const [meta, setMeta] = useState<MetaMap>(loadMeta);

  const getMeta = useCallback((id: number): SessionMeta => meta[id] ?? {}, [meta]);

  const updateMeta = useCallback((id: number, updates: Partial<SessionMeta>) => {
    setMeta((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] ?? {}), ...updates } };
      saveMeta(next);
      return next;
    });
  }, []);

  const togglePin = useCallback((id: number) => {
    setMeta((prev) => {
      const pinned = !prev[id]?.pinned;
      const next = { ...prev, [id]: { ...(prev[id] ?? {}), pinned } };
      saveMeta(next);
      return next;
    });
  }, []);

  const toggleArchive = useCallback((id: number) => {
    setMeta((prev) => {
      const archived = !prev[id]?.archived;
      const next = { ...prev, [id]: { ...(prev[id] ?? {}), archived } };
      saveMeta(next);
      return next;
    });
  }, []);

  const addTag = useCallback((id: number, tag: string) => {
    setMeta((prev) => {
      const existing = prev[id]?.tags ?? [];
      if (existing.includes(tag)) return prev;
      const next = { ...prev, [id]: { ...(prev[id] ?? {}), tags: [...existing, tag] } };
      saveMeta(next);
      return next;
    });
  }, []);

  const removeTag = useCallback((id: number, tag: string) => {
    setMeta((prev) => {
      const tags = (prev[id]?.tags ?? []).filter((t) => t !== tag);
      const next = { ...prev, [id]: { ...(prev[id] ?? {}), tags } };
      saveMeta(next);
      return next;
    });
  }, []);

  const allTags = useCallback((): string[] => {
    const set = new Set<string>();
    Object.values(meta).forEach((m) => m.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [meta]);

  return { getMeta, updateMeta, togglePin, toggleArchive, addTag, removeTag, allTags };
}
