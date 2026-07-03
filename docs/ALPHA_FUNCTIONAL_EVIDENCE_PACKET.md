# Atlas Functional Alpha Evidence Packet

Owner: Axiom - Atlas GM / Principal Systems Architect
2IC: Mira - Main Product Software Engineer / Human Experience 2IC
Status: Engine Beta RC evidence green; strict selected-RC split passes locally.

Last updated: 2026-07-02.

## 0.18A RC Freeze Verdict

Verdict: local Alpha RC freeze proof is green. The current
`Atlas-alpha-path-b-rc` worktree is the public Alpha candidate for deploy
discussion.

Public Alpha promise now proven locally:

- Riverside/Eastvale is the only playable county/district surface.
- California coverage is honest: 58 indexed counties, 1 playable county, 57
  shell counties.
- Orange shell and Unknown/L0 states remain honest and recoverable.
- Scout Drop and Campaign Preview expose a typed session-only Alpha boundary:
  no saves, no action execution, no XP, Hosted Clawd required before saved
  state.
- The seven MCP tools remain unchanged.
- Large scene data remains widget-only; tool `structuredContent` stays concise.
- Provider lookup remains lookup-only and cannot create playable coverage or
  scene geometry.

0.18A local proof commands:

| Command | Result |
| --- | --- |
| `pnpm --dir packages/core test` | Passed, 15 files / 64 tests |
| `pnpm typecheck:starter` | Passed |
| `pnpm build:starter` | Passed |
| `node scripts\verify-scout-campaign-alpha-loop.mjs --json-only` | Passed |
| `node scripts\verify-tool-result-shape.mjs --json-only` | Passed |
| `node scripts\verify-provider-boundaries.mjs --json-only` | Passed |
| `node scripts\verify-no-google-in-renderer.mjs --json-only` | Passed |
| `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only` | Passed, 143 files / 0 blockers / 0 unknowns |
| `ATLAS_PREVIEW_URL=http://127.0.0.1:8787/preview pnpm verify:preview:http` | Passed, preview bytes 928473 |
| `ATLAS_MCP_URL=http://127.0.0.1:8787/mcp pnpm verify:mcp` | Passed, 7 tools |
| `ATLAS_MCP_URL=http://127.0.0.1:8787/mcp pnpm verify:submission` | Passed, 7 tools |
| `ATLAS_BASE_URL=http://127.0.0.1:8787 node scripts\verify-engine-beta-coverage.mjs` | Passed |

0.18A local screenshot root:

`C:\Users\mzwin\AppData\Local\Temp\atlas-alpha-completion-local-proof`

Required screenshot evidence in that folder:

- Riverside desktop product loop.
- Riverside mobile `390x844` product loop.
- Residential-detail desktop/mobile.
- Orange shell desktop/mobile with recovery CTA.
- Unknown/L0 desktop/mobile with recovery CTA.
- County switcher desktop/mobile for Riverside, Orange, and Unknown/L0.

Blocked from this Alpha:

- Public Anaheim/Ontario promotion.
- Durable saves or account persistence.
- Hosted Clawd implementation.
- Stripe, XP, evidence, OAuth, automation, reports, exports.
- Cars, humans, filler props, dashboard UI, provider geometry, or public debug
  overlays.

Next release action:

Deploy this RC from `C:\Users\mzwin\Documents\Atlas-alpha-path-b-rc`, then rerun
the same preview/MCP/submission/browser proof against the Railway URL.

## 0.19A / 0.20A Railway Deploy And Public Proof

Verdict: public Alpha proof passed after Railway deploy.

Public URL:

`https://atlas-backend-production-e6fc.up.railway.app`

Railway deploy:

- Project: `atlas-chatgpt-app`
- Environment: `production`
- Service: `atlas-backend`
- Deploy command: `railway up --detach --message "Atlas Alpha 0.18A RC freeze"`
- Build logs: `https://railway.com/project/e2a26709-5bf0-499e-986f-75e6081305f0/service/d5aee313-8558-47e6-9b41-a517b871a6b8?id=8165e343-e411-4646-9bc0-a5faa8cda5af&`
- Healthcheck: passed on `/health`; container started with
  `Atlas MCP server listening on http://localhost:8080/mcp`.

Public proof commands:

