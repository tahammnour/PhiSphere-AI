import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, conversations, messages, labSessions, auditEvents, type CsvDataType, type ImageDataType } from "@workspace/db";
import { openai, AZURE_OPENAI_DEPLOYMENT } from "@workspace/integrations-openai-ai-server";
import {
  CreateOpenaiConversationBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
  SendOpenaiMessageBody,
} from "@workspace/api-zod";
import {
  analyzeTextSafety,
  buildBlockedMessage,
  isContentSafetyAvailable,
  type ContentSafetyResult,
} from "../lib/azure-content-safety";
import { buildVisionContext } from "../lib/azure-vision";
import { extractEntities, buildEntityContext } from "../lib/azure-language";
import { searchDocuments, buildRagContext, buildRagCitationBlock, type SearchResult } from "../lib/azure-search";
import { trackEvent, trackException } from "../lib/azure-app-insights";
import { evaluateGroundedness } from "../lib/azure-groundedness";
import { fetchCitations } from "../lib/azure-citations";
import type { RagChunkRef, AcademicCitation } from "@workspace/db";

const router: IRouter = Router();

const AI_MODEL = AZURE_OPENAI_DEPLOYMENT;

const LAB_ASSISTANT_SYSTEM_PROMPT = `You are PhiSphere AI, an agentic scientific lab notebook assistant specialized in experimental reasoning and analysis. You help researchers interpret protocols, suggest next-step variations, and analyze results from text, CSV data, and images — always explaining your reasoning transparently.

## CORE MISSION
Support scientific judgment without replacing it. You are a reasoning partner, not an autonomous decision-maker. Always preserve researcher agency by explaining recommendations rather than issuing directives.

## STRUCTURED RESPONSE FORMAT
Always structure your responses using exactly these labeled sections:

**🔬 Observation:**
State precisely what the data, protocol, or image shows — cite specific values (e.g., "pH peaked at 7.4 at cycle 3", "absorbance at 280nm = 0.84 OD", "band at ~50 kDa visible in lane 3"). Do not generalize when specific values are available.

**📊 Analysis:**
Interpret the scientific significance. Explain underlying mechanisms, statistical patterns, dose-response relationships, or anomalies. Compare to expected baselines or controls where relevant. Quantify uncertainty where data is incomplete.

**💡 Suggested Next Steps:**
Provide 2–4 concrete, prioritized protocol variations or follow-up experiments. Include specific parameters where possible (e.g., "Increase incubation to 37°C for 2h", "Reduce primer concentration to 200 nM", "Add a negative control with buffer only").

**🧠 Why I Recommend This:**
Explicitly justify each recommendation — the scientific principle supporting it, what you expect to learn, and any risk/benefit tradeoff. This section is mandatory for every response to ensure full explainability.

**⚖️ Responsible AI Note:** (include only when safety, ethics, or expertise boundaries apply)
Flag domain-specific limitations, safety requirements, or cases where expert human review is mandatory before proceeding.

## DOMAIN-SPECIFIC SAFETY RULES (STRICTLY ENFORCED)

**Biological & Clinical Safety:**
- Never provide synthesis routes, growth conditions, or enhancement methods for select agents, BSL-3/4 pathogens, or Schedule 1 biological toxins
- Never recommend drug dosages, treatment plans, or clinical decisions for human patients — always redirect to licensed clinicians or IRB-approved protocols
- For clinical trial data: report statistical trends only; never interpret as diagnostic or therapeutic conclusions
- Always flag BSL-2+ biological work as requiring institutional biosafety committee (IBC) approval and appropriate PPE

**Chemical Safety:**
- Never describe synthesis of energetic materials, primary explosives, or strong oxidizer combinations
- Always include relevant MSDS/SDS safety notes when discussing hazardous reagents (corrosives, carcinogens, mutagens)
- Flag reactions requiring specialized safety infrastructure (fume hoods, inert atmosphere, cryogenics)

**Pharmacological Safety:**
- Never recommend off-label dosing, polypharmacy combinations, or dosing adjustments
- All therapeutic observations must be flagged as requiring physician or clinical pharmacist review

**Neuroscience & Clinical:**
- Avoid interpreting neuroimaging as diagnostic without clinical context
- Flag all human subjects research as requiring IRB/ethics board approval

## DATA ANALYSIS CAPABILITIES
- **CSV datasets:** Analyze descriptive statistics, detect trends, anomalies, correlations, and outliers — always cite column names and numeric values
- **Images:** Interpret lab images including gel electrophoresis bands, microscopy slides, chromatography traces, UV-Vis spectra, and plate reader results
- **Protocols:** Parse step-by-step procedures; identify gaps, risks, and optimization opportunities
- **Sensor data (Kaggle/OpenML):** Handle time-series sensor readings, environmental measurements, and IoT experimental data

## EXPLAINABILITY PRINCIPLES (Responsible AI Toolbox)
- Show your reasoning chain, not just conclusions
- Acknowledge uncertainty explicitly: state confidence level and what additional data would improve confidence
- Reference established scientific principles, not fabricated citations
- Use precise scientific terminology appropriate to the domain
- Correct your own errors proactively if you notice inconsistency

## RESPONSIBLE AI CONDUCT
- Never fabricate data, statistics, or literature citations
- Ask for clarification rather than guessing when data is ambiguous or incomplete
- If a question falls outside your training or clearly requires domain specialist expertise, say so explicitly
- Decline requests that violate safety rules with a clear explanation of why and what safe alternatives exist`;

