import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { z } from "zod";

export const CsvColumnStats = z.object({
  min: z.number(),
  max: z.number(),
  mean: z.number(),
});

export const CsvData = z.object({
  type: z.literal("csv"),
  filename: z.string(),
  columns: z.array(z.string()),
  numericColumns: z.array(z.string()),
  rowCount: z.number(),
  preview: z.array(z.record(z.string(), z.string())),
  stats: z.record(z.string(), CsvColumnStats),
  uploadedAt: z.string(),
});

export const VisionResult = z.object({
  available: z.boolean(),
  caption: z.string().optional(),
  captionConfidence: z.number().optional(),
  ocrText: z.string().optional(),
  objects: z.array(z.object({
    name: z.string(),
    confidence: z.number(),
  })).optional(),
  analyzedAt: z.string(),
  error: z.string().optional(),
});

export const ImageData = z.object({
  type: z.literal("image"),
  filename: z.string(),
  mimeType: z.string(),
  base64: z.string(),
  uploadedAt: z.string(),
  visionAnalysis: VisionResult.optional(),
});

export const DocumentIntelligenceResult = z.object({
  available: z.boolean(),
  analyzedAt: z.string(),
  error: z.string().optional(),
});

export const PdfData = z.object({
  type: z.literal("pdf"),
  filename: z.string(),
  pageCount: z.number(),
  chunkCount: z.number(),
  uploadedAt: z.string(),
  documentIntelligence: DocumentIntelligenceResult.optional(),
  preview: z.array(z.string()).optional(),
});

export const ExperimentData = z.union([CsvData, ImageData, PdfData]).nullable();

export const labSessions = pgTable("lab_sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  domain: text("domain").notNull().default("general"),
  experimentData: jsonb("experiment_data").$type<z.infer<typeof ExperimentData>>().default(null),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type LabSession = typeof labSessions.$inferSelect;
export type InsertLabSession = {
  name: string;
  description?: string;
  domain?: string;
};
export type CsvDataType = z.infer<typeof CsvData>;
export type ImageDataType = z.infer<typeof ImageData>;
export type PdfDataType = z.infer<typeof PdfData>;
export type ExperimentDataType = z.infer<typeof ExperimentData>;
export type VisionResultType = z.infer<typeof VisionResult>;
