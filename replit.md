# PhiSphere AI — Lab Notebook AI Assistant

## Overview

PhiSphere AI is an intelligent agentic lab notebook assistant SaaS platform. It helps researchers reason over experiments, analyze data, interpret images, and safely suggest next steps using Azure OpenAI and Azure AI services.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, custom types
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React 19 + Vite 7 + Tailwind CSS 4
- **AI**: Azure OpenAI, Azure AI Vision, Azure Content Safety, Azure Document Intelligence, Azure AI Search (RAG), Azure AI Language, Azure Application Insights — all direct (no proxy)
- **Charts**: Recharts (CSV data visualization)
- **Rate limiting**: express-rate-limit
- **File handling**: multer (upload) + csv-parse (CSV parsing)

## Auth System

- **Landing page** (`/landing`) — animated marketing page with hero, feature cards, pricing, CTA footer
- **Signup** (`/signup`) — plan selection (Monthly $29/mo, Annual $199/yr), username/password/confirm/activation code. `?plan=annual` param pre-selects plan.
- **Login** (`/login`) — username + password with show/hide toggle, forgot password link
- **Forgot password** (`/forgot-password`) — email recovery flow
- **Auth routing** — unauthenticated users redirect to `/landing`; authenticated users land on `/` (Control Panel)
- **Activation code**: `fcai-du` — enforced server-side only in `artifacts/api-server/src/routes/auth.ts`. Never shown in UI.
- **Auth storage**: Token in `localStorage` keys `phisphere_auth_token` + `phisphere_auth_user`
- **DB tables**: `users` (username, password_hash, is_activated, plan) and `auth_tokens` (user_id, token)
- **Password hashing**: SHA-256 with a static salt (demo-grade)
- **Sidebar**: Shows logo image, username + plan badge (Monthly/Annual/Free), logout button, session search

## Pages & Routes

| Route | Component | Access |
|---|---|---|
| `/landing` | Landing | Guest only |
| `/signup` | Signup | Guest only |
| `/login` | Login | Guest only |
| `/forgot-password` | ForgotPassword | Guest only |
| `/` | ControlPanel | Auth required |
| `/lab` | Dashboard | Auth required |
| `/settings` | Settings | Auth required |
| `/audit-log` | AuditLog | Auth required |
| `/terms` | Terms | Public |
| `/privacy` | Privacy | Public |

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (all backend routes)
│   │   └── src/
│   │       ├── data/       # Sample datasets (plant-growth, air-quality, chem-reaction)
│   │       └── routes/     # health, auth, lab-sessions, uploads, openai-conversations,
│   │                       #   export, templates, audit, azure
│   └── phisphere-ai/       # React+Vite frontend at previewPath "/"
│       └── src/
│           ├── components/
│           │   ├── chat/   # ChatArea, DataUploadPanel, CsvPreviewCard (recharts),
│           │   │           #   ImagePreviewCard, SampleDatasetModal, MessageBubble,
│           │   │           #   MarkdownRenderer, AzureStatusPanel
│           │   ├── layout/ # Sidebar (with search + mobile support)
│           │   ├── onboarding/ # OnboardingTour
│           │   └── ui/     # Shared Button, Textarea, etc.
│           ├── hooks/      # use-chat-stream, use-workspace
│           ├── lib/        # utils, experiment-types
│           └── pages/      # Dashboard, ControlPanel, Settings, AuditLog,
│                           #   Landing, Login, Signup, ForgotPassword, Terms, Privacy
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks (compiled to dist/)
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/  # OpenAI server-side client
│   └── integrations-openai-ai-react/   # OpenAI React hooks
└── scripts/
```

## Database Schema

- `lab_sessions` — experiment notebooks (id, name, description, domain, experimentData jsonb, createdAt, updatedAt)
- `conversations` — OpenAI chat conversations (id, sessionId FK→lab_sessions CASCADE, createdAt)
- `messages` — chat messages (id, conversationId FK CASCADE, role, content, createdAt)

### experimentData field (jsonb, nullable)

Stores either:
- **CsvDataType**: `{ type: "csv", filename, columns, numericColumns, rowCount, preview[5], stats{min/max/mean}, uploadedAt }`
- **ImageDataType**: `{ type: "image", filename, mimeType, base64, uploadedAt }`

## API Endpoints

```
GET    /api/healthz                                  Health check
GET    /api/lab-sessions                             List lab sessions
POST   /api/lab-sessions                             Create lab session
GET    /api/lab-sessions/:id                         Get lab session
DELETE /api/lab-sessions/:id                         Delete lab session (CASCADE)
POST   /api/lab-sessions/:id/upload                  Upload CSV or image (multipart)
POST   /api/lab-sessions/:id/load-sample             Load a sample dataset { datasetId }
GET    /api/lab-sessions/:id/export                  Export session as markdown
GET    /api/lab-sessions/:id/audit                   Audit log (safety events)
GET    /api/sample-datasets                          List 3 built-in sample datasets
GET    /api/templates                                List 12 protocol templates
POST   /api/auth/signup                              Register with activation code
POST   /api/auth/login                               Login
POST   /api/auth/logout                              Logout
POST   /api/auth/forgot-password                     Forgot password email request
GET    /api/openai/conversations                     List conversations
POST   /api/openai/conversations                     Create conversation { sessionId }
GET    /api/openai/conversations/:id                 Get conversation with messages
DELETE /api/openai/conversations/:id                 Delete conversation
POST   /api/openai/conversations/:id/messages        Send message (SSE stream, 8000 char max)
GET    /api/azure/status                             Azure services status check
```

## Rate Limiting

- `/api/auth` routes: 20 requests per 15 minutes
- `/api/openai-conversations` routes: 20 requests per minute
- General API: 120 requests per minute
- Message length: 8000 characters max

## AI System Prompt

The AI is configured as PhiSphere AI with a structured response format:
- 🔬 Observation
- 📊 Analysis
- 💡 Suggested Next Steps
- 🧠 Why I Recommend This

When CSV data is attached, the system prompt includes column stats and a 5-row preview.
When an image is attached, the last user message is sent as a multimodal vision request (base64 inline).

Safety rules enforce: no synthesis routes for dangerous substances, no clinical advice, no specific drug dosages.

## 12 Scientific Domains

Astronomy, Biology, Chemistry, Environmental Science, Geology, Materials Science, Medicine, Neuroscience, Physics, Psychology, Biochemistry, Computer Science

## Protocol Templates

12 templates available via `/api/templates`: PCR Amplification, Western Blot, ELISA, Gel Electrophoresis, Cell Culture, Acid-Base Titration, Spectrophotometry, DNA Extraction, Microscopy, Centrifugation, pH Measurement, Chromatography.

## Sample Datasets

Three built-in datasets available via `GET /api/sample-datasets`:
1. **plant-growth** — Plant Growth Sensor (20 rows, biology, 5 columns)
2. **air-quality** — Air Quality Readings (20 rows, chemistry, 6 columns)
3. **chem-reaction** — Chemical Reaction Measurements (20 rows, chemistry, 7 columns)

## Environment Variables

### Database (auto-provisioned by Replit)
- `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — PostgreSQL
- `PORT` — Server port (auto-assigned by Replit)

