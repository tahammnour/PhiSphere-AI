import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetOpenaiConversationQueryKey } from '@workspace/api-client-react';
import type { SafetyCheckResult } from '@/components/chat/SafetyBadge';

export interface RecognizedEntity {
  text: string;
  category: string;
  subcategory?: string;
  confidenceScore: number;
}

export interface RagSource {
  sourceFile: string;
  pageNumber: number;
  score: number;
}

export interface GroundednessResult {
  score: number;
  justification: string;
  evaluatedAt: string;
}

export function useChatStream(conversationId: number | null) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [streamedSafety, setStreamedSafety] = useState<SafetyCheckResult | null>(null);
  const [streamedEntities, setStreamedEntities] = useState<RecognizedEntity[]>([]);
  const [streamedRagSources, setStreamedRagSources] = useState<RagSource[]>([]);
  const [streamedGroundedness, setStreamedGroundedness] = useState<GroundednessResult | null>(null);
  const queryClient = useQueryClient();

  const sendMessage = async (content: string, sessionContext?: string) => {
    if (!conversationId) return;

    setIsStreaming(true);
    setStreamedContent('');
    setStreamedSafety(null);
    setStreamedEntities([]);
    setStreamedRagSources([]);
    setStreamedGroundedness(null);

    try {
      const res = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sessionContext })
      });

      if (!res.body) throw new Error('No readable stream available in response.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const rawEvent of events) {
            if (!rawEvent.trim()) continue;

            const lines = rawEvent.split('\n');
            let eventType = 'message';
            let dataStr = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                dataStr = line.slice(6);
              }
            }

            if (!dataStr) continue;

            if (eventType === 'safety') {
              try {
                const safety = JSON.parse(dataStr) as SafetyCheckResult;
                setStreamedSafety(safety);
              } catch {
              }
              continue;
            }

            if (eventType === 'entities') {
              try {
                const payload = JSON.parse(dataStr) as { entities: RecognizedEntity[]; available: boolean };
                if (payload.available && payload.entities.length > 0) {
                  setStreamedEntities(payload.entities);
                }
              } catch {
              }
              continue;
            }

            if (eventType === 'rag') {
              try {
                const payload = JSON.parse(dataStr) as { results: RagSource[]; count: number };
                if (payload.count > 0) {
                  setStreamedRagSources(payload.results);
                }
              } catch {
              }
              continue;
            }

            if (eventType === 'groundedness') {
              try {
                const payload = JSON.parse(dataStr) as GroundednessResult;
                setStreamedGroundedness(payload);
              } catch {
              }
              continue;
            }

            if (dataStr === '[DONE]') {
              done = true;
              continue;
            }

            try {
              const data = JSON.parse(dataStr) as {
                done?: boolean;
                started?: boolean;
                chunk?: number;
                content?: string;
                error?: string;
                replace?: string;
                ragCitation?: string;
              };

              if (data.done) {
                done = true;
              } else if (data.replace) {
                setStreamedContent(data.replace);
              } else if (data.ragCitation) {
                setStreamedContent((prev) => prev + data.ragCitation);
              } else if (data.content) {
                setStreamedContent((prev) => prev + data.content);
              }
            } catch {
            }
          }
        }

        if (readerDone) done = true;
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setIsStreaming(false);
      setStreamedContent('');
      setStreamedSafety(null);
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) });
    }
  };

  return { sendMessage, isStreaming, streamedContent, streamedSafety, streamedEntities, streamedRagSources, streamedGroundedness };
}
