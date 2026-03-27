import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, labSessions, conversations, auditEvents } from "@workspace/db";

const router: IRouter = Router();

router.get("/lab-sessions/:id/audit", async (req, res): Promise<void> => {
  const sessionId = parseInt(req.params.id, 10);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid session ID." });
    return;
  }

  const [session] = await db.select().from(labSessions).where(eq(labSessions.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "Session not found." });
    return;
  }

  const sessionConvs = await db.select().from(conversations).where(eq(conversations.sessionId, sessionId));

  if (sessionConvs.length === 0) {
    res.json({
      sessionId,
      sessionName: session.name,
      domain: session.domain,
      totalMessages: 0,
      summary: { checkedCount: 0, blockedCount: 0, flaggedCount: 0, passedCount: 0, avgGroundedness: null, groundednessEvaluatedCount: 0 },
      events: [],
    });
    return;
  }

  const convIds = sessionConvs.map((c) => c.id);

  const events = await db
    .select()
    .from(auditEvents)
    .where(inArray(auditEvents.conversationId, convIds))
    .orderBy(auditEvents.createdAt);

  const mappedEvents = events.map((e) => {
    const sm = e.safetyMetadata as {
      status?: string;
      categories?: { category: string; severity: number }[];
      blockedCategories?: string[];
      flaggedCategories?: string[];
      available?: boolean;
      checkedAt?: string;
    } | null;

    return {
      messageId: e.messageId ?? e.id,
      role: e.role,
      sessionId: e.sessionId,
      userId: e.userId,
      query: e.query,
      contentPreview: e.contentPreview,
      createdAt: e.createdAt,
      safety: {
        status: e.safetyStatus ?? sm?.status ?? "unavailable",
        available: sm?.available ?? false,
        checkedAt: sm?.checkedAt ?? e.createdAt?.toISOString?.() ?? new Date().toISOString(),
        categories: sm?.categories ?? [],
        blockedCategories: sm?.blockedCategories ?? [],
        flaggedCategories: sm?.flaggedCategories ?? [],
      },
      groundednessScore: e.groundednessScore ?? null,
      groundednessJustification: e.groundednessJustification ?? null,
      ragChunkRefs: e.ragChunkRefs ?? null,
      modelDeployment: e.modelDeployment ?? null,
    };
  });

  const checkedCount = mappedEvents.length;
  const blockedCount = mappedEvents.filter((e) => e.safety.status === "blocked").length;
  const flaggedCount = mappedEvents.filter((e) => e.safety.status === "flagged").length;
  const passedCount = mappedEvents.filter((e) => e.safety.status === "passed").length;

  const groundednessScores = mappedEvents
    .filter((e) => e.groundednessScore !== null && e.groundednessScore !== undefined)
    .map((e) => e.groundednessScore as number);
  const avgGroundedness = groundednessScores.length > 0
    ? groundednessScores.reduce((a, b) => a + b, 0) / groundednessScores.length
    : null;

  res.json({
    sessionId,
    sessionName: session.name,
    domain: session.domain,
    totalMessages: mappedEvents.length,
    summary: {
      checkedCount,
      blockedCount,
      flaggedCount,
      passedCount,
      avgGroundedness: avgGroundedness !== null ? Math.round(avgGroundedness * 1000) / 1000 : null,
      groundednessEvaluatedCount: groundednessScores.length,
    },
    events: mappedEvents,
  });
});

export default router;
