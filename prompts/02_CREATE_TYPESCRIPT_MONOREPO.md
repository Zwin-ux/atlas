# Codex Prompt 02: Create TypeScript monorepo

Create a TypeScript monorepo for Atlas.

Required structure:
- apps/web
- apps/widget
- packages/core
- packages/db
- packages/mcp
- packages/adapters/chatgpt
- packages/adapters/claude placeholder only
- packages/adapters/codex placeholder only
- packages/config
- data/county_packs
- assets/generated
- assets/prompts

Add package.json, tsconfig.base.json, README updates, placeholder index files, and simple typecheck/build scripts.

Do not implement real app logic yet.
Do not add Stripe/Auth/GitHub/Three.js.

Acceptance:
- dependencies install
- TypeScript placeholder packages compile
- BUILD_LOG.md updated
- NEXT_QUESTS.md moves to Quest A2
