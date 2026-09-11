# Atlas — agent instructions

Atlas is a ChatGPT app: an atlas of the United States built on US Census
geography. It draws a place — county, state, or the whole nation — as a real
cartographic plate, and answers questions about that place from the same Census
data. It is read-only: no accounts, no writes, no commerce, no third-party
calls.

This file is a router. It says where truth lives. It does not hold truth itself.

## The governing rule

**No prose restates a machine-checkable fact.**

Tool names, place counts, commit SHAs, image digests, and URLs live in code, in
JSON, or behind a command you can run. Documentation links to them. It never
copies them.

This rule exists because the repo broke without it. On 2026-07-25 Atlas pivoted
from a seven-tool voxel product to the two-tool read-only atlas that ships
today. Nearly every document in the repo carried its own hand-written copy of
the old tool list. One document was updated. The rest kept instructing agents to
build the retired product, and agents did.

So: if you are about to type a fact a script could check, link the script
instead. If a document and a command disagree, the command is right and the
document is the bug.

## Tool surface

`scripts/lib/atlas-tool-surface.mjs` is the single executable source of truth
for the public MCP tool surface. It exports the expected tool list, the retired
names that must never come back, forbidden name patterns, and the annotations
each tool must declare. Every verifier that inspects the surface imports from
it.

Do not restate the tool list in prose — not here, not in a doc, not in a code
comment. Read the file.

Implementations live in `server/src/atlasTools.ts`. That file and the surface
library must agree; `scripts/verify-atlas-source-of-truth-drift.mjs` fails if
they do not.

## Hard stops

These were deleted in the pivot and stay deleted. Never restore one to make a
check pass, to satisfy a stale doc, or to fill a gap you think you see:

- Community notes / Commons — public note reads, writes, moderation queue
- Hosted Clawd — accounts, saves, Stripe billing, subscription gates
- Scout Drop and the campaign engine — lead generation
- Upgrade, checkout, or paid-tier surfaces of any kind
- The PixiJS voxel renderer as a product surface
- Google Maps and Google Places lookup, and any third-party geodata call

Dead code from several of these still sits in `server/src/index.ts`. None of it
is registered on the tool surface. Deleting it is welcome. Re-registering any
of it is not.

If a verifier, a doc, or an artifact tells you to add one of these back, the
verifier or doc is stale. Report it. Do not comply.

## Location Truth

A location query resolves to the right place, or it refuses. Those are the only
two acceptable outcomes.

A refusal is structured, not an apology. `ambiguous` returns the candidate
places so the user can choose. `unresolved` says plainly that Atlas does not
carry the name. Atlas is never confidently wrong: one wrong county stated as
fact costs more trust than every refusal Atlas will ever make.

The gate is `scripts/verify-location-truth.mjs`, run as
`pnpm verify:location-truth`. It samples the index across exact names, casing
and punctuation, misspellings, dropped diacritics, shared names, and nonsense.
It fails on a single confidently wrong answer no matter how well the rest
scores. That is deliberate — do not raise the tolerance to get a green run.

## Routing table

| Task | Read |
|------|------|
| Current status, verifier results, open blockers | `docs/STATUS.md` |
| What the public tool surface is | `scripts/lib/atlas-tool-surface.mjs` |
| How a tool behaves | `server/src/atlasTools.ts` |
| Place resolution and refusal semantics | `packages/core/src/atlas/gazetteer.ts` |
| Plate geometry, projection, rendering | `server/src/atlasPlates.ts`, `web/src/atlas/` |
| County and town anchor data | `data/census/us-county-town-anchors.json` |
| Visual and interaction design | `DESIGN.md` |
| Store submission record | `chatgpt-app-submission.json` |
| Project plan and human priorities | `docs/brain/PROJECT_PLAN.md` |
| Search all current and historical documents | `pnpm brain:query -- "task terms"` |
| Build, test, and verify commands | `package.json` scripts |
| CI gates | `.github/workflows/ci.yml` |
| ChatGPT / GitHub handoff | `CHATGPT.md`, `GITHUB.md` |
| LLM wiki (compiled knowledge) | `llm-wiki/CLAUDE.md`, `llm-wiki/wiki/index.md` |
| Execution kit / task DAG | `atlas-execution-kit/00_START_HERE.md`, `atlas-execution-kit/graph/release-graph.json` |

Except for `docs/STATUS.md`, the local GBrain outputs, legal policy sources, and
exact-path exceptions classified by the document policy, everything else under
`docs/` and all of `artifacts/` predates the pivot. Treat it as history, not
instruction. `scripts/lib/atlas-document-policy.mjs` is authoritative for
those exceptions; a title or directory name is not.
`STATE.md`, `LOOP.md`, `docs/NORTH_FACE.md`, and
`artifacts/current-update.json` describe a product that no longer exists.
`docs/STATUS.md` supersedes them.

## Local GBrain

The local context harness lives in `docs/brain/README.md`. Its policy in
`scripts/lib/atlas-document-policy.mjs` classifies every repository-visible
document as canonical, active reference, generated, review-required, or
historical. Do not promote an old document by citing its title. Query the
registry, then follow its authority label.

Before major planning, product, design, or implementation work:

1. Read `AGENTS.md`, `docs/STATUS.md`, and `docs/brain/PROJECT_PLAN.md`.
2. Run `pnpm brain:verify`.
3. Query the registry for the task terms.
4. State any local authority conflict before editing.

Do not require Notion, MCP, browser state, or a global memory service to start
or continue work. `docs/brain/notion.json` is an optional human mirror pointer,
not an agent dependency. The repository owns planning and executable truth.

## Commands

Verified against `package.json`:

- `pnpm typecheck:starter` — server and web typecheck
- `pnpm typecheck` — starter plus workspaces
- `pnpm build` — full build
- `pnpm test:core` — core package tests
- `pnpm verify:location-truth` — the honesty gate
- `pnpm verify:mcp` — live MCP flow; asserts the tool surface
- `pnpm verify:submission` — submission record against a live server
- `pnpm dev` — build web and geo, then run the server under tsx

Host note: on this Windows machine `pnpm` resolves in PowerShell but not in the
Git Bash shell. Run pnpm scripts from PowerShell, or call the underlying script
directly with `node scripts/<name>.mjs`.

## Working agreements

Commits follow the shape already in the log: `type(scope): what changed and why
it matters` — lowercase, one line, naming the consequence rather than the
mechanism.

Architecture: mock-first, typed data contracts, service layer before renderer.
The widget renders from server and tool state; the transcript does not carry
bulk geometry. Use the curated Census packs. Do not invent live data. Do not
add dependencies you do not need. Do not overengineer.

Design: no generic SaaS homepage. No hero headline, subcopy, dual CTAs,
floating mockup, feature-card grid — that pattern is a design failure here. The
map is the product surface; there is no dashboard shell. Mobile is a primary
mode inside ChatGPT, so 390x844 proof is required whenever the product surface
changes. `DESIGN.md` owns the durable visual and interaction system; read it
before changing the product surface.

Copy: direct and human. No "seamless", "empower", "leveraging",
"revolutionary", or corporate filler.

Browsing: use `/browse` from gstack. Never use `mcp__claude-in-chrome__*`.

## After a patch

Update `docs/STATUS.md`. It is the only mutable status file in the repo and it
is capped at 200 lines. Do not start a second status document. Do not update
`artifacts/current-update.json` — it is a retired packet.

If any document or executable knowledge source changed, run `pnpm brain:build`
and `pnpm brain:verify`. Commit the generated registry with the source change.

Report what changed, what you verified with which command and which exit code,
and what you left undone.
