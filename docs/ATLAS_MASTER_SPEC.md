# Atlas — Master Product & Engineering Spec (Build Bible)

Single source of truth for building Atlas into the best ChatGPT app: a **living
voxel atlas-encyclopedia**. Written so a coding agent (GPT-5.5 / codex) can
execute the build backlog (Part III) with minimal supervision.

- Vision + product decisions: `ATLAS_LIVING_ATLAS_ENCYCLOPEDIA_PRD.md` (owner-locked).
- Quality/perf backlog: `ATLAS_CHATGPT_APP_QUALITY_ROADMAP.md`.
- History: `BUILD_LOG.md`.
- This doc = current state (Part I) + product target (Part II) + executable build
  backlog (Part III) + agent guardrails (Part IV).

Last synced: 2026-07-04.

---

# PART I — CURRENT STATE (audited)

## 1.1 What Atlas is today
A native **ChatGPT app** (Apps SDK / MCP) that opens a county-scale **voxel
world** inside ChatGPT. Today it renders **Riverside/Eastvale** as an isometric
voxel city, answers closed-world county questions, and previews a Clawd
scout + 7-day campaign — **session-only, nothing saved**. Only one county is
playable; the engine is built to scale county → state → country → Earth.

## 1.2 Monorepo layout
```
packages/core     @atlas/core   — engine, world model, county packs, diagnostics (provider-FREE)
packages/geo      @atlas/geo    — Google Places adapter + mock, provider normalization (server-only)
packages/assets   @atlas/assets — atlas.manifest.json, SVG textures
packages/mcp                    — MCP helpers
packages/config                 — shared tsconfig/config
server            server/src/index.ts — MCP server + HTTP (/preview, /health, /mcp, /api/*)
web               web/src/*     — the ChatGPT widget (React + Pixi voxel renderer); built to web/dist
apps/web, apps/widget           — additional app surfaces
data/county_packs/*.json                    — curated county "volumes" (only riverside-ca.json today)
data/district_place_anchor_packs/*.json     — source-noted district anchor packs (anaheim, ontario)
scripts/verify-*.mjs, debug-city-world-engine.mjs — gates + diagnostics
docs/*.md                                   — specs, roadmaps, build log
```
Toolchain: **pnpm is NOT reliably on PATH.** Use local bins: `node`,
`packages/core/node_modules/.bin/tsc`, `.../vitest`, `node_modules/.bin/tsc`.
Build: `pnpm build:starter` (Railway runs this) = `build:web` (build:core + `node
scripts/build-web.mjs`) + `build:server` (build:core + build:geo + tsc server).

## 1.3 World model & coverage tiers
Scalable model: **country → state → county → district → place** (see
`packages/core/src/world/`: `nationalWorldService`, `californiaCountyIndex`,
`districtCandidatePack`, `districtCuratedPack`, `districtPlaceAnchorPack`,
`districtOwnerGateCutline`, `districtReadinessAggregator`).

Honest coverage tiers (never fake national playability):
- **L0_UNSUPPORTED** — not indexed. No scene, no canvas.
- **L1_COUNTY_SHELL** — indexed county shell, browse-only, no fake local world.
- **L2_CURATED_DISTRICT** — playable district with curated scene + source notes.
- **L3_PROVIDER_NORMALIZED** — provider-backed data normalized behind backend contracts.

Compiled scenes that exist:
- `city-world-riverside-ca-eastvale-alpha` — **playable** (the proof cell).
- `city-world-shell-orange-ca` — **L1 shell** (browse-only).
- `city-world-draft-orange-ca-anaheim-candidate` — **hidden draft** (non-playable).
- `city-world-draft-san-bernardino-ca-ontario-candidate` — **hidden draft**.
Hidden drafts stay hidden until a formal owner-gate ceremony (see §1.9); do NOT
promote them without it.

## 1.4 Data model (exact schemas — read source for field-level detail)
- **CountyPack** — `packages/core/src/county/schema.ts`. Fields: `county`,
  `state`, `slug` (`^[a-z0-9-]+$`), `version`, `lastUpdated`, `summary`,
  `mapNodes[]` (`{id, name, type, voxel{x,y,z}, scores{business:0-100},
  signals[], campaignSuggestion}`), `mapEdges[]` (`{from, to, type}`),
  `sources[]` (`{name, sourceType, ...}`), `confidenceNotes[]`. Loaded by
  `CountyPackService` from `data/county_packs/`.
- **DistrictPlaceAnchorPack** — `packages/core/src/world/districtPlaceAnchorPack.ts`
  + `data/district_place_anchor_packs/*.json`. Source-noted anchors;
  `anchorStatus: "source_noted_nonrenderable"`, `playableNow:false`,
  `renderableNow:false`, `sourceNotes[]` cite real public data.
