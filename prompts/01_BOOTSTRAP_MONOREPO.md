# Prompt 01 — Bootstrap monorepo

Create TypeScript pnpm monorepo.

Packages:
- apps/widget
- apps/web placeholder
- packages/core
- packages/geo
- packages/mcp
- packages/config
- packages/assets

Use:
- TypeScript
- Vite + React for widget
- Zod
- Vitest only for package-level invariants
- PixiJS dependency only in apps/widget or renderer package

Do not add Google API calls yet.
Do not add DB yet.
Do not add Stripe/Auth.

Acceptance:
- pnpm install works
- typecheck works
- placeholder widget runs
- BUILD_LOG.md updated