### Azure OpenAI (REQUIRED — primary AI engine)
Add these to your Replit project secrets:
- `AZURE_OPENAI_ENDPOINT` — Your Azure OpenAI resource endpoint (e.g. `https://my-resource.openai.azure.com`)
- `AZURE_OPENAI_API_KEY` — Your Azure OpenAI API key (from Azure Portal → Keys and Endpoints)
- `AZURE_OPENAI_DEPLOYMENT_NAME` — Your gpt-4o (or gpt-4) deployment name (defaults to `gpt-4o`)

> If AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY are missing, the server starts but logs a warning and AI chat returns an error message to users.
> API version used: `2024-10-21`

### Azure AI Vision (REQUIRED for image analysis)
- `AZURE_VISION_ENDPOINT` — Azure Computer Vision resource endpoint (e.g. `https://my-vision.cognitiveservices.azure.com`)
- `AZURE_VISION_KEY` — Azure Computer Vision API key

> Without these, image uploads will show an error instead of real analysis.

### Azure AI Content Safety (REQUIRED for safety screening)
- `AZURE_CONTENT_SAFETY_ENDPOINT` — Azure Content Safety resource endpoint
- `AZURE_CONTENT_SAFETY_KEY` — Azure Content Safety API key

> Without these, AI responses are withheld entirely — users see a "Content Safety Not Configured" message until the secrets are added.

### Azure AI Document Intelligence (Task #2 — Document RAG)
- `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` — Azure Form Recognizer / Document Intelligence endpoint
- `AZURE_DOCUMENT_INTELLIGENCE_KEY` — Document Intelligence API key

### Azure AI Search (Task #2 — RAG grounding)
- `AZURE_SEARCH_ENDPOINT` — Azure AI Search service endpoint (e.g. `https://my-search.search.windows.net`)
- `AZURE_SEARCH_KEY` — Azure AI Search admin key
- `AZURE_SEARCH_INDEX_NAME` — Name of the search index (e.g. `phisphere-protocols`)

### Azure AI Language (Task #2 — Entity recognition)
- `AZURE_LANGUAGE_ENDPOINT` — Azure AI Language resource endpoint
- `AZURE_LANGUAGE_KEY` — Azure AI Language API key

### Azure Application Insights (Task #2 — Observability)
- `APPLICATIONINSIGHTS_CONNECTION_STRING` — Application Insights connection string (from Azure Portal → Application Insights)

## Azure AI Services Architecture (Task #2)

### Azure Document Intelligence
- `artifacts/api-server/src/lib/azure-document-intelligence.ts`
- REST API v2024-11-30, `prebuilt-layout` model
- Extracts structured text from PDFs; splits into ~1200-char chunks
- Called in `uploads.ts` when a PDF is uploaded to a lab session (async polling)
- Chunks are indexed into Azure AI Search for RAG grounding
- `uploads.ts` now accepts PDF files (max 20MB, `application/pdf`)