| Command | Result |
| --- | --- |
| `ATLAS_PREVIEW_URL=https://atlas-backend-production-e6fc.up.railway.app/preview pnpm verify:preview:http` | Passed, preview bytes 928473 |
| `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp ATLAS_VERIFY_RADIUS_METERS=49001 pnpm verify:mcp` | Passed, 7 tools |
| `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp ATLAS_VERIFY_RADIUS_METERS=49002 pnpm verify:submission` | Passed, 7 tools |
| `ATLAS_BASE_URL=https://atlas-backend-production-e6fc.up.railway.app node scripts\verify-engine-beta-coverage.mjs` | Passed |

Public coverage result:

- California indexed counties: 58.
- Playable counties: 1.
- Shell counties: 57.
- Riverside tier: `L2_CURATED_DISTRICT`.
- Orange tier: `L1_COUNTY_SHELL`.
- Unknown county tier: `L0_UNSUPPORTED`.
- MCP tools: `ask_county_question`, `get_upgrade_options`,
  `lookup_world_places`, `preview_campaign_engine`, `preview_scout_drop`,
  `render_voxel_county`, `select_county`.

Public screenshot root:

`C:\Users\mzwin\AppData\Local\Temp\atlas-alpha-completion-public-proof`

Public screenshot evidence in that folder:

- Riverside desktop product loop.
- Riverside mobile `390x844` product loop.
- Residential-detail desktop/mobile.
- Orange shell desktop/mobile with recovery CTA.
- Unknown/L0 desktop/mobile with recovery CTA.
- County switcher desktop/mobile for Riverside, Orange, and Unknown/L0.

Verification note:

When running public coverage, do not force one shared
`ATLAS_VERIFY_RADIUS_METERS` value for nested MCP and submission checks. The MCP
step can warm lookup cache before submission checks the first lookup miss. Let
the wrapper choose separate default radii, or run MCP/submission separately with
valid radii at or below the schema max of `50000`.

## 0.23E Hidden Venue Authorship Deploy And Public Proof

Verdict: 0.23E is deployed and publicly proven. Public Riverside/Eastvale
remains the only playable district. Anaheim is still hidden, non-public, and
non-playable.

Public URL:

`https://atlas-backend-production-e6fc.up.railway.app`

Railway deploy:

- Project: `atlas-chatgpt-app`
- Environment: `production`
- Service: `atlas-backend`
- Deploy command: `railway up --detach --message "Atlas 0.23E hidden venue authorship and July 4 roadmap"`
- Build logs:
  `https://railway.com/project/e2a26709-5bf0-499e-986f-75e6081305f0/service/d5aee313-8558-47e6-9b41-a517b871a6b8?id=5ae19e5c-51c3-4b14-9f40-0ed11a318a21&`

Public proof commands:

| Command | Result |
| --- | --- |
| `ATLAS_PREVIEW_URL=https://atlas-backend-production-e6fc.up.railway.app/preview pnpm verify:preview:http` | Passed, preview bytes 929902 |
| `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:mcp` | Passed, 7 tools |
| `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:submission` | Passed, 7 tools |
| `ATLAS_BASE_URL=https://atlas-backend-production-e6fc.up.railway.app node scripts\verify-engine-beta-coverage.mjs` | Passed |
| `node scripts\verify-anaheim-draft-scene.mjs --url https://atlas-backend-production-e6fc.up.railway.app/preview?atlasNoLabels=1 --no-label-crops` | Passed |
| `node scripts\prepare-second-district-visual-packet.mjs --district anaheim ...` | Passed |
| `node scripts\verify-second-district-visual-packet.mjs --district anaheim --screenshots ... --json-only` | Passed |
| `node scripts\verify-scout-campaign-alpha-loop.mjs --json-only` | Passed |

Public screenshot roots:

