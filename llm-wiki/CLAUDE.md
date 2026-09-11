# Atlas Knowledge Base

> Schema document — read at the start of every session together with `wiki/index.md`.
> Update after every major compile, ingest batch, or structural change.

## Scope

What this wiki covers:
- The current ChatGPT Atlas app: read-only US Census geography, plates, place search, location truth
- Executable authority: tool surface, verifiers, document policy, local GBrain
- Hard stops and the 2026-07-25 pivot away from the voxel / Commons / Clawd product
- Sister GitHub surfaces (WebMCP challenge snapshot, voxel checkpoint) as entities, not as current law
- How to operate this wiki (`compile`, `ingest`, `query`, `lint`, `audit`)

What this wiki deliberately excludes:
- Restoring retired tools or paid / Google / Hosted Clawd surfaces
- Treating `docs/` archive titles as current instructions
- National road-chunk binaries, secrets, Railway tokens, `.env` files
- WikiQuest, Kit, T3, SBA Screen, or other sibling products

## Operations

This wiki follows the llm-wiki skill's five operations: `compile`, `ingest`, `query`, `lint`, `audit`.
Every operation appends an entry to `log/YYYYMMDD.md`.

Wiki root is `llm-wiki/` inside the Atlas repo, not the repo root. Repo-root
`AGENTS.md` remains the product router. This `CLAUDE.md` is only the wiki schema.

Canonical sources are **live repo files**. `raw/` holds pointer notes and
extracted quotes, not a second copy of the whole tree.

## Naming conventions

- **Concept pages** (`wiki/concepts/`): Title Case with underscores in filenames, e.g. `Current_Product.md`, linked as `[[Current_Product]]`.
- **Folder-split concepts**: when a topic would exceed ~1200 words.
- **Entity pages** (`wiki/entities/`): Proper names with underscores, e.g. `US_Census.md`.
- **Summary pages** (`wiki/summaries/`): kebab-case source slug.

All pages require YAML frontmatter: `title`, `type`, `created`, `updated`, `sources`, `tags`.

### Diagrams and formulas
- All diagrams are **mermaid**. No ASCII art.
- All formulas are **KaTeX**.

### Raw file policy
- Small text sources → `raw/<subfolder>/`.
- Large binaries / already-in-repo files → pointer at `raw/refs/<slug>.md` with `kind: ref` and `external_path` relative to the Atlas repo root.

## Current articles

### Concepts
- [[Current_Product]] — read-only Census atlas ChatGPT app
- [[Authority_Split]] — who owns facts vs status vs history
- [[Hard_Stops]] — retired surfaces that must not return
- [[Location_Truth]] — resolve or refuse
- [[Repository_Map]] — GitHub remotes and local trees

### Entities
- [[US_Census]] — geography and place-anchor source
- [[ChatGPT_Apps_SDK]] — host surface
- [[Railway]] — production host, not product law

### Summaries
- [[summaries/agents-md]] — product router
- [[summaries/status-2026-08-26]] — last STATUS pass before this snapshot

## Open research questions

- Has Location Truth been re-run since 2026-08-01?
- Is the OpenAI Apps challenge token set in production?
- Which README rewrite should replace the voxel-era public overview?
- How should the WebMCP challenge contract and the ChatGPT two-tool surface stay distinct without drifting back together?

## Research gaps

Sources to ingest:
- [x] `AGENTS.md` — current router
- [x] `docs/STATUS.md` — evidence
- [x] `CHATGPT.md` / `GITHUB.md` — handoff
- [ ] `scripts/lib/atlas-tool-surface.mjs` — executable tool list (quote, do not restate as a second table)
- [ ] `docs/brain/PROJECT_PLAN.md` — priorities
- [ ] `DESIGN.md` — visual system
- [ ] `chatgpt-app-submission.json` — store packet
- [ ] `docs/USA_ACCURACY_PROGRAM.md` — accuracy program
- [ ] `docs/legal/` — deployed policy pages

## Audit backlog

*(none)*

## Notes for the LLM

- Language: en
- Tone: direct, specific, no SaaS filler
- Depth: operator-level. Cite live files. If a machine-checkable fact lives in a script, link the script instead of copying it.
- Handling contradictions: current `AGENTS.md` + `docs/STATUS.md` win. Historical docs are provenance. State both, then mark the archive as historical.
- Never restore retired tools to make a stale document green.
