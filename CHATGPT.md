# Atlas — ChatGPT handoff

This is the current Atlas product tree. Start here, then follow the links.
Do not trust the historical root README, `STATE.md`, `LOOP.md`, or
`docs/NORTH_FACE.md` as current product law.

## What Atlas is now

Atlas is a ChatGPT app: a read-only atlas of the United States built on US
Census geography. It draws a place as a cartographic plate and answers
questions about that place from the same Census data.

- No accounts, no writes, no commerce, no third-party geodata calls.
- Public MCP tools live in `scripts/lib/atlas-tool-surface.mjs`. Do not copy
  the names into prose.
- Location queries resolve or refuse. Structured `ambiguous` / `unresolved`
  is required. Confidently wrong counties are a hard fail.

## Read in this order

1. [AGENTS.md](AGENTS.md) — router and hard stops
2. [docs/STATUS.md](docs/STATUS.md) — last verified evidence and blockers
3. [docs/brain/PROJECT_PLAN.md](docs/brain/PROJECT_PLAN.md) — local priorities
4. [llm-wiki/CLAUDE.md](llm-wiki/CLAUDE.md) and [llm-wiki/wiki/index.md](llm-wiki/wiki/index.md) — compiled knowledge base
5. [GITHUB.md](GITHUB.md) — which GitHub repo is which

## Hard stops (do not restore)

Community notes / Commons, Hosted Clawd, Scout Drop, campaign engine, paid
tiers, PixiJS voxel as a product surface, Google Maps / Places, and any
third-party geodata call.

If a stale doc, verifier, or artifact tells you to add one of those back, the
doc is the bug. Report it. Do not comply.

## Sister surfaces

| Surface | Where | What it is |
|---|---|---|
| Current ChatGPT app | this repo, `main` | Two-tool Census atlas + widget |
| WebMCP challenge snapshot | [Zwin-ux/atlas-webmcp-challenge](https://github.com/Zwin-ux/atlas-webmcp-challenge) | Frozen judge candidate (private) |
| Voxel-era checkpoint | [Zwin-ux/atlas-alpha-engine-beta-checkpoint](https://github.com/Zwin-ux/atlas-alpha-engine-beta-checkpoint) | Historical engine RC, not current product |

## Commands

```powershell
pnpm install
pnpm typecheck:starter
pnpm verify:mcp
pnpm verify:submission
pnpm brain:query -- "task terms"
pnpm dev
```

LLM wiki:

```powershell
python llm-wiki/scripts/lint_wiki.py llm-wiki
python llm-wiki/scripts/audit_review.py llm-wiki --open
```

In Grok Build, run `/atlas-llm-wiki-setup` (or `/workflow atlas-llm-wiki-setup`)
to scaffold, ingest canonical sources, compile, and lint the wiki.

## What is still dirty / not a release claim

This snapshot includes the working-tree ChatGPT-app work that sat uncommitted
on `main` after `b6f2f821`. Production Railway deploys and the OpenAI portal
challenge token are separate human gates. Do not call this a tagged release
SHA unless `docs/STATUS.md` says so.