- Coverage:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-023e-hidden-venue-authorship-public\coverage`
- Hidden Anaheim no-label draft:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-023e-hidden-venue-authorship-public\anaheim-draft-no-label`
- Visual packet:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-023e-hidden-venue-authorship-public\visual-packet`

0.23E result:

- Seven MCP tools unchanged.
- Public Riverside/Eastvale product loop remains green.
- Orange shell and Unknown/L0 recovery remain mobile-readable.
- Scout Drop still points to Campaign Preview; Campaign Preview still points to
  Hosted Clawd upgrade options.
- Anaheim hidden packet outcome: `HIDDEN_DRAFT_ONLY`.
- Anaheim promotion status: `promotionReady: false`, `publicPlayable: false`.
- No selected-place tray, pins, actors, session tools, or public switcher state
  for Anaheim/Ontario.
- No saves, execution, XP, evidence, paid ads, posting, messaging, automation,
  Hosted Clawd persistence, provider geometry, or public debug overlay.

Next post-0.23E action:

Build `0.24E Second-District Promotion Readiness Aggregator`. It must combine
source anchors, hidden draft proof, visual packet, product proof, provider
boundary, split guard, and public UI readiness into one machine-readable report
and keep `readyForPlayablePromotion: false` until every gate passes.

## Current Verdict

Engine Beta 2A product verdict: human-approval-ready.

The current Engine Beta 2A building grammar pass preserves the Alpha
selected-place, sticker/pin, and session note loop while improving the map read.
Desktop and mobile product-loop screenshots are showable for a ChatGPT app
approval conversation. No P0 product comprehension fix is required before human
approval or deploy discussion.

Mira product verdict: Atlas Functional Alpha is human-showable with caveats.
The current screenshots prove a real map-first loop: selected place, visible
tray, sticker/pin increment, session note save, and short session-only boundary
copy.

P0 release verdict: ready for human review. The selected Engine Beta RC split
passes locally under `engine-beta-renderer` mode with no blockers.

What is green:

- Public MCP flow passes against Railway.
- Public ChatGPT submission contract verifier passes.
- Public `/preview` HTTP verifier passes.
- Local starter typecheck and build pass.
- Core tests pass.
- Mira's product-surface hardening gives stable browser hooks and visible
  session-only note/pin language.
- Desktop and mobile screenshots prove the map-first loop after real
  interaction.
- Local Engine Beta RC split guard passes with 16 files and 0 blockers.

What is blocked:

- No package/lock/env/server/migration/Hosted Clawd/persistence blocker is
  present in the selected Engine Beta RC.
- Final deploy still needs the normal Axiom release call after Lumen/Mira/Forge
  audits are reconciled.

## ChatGPT Entry Surface And Tool Language Proof

E15.3 aligns the ChatGPT entry surface and tool responses with the public
product model: Riverside/Eastvale is playable now, California shell counties
are browse-only, and lookup results are not saved or coverage proof. Local MCP
verification now asserts this language for `select_county`,
`render_voxel_county`, `ask_county_question`, and `lookup_world_places` without
changing the seven-tool list or structuredContent boundaries.

The public path rail is also browser-protected: Play restores Riverside,
Browse opens the Orange shell proof state, and Lookup asks ChatGPT for
lookup-only Eastvale places while keeping the user on the playable Riverside
map. The 0.22E visible entry rail says: `Play Riverside now. Browse CA shells.
Lookup without saving.` Desktop and `390x844` mobile proof keep the rail
compact, above the tray, inside the first viewport, with Orange/Unknown recovery
visible and no fake shell tools.

Exact tool-response proof:
`docs/CHATGPT_ENTRY_SURFACE_PROOF.md`

Golden prompt product proof:
`C:/Users/mzwin/AppData/Local/Temp/atlas-e156-golden-prompt-product-proof/anaheim-product-proof.json`

E15.6 proves five realistic ChatGPT prompts without promoting Anaheim:
direct Riverside play, Orange shell browsing, unknown county recovery, lookup
without saves/readiness claims, and a negative Anaheim-playability prompt. The
machine-readable proof is intentionally conservative: `proofStatus: "passed"`
but `promotionReady: false`, `publicPlayable: false`, and
`miraAcceptance: false`.

Latest local proof root:
`C:/Users/mzwin/AppData/Local/Temp/atlas-e153-entry-surface-local`

## Human-Visible Product Evidence

Engine Beta 2A local product-loop screenshots:

- Desktop:
  `C:/Users/mzwin/AppData/Local/Temp/atlas-engine-beta-2a-building-grammar-product-loop-final/alpha-product-loop-desktop-1280x720.png`
- Mobile:
  `C:/Users/mzwin/AppData/Local/Temp/atlas-engine-beta-2a-building-grammar-product-loop-final/alpha-product-loop-mobile-390x844.png`

Mira Engine Beta 2A screenshot read:

- Desktop is human-approval-ready: the selected Eastvale Core tray stays
  readable, the saved note/pin state is obvious, and the building grammar gives
  the map a more intentional neighborhood read without turning into a dashboard.
- Mobile is human-approval-ready: the tray, counts, session-only boundary,
  latest note, input, and pin controls remain in the first viewport.
- P1 caveat: the terrain still has a broad repeated-grid feel and the building
  set is not final art quality. This is not a product-loop blocker for Engine
  Beta 2A.
- Product call: no quick UI fix is recommended before human approval. The next
  risk is release/split discipline, not interaction comprehension.

Previous Engine Beta local product-loop screenshots:

- Desktop:
  `C:/Users/mzwin/AppData/Local/Temp/atlas-engine-beta-production-upgrade-product-loop-final/alpha-product-loop-desktop-1280x720.png`
- Mobile:
  `C:/Users/mzwin/AppData/Local/Temp/atlas-engine-beta-production-upgrade-product-loop-final/alpha-product-loop-mobile-390x844.png`

Mira Engine Beta screenshot read:

- Desktop is approval-ready: the map is cleaner and more authored, the selected
  Eastvale Core tray remains readable, and the saved note/pin state is obvious.
- Mobile is approval-ready: the tray, counts, session-only boundary, latest
  note, input, and pin controls remain in the first viewport.
- Product caveat: the engine is still Eastvale/Riverside-first. USA release must
  use coverage tiers and unsupported-state behavior before claiming national
  parity.

Desktop screenshot:

`C:/Users/mzwin/AppData/Local/Temp/atlas-alpha-product-loop-hardening/alpha-product-loop-desktop-1280x720.png`

Mobile screenshot:

`C:/Users/mzwin/AppData/Local/Temp/atlas-alpha-product-loop-hardening/alpha-product-loop-mobile-390x844.png`

Observed in the screenshots:

- Map-first Eastvale/Riverside world loads.
- Selected place tray is visible for Eastvale Core.
- Pin count is visible.
- Note count is visible.
- Latest saved note is visible.
- Session-only boundary copy is visible: "Pins and notes stay in this chat."
- Mobile `390x844` retains the tray, controls, map canvas, and saved note.

Mira taste notes:

- Desktop is showable: the map remains the main surface, and the tray reads as
  a compact tool layer rather than a dashboard.
- Mobile is showable: the selected place, counts, session boundary, saved note,
  input, and pin controls all fit in the first viewport.
- Caveat: visual polish is functional Alpha level, not final art approval.
  Buildings and tile grammar can improve later, but they do not block this
  functional product packet.
- No additional UI fix is recommended before the release split. More changes
  now would create extra split risk without materially improving the approval
  story.

Lumen visual showability note:

- First 3-second read: this is a map-first Eastvale toy-world with a working
  place tray, session pins, and saved note state. It does not read as a generic
  dashboard or SaaS shell.
- Functional Alpha verdict: showable with caveats. The visual quality supports
  product-function approval, not final art approval.
- Release-blocking visual issues: none in these screenshots. The canvas is
  nonblank, the world remains dominant, the tray is legible on desktop and
  mobile, and session-only note/pin copy is visible.
- Backlog visual issues: building modules still look broad and procedural,
  tile grammar is not yet production-art quality, and the world lacks the
  tactile authored material depth shown in the north-star references.
- Highest-leverage next visual slice after functional readiness: rowhome-only
  production renderer intake spike using
  `docs/brain/THREE_ASSET_PRODUCTION_INTAKE_SPEC.md`, with baseline/after
  desktop and mobile screenshots and primitive fallback proof.
- No-go line: do not start E7.39, broad renderer port, new assets/modules, or
  another art tunnel during Functional Alpha approval.

## Commands Verified

| Command | Result |
| --- | --- |
| `pnpm typecheck:starter` | Passed |
| `pnpm build:starter` | Passed |
| `pnpm test:core` | Passed, 8 files / 25 tests |
| `pnpm verify:preview:http` | Passed locally, city-world markup present |
| `ATLAS_MCP_URL=http://127.0.0.1:8787/mcp pnpm verify:mcp` | Passed locally with 7 tools |
| `ATLAS_MCP_URL=http://127.0.0.1:8787/mcp pnpm verify:submission` | Passed locally |
| `node scripts/verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-renderer` | Passed locally, 16 files / 0 blockers |
| `node scripts/verify-alpha-public-sanity.mjs` | Passed public MCP/submission/preview sanity |
| `node scripts/verify-alpha-product-loop.mjs --url http://127.0.0.1:8799/preview --screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-alpha-rc-path-b-product-loop` | Passed clean RC desktop and mobile product-loop browser proof |
| `node scripts/verify-alpha-rc-split.mjs --json-only` | Passed staged mode with no staged files |
| `node scripts/verify-alpha-rc-split.mjs --working-tree --json-only` | Use strict `engine-beta-renderer` mode for this RC |

