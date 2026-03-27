# PhiSphere Frontend

This package is the user-facing UI for PhiSphere AI.

## Tech stack

- React 19
- Vite 7
- Tailwind CSS 4
- React Query
- Recharts
- Framer Motion

## Run

```bash
pnpm --filter @workspace/phisphere-ai run dev
```

## Build and typecheck

```bash
pnpm --filter @workspace/phisphere-ai run build
pnpm --filter @workspace/phisphere-ai run typecheck
```

## Main pages

- `src/pages/ControlPanel.tsx`: Judge-friendly dashboard and links.
- `src/pages/Dashboard.tsx`: Main lab workspace.
- `src/pages/AuditLog.tsx`: Safety and groundedness history.
- `src/pages/Settings.tsx`: User settings.

## Key chat components

- `src/components/chat/ChatArea.tsx`
- `src/components/chat/DataUploadPanel.tsx`
- `src/components/chat/OpenMLImportModal.tsx`
- `src/components/chat/CsvPreviewCard.tsx`
- `src/components/chat/ResponsibleAIPanel.tsx`

## What judges can quickly verify in UI

- Structured response format and confidence badge
- OpenML import flow
- CSV data quality warning banner
- RAG source chips and entity chips
- Azure service status and metrics panel

