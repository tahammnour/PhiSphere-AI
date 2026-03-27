# API Routes Guide

This folder contains all backend HTTP routes.

## Core routes

- `health.ts`: Health check endpoint.
- `auth.ts`: Signup, login, logout, forgot-password.
- `lab-sessions.ts`: Session CRUD.
- `openai-conversations.ts`: Chat messages, SSE stream, safety flow, RAG context.
- `uploads.ts`: CSV/image/PDF upload and parsing.
- `templates.ts`: Scientific protocol templates.
- `export.ts`: Session export.

## Responsible AI and evaluation

- `audit.ts`: Session audit log retrieval.
- `evaluation.ts`: Evaluation summary and per-session report.
- `metrics.ts`: Dashboard metrics for judging visibility.

## Azure and integrations

- `azure-status.ts`: Live health checks for configured Azure services.
- `openml.ts`: OpenML search and import into lab sessions.
- `hypothesis.ts`: AI-generated hypotheses.
- `draft-paper.ts`: AI-generated paper draft.

## Route registration order

See `index.ts` for mount order and active route list.