Public sanity details:

- Public base: `https://atlas-backend-production-e6fc.up.railway.app/`
- MCP tools: 7
- Public preview bytes: 825814
- `lookup_world_places` returned 20 places during verification.

Product-loop verifier details:

- Script: `scripts/verify-alpha-product-loop.mjs`
- Default target: `ATLAS_PREVIEW_URL` or `http://127.0.0.1:8787/preview`
- Usage:

```bash
node scripts/verify-alpha-product-loop.mjs --url http://127.0.0.1:8799/preview --screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-alpha-rc-path-b-product-loop
```

- Verifies desktop `1280x720` and mobile `390x844`.
- Checks map shell, selected place tray, zoom clicks, canvas drag, sticker drop,
  pin count increment, note input/save, note count increment, latest note visible
  in viewport, session-only boundary copy, one canvas, no horizontal overflow,
  and clean browser console.
- Screenshot outputs:
  - `C:/Users/mzwin/AppData/Local/Temp/atlas-alpha-rc-path-b-product-loop/alpha-product-loop-desktop-1280x720.png`
  - `C:/Users/mzwin/AppData/Local/Temp/atlas-alpha-rc-path-b-product-loop/alpha-product-loop-mobile-390x844.png`

## Alpha Boundary

Approved Alpha claim:

