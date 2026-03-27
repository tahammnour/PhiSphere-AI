import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, labSessions } from "@workspace/db";
import {
  CreateLabSessionBody,
  GetLabSessionParams,
  DeleteLabSessionParams,
  GetLabSessionResponse,
  ListLabSessionsResponse,
} from "@workspace/api-zod";
import { trackEvent } from "../lib/azure-app-insights";
import { PROTOCOL_TEMPLATES } from "./templates";

const router: IRouter = Router();

router.get("/lab-sessions", async (_req, res): Promise<void> => {
  const sessions = await db
    .select()
    .from(labSessions)
    .orderBy(desc(labSessions.createdAt));
  res.json(ListLabSessionsResponse.parse(sessions));
});

router.post("/lab-sessions", async (req, res): Promise<void> => {
  const parsed = CreateLabSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(labSessions)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      domain: parsed.data.domain ?? "general",
    })
    .returning();

  trackEvent("SessionCreated", {
    sessionId: String(session?.id),
    domain: parsed.data.domain ?? "general",
  });

  res.status(201).json(GetLabSessionResponse.parse(session));
});

router.get("/lab-sessions/templates", (_req, res): void => {
  res.json({ templates: PROTOCOL_TEMPLATES });
});

router.get("/lab-sessions/:id", async (req, res): Promise<void> => {
  const params = GetLabSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db
    .select()
    .from(labSessions)
    .where(eq(labSessions.id, params.data.id));

  if (!session) {
    res.status(404).json({ error: "Lab session not found" });
    return;
  }

  res.json(GetLabSessionResponse.parse(session));
});

router.patch("/lab-sessions/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const { name, description } = req.body ?? {};
  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0 || name.length > 200)) {
    res.status(400).json({ error: "Invalid name" });
    return;
  }
  if (description !== undefined && (typeof description !== "string" || description.length > 1000)) {
    res.status(400).json({ error: "Invalid description" });
    return;
  }
  if (name === undefined && description === undefined) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  const updateData: Partial<typeof labSessions.$inferInsert> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description;

  const [session] = await db
    .update(labSessions)
    .set(updateData)
    .where(eq(labSessions.id, id))
    .returning();

  if (!session) {
    res.status(404).json({ error: "Lab session not found" });
    return;
  }

  res.json(GetLabSessionResponse.parse(session));
});

router.delete("/lab-sessions/:id", async (req, res): Promise<void> => {
  const params = DeleteLabSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db
    .delete(labSessions)
    .where(eq(labSessions.id, params.data.id))
    .returning();

  if (!session) {
    res.status(404).json({ error: "Lab session not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
