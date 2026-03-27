# Shared Libraries (`lib/`)

This directory contains shared packages used by frontend and backend.

## Packages

- `api-spec/`: OpenAPI 3.1 schema source (`openapi.yaml`).
- `api-client-react/`: Generated React Query client/hooks from OpenAPI.
- `api-zod/`: Generated Zod schemas for request/response validation.
- `db/`: Drizzle schema and database connection.
- `integrations-openai-ai-server/`: Server-side OpenAI/Azure client wrappers.
- `integrations-openai-ai-react/`: React-side helpers for AI features.

## Typical workflow when API changes

1. Update `api-spec/openapi.yaml`
2. Regenerate client code:
   ```bash
   pnpm --filter @workspace/api-spec run codegen
   ```
3. Rebuild API client declarations:
   ```bash
   pnpm exec tsc --build lib/api-client-react/tsconfig.json
   ```