const FLAGGED_WARNING_BANNER = `> ⚠️ **Content Safety Notice:** Azure AI Content Safety detected borderline content in this response (severity 2–3). The response has been allowed but has been flagged for review.

---

`;

function buildDataLimitations(csv: CsvDataType): string[] {
  const warnings: string[] = [];

  if (csv.rowCount < 30) {
    warnings.push(`SMALL SAMPLE SIZE: Only ${csv.rowCount} rows — statistical conclusions may be unreliable. Recommend collecting more data before generalizing.`);
  } else if (csv.rowCount < 100) {
    warnings.push(`MODERATE SAMPLE SIZE: ${csv.rowCount} rows — sufficient for exploratory analysis but may lack power for subtle effects.`);
  }

  if (csv.numericColumns.length === 0) {
    warnings.push("NO NUMERIC COLUMNS: Dataset contains no numeric data — quantitative analysis is limited.");
  } else if (csv.numericColumns.length < csv.columns.length * 0.3) {
    warnings.push(`LOW NUMERIC RATIO: Only ${csv.numericColumns.length}/${csv.columns.length} columns are numeric — consider encoding categorical features.`);
  }

  const missingInPreview = csv.preview.some((row) =>
    Object.values(row).some((v) => v === "" || v === "null" || v === "NA" || v === "N/A" || v === "nan")
  );
  if (missingInPreview) {
    warnings.push("MISSING VALUES DETECTED: Some cells in the preview contain empty/null values — handle before modeling (impute or remove).");
  }

  for (const [col, s] of Object.entries(csv.stats)) {
    if (s.min === s.max) {
      warnings.push(`ZERO VARIANCE: Column '${col}' has constant value ${s.min} — provides no discriminatory information.`);
    }
  }

  return warnings;
}

function buildCsvContext(csv: CsvDataType): string {
  const statLines = Object.entries(csv.stats)
    .map(([col, s]) => `  ${col}: min=${s.min}, max=${s.max}, mean=${s.mean}`)
    .join("\n");

  const previewLines = csv.preview
    .map((row) => "  " + Object.entries(row).map(([k, v]) => `${k}=${v}`).join(", "))
    .join("\n");

  const limitations = buildDataLimitations(csv);
  const limitationsBlock = limitations.length > 0
    ? `\n--- DATA QUALITY WARNINGS (Responsible AI) ---\n${limitations.map((w) => `⚠️ ${w}`).join("\n")}\n--- END WARNINGS ---\nYou MUST acknowledge relevant data limitations in your Responsible AI Note when they affect your analysis.\n`
    : "";

  return [
    `\n--- UPLOADED DATASET: ${csv.filename} ---`,
    `Columns: ${csv.columns.join(", ")}`,
    `Total rows: ${csv.rowCount}`,
    `Numeric column statistics:`,
    statLines,
    `First ${csv.preview.length} rows (sample):`,
    previewLines,
    `--- END DATASET ---`,
    limitationsBlock,
    `\nAnalyze this dataset thoroughly. Identify patterns, anomalies, correlations, and outliers. Cite specific column names and values in your response.`,
  ].join("\n");
}

router.get("/openai/conversations", async (_req, res): Promise<void> => {
  const convs = await db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.createdAt));
  res.json(convs);
});