- **CityWorldScene** — `packages/core/src/voxel/cityWorldTypes.ts`. terrainTiles,
  roadSegments, lots, buildings (with visualGrammar + objectKit), props, places,
  pins, actors, cameraPresets, coverage, hudDefaults, world (districts/places).
- **Building palette registry** — `packages/core/src/voxel/cityWorldPaletteRegistry.ts`
  mirrors `packages/assets/city-world/atlas.manifest.json` building palettes
  (byte-consistency enforced by `verify-public-object-kit-prefab-palette.mjs`).

## 1.5 MCP tool surface (8 tools — `server/src/index.ts`)
Exact input/output schemas live in `server/src/index.ts` (search each title);
codex should read them before editing. Behavior summary:
- **select_county** (~L1373) — open/select a county → returns coverage state +
  scene id; playable (Riverside) vs shell vs unsupported.
- **render_voxel_county** (~L1476) — (re)render/focus the voxel scene for the
  selected county.
- **ask_county_question** (~L1433) — closed-world Q&A from the curated pack.
  **Hardened (BUILD_LOG 192):** refuses out-of-world asks (hours/price/phone/
  population/weather/"list every business") instead of bluffing. Currently
  hardcodes `ALPHA_COUNTY_SLUG="riverside-ca"` in
  `packages/core/src/county/CountyQuestionService.ts` and refuses other slugs.
- **light_county** — lightweight county info.
- **lookup_world_places** (~L1329) — lookup-only nearby places; results NOT saved,
  NOT coverage proof (this is the seam that can use `@atlas/geo`/Google Places).
- **preview_scout_drop** (~L1539) — Clawd scout preview (opportunity lens → PAID).
- **preview_campaign_engine** (~L1596) — 7-day campaign preview (requires a scout
  drop first → PAID).
- **get_upgrade_options** (~L1659) — Hosted Clawd upgrade options.
Output convention: concise `structuredContent`, honesty copy in `text`, large
scene/debug data in `_meta`. Never leak compiler/GEOID/verifier jargon to public
copy. `initialize` returns tool-usage instructions (search "Use select_county").

## 1.6 The widget / HUD (`web/src/`)
- `main.tsx` — mounts React, reads `window.openai.theme`, stamps `data-theme`.
- `App.tsx` — routing: generated preview / coverage summary → `CountyCoverageView`;
  else `CityWorldView`. Default scene = `riversideDemoVoxelScene`. Session state
  (selectedPlaceId, notes, stickers) via widget state; **nothing persisted**.
- `CityWorldView.tsx` — the explore surface. Renders the voxel scene +
  `city-world-tray` (place type, label, description, `% active` pulse, pins/notes
  meta, session-boundary line "Pins and notes stay in this chat", note composer,
  sticker tools). **This tray is the surface where the encyclopedia knowledge
  card will live (Part III slice 2).** Tray is always-on (no collapsed state).
- `CityWorldRenderer.tsx` — Pixi voxel renderer (0.51E art, sprite.tint, camera
  presets, mobile-occlusion aware). ~950KB bundled (Pixi is the weight).
- `MapChrome.tsx` (zoom controls), `CountySwitcher.tsx`, `CountyCoverageView.tsx`,
  `PreviewPanel.tsx`, `cityWorldAtlasResolver.ts` (manifest → textures/palettes).
- Provider boundary: `web/src` + `packages/core` import ZERO `@atlas/geo`.

## 1.7 Render engine + honest diagnostics
- `debug-city-world-engine.mjs` → structural diagnostics (update string
  `postalpha-0.51e-engine-diagnostics`). Key metrics: terrainMassing,
  emptyBoard, buildingLotContact, lotRoadContact, **homeClonePressure /
  homeVariantCount** (0.51E honest-color work), firstViewportCompositionScore,
  mobile occlusion, no-label anchors, provider-boundary. Riverside now:
  homeClonePressure **0.074**, homeVariantCount **24**, 0 hard blockers.
- Diagnostics key on the EFFECTIVE rendered palette + silhouette bucket
  (`cityWorldPaletteRegistry.ts`, `cityWorldSilhouetteBucket`) so metrics match
  what the player sees (the honest-metric doctrine — extend it, never regress it).

## 1.8 What is deployed vs in-tree
- **Railway** project `atlas-chatgpt-app` / `production` / service `atlas-backend`,
  URL `https://atlas-backend-production-e6fc.up.railway.app`. Build
  `corepack enable && pnpm install --frozen-lockfile && pnpm build:starter`;
  start `pnpm start`; healthcheck `/health`.
