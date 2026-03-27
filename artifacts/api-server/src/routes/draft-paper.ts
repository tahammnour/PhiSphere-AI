import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, labSessions, conversations, messages } from "@workspace/db";
import type { CsvDataType, ImageDataType, PdfDataType } from "@workspace/db";
import { openai, AZURE_OPENAI_DEPLOYMENT } from "@workspace/integrations-openai-ai-server";
import { trackEvent, trackException } from "../lib/azure-app-insights";

const router: IRouter = Router();

export interface PaperOutline {
  introduction: string;
  methods: string;
  results: string;
  discussion: string;
  conclusion: string;
}

export interface PaperDraft {
  abstract: string;
  materialsAndMethods: string;
  outline: PaperOutline;
  sessionName: string;
  domain: string;
  generatedAt: string;
}

function buildDataSummary(expData: CsvDataType | ImageDataType | PdfDataType | null | undefined): string {
  if (!expData) return "";

  if (expData.type === "csv") {
    const statLines = Object.entries(expData.stats ?? {})
      .slice(0, 10)
      .map(([col, s]) => `    - ${col}: min=${s.min.toFixed(3)}, max=${s.max.toFixed(3)}, mean=${s.mean.toFixed(3)}`)
      .join("\n");
    return [
      `\n### Uploaded Dataset: ${expData.filename}`,
      `- Total rows: ${expData.rowCount}`,
      `- Columns: ${expData.columns.join(", ")}`,
      `- Numeric statistics:\n${statLines || "    (no numeric columns)"}`,
    ].join("\n");
  }

  if (expData.type === "image") {
    let ctx = `\n### Uploaded Image: ${expData.filename}`;
    if (expData.visionAnalysis?.available) {
      if (expData.visionAnalysis.caption) {
        ctx += `\n- AI Caption: ${expData.visionAnalysis.caption}`;
      }
      if (expData.visionAnalysis.ocrText) {
        ctx += `\n- OCR text: ${expData.visionAnalysis.ocrText.slice(0, 400)}`;
      }
    }
    return ctx;
  }

  if (expData.type === "pdf") {
    let ctx = `\n### Uploaded PDF Protocol: ${expData.filename} (${expData.pageCount} pages)`;
    if (expData.preview && expData.preview.length > 0) {
      ctx += `\n- Protocol excerpt:\n${expData.preview.slice(0, 4).join("\n---\n").slice(0, 1000)}`;
    }
    return ctx;
  }

  return "";
}

function condenseHistory(msgs: Array<{ role: string; content: string }>): string {
  if (msgs.length === 0) return "";
  const relevant = msgs
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-20);
  const lines = relevant.map((m) => {
    const prefix = m.role === "user" ? "Researcher" : "AI Assistant";
    const content = typeof m.content === "string" ? m.content.slice(0, 600) : "";
    return `**${prefix}:** ${content}`;
  });
  return lines.join("\n\n");
}

