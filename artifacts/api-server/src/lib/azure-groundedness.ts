import { openai, AZURE_OPENAI_DEPLOYMENT } from "@workspace/integrations-openai-ai-server";
import type { SearchResult } from "./azure-search";

export interface GroundednessResult {
  score: number;
  justification: string;
  evaluatedAt: string;
  hasRagContext: boolean;
}

const GROUNDEDNESS_SYSTEM_PROMPT_WITH_RAG = `You are a Responsible AI evaluator specializing in scientific document grounding assessment. Your task is to evaluate whether an AI assistant's response is factually supported by the provided source documents (retrieved context).

Evaluate the response strictly using the provided source text. Do not use outside knowledge.

Respond with a single JSON object (no markdown, no extra text):
{
  "score": <number between 0.0 and 1.0>,
  "justification": "<one concise sentence explaining the score>"
}

Scoring guide:
- 1.0: Every claim in the response is directly supported by the source text
- 0.8–0.9: Most claims are supported; minor details may be inferred but not fabricated
- 0.5–0.7: Some claims are supported; others extend beyond the source without fabrication
- 0.2–0.4: Few claims trace to the source; significant content is unsupported
- 0.0–0.1: Response contradicts or ignores the source text entirely`;

const GROUNDEDNESS_SYSTEM_PROMPT_NO_RAG = `You are a Responsible AI evaluator assessing the factual quality and coherence of an AI assistant's scientific response. No retrieved documents are available, so evaluate based on general scientific rigor.

Respond with a single JSON object (no markdown, no extra text):
{
  "score": <number between 0.0 and 1.0>,
  "justification": "<one concise sentence explaining the score>"
}

Scoring guide for non-RAG responses (capped at 0.75 as there is no document retrieval verification):
- 0.65–0.75: Response is scientifically coherent, hedges appropriately, and avoids speculation
- 0.45–0.64: Response is mostly coherent with minor unsupported leaps
- 0.25–0.44: Response contains noticeable unsupported assertions
- 0.0–0.24: Response contains misleading, incoherent, or fabricated content

The maximum possible score without RAG retrieval context is 0.75 to indicate that factual grounding cannot be verified from documents.`;

export async function evaluateGroundedness(
  assistantResponse: string,
  ragChunks: SearchResult[],
  query: string
): Promise<GroundednessResult | null> {
  const evaluatedAt = new Date().toISOString();
  const hasRagContext = ragChunks.length > 0;

  let userPrompt: string;
  let systemPrompt: string;

  if (hasRagContext) {
    systemPrompt = GROUNDEDNESS_SYSTEM_PROMPT_WITH_RAG;
    const sourceText = ragChunks
      .map((r, i) => `[Source ${i + 1}] ${r.sourceFile} (p.${r.pageNumber}):\n${r.content}`)
      .join("\n\n");
    const truncatedSource = sourceText.slice(0, 4000);
    const truncatedResponse = assistantResponse.slice(0, 3000);

    userPrompt = `QUERY: "${query}"

RETRIEVED SOURCE DOCUMENTS:
${truncatedSource}

AI ASSISTANT RESPONSE (to evaluate):
${truncatedResponse}

Evaluate how well the response is grounded in the source documents.`;
  } else {
    systemPrompt = GROUNDEDNESS_SYSTEM_PROMPT_NO_RAG;
    const truncatedResponse = assistantResponse.slice(0, 3000);

    userPrompt = `QUERY: "${query}"

AI ASSISTANT RESPONSE (to evaluate for scientific coherence and factual quality — no retrieved documents available):
${truncatedResponse}

Evaluate the scientific coherence and factual quality of this response.`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
      max_completion_tokens: 200,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("[Groundedness] Evaluator returned non-JSON:", raw.slice(0, 100));
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as { score?: unknown; justification?: unknown };
    let score = typeof parsed.score === "number" ? Math.max(0, Math.min(1, parsed.score)) : null;
    const justification = typeof parsed.justification === "string" ? parsed.justification : "Evaluation completed.";

    if (score === null) return null;

    if (!hasRagContext) {
      score = Math.min(score, 0.75);
    }

    return { score, justification, evaluatedAt, hasRagContext };
  } catch (err) {
    console.warn("[Groundedness] Evaluation failed (non-blocking):", err instanceof Error ? err.message : String(err));
    return null;
  }
}