- **Deployed (verified live):** 0.51E voxel art + `/preview` brotli/gzip
  compression (1,010,079 → 242,251 bytes on the wire).
- **In tree, ships next deploy:** `ask_county_question` honesty guard (Entry 192).
- **Env (server-only secrets):** `DATABASE_URL`, `GEO_DATA_ADAPTER`,
  `GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_LANGUAGE`, `GOOGLE_MAPS_REGION`,
  `HOSTED_CLAWD_INVITE_TOKEN`, `MCP_PATH`, `WIDGET_DOMAIN`.
- Deploy = owner runs `railway up` (agent is permission-gated on production deploy).

## 1.9 Gates & verifiers (keep green)
Run via `node scripts/<name>.mjs --json-only`. Core suite: `cd packages/core &&
node_modules/.bin/vitest run` (currently **87/87**).
- `verify-public-object-kit-prefab-palette` — object-kit families, palette
  cohesion, clone pressure ≤ 0.2, registry↔manifest byte-consistency.
- `verify-object-authorship-scene-grammar` — object families, homeVariantCount ≥ 8,
  homeClonePressure ≤ 0.2.
- `verify-render-command-layer-budget` — per-scene draw/layer budgets, no public
  clutter, provider-token rejection.
- `verify-parametric-generator` — parametric scene floors incl. homeClonePressure ≤ 0.35.
- `verify-face-orientation-source-contrast`, `verify-civic-venue-object-kit-contract`,
  `verify-object-kit-renderer-consumption`, `verify-tool-result-shape`,
  `verify-no-google-in-renderer`, `verify-provider-boundaries`,
  `verify-web-bundle-budget` (raw ≤ 1.15MB, brotli ≤ 320KB),
  `verify-mcp-flow`, `verify-submission`, `verify-preview-http`.
- `verify-engine-beta-coverage` — needs a LIVE server + pnpm (browser/screenshot
  gate); run by human/CI, not in the structural sweep.
- Owner-gate ceremony (second district): `verify-second-district-owner-gate-cutline`,
  `verify-second-district-readiness`, `verify-anaheim-promotion-readiness`,
  `select-second-district-owner-gate-next-axis`. **Anaheim is BLOCK_PROMOTION**
  on human owner acceptances (lumen/visual, mira/product, forge/release) — the
  next move is REQUEST_OWNER_REVIEW, not code. Do not self-accept.

## 1.10 Trust doctrine (load-bearing — never violate)
1. **Closed-world only.** Answers from curated source-noted data; never invented.
   `ask_county_question` refuses rather than bluffs.
2. **Honest coverage.** L0–L3 tiers; users always know playable vs shell vs
   unsupported. No fake national playability.
3. **Provider boundary.** `web/src` + `packages/core` import zero `@atlas/geo`;
   no `google.maps`/`places.googleapis.com` tokens in scene data (diagnostics
   `PROVIDER_PAYLOAD_LEAK` hard-block). Google Places lives server-side in
   `@atlas/geo` behind `GEO_DATA_ADAPTER`.
4. **Session-only by default**, explicit about it. Nothing saved.
5. **Honest metrics.** Diagnostics measure what the player actually sees.

---

# PART II — PRODUCT TARGET (the Living Atlas-Encyclopedia)

Full narrative in `ATLAS_LIVING_ATLAS_ENCYCLOPEDIA_PRD.md`. Condensed spec:

## 2.1 One-liner
A living atlas-encyclopedia: a beautiful voxel world you **explore**, an honest AI
that tells you **what's really there**, and a personal layer of **notes/pins** that
makes the world yours — inside ChatGPT. The moat: **it never lies.**

## 2.2 Lenses (owner-locked)
- **Explore — FREE, front door.** Wander the voxel world, read **broad, light,
  source-noted knowledge cards** (geography/history/landmarks/civic — NOT sales),
  follow serendipity ("did you know", wander).
- **Collection — FREE, session-only.** Notes / pins / stickers overlaid; nothing
  saved.
- **Opportunity (Clawd scout) — PAID ("Your Atlas").** The agent that does work:
  scout signals, campaign previews, quests. Never in a first-timer's face.

## 2.3 Content strategy (owner-locked)
- **Lighter cards across MANY MANY places** (breadth over depth).
- **Broad, not rigid/sales-focused.** Real wonder, not business pitches.
- Business `scores`/`signals`/`campaignSuggestion` fields serve only the PAID
  scout lens — never shown in free Explore.
