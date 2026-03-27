import { openai, AZURE_OPENAI_DEPLOYMENT } from "@workspace/integrations-openai-ai-server";

const ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT?.replace(/\/$/, "") ?? "";
const KEY = process.env.AZURE_SEARCH_KEY ?? "";
const INDEX_NAME = process.env.AZURE_SEARCH_INDEX_NAME ?? "phisphere-docs";
const API_VERSION = "2024-07-01";
const AZURE_OPENAI_EMBEDDING_DEPLOYMENT = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT ?? "text-embedding-ada-002";
const VECTOR_DIMENSIONS = 1536;

export interface SearchResult {
  content: string;
  sourceFile: string;
  pageNumber: number;
  score: number;
}

export function isSearchAvailable(): boolean {
  return Boolean(ENDPOINT && KEY);
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await openai.embeddings.create({
      model: AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
      input: text.slice(0, 8192),
    });
    return response.data[0]?.embedding ?? null;
  } catch (err) {
    console.warn("[Azure Search] Embedding generation failed (vector search disabled for this request):", err instanceof Error ? err.message : String(err));
    return null;
  }
}

async function ensureIndexExists(): Promise<boolean> {
  const url = `${ENDPOINT}/indexes/${INDEX_NAME}?api-version=${API_VERSION}`;
  try {
    const checkRes = await fetch(url, {
      headers: { "api-key": KEY },
      signal: AbortSignal.timeout(8000),
    });
    if (checkRes.ok) return true;

    const schema = {
      name: INDEX_NAME,
      fields: [
        { name: "id", type: "Edm.String", key: true, filterable: true },
        { name: "content", type: "Edm.String", searchable: true, analyzer: "en.microsoft" },
        { name: "sourceFile", type: "Edm.String", searchable: true, filterable: true, retrievable: true },
        { name: "sessionId", type: "Edm.String", filterable: true, retrievable: true },
        { name: "chunkIndex", type: "Edm.Int32", retrievable: true },
        { name: "pageNumber", type: "Edm.Int32", retrievable: true },
        {
          name: "contentVector",
          type: "Collection(Edm.Single)",
          searchable: true,
          retrievable: false,
          dimensions: VECTOR_DIMENSIONS,
          vectorSearchProfile: "default-profile",
        },
      ],
      vectorSearch: {
        algorithms: [{ name: "default-algorithm", kind: "hnsw", hnswParameters: { metric: "cosine", m: 4, efConstruction: 400, efSearch: 500 } }],
        profiles: [{ name: "default-profile", algorithm: "default-algorithm" }],
      },
    };

    const createRes = await fetch(`${ENDPOINT}/indexes?api-version=${API_VERSION}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": KEY,
      },
      body: JSON.stringify(schema),
      signal: AbortSignal.timeout(15000),
    });

    if (!createRes.ok) {
      const body = await createRes.text().catch(() => "");
      console.error(`[Azure Search] Failed to create index HTTP ${createRes.status}: ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Azure Search] Error ensuring index exists:", err);
    return false;
  }
}

export async function indexDocumentChunks(
  sessionId: string,
  sourceFile: string,
  chunks: Array<{ content: string; pageNumber: number; chunkIndex: number }>
): Promise<boolean> {
  if (!isSearchAvailable()) {
    console.warn("[Azure Search] AZURE_SEARCH_ENDPOINT and/or AZURE_SEARCH_KEY not configured. Skipping indexing.");
    return false;
  }

  const indexOk = await ensureIndexExists();
  if (!indexOk) return false;

  const docs: Array<Record<string, unknown>> = [];
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);
    const doc: Record<string, unknown> = {
      "@search.action": "mergeOrUpload",
      id: `${sessionId}-${sourceFile.replace(/[^a-zA-Z0-9]/g, "_")}-${chunk.chunkIndex}`,
      content: chunk.content,
      sourceFile,
      sessionId,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
    };
    if (embedding) {
      doc.contentVector = embedding;
    }
    docs.push(doc);
  }

  const BATCH_SIZE = 50;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch(`${ENDPOINT}/indexes/${INDEX_NAME}/docs/index?api-version=${API_VERSION}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": KEY,
        },
        body: JSON.stringify({ value: batch }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[Azure Search] Indexing batch failed HTTP ${res.status}: ${body}`);
      }
    } catch (err) {
      console.error("[Azure Search] Network error during indexing:", err);
    }
  }

  return true;
}

export async function searchDocuments(
  query: string,
  sessionId?: string,
  topK = 3
): Promise<SearchResult[]> {
  if (!isSearchAvailable()) return [];

  const filter = sessionId ? `sessionId eq '${sessionId}'` : undefined;

  const queryEmbedding = await generateEmbedding(query);

  const searchBody: Record<string, unknown> = {
    search: query,
    queryType: "simple",
    top: topK,
    select: "content,sourceFile,pageNumber",
    ...(filter ? { filter } : {}),
  };

  if (queryEmbedding) {
    searchBody.vectorQueries = [
      {
        kind: "vector",
        vector: queryEmbedding,
        fields: "contentVector",
        k: topK,
        exhaustive: false,
      },
    ];
    searchBody.queryType = "simple";
  }

  try {
    const res = await fetch(`${ENDPOINT}/indexes/${INDEX_NAME}/docs/search?api-version=${API_VERSION}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": KEY,
      },
      body: JSON.stringify(searchBody),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[Azure Search] Search failed HTTP ${res.status}: ${body}`);
      return [];
    }

    const result = (await res.json()) as {
      value?: Array<{ content?: string; sourceFile?: string; pageNumber?: number; "@search.score"?: number }>;
    };

    return (result.value ?? []).map((r) => ({
      content: r.content ?? "",
      sourceFile: r.sourceFile ?? "",
      pageNumber: r.pageNumber ?? 0,
      score: r["@search.score"] ?? 0,
    }));
  } catch (err) {
    console.error("[Azure Search] Network error during search:", err);
    return [];
  }
}

export function buildRagContext(results: SearchResult[], query: string): string {
  if (results.length === 0) return "";
  const citations = results
    .map((r, i) => `[${i + 1}] ${r.sourceFile} (p.${r.pageNumber})\n${r.content}`)
    .join("\n\n");
  return `\n\n--- RETRIEVED PROTOCOL CONTEXT (Azure AI Search RAG) ---\nQuery: "${query}"\n\n${citations}\n--- END RETRIEVED CONTEXT ---\n\nUse the above retrieved protocol context to ground your response. Cite sources as [1], [2], etc.`;
}

export function buildRagCitationBlock(results: SearchResult[]): string {
  if (results.length === 0) return "";
  const lines = results.map(
    (r, i) => `[${i + 1}] **${r.sourceFile}**, page ${r.pageNumber} *(relevance: ${(r.score * 100).toFixed(0)}%)*`
  );
  return `\n\n---\n**Sources (Azure AI Search)**\n${lines.join("\n")}`;
}

export { AZURE_OPENAI_DEPLOYMENT };
