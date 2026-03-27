# PhiSphere AI — Lab Notebook Assistant

> **Agentic AI for experimental reasoning** — interpret protocols, analyze multimodal lab data (text, CSV, images, PDFs), and get **explainable**, **safety-gated** answers powered by **Azure AI**.

<p align="center">
  <img src="https://raw.githubusercontent.com/tahammnour/PhiSphere-AI/main/assets/phisphere-logo.png" alt="PhiSphere AI — sapphire-blue sphere mark and wordmark" width="520" />
</p>

<p align="center">
  <strong>Microsoft Innovation Challenge — March 2026</strong><br/>
  <sub>Multimodal lab notebook · Responsible AI · 8 Azure services</sub><br/><br/>
  <a href="https://phi-sphere-ai-from-labs-last.replit.app"><strong>Live app (Replit)</strong></a>
  — <code>phi-sphere-ai-from-labs-last.replit.app</code>
</p>

---

## 🎬 Intro videos

Project walkthroughs (files in [`videos/`](videos/)). **Inline player** below, plus **open on GitHub** if the player does not load (GitHub’s file page has a native player).

### Intro 1

<p align="center">
  <a href="https://github.com/tahammnour/PhiSphere-AI/blob/main/videos/intro1.mp4"><strong>▶ Watch Intro 1 on GitHub</strong></a>
</p>

<video controls playsinline width="100%" poster="https://raw.githubusercontent.com/tahammnour/PhiSphere-AI/main/assets/phisphere-logo.png">
  <source src="https://raw.githubusercontent.com/tahammnour/PhiSphere-AI/main/videos/intro1.mp4" type="video/mp4" />
  <source src="videos/intro1.mp4" type="video/mp4" />
</video>

### Intro 2

<p align="center">
  <a href="https://github.com/tahammnour/PhiSphere-AI/blob/main/videos/intro2.mp4"><strong>▶ Watch Intro 2 on GitHub</strong></a>
</p>

<video controls playsinline width="100%" poster="https://raw.githubusercontent.com/tahammnour/PhiSphere-AI/main/assets/phisphere-logo.png">
  <source src="https://raw.githubusercontent.com/tahammnour/PhiSphere-AI/main/videos/intro2.mp4" type="video/mp4" />
  <source src="videos/intro2.mp4" type="video/mp4" />
</video>

