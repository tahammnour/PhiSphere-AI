import { Router, type IRouter } from "express";
import { isContentSafetyAvailable, analyzeTextSafety } from "../lib/azure-content-safety";
import { isVisionAvailable } from "../lib/azure-vision";
import { isDocumentIntelligenceAvailable } from "../lib/azure-document-intelligence";
import { isSearchAvailable } from "../lib/azure-search";
import { isLanguageAvailable } from "../lib/azure-language";
import { isAppInsightsAvailable, getAppInsightsState } from "../lib/azure-app-insights";

const router: IRouter = Router();

const VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT?.replace(/\/$/, "") ?? "";
const VISION_KEY = process.env.AZURE_VISION_KEY ?? "";
const VISION_API_VERSION = "2024-02-01";

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "") ?? "";
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_API_KEY ?? "";
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME ?? "gpt-4o";
const AZURE_OPENAI_API_VERSION = "2024-10-21";

const DOC_INTEL_ENDPOINT = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.replace(/\/$/, "") ?? "";
const DOC_INTEL_KEY = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY ?? "";

const SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT?.replace(/\/$/, "") ?? "";
const SEARCH_KEY = process.env.AZURE_SEARCH_KEY ?? "";
const SEARCH_INDEX = process.env.AZURE_SEARCH_INDEX_NAME ?? "phisphere-docs";

const LANGUAGE_ENDPOINT = process.env.AZURE_LANGUAGE_ENDPOINT?.replace(/\/$/, "") ?? "";
const LANGUAGE_KEY = process.env.AZURE_LANGUAGE_KEY ?? "";

function isAzureOpenAIConfigured(): boolean {
  return Boolean(AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_KEY);
}

async function pingVisionService(): Promise<boolean> {
  if (!isVisionAvailable()) return false;
  try {
    const TINY_PNG_BASE64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const buffer = Buffer.from(TINY_PNG_BASE64, "base64");
    const res = await fetch(
      `${VISION_ENDPOINT}/computervision/imageanalysis:analyze?features=caption&api-version=${VISION_API_VERSION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "image/png",
          "Ocp-Apim-Subscription-Key": VISION_KEY,
        },
        body: buffer,
        signal: AbortSignal.timeout(8000),
      }
    );
    return res.ok || res.status === 400;
  } catch {
    return false;
  }
}

async function pingAzureOpenAI(): Promise<boolean> {
  if (!isAzureOpenAIConfigured()) return false;
  try {
    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok || res.status === 400;
  } catch {
    return false;
  }
}

async function pingDocumentIntelligence(): Promise<boolean> {
  if (!isDocumentIntelligenceAvailable()) return false;
  try {
    const res = await fetch(
      `${DOC_INTEL_ENDPOINT}/documentintelligence/documentModels?api-version=2024-11-30`,
      {
        headers: { "Ocp-Apim-Subscription-Key": DOC_INTEL_KEY },
        signal: AbortSignal.timeout(8000),
      }
    );
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

async function pingSearch(): Promise<boolean> {
  if (!isSearchAvailable()) return false;
  try {
    const res = await fetch(
      `${SEARCH_ENDPOINT}/indexes?api-version=2024-07-01`,
      {
        headers: { "api-key": SEARCH_KEY },
        signal: AbortSignal.timeout(8000),
      }
    );
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

async function pingLanguage(): Promise<boolean> {
  if (!isLanguageAvailable()) return false;
  try {
    const res = await fetch(
      `${LANGUAGE_ENDPOINT}/language/:analyze-text?api-version=2023-04-01`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": LANGUAGE_KEY,
        },
        body: JSON.stringify({
          kind: "EntityRecognition",
          parameters: { modelVersion: "latest" },
          analysisInput: { documents: [{ id: "1", language: "en", text: "ping" }] },
        }),
        signal: AbortSignal.timeout(8000),
      }
    );
    return res.ok || res.status === 400;
  } catch {
    return false;
  }
}

router.get("/azure/status", async (_req, res): Promise<void> => {
  const contentSafetyConfigured = isContentSafetyAvailable();
  const visionConfigured = isVisionAvailable();
  const openaiConfigured = isAzureOpenAIConfigured();
  const docIntelConfigured = isDocumentIntelligenceAvailable();
  const searchConfigured = isSearchAvailable();
  const languageConfigured = isLanguageAvailable();
  const appInsightsConfigured = isAppInsightsAvailable();

  type ServiceHealth = "healthy" | "error" | "unconfigured";

  let contentSafetyHealth: ServiceHealth = "unconfigured";
  let visionHealth: ServiceHealth = "unconfigured";
  let openaiHealth: ServiceHealth = "unconfigured";
  let docIntelHealth: ServiceHealth = "unconfigured";
  let searchHealth: ServiceHealth = "unconfigured";
  let languageHealth: ServiceHealth = "unconfigured";

  const [csResult, visionPingOk, openaiPingOk, docIntelPingOk, searchPingOk, languagePingOk] =
    await Promise.all([
      contentSafetyConfigured ? analyzeTextSafety("health check") : Promise.resolve(null),
      visionConfigured ? pingVisionService() : Promise.resolve(false),
      openaiConfigured ? pingAzureOpenAI() : Promise.resolve(false),
      docIntelConfigured ? pingDocumentIntelligence() : Promise.resolve(false),
      searchConfigured ? pingSearch() : Promise.resolve(false),
      languageConfigured ? pingLanguage() : Promise.resolve(false),
    ]);

  if (contentSafetyConfigured) contentSafetyHealth = csResult?.available ? "healthy" : "error";
  if (visionConfigured) visionHealth = visionPingOk ? "healthy" : "error";
  if (openaiConfigured) openaiHealth = openaiPingOk ? "healthy" : "error";
  if (docIntelConfigured) docIntelHealth = docIntelPingOk ? "healthy" : "error";
  if (searchConfigured) searchHealth = searchPingOk ? "healthy" : "error";
  if (languageConfigured) languageHealth = languagePingOk ? "healthy" : "error";

  res.json({
    contentSafety: { configured: contentSafetyConfigured, health: contentSafetyHealth },
    vision: { configured: visionConfigured, health: visionHealth },
    openai: { configured: openaiConfigured, health: openaiHealth, deployment: AZURE_OPENAI_DEPLOYMENT },
    documentIntelligence: { configured: docIntelConfigured, health: docIntelHealth },
    search: {
      configured: searchConfigured,
      health: searchHealth,
      indexName: SEARCH_INDEX,
    },
    language: { configured: languageConfigured, health: languageHealth },
    appInsights: {
      configured: Boolean(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING),
      health: ((): ServiceHealth => {
        const state = getAppInsightsState();
        if (state === "ready") return "healthy";
        if (state === "initializing") return "unconfigured";
        if (state === "error") return "error";
        return "unconfigured";
      })(),
    },
    checkedAt: new Date().toISOString(),
  });
});

export default router;