Atlas opens a map-first Riverside/Eastvale proof slice inside ChatGPT. Users can
inspect the local world, use the tool surface, drop session-only pins, and save
session-only notes during the current chat.

Do not claim:

- durable saved notes or accounts;
- public Hosted Clawd access;
- Stripe, checkout, billing, XP, evidence, reports, exports, OAuth, or
  automation;
- final voxel art quality.

## Engine Beta / USA Scale Product Gate

`docs/USA_PUBLIC_RELEASE_ENGINE_PLAN.md` is product-ready as a direction doc.
It correctly frames USA scale as bounded county/district compilation with
explicit coverage tiers, not a giant national canvas or fake full coverage.

Mira approval conditions for the next USA-scale slices:

- Keep the app map-first: full-screen Pixi map, small HUD/tray, no dashboard
  shell.
- Keep session-only public state until persistence is explicitly reopened.
- Unsupported and low-tier counties must say what is not ready instead of
  inventing places or confidence.
- Each public-quality county needs desktop and `390x844` product-loop proof.
- No payment, XP, evidence, reports, exports, automation, OAuth, or Hosted Clawd
  public UX may appear in the visible Alpha/Engine Beta flow.

Mira rejection line:

Reject any USA-scale slice that improves art or data coverage while making the
selected-place tray, sticker/pin, note save, session-only copy, or unsupported
coverage state harder for a user to understand.

## Release Split Decision

There are two valid next paths.

### Path A - Public-Green Docs-Only Alpha Packet

Use the already-deployed public app as the functional surface. Stage only the
reviewed release-support docs/scripts after hunk review. No deploy is needed if
the public app remains green.

This path is fastest and lowest risk, but it does not ship Mira's new
product-surface QA hooks or visible session-only tray copy.

### Path B - Clean Product-Code RC

Cut a clean candidate that includes only Mira's Alpha Product Loop Hardening
plus the necessary current renderer baseline, excluding visual lab/module atlas,
Hosted Clawd, package/lock, DB env, migrations, and parked backend work.

This path is better for the product because the session-only boundary becomes
visible in the deployed UI, but it needs careful hunk/file splitting before any
deploy.

