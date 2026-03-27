import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, conversations, messages, labSessions, auditEvents } from "@workspace/db";

const router: IRouter = Router();

router.get("/evaluation/summary", async (_req, res): Promise<void> => {
  const allMessages = await db
    .select({
      id: messages.id,
      role: messages.role,
      safetyMetadata: messages.safetyMetadata,
      groundednessScore: messages.groundednessScore,
    })
    .from(messages)
    .where(eq(messages.role, "assistant"));

  const totalMessages = allMessages.length;
  let flaggedCount = 0;
  let blockedCount = 0;
  let safetyCheckedCount = 0;
  let groundednessSum = 0;
  let groundednessCount = 0;

  for (const msg of allMessages) {
    const sm = msg.safetyMetadata as { status?: string; available?: boolean } | null;
    if (sm && sm.available) {
      safetyCheckedCount++;
      if (sm.status === "flagged") flaggedCount++;
      if (sm.status === "blocked") blockedCount++;
    }
    if (msg.groundednessScore !== null && msg.groundednessScore !== undefined) {
      groundednessSum += msg.groundednessScore;
      groundednessCount++;
    }
  }

  const avgGroundedness = groundednessCount > 0 ? groundednessSum / groundednessCount : null;

  res.json({
    totalMessages,
    safetyCheckedCount,
    flaggedCount,
    blockedCount,
    passedCount: safetyCheckedCount - flaggedCount - blockedCount,
    avgGroundedness: avgGroundedness !== null ? Math.round(avgGroundedness * 1000) / 1000 : null,
    groundednessEvaluatedCount: groundednessCount,
    generatedAt: new Date().toISOString(),
  });
});

router.get("/evaluation/report", async (req, res): Promise<void> => {
  const sessionIdRaw = req.query.sessionId;
  if (!sessionIdRaw || typeof sessionIdRaw !== "string") {
    res.status(400).json({ error: "sessionId query parameter is required" });
    return;
  }

  const sessionId = parseInt(sessionIdRaw, 10);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "sessionId must be a valid integer" });
    return;
  }

  const [session] = await db.select().from(labSessions).where(eq(labSessions.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const sessionConvs = await db.select().from(conversations).where(eq(conversations.sessionId, sessionId));

  if (sessionConvs.length === 0) {
    res.json({
      sessionId,
      sessionName: session.name,
      domain: session.domain,
      totalMessages: 0,
      avgGroundedness: null,
      safetyFlagRate: null,
      messages: [],
      generatedAt: new Date().toISOString(),
    });
    return;
  }

  const convIds = sessionConvs.map((c) => c.id);

  const msgs = await db
    .select()
    .from(messages)
    .where(inArray(messages.conversationId, convIds))
    .orderBy(messages.createdAt);

  const assistantMsgs = msgs.filter((m) => m.role === "assistant");
  let groundednessSum = 0;
  let groundednessCount = 0;
  let flaggedCount = 0;
  let safetyCheckedCount = 0;

  const messageReports = msgs.map((m) => {
    const sm = m.safetyMetadata as {
      status?: string;
      categories?: { category: string; severity: number }[];
      blockedCategories?: string[];
      flaggedCategories?: string[];
      available?: boolean;
      checkedAt?: string;
    } | null;

    if (m.role === "assistant" && sm?.available) {
      safetyCheckedCount++;
      if (sm.status === "flagged" || sm.status === "blocked") flaggedCount++;
    }
    if (m.role === "assistant" && m.groundednessScore !== null && m.groundednessScore !== undefined) {
      groundednessSum += m.groundednessScore;
      groundednessCount++;
    }

    return {
      messageId: m.id,
      role: m.role,
      contentPreview: m.content.slice(0, 200) + (m.content.length > 200 ? "…" : ""),
      createdAt: m.createdAt,
      safety: sm ? {
        status: sm.status ?? "unavailable",
        available: sm.available ?? false,
        categories: sm.categories ?? [],
        blockedCategories: sm.blockedCategories ?? [],
        flaggedCategories: sm.flaggedCategories ?? [],
        checkedAt: sm.checkedAt ?? null,
      } : null,
      groundednessScore: m.groundednessScore ?? null,
      groundednessJustification: m.groundednessJustification ?? null,
      ragChunkRefs: m.ragChunkRefs ?? null,
      modelDeployment: m.modelDeployment ?? null,
    };
  });

  const avgGroundedness = groundednessCount > 0 ? groundednessSum / groundednessCount : null;
  const safetyFlagRate = safetyCheckedCount > 0 ? flaggedCount / safetyCheckedCount : null;

  res.json({
    sessionId,
    sessionName: session.name,
    domain: session.domain,
    totalMessages: msgs.length,
    assistantMessages: assistantMsgs.length,
    avgGroundedness: avgGroundedness !== null ? Math.round(avgGroundedness * 1000) / 1000 : null,
    groundednessEvaluatedCount: groundednessCount,
    safetyFlagRate: safetyFlagRate !== null ? Math.round(safetyFlagRate * 1000) / 1000 : null,
    flaggedCount,
    safetyCheckedCount,
    messages: messageReports,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
