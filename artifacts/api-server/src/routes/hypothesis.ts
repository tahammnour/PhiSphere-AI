import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, labSessions } from "@workspace/db";
import type { CsvDataType, ImageDataType, PdfDataType } from "@workspace/db";
import { openai, AZURE_OPENAI_DEPLOYMENT } from "@workspace/integrations-openai-ai-server";
import { trackEvent, trackException } from "../lib/azure-app-insights";

const router: IRouter = Router();

type ConfidenceLevel = "high" | "medium" | "low";

interface Hypothesis {
  text: string;
  confidence: ConfidenceLevel;
  reasoning: string;
}

interface NextExperiment {
  title: string;
  rationale: string;
  parameters: string;
}

export interface AnalysisResult {
  findings: string[];
  hypotheses: Hypothesis[];
  nextExperiments: NextExperiment[];
  domain: string;
  generatedAt: string;
}

const DOMAIN_CONTEXT: Record<string, string> = {
  biology: "biological systems — cellular mechanisms, molecular pathways, organismal physiology, genetics, ecology, and experimental biology",
  chemistry: "chemical systems — reaction kinetics, thermodynamics, analytical chemistry, organic/inorganic synthesis, and spectroscopic analysis",
  physics: "physical systems — mechanics, electrodynamics, thermodynamics, quantum phenomena, optics, and experimental physics",
  environmental: "environmental science — ecosystem dynamics, climate variables, pollution monitoring, biodiversity metrics, and geochemical cycles",
  neuroscience: "neuroscience — neural circuit function, electrophysiology, cognitive measurements, brain imaging, and behavioral correlates",
  "materials science": "materials science — crystal structures, mechanical properties, surface chemistry, thin-film deposition, and characterization techniques",
  general: "scientific research — data-driven analysis, statistical patterns, experimental controls, and reproducible methodology",
};

function buildDataContext(expData: CsvDataType | ImageDataType | PdfDataType | null | undefined): string {
  if (!expData) return "";

  if (expData.type === "csv") {
    const statLines = Object.entries(expData.stats ?? {})
      .slice(0, 8)
      .map(([col, s]) => `  ${col}: min=${s.min.toFixed(3)}, max=${s.max.toFixed(3)}, mean=${s.mean.toFixed(3)}`)
      .join("\n");
    const previewLines = (expData.preview ?? [])
      .slice(0, 6)
      .map((row) => "  " + Object.entries(row).map(([k, v]) => `${k}=${v}`).join(", "))
      .join("\n");
    return [
      `\nDataset: ${expData.filename}`,
      `Columns: ${expData.columns.join(", ")}`,
      `Total rows: ${expData.rowCount}`,
      `Numeric statistics:`,
      statLines || "  (no numeric columns)",
      `Sample rows:`,
      previewLines || "  (no preview available)",
    ].join("\n");
  }

  if (expData.type === "image") {
    let ctx = `\nUploaded image: ${expData.filename}`;
    if (expData.visionAnalysis?.available) {
      if (expData.visionAnalysis.caption) {
        ctx += `\nAI Caption: ${expData.visionAnalysis.caption} (confidence: ${((expData.visionAnalysis.captionConfidence ?? 0) * 100).toFixed(0)}%)`;
      }
      if (expData.visionAnalysis.ocrText) {
        ctx += `\nOCR text detected: ${expData.visionAnalysis.ocrText.slice(0, 500)}`;
      }
      if (expData.visionAnalysis.objects && expData.visionAnalysis.objects.length > 0) {
        ctx += `\nDetected objects: ${expData.visionAnalysis.objects.map((o) => `${o.name} (${(o.confidence * 100).toFixed(0)}%)`).join(", ")}`;
      }
    }
    return ctx;
  }

  if (expData.type === "pdf") {
    let ctx = `\nUploaded PDF protocol: ${expData.filename} (${expData.pageCount} pages, ${expData.chunkCount} chunks indexed)`;
    if (expData.preview && expData.preview.length > 0) {
      ctx += `\nProtocol excerpt:\n${expData.preview.slice(0, 3).join("\n").slice(0, 800)}`;
    }
    return ctx;
  }

  return "";
}

