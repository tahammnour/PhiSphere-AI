import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, labSessions, conversations, messages } from "@workspace/db";

const router: IRouter = Router();

router.get("/lab-sessions/:id/export", async (req, res): Promise<void> => {
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

  const [conversation] = await db.select().from(conversations).where(eq(conversations.sessionId, sessionId));
  const msgs = conversation
    ? await db.select().from(messages).where(eq(messages.conversationId, conversation.id)).orderBy(messages.createdAt)
    : [];

  const lines: string[] = [];
  lines.push(`# PhiSphere AI — Lab Session Export`);
  lines.push(``);
  lines.push(`**Session:** ${session.name}`);
  lines.push(`**Domain:** ${session.domain}`);
  lines.push(`**Created:** ${new Date(session.createdAt).toLocaleString()}`);
  if (session.description) {
    lines.push(`**Protocol:** ${session.description}`);
  }
  lines.push(``);

  if (session.experimentData) {
    const data = session.experimentData as { type: string; filename?: string; rowCount?: number; columns?: string[] };
    lines.push(`## Attached Data`);
    if (data.type === "csv") {
      lines.push(`- **File:** ${data.filename}`);
      lines.push(`- **Rows:** ${data.rowCount}`);
      lines.push(`- **Columns:** ${(data.columns ?? []).join(", ")}`);
    } else if (data.type === "image") {
      lines.push(`- **Image:** ${data.filename}`);
    }
    lines.push(``);
  }

  if (msgs.length > 0) {
    lines.push(`## Conversation Transcript`);
    lines.push(``);
    for (const msg of msgs) {
      const role = msg.role === "user" ? "**Researcher**" : "**PhiSphere AI**";
      const ts = new Date(msg.createdAt).toLocaleTimeString();
      lines.push(`### ${role} — ${ts}`);
      lines.push(``);
      lines.push(msg.content);
      if (msg.role === "assistant" && msg.safetyMetadata) {
        const sm = msg.safetyMetadata as { status: string };
        lines.push(``);
        lines.push(`> Content Safety: ${sm.status}`);
      }
      lines.push(``);
    }
  }

  lines.push(`---`);
  lines.push(`*Exported from PhiSphere AI on ${new Date().toLocaleString()}*`);

  const markdown = lines.join("\n");
  const safeName = session.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
  const filename = `phisphere_${safeName}_${sessionId}.md`;

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(markdown);
});

export default router;
