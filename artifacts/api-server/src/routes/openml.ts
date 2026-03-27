import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { parse } from "csv-parse/sync";
import { db, labSessions, type CsvDataType } from "@workspace/db";
import { trackEvent } from "../lib/azure-app-insights";

const router: IRouter = Router();

const OPENML_API_BASE = "https://www.openml.org/api/v1/json";

interface OpenMLDatasetMeta {
  id: string;
  name: string;
  description: string;
  format: string;
  url: string;
  default_target_attribute?: string;
  tag?: string | string[];
}

interface OpenMLDatasetResponse {
  data_set_description: OpenMLDatasetMeta;
}

async function fetchOpenMLMeta(datasetId: number): Promise<OpenMLDatasetMeta> {
  const res = await fetch(`${OPENML_API_BASE}/data/${datasetId}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenML API returned ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as OpenMLDatasetResponse;
  return json.data_set_description;
}

async function fetchOpenMLCsv(csvUrl: string): Promise<string> {
  const res = await fetch(csvUrl, {
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Failed to download dataset CSV: HTTP ${res.status}`);
  }

  return res.text();
}

function arffToCsv(arffText: string): string {
  const lines = arffText.split("\n");
  const attributes: string[] = [];
  let dataStarted = false;
  const dataRows: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("%")) continue;

    if (line.toLowerCase() === "@data") {
      dataStarted = true;
      continue;
    }

    if (!dataStarted) {
      const attrMatch = line.match(/^@attribute\s+['"]?([^'"{\s]+)['"]?\s+/i);
      if (attrMatch) {
        attributes.push(attrMatch[1]);
      }
      continue;
    }

    if (line.startsWith("{") || line.startsWith("@")) continue;
    dataRows.push(line);
  }

  if (attributes.length === 0) throw new Error("No @attribute declarations found in ARFF");
  if (dataRows.length === 0) throw new Error("No data rows found in ARFF");

  return [attributes.join(","), ...dataRows].join("\n");
}

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

router.post("/lab-sessions/:id/import-openml", async (req, res): Promise<void> => {
  const sessionId = parseInt(req.params.id ?? "", 10);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const { datasetId } = req.body as { datasetId?: number };
  if (!datasetId || typeof datasetId !== "number" || datasetId <= 0) {
    res.status(400).json({ error: "datasetId is required and must be a positive integer (e.g. 61 for Iris)" });
    return;
  }

  const [session] = await db.select().from(labSessions).where(eq(labSessions.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "Lab session not found" });
    return;
  }

  let meta: OpenMLDatasetMeta;
  try {
    meta = await fetchOpenMLMeta(datasetId);
  } catch (err) {
    res.status(502).json({ error: `Failed to fetch OpenML dataset #${datasetId}: ${(err as Error).message}` });
    return;
  }

  let rawText: string;
  try {
    rawText = await fetchOpenMLCsv(meta.url);
  } catch (err) {
    res.status(502).json({ error: `Failed to download dataset file: ${(err as Error).message}` });
    return;
  }

  const isArff = meta.format?.toLowerCase() === "arff" || meta.url.endsWith(".arff");
  if (isArff) {
    try {
      rawText = arffToCsv(rawText);
    } catch (err) {
      res.status(422).json({ error: `Failed to convert ARFF to CSV: ${(err as Error).message}` });
      return;
    }
  }

  let rows: Record<string, string>[];
  try {
    rows = parse(rawText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];
  } catch {
    res.status(422).json({ error: "Failed to parse dataset as CSV" });
    return;
  }

  if (rows.length === 0) {
    res.status(422).json({ error: "Dataset has no data rows" });
    return;
  }

  const MAX_ROWS = 500;
  const truncated = rows.length > MAX_ROWS;
  if (truncated) rows = rows.slice(0, MAX_ROWS);

  const columns = Object.keys(rows[0] ?? {});
  const { numericColumns, stats } = computeStats(rows, columns);

  const filename = `openml-${datasetId}-${meta.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`;

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

  const attribution = `[OpenML Dataset #${datasetId}](https://www.openml.org/d/${datasetId}) — ${meta.name}`;
  const descUpdate = session.description
    ? `${session.description}\n\nData source: ${attribution}`
    : `Data source: ${attribution}`;

  const [updated] = await db
    .update(labSessions)
    .set({ experimentData: csvData, description: descUpdate, updatedAt: new Date() })
    .where(eq(labSessions.id, sessionId))
    .returning();

  trackEvent("OpenMLImport", {
    sessionId: String(sessionId),
    openmlDatasetId: String(datasetId),
    datasetName: meta.name,
    rowCount: String(rows.length),
    columnCount: String(columns.length),
    truncated: String(truncated),
  });

  res.json({
    session: updated,
    uploadType: "csv",
    openml: {
      datasetId,
      name: meta.name,
      description: meta.description?.slice(0, 500),
      format: meta.format,
      attribution,
      truncated,
      originalRowCount: truncated ? undefined : rows.length,
    },
    summary: {
      columns,
      numericColumns,
      rowCount: rows.length,
      stats,
    },
  });
});

router.get("/openml/search", async (req, res): Promise<void> => {
  const query = (req.query.q as string) ?? "";
  const limit = Math.min(parseInt((req.query.limit as string) ?? "10", 10) || 10, 25);

  try {
    const url = `${OPENML_API_BASE}/data/list/limit/${limit}${query ? `/data_name/${encodeURIComponent(query)}` : ""}`;
    const apiRes = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!apiRes.ok) {
      res.json({ datasets: [], message: "No matching datasets found" });
      return;
    }

    const json = (await apiRes.json()) as { data: { dataset: Array<{ did: string; name: string; NumberOfInstances: string; NumberOfFeatures: string; format: string }> } };
    const datasets = (json?.data?.dataset ?? []).map((d) => ({
      id: parseInt(d.did, 10),
      name: d.name,
      rows: parseInt(d.NumberOfInstances, 10),
      features: parseInt(d.NumberOfFeatures, 10),
      format: d.format,
    }));

    res.json({ datasets });
  } catch {
    res.json({ datasets: [], message: "OpenML search unavailable" });
  }
});

export default router;