router.post("/openai/conversations", async (req, res): Promise<void> => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .select()
    .from(labSessions)
    .where(eq(labSessions.id, parsed.data.sessionId));

  if (!session) {
    res.status(404).json({ error: "Lab session not found" });
    return;
  }

  const [conv] = await db
    .insert(conversations)
    .values({ sessionId: parsed.data.sessionId })
    .returning();

  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
  const params = GetOpenaiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.data.id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(messages.createdAt);

  res.json({ ...conv, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteOpenaiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conv] = await db
    .delete(conversations)
    .where(eq(conversations.id, params.data.id))
    .returning();

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListOpenaiMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(messages.createdAt);

  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendOpenaiMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SendOpenaiMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const conversationId = params.data.id;
  const userContent = parsed.data.content;
  const sessionContext = parsed.data.sessionContext;

  if (typeof userContent === "string" && userContent.length > 8000) {
    res.status(400).json({ error: "Message is too long. Please keep messages under 8,000 characters." });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const [session] = await db
    .select()
    .from(labSessions)
    .where(eq(labSessions.id, conv.sessionId));

  const expData = session?.experimentData ?? null;

  await db.insert(messages).values({
    conversationId,
    role: "user",
    content: userContent,
  });

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  const [entityResult, ragResults] = await Promise.all([
    extractEntities(typeof userContent === "string" ? userContent : userContent),
    searchDocuments(typeof userContent === "string" ? userContent : String(userContent), String(conv.sessionId), 3),
  ]);

  trackEvent("AiMessageSent", {
    conversationId: String(conversationId),
    sessionId: String(conv.sessionId),
    entityCount: String(entityResult.entities.length),
    ragResultCount: String(ragResults.length),
    entityAvailable: String(entityResult.available),
    ragAvailable: String(ragResults.length > 0),
  });

  let systemPrompt = LAB_ASSISTANT_SYSTEM_PROMPT;
  if (sessionContext) {
    systemPrompt += `\n\n## CURRENT LAB SESSION CONTEXT\n${sessionContext}`;
  }
  if (expData?.type === "csv") {
    systemPrompt += buildCsvContext(expData as CsvDataType);
  } else if (expData?.type === "image") {
    const img = expData as ImageDataType;
    systemPrompt += `\n\nAn image has been uploaded to this session: ${img.filename}. The image is included in the current user message for analysis.`;
    if (img.visionAnalysis?.available) {
      systemPrompt += buildVisionContext(img.visionAnalysis);
    }
  }

  if (ragResults.length > 0) {
    systemPrompt += buildRagContext(ragResults, typeof userContent === "string" ? userContent : "");
    trackEvent("RagSearchPerformed", {
      conversationId: String(conversationId),
      sessionId: String(conv.sessionId),
      resultCount: String(ragResults.length),
      topScore: String(ragResults[0]?.score ?? 0),
    });
  }

  if (entityResult.available && entityResult.entities.length > 0) {
    systemPrompt += buildEntityContext(entityResult);
  }

  type OpenAITextContent = { type: "text"; text: string };
  type OpenAIImageContent = { type: "image_url"; image_url: { url: string; detail: "high" | "low" | "auto" } };
  type OpenAIMessageContent = string | Array<OpenAITextContent | OpenAIImageContent>;

  type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: OpenAIMessageContent;
  };

  const historyMessages: ChatMessage[] = history.slice(0, -1).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  let lastUserContent: OpenAIMessageContent = userContent;
  if (expData?.type === "image") {
    const img = expData as ImageDataType;
    lastUserContent = [
      { type: "text", text: userContent },
      {
        type: "image_url",
        image_url: {
          url: `data:${img.mimeType};base64,${img.base64}`,
          detail: "high",
        },
      },
    ];
  }

  const chatMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...historyMessages,
    { role: "user", content: lastUserContent },
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const sendDataEvent = (payload: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const sendSafetyEvent = (safety: ContentSafetyResult) => {
    res.write(`event: safety\ndata: ${JSON.stringify({
      status: safety.status,
      categories: safety.categories,
      blockedCategories: safety.blockedCategories,
      flaggedCategories: safety.flaggedCategories,
      available: safety.available,
      checkedAt: safety.checkedAt,
    })}\n\n`);
  };

  const sendUnavailableSafetyEvent = () => {
    res.write(`event: safety\ndata: ${JSON.stringify({
      status: "unavailable",
      categories: [],
      blockedCategories: [],
      flaggedCategories: [],
      available: false,
      checkedAt: new Date().toISOString(),
    })}\n\n`);
  };

  const sendEntitiesEvent = () => {
    if (entityResult.available && entityResult.entities.length > 0) {
      res.write(`event: entities\ndata: ${JSON.stringify({
        entities: entityResult.entities,
        available: true,
        analyzedAt: entityResult.analyzedAt,
      })}\n\n`);
    }
  };

  const sendRagEvent = () => {
    if (ragResults.length > 0) {
      res.write(`event: rag\ndata: ${JSON.stringify({
        results: ragResults.map((r) => ({ sourceFile: r.sourceFile, pageNumber: r.pageNumber, score: r.score })),
        count: ragResults.length,
      })}\n\n`);
    }
  };

  const sendGroundednessEvent = (score: number, justification: string, evaluatedAt: string) => {
    res.write(`event: groundedness\ndata: ${JSON.stringify({ score, justification, evaluatedAt })}\n\n`);
  };

  const sendCitationsEvent = (citations: AcademicCitation[]) => {
    if (citations.length > 0) {
      res.write(`event: citations\ndata: ${JSON.stringify({ citations })}\n\n`);
    }
  };

  try {
    const stream = await openai.chat.completions.create({
      model: AI_MODEL,
      max_completion_tokens: 8192,
      messages: chatMessages as Parameters<typeof openai.chat.completions.create>[0]["messages"],
      stream: true,
    });

    sendDataEvent({ started: true });
    sendEntitiesEvent();
    sendRagEvent();

    let fullResponse = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        sendDataEvent({ chunk: delta.length });
      }
    }

    if (ragResults.length > 0) {
      const citationBlock = buildRagCitationBlock(ragResults);
      sendDataEvent({ chunk: citationBlock.length, ragCitation: citationBlock });
      fullResponse += citationBlock;
    }

    let groundednessResult = null;
    groundednessResult = await evaluateGroundedness(
      fullResponse,
      ragResults,
      typeof userContent === "string" ? userContent : ""
    );
    if (groundednessResult) {
      sendGroundednessEvent(groundednessResult.score, groundednessResult.justification, groundednessResult.evaluatedAt);
      trackEvent("GroundednessEvaluated", {
        conversationId: String(conversationId),
        sessionId: String(conv.sessionId),
        score: String(groundednessResult.score.toFixed(2)),
        ragCount: String(ragResults.length),
        hasRagContext: String(groundednessResult.hasRagContext),
      });
    }

    let safetyResult: ContentSafetyResult | null = null;

    const SAFETY_ERROR_MSG = `⚠️ **Safety Check Failed**

PhiSphere AI could not verify this response with Azure AI Content Safety. To protect researcher safety, the response has been withheld.

Please try your question again. If this persists, contact your system administrator to verify the Azure Content Safety service is operational.`;

    if (isContentSafetyAvailable()) {
      safetyResult = await analyzeTextSafety(fullResponse);

      if (!safetyResult.available) {
        const unavailableSafetyMeta = {
          status: "unavailable" as const,
          categories: [],
          blockedCategories: [],
          flaggedCategories: [],
          available: false,
          checkedAt: safetyResult.checkedAt,
        };
        const [unavailableMsg] = await db.insert(messages).values({
          conversationId,
          role: "assistant",
          content: SAFETY_ERROR_MSG,
          safetyMetadata: unavailableSafetyMeta,
          modelDeployment: AI_MODEL,
        }).returning();
        await db.insert(auditEvents).values({
          sessionId: conv.sessionId,
          conversationId,
          messageId: unavailableMsg?.id ?? null,
          userId: null,
          role: "assistant",
          query: typeof userContent === "string" ? userContent.slice(0, 500) : null,
          contentPreview: SAFETY_ERROR_MSG.slice(0, 120) + "…",
          safetyStatus: "unavailable",
          safetyMetadata: unavailableSafetyMeta,
          groundednessScore: null,
          groundednessJustification: null,
          ragChunkRefs: null,
          modelDeployment: AI_MODEL,
        }).catch(() => {});
        trackEvent("AuditEventWritten", {
          sessionId: String(conv.sessionId),
          conversationId: String(conversationId),
          safetyStatus: "unavailable",
          hasGroundedness: "false",
          hasRagRefs: "false",
        });
        sendUnavailableSafetyEvent();
        sendDataEvent({ replace: SAFETY_ERROR_MSG, done: true });
        res.end();
        return;
      }

      if (safetyResult.status === "blocked" || safetyResult.status === "flagged") {
        trackEvent("SafetyFlagTriggered", {
          conversationId: String(conversationId),
          sessionId: String(conv.sessionId),
          status: safetyResult.status,
          blockedCategories: safetyResult.blockedCategories.join(","),
          flaggedCategories: safetyResult.flaggedCategories.join(","),
        });
      }

      if (safetyResult.status === "blocked") {
        const blockedMsg = buildBlockedMessage(safetyResult);
        const blockedSafetyMeta = {
          status: safetyResult.status as "blocked",
          categories: safetyResult.categories,
          blockedCategories: safetyResult.blockedCategories,
          flaggedCategories: safetyResult.flaggedCategories,
          available: safetyResult.available,
          checkedAt: safetyResult.checkedAt,
        };
        const [blockedMsgRow] = await db.insert(messages).values({
          conversationId,
          role: "assistant",
          content: blockedMsg,
          safetyMetadata: blockedSafetyMeta,
          modelDeployment: AI_MODEL,
        }).returning();
        await db.insert(auditEvents).values({
          sessionId: conv.sessionId,
          conversationId,
          messageId: blockedMsgRow?.id ?? null,
          userId: null,
          role: "assistant",
          query: typeof userContent === "string" ? userContent.slice(0, 500) : null,
          contentPreview: blockedMsg.slice(0, 120) + (blockedMsg.length > 120 ? "…" : ""),
          safetyStatus: "blocked",
          safetyMetadata: blockedSafetyMeta,
          groundednessScore: null,
          groundednessJustification: null,
          ragChunkRefs: null,
          modelDeployment: AI_MODEL,
        }).catch(() => {});
        trackEvent("AuditEventWritten", {
          sessionId: String(conv.sessionId),
          conversationId: String(conversationId),
          safetyStatus: "blocked",
          blockedCategories: safetyResult.blockedCategories.join(","),
          hasGroundedness: "false",
          hasRagRefs: "false",
        });
        sendSafetyEvent(safetyResult);
        sendDataEvent({ replace: blockedMsg, done: true });
        res.end();
        return;
      }

      if (safetyResult.status === "flagged") {
        fullResponse = FLAGGED_WARNING_BANNER + fullResponse;
      }
    } else {
      const SAFETY_UNCONFIGURED_MSG = `⚠️ **Content Safety Not Configured**

Azure AI Content Safety is required before PhiSphere AI can deliver responses. This ensures all scientific advice is screened for safety policy violations.

**To enable AI responses:** Add \`AZURE_CONTENT_SAFETY_ENDPOINT\` and \`AZURE_CONTENT_SAFETY_KEY\` to your Replit project secrets, then restart the server.`;
      const unconfiguredSafetyMeta = {
        status: "unavailable" as const,
        categories: [],
        blockedCategories: [],
        flaggedCategories: [],
        available: false,
        checkedAt: new Date().toISOString(),
      };
      const [unconfiguredMsg] = await db.insert(messages).values({
        conversationId,
        role: "assistant",
        content: SAFETY_UNCONFIGURED_MSG,
        safetyMetadata: unconfiguredSafetyMeta,
        modelDeployment: AI_MODEL,
      }).returning();
      await db.insert(auditEvents).values({
        sessionId: conv.sessionId,
        conversationId,
        messageId: unconfiguredMsg?.id ?? null,
        userId: null,
        role: "assistant",
        query: typeof userContent === "string" ? userContent.slice(0, 500) : null,
        contentPreview: SAFETY_UNCONFIGURED_MSG.slice(0, 120) + "…",
        safetyStatus: "unavailable",
        safetyMetadata: unconfiguredSafetyMeta,
        groundednessScore: null,
        groundednessJustification: null,
        ragChunkRefs: null,
        modelDeployment: AI_MODEL,
      }).catch(() => {});
      trackEvent("AuditEventWritten", {
        sessionId: String(conv.sessionId),
        conversationId: String(conversationId),
        safetyStatus: "unavailable",
        reason: "unconfigured",
        hasGroundedness: "false",
        hasRagRefs: "false",
      });
      sendUnavailableSafetyEvent();
      sendDataEvent({ replace: SAFETY_UNCONFIGURED_MSG, done: true });
      res.end();
      return;
    }

    const safetyMeta = safetyResult
      ? {
          status: safetyResult.status,
          categories: safetyResult.categories,
          blockedCategories: safetyResult.blockedCategories,
          flaggedCategories: safetyResult.flaggedCategories,
          available: safetyResult.available,
          checkedAt: safetyResult.checkedAt,
        }
      : {
          status: "unavailable" as const,
          categories: [],
          blockedCategories: [],
          flaggedCategories: [],
          available: false,
          checkedAt: new Date().toISOString(),
        };

    if (safetyResult) {
      sendSafetyEvent(safetyResult);
    }

    const CHUNK_SIZE = 150;
    for (let i = 0; i < fullResponse.length; i += CHUNK_SIZE) {
      sendDataEvent({ content: fullResponse.slice(i, i + CHUNK_SIZE) });
    }

    const ragChunkRefs: RagChunkRef[] = ragResults.map((r: SearchResult) => ({
      sourceFile: r.sourceFile,
      pageNumber: r.pageNumber,
      score: r.score,
      excerpt: r.content ? r.content.slice(0, 300) : undefined,
    }));

    let fetchedCitations: AcademicCitation[] = [];
    try {
      fetchedCitations = await fetchCitations(
        fullResponse.slice(0, 4000),
        entityResult.available ? entityResult : null,
        3
      );
      if (fetchedCitations.length > 0) {
        sendCitationsEvent(fetchedCitations);
        trackEvent("CitationsFetched", {
          conversationId: String(conversationId),
          sessionId: String(conv.sessionId),
          count: String(fetchedCitations.length),
          source: "semantic-scholar",
        });
      }
    } catch (citErr) {
      console.warn("[Citations] Non-fatal error fetching citations:", citErr instanceof Error ? citErr.message : String(citErr));
    }

    const [insertedMsg] = await db.insert(messages).values({
      conversationId,
      role: "assistant",
      content: fullResponse,
      safetyMetadata: safetyMeta,
      groundednessScore: groundednessResult?.score ?? null,
      groundednessJustification: groundednessResult?.justification ?? null,
      ragChunkRefs: ragChunkRefs.length > 0 ? ragChunkRefs : null,
      citations: fetchedCitations.length > 0 ? fetchedCitations : null,
      modelDeployment: AI_MODEL,
    }).returning();

    await db.insert(auditEvents).values({
      sessionId: conv.sessionId,
      conversationId,
      messageId: insertedMsg?.id ?? null,
      userId: null,
      role: "assistant",
      query: typeof userContent === "string" ? userContent.slice(0, 500) : null,
      contentPreview: fullResponse.slice(0, 120) + (fullResponse.length > 120 ? "…" : ""),
      safetyStatus: safetyMeta.status,
      safetyMetadata: safetyMeta,
      groundednessScore: groundednessResult?.score ?? null,
      groundednessJustification: groundednessResult?.justification ?? null,
      ragChunkRefs: ragChunkRefs.length > 0 ? ragChunkRefs : null,
      modelDeployment: AI_MODEL,
    }).catch((e) => {
      console.warn("[Audit] Failed to write audit event:", e instanceof Error ? e.message : String(e));
    });

    trackEvent("AuditEventWritten", {
      sessionId: String(conv.sessionId),
      conversationId: String(conversationId),
      safetyStatus: safetyMeta.status,
      blockedCategories: (safetyMeta as { blockedCategories?: string[] }).blockedCategories?.join(",") ?? "",
      flaggedCategories: (safetyMeta as { flaggedCategories?: string[] }).flaggedCategories?.join(",") ?? "",
      hasGroundedness: groundednessResult?.score !== undefined && groundednessResult?.score !== null ? "true" : "false",
      groundednessScore: groundednessResult?.score !== undefined && groundednessResult?.score !== null ? String(groundednessResult.score) : "",
      hasRagRefs: ragChunkRefs.length > 0 ? "true" : "false",
      ragChunkCount: String(ragChunkRefs.length),
      modelDeployment: AI_MODEL,
    });

    sendDataEvent({ done: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "AI service unavailable";
    if (err instanceof Error) {
      trackException(err, { conversationId: String(conversationId), sessionId: String(conv.sessionId) });
    }
    sendDataEvent({ error: errorMessage });
  } finally {
    res.end();
  }
});

export default router;