function buildDraftPrompt(session: {
  name: string;
  domain: string;
  description?: string | null;
  experimentData: unknown;
}, chatHistory: string): string {
  const expData = session.experimentData as CsvDataType | ImageDataType | PdfDataType | null | undefined;
  const dataSummary = buildDataSummary(expData);

  return `You are an expert scientific writer helping a researcher draft a publication-quality research paper.

## Session Information
- **Title**: ${session.name}
- **Scientific Domain**: ${session.domain}
${session.description ? `- **Description/Protocol**: ${session.description}` : ""}
${dataSummary}

## Chat History (Research Dialogue)
${chatHistory || "(No chat history available yet — base the draft on session context and data.)"}

---

Generate a comprehensive research paper draft as a JSON object with exactly these fields:

{
  "abstract": "A concise 150-250 word abstract covering Background, Objective, Methods (briefly), Key Results, and Conclusion. Write in past tense, third person.",
  "materialsAndMethods": "A complete, publication-ready Materials and Methods section. Include: (1) experimental setup and equipment, (2) reagents/materials/datasets with specifications, (3) step-by-step procedures extracted from the protocol, (4) data collection approach, (5) statistical/analytical methods used. Write in past tense, passive voice where appropriate. Be specific — cite column names, sample sizes, instrument settings where known.",
  "outline": {
    "introduction": "Full draft Introduction section: background context, gap in knowledge, study objective/hypothesis. 2-3 paragraphs.",
    "methods": "Condensed methods summary for the outline (not the full M&M — that is above). 1 paragraph.",
    "results": "Draft Results section framework: describe what results were/would be obtained from the uploaded data, referencing specific variables and expected patterns. Use placeholder values where actual analysis is not yet complete. 2-3 paragraphs.",
    "discussion": "Draft Discussion section: interpret results in context of existing knowledge, discuss limitations, alternative explanations. 2-3 paragraphs.",
    "conclusion": "Draft Conclusion: restate key findings, significance, future directions. 1 paragraph."
  }
}

Strict rules:
- All sections must be substantive, publication-quality prose — not bullet points or placeholders
- Write in academic scientific style appropriate for the ${session.domain} field
- Do not fabricate specific numeric values not present in the data — use descriptive language for unknown results
- Do NOT use markdown fences or explanations outside the JSON
- Respond ONLY with valid JSON`;
}

router.post("/lab-sessions/:id/draft-paper", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const [session] = await db
    .select()
    .from(labSessions)
    .where(eq(labSessions.id, id));

  if (!session) {
    res.status(404).json({ error: "Lab session not found" });
    return;
  }

  const convs = await db
    .select()
    .from(conversations)
    .where(eq(conversations.sessionId, id));

  let chatHistory = "";
  if (convs.length > 0) {
    const convIds = convs.map((c) => c.id);
    const msgs = await db
      .select()
      .from(messages)
      .where(inArray(messages.conversationId, convIds))
      .orderBy(messages.createdAt);

    const typedMsgs = msgs.map((m) => ({ role: m.role, content: typeof m.content === "string" ? m.content : "" }));
    chatHistory = condenseHistory(typedMsgs);
  }

  const prompt = buildDraftPrompt(session, chatHistory);

  try {
    const completion = await openai.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
      response_format: { type: "json_object" },
      max_completion_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let parsed: Partial<PaperDraft & { outline: Partial<PaperOutline> }>;
    try {
      parsed = JSON.parse(raw) as Partial<PaperDraft & { outline: Partial<PaperOutline> }>;
    } catch {
      res.status(500).json({ error: "AI returned invalid JSON. Please try again." });
      return;
    }

    const result: PaperDraft = {
      abstract: typeof parsed.abstract === "string" ? parsed.abstract : "",
      materialsAndMethods: typeof parsed.materialsAndMethods === "string" ? parsed.materialsAndMethods : "",
      outline: {
        introduction: typeof parsed.outline?.introduction === "string" ? parsed.outline.introduction : "",
        methods: typeof parsed.outline?.methods === "string" ? parsed.outline.methods : "",
        results: typeof parsed.outline?.results === "string" ? parsed.outline.results : "",
        discussion: typeof parsed.outline?.discussion === "string" ? parsed.outline.discussion : "",
        conclusion: typeof parsed.outline?.conclusion === "string" ? parsed.outline.conclusion : "",
      },
      sessionName: session.name,
      domain: session.domain,
      generatedAt: new Date().toISOString(),
    };

    trackEvent("PaperDraftGenerated", {
      sessionId: String(session.id),
      domain: session.domain,
      hasData: String(!!session.experimentData),
      historyLength: String(chatHistory.length),
    });

    res.json(result);
  } catch (err) {
    trackException(err instanceof Error ? err : new Error(String(err)));
    res.status(500).json({ error: "AI paper draft generation failed. Please try again." });
  }
});

export default router;