- Growing coverage = **publishing the atlas place by place** from real open data
  (US Census place gazetteer, city open-data portals, OpenStreetMap,
  Wikipedia-as-source-note). Provider-free, honest by construction.

## 2.4 Free vs Paid
- **Free:** explore + honest ask + broad knowledge cards + session notes/pins.
- **Paid ("Your Atlas"):** the Clawd scouting agent (+ its power features).
  Notes stay session-only for now (persistence is a possible later paid add).

## 2.5 Roadmap phases
- **P0 (done):** proof cell, honest engine, 0.51E art, compression, honesty guard.
- **P1 The Living Volume:** knowledge-card layer + Explore-first HUD + generalize
  ask + "did you know"/wander + mobile framing fix.
- **P2 Publish the Atlas:** content pipeline → many light broad volumes.
- **P3 Your Atlas:** persistence (if pursued) — the saved collection; paid.
- **P4 The World:** county → state → country → Earth; playable promotions via
  owner gates; L3 provider-normalized where honest.

---

# PART III — BUILD BACKLOG (codex-executable slices)

Each slice: **Goal · Files · Changes · Acceptance · Verify · Constraints.**
Do slices in order; each must leave all gates in §1.9 green. After each slice,
run the relevant verifiers + `cd packages/core && node_modules/.bin/vitest run`.

## SLICE 1 — Broad knowledge-card schema layer  ⭐ start here
- **Goal:** add a light, source-noted, non-sales `knowledgeCard` to places so the
  map becomes an encyclopedia. Separable from the paid business fields.
- **Files:** `packages/core/src/county/schema.ts` (+ `types.ts`),
  `data/county_packs/riverside-ca.json`, `packages/core/test/county-pack.test.ts`.
- **Changes:** add optional `knowledgeCard?: { text: string (1–2 sentences,
  broad/non-sales), topic: "geography"|"history"|"landmark"|"civic"|"culture",
  sourceNoteIds: string[] }` to each `mapNode` (and/or a pack-level
  `placeKnowledge` map keyed by node id). Add a pack-level `sources[]` entry type
  that knowledge cards cite (reuse `countySourceSchema`). Author 3–6 honest light
  cards for Eastvale nodes citing real public sources (Census place identity,
  city of Eastvale open data, OSM). Keep zod validation; `sourceNoteIds` must
  reference existing `sources`.
- **Acceptance:** pack validates; every knowledgeCard cites a real source; no
  business/sales wording in card text; core tests pass.
- **Verify:** `cd packages/core && node_modules/.bin/vitest run test/county-pack.test.ts`
  then full suite; `node scripts/verify-county-index-source.mjs --json-only`.
- **Constraints:** honesty (real sources only), don't touch business fields'
  meaning, don't break existing pack consumers.

## SLICE 2 — Surface the knowledge card in free Explore HUD
- **Goal:** show the knowledge card + source in `CityWorldView` tray (free mode),
  alongside the session note composer.
- **Files:** `web/src/CityWorldView.tsx`, `web/src/App.tsx` (pass card through),
  `web/src/styles.css` (light card styling, theme-aware).
- **Changes:** render `activePlace.knowledgeCard.text` + a subtle source
  attribution in the tray; keep it calm/encyclopedic, not salesy. No new draw
  calls in the Pixi layer (HTML only).
- **Acceptance:** card shows for places that have one; graceful when absent;
  desktop + 390×844 mobile readable, light + dark.
- **Verify:** `node scripts/build-web.mjs`; run server on a test port
  (`PORT=8899 GEO_DATA_ADAPTER=mock node server/dist/index.js`) + gstack browse
  screenshot desktop/mobile (see Part IV); `web` tsc clean; `verify-web-bundle-budget`.
- **Constraints:** layer budget flat; provider-free; theme-aware.

## SLICE 3 — Generalize `ask_county_question` + answer from knowledge layer
- **Goal:** answer from broad knowledge for any published place; stop hardcoding
  `riverside-ca`; keep refusing slugs with no data.
- **Files:** `packages/core/src/county/CountyQuestionService.ts`,
  `packages/core/test/county-question.test.ts`, server tool copy if needed.
- **Changes:** support any pack present in `data/county_packs/`; add a
  knowledge-answer path (free) distinct from business-signals (paid); preserve
  the out-of-world honesty guard and unsupported-slug refusal.
- **Acceptance:** a second published county answers knowledge questions; unknown
  slugs still refused; out-of-world guard still refuses; all tests green.
- **Verify:** full core suite; `verify-tool-result-shape`; `verify-mcp-flow`.
- **Constraints:** closed-world honesty; free mode must not surface business scores.

