const ENDPOINT = process.env.AZURE_CONTENT_SAFETY_ENDPOINT?.replace(/\/$/, "") ?? "";
const KEY = process.env.AZURE_CONTENT_SAFETY_KEY ?? "";
const API_VERSION = "2024-09-01";

export interface ContentSafetyCategory {
  category: "Hate" | "SelfHarm" | "Sexual" | "Violence";
  severity: number;
}

export type SafetyStatus = "passed" | "flagged" | "blocked" | "unavailable";

export interface ContentSafetyResult {
  status: SafetyStatus;
  categories: ContentSafetyCategory[];
  blockedCategories: string[];
  flaggedCategories: string[];
  available: boolean;
  checkedAt: string;
}

const BLOCK_THRESHOLD = 4;
const FLAG_THRESHOLD = 2;

export function isContentSafetyAvailable(): boolean {
  return Boolean(ENDPOINT && KEY);
}

export async function analyzeTextSafety(text: string): Promise<ContentSafetyResult> {
  const checkedAt = new Date().toISOString();

  if (!isContentSafetyAvailable()) {
    console.error(
      "[Azure Content Safety] AZURE_CONTENT_SAFETY_ENDPOINT and AZURE_CONTENT_SAFETY_KEY are not configured. " +
      "Add these secrets to enable real safety analysis. All responses will be marked as unscreened."
    );
    return {
      status: "unavailable",
      categories: [],
      blockedCategories: [],
      flaggedCategories: [],
      available: false,
      checkedAt,
    };
  }

  const truncatedText = text.slice(0, 10000);
  let raw: Response;
  try {
    raw = await fetch(
      `${ENDPOINT}/contentsafety/text:analyze?api-version=${API_VERSION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": KEY,
        },
        body: JSON.stringify({
          text: truncatedText,
          categories: ["Hate", "SelfHarm", "Sexual", "Violence"],
          outputType: "FourSeverityLevels",
        }),
        signal: AbortSignal.timeout(8000),
      }
    );
  } catch (err) {
    console.error("[Azure Content Safety] Network error calling Azure Content Safety:", err);
    return {
      status: "unavailable",
      categories: [],
      blockedCategories: [],
      flaggedCategories: [],
      available: false,
      checkedAt,
    };
  }

  if (!raw.ok) {
    const errorBody = await raw.text().catch(() => "");
    console.error(`[Azure Content Safety] Azure Content Safety returned HTTP ${raw.status}: ${errorBody}`);
    return {
      status: "unavailable",
      categories: [],
      blockedCategories: [],
      flaggedCategories: [],
      available: false,
      checkedAt,
    };
  }

  let body: { categoriesAnalysis?: Array<{ category: string; severity: number }> };
  try {
    body = (await raw.json()) as typeof body;
  } catch (err) {
    console.error("[Azure Content Safety] Failed to parse Azure Content Safety response:", err);
    return {
      status: "unavailable",
      categories: [],
      blockedCategories: [],
      flaggedCategories: [],
      available: false,
      checkedAt,
    };
  }

  const categories: ContentSafetyCategory[] = (body.categoriesAnalysis ?? []).map((c) => ({
    category: c.category as ContentSafetyCategory["category"],
    severity: c.severity,
  }));

  const blockedCategories = categories.filter((c) => c.severity >= BLOCK_THRESHOLD).map((c) => c.category);
  const flaggedCategories = categories.filter((c) => c.severity >= FLAG_THRESHOLD && c.severity < BLOCK_THRESHOLD).map((c) => c.category);

  let status: SafetyStatus;
  if (blockedCategories.length > 0) status = "blocked";
  else if (flaggedCategories.length > 0) status = "flagged";
  else status = "passed";

  return { status, categories, blockedCategories, flaggedCategories, available: true, checkedAt };
}

export function buildBlockedMessage(result: ContentSafetyResult): string {
  return `⚠️ **Content Safety Alert** (Azure AI Content Safety)

This response was blocked because it contained content flagged in: **${result.blockedCategories.join(", ")}**.

PhiSphere AI enforces strict safety guidelines to prevent harmful scientific information from being shared. Please rephrase your question to focus on safe, legal experimental methods.`;
}
