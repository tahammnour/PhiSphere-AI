import { AzureOpenAI } from "openai";

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT ?? "";
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY ?? "";
export const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME ?? "gpt-4o";
const AZURE_OPENAI_API_VERSION = "2024-10-21";

if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
  console.warn(
    "[Azure OpenAI] AZURE_OPENAI_ENDPOINT and/or AZURE_OPENAI_API_KEY are not configured. " +
    "AI chat will be unavailable until these secrets are set. Required secrets:\n" +
    "  AZURE_OPENAI_ENDPOINT        — e.g. https://your-resource.openai.azure.com\n" +
    "  AZURE_OPENAI_API_KEY         — from Azure Portal → Your Resource → Keys and Endpoints\n" +
    "  AZURE_OPENAI_DEPLOYMENT_NAME — your gpt-4o deployment name (defaults to 'gpt-4o')"
  );
}

export const openai = new AzureOpenAI({
  endpoint: AZURE_OPENAI_ENDPOINT || "https://placeholder.openai.azure.com",
  apiKey: AZURE_OPENAI_API_KEY || "placeholder-key",
  apiVersion: AZURE_OPENAI_API_VERSION,
  deployment: AZURE_OPENAI_DEPLOYMENT,
});
