# Contributing to PhiSphere AI

Thanks for your interest in contributing! Here's how to get started.

## Getting Started

1. Fork the repository and clone your fork
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and fill in your Azure credentials
4. Push the database schema: `pnpm --filter @workspace/db run push`
5. Start the dev servers:
   ```bash
   pnpm --filter @workspace/api-server run dev
   pnpm --filter @workspace/phisphere-ai run dev
   ```

## Development Guidelines

- **TypeScript** — All code is strictly typed; run `pnpm run typecheck` before submitting
- **Formatting** — We use Prettier; run `prettier --write .` to format
- **Commits** — Write clear, concise commit messages describing the *why*
- **Tests** — Add or update tests when changing functionality

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `artifacts/phisphere-ai/` | React frontend (Vite + Tailwind) |
| `artifacts/api-server/` | Express backend + Azure integrations |
| `lib/` | Shared packages (API spec, DB schema, generated clients) |
| `notebooks/` | Azure ML & Responsible AI Toolbox notebooks |

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes with clear, focused commits
3. Ensure `pnpm run typecheck` and `pnpm run build` pass
4. Open a PR with a summary of changes and any relevant context

## Reporting Issues

Open a GitHub issue with:
- A clear description of the problem or suggestion
- Steps to reproduce (for bugs)
- Expected vs. actual behavior

## Credits

Maintainer contact: [mrzedd@outlook.sa](mailto:mrzedd@outlook.sa). This project is developed with [Replit](https://replit.com) (hosting & cloud IDE), [Replit Agent](https://docs.replit.com/category/replit-ai), and [Cursor](https://cursor.com). Live demo: [phi-sphere-ai-from-labs-last.replit.app](https://phi-sphere-ai-from-labs-last.replit.app).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
