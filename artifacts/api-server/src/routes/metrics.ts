import { Router, type IRouter } from "express";
import { sql, eq } from "drizzle-orm";
import { db, labSessions, conversations, messages } from "@workspace/db";
import { isContentSafetyAvailable } from "../lib/azure-content-safety";
import { isVisionAvailable } from "../lib/azure-vision";
import { isDocumentIntelligenceAvailable } from "../lib/azure-document-intelligence";
import { isSearchAvailable } from "../lib/azure-search";
import { isLanguageAvailable } from "../lib/azure-language";
import { isAppInsightsAvailable } from "../lib/azure-app-insights";

const router: IRouter = Router();

function isAzureOpenAIConfigured(): boolean {
  return Boolean(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY);
}

router.get("/metrics/dashboard", async (_req, res): Promise<void> => {
  const [sessionCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(labSessions);

  const [convCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversations);

  const allAssistant = await db
    .select({
      id: messages.id,
      safetyMetadata: messages.safetyMetadata,
      groundednessScore: messages.groundednessScore,
      ragChunkRefs: messages.ragChunkRefs,
    })
    .from(messages)
    .where(eq(messages.role, "assistant"));

  const [totalMsgCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages);

  let safetyCheckedCount = 0;
  let safetyPassedCount = 0;
  let safetyFlaggedCount = 0;
  let safetyBlockedCount = 0;
  let groundednessSum = 0;
  let groundednessCount = 0;
  let ragEnabledMessages = 0;

  for (const msg of allAssistant) {
    const sm = msg.safetyMetadata as { status?: string; available?: boolean } | null;
    if (sm?.available) {
      safetyCheckedCount++;
      if (sm.status === "passed") safetyPassedCount++;
      if (sm.status === "flagged") safetyFlaggedCount++;
      if (sm.status === "blocked") safetyBlockedCount++;
    }
    if (msg.groundednessScore !== null && msg.groundednessScore !== undefined) {
      groundednessSum += msg.groundednessScore;
      groundednessCount++;
    }
    const refs = msg.ragChunkRefs as unknown[] | null;
    if (refs && refs.length > 0) {
      ragEnabledMessages++;
    }
  }

  const safetyPassRate =
    safetyCheckedCount > 0
      ? Math.round(((safetyCheckedCount - safetyFlaggedCount - safetyBlockedCount) / safetyCheckedCount) * 1000) / 1000
      : null;

  const avgGroundedness =
    groundednessCount > 0 ? Math.round((groundednessSum / groundednessCount) * 1000) / 1000 : null;

  const openmlImportCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(labSessions)
    .where(sql`${labSessions.description} LIKE '%OpenML Dataset%'`);

  const services = [
    isAzureOpenAIConfigured(),
    isContentSafetyAvailable(),
    isVisionAvailable(),
    isDocumentIntelligenceAvailable(),
    isSearchAvailable(),
    isLanguageAvailable(),
    isAppInsightsAvailable(),
    false, // Azure ML — tracked via notebooks, not live API
  ];
  const azureServicesActive = services.filter(Boolean).length;

  res.json({
    totalSessions: sessionCount?.count ?? 0,
    totalConversations: convCount?.count ?? 0,
    totalMessages: totalMsgCount?.count ?? 0,
    assistantMessages: allAssistant.length,
    safetyCheckedCount,
    safetyPassedCount,
    safetyFlaggedCount,
    safetyBlockedCount,
    safetyPassRate,
    avgGroundedness,
    groundednessEvaluatedCount: groundednessCount,
    ragEnabledMessages,
    openmlImports: openmlImportCount[0]?.count ?? 0,
    azureServicesActive,
    azureServicesTotal: 8,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
