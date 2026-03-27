const ENDPOINT = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.replace(/\/$/, "") ?? "";
const KEY = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY ?? "";
const API_VERSION = "2024-11-30";
const MODEL = "prebuilt-layout";

export interface DocumentChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
}

export interface DocumentIntelligenceResult {
  available: boolean;
  chunks: DocumentChunk[];
  pageCount: number;
  analyzedAt: string;
  error?: string;
}

export function isDocumentIntelligenceAvailable(): boolean {
  return Boolean(ENDPOINT && KEY);
}

export async function analyzeDocument(
  base64: string,
  mimeType: string
): Promise<DocumentIntelligenceResult> {
  const analyzedAt = new Date().toISOString();

  if (!isDocumentIntelligenceAvailable()) {
    console.warn(
      "[Azure Document Intelligence] AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT and/or AZURE_DOCUMENT_INTELLIGENCE_KEY are not configured. " +
      "PDF text extraction will be skipped."
    );
    return { available: false, chunks: [], pageCount: 0, analyzedAt, error: "Azure Document Intelligence not configured." };
  }

  const analyzeUrl = `${ENDPOINT}/documentintelligence/documentModels/${MODEL}:analyze?api-version=${API_VERSION}`;
  let operationUrl: string;

  try {
    const res = await fetch(analyzeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": KEY,
      },
      body: JSON.stringify({
        base64Source: base64,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[Azure Document Intelligence] Submit failed HTTP ${res.status}: ${body}`);
      return { available: false, chunks: [], pageCount: 0, analyzedAt, error: `Document Intelligence HTTP ${res.status}` };
    }

    const location = res.headers.get("Operation-Location") ?? res.headers.get("operation-location");
    if (!location) {
      console.error("[Azure Document Intelligence] No Operation-Location header in response");
      return { available: false, chunks: [], pageCount: 0, analyzedAt, error: "No operation URL returned." };
    }
    operationUrl = location;
  } catch (err) {
    console.error("[Azure Document Intelligence] Network error submitting document:", err);
    return { available: false, chunks: [], pageCount: 0, analyzedAt, error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
  }

  let resultBody: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));
    try {
      const pollRes = await fetch(operationUrl, {
        headers: { "Ocp-Apim-Subscription-Key": KEY },
        signal: AbortSignal.timeout(15000),
      });
      if (!pollRes.ok) continue;
      const body = (await pollRes.json()) as Record<string, unknown>;
      const status = body.status as string | undefined;
      if (status === "succeeded") {
        resultBody = body;
        break;
      } else if (status === "failed") {
        console.error("[Azure Document Intelligence] Analysis failed:", body);
        return { available: false, chunks: [], pageCount: 0, analyzedAt, error: "Document analysis failed." };
      }
    } catch {
      continue;
    }
  }

  if (!resultBody) {
    console.error("[Azure Document Intelligence] Polling timed out.");
    return { available: false, chunks: [], pageCount: 0, analyzedAt, error: "Document Intelligence timed out." };
  }

  try {
    const analyzeResult = (resultBody.analyzeResult as Record<string, unknown>) ?? {};
    const pages = (analyzeResult.pages as Array<Record<string, unknown>>) ?? [];
    const pageCount = pages.length;

    const paragraphs = (analyzeResult.paragraphs as Array<{
      content?: string;
      boundingRegions?: Array<{ pageNumber?: number }>;
    }>) ?? [];

    const chunks: DocumentChunk[] = [];
    let currentChunk = "";
    let currentPage = 1;
    let chunkIndex = 0;
    const CHUNK_SIZE = 1200;

    for (const para of paragraphs) {
      const text = para.content?.trim() ?? "";
      if (!text) continue;
      const pageNum = para.boundingRegions?.[0]?.pageNumber ?? currentPage;

      if (currentChunk.length + text.length > CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push({ content: currentChunk.trim(), pageNumber: currentPage, chunkIndex });
        chunkIndex++;
        currentChunk = "";
      }
      currentChunk += (currentChunk ? "\n" : "") + text;
      currentPage = pageNum;
    }

    if (currentChunk.trim()) {
      chunks.push({ content: currentChunk.trim(), pageNumber: currentPage, chunkIndex });
    }

    if (chunks.length === 0 && pages.length > 0) {
      const lines: string[] = [];
      for (const page of pages) {
        const pageLines = (page.lines as Array<{ content?: string }>) ?? [];
        for (const line of pageLines) {
          if (line.content) lines.push(line.content);
        }
      }
      const fullText = lines.join("\n");
      for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
        chunks.push({ content: fullText.slice(i, i + CHUNK_SIZE), pageNumber: 1, chunkIndex: i / CHUNK_SIZE });
      }
    }

    return { available: true, chunks, pageCount, analyzedAt };
  } catch (err) {
    console.error("[Azure Document Intelligence] Failed to parse result:", err);
    return { available: false, chunks: [], pageCount: 0, analyzedAt, error: "Failed to parse document result." };
  }
}
