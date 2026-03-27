import { doublePrecision, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

import { conversations } from "./conversations";

export const SafetyMetadataSchema = z.object({
  status: z.enum(["passed", "flagged", "blocked", "unavailable"]),
  categories: z.array(z.object({ category: z.string(), severity: z.number() })),
  blockedCategories: z.array(z.string()),
  flaggedCategories: z.array(z.string()),
  available: z.boolean(),
  checkedAt: z.string(),
});

export type SafetyMetadata = z.infer<typeof SafetyMetadataSchema>;

export const RagChunkRefSchema = z.object({
  sourceFile: z.string(),
  pageNumber: z.number(),
  score: z.number(),
  chunkIndex: z.number().optional(),
  excerpt: z.string().optional(),
});

export type RagChunkRef = z.infer<typeof RagChunkRefSchema>;

export const AcademicCitationSchema = z.object({
  paperId: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  year: z.number().nullable(),
  venue: z.string().nullable(),
  doi: z.string().nullable(),
  url: z.string(),
  openAccessUrl: z.string().nullable(),
  citationCount: z.number(),
  abstract: z.string().nullable(),
});

export type AcademicCitation = z.infer<typeof AcademicCitationSchema>;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  safetyMetadata: jsonb("safety_metadata").$type<SafetyMetadata>().default(null as unknown as SafetyMetadata),
  groundednessScore: doublePrecision("groundedness_score"),
  groundednessJustification: text("groundedness_justification"),
  ragChunkRefs: jsonb("rag_chunk_refs").$type<RagChunkRef[]>().default(null as unknown as RagChunkRef[]),
  citations: jsonb("citations").$type<AcademicCitation[]>().default(null as unknown as AcademicCitation[]),
  modelDeployment: text("model_deployment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = {
  conversationId: number;
  role: string;
  content: string;
  safetyMetadata?: SafetyMetadata | null;
  groundednessScore?: number | null;
  groundednessJustification?: string | null;
  ragChunkRefs?: RagChunkRef[] | null;
  citations?: AcademicCitation[] | null;
  modelDeployment?: string | null;
};
