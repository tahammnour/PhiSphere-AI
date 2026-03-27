const ENDPOINT = process.env.AZURE_LANGUAGE_ENDPOINT?.replace(/\/$/, "") ?? "";
const KEY = process.env.AZURE_LANGUAGE_KEY ?? "";
const API_VERSION = "2023-04-01";

export interface RecognizedEntity {
  text: string;
  category: string;
  subcategory?: string;
  confidenceScore: number;
}

export interface LanguageResult {
  available: boolean;
  entities: RecognizedEntity[];
  analyzedAt: string;
  error?: string;
}

const SCIENTIFIC_CATEGORIES = new Set([
  "Product",
  "Quantity",
  "Organization",
  "Location",
  "DateTime",
  "Event",
  "Skill",
  "PersonType",
  "URL",
  "Email",
]);

export function isLanguageAvailable(): boolean {
  return Boolean(ENDPOINT && KEY);
}

export async function extractEntities(text: string): Promise<LanguageResult> {
  const analyzedAt = new Date().toISOString();

  if (!isLanguageAvailable()) {
    console.warn(
      "[Azure Language] AZURE_LANGUAGE_ENDPOINT and/or AZURE_LANGUAGE_KEY are not configured. " +
      "Entity extraction will be skipped."
    );
    return { available: false, entities: [], analyzedAt, error: "Azure AI Language not configured." };
  }

  const truncatedText = text.slice(0, 5120);

  const body = {
    kind: "EntityRecognition",
    parameters: { modelVersion: "latest" },
    analysisInput: {
      documents: [{ id: "1", language: "en", text: truncatedText }],
    },
  };

  try {
    const res = await fetch(`${ENDPOINT}/language/:analyze-text?api-version=${API_VERSION}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      console.error(`[Azure Language] NER returned HTTP ${res.status}: ${errorBody}`);
      return { available: false, entities: [], analyzedAt, error: `Azure Language HTTP ${res.status}` };
    }

    const result = (await res.json()) as {
      results?: {
        documents?: Array<{
          entities?: Array<{
            text: string;
            category: string;
            subcategory?: string;
            confidenceScore: number;
          }>;
        }>;
      };
    };

    const rawEntities = result.results?.documents?.[0]?.entities ?? [];

    const entities: RecognizedEntity[] = rawEntities
      .filter((e) => e.confidenceScore >= 0.7)
      .map((e) => ({
        text: e.text,
        category: e.category,
        subcategory: e.subcategory,
        confidenceScore: e.confidenceScore,
      }));

    const uniqueEntities = Array.from(
      new Map(entities.map((e) => [e.text.toLowerCase(), e])).values()
    ).slice(0, 15);

    return { available: true, entities: uniqueEntities, analyzedAt };
  } catch (err) {
    console.error("[Azure Language] Network error calling Azure AI Language:", err);
    return {
      available: false,
      entities: [],
      analyzedAt,
      error: `Network error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export function buildEntityContext(result: LanguageResult): string {
  if (!result.available || result.entities.length === 0) return "";
  const entityList = result.entities
    .map((e) => `  - ${e.text} [${e.category}${e.subcategory ? `/${e.subcategory}` : ""}] (confidence: ${e.confidenceScore.toFixed(2)})`)
    .join("\n");
  return `\n\n--- DETECTED SCIENTIFIC ENTITIES (Azure AI Language) ---\n${entityList}\n--- END ENTITIES ---\n\nUse these recognized entities to provide more precise analysis.`;
}

export { SCIENTIFIC_CATEGORIES };