function buildHypothesisPrompt(session: {
  domain: string;
  description?: string | null;
  name: string;
  experimentData: unknown;
}): string {
  const domain = session.domain.toLowerCase();
  const domainCtx = DOMAIN_CONTEXT[domain] ?? DOMAIN_CONTEXT.general;
  const expData = session.experimentData as CsvDataType | ImageDataType | PdfDataType | null | undefined;
  const dataContext = buildDataContext(expData);

  return `You are an expert scientific analyst specializing in ${domainCtx}.

Analyze the following experimental session and generate a structured scientific analysis.

Session name: "${session.name}"
Domain: ${session.domain}${session.description ? `\nDescription: ${session.description}` : ""}${dataContext ? `\n\nExperimental data:${dataContext}` : "\n\nNote: No data file has been uploaded yet — base your analysis on the session name, description, and domain."}

Generate a comprehensive scientific analysis as a JSON object with exactly these fields:

{
  "findings": [
    "Specific finding 1 citing exact column names and numeric values from the data",
    "Specific finding 2...",
    "3 to 5 total findings"
  ],
  "hypotheses": [
    {
      "text": "Clear, testable hypothesis in H1 form (e.g. 'Increasing X will cause Y because Z')",
      "confidence": "high",
      "reasoning": "Because the data shows [specific observation with values], we hypothesize [mechanism/relationship], which predicts [measurable outcome]"
    }
  ],
  "nextExperiments": [
    {
      "title": "Descriptive experiment name",
      "rationale": "Why this experiment would directly test the hypothesis or extend findings",
      "parameters": "Key independent variables, controls, sample sizes, and measurement approaches to use"
    }
  ]
}

Strict rules:
- findings: 3–5 items; cite exact column names and numeric values where data is available; be specific, not generic
- hypotheses: 2–4 items; confidence must be exactly "high", "medium", or "low" based on data support; reasoning must follow the "because X, we hypothesize Y, predicting Z" structure
- nextExperiments: 2–3 items; each must be concrete and feasible for the stated domain
- Do NOT fabricate data values that are not in the provided statistics
- Respond ONLY with valid JSON — no markdown code fences, no explanation outside the JSON`;
}

router.post("/lab-sessions/:id/analyze", async (req, res): Promise<void> => {
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

  const prompt = buildHypothesisPrompt(session);

  try {
    const completion = await openai.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
      response_format: { type: "json_object" },
      max_completion_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let parsed: Partial<AnalysisResult>;
    try {
      parsed = JSON.parse(raw) as Partial<AnalysisResult>;
    } catch {
      res.status(500).json({ error: "AI returned invalid JSON. Please try again." });
      return;
    }

    const result: AnalysisResult = {
      findings: Array.isArray(parsed.findings) ? parsed.findings.slice(0, 5).filter((f): f is string => typeof f === "string") : [],
      hypotheses: Array.isArray(parsed.hypotheses)
        ? parsed.hypotheses
            .slice(0, 4)
            .filter((h): h is Hypothesis => h && typeof h === "object" && typeof h.text === "string")
            .map((h) => ({
              text: h.text,
              confidence: (["high", "medium", "low"].includes(h.confidence) ? h.confidence : "medium") as ConfidenceLevel,
              reasoning: typeof h.reasoning === "string" ? h.reasoning : "",
            }))
        : [],
      nextExperiments: Array.isArray(parsed.nextExperiments)
        ? parsed.nextExperiments
            .slice(0, 3)
            .filter((e): e is NextExperiment => e && typeof e === "object" && typeof e.title === "string")
            .map((e) => ({
              title: typeof e.title === "string" ? e.title : "",
              rationale: typeof e.rationale === "string" ? e.rationale : "",
              parameters: typeof e.parameters === "string" ? e.parameters : "",
            }))
        : [],
      domain: session.domain,
      generatedAt: new Date().toISOString(),
    };

    trackEvent("HypothesisGenerated", {
      sessionId: String(session.id),
      domain: session.domain,
      findingCount: String(result.findings.length),
      hypothesisCount: String(result.hypotheses.length),
      experimentCount: String(result.nextExperiments.length),
      hasData: String(!!session.experimentData),
    });

    res.json(result);
  } catch (err) {
    trackException(err instanceof Error ? err : new Error(String(err)));
    res.status(500).json({ error: "AI analysis failed. Please try again." });
  }
});

export default router;
