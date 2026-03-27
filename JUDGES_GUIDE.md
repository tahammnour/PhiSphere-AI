# PhiSphere AI - Judges Quick Guide

This guide is for fast evaluation during demo judging.

## 1) What this project is

PhiSphere AI is a lab notebook AI assistant for experimental reasoning.
It analyzes text, CSV, image, and PDF inputs, then returns structured,
explainable recommendations with strong safety controls.

## 2) Where to look first

- Product overview: `README.md`
- Frontend package: `artifacts/phisphere-ai/README.md`
- Backend package: `artifacts/api-server/README.md`
- API map: `artifacts/api-server/src/routes/README.md`
- Shared libraries: `lib/README.md`
- Notebooks (Azure ML + Responsible AI): `notebooks/README.md`
- Submission checklist: `HACKATHON_SUBMISSION_CHECKLIST.md`

## 3) Live demo path (3 minutes)

1. Open Control Panel and show Azure service status.
2. Create a lab session and select a protocol template.
3. Load sample CSV and show stats/chart preview.
4. Send a chat question and show structured response format.
5. Import OpenML dataset (for example ID 61).
6. Upload image and show Vision analysis.
7. Upload PDF and show RAG grounding citations.
8. Trigger a safety-boundary question and show safety behavior.
9. Open Audit Log and metrics panel.

## 4) Judging criteria mapping

- Performance: SSE streaming, rate limiting, health checks, metrics route.
- Innovation: OpenML import, multimodal analysis, protocol templates, hypothesis and paper draft.
- Azure breadth: 8 Azure services integrated.
- Responsible AI: safety buffer, policy boundaries, groundedness, audit trail, data quality warnings.

## 5) Evidence in code

- Main AI flow: `artifacts/api-server/src/routes/openai-conversations.ts`
- OpenML import: `artifacts/api-server/src/routes/openml.ts`
- Metrics: `artifacts/api-server/src/routes/metrics.ts`
- Azure health checks: `artifacts/api-server/src/routes/azure-status.ts`
- CSV quality warnings UI: `artifacts/phisphere-ai/src/components/chat/CsvPreviewCard.tsx`

## 6) Detailed demo video storyboard (~3 minutes)

Use this shot list when recording a submission or walkthrough video (same content previously in the main README):

1. **Landing** — Branding, feature cards, pricing
2. **Sign up & login** — Account creation → Control Panel
3. **Control Panel** — Azure service status (green dots), resources, recent sessions
4. **New session** — Domain: Biology; template: PCR Amplification
5. **Sample CSV** — Plant Growth Sensor → statistics + chart
6. **Chat** — Ask: *What trends do you see in temperature vs. growth? What should I try next?*
7. **Response** — Structured format (Observation / Analysis / Next Steps / Why) + confidence badge
8. **OpenML** — Import dataset #61 (iris)
9. **Image** — Gel electrophoresis photo → Azure Vision analysis
10. **PDF** — Protocol upload → RAG indexing + citation chips in follow-up chat
11. **Safety** — Borderline dosing question → Content Safety + audit log
12. **RAI panel** — Safety check, groundedness, reasoning trace
13. **Metrics** — Safety pass rate, RAG usage, groundedness
14. **Azure status** — All 8 services health
15. **Export** — Download session as Markdown lab notebook

