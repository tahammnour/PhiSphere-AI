import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListLabSessions,
  useCreateLabSession,
  useDeleteLabSession,
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  getListLabSessionsQueryKey,
  getListOpenaiConversationsQueryKey,
  type CreateLabSessionBody,
} from "@workspace/api-client-react";
import type { NewSessionData } from "@/components/sessions/NewSessionModal";

export function useWorkspace() {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessionsQuery } = useListLabSessions();
  const { data: conversations, isLoading: convsLoading, refetch: refetchConvsQuery } = useListOpenaiConversations();

  const createSessionMutation = useCreateLabSession();
  const createConvMutation = useCreateOpenaiConversation();
  const deleteSessionMutation = useDeleteLabSession();

  const selectedSession = sessions?.find((s) => s.id === selectedSessionId) ?? null;

  const selectedConversation = selectedSession
    ? (conversations?.find((c) => c.sessionId === selectedSession.id) ?? null)
    : null;

  const createSession = async (data: NewSessionData | CreateLabSessionBody) => {
    const { starterPrompt, ...sessionData } = data as NewSessionData;

    const newSession = await createSessionMutation.mutateAsync({ data: sessionData });

    const newConv = await createConvMutation.mutateAsync({
      data: { sessionId: newSession.id },
    });

    queryClient.invalidateQueries({ queryKey: getListLabSessionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });

    setSelectedSessionId(newSession.id);

    if (starterPrompt && newConv.id) {
      try {
        await fetch(`/api/openai/conversations/${newConv.id}/messages`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: starterPrompt }),
        });
      } catch {
      }
    }

    return newSession;
  };

  const deleteSession = async (sessionId: number) => {
    await deleteSessionMutation.mutateAsync({ id: sessionId });

    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
    }

    queryClient.invalidateQueries({ queryKey: getListLabSessionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
  };

  const refetchSessions = async () => {
    await refetchSessionsQuery();
    await refetchConvsQuery();
    queryClient.invalidateQueries({ queryKey: getListLabSessionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
  };

  return {
    sessions: sessions ?? [],
    conversations: conversations ?? [],
    selectedSessionId,
    setSelectedSessionId,
    selectedSession,
    selectedConversation,
    isLoading: sessionsLoading || convsLoading,
    createSession,
    deleteSession,
    refetchSessions,
    isCreating: createSessionMutation.isPending || createConvMutation.isPending,
    isDeleting: deleteSessionMutation.isPending,
  };
}
