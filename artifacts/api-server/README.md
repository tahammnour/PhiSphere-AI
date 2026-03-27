# API Server (Backend)

This package is the PhiSphere backend API.

## Tech stack

- Express 5
- TypeScript
- PostgreSQL + Drizzle ORM
- Azure service integrations

## Run

```bash
pnpm --filter @workspace/api-server run dev
```

## Build and typecheck

```bash
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run typecheck
```

## Main responsibilities

- Lab session CRUD
- File uploads (CSV, image, PDF)
- Chat orchestration with Azure OpenAI
- Safety screening via Azure Content Safety
- RAG support via Azure Search and Document Intelligence
- Responsible AI metrics and audit logs
- OpenML dataset import

## Key files

- App entry: `src/index.ts`
- Express setup: `src/app.ts`
- Route registry: `src/routes/index.ts`
- Route docs: `src/routes/README.md`
- Sample datasets: `src/data/sample-datasets.ts`