## SLICE 4 — "Did you know" + wander
- **Goal:** surface one broad curated fact per place + a "take me somewhere
  interesting" cross-link (walk a map edge to a related place).
- **Files:** `CityWorldView.tsx`/`App.tsx`, a small selector in core using
  `mapEdges`. **Constraints:** deterministic, closed-world, no invented facts.

## SLICE 5 — Content pipeline (many light broad volumes)
- **Goal:** a repeatable source-noted authoring flow producing light knowledge
  cards + minimal packs across many CA places. **Delegate bulk authoring to
  codex/5.5** (research real open data, fill schema, cite sources). Each pack:
  `playableNow:false` initially (answerable/browse tier), honest tiers.
- **Verify:** per-pack zod validation + `verify-county-index-source`.
- **Constraints:** NO invented places/stats/sources; NO Google Places on the
  authoring hot path (use open data + attribution).

## SLICE 6 — Explore-first HUD (scout behind the paid lens)
- **Goal:** make exploration + notes the landing; move scout/campaign behind an
  opt-in PAID affordance. **Files:** `App.tsx`, `CityWorldView.tsx`, tool copy.

## SLICE 7 — Mobile first-paint framing (quality roadmap §3)
- Known constraint: `playable_mobile` budget (`cityWorldDerivedTerrainMap.ts`)
  reserves the bottom tray band; a camera-only fix fails the gate. Real fix =
  collapse tray on first paint + re-contract the budget, OR fix the
  viewport-frame model to match the real render. **Owner-scoped design decision**
  (see roadmap); do not blind-loosen the gate.

## Later (P3+): persistence ("Your Atlas"), state/country scale, L3 provider-normalized.

---

# PART IV — GUARDRAILS FOR THE CODING AGENT (5.5 / codex)

## 4.1 Toolchain (pnpm NOT on PATH)
- Typecheck core: `cd packages/core && node_modules/.bin/tsc -p tsconfig.json`
- Test core: `cd packages/core && node_modules/.bin/vitest run [test/<file>]`
- Typecheck server/web/geo: `node_modules/.bin/tsc -p server/tsconfig.json --noEmit`
  (also `web/tsconfig.json`, `packages/geo/tsconfig.json`)
- Build web bundle: `node scripts/build-web.mjs`
- Run server locally: `PORT=8899 GEO_DATA_ADAPTER=mock node server/dist/index.js`
- Diagnostics: `node scripts/debug-city-world-engine.mjs --json-only`
- Browser proof: gstack browse at `~/.claude/skills/browse/dist/browse.exe`
  (`$B goto <url>`, `$B viewport WxH`, `$B screenshot <path>`).

## 4.2 Hard rules (a violation is a failed change)
- Keep the **provider boundary**: never import `@atlas/geo` or reference
  `google.maps`/`places.googleapis.com` from `web/src` or `packages/core`.
- Keep **closed-world honesty**: no invented places/facts/sources; free Explore
  never surfaces business scores; `ask_county_question` refuses rather than bluffs.
- Keep **honest metrics**: diagnostics key on the effective rendered palette +
  silhouette; never regress `homeClonePressure`/`homeVariantCount`.
- Do **not** promote hidden drafts (Anaheim/Ontario) or touch Plaza Row — those
  are human owner-gated.
- Keep **layer/bundle budgets** green (`verify-render-command-layer-budget`,
  `verify-web-bundle-budget`).
- After every slice: run the relevant §1.9 verifiers + full core vitest; all green.

## 4.3 Permission notes (agent limits)
- **Production deploy** (`railway up`) and **autonomous codex writes**
  (`codex exec --sandbox workspace-write`) are permission-gated — the owner must
  run them or add an allow-rule (`.claude/settings.local.json`). Codex read-only
  research is fine.
- `railway variables` (secrets) is blocked — don't dump env values.

## 4.4 Delegation pattern (Claude ↔ codex)
- **Codex/5.5 does the bulk SWE** from this spec (schema wiring, data authoring,
  mechanical slices, tests-to-green). Invoke read-only for research; for writes
  the owner grants the allow-rule. Correct invocation: pass the prompt as a
  single arg and close stdin (`< /dev/null`) to avoid the stdin hang.
- **Claude owns** judgment: schema shape, honest voice, product decisions, final
  verification, and the deploy/owner-gate calls.

## 4.5 Definition of done (per slice)
Compiles (tsc clean) · relevant verifiers green · full core vitest green · honesty
+ provider + budget rules intact · (UI slices) browser-screenshot-verified on
desktop + 390×844 mobile, light + dark · BUILD_LOG entry appended.
