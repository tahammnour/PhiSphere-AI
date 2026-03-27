const ENDPOINT = process.env.AZURE_VISION_ENDPOINT?.replace(/\/$/, "") ?? "";
const KEY = process.env.AZURE_VISION_KEY ?? "";
const API_VERSION = "2024-02-01";

export interface VisionObject {
  name: string;
  confidence: number;
  boundingBox?: { x: number; y: number; w: number; h: number };
}

export interface VisionResult {
  available: boolean;
  caption?: string;
  captionConfidence?: number;
  ocrText?: string;
  objects?: VisionObject[];
  analyzedAt: string;
  error?: string;
}

export function isVisionAvailable(): boolean {
  return Boolean(ENDPOINT && KEY);
}

export async function analyzeImage(base64: string, mimeType: string): Promise<VisionResult> {
  const analyzedAt = new Date().toISOString();

  if (!isVisionAvailable()) {
    console.error(
      "[Azure Vision] AZURE_VISION_ENDPOINT and AZURE_VISION_KEY are not configured. " +
      "Add these secrets to enable real image analysis. Image analysis will be skipped."
    );
    return {
      available: false,
      analyzedAt,
      error: "Azure AI Vision is not configured. Add AZURE_VISION_ENDPOINT and AZURE_VISION_KEY to your project secrets.",
    };
  }

  const buffer = Buffer.from(base64, "base64");
  let raw: Response;
  try {
    raw = await fetch(
      `${ENDPOINT}/computervision/imageanalysis:analyze?features=read,objects,caption&api-version=${API_VERSION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": mimeType,
          "Ocp-Apim-Subscription-Key": KEY,
        },
        body: buffer,
        signal: AbortSignal.timeout(15000),
      }
    );
  } catch (err) {
    console.error("[Azure Vision] Network error calling Azure AI Vision:", err);
    return {
      available: false,
      analyzedAt,
      error: `Azure AI Vision network error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!raw.ok) {
    const errorBody = await raw.text().catch(() => "");
    console.error(`[Azure Vision] Azure AI Vision returned HTTP ${raw.status}: ${errorBody}`);
    return {
      available: false,
      analyzedAt,
      error: `Azure AI Vision returned HTTP ${raw.status}. Check your endpoint and API key.`,
    };
  }

  let body: Record<string, unknown>;
  try {
    body = (await raw.json()) as Record<string, unknown>;
  } catch (err) {
    console.error("[Azure Vision] Failed to parse Azure AI Vision response:", err);
    return {
      available: false,
      analyzedAt,
      error: "Azure AI Vision returned an invalid response.",
    };
  }

  const captionBlock = body.captionResult as { text?: string; confidence?: number } | undefined;
  const caption = captionBlock?.text;
  const captionConfidence = captionBlock?.confidence;

  const readBlock = body.readResult as {
    blocks?: Array<{ lines?: Array<{ text?: string }> }>;
  } | undefined;

  const ocrLines: string[] = [];
  for (const block of readBlock?.blocks ?? []) {
    for (const line of block.lines ?? []) {
      if (line.text) ocrLines.push(line.text);
    }
  }
  const ocrText = ocrLines.join("\n") || undefined;

  const objectsBlock = body.objectsResult as {
    values?: Array<{
      tags?: Array<{ name?: string; confidence?: number }>;
      boundingBox?: { x?: number; y?: number; w?: number; h?: number };
    }>;
  } | undefined;

  const objects: VisionObject[] = [];
  for (const obj of objectsBlock?.values ?? []) {
    const tag = obj.tags?.[0];
    if (tag?.name) {
      objects.push({
        name: tag.name,
        confidence: tag.confidence ?? 0,
        boundingBox: obj.boundingBox
          ? { x: obj.boundingBox.x ?? 0, y: obj.boundingBox.y ?? 0, w: obj.boundingBox.w ?? 0, h: obj.boundingBox.h ?? 0 }
          : undefined,
      });
    }
  }

  return { available: true, caption, captionConfidence, ocrText, objects: objects.length > 0 ? objects : undefined, analyzedAt };
}

export function buildVisionContext(vision: VisionResult): string {
  if (!vision.available) {
    return `\n--- AZURE AI VISION (UNAVAILABLE) ---\n${vision.error ?? "Azure AI Vision is not configured."}\n--- END VISION ANALYSIS ---`;
  }

  const lines: string[] = ["\n--- AZURE AI VISION ANALYSIS ---"];

  if (vision.caption) {
    lines.push(`Image caption: "${vision.caption}" (confidence: ${(vision.captionConfidence ?? 0).toFixed(2)})`);
  }
  if (vision.ocrText) {
    lines.push(`OCR text extracted from image:\n${vision.ocrText}`);
  }
  if (vision.objects && vision.objects.length > 0) {
    const objList = vision.objects.map((o) => `  - ${o.name} (confidence: ${o.confidence.toFixed(2)})`).join("\n");
    lines.push(`Detected objects:\n${objList}`);
  }
  lines.push("--- END VISION ANALYSIS ---");
  return lines.join("\n");
}
