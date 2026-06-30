# Atlas Integration QA Playbook

Purpose:
Keep Atlas fast without letting parallel threads blur ownership, skip gates, or
ship unverified slices.

Owner:
Integration/QA captain.

## Current Baseline

Public backend:
`https://atlas-backend-production-e6fc.up.railway.app`

Active deployed tool surface:
- `select_county`
- `ask_county_question`
- `render_voxel_county`
- `lookup_world_places`
- `preview_scout_drop`
- `preview_campaign_engine`
- `get_upgrade_options`

Current maturity:
E8.6 is deployed as M1 Curated Alpha. E9 planning is docs-only and remains behind
`HUMAN_APPROVAL_BEFORE_PERSISTENCE` and `HUMAN_APPROVAL_BEFORE_MONEY`.

## Worker Handoff Format

Every worker thread should finish with:

- Quest name.
- Current maturity and target maturity.
- Human approval gate.
- Files changed.
- What works now.
- What was skipped.
- Verification commands and exact results.
- Browser QA evidence if UI changed.
- Merge risks.
- Whether the tree is clean.
- Next quest.

The captain should not merge or accept a worker slice that omits verification.

## Intake Checklist

Before reviewing a worker slice:

1. Run `git status --short`.
2. Identify whether files are worker-owned or shared.
3. Inspect `git diff --stat`.
4. Read every changed file in the worker-owned slice.
5. Confirm `docs/BUILD_LOG.md` and `docs/NEXT_QUESTS.md` are updated when a
   patch landed.
6. Confirm `docs/DECISIONS.md` is updated only when a durable product or
   architecture choice changed.
7. Confirm no approval gate was crossed by implication.

## Rejection Rules

Reject or send back any worker slice that:

- adds persistence without `HUMAN_APPROVAL_BEFORE_PERSISTENCE`,
- adds Stripe checkout, billing sessions, products, prices, Customer Portal, or
  webhooks without `HUMAN_APPROVAL_BEFORE_MONEY`,
- adds evidence or XP without ownership and idempotency tests,
- adds automation, posting, DMs, scraping, or ad execution,
- exposes raw provider payloads to React, Pixi, `VoxelScene`, or
  `CityWorldScene`,
- changes MCP behavior without verifier updates,
- changes the map without desktop and mobile browser QA,
- brings back dashboard/report/card shell framing as the default UI,
- leaves stale build-log or next-quest docs.

## Verification Matrix

### Docs-only slice

Run:

```powershell
pnpm --dir packages/core test
git diff --check
```

Use for:
- planning docs
- approval packets
- prompt packs
- issue docs

### Tool or server slice

Run:

```powershell
pnpm --dir packages/core test
pnpm typecheck:starter
pnpm build:server
$env:ATLAS_MCP_URL="http://127.0.0.1:<port>/mcp"; pnpm verify:mcp
$env:ATLAS_MCP_URL="http://127.0.0.1:<port>/mcp"; pnpm verify:submission
```

Also run public verification after deploy:

```powershell
$env:ATLAS_MCP_URL="https://atlas-backend-production-e6fc.up.railway.app/mcp"; pnpm verify:mcp
$env:ATLAS_MCP_URL="https://atlas-backend-production-e6fc.up.railway.app/mcp"; pnpm verify:submission
```

### Preview/UI slice

Run:

```powershell
pnpm typecheck:starter
pnpm build:starter
$env:ATLAS_PREVIEW_URL="http://127.0.0.1:<port>/preview"; pnpm verify:preview:http
```

Browser QA must cover:
- desktop preview loads one full-screen Pixi canvas
- mobile `390x844` has no horizontal overflow
- no visible old language returns: `dashboard`, `report`, `campaign`, `signal`,
  `risk`, `tactical`, `board`
- no console errors after reload
- place selection works
- sticker drop works
- note save works

### Deploy slice

Run:

```powershell
railway up --detach --service atlas-backend --environment production --message "<message>"
```

Then poll public verification:

```powershell
$env:ATLAS_MCP_URL="https://atlas-backend-production-e6fc.up.railway.app/mcp"; pnpm verify:mcp
$env:ATLAS_MCP_URL="https://atlas-backend-production-e6fc.up.railway.app/mcp"; pnpm verify:submission
$env:ATLAS_PREVIEW_URL="https://atlas-backend-production-e6fc.up.railway.app/preview"; pnpm verify:preview:http
```

Use gstack browser QA after the public preview changes.

## Active Worker Lanes

### E7.5 Visual/Product Feel

Allowed:
- map visual polish
- Clawd identity
- sticker/note feel
- mobile HUD polish
- place tray clarity
- sprite/primitive polish

Blocked:
- backend tool changes
- submission JSON changes unless a real UI contract changes
- persistence
- Stripe
- XP/evidence
- dashboard shell

Required verification:
- `pnpm typecheck:starter`
- `pnpm build:starter`
- local `verify:preview:http`
- desktop and mobile browser QA

### E9.3 Hosted Clawd Persistence Gate

Allowed:
- approval checklist
- implementation prompt
- storage/auth decision framing
- usage-limit decision framing

Blocked:
- code
- migrations
- auth provider setup
- database client setup
- Stripe checkout/webhooks
- evidence/XP

Required verification:
- docs-only verification if files change

## Captain Status Template

Use this update while workers run:

```md
Integration status:
- Tree:
- Active worker threads:
- Last public MCP:
- Last public submission:
- Last public preview:
- Gate risks:
- Next captain action:
```

## Merge Order

1. Docs-only gate thread if it changed only docs.
2. Visual thread after browser QA.
3. Integration/public verification after any app-code merge.
4. Deploy only after local checks pass and the user wants public update.

Do not merge a visual and tool/backend slice at the same time. Verify one lane,
then move to the next.