Axiom recommendation:

Use Path B if we are aiming for a stronger human Alpha approval packet. Use Path
A only if the immediate goal is submission paperwork without changing public
runtime.

Mira recommendation:

Path B is worth the split/deploy work if Forge can isolate it cleanly. The
visible session-only tray copy and stable QA hooks are a real product gain, not
cosmetic churn. If Forge cannot isolate the web files without dragging renderer,
visual-lab, package/lock, or Hosted Clawd changes, fall back to Path A and keep
this product hardening as the first post-Alpha patch.

Forge mechanical read:

Path B is mechanically viable if cut from a clean branch/worktree and limited to
the current `web/src/CityWorldView.tsx` and `web/src/styles.css` hunks. Those
hunks add browser proof hooks, selected-place tray state, visible session-only
copy, latest-note display, pin/note counts, save-note copy, mobile tray
containment, and supporting tray/control styles. They do not require Hosted
Clawd, package/lock/env, migrations, module-atlas files, or core
renderer/schema changes.

Path B is not safe as whole mixed-tree staging. Use:

```bash
node scripts/verify-alpha-rc-split.mjs --rc-mode mira-tray-hardening --strict-selected-rc --json-only
```

Default F2 mode remains conservative and continues to park
`web/src/CityWorldView.tsx` and `web/src/styles.css`.

## Current Blockers

- Exact clean product-code RC source is not isolated yet.
- `web/src/CityWorldView.tsx` and `web/src/styles.css` contain useful product
  hardening but are path-classified as renderer parked by the split guard, so
  they need explicit Axiom/Mira/Forge reclassification or a clean branch.
- Shared docs contain mixed history and need hunk review.
- Hosted Clawd/package/lock/env work remains parked.
- Visual lab/atlas work remains parked.

## Next Owner Actions

Mira:

- Verdict complete: current screenshots are human-showable for Functional Alpha
  with caveats.
- No further UI fix recommended before the split.
- Repeatable browser verifier complete:
  `scripts/verify-alpha-product-loop.mjs`.
- Next Mira-owned product quest: run this verifier against the clean Path B RC
  candidate after Forge isolates it.

Forge:

- Produce the exact clean Product-Code RC plan for Path B, or confirm Path A is
  the only mechanically safe option without a new branch/worktree.
- Keep `scripts/verify-alpha-rc-split.mjs` as the mechanical guard.

Lumen:

- Stay out of Functional Alpha RC unless asked for screenshot critique.
- If visual code reopens later, use
  `docs/brain/THREE_ASSET_PRODUCTION_INTAKE_SPEC.md` and only test rowhome
  first.

## 0.21A Alpha Handoff Lock

Public Alpha baseline:

- URL: `https://atlas-backend-production-e6fc.up.railway.app`
- Public proof screenshot root:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-alpha-completion-public-proof`
- Public verifiers passed after deploy:
  - `pnpm verify:preview:http`
  - `pnpm verify:mcp`
  - `pnpm verify:submission`
  - `node scripts\verify-engine-beta-coverage.mjs`

What works:

- Riverside/Eastvale is the only public playable district.
- California has 58 indexed counties: 1 playable county and 57 shell counties.
- Orange shows honest `L1_COUNTY_SHELL` coverage with recovery to
  Riverside/Eastvale.
- Unknown counties show `L0_UNSUPPORTED` coverage with recovery to
  Riverside/Eastvale.
- Scout Drop and Campaign Preview are session-only Alpha previews.
- The seven MCP tools remain stable.

Parked scope:

- Anaheim/Ontario public promotion.
- Durable saved state, Hosted Clawd, DB persistence, Stripe, XP, evidence,
  OAuth, automation, reports, exports, and broad provider-backed coverage.

Known weaknesses:

- Voxel object art is still Engine Beta quality, not final public-quality art.
- Riverside remains the public quality anchor while Anaheim stays a hidden
  second-district candidate.
- Future entry/product changes must preserve map-first layout and mobile
  recovery visibility.

Accepted next spine:

Engine Beta. First public patch is `0.22E Public Product Entry Compression`;
second-district readiness continues hidden until promotion gates pass.

## 0.22E Local Public Product Entry Compression Proof

Verdict: local proof passed.

What changed:

- County switcher summary now says:
  `Play Riverside now. Browse CA shells. Lookup without saving.`
- Product path accessibility text keeps the safety boundary:
  `not saved, not coverage proof`.
- Shell and unsupported boundary copy is shorter:
  - `Indexed only. No saves, XP, evidence, or automation.`
  - `Not indexed yet. No saves, XP, evidence, or automation.`
- Source guidance now says `Playable: Riverside/Eastvale.`

Local proof commands:

| Command | Result |
| --- | --- |
| `pnpm --dir packages/core test` | Passed, 15 files / 64 tests |
| `pnpm typecheck:starter` | Passed |
| `pnpm build:starter` | Passed |
| `pnpm verify:preview:http` | Passed against `http://127.0.0.1:8787/preview`, preview bytes 928542 |
| `pnpm verify:mcp` | Passed against `http://127.0.0.1:8787/mcp`, 7 tools |
| `pnpm verify:submission` | Passed against `http://127.0.0.1:8787/mcp`, 7 tools |
| `node scripts\verify-county-switcher.mjs --url http://127.0.0.1:8787/preview --screenshots ...` | Passed desktop and mobile |
| `node scripts\verify-shell-county-widget.mjs --county orange-ca --expected-tier L1_COUNTY_SHELL --screenshots ...` | Passed desktop and mobile |
| `node scripts\verify-shell-county-widget.mjs --county made-up-ca --expected-tier L0_UNSUPPORTED --screenshots ...` | Passed desktop and mobile |
| `node scripts\verify-engine-beta-coverage.mjs` | Passed |
| `node scripts\verify-no-google-in-renderer.mjs --json-only` | Passed |
| `node scripts\verify-provider-boundaries.mjs --json-only` | Passed |
| `node scripts\verify-tool-result-shape.mjs --json-only` | Passed |
| `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only` | Passed, 143 files / 0 blockers / 0 unknowns |

Local screenshot root:

`C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-022e-entry-compression-local`

Important mobile proof:

- County switcher product path height: `33px`.
- County switcher product path remains fully visible in first viewport.
- Product path stays above the bottom tray.
- Orange shell and Unknown/L0 recovery CTAs remain visible in first viewport.
- No horizontal overflow.

## 0.22E Railway Deploy And Public Proof

Verdict: public proof passed after deploy.

Public URL:

`https://atlas-backend-production-e6fc.up.railway.app`

Railway deploy:

- Project: `atlas-chatgpt-app`
- Environment: `production`
- Service: `atlas-backend`
- Deploy command: `railway up --detach --message "Atlas 0.22E public entry compression"`
- Build logs:
  `https://railway.com/project/e2a26709-5bf0-499e-986f-75e6081305f0/service/d5aee313-8558-47e6-9b41-a517b871a6b8?id=e877cb4b-54ec-4a32-8f84-0c41583c93ac&`
- Deployment logs: container started and reported
  `Atlas MCP server listening on http://localhost:8080/mcp`.

Public proof commands:

| Command | Result |
| --- | --- |
| `pnpm verify:preview:http` | Passed against `https://atlas-backend-production-e6fc.up.railway.app/preview`, preview bytes 928542 |
| `pnpm verify:mcp` | Passed against `https://atlas-backend-production-e6fc.up.railway.app/mcp`, 7 tools |
| `pnpm verify:submission` | Passed against `https://atlas-backend-production-e6fc.up.railway.app/mcp`, 7 tools |
| `node scripts\verify-county-switcher.mjs --url https://atlas-backend-production-e6fc.up.railway.app/preview --screenshots ...` | Passed desktop and mobile |
| `node scripts\verify-engine-beta-coverage.mjs` | Passed |

Public screenshot root:

`C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-022e-entry-compression-public`

Public result:

- Seven MCP tools unchanged.
- Riverside/Eastvale remains the only playable public district.
- California coverage remains 58 indexed counties, 1 playable, 57 shell.
- Orange shell and Unknown/L0 keep recovery CTA visible on mobile.
- Public county switcher says:
  `Play Riverside now. Browse CA shells. Lookup without saving.`
- Lookup copy still says `not saved, not coverage proof`.
- No paid, persistence, XP, evidence, OAuth, automation, reports, exports, or
  public Anaheim/Ontario promotion.