### Azure AI Search (RAG)
- `artifacts/api-server/src/lib/azure-search.ts`
- REST API v2024-07-01; auto-creates `phisphere-docs` index on first use
- Index fields: id, content (searchable), sourceFile, sessionId, chunkIndex, pageNumber
- `indexDocumentChunks()` — called after Document Intelligence processes a PDF
- `searchDocuments()` — called on each AI chat turn; top-3 chunks injected into system prompt
- `buildRagContext()` — formats chunks as cited protocol context for the LLM
- RAG sources streamed to client as `event: rag` SSE events

### Azure AI Language
- `artifacts/api-server/src/lib/azure-language.ts`
- REST API v2023-04-01, `EntityRecognition` kind
- Extracts named entities (scientific terms, chemicals, genes, instruments) from each user message
- Filters to confidence ≥ 0.7; deduplicates by text; limits to 15 entities
- Entities injected into system prompt context and streamed as `event: entities` SSE events
- Frontend displays entity chips in real-time during streaming (teal pills below assistant message)
- RAG source chips shown as blue pills below the assistant message during streaming

### Azure Application Insights
- `artifacts/api-server/src/lib/azure-app-insights.ts`
- `applicationinsights` npm package, initialized lazily in `app.ts`
- Tracks custom events: `SessionCreated`, `FileUploaded`, `AiMessageSent`, `SafetyFlagTriggered`, `RagSearchPerformed`
- Tracks exceptions via `trackException()` in the AI route catch block
- Server warns and skips gracefully if `APPLICATIONINSIGHTS_CONNECTION_STRING` not set

### Azure Status Panel (Updated)
- `/api/azure/status` now pings all 7 services: OpenAI, Content Safety, Vision, Document Intelligence, Search, Language, App Insights
- `AzureStatusPanel.tsx` shows all 7 service cards with active count badge (e.g. "2/7")

## Responsible AI

- **Responsible AI Panel** — Collapsible side panel in ChatArea showing: confidence indicator (High/Medium/Low badge per message), safety check result, reasoning trace, data grounding.
- **Safety-First Architecture** — All AI responses are fully buffered server-side before Azure Content Safety runs. Only after safety passes/flags does the response stream to the client.
- **Audit Log** — `/audit-log` page shows safety events from `/api/lab-sessions/:id/audit`.

## Mobile Responsiveness

- Dashboard has a slide-in sidebar on mobile with hamburger button in a top header bar
- Overlay backdrop dismisses the sidebar when tapping outside
- Session selection and new session creation auto-closes the mobile sidebar

## Demo Experiments

Three pre-built demo sessions seeded via `POST /api/demo/seed`:
1. **🌿 Plant Sensor Analysis Demo** — CSV with temperature/humidity/growth (biology)
2. **⚗️ Acid-Base Titration Protocol** — Text-based chemistry protocol
3. **🔬 Gel Electrophoresis Image Analysis** — Image analysis (biology)

Demo sessions are marked with a "DEMO" badge in the sidebar for quick identification.

## UI Features

- PhiSphere branding throughout — dark navy / teal palette, Inter + JetBrains Mono fonts
- Azure service degradation banners in ChatArea header
- Form validation with visible error messages, character counters, and aria attributes
- Onboarding tooltip tour (6 steps) on first visit, skippable
- Skeleton loaders, typing indicator, upload shimmer micro-animations
- CsvPreviewCard with recharts (Line/Bar/Stats toggle)
- Export button in ChatArea header (downloads markdown)
- Protocol templates picker in NewSessionModal
- Session search in Sidebar (filters by name and domain)
- Per-message confidence badge (High/Medium/Low) in MessageBubble

## Development Commands

```bash
pnpm --filter @workspace/api-server run dev         # Start API server
pnpm --filter @workspace/phisphere-ai run dev       # Start frontend
pnpm --filter @workspace/api-spec run codegen       # Re-run API codegen
pnpm exec tsc --build lib/api-client-react/tsconfig.json  # Rebuild client declarations
pnpm --filter @workspace/db run push                # Push DB schema
pnpm run typecheck                                  # Full typecheck
```

## Important Notes

- **NEVER** display the activation code `fcai-du` anywhere in the UI — enforced in server-side only
- **NEVER** display the private model name in the UI — use "Azure OpenAI" in all public-facing text
- After running codegen, always rebuild api-client-react declarations with `pnpm exec tsc --build lib/api-client-react/tsconfig.json`
- `api-zod/src/index.ts` exports ONLY from `./generated/api` — do NOT re-export from `./generated/types`
- `lab-sessions.ts` schema defines Zod types manually (not drizzle-zod) to avoid version incompatibilities
- Express `trust proxy` is set to `1` in `app.ts` to support rate limiting behind Replit's proxy
