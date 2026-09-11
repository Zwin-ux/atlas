# Atlas status

The only mutable status file in this repo. Hard cap 200 lines. Everything here
was run or read on the date below, not copied from another document.

**Last verified: 2026-09-11 (orientation). Verifier table below is still the 2026-08-26 pass.**

## Where the work is

- **Repo: `C:\Users\mzwin\Documents\Atlas`.** Public remote `atlas` → `Zwin-ux/atlas`. Checkpoint remote `origin` → `Zwin-ux/atlas-alpha-engine-beta-checkpoint`. Frozen WebMCP candidate is a different repo.
- **Branch: `main`.** Tracked to `atlas/main`. Record the SHA from Git, not from this paragraph.
- Execution pack: `atlas-execution-kit/` (extracted from `Downloads\Atlas_Grok_Product_Execution_Kit.zip`). Does not replace `AGENTS.md`.
- Other worktrees exist (WebMCP, national-roads, fable slices). Leave them alone.
- `docs/RAILWAY_DEPLOY.md` is historical. Do not turn Google on.

## Execution checkpoint

Current scope: finish the read-only Census ChatGPT app (point-and-ask). Kit: `atlas-execution-kit/`.
Graph: `atlas-execution-kit/graph/release-graph.json`. Receipts: `artifacts/execution-receipts/`.
Active: AT-006 lead (DESIGN.md inline/fullscreen).
Blocked: AT-041/050–054 until owner host/deploy/portal permission.
Invalidated: none.
Last slice: AT-001/003/004 accepted. Work SHA `391d7caf76c9ca25bc7c3083aab6eb502e9a85a8`.
Preserve: do not reset sibling worktrees.
Failed/unrun: native workflow smoke; live MCP/Railway; AT-006 receipt.
Baseline: test:core 357; location-truth 0 wrong; build:starter 0; test:release-fixtures 10/10.
Next: finish AT-006, then AT-002 workflows, then AT-005/AT-007.
Owner gate: real ChatGPT / deploy / portal remain BLOCKED.

## Shipped surface

Two read-only MCP tools over US Census geography. Names live in
`scripts/lib/atlas-tool-surface.mjs`. Implementations are the two
`registerAppTool` calls in `server/src/atlasTools.ts`.

Working-tree Census anchors: 3,222 counties, 21,155 places
(`data/census/us-county-town-anchors.json` totals). HEAD still has 18,447
places. The submission packet now matches the working tree. `docs/` copies of
13,797 and 18,447 are stale.

## Verifier status

Run on 2026-08-22 from this working tree against `http://127.0.0.1:8787`.

| Command | Exit | What happened |
|---------|------|---------------|
| `pnpm verify:public-http` | **0** | Static: no retired HTTP mounts in `server/src/index.ts`. |
| `ATLAS_HTTP_URL=http://127.0.0.1:8787 pnpm verify:public-http` | **0** | Local live: retired paths 404; `/community` 308 to `/terms`; policy pages 200. |
| `ATLAS_HTTP_URL=https://atlas-backend-production-e6fc.up.railway.app pnpm verify:public-http` | **0** | Re-run after deploy `22d910c9`. Retired HTTP 404; `/community` 308. |
| `node scripts/verify-atlas-source-of-truth-drift.mjs` | **0** | Surface matches. Warning: 5 retired tool-name strings remain in dead code. |
| `pnpm verify:submission` | **0** | Green locally, then green on production MCP after deploy `22d910c9`. Challenge 404 (token unset). |
| `pnpm verify:mcp` | **0** | Green locally and on production. |
| `pnpm verify:location-truth` | not re-run | Last green 2026-08-01. Re-run before a release commit. |

## Open blockers

**1. PRODUCTION HONESTY — RESOLVED 2026-08-22.** `atlas-backend` production
deploy `22d910c9` SUCCESS. Live `ATLAS_HTTP_URL` public-HTTP gate exit 0:
checkout/Google/Commons/OAuth 404, `/community` 308 to `/terms`, policy
pages 200. `/ready` ok. `/preview` 200. `pnpm verify:mcp` and
`pnpm verify:submission` both exit 0 against the production MCP URL. The
listing and the live service now match, except the domain challenge.

Railway project `atlas-chatgpt-app` (`e2a26709`). Env strip (Google, Stripe,
Hosted Clawd) remains. Rotate those keys in their dashboards; Railway delete
does not revoke them.

**2. Dirty tree.** This deploy was the working tree, not a tagged SHA. Split
and commit before calling it a release.

**3. Domain challenge.** Route 404s until the OpenAI portal token is set as
`ATLAS_OPENAI_APPS_CHALLENGE_TOKEN`. Human/portal step.

