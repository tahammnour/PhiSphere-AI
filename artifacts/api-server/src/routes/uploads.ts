import { Router, type IRouter } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";
import { db, labSessions, type CsvDataType, type ImageDataType, type PdfDataType } from "@workspace/db";
import { SAMPLE_DATASETS, SAMPLE_DATASET_MAP } from "../data/sample-datasets";
import {
  UploadLabSessionFileParams,
  LoadSampleDatasetParams,
  LoadSampleDatasetBody,
} from "@workspace/api-zod";
import { analyzeImage } from "../lib/azure-vision";
import { analyzeDocument } from "../lib/azure-document-intelligence";
import { indexDocumentChunks } from "../lib/azure-search";
import { trackEvent } from "../lib/azure-app-insights";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["text/csv", "image/jpeg", "image/png", "image/gif", "image/webp", "application/octet-stream", "application/pdf"];
    const allowedExt = [".csv", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"];
    const ext = "." + (file.originalname.split(".").pop() ?? "").toLowerCase();
    if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

function computeStats(rows: Record<string, string>[], columns: string[]) {
  const numericColumns: string[] = [];
  const stats: Record<string, { min: number; max: number; mean: number }> = {};

  for (const col of columns) {
    const values = rows.map((r) => parseFloat(r[col] ?? "")).filter((v) => !isNaN(v));
    if (values.length > 0) {
      numericColumns.push(col);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      stats[col] = { min: +min.toFixed(4), max: +max.toFixed(4), mean: +mean.toFixed(4) };
    }
  }

  return { numericColumns, stats };
}

router.post(
  "/lab-sessions/:id/upload",
  upload.single("file"),
  async (req, res): Promise<void> => {
    const params = UploadLabSessionFileParams.safeParse(req.params);
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

    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const file = req.file;
    const filename = file.originalname;
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";

    if (ext === "csv" || file.mimetype === "text/csv") {
      const rawText = file.buffer.toString("utf-8");

      let rows: Record<string, string>[];
      try {
        rows = parse(rawText, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
        }) as Record<string, string>[];
      } catch {
        res.status(400).json({ error: "Failed to parse CSV: invalid format" });
        return;
      }

      if (rows.length === 0) {
        res.status(400).json({ error: "CSV file is empty or has no data rows" });
        return;
      }

      const columns = Object.keys(rows[0] ?? {});
      const { numericColumns, stats } = computeStats(rows, columns);

      const csvData: CsvDataType = {
        type: "csv",
        filename,
        columns,
        numericColumns,
        rowCount: rows.length,
        preview: rows.slice(0, 5),
        stats,
        uploadedAt: new Date().toISOString(),
      };

      const [updated] = await db
        .update(labSessions)
        .set({ experimentData: csvData, updatedAt: new Date() })
        .where(eq(labSessions.id, params.data.id))
        .returning();

      trackEvent("FileUploaded", {
        sessionId: String(params.data.id),
        fileType: "csv",
        rowCount: String(rows.length),
        columnCount: String(columns.length),
      });

      res.json({ session: updated, uploadType: "csv", summary: { columns, numericColumns, rowCount: rows.length, stats } });
      return;
    }

    const imageExts = ["jpg", "jpeg", "png", "gif", "webp"];
    const imageMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (imageExts.includes(ext) || imageMimeTypes.includes(file.mimetype)) {
      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
      };
      const mimeType = mimeMap[ext] ?? (imageMimeTypes.includes(file.mimetype) ? file.mimetype : "image/jpeg");
      const base64 = file.buffer.toString("base64");

      const visionAnalysis = await analyzeImage(base64, mimeType);

      const imageData: ImageDataType = {
        type: "image",
        filename,
        mimeType,
        base64,
        uploadedAt: new Date().toISOString(),
        visionAnalysis,
      };

      const [updated] = await db
        .update(labSessions)
        .set({ experimentData: imageData, updatedAt: new Date() })
        .where(eq(labSessions.id, params.data.id))
        .returning();

      trackEvent("FileUploaded", {
        sessionId: String(params.data.id),
        fileType: "image",
        mimeType,
        visionAvailable: String(visionAnalysis.available),
      });

      res.json({ session: updated, uploadType: "image", summary: { filename, mimeType, visionAnalysis } });
      return;
    }

    if (ext === "pdf" || file.mimetype === "application/pdf") {
      const base64 = file.buffer.toString("base64");
      const docResult = await analyzeDocument(base64, "application/pdf");

      if (docResult.available && docResult.chunks.length > 0) {
        void indexDocumentChunks(String(params.data.id), filename, docResult.chunks).catch((err) => {
          console.error("[Uploads] Failed to index PDF chunks:", err);
        });
      }

      trackEvent("FileUploaded", {
        sessionId: String(params.data.id),
        fileType: "pdf",
        documentIntelligenceAvailable: String(docResult.available),
        chunkCount: String(docResult.chunks.length),
        pageCount: String(docResult.pageCount),
      });

      const pdfSummary = docResult.available
        ? `PDF processed: ${docResult.pageCount} pages, ${docResult.chunks.length} text chunks extracted and indexed for RAG search.`
        : `PDF uploaded (Document Intelligence not configured — text extraction unavailable).`;

      const pdfData: PdfDataType = {
        type: "pdf",
        filename,
        pageCount: docResult.pageCount,
        chunkCount: docResult.chunks.length,
        uploadedAt: new Date().toISOString(),
        documentIntelligence: {
          available: docResult.available,
          analyzedAt: docResult.analyzedAt,
          ...(docResult.error ? { error: docResult.error } : {}),
        },
        preview: docResult.chunks.slice(0, 2).map((c) => c.content.slice(0, 300)),
      };

      const [updated] = await db
        .update(labSessions)
        .set({ experimentData: pdfData, updatedAt: new Date() })
        .where(eq(labSessions.id, params.data.id))
        .returning();

      res.json({ session: updated, uploadType: "pdf", summary: pdfSummary, documentIntelligence: docResult });
      return;
    }

    res.status(400).json({ error: "Unsupported file type. Please upload a CSV, image, or PDF file." });
  }
);

router.get("/sample-datasets", async (_req, res): Promise<void> => {
  const meta = SAMPLE_DATASETS.map(({ id, name, description, domain, rowCount, columns }) => ({
    id,
    name,
    description,
    domain,
    rowCount,
    columns,
  }));
  res.json(meta);
});

router.post("/lab-sessions/:id/load-sample", async (req, res): Promise<void> => {
  const params = LoadSampleDatasetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = LoadSampleDatasetBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const dataset = SAMPLE_DATASET_MAP.get(body.data.datasetId);
  if (!dataset) {
    res.status(404).json({ error: `Sample dataset '${body.data.datasetId}' not found` });
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

  const csvData: CsvDataType = { ...dataset.data, uploadedAt: new Date().toISOString() };

  const [updated] = await db
    .update(labSessions)
    .set({ experimentData: csvData, updatedAt: new Date() })
    .where(eq(labSessions.id, params.data.id))
    .returning();

  res.json({
    session: updated,
    uploadType: "csv",
    summary: {
      columns: dataset.columns,
      numericColumns: csvData.numericColumns,
      rowCount: dataset.rowCount,
      stats: csvData.stats,
    },
  });
});

export default router;