**Direct download:** [intro1.mp4](https://raw.githubusercontent.com/tahammnour/PhiSphere-AI/main/videos/intro1.mp4) · [intro2.mp4](https://raw.githubusercontent.com/tahammnour/PhiSphere-AI/main/videos/intro2.mp4)

---

## 📎 Quick links

| | |
|:---|:---|
| Authors | [`AUTHORS.md`](AUTHORS.md) — maintainer contact |
| Judges guide | [`JUDGES_GUIDE.md`](JUDGES_GUIDE.md) — evaluation path & technical evidence |
| Submission | [`HACKATHON_SUBMISSION_CHECKLIST.md`](HACKATHON_SUBMISSION_CHECKLIST.md) |
| Backend | [`artifacts/api-server/README.md`](artifacts/api-server/README.md) |
| Frontend | [`artifacts/phisphere-ai/README.md`](artifacts/phisphere-ai/README.md) |
| API routes | [`artifacts/api-server/src/routes/README.md`](artifacts/api-server/src/routes/README.md) |
| Shared libs | [`lib/README.md`](lib/README.md) |
| Notebooks | [`notebooks/README.md`](notebooks/README.md) |

---

## 📸 Screenshots & diagrams

### Architecture assets (in repo)

| Description |
|-------------|
| ![Azure architecture overview](https://raw.githubusercontent.com/tahammnour/PhiSphere-AI/main/screenshots/architecture-phisphere-azure.png)<br/><br/>**System overview** — User → React UI → Backend → 8 Azure services → PostgreSQL. |
| ![Six architecture panels](https://raw.githubusercontent.com/tahammnour/PhiSphere-AI/main/screenshots/architecture-diagrams-collage.png)<br/><br/>**Six-panel collage** — High-level stack, RAG sequence, safety pipeline, document RAG, Azure map, multimodal inputs. |
| ![Drawing style guide](https://raw.githubusercontent.com/tahammnour/PhiSphere-AI/main/screenshots/architecture-drawing-style-guide.png)<br/><br/>**Style guide** — Layout, box colors, arrows, and Azure palette (for draw.io / slides). |

### UI captures (optional)

Add PNGs under `screenshots/` when you record the app (suggested filenames in parentheses):

| Description |
|-------------|
| **Landing** (`landing.png`) — Hero, feature cards, pricing |
| **Control Panel** (`control-panel.png`) — Azure status, metrics, sessions |
| **Lab notebook** (`lab-notebook.png`) — Chat, CSV chart, RAI panel |
| **Vision** (`ai-vision.png`) — Image upload + analysis |
| **RAG** (`rag-pipeline.png`) — PDF upload + citations |
| **Safety** (`safety-demo.png`) — Content Safety + audit |
| **Metrics** (`metrics.png`) — Evaluation summary |
| **About** (`about.png`) — In-app About page |

<details>
<summary>How to capture UI screenshots</summary>

1. Run the app locally or on Replit.
2. Capture each screen and save under `screenshots/` using the filenames above.
3. Commit and push — then you can switch this section back to image markdown if you prefer a gallery table.

</details>

---

## 🎯 Problem & challenge

**Lab Notebook AI Assistant** — Researchers need help reasoning over experiments **without** replacing scientific judgment. PhiSphere interprets protocols, **suggests next-step variations**, and analyzes **text, CSV, images, and PDFs — with explicit *why* behind every recommendation**. Strong **safety boundaries** (bio, clinical, lab, chemical), **content filtering**, and **no disallowed advisory** behavior.

---

## 🏗️ Architecture

### Visual overview (PNGs in repo)

The diagrams below summarize the **multimodal stack**, **eight Azure integrations**, and **safety-first** flow. **Mermaid** blocks are the editable source of truth; **PNGs** are for slides and quick reading on GitHub.

**System overview — PhiSphere AI Lab Assistant (multimodal + explainable AI)**

![PhiSphere AI — system overview: User, React UI, Backend pipeline, eight Azure services, PostgreSQL](https://raw.githubusercontent.com/tahammnour/PhiSphere-AI/main/screenshots/architecture-phisphere-azure.png)

**Six-panel deep dive** (high-level stack, RAG sequence, safety pipeline, document RAG, Azure services map, multimodal inputs)

![Architecture diagrams collage — six panels](https://raw.githubusercontent.com/tahammnour/PhiSphere-AI/main/screenshots/architecture-diagrams-collage.png)

<details>
<summary>Drawing style guide (layout, box colors, arrows, Azure palette)</summary>

![Architecture drawing style guide — layout columns, box styles, arrow legend, callouts, hex colors](https://raw.githubusercontent.com/tahammnour/PhiSphere-AI/main/screenshots/architecture-drawing-style-guide.png)

</details>

---

### 1. High-Level System Architecture

```mermaid
flowchart LR
    %% Frontend
    subgraph FE["Frontend - React UI"]
        A1[Chat Interface]
        A2[File Upload - CSV/Image/PDF]
        A3[RAI Panel]
        A4[Data Visualization]
    end

    %% Browser
    U[Researcher Browser] --> FE

    %% Backend
    subgraph BE["Backend Services"]
        B1[API Gateway]
        B2[Safety Buffer]
        B3[RAG Engine]
        B4[Entity Processor]
        B5[Telemetry]
    end

    FE --> B1
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B5

    %% Database
    DB[(PostgreSQL)]

    B3 --> DB
    B5 --> DB

    %% Azure AI Services
    subgraph AZ["Azure AI Services"]

        subgraph CoreAI["Core AI"]
            C1[Azure OpenAI]
        end

        subgraph Safety["Safety"]
            S1[Content Safety]
        end

        subgraph Vision["Vision"]
            V1[Vision API]
        end

        subgraph RAG["RAG Pipeline"]
            R1[AI Search]
        end

        subgraph NLP["NLP"]
            N1[Language Service]
        end

        subgraph Obs["Observability"]
            O1[App Insights]
        end

        subgraph ML["ML Platform"]
            M1[Azure ML]
        end

        subgraph Docs["Docs Processing"]
            D1[Document Intelligence]
        end
    end

    %% Connections
    B3 --> R1
    B3 --> D1
    B3 --> V1
    B3 --> N1
    B2 --> S1
    B3 --> C1
    B5 --> O1
    B4 --> M1

    %% External Data
    EXT[External Data Sources / OpenML]
    EXT --> B3
```

### 2. Data Flow — Full RAG Pipeline

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API Gateway
    participant SB as Safety Buffer
    participant RAG as RAG Engine
    participant AS as AI Search
    participant LLM as GPT-4o
    participant CS as Content Safety
    participant EP as Entity Processor
    participant SSE as Streaming
    participant DB as Telemetry/DB

    U->>FE: Ask question
    FE->>API: Send request

    Note over API,RAG: Step 1 — RAG Context Assembly
    API->>RAG: RAG Context Assembly
    RAG->>AS: Query documents
    AS-->>RAG: Top chunks

    Note over RAG,LLM: Step 2 — Buffered LLM Completion
    RAG->>SB: Send prompt
    SB->>LLM: Buffered completion

    Note over LLM,CS: Step 3 — Safety Gate (fail-closed)
    LLM-->>CS: Response
    CS-->>API: Safety Gate (fail-closed)

    Note over API,EP: Step 4 — Entity Extraction
    API->>EP: Extract entities

    Note over API,FE: Step 5 — Stream to client
    API->>SSE: Stream response
    SSE-->>FE: Live tokens

    API->>DB: Log telemetry
```

### 3. Safety-First Streaming Pipeline

```mermaid
flowchart TD
    A[User Input]
    B[CSV Stats]
    C[Image Analysis]
    D[PDF RAG Chunks]
    E[System Prompt]

    A --> F[Prompt Builder]
    B --> F
    C --> F
    D --> F
    E --> F

    F --> G[GPT-4o]

    G --> H[Content Safety Gate]

    H -->|Pass| I[Stream to Client]
    H -->|Flag| J[Flagged Response]
    H -->|Block| K[Blocked Response]

    I --> L[Audit Log]
    J --> L
    K --> L

    L --> M[App Insights]
```

### 4. Document RAG Pipeline

```mermaid
flowchart TD
    %% Upload path
    A[PDF Upload]
    A --> B[Document Intelligence]
    B --> C[Chunk Splitter]
    C --> D[AI Search Index]

    %% Query path
    Q[User Question]
    Q --> E[Hybrid Search]
    E --> D
    D --> F[Top 3 Chunks]
    F --> G[LLM Context]
    G --> H[Response + Citations]
```

### 5. Azure Services Map

```mermaid
flowchart LR
    API[Express API Server]

    API -->|"LLM Calls"| A1[Azure OpenAI]
    API -->|"Moderation"| A2[Content Safety]
    API -->|"Image Analysis"| A3[Vision]
    API -->|"PDF Parsing"| A4[Document Intelligence]
    API -->|"Search Index"| A5[AI Search]
    API -->|"Entity NLP"| A6[Language Service]
    API -->|"Monitoring"| A7[App Insights]
    API -->|"Model Training"| A8[Azure ML]
```

### 6. Multimodal Input Processing

```mermaid
flowchart TD
    T[Text Input]
    C[CSV File]
    I[Images]
    P[PDFs]
    O[OpenML Dataset]

    T --> A[Text Processor]
    C --> B[Data Analyzer]
    I --> D[Vision Analyzer]
    P --> E[RAG Processor]
    O --> F[Dataset Loader]

    A --> G[Context Builder]
    B --> G
    D --> G
    E --> G
    F --> G

    G --> H[LLM Context Window]
```

---

### Architecture Drawing Guide

<details>
<summary><strong>Click to expand — full description for drawing in draw.io / PowerPoint / Visio</strong></summary>

Use this to recreate the PhiSphere AI architecture in any drawing tool.

#### Layout (3-column)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHISPHERE AI ARCHITECTURE                          │
├────────────────┬──────────────────────────┬─────────────────────────────────┤
│                │                          │                                 │
│   FRONTEND     │      BACKEND             │     AZURE AI SERVICES           │
│   (left)       │      (center)            │     (right — blue cloud box)    │
│                │                          │                                 │
│ ┌────────────┐ │  ┌──────────────────┐    │  ┌───────────────────────────┐  │
│ │ PhiSphere  │ │  │ API Gateway      │    │  │ 1. Azure OpenAI (GPT-4o) │  │
│ │ React UI   │──→ │                  │───→│  │    Purple box             │  │
│ │            │ │  │ • Auth           │    │  └───────────────────────────┘  │
│ │ • Chat     │ │  │ • Rate Limiting  │    │                                 │
│ │ • Upload   │ │  │ • Health Checks  │    │  ┌───────────────────────────┐  │
│ │ • CSV Viz  │ │  ├──────────────────┤    │  │ 2. Content Safety         │  │
│ │ • RAI Panel│ │  │ Safety Buffer    │───→│  │    Red box — FAIL-CLOSED  │  │
│ │ • Entities │ │  │ (full response   │    │  └───────────────────────────┘  │
│ └────────────┘ │  │  before stream)  │    │                                 │
│                │  ├──────────────────┤    │  ┌───────────────────────────┐  │
│    ↑ SSE       │  │ RAG Engine       │───→│  │ 3. AI Vision              │  │
│    Stream      │  │ (context build)  │    │  │    Blue box               │  │
│                │  ├──────────────────┤    │  └───────────────────────────┘  │
│                │  │ Entity Processor │───→│                                 │
│                │  ├──────────────────┤    │  ┌───────────────────────────┐  │
│                │  │ Telemetry        │───→│  │ 4. Document Intelligence  │  │
│                │  └────────┬─────────┘    │  │    Teal box               │  │
│                │           │              │  └──────────┬────────────────┘  │
│                │           ▼              │             │ chunks             │
│                │  ┌──────────────────┐    │             ▼                    │
│                │  │ PostgreSQL       │    │  ┌───────────────────────────┐  │
│                │  │ • Lab Sessions   │    │  │ 5. AI Search (RAG)        │  │
│                │  │ • Conversations  │    │  │    Blue box               │  │
│                │  │ • Messages       │    │  └───────────────────────────┘  │
│                │  │ • Safety Audit   │    │                                 │
│                │  └──────────────────┘    │  ┌───────────────────────────┐  │
│                │                          │  │ 6. AI Language (NER)      │  │
│ ┌────────────┐ │                          │  │    Green box               │  │
│ │ External   │ │                          │  └───────────────────────────┘  │
│ │ • OpenML   │──→  (dataset import)       │                                 │
│ │ • Kaggle   │ │                          │  ┌───────────────────────────┐  │
│ └────────────┘ │                          │  │ 7. Application Insights   │  │
│                │                          │  │    Orange box              │  │
│                │                          │  └───────────────────────────┘  │
│                │                          │                                 │
│                │                          │  ┌───────────────────────────┐  │
│                │                          │  │ 8. Azure ML               │  │
│                │                          │  │    Purple box (dashed)     │  │
│                │                          │  │    Offline notebooks       │  │
│                │                          │  └───────────────────────────┘  │
└────────────────┴──────────────────────────┴─────────────────────────────────┘
```

#### Boxes to draw

| # | Box Label | Color | Shape | Notes |
|---|-----------|-------|-------|-------|
| — | **PhiSphere UI** | Dark / Teal | Rounded rectangle | Chat, Upload, CSV Viz, RAI Panel, Entity Chips |
| — | **Backend Services** | Blue | Rounded rectangle | API Gateway, Safety Buffer, RAG Engine, Entity Processor, Telemetry |
| — | **PostgreSQL** | Slate/Gray | Cylinder (database) | Lab Sessions, Conversations, Messages, Safety Audit Log |
| 1 | **Azure OpenAI** | Purple `#7B2FF7` | Rounded rect + Azure icon | "GPT-4o — Scientific Reasoning" |
| 2 | **Content Safety** | Red `#E74C3C` | Rounded rect + shield icon | "Fail-Closed Content Moderation" |
| 3 | **AI Vision** | Blue `#0078D4` | Rounded rect + eye icon | "Captions • OCR • Object Detection" |
| 4 | **Document Intelligence** | Teal `#00B4D8` | Rounded rect + doc icon | "PDF → Structured Text Chunks" |
| 5 | **AI Search** | Blue `#0078D4` | Rounded rect + search icon | "Vector + Keyword RAG — Top-3 Citations" |
| 6 | **AI Language** | Green `#2ECC71` | Rounded rect + text icon | "Named Entity Recognition" |
| 7 | **App Insights** | Orange `#F39C12` | Rounded rect + chart icon | "Telemetry • Custom Events" |
| 8 | **Azure ML** | Purple `#9B59B6` | Dashed rounded rect | "RAI Toolbox Notebooks — Offline" |
| — | **OpenML / Kaggle** | Light blue | Small rounded rect | External data sources |

#### Arrows to draw

| From | To | Label | Line Style |
|------|----|-------|------------|
| Browser | PhiSphere UI | HTTPS | Solid |
| PhiSphere UI | API Gateway | SSE Streaming | Solid, bold |
| API Gateway | Safety Buffer | | Solid |
| Safety Buffer | RAG Engine | | Solid |
| RAG Engine | Entity Processor | | Solid |
| Entity Processor | Telemetry | | Solid |
| RAG Engine | PostgreSQL | Read/Write | Solid |
| Telemetry | PostgreSQL | Audit log | Solid |
| RAG Engine | Azure OpenAI | LLM Calls | Solid |
| Safety Buffer | Content Safety | Moderation | Solid |
| RAG Engine | AI Vision | Image analysis | Solid |
| RAG Engine | Document Intelligence | PDF parsing | Solid |
| Document Intelligence | AI Search | Index chunks | Solid |
| RAG Engine | AI Search | Query documents | Solid |
| RAG Engine | AI Language | Entity NLP | Solid |
| Telemetry | App Insights | Monitoring | Solid |
| Entity Processor | Azure ML | Model training | Dashed |
| OpenML | RAG Engine | Dataset import | Solid |

#### Azure cloud region box

- Background: Light blue `#E8F4FD` with blue border `#0078D4`
- Header: "Azure AI Services" with Azure logo
- Arrange the 8 service boxes in a 2x4 grid inside this cloud box
- Footer text: **"8 Azure AI Services | Safety-First Architecture | Responsible AI Principles"**

</details>

---

## 🏆 Hackathon alignment

Typical judging dimensions (example — see your official rubric):

| Dimension | How PhiSphere delivers |
|-----------|------------------------|
| **Performance** | SSE streaming, rate limiting, health checks across Azure services, metrics (latency, safety, RAG) |
| **Innovation** | Ingest → RAG → LLM → safety → audit; OpenML import; multimodal (CSV, image, PDF); 12 protocol templates; hypothesis & draft paper |
| **Azure breadth** | 8 services: OpenAI, Vision, Content Safety, Document Intelligence, AI Search, AI Language, App Insights, Azure ML |
| **Responsible AI** | Buffered responses, domain rules, audit log, groundedness, confidence UI, RAI Toolbox notebooks |

---

## 📁 Repository structure

```
PhiSphere-AI-master/
├── artifacts/
│   ├── phisphere-ai/          # Frontend — React 19 + Vite 7 + Tailwind CSS 4
│   │   └── src/
│   │       ├── components/    # Chat, layout, UI, onboarding
│   │       ├── hooks/         # use-chat-stream, use-workspace, use-auth
│   │       ├── pages/         # Dashboard, ControlPanel, Settings, AuditLog, Landing...
│   │       └── lib/           # Utils, experiment types
│   └── api-server/            # Backend — Express 5 + esbuild
│       └── src/
│           ├── routes/        # health, auth, lab-sessions, uploads, openai-conversations,
│           │                  #   azure-status, evaluation, audit, export, templates,
│           │                  #   openml, metrics, hypothesis, draft-paper
│           ├── data/          # Sample datasets (plant-growth, air-quality, chem-reaction)
│           └── lib/           # Azure service clients (openai, vision, safety, search,
│                              #   language, doc-intelligence, app-insights, groundedness)
├── lib/
│   ├── api-spec/              # OpenAPI 3.1 spec + Orval codegen
│   ├── api-client-react/      # Generated React Query hooks
│   ├── api-zod/               # Generated Zod validation schemas
│   ├── db/                    # Drizzle ORM schema + PostgreSQL connection
│   ├── integrations-openai-ai-server/   # Azure OpenAI server client
│   └── integrations-openai-ai-react/    # Azure OpenAI React hooks
├── notebooks/                 # Azure ML + Responsible AI Toolbox notebooks
├── scripts/                   # Build and dev scripts
├── replit.md                  # Detailed operational docs (env vars, schema, API reference)
└── README.md                  # ← You are here
```

---

## ✨ Key features

| | |
|:---|:---|
| **Structured reasoning** | Observation → Analysis → Next steps → **Why I recommend this** |
| **Multimodal** | CSV + charts (Recharts), images (Vision), PDFs (Document Intelligence + RAG) |
| **OpenML** | Import public datasets by ID ([OpenML](https://www.openml.org/)) into a session |
| **Protocol templates** | 12 lab templates (PCR, Western Blot, ELISA, gel, cell culture, titration, spectrophotometry, DNA extraction, microscopy, centrifugation, pH, chromatography) |
| **RAG** | PDF chunks in Azure AI Search; top-3 context + citations |
| **Entities** | Azure AI Language — chemicals, genes, instruments as chips |
| **Safety-first** | Full response buffered → **Content Safety** → then streamed |
| **RAI UI** | Confidence, safety, groundedness, reasoning trace |
| **Audit & metrics** | Safety events + usage / groundedness / latency stats |
| **Azure status** | Live health for all 8 integrations |
| **Demos** | Pre-built sessions (e.g. plant sensor, titration, gel image) |

---

## 🚀 Quick start

### Prerequisites

- Node.js 24+, pnpm
- PostgreSQL (auto-provisioned on Replit)
- Azure OpenAI resource with a `gpt-4o` deployment

### Run locally

```bash
pnpm install
pnpm --filter @workspace/db run push              # Create DB tables
pnpm --filter @workspace/api-server run dev        # Start backend  (port from $PORT)
pnpm --filter @workspace/phisphere-ai run dev      # Start frontend (Vite dev server)
```

### Environment Variables

Copy `.env.example` or set these in your environment / Replit Secrets:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | Yes | Server port |
| `AZURE_OPENAI_ENDPOINT` | Yes | Azure OpenAI resource URL |
| `AZURE_OPENAI_API_KEY` | Yes | Azure OpenAI key |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | No | Deployment name (default: `gpt-4o`) |
| `AZURE_CONTENT_SAFETY_ENDPOINT` | Yes | Content Safety resource URL |
| `AZURE_CONTENT_SAFETY_KEY` | Yes | Content Safety key |
| `AZURE_VISION_ENDPOINT` | Recommended | AI Vision resource URL |
| `AZURE_VISION_KEY` | Recommended | AI Vision key |
| `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` | Optional | Document Intelligence URL |
| `AZURE_DOCUMENT_INTELLIGENCE_KEY` | Optional | Document Intelligence key |
| `AZURE_SEARCH_ENDPOINT` | Optional | AI Search service URL |
| `AZURE_SEARCH_KEY` | Optional | AI Search admin key |
| `AZURE_SEARCH_INDEX_NAME` | Optional | Search index name (default: `phisphere-docs`) |
| `AZURE_LANGUAGE_ENDPOINT` | Optional | AI Language resource URL |
| `AZURE_LANGUAGE_KEY` | Optional | AI Language key |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Optional | App Insights connection string |

See [replit.md](replit.md) for the full environment variable reference.

---

## ☁️ Azure services integrated

| # | Service | Purpose |
|---|---------|---------|
| 1 | **Azure OpenAI** | GPT-4o chat completions with structured scientific reasoning |
| 2 | **Azure AI Content Safety** | Pre-stream safety screening for all AI responses |
| 3 | **Azure AI Vision** | Image analysis (captions, OCR, object detection) for lab photos |
| 4 | **Azure Document Intelligence** | PDF extraction → structured text chunks for RAG |
| 5 | **Azure AI Search** | Vector + keyword search for RAG grounding with citations |
| 6 | **Azure AI Language** | Named entity recognition (chemicals, genes, instruments) |
| 7 | **Azure Application Insights** | Telemetry, custom events, exception tracking |
| 8 | **Azure Machine Learning** | Experiment tracking and model evaluation (see `notebooks/`) |

---

## 🛡️ Responsible AI

PhiSphere applies responsible AI across the stack:

- **Safety-first streaming** — AI responses are fully buffered server-side; Azure Content Safety screens the complete text before any content reaches the client
- **Domain-specific safety rules** — Hard-coded system prompt boundaries: no synthesis routes for pathogens, no clinical dosing, no explosive synthesis, mandatory BSL/IRB flags
- **Audit trail** — Every safety event (pass, flag, block) is recorded with timestamps, severity categories, and session context
- **Groundedness scoring** — Azure AI evaluates whether responses are grounded in provided data vs. fabricated
- **Confidence indicators** — Per-message High/Medium/Low confidence badges visible to researchers
- **Explainability** — Mandatory "Why I Recommend This" section in every AI response
- **Data limitations** — Automatic warnings when CSV data has missing values, small sample sizes, or limited numeric columns
- **Responsible AI Toolbox notebooks** — Offline analysis using Microsoft's RAI Toolbox for tabular data fairness, error analysis, and data balance (see `notebooks/`)

---

## 📚 References

- [OpenML](https://www.openml.org/) — Open machine learning dataset repository
- [Kaggle Sensor Datasets](https://www.kaggle.com/datasets?search=sensor) — IoT and sensor data for lab experiments
- [Azure ML Examples](https://github.com/Azure/azureml-examples) — Azure Machine Learning SDK v2 samples
- [Python OpenAI Demos](https://github.com/Azure-Samples/python-openai-demos) — Azure OpenAI Python samples
- [Content Safety Studio](https://contentsafety.cognitive.azure.com/) — Azure AI Content Safety testing
- [Responsible AI Toolbox](https://github.com/microsoft/responsible-ai-toolbox) — Microsoft RAI tools for fairness and explainability

---

## Contributors & acknowledgments

| | |
|:---|:---|
| **Contact** | [mrzedd@outlook.sa](mailto:mrzedd@outlook.sa) |
| **Live deployment** | [phi-sphere-ai-from-labs-last.replit.app](https://phi-sphere-ai-from-labs-last.replit.app) — hosted on [Replit](https://replit.com) |
| **Replit** | Cloud IDE, deployment, and project hosting |
| **Replit Agent** | AI-assisted development on Replit ([docs](https://docs.replit.com/category/replit-ai)) |
| **Cursor** | AI-powered editor used for local development |

---

## ⚖️ License

**MIT** — Copyright (c) 2026 PhiSphere AI.

This project is released under the [MIT License](LICENSE). The full license text is in the [`LICENSE`](LICENSE) file at the repo root (GitHub also shows it under the **MIT license** tab).

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the condition that the above copyright notice and this permission notice appear in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
