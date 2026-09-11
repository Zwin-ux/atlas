# Atlas local GBrain

This folder is Atlas's repository-owned context layer. It makes the current
product easy for coding agents to enter without deleting the project's history
or trusting whichever old document has the strongest title.

It is deliberately local and boring: one plan, one policy, one generated
inventory, and one query command. It does not install global tooling, require
MCP, copy chat transcripts into the repo, or invent a second status system.

## Start here

1. Read `AGENTS.md`.
2. Read `docs/STATUS.md`.
3. Read `docs/brain/PROJECT_PLAN.md`.
4. Run `pnpm brain:verify`.
5. For a specific task, run `pnpm brain:query -- "your task terms"`.
6. Read only the current sources returned by the query. Historical results are
   provenance, not instructions.

## Authority split

- Executable code, JSON, and verification commands own machine-checkable facts.
- `AGENTS.md` owns agent routing and permanent product boundaries.
- `docs/STATUS.md` owns current local evidence and blockers.
- `docs/brain/PROJECT_PLAN.md` owns project planning, priority, and recorded
  human decisions.
- Active references support one bounded concern such as legal policy or release
  copy.
- Historical documents remain searchable, but never override the sources above.

Notion is an optional human mirror. Agents do not fetch it automatically, and
work never blocks when Notion or any MCP connector is unavailable.

## Commands

```powershell
pnpm brain:build
pnpm brain:verify
pnpm brain:query -- "location truth"
```

`brain:build` inventories every repository-visible Markdown, MDX, text, RST,
and AsciiDoc file, plus the small set of executable knowledge sources declared
in `scripts/lib/atlas-document-policy.mjs`.

It writes:

- `docs/brain/document-registry.jsonl` — one machine-readable record per source.
- `docs/brain/DOCUMENT_REGISTRY.md` — human summary, authority counts, and items
  that still need an explicit classification decision.

`brain:verify` fails when a source is missing from the registry, a removed file
is still indexed, content hashes drift, classifications change, or a required
canonical source disappears.

## Adding or changing documents

- Put current status only in `docs/STATUS.md`.
- Put planning and priority in `docs/brain/PROJECT_PLAN.md`.
- Put durable agent routing in `AGENTS.md`.
- Put machine-checkable facts in code, JSON, or a verifier.
- Preserve useful history; classify it instead of giving it a current-sounding
  title and hoping agents infer the date.
- After any document change, run `pnpm brain:build` and `pnpm brain:verify`.

Unmatched documents land in `review-required`. That is intentional. A new file
must earn authority explicitly rather than becoming product law by accident.
