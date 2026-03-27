import { doublePrecision, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { labSessions } from "./lab-sessions";
import { conversations } from "./conversations";
import { messages } from "./messages";
import type { SafetyMetadata } from "./messages";
import type { RagChunkRef } from "./messages";

export const auditEvents = pgTable("audit_events", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => labSessions.id, { onDelete: "cascade" }),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  messageId: integer("message_id")
    .references(() => messages.id, { onDelete: "set null" }),
  userId: integer("user_id"),
  role: text("role").notNull(),
  query: text("query"),
  contentPreview: text("content_preview").notNull(),
  safetyStatus: text("safety_status"),
  safetyMetadata: jsonb("safety_metadata").$type<SafetyMetadata>().default(null as unknown as SafetyMetadata),
  groundednessScore: doublePrecision("groundedness_score"),
  groundednessJustification: text("groundedness_justification"),
  ragChunkRefs: jsonb("rag_chunk_refs").$type<RagChunkRef[]>().default(null as unknown as RagChunkRef[]),
  modelDeployment: text("model_deployment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AuditEvent = typeof auditEvents.$inferSelect;
export type InsertAuditEvent = {
  sessionId: number;
  conversationId: number;
  messageId?: number | null;
  userId?: number | null;
  role: string;
  query?: string | null;
  contentPreview: string;
  safetyStatus?: string | null;
  safetyMetadata?: SafetyMetadata | null;
  groundednessScore?: number | null;
  groundednessJustification?: string | null;
  ragChunkRefs?: RagChunkRef[] | null;
  modelDeployment?: string | null;
};