**3b. Widget CSP (2026-08-22).** Dev-mode scan was the two-tool surface.
`connectDomains` was `[]`, so ChatGPT would CSP-block plate `fetch()` and
show a blank map. Source now allowlists `WIDGET_DOMAIN` for connect and
resource. Widget URI is `ui://widget/atlas-plate.html`. Shipped in production deploy `1a7490a1`. ChatGPT then failed with
"Failed to fetch template": the MCP resource existed but HTTP
`/widget/atlas-plate.html` 404ed, and cached sessions still asked for
the old city-world URI. Deploy `4d88e9ea` serves that HTML (plus the
legacy filename) with CORS, and both MCP resource URIs read. ChatGPT still
failed: it wants Apps SDK `text/html+skybridge` and an inlined bundle, not
MCP-Apps mime with external script tags. Deploy `681f6071` serves ~172KB
self-contained skybridge HTML. Deploy `776d7c3e` stamped `__ATLAS_API_BASE__`.
ChatGPT still showed "Atlas plate ready." (tool status text) with no
`/api/atlas` hits — the iframe was not fetching plates. Widget now ships a
visible debug strip plus `GET /api/widget-debug` beacon, and the inlined
bundle is a classic IIFE so sandbox ESM imports cannot fail silently.
Production deploy `c9c34c9a` SUCCESS. Live `/api/widget-debug` 204,
`/widget/atlas-plate.html` contains `atlas-boot` and stamps
`__ATLAS_API_BASE__` to the Railway origin.
**Retry on the old message keeps the cached template.** Refresh Atlas 2,
then a new chat.

**4. Dead code.** Retired tool-name strings still sit in `server/src/index.ts`.
Not registered. Safe to delete. Do not re-register.

## This pass (2026-08-22)

Unmounted `/api/atlas-commons/moderation` and
`/.well-known/oauth-protected-resource`. Dropped the Commons block from
`/ready`. Added `scripts/verify-public-http-surface.mjs`. Recut
`scripts/verify-mcp-flow.mjs`. CI no longer runs Hosted Clawd / Commons
tests or the Postgres smoke; it runs the public-HTTP gate instead. Packet
town count updated 18,447 → 21,155.

**Product pass 2026-08-22.** The ChatGPT widget is the product. Cut the
r/place town mosaic and the coverage lecture overlay. Plates now have a land/
water/seat key, a scale bar, and an approximate north mark. Opening a county
no longer flies to lon/lat 0,0 (`Number(null)` is 0). The SVG fills the
widget. Verified with Playwright screenshots of Riverside (phone+desktop),
Miami-Dade (phone), and the national plate (phone) at
`artifacts/plate-pass/`.

**Widget debug 2026-08-22.** Boot panel + React overlay print origin, apiBase,
host globals, and the last plate URL/error. Beacons land in Railway as
`widget_debug`.

**Local GBrain 2026-08-26.** `pnpm brain:build` now inventories every
repository-visible document plus the small executable authority set declared
in `scripts/lib/atlas-document-policy.mjs`. `pnpm brain:verify` fails on
missing sources, stale hashes, authority drift, or lost canonical files.
`pnpm brain:query -- "task terms"` ranks current and historical context without
promoting archive material. CI includes the authority drift gate. The local
project plan is canonical and connector-independent; Notion is optional.

**WebMCP pre-production design 2026-08-26.** Product direction is the Playable
Maproom for broad, curious ChatGPT users: one live map shared by human and
agent, with no school-only framing or pasted-on gamification. `DESIGN.md` now
defines the analog-field-atlas visual system. The proposed shared-state and
page-tool contract is awaiting user review in
`docs/superpowers/specs/2026-08-26-atlas-playable-maproom-design.md`. Desktop
and phone concepts are under `docs/designs/concept-art/`. The implementation
candidate reuses `GoogleChromeLabs/use-webmcp-tool`; a promise-rejection gap in
its registration hook is the planned upstream patch. No product code, upstream
issue/PR, deployment, or challenge submission was made in this pass.

**Concept exploration 2026-08-26.** Three new generated review artifacts live
under `docs/designs/concept-art/`: Survey Relay desktop, Midnight Signal
desktop, and a four-state Survey Plate phone board. Survey Relay is the
recommended production-light direction; the phone board owns loading,
ambiguity, and focus composition; Midnight Signal is a later dark-mode study.
They are directional documentation only, contain concept geography, and are
not imported by the product bundle.

**GitHub snapshot 2026-09-10.** The dirty ChatGPT-app working tree, LLM wiki
scaffold, and handoff files were committed and pushed to `Zwin-ux/atlas`.
That repo is **public** as of 2026-09-11 so ChatGPT can fetch it without
auth. This is still not a tagged release SHA. Portal challenge token,
Location Truth re-run, and the stale public README rewrite remain open.
Env strip and production deploy from the August pass stay as recorded above.

## What this file is for

A fresh agent should be able to read `AGENTS.md` and this file and know
everything true about the project. If you learn something true that is not
here, add it here. Do not start a second status document.
