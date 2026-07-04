# Build Log

## Entry 189

Quest:
0.51E voxel-art mega-pass — honest color identity + generative residential variety.

Root cause fixed:
The renderer (`createBuildingGeometry`) resolves body/roof through the shared
MANIFEST palette, so authored per-building colors are only a fallback and the
manifest palette wins on screen. But the diagnostics keyed `homeVariantKey` /
objectKit clone-group on the raw scene-DATA color (which varied), so the metric
measured data the player never sees: it reported riverside homeClonePressure
0.158 while the effective on-screen clone pressure was ~0.58.

What changed:
- NEW `packages/core/src/voxel/cityWorldPaletteRegistry.ts` — a core mirror of
  every `building.*` manifest palette + `resolveEffectiveBuildingColors()` that
  reproduces the renderer's resolution (manifest palette wins; draft buildings
  keep authored color). Exported from the voxel + core barrels.
- NEW `cityWorldSilhouetteBucket()` in `cityWorldBasis.ts` — half-tile footprint
  + story-count bucket, so sub-tile jitter no longer masquerades as variety.
- `cityWorldDiagnostics.ts` / `cityWorldObjectKit.ts` — `homeVariantKey`,
  `cloneGroupKey`, and roof/body separation now key on the EFFECTIVE palette +
  silhouette bucket. Diagnostics `update` bumped
  `prealpha-0.6f-engine-diagnostics` -> `postalpha-0.51e-engine-diagnostics`
  (swept debug script + core test pin).
- `atlas.manifest.json` + registry — added muted SoCal palette-variant ramps:
  cottage v2/v3/v4, ranch v2/v3, rowhome v2, lowrise v2/v3, store v2/v3, gym
  sawtooth v1/v2. All roof/body separations >= 0.42.
- `cityWorldCompiler.ts` `resolveBuildingPaletteKey` — hash-assigns a palette
  variant per building (identity comes from the palette system, keeping the
  0.34e cohesion contract). Expanded riverside residential 19 -> 27 homes with
  cross-gable/garage-wing/two-story/wide silhouettes; tall/wide variants placed
  OUTSIDE the residential_detail frame to keep the mobile-occlusion tray gate
  green. Added a 4th distinct home (cottage) to the Ontario draft anchor.
- `CityWorldRenderer.tsx` — sprite-mode buildings now honor their variant via
  `sprite.tint` (previously never used); a gentle wash toward the resolved body
  color. No new draw calls / layers.
- `cityWorldParametricGenerator.ts` — replaced fixed home/shop/apartment/gym
  specs with dimension-jittered spec POOLS (+/-15% w/d/h, roof mix, 2-3 palette
  variants each).
- `verify-public-object-kit-prefab-palette.mjs` — added a registry<->manifest
  byte-consistency check so the effective-palette mirror cannot silently drift.

Before -> after (named metrics):
- riverside homeClonePressure: 0.158 reported (dishonest) -> 0.58 honest
  baseline after hardening the metric -> 0.074 after the fix. Target <= 0.16 MET.
- riverside homeVariantCount: 16 -> 24 (>= 24). objectKit clonePressureRatio
  0.074 (<= 0.2); paletteCohesionRatio 1.0 and roofBodySeparationRatio 1.0 (not
  regressed); firstViewportCompositionScore 0.85 held.
- Ontario draft homeClonePressure: 0.333 -> 0.250 (target <= 0.25 MET).
- Generated commerce/lowrise within-family clone pressure: 1.0 -> 0.5 (<= 0.5).

Constraints honored:
No props/cars/humans/signage/glows; no terrain repaint; no new deps; no new SVG
pipeline; no `LOUD_DEFAULT_COLORS` token; Plaza Row + hidden-draft playability
untouched; per-building draw-call/layer count flat.

Verification:
- `node scripts/debug-city-world-engine.mjs --json-only` — ok, 0 hard blockers,
  0 warnings on riverside.
- Green: verify-public-object-kit-prefab-palette, verify-object-authorship-scene-grammar,
  verify-render-command-layer-budget, verify-parametric-generator,
  verify-face-orientation-source-contrast, verify-civic-venue-object-kit-contract,
  verify-object-kit-renderer-consumption.
- Full core vitest 85/85 pass; web `tsc --noEmit` 0 errors.
- verify-engine-beta-coverage NOT run here (needs a live server + pnpm — human
  browser/screenshot pass).

## Entry 188

Quest:
0.49P Fable product-submission reliability sweep and Railway rollout.

What changed:
- Accepted the Fable product-submission lane for public Engine Beta scope after
  human approval. The synthetic generated-district preview is allowed only as an
  honest engine preview: not a real place, not real coverage, session-only.
- Pushed `codex/engine-beta-cleanup` to the private GitHub checkpoint repo.
- Deployed the verified branch to Railway service `atlas-backend` in production.
- No Railway env changes, DB, persistence, Hosted Clawd, Stripe, OAuth, XP,
  evidence, automation, reports, exports, or new MCP tools were added.

Local verification before deploy:
- `pnpm --dir packages/core test` passed: 19 files, 85 tests.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `pnpm verify:preview:http` passed.
- `pnpm verify:mcp` passed with the seven existing tools.
- `pnpm verify:submission` passed.
- `node scripts/verify-atlas-source-of-truth-drift.mjs --json-only` passed.
- `node scripts/verify-provider-boundaries.mjs --json-only` passed.
- `node scripts/verify-tool-result-shape.mjs --json-only` passed.
- `node scripts/verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed with a clean working tree.
- `node scripts/verify-generated-district-widget.mjs --url http://127.0.0.1:8787/preview --json-only`
  passed.
- `node scripts/verify-scout-campaign-panel.mjs --url http://127.0.0.1:8787/preview --json-only`
  passed.
- `node scripts/verify-engine-beta-coverage.mjs --json-only` passed.
- `node scripts/verify-parametric-generator.mjs --json-only` passed with
  `HIGH_HOME_CLONE_PRESSURE` warning.

Public verification after deploy:
- Public URL: `https://atlas-backend-production-e6fc.up.railway.app`.
- `/health` returned 200.
- `ATLAS_PREVIEW_URL=https://atlas-backend-production-e6fc.up.railway.app/preview pnpm verify:preview:http`
  passed.
- `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:mcp`
  passed with the seven existing tools.
- `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:submission`
  passed.
- `ATLAS_PREVIEW_URL=https://atlas-backend-production-e6fc.up.railway.app/preview node scripts/verify-generated-district-widget.mjs --screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-fable-public-generated-district-railway --json-only`
  passed.
- `node scripts/verify-scout-campaign-panel.mjs --url https://atlas-backend-production-e6fc.up.railway.app/preview --json-only`
  passed.
- `ATLAS_BASE_URL=https://atlas-backend-production-e6fc.up.railway.app node scripts/verify-engine-beta-coverage.mjs --json-only`
  passed.

Screenshot roots:
- Public generated district:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-fable-public-generated-district-railway`
- Public Scout/Campaign screenshots from rollout run:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-fable-public-scout-campaign-panel`
- Local Engine Beta coverage packet:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-fable-takeover-engine-beta-coverage`

Known weakness:
- The art is still not final. Generated-district verifier reports
  `HIGH_HOME_CLONE_PRESSURE`; human visual rating remains roughly 6.5/10.
  Next engine-art work should target generated/public object variety and
  no-label category identity rather than more release plumbing.

Next:
- `0.50P Submission Asset/Directory Finalization`: hosted privacy/terms URLs,
  PNG icon export if required by the Apps directory, and final directory packet.
- After submission chores, run `0.51E Generated District Object Variety /
  Clone-Pressure Reduction` as the next art-quality slice.

## Entry 187

Quest:
Fable product-submission takeover / verification cleanup.

What changed:
- Stopped the live Claude process so the worktree has one active owner.
- Preserved the current Fable commit with local branch marker
  `codex/fable-product-submission-experiment`.
- Updated `scripts/verify-preview-http.mjs` so the shallow HTTP smoke no longer
  rejects the accepted in-widget Scout/Campaign preview panel solely because it
  contains `Campaign preview` copy. The verifier still rejects old
  `Scout Drop report` and `dashboard shell` copy, and now requires the
  session-only panel contract when campaign preview text is present.
- Updated `scripts/verify-alpha-rc-split.mjs` so the product-submission
  checklist and preview HTTP verifier are allowed in the Engine Beta selected
  RC envelope.

Verification:
- `pnpm verify:preview:http` passed.
- `node scripts/verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed with 0 blockers and 0 unknowns.
- `node scripts/verify-atlas-source-of-truth-drift.mjs --json-only` passed.
- `node scripts/verify-provider-boundaries.mjs --json-only` passed.
- `node scripts/verify-tool-result-shape.mjs --json-only` passed.
- `node scripts/verify-generated-district-widget.mjs --url http://127.0.0.1:8787/preview --json-only`
  passed.
- `node scripts/verify-scout-campaign-panel.mjs --url http://127.0.0.1:8787/preview --json-only`
  passed.

Not done / next:
- This does not deploy or push the Fable lane.
- The product cutline is still explicit: the public synthetic generated-district
  preview is useful and locally verified, but it is a product-scope expansion
  from the 0.45E owner-gate source of truth. Before deploy, run the full
  reliability sweep and make a human deploy decision on that public generated
  preview.

## Entry 186

Quest:
Product-submission track (human-directed pivot off the owner-gate ladder). Source of
truth: `docs/PRODUCT_SPEC_AND_GATES.md` (G1–G7 submission gates). Owner-gate ladder
parked at 0.45E; source-of-truth drift checker stays green.

What changed:
- 0.46P In-Widget Scout & Campaign Result Surface: the widget now renders the scout/
  campaign intelligence (route, signals, risks, channels, 7-day plan, assets) inside the
  map as a bounded, map-first panel instead of discarding it and re-rendering only the
  map. New `web/src/PreviewPanel.tsx`; wired via `web/src/CityWorldView.tsx` +
  `web/src/App.tsx` (previews were computed then dropped at the last line).
- 0.47P Widget polish: in-widget flow CTAs (Preview campaign / hosting options) via
  `sendUserMessage`, mobile-density pass, `qr_flyer`→"QR flyer" label fix, advance-button.
- Graphics-engine (Fable pass, both levers). Lever-1: `CityWorldRenderer` now honors
  authored `visualGrammar` the compiler computed but the renderer dropped — `contactProfile`
  drives building/lot contact shadows (landmark penumbra / soft ground / curb / parcel skirt),
  `drawAuthoredRoofProfile` reads `roofProfile` (barrel/clay/parapet/metal/glass caps),
  `drawAuthoredWallMaterial` reads `materialProfile` (stucco/storefront/bands/civic fins);
  plus mid-scene density (south home court + lots/road, corner market, plaza lofts, park props).
  Riverside firstViewportCompositionScore 0.775→0.85, homeClonePressure 0.20→0.158, floors held,
  0 warnings/blockers. Lever-2: `packages/core/src/voxel/cityWorldParametricGenerator.ts` (NEW) —
  a provider-free spec (size + height grid + road seeds + land-use zones) → fully enriched
  `CityWorldScene` via the shared, now-exported enrichment decorators; proven by
  `scripts/verify-parametric-generator.mjs`. NOT wired into the public MCP product (validated
  seam only; wiring would need server tool-contract changes, out of scope). Files:
  `cityWorldCompiler.ts`, `cityWorldParametricGenerator.ts`, `voxel/index.ts`, `core/src/index.ts`,
  `web/src/CityWorldRenderer.tsx`.
- Radix UI: scout/campaign result panel refactored onto `radix-ui` primitives (replaces
  hand-rolled chips). `web/src/PreviewPanel.tsx` + `web/src/styles.css`.
- G6 submission packet: `chatgpt-app-submission.json` (static assertions pass),
  `assets/atlas-app-icon.svg`, `docs/legal/PRIVACY.md` + `TERMS.md`,
  `docs/SUBMISSION_CHECKLIST.md`.
- Scope/gates remade: `docs/PRODUCT_SPEC_AND_GATES.md`; `docs/DECISIONS.md` (Decision 075);
  product-track sections in `docs/NEXT_QUESTS.md` and `docs/updates/ATLAS_RELEASE_LADDER.md`.

Verification:
- `node scripts/verify-atlas-source-of-truth-drift.mjs --json-only` (green, 0 blockers)
- `corepack pnpm --dir packages/core build` (core tsc green)
- `node_modules/.bin/tsc --noEmit -p web/tsconfig.json` (green)
- `node scripts/build-web.mjs` (green)
- `node scripts/verify-scout-campaign-panel.mjs --screenshots …` (4/4: panel present on
  desktop + 390×844, session-boundary copy, single canvas, no overflow, zero console errors)
- `node scripts/verify-alpha-product-loop.mjs --proof-only --screenshots …` (post-lever-1
  Riverside map renders clean; grounding/contact improvement confirmed visually)
- Manifest static assertions PASS (independent node check: schema, display_name, the three
  required description phrases, exactly the 7 tools, payment negative case)

Not done / next:
- Radix UI refactor: rebuild + re-prove after it lands.
- G4 reliability: run `verify:mcp` + `verify:submission` against the deployed MCP server.
- G6 human/network follow-ups: host legal URLs, confirm current OpenAI Apps directory
  requirements, run live `verify-submission`, provide a PNG icon if required.
- 0.48P Public Generated-District Preview: the parametric generator is now a real PUBLIC
  code path — widget-only, no new MCP tool, no server/tool-contract change, no provider data.
  The widget's "Generate district" control runs `generateParametricCityWorldScene(
  exampleParametricDistrictSpec())` and renders the synthetic `CityWorldScene` directly, under
  an unmistakable honesty banner ("GENERATED PREVIEW — Synthetic district built by the Atlas
  engine. Not a real place, not real coverage. Session-only.") with an Exit-to-Riverside
  control; place-collection + preview UI suppressed in generated mode. Generic zone labels
  (Civic core / Commercial row / Apartment court / Neighborhood) reinforce that it is synthetic,
  not a real place. Files: `web/src/App.tsx`, `web/src/CityWorldView.tsx`, `web/src/styles.css`;
  gate `scripts/verify-generated-district-widget.mjs`. Verified: gate PASS on desktop 1280×720
  and mobile 390×844 (honest banner asserted, collection UI suppressed, single canvas, no
  overflow, zero console errors); generated district renders as a coherent voxel town.
  Remaining/optional future work: a model-driven MCP path would need a new tool + contract
  change (out of scope here); tighten generator homeClonePressure (0.25) below the 0.24 public
  cap before any promotion to public-quality coverage.

## Entry 185

Quest:
Post-Alpha 0.39E Public Object Identity / Civic-Service Read Pass.

What changed:
Added typed object-kit prefab geometry for the public Riverside civic landmark
and service/gym stress cells, then made `CityWorldRenderer` consume that
metadata. Eastvale Core now carries plinth, entry-bay, facade-pier, glass-band,
and roof-cap geometry. The Gym/service block now carries service-bay,
sawtooth-roof, recessed-entry, utility-apron, and roof-monitor geometry.

Files changed:
- `AGENTS.md`
- `packages/core/src/voxel/cityWorldTypes.ts`
- `packages/core/src/voxel/cityWorldObjectKit.ts`
- `packages/core/test/city-world-compiler.test.ts`
- `web/src/CityWorldRenderer.tsx`
- `scripts/verify-public-object-identity-civic-service.mjs`
- `scripts/verify-atlas-source-of-truth-drift.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `artifacts/current-update.json`
- `docs/BUILD_LOG.md`
- `docs/DECISIONS.md`
- `docs/NEXT_QUESTS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`
- `docs/updates/postalpha-0.39e-public-object-identity-civic-service-read-pass.md`

Verification:
- `node --check scripts\verify-public-object-identity-civic-service.mjs`
- `pnpm --dir packages/core test -- city-world-compiler`
- `pnpm typecheck:starter`
- `pnpm build:starter`
- `node scripts\verify-public-object-identity-civic-service.mjs --json-only`
- `node scripts\verify-atlas-source-of-truth-drift.mjs --json-only`
- `node scripts\verify-public-object-kit-prefab-palette.mjs --json-only`
- `node scripts\verify-no-google-in-renderer.mjs --json-only`
- `node scripts\verify-provider-boundaries.mjs --json-only`
- `node scripts\verify-tool-result-shape.mjs --json-only`
- `node scripts\verify-scene-packet-db-persistence-plan.mjs --json-only`
- `node scripts\verify-scene-packet-memory-adapter.mjs --json-only`
- `ATLAS_BASE_URL=http://127.0.0.1:8787 ATLAS_ENGINE_BETA_COVERAGE_SCREENSHOTS=C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-039e-civic-service-local\coverage node scripts\verify-engine-beta-coverage.mjs`
- `node scripts\verify-alpha-product-loop.mjs --url http://127.0.0.1:8787/preview?atlasNoLabels=1 --screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-039e-civic-service-local\no-label --proof-only`
- `node scripts\verify-alpha-product-loop.mjs --url http://127.0.0.1:8787/preview?atlasNoLabels=1 --camera-preset residential_detail --screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-039e-civic-service-local\no-label-residential-detail --proof-only`

Screenshot roots:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-039e-civic-service-local\coverage`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-039e-civic-service-local\no-label`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-039e-civic-service-local\no-label-residential-detail`

Skipped:
No commerce pass, terrain pass, mobile-density pass, Anaheim/Ontario public
promotion, DB implementation, provider geometry, MCP tool change, public UI
redesign, Hosted Clawd, Stripe, OAuth, XP, evidence, automation, reports,
exports, cars, humans, props, panels, glows, or label crutches.

Next:
Run `0.40E Engine Quality Axis Review / Next Target Selection`. Do not
continue civic/service unless a verifier or human screenshot review names one
exact blocker.

## Entry 184

Quest:
Post-Alpha 0.38F App Drift / Source-of-Truth Reconciliation.

What changed:
Repaired source-of-truth drift after 0.38E. The 0.38E selector artifact now
reports `ok: true`, AGENTS/README/NEXT_QUESTS/current-update/release ladder now
agree on Engine Beta state, and the next valid implementation slice is still
`0.39E Public Object Identity / Civic-Service Read Pass`.

Files changed:
- `AGENTS.md`
- `README.md`
- `artifacts/current-update.json`
- `artifacts/engine-quality-axis/postalpha-0.38e-next-target-selection.json`
- `docs/BUILD_LOG.md`
- `docs/DECISIONS.md`
- `docs/NEXT_QUESTS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`
- `docs/updates/postalpha-0.38f-app-drift-source-of-truth-reconciliation.md`
- `scripts/select-engine-quality-axis.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `scripts/verify-atlas-source-of-truth-drift.mjs`

Verification:
- `node --check scripts\select-engine-quality-axis.mjs`
- `node --check scripts\verify-atlas-source-of-truth-drift.mjs`
- `node scripts\select-engine-quality-axis.mjs --json-only`
- `node scripts\select-engine-quality-axis.mjs --out artifacts\engine-quality-axis --json-only`
- `node scripts\verify-atlas-source-of-truth-drift.mjs --json-only`
- Engine Beta guard stack listed in the final handoff.

Skipped:
No renderer geometry, compiler geometry, public UI, server route, MCP tool-list,
DB implementation, provider geometry, public Anaheim/Ontario promotion, Hosted
Clawd, Stripe, OAuth, XP, evidence, automation, reports, exports, cars, humans,
props, panels, glows, or label crutches.

Next:
Run `0.39E Public Object Identity / Civic-Service Read Pass`. Target Eastvale
Core civic landmark and service/gym readability.

## Entry 183

Quest:
Post-Alpha 0.38E Engine Quality Axis Review / Next Target Selection.

What changed:
Added `scripts/select-engine-quality-axis.mjs` as a selector artifact. It reads
the current 0.37E update manifest, compiles current `CityWorldScene`
diagnostics, reads object-kit and mobile LOD metrics, checks screenshot packet
paths, counts Anaheim readiness blockers, and emits one recommended next quest
with blocked alternatives.

Selector result:
- `recommendedNextQuest`: `0.39E Public Object Identity / Civic-Service Read Pass`.
- `selectedAxis`: `public_object_identity`.
- Reason: public home clone pressure is still at the review floor and the
  weakest public object family is `civic_landmark`.
- Blocked: terrain/world-edge because terrain, empty-board, and chunk-edge
  floors are green.
- Blocked: mobile entry density because playable mobile budget and readability
  floors are green.
- Blocked: hidden second-district readiness because Anaheim still has 9
  promotion blockers.
- Blocked: commerce repeat unless a human names one exact Plaza Row blocker
  after 0.37E focused proof.

Current evidence:
- `terrainMassingCoverageRatio`: `0.899`.
- `emptyBoardRatio`: `0.056`.
- `firstViewportCompositionScore`: `0.775`.
- `chunkEdgeReadabilityFloorScore`: `0.761`.
- `homeClonePressure`: `0.2`.
- `weakestObjectFamily`: `civic_landmark`.
- `mobileReadabilityScore`: `0.752`.
- `mobileOcclusionRiskScore`: `0.248`.
- Plaza Row proof remains green with `7` bays, `5` sign mounts, and command
  visibility ratio `0.059`.

Artifact:
`artifacts/engine-quality-axis/postalpha-0.38e-next-target-selection.json`

Files changed:
- `scripts/select-engine-quality-axis.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `artifacts/current-update.json`
- `artifacts/engine-quality-axis/postalpha-0.38e-next-target-selection.json`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`
- `docs/updates/postalpha-0.38e-engine-quality-axis-review-next-target-selection.md`

Verification:
- `node --check scripts\select-engine-quality-axis.mjs` passed.
- `node scripts\select-engine-quality-axis.mjs --json-only` passed.
- `node scripts\select-engine-quality-axis.mjs --out artifacts\engine-quality-axis --json-only`
  passed.

## Entry 182

Quest:
Post-Alpha 0.37E Plaza Row Focused Capture / Commerce Read Proof.

What changed:
Strengthened the public Riverside Plaza Row commerce prefab one more step and
added a deterministic `commerce_detail` camera so the commerce module can be
reviewed directly instead of near the edge of the standard product screenshots.

Geometry changes:
- `building-plaza-strip` now uses width `6.1`, depth `2.05`, height `1.78`.
- `commerceGeometry.bayCount` increased from `6` to `7`.
- `commerceGeometry.signMountCount` increased from `4` to `5`.
- `commerceGeometry.apronDepth` increased from `0.34` to `0.4`.
- `commerceGeometry.glassRecessDepth` increased from `0.34` to `0.42`.
- `commerceGeometry.parapetWeight` increased from `1` to `1.18`.
- `CityWorldRenderer` now draws bay-level `storefrontThresholds` for the
  object-kit commerce helper.

Capture/proof changes:
- Added public Riverside `commerce_detail` camera centered on Plaza Row.
- Added shared `WorldBasis` frame sizing for `commerce_detail`.
- Added scene-window and compiler tests for the new camera.
- Added `scripts/verify-plaza-row-focused-capture.mjs` and allowed it in the
  strict `engine-beta-data` split guard.

Current result:
- Plaza Row remains `prefabFamily: commerce_strip`.
- The focused verifier reports camera distance from Plaza Row `0.403`,
  visible command count `85`, building command count `3`, command visibility
  ratio `0.059`, and public clutter command count `0`.
- Public object-kit metrics remain green:
  `clonePressureRatio 0.133`, `terrainMassingCoverageRatio 0.899`,
  `emptyBoardRatio 0.056`, `firstViewportCompositionScore 0.775`,
  `buildingLotContactRatio 1.0`, `lotRoadContactRatio 0.805`.
- Full Engine Beta browser coverage passed locally.
- The commerce crop is useful, but it still carries the public default
  selected-place state for Eastvale Core. Do not treat it as a no-label art
  approval packet.

Screenshot roots:
- Coverage:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-037e-plaza-row-focused-capture-local\coverage`
- Commerce detail:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-037e-plaza-row-focused-capture-local\commerce-detail`

Files changed:
- `packages/core/src/voxel/cityWorldTypes.ts`
- `packages/core/src/voxel/cityWorldBasis.ts`
- `packages/core/src/voxel/cityWorldCompiler.ts`
- `packages/core/src/voxel/cityWorldObjectKit.ts`
- `packages/core/test/city-world-compiler.test.ts`
- `packages/core/test/city-world-scene-window.test.ts`
- `web/src/CityWorldRenderer.tsx`
- `scripts/verify-commerce-strip-prefab-geometry.mjs`
- `scripts/verify-plaza-row-focused-capture.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `artifacts/current-update.json`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`
- `docs/updates/postalpha-0.37e-plaza-row-focused-capture-commerce-read-proof.md`

Verification:
- `pnpm --dir packages/core test -- city-world-compiler city-world-scene-window city-world-basis`
  passed, `19 files`, `85 tests`.
- `pnpm build:core` passed.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `node scripts\verify-public-object-kit-prefab-palette.mjs --json-only`
  passed.
- `node scripts\verify-object-kit-renderer-consumption.mjs --json-only`
  passed.
- `node scripts\verify-commerce-strip-prefab-geometry.mjs --json-only`
  passed.
- `node scripts\verify-plaza-row-focused-capture.mjs --json-only` passed.
- `node scripts\verify-scene-packet-db-persistence-plan.mjs --json-only`
  passed.
- `node scripts\verify-scene-packet-memory-adapter.mjs --json-only` passed.
- `node scripts\verify-no-google-in-renderer.mjs --json-only` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed with `0 blockers`, `0 unknowns`.
- `pnpm verify:preview:http` passed against local
  `http://127.0.0.1:8787/preview`.
- `ATLAS_BASE_URL=http://127.0.0.1:8787 node scripts\verify-engine-beta-coverage.mjs`
  passed.
- `node scripts\verify-alpha-product-loop.mjs --url http://127.0.0.1:8787/preview --camera-preset commerce_detail --proof-only --screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-037e-plaza-row-focused-capture-local\commerce-detail`
  passed.

## Entry 181

Quest:
Post-Alpha 0.36E Commerce Strip Prefab Geometry / Plaza Row Focus.

What changed:
Added a typed `CityWorldCommerceStripPrefabGeometry` contract to object-kit
metadata and assigned focused geometry to public Riverside Plaza Row
(`building-plaza-strip`). The profile now carries `bayCount`, `signMountCount`,
`apronDepth`, `glassRecessDepth`, `parapetWeight`, and `focusTarget:
"plaza_row"`. Plaza Row also gets `plaza-row-focus`,
`deep-storefront-apron`, and `continuous-parapet` signature tags.

Updated `CityWorldRenderer` so `drawObjectKitCommerceStripRead(...)` consumes
`building.objectKit.commerceGeometry` for bay count, sign mounts, apron depth,
glass recess depth, parapet weight, bay pilasters, and a focused Plaza Row
frontage plane.

Added `scripts/verify-commerce-strip-prefab-geometry.mjs` and allowed it in
the strict `engine-beta-data` split guard.

Why:
0.35E proved the renderer consumes object-kit metadata. 0.36E uses that path
to improve the actual weakest public prefab family, `commerce_strip`, without
broadening into all object families or adding props/panels/labels.

Current result:
- Plaza Row `prefabFamily`: `commerce_strip`.
- `bayCount`: `6`.
- `signMountCount`: `4`.
- `apronDepth`: `0.34`.
- `glassRecessDepth`: `0.34`.
- `parapetWeight`: `1`.
- `focusTarget`: `plaza_row`.
- Public object-kit metrics remain green:
  `prefabCoverageRatio 1.0`, `paletteCohesionRatio 1.0`,
  `roofBodySeparationRatio 1.0`, `clonePressureRatio 0.133`,
  `landmarkSignatureScore 1.0`.
- Terrain/contact floors remain green:
  `terrainMassingCoverageRatio 0.899`, `emptyBoardRatio 0.056`,
  `firstViewportCompositionScore 0.775`, `buildingLotContactRatio 1.0`,
  `lotRoadContactRatio 0.805`.
- Browser coverage passed with Riverside desktop/mobile, residential-detail
  desktop/mobile, Orange shell mobile, and Unknown/L0 mobile.
- The standard coverage screenshot still places Plaza Row near the frame edge,
  so future human visual review should add a focused Plaza Row capture path if
  more visual proof is needed.

Screenshot root:
`C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-036e-commerce-strip-prefab-geometry-local`

Files changed:
- `packages/core/src/voxel/cityWorldTypes.ts`
- `packages/core/src/voxel/cityWorldObjectKit.ts`
- `packages/core/test/city-world-compiler.test.ts`
- `web/src/CityWorldRenderer.tsx`
- `scripts/verify-commerce-strip-prefab-geometry.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `artifacts/current-update.json`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`
- `docs/updates/postalpha-0.36e-commerce-strip-prefab-geometry-plaza-row-focus.md`

Verification:
- `pnpm --dir packages/core test` passed, `19 files`, `85 tests`.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `node scripts\verify-public-object-kit-prefab-palette.mjs --json-only`
  passed.
- `node scripts\verify-object-kit-renderer-consumption.mjs --json-only`
  passed.
- `node scripts\verify-commerce-strip-prefab-geometry.mjs --json-only`
  passed.
- `node scripts\verify-scene-packet-db-persistence-plan.mjs --json-only`
  passed.
- `node scripts\verify-scene-packet-memory-adapter.mjs --json-only` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-no-google-in-renderer.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed with `0 blockers`, `0 unknowns`.
- `pnpm verify:preview:http` passed against local `127.0.0.1:8787`.
- `node scripts\verify-engine-beta-coverage.mjs` passed against local
  `127.0.0.1:8787`.

Skipped:
No backend, DB, migration, package/env drift, provider geometry, MCP tool-list
change, public Anaheim/Ontario exposure, Hosted Clawd, Stripe, XP, evidence,
OAuth, automation, reports, exports, cars, humans, decorative props, labels,
panels, glows, dashboard UI, or broad object-family redraw.

Next:
If the commerce-strip visual review remains weak, run `0.37E Plaza Row Focused
Capture / Commerce Read Proof`: add a focused Plaza Row proof path or make one
more geometry-only commerce pass. Do not broaden to every object family and do
not reopen DB persistence without explicit approval.

## Entry 180

Quest:
Post-Alpha 0.35E Object Kit Renderer Consumption / Commerce Strip Fix.

What changed:
Updated `CityWorldRenderer` so the commerce-strip renderer path keys from
`CityWorldBuilding.objectKit?.prefabFamily === "commerce_strip"` instead of
only older visual grammar/facade hints. Added the focused helper
`drawObjectKitCommerceStripRead(...)` and call it in both sprite-backed and
primitive commerce paths. The helper adds structural storefront read: shared
apron, foundation/contact shadow, recessed glass bays, non-text sign mounts,
parapet/eave weight, awning lip, and side-face ribs.

Added `scripts/verify-object-kit-renderer-consumption.mjs` and allowed it in
the strict `engine-beta-data` split guard.

Why:
0.34E made public Riverside buildings measurable as an object kit and named
`commerce_strip` as the weakest prefab family. 0.35E proves the renderer now
uses that metadata for one bounded public visual improvement instead of doing
another broad art pass.

Current result:
- Renderer consumes `building.objectKit` for `commerce_strip`.
- Commerce helper call count: `2`, covering sprite-backed and primitive paths.
- Public object-kit metrics remain green:
  `prefabCoverageRatio 1.0`, `paletteCohesionRatio 1.0`,
  `roofBodySeparationRatio 1.0`, `clonePressureRatio 0.133`,
  `landmarkSignatureScore 1.0`.
- Weakest prefab family remains `commerce_strip`, so a future direct prefab
  geometry pass may still be useful if the human wants more visible lift.
- Browser coverage passed with Riverside desktop/mobile, residential-detail
  desktop/mobile, Orange shell mobile, and Unknown/L0 mobile.

Screenshot root:
`C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-035e-object-kit-renderer-consumption-local`

Files changed:
- `web/src/CityWorldRenderer.tsx`
- `scripts/verify-object-kit-renderer-consumption.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `artifacts/current-update.json`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`
- `docs/updates/postalpha-0.35e-object-kit-renderer-consumption-commerce-strip-fix.md`

Verification:
- `pnpm --dir packages/core test` passed, `19 files`, `85 tests`.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `node scripts\verify-public-object-kit-prefab-palette.mjs --json-only`
  passed, `0 blockers`.
- `node scripts\verify-object-kit-renderer-consumption.mjs --json-only`
  passed, `0 blockers`.
- `node scripts\verify-scene-packet-db-persistence-plan.mjs --json-only`
  passed.
- `node scripts\verify-scene-packet-memory-adapter.mjs --json-only` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-no-google-in-renderer.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed with `0 blockers`, `0 unknowns`.
- `pnpm verify:preview:http` passed against local `127.0.0.1:8787`.
- `node scripts\verify-engine-beta-coverage.mjs` passed against local
  `127.0.0.1:8787`.

Skipped:
No backend, DB, migration, package/env drift, provider geometry, MCP tool-list
change, public Anaheim/Ontario exposure, Hosted Clawd, Stripe, XP, evidence,
OAuth, automation, reports, exports, cars, humans, decorative props, labels,
panels, glows, dashboard UI, or broad object-family redraw.

Next:
If the next public art pass is needed, run `0.36E Commerce Strip Prefab
Geometry / Plaza Row Focus`: improve the underlying commerce strip prefab or a
focused commerce capture path directly. Do not broaden to every object family
and do not reopen DB persistence without explicit approval.

## Entry 179

Quest:
Post-Alpha 0.34E Public Object Kit Prefab + Palette Contract.

What changed:
Added a production object-kit contract for public Riverside/Eastvale buildings.
`CityWorldBuilding` now supports `objectKit` metadata, and the compiler assigns
prefab families, palette roles, clone-group keys, signature tags, roof/body
separation scores, and civic landmark signature scores through the existing
building metadata seam. Added the core analyzer
`analyzeCityWorldObjectKit(...)` and the focused verifier
`scripts/verify-public-object-kit-prefab-palette.mjs`.

Why:
0.33E closed the DB persistence plan without approving implementation. The next
valuable code move was engine quality: make public buildings measurable as a
reusable object kit before another broad renderer pass or any persistence work.

Current result:
- Public prefab coverage: `1.0`.
- Palette cohesion: `1.0`.
- Roof/body separation: `1.0`.
- Residential clone pressure: `0.133`.
- Landmark signature score: `1.0`.
- Weakest prefab family: `commerce_strip`.
- Terrain/contact floors remain green:
  `terrainMassingCoverageRatio 0.899`, `emptyBoardRatio 0.056`,
  `firstViewportCompositionScore 0.775`, `buildingLotContactRatio 1.0`,
  `lotRoadContactRatio 0.805`.
- Anaheim remains hidden and non-playable.

Files changed:
- `packages/core/src/voxel/cityWorldTypes.ts`
- `packages/core/src/voxel/cityWorldCompiler.ts`
- `packages/core/src/voxel/cityWorldObjectKit.ts`
- `packages/core/src/voxel/index.ts`
- `packages/core/src/index.ts`
- `packages/core/test/city-world-compiler.test.ts`
- `scripts/verify-public-object-kit-prefab-palette.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `artifacts/current-update.json`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`
- `docs/updates/postalpha-0.34e-public-object-kit-prefab-palette-contract.md`

Verification:
- `pnpm --dir packages/core test -- city-world-compiler` passed, `19 files`,
  `85 tests`.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `node scripts\verify-public-object-kit-prefab-palette.mjs --json-only`
  passed, `0 blockers`.

Skipped:
No renderer redraw, public UI change, MCP tool-list change, DB implementation,
env/package drift, migration, live provider normalization, Hosted Clawd,
Stripe, XP, evidence, OAuth, automation, reports, exports, cars, humans,
decorative props, public Anaheim/Ontario exposure, or label/panel crutch.

Next:
Run the full guard stack. If green, 0.35E should either make the renderer consume
object-kit metadata for one visible public differentiation pass or target
`commerce_strip` as the weakest prefab family. DB persistence remains blocked
until explicitly reopened.

## Entry 178

Quest:
Post-Alpha 0.33E DB Scene Packet Persistence Plan.

What changed:
Added a planning-only persistence packet for future scene packet DB work. The
machine-readable artifact
`artifacts/scene-packet-persistence/0.33e-db-scene-packet-persistence-plan.json`
defines the proposed Postgres-compatible schema, TTL policy, data boundaries,
feature-flag rollout order, review gates, and rollback path. Added the human
plan at `docs/SCENE_PACKET_DB_PERSISTENCE_PLAN.md` and the verifier
`scripts/verify-scene-packet-db-persistence-plan.mjs`.

Why:
0.32E proved runtime memory. The next safe backend step is not implementing DB
persistence. It is making the schema, migration review, rollback path, and
forbidden stored fields concrete before any database package, env var, or
migration enters the repo.

Current result:
- 0.33E remains `planning_only`; `implementationAllowed` is `false`.
- Future storage rollout is defined as
  `runtime_memory -> db_read_through -> db_write_through`.
- Rollback returns to `runtime_memory`.
- Planned tables are `scene_packet_cache_entries`,
  `scene_packet_generation_jobs`, and `scene_packet_audit_events`.
- Shell/unsupported packets are explicitly blocked from scene payload storage.
- Raw Google/provider payloads, user data, Stripe, OAuth, XP, evidence, and
  automation fields are forbidden.

Files changed:
- `artifacts/scene-packet-persistence/0.33e-db-scene-packet-persistence-plan.json`
- `artifacts/current-update.json`
- `docs/SCENE_PACKET_DB_PERSISTENCE_PLAN.md`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`
- `docs/updates/postalpha-0.33e-db-scene-packet-persistence-plan.md`
- `scripts/verify-scene-packet-db-persistence-plan.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `scripts/verify-atlas-loop-readiness.mjs`

Verification:
- `node --check scripts\verify-scene-packet-db-persistence-plan.mjs` passed.
- `node scripts\verify-scene-packet-db-persistence-plan.mjs --json-only`
  passed, `0 blockers`.
- `node --check scripts\verify-alpha-rc-split.mjs` passed.
- `node --check scripts\verify-atlas-loop-readiness.mjs` passed.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed, `0 blockers`, `0 unknowns`, `180 files`.
- `node scripts\verify-atlas-loop-readiness.mjs --json-only` passed, no
  warnings.
- `node scripts\verify-scene-packet-memory-adapter.mjs --json-only` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.

Skipped:
No DB dependency, `DATABASE_URL`, migration, server DB read/write code,
background generation job, live provider normalization, package/env drift,
Hosted Clawd, Stripe, XP, evidence, OAuth, automation, reports, exports, or
public Anaheim/Ontario promotion.

Next:
If 0.33E stays green, choose either a DB preflight verifier with human approval
or return to public engine quality. Do not implement persistence until the
human explicitly reopens the DB gate.

## Entry 177

Quest:
Post-Alpha 0.32E Runtime Scene Packet Memory Adapter.

What changed:
Added `server/src/scenePacketMemoryAdapter.ts`, a bounded server-only runtime
memory adapter on top of the 0.31E scene packet cache contract. Wired
`select_county` and `render_voxel_county` so public Riverside playable scene
packets are retrieved through the adapter and return safe packet metadata in
`_meta.scenePacket` while full scenes remain only in `_meta.scene`. Shell and
unsupported counties now return packet status metadata without scene payloads.
Added the read-only diagnostic route
`GET /api/engine/scene-packets/status`, which returns cache summaries only.

Why:
The human asked whether generation/offload work can move server-side and store
metadata so scenes can become instant later. The safe first runtime step is
per-process memory, not DB persistence. This proves deterministic packet keys,
TTL expiry, cache hit/miss behavior, eviction, and MCP metadata boundaries
without opening provider geometry, migrations, paid scope, or public Anaheim.

Current result:
- Same Riverside key returns cache miss then hit in the dedicated verifier.
- Selected-node changes produce distinct scene packet keys.
- TTL expiry forces refresh.
- Max-entry pressure evicts old entries.
- Shell and unsupported packet statuses contain no scene payload boundary.
- MCP/submission verifiers now assert `_meta.scenePacket` safety.

Files changed:
- `server/src/scenePacketMemoryAdapter.ts`
- `server/src/index.ts`
- `scripts/verify-scene-packet-memory-adapter.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `scripts/verify-mcp-flow.mjs`
- `scripts/verify-submission.mjs`
- `scripts/verify-tool-result-shape.mjs`
- `artifacts/current-update.json`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`
- `docs/updates/postalpha-0.32e-runtime-scene-packet-memory-adapter.md`

Verification:
- `pnpm --dir packages/core test` passed, 19 files / 84 tests.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `pnpm build:server` passed.
- `node --check scripts\verify-scene-packet-memory-adapter.mjs` passed.
- `node --check scripts\verify-mcp-flow.mjs` passed.
- `node --check scripts\verify-submission.mjs` passed.
- `node --check scripts\verify-tool-result-shape.mjs` passed.
- `node scripts\verify-scene-packet-memory-adapter.mjs --json-only` passed,
  `0 blockers`.
- Temporary local server on `http://127.0.0.1:8787` passed
  `pnpm verify:preview:http`, `pnpm verify:mcp`, `pnpm verify:submission`,
  and `node scripts\verify-scene-packet-memory-adapter.mjs --url http://127.0.0.1:8787 --json-only`.
- Warmed diagnostic route reported `entryCount: 1` without payload leakage.
- `node scripts\verify-scene-packet-cache-contract.mjs --json-only` passed.
- `node scripts\verify-no-google-in-renderer.mjs --json-only` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed, `0 blockers`, `0 unknowns`, `176 files`.
- Focused `git diff --check` passed with Windows LF-to-CRLF warnings only.

Skipped:
No DB persistence, migrations, live provider calls, provider geometry,
package/env drift, MCP tool-list change, public Anaheim/Ontario promotion,
Hosted Clawd, Stripe, XP, evidence, OAuth, automation, reports, exports, or
Railway mutation.

Next:
`0.33E DB Scene Packet Persistence Plan`: schema/review/rollback planning only,
with explicit human approval required before any DB implementation or migration.

## Entry 176

Quest:
Post-Alpha 0.31E Server Scene Packet Cache Contract.

What changed:
Added a core scene-packet cache contract for future server offload. The new
`packages/core/src/world/scenePacketCache.ts` defines deterministic scene packet
keys, runtime-only cache policies, readiness-specific packet boundaries,
future generation job states, and a safety checker. Exported the contract from
`@atlas/core`, added focused tests, and added
`scripts/verify-scene-packet-cache-contract.mjs` to verify the built package and
strict RC split envelope.

Why:
The human asked whether generation/offload work can move to the server and
whether metadata can be stored for instant generation later. The correct next
step is not DB persistence or live Google/provider calls. It is the contract
those services must obey: Riverside playable packets can be cached in runtime
memory, shell counties stay metadata-only, hidden Anaheim drafts remain
non-public, and provider/background generation stays blocked until explicit
backend gates reopen.

Current result:
- Riverside public playable plan is safe and runtime-memory only.
- Orange shell plan is safe and contains no scene geometry.
- Anaheim hidden draft plan is safe, non-public, and non-playable.
- Provider-normalized future generation reports named blockers.
- Background generation future reports named blockers.
- Strict `engine-beta-data` split guard reports `0 blockers` and `0 unknowns`.

Files changed:
- `packages/core/src/world/scenePacketCache.ts`
- `packages/core/src/world/index.ts`
- `packages/core/src/index.ts`
- `packages/core/test/scene-packet-cache.test.ts`
- `scripts/verify-scene-packet-cache-contract.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `scripts/verify-atlas-loop-readiness.mjs`
- `artifacts/current-update.json`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`
- `docs/updates/postalpha-0.31e-server-scene-packet-cache-contract.md`

Verification:
- `pnpm --dir packages/core typecheck` passed.
- `pnpm build:core` passed.
- `pnpm --dir packages/core test -- scene-packet-cache` passed, 19 files / 84
  tests.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `pnpm verify:preview:http` passed against a temporary local server on
  `http://127.0.0.1:8787/preview`, preview bytes `939160`.
- `node --check scripts\verify-scene-packet-cache-contract.mjs` passed.
- `node --check scripts\verify-alpha-rc-split.mjs` passed.
- `node scripts\verify-scene-packet-cache-contract.mjs --json-only` passed,
  `0 blockers`.
- `node scripts\verify-no-google-in-renderer.mjs --json-only` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `node scripts\verify-dynamic-window-refresh.mjs --json-only` passed.
- `node scripts\verify-atlas-loop-readiness.mjs --json-only` passed.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed, `0 blockers`, `0 unknowns`.

Skipped:
No DB persistence, migrations, Hosted Clawd, live provider calls, provider
geometry, package/env drift, MCP tool-list change, renderer/UI behavior,
public Anaheim/Ontario promotion, Stripe, XP, evidence, OAuth, automation,
reports, exports, staging, commit, deploy, or Railway mutation.

Next:
`0.32E Runtime Scene Packet Memory Adapter`: wire the 0.31E contract into
server runtime memory without DB persistence, live providers, package/env
drift, or public playability expansion.

## Entry 175

Quest:
Post-Alpha 0.30E Dynamic Window Refresh / Pan-Safe Scene Streaming.

What changed:
Added screen-center world-frame helpers in core and wired `CityWorldRenderer`
to refresh bounded scene windows when pan/zoom leaves the active buffered
frame. The renderer now uses preset-sized world windows shifted by the current
camera center, not raw screen-corner frames that can collapse into full-scene
drawing.

Artifact:
- `packages/core/src/voxel/cityWorldBasis.ts`
- `web/src/CityWorldRenderer.tsx`
- `scripts/verify-dynamic-window-refresh.mjs`

Current result:
- Initial desktop streaming window: 629 visible commands (`0.437` ratio).
- Panned desktop streaming window: 600 visible commands (`0.416` ratio).
- Small pan remains inside the active buffered frame.
- Large pan leaves the active buffered frame and requires refresh.
- Orange shell window remains terrain-only.
- Anaheim hidden draft remains non-playable, actor-free, and clutter-free.

Server/offload note:
The human's idea is directionally correct. The production shape should be
server-owned normalized location metadata, source/readiness notes, cached
`CityWorldScene` packet keys, TTL policy, and background generation jobs. The
widget should consume bounded scene windows instantly. 0.30E is the prerequisite
client-side streaming boundary, not DB persistence or live provider geometry.

Files changed:
- `packages/core/src/voxel/cityWorldBasis.ts`
- `packages/core/src/voxel/cityWorldSceneWindow.ts`
- `packages/core/src/index.ts`
- `packages/core/test/city-world-basis.test.ts`
- `packages/core/test/city-world-scene-window.test.ts`
- `web/src/CityWorldRenderer.tsx`
- `scripts/verify-dynamic-window-refresh.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `scripts/verify-atlas-loop-readiness.mjs`
- `artifacts/current-update.json`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`

Verification:
- `pnpm --dir packages/core test -- city-world-basis city-world-scene-window`
  passed, 18 files / 77 tests.
- `pnpm --dir packages/core test` passed, 18 files / 77 tests.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `node --check scripts\verify-dynamic-window-refresh.mjs` passed.
- `node scripts\verify-dynamic-window-refresh.mjs --json-only` passed.
- `node scripts\verify-window-aware-renderer.mjs --json-only` passed.
- `node scripts\verify-scene-window-compiler.mjs --json-only` passed.
- `node scripts\verify-render-command-layer-budget.mjs --json-only` passed.
- `node scripts\debug-city-world-engine.mjs --json-only` passed.
- `node scripts\verify-no-google-in-renderer.mjs --json-only` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `node scripts\verify-atlas-loop-readiness.mjs --json-only` passed.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed with 0 blockers and 0 unknowns.
- Local server proof on `http://127.0.0.1:8787` passed:
  `pnpm verify:preview:http`, `node scripts\verify-engine-beta-coverage.mjs`,
  `pnpm verify:mcp`, and `pnpm verify:submission`.

Screenshot root:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-030e-dynamic-window-refresh-local`

Skipped:
No backend cache implementation, no DB persistence, no public Anaheim/Ontario
promotion, no provider geometry, no MCP tool-list change, no package or
lockfile change, no Hosted Clawd, Stripe, XP, evidence, OAuth, automation,
reports, exports, or deploy.

Next:
Run the full local gate stack. If green, choose either `0.31E Server Scene
Packet Cache Contract` for the server/offload direction or `0.31E Object Kit
Prefab + Palette Contract` for visual engine quality.

## Entry 174

Quest:
Post-Alpha 0.29E Window-Aware Renderer Consumption.

What changed:
Moved `CityWorldRenderer` onto the 0.28E scene-window boundary. The renderer
now resolves the active desktop, mobile, or residential-detail camera preset,
compiles a `CityWorldSceneWindow`, and draws from `sceneWindow.visibleCommands`
instead of building full-scene render command buffers directly.

Artifact:
- `web/src/CityWorldRenderer.tsx`
- `scripts/verify-window-aware-renderer.mjs`

Current result:
- Riverside desktop renderer window: 342 visible commands (`0.237` ratio).
- Riverside mobile renderer window: 572 visible commands (`0.397` ratio).
- Residential-detail renderer window: 129 visible commands (`0.09` ratio).
- Orange shell renderer window stays terrain-only.
- Anaheim hidden draft renderer window stays non-playable, actor-free, and
  clutter-free.

Files changed:
- `web/src/CityWorldRenderer.tsx`
- `scripts/verify-window-aware-renderer.mjs`
- `scripts/verify-render-command-layer-budget.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `scripts/verify-atlas-loop-readiness.mjs`
- `artifacts/current-update.json`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`

Verification:
- `node --check scripts\verify-window-aware-renderer.mjs` passed.
- `pnpm --dir packages/core test` passed, 18 files / 74 tests.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `node scripts\verify-window-aware-renderer.mjs --json-only` passed.
- `node scripts\verify-scene-window-compiler.mjs --json-only` passed.
- `node scripts\verify-render-command-layer-budget.mjs --json-only` passed
  after updating it for the renderer -> scene-window -> render-command chain.
- `node scripts\debug-city-world-engine.mjs --json-only` passed.
- `node scripts\verify-no-google-in-renderer.mjs --json-only` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `node scripts\verify-atlas-loop-readiness.mjs --json-only` passed.
- Local server proof on `http://127.0.0.1:8787` passed:
  `pnpm verify:preview:http`, `node scripts\verify-engine-beta-coverage.mjs`,
  `pnpm verify:mcp`, and `pnpm verify:submission`.

Screenshot root:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-029e-window-aware-renderer-local`

Skipped:
No visual redesign, no public UI copy change, no public Anaheim/Ontario
promotion, no provider geometry, no MCP tool-list change, no package or
lockfile change, no DB, Hosted Clawd, persistence, Stripe, XP, evidence,
OAuth, automation, reports, exports, or deploy.

Next:
Run `0.30E Dynamic Window Refresh / Pan-Safe Scene Streaming` if the next
priority is engine scale, or `0.31E Object Kit Prefab + Palette Contract` if
the next priority is visual quality on top of the window-aware renderer.

## Entry 173

Quest:
Post-Alpha 0.28E Tile Chunk / Scene Window Compiler.

What changed:
Added a core `CityWorldScene` chunk index and camera-specific scene window
compiler on top of the 0.27E render command buffer. The new engine layer
computes visible commands for desktop, mobile, and residential-detail camera
presets without requiring the renderer to reason over the whole command buffer.

Artifact:
- `packages/core/src/voxel/cityWorldSceneWindow.ts`
- `scripts/verify-scene-window-compiler.mjs`

Current result:
- Riverside chunk count: 24.
- Riverside total command count: 1,441.
- Desktop visible commands: 342 (`0.237` visibility ratio).
- Mobile visible commands: 572 (`0.397` visibility ratio).
- Residential-detail visible commands: 129 (`0.09` visibility ratio).
- Orange shell window passes as terrain-only empty state.
- Anaheim hidden draft window passes non-playable actor/pin-free probe.
- Ontario hidden draft window passes non-playable actor/pin-free probe.

Files changed:
- `packages/core/src/voxel/cityWorldSceneWindow.ts`
- `packages/core/src/voxel/index.ts`
- `packages/core/src/index.ts`
- `packages/core/test/city-world-scene-window.test.ts`
- `scripts/verify-scene-window-compiler.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `scripts/verify-atlas-loop-readiness.mjs`
- `artifacts/current-update.json`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`

Verification:
- `pnpm --dir packages/core test -- city-world-scene-window` passed,
  18 files / 74 tests.
- `pnpm --dir packages/core typecheck` passed.
- `pnpm build:core` passed.
- `node --check scripts\verify-scene-window-compiler.mjs` passed.
- `node scripts\verify-scene-window-compiler.mjs --json-only` passed.
- `pnpm --dir packages/core test` passed, 18 files / 74 tests.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `node scripts\verify-render-command-layer-budget.mjs --json-only` passed.
- `node scripts\debug-city-world-engine.mjs --json-only` passed.
- `node scripts\verify-no-google-in-renderer.mjs --json-only` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `node scripts\verify-atlas-loop-readiness.mjs --json-only` passed.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed with 0 blockers and 0 unknowns.
- Local server proof on `http://127.0.0.1:8787` passed:
  `pnpm verify:preview:http`, `node scripts\verify-engine-beta-coverage.mjs`,
  `pnpm verify:mcp`, and `pnpm verify:submission`.

Screenshot root:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-028e-scene-window-local`

Skipped:
No renderer visual change, no public UI copy change, no public Anaheim/Ontario
promotion, no provider geometry, no MCP tool-list change, no server route
change, no package or lockfile change, no DB, Hosted Clawd, persistence,
Stripe, XP, evidence, OAuth, automation, reports, exports, or deploy.

Next:
Run the full local gate stack. If green, the next engine slice should either
make the renderer consume scene windows safely or move to an object-kit
prefab/palette contract on top of render commands and windows.

## Entry 172

Quest:
Post-Alpha 0.27E Render Command Pipeline / Layer Budget.

What changed:
Added an Atlas-owned render command buffer in core and wired
`CityWorldRenderer` to consume command ordering for terrain, roads, lots,
buildings, props, actors, markers, pins, and labels. This is an engine
discipline slice: future visual work can now be measured by layer commands and
budget results before it reaches Pixi drawing.

Artifact:
- `packages/core/src/voxel/cityWorldRenderCommands.ts`
- `scripts/verify-render-command-layer-budget.mjs`

Current result:
- Riverside public render budget passes.
- Riverside command count: 1,441.
- Riverside budget weight: 1,570.
- Riverside public clutter commands: 0.
- Orange shell empty-state budget passes.
- Anaheim hidden draft probe budget passes.
- Ontario hidden draft probe budget passes.

Files changed:
- `packages/core/src/voxel/cityWorldRenderCommands.ts`
- `packages/core/src/voxel/index.ts`
- `packages/core/src/index.ts`
- `packages/core/test/city-world-render-commands.test.ts`
- `web/src/CityWorldRenderer.tsx`
- `scripts/verify-render-command-layer-budget.mjs`
- `scripts/verify-atlas-loop-readiness.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `artifacts/current-update.json`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`

Verification:
- `pnpm --dir packages/core test -- city-world-render-commands` passed,
  17 files / 71 tests.
- `pnpm --dir packages/core typecheck` passed.
- `pnpm build:core` passed.
- `node --check scripts\verify-render-command-layer-budget.mjs` passed.
- `node scripts\verify-render-command-layer-budget.mjs --json-only` passed.
- `node scripts\verify-atlas-loop-readiness.mjs --json-only` passed.

Skipped:
No public UI copy change, no visual redesign, no public Anaheim/Ontario
promotion, no provider geometry, no MCP tool-list change, no server route
change, no package or lockfile change, no DB, Hosted Clawd, persistence,
Stripe, XP, evidence, OAuth, automation, reports, exports, or deploy.

Next:
Run full type/build/provider/split gates. After that, the next engine slice
should use the command buffer as the measuring floor before changing object
art, terrain, chunking, or second-district scene generation.

## Entry 171

Quest:
Post-Alpha 0.25E Owner Gate Closure / Public Promotion Cutline execution.

What changed:
Implemented the owner-gate cutline as a core evaluator and focused verifier.
The cutline now consumes the 0.24E readiness aggregate and returns one binary
outcome: `APPROVE_CONTROLLED_PUBLIC_SPIKE` or `BLOCK_PROMOTION`. It prevents
valid hidden/product evidence from being mistaken for public-playable approval.

Artifact:
Generated
`artifacts/second-district-readiness/latest/anaheim-candidate/owner-gate-cutline.json`.

Current result:
- Outcome: `BLOCK_PROMOTION`.
- `readyForPlayablePromotion: false`.
- Lumen gate: blocked by `visual_packet_not_promotion_ready`.
- Mira gate: blocked by `product_proof_not_promotion_ready`.
- Forge gate: blocked by `forge_split_guard_acceptance_missing`.
- Axiom gate: blocked because the readiness aggregate is not promotion-ready.

Files changed:
- `packages/core/src/world/districtOwnerGateCutline.ts`
- `packages/core/src/world/index.ts`
- `packages/core/src/index.ts`
- `packages/core/test/district-owner-gate-cutline.test.ts`
- `scripts/verify-second-district-owner-gate-cutline.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `artifacts/current-update.json`
- `artifacts/second-district-readiness/latest/anaheim-candidate/owner-gate-cutline.json`

Verification:
- `pnpm build:core` passed.
- `pnpm --dir packages/core test -- district-owner-gate-cutline` passed,
  16 files / 67 tests.
- `node scripts\verify-second-district-owner-gate-cutline.mjs --readiness
  artifacts\second-district-readiness\latest\anaheim-candidate\readiness-aggregate.json
  --out
  artifacts\second-district-readiness\latest\anaheim-candidate\owner-gate-cutline.json
  --json-only` passed and reported `BLOCK_PROMOTION`.

Skipped:
No public Anaheim/Ontario switcher state, no playable promotion, no renderer
work, no MCP tool-list change, no provider geometry, no Google scene data, no
package or lockfile change, no DB, Hosted Clawd, persistence, Stripe, XP,
evidence, OAuth, automation, reports, exports, or deploy.

Next:
Do not run a controlled Anaheim public playable spike yet. The correct next
slice is either a public Engine Beta quality pass or one focused hidden
source-art blocker named by Lumen. Public release pressure does not override
the cutline.

## Entry 170

Quest:
Post-Alpha 0.25E Owner Gate Closure / Public Promotion Cutline spec.

What changed:
Added the executable 0.25E spec at
`docs/updates/postalpha-0.25e-owner-gate-closure-public-promotion-cutline.md`.
Updated `artifacts/current-update.json`, `docs/NEXT_QUESTS.md`, and
`docs/updates/ATLAS_RELEASE_LADDER.md` so the active quest is now the owner
gate closure cutline rather than another broad hidden Anaheim pass.

Spec stance:
0.25E has two valid outcomes only. Either Lumen, Mira, Forge, and Axiom close
the remaining promotion gates with evidence and 0.26E becomes a controlled
Anaheim public playable spike, or Anaheim stays hidden and Atlas returns to
public Engine Beta quality. Metadata flips, public switcher exposure, provider
geometry, and hidden-draft promotion are explicitly blocked.

Skipped:
No code behavior change, no public Anaheim/Ontario exposure, no deploy, no MCP
tool-list change, no renderer work, no provider geometry, no DB, Hosted Clawd,
persistence, Stripe, XP, evidence, OAuth, automation, reports, or exports.

Verification:
Spec wiring only. Ran focused strict split and diff checks after the doc/update
patch.

## Entry 169

Quest:
Post-Alpha 0.24E Second-District Promotion Readiness Aggregator.

What changed:
Hardened the Anaheim readiness aggregator so it treats valid boundary evidence
as evidence, not as a missing proof. A ChatGPT product proof can now pass as a
boundary proof while still blocking public playable promotion through explicit
`product_proof_not_promotion_ready`, `product_proof_not_public_playable`, and
`product_proof_mira_acceptance_missing` blockers. The visual packet slug now
normalizes `anaheim-candidate` to the existing `anaheim` visual packet format.

Artifact:
Exported the latest Anaheim readiness report to
`artifacts/second-district-readiness/latest/anaheim-candidate`.

Current readiness result:
- `readyForPlayablePromotion: false`.
- Data/source gates: passed.
- Visual packet: passed as evidence, but not promotion-ready or public-playable.
- Product proof: passed as boundary evidence, but not promotion-ready,
  public-playable, or Mira-accepted.
- Split guard: passed with 149 files, 0 blockers, 0 unknowns.
- Release blockers remain: owner acceptance and promotion packet readiness.

Files changed:
- `packages/core/src/world/districtReadinessAggregator.ts`
- `packages/core/test/district-readiness-aggregator.test.ts`
- `scripts/verify-second-district-readiness.mjs`
- `artifacts/current-update.json`
- `artifacts/second-district-readiness/latest/anaheim-candidate/product-proof.json`
- `artifacts/second-district-readiness/latest/anaheim-candidate/readiness-aggregate.json`
- `artifacts/second-district-readiness/latest/anaheim-candidate/promotion-packet.json`
- `artifacts/second-district-readiness/latest/anaheim-candidate/source-to-scene-trace.json`
- `artifacts/second-district-readiness/latest/anaheim-candidate/release-status.json`
- `docs/CHATGPT_ENTRY_SURFACE_PROOF.md`

Verification:
- `pnpm --dir packages/core test -- district-readiness-aggregator` passed,
  15 files / 65 tests.
- `pnpm build:core` passed.
- `node scripts\verify-chatgpt-entry-surface.mjs --mcp-url
  https://atlas-backend-production-e6fc.up.railway.app/mcp --district
  anaheim-candidate --json-out
  artifacts\second-district-readiness\latest\anaheim-candidate\product-proof.json`
  passed.
- `node scripts\verify-second-district-readiness.mjs --district
  anaheim-candidate --visual-packet
  C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-023e-hidden-venue-authorship-public\visual-packet
  --product-proof
  artifacts\second-district-readiness\latest\anaheim-candidate\product-proof.json
  --json-only` passed with all evidence states passed and
  `readyForPlayablePromotion: false`.
- `node scripts\export-second-district-readiness-artifact.mjs --district
  anaheim-candidate ... --json-only` passed and wrote the latest readiness
  artifact.

Skipped:
No public Anaheim/Ontario switcher state, no playable promotion, no renderer
art pass, no MCP tool-list change, no provider geometry, no Google scene data,
no package or lockfile change, no DB, Hosted Clawd, persistence, Stripe, XP,
evidence, OAuth, automation, reports, exports, or deploy.

Next:
0.25E Owner Gate Closure / Public Promotion Cutline. Either turn the remaining
visual/product/release owner gates into real acceptance evidence with public
UI screenshots, or keep Anaheim blocked and move back to public Engine Beta
quality. Do not flip metadata to make Anaheim playable.

## Entry 168

Quest:
Post-Alpha 0.23E Hidden Venue Authorship public deploy and proof.

What changed:
Deployed the 0.23E hidden venue authorship slice to Railway and proved the
public app after rollout. The public `/preview` bundle now matches the local
0.23E build at 929902 bytes. Anaheim remains hidden and non-playable, while the
public Riverside/Eastvale playable loop, Orange shell, Unknown/L0 recovery, and
seven-tool MCP surface all remain green.

Public URL:
`https://atlas-backend-production-e6fc.up.railway.app`.

Railway:
- Project: `atlas-chatgpt-app`.
- Environment: `production`.
- Service: `atlas-backend`.
- Deploy command: `railway up --detach --message "Atlas 0.23E hidden venue authorship and July 4 roadmap"`.
- Build logs:
  `https://railway.com/project/e2a26709-5bf0-499e-986f-75e6081305f0/service/d5aee313-8558-47e6-9b41-a517b871a6b8?id=5ae19e5c-51c3-4b14-9f40-0ed11a318a21&`.

Public proof:
- `pnpm verify:preview:http` passed against the Railway `/preview`, preview
  bytes `929902`.
- `pnpm verify:mcp` passed against the Railway `/mcp`, 7 tools.
- `pnpm verify:submission` passed against the Railway `/mcp`, 7 tools.
- `node scripts\verify-engine-beta-coverage.mjs` passed against Railway:
  58 indexed California counties, 1 playable, 57 shells, Riverside
  `L2_CURATED_DISTRICT`, Orange `L1_COUNTY_SHELL`, Unknown/L0 unsupported.
- `node scripts\verify-anaheim-draft-scene.mjs --url
  https://atlas-backend-production-e6fc.up.railway.app/preview?atlasNoLabels=1
  --no-label-crops` passed desktop, mobile, detail, and no-label crop proof.
- `node scripts\verify-second-district-visual-packet.mjs --district anaheim`
  passed against the public packet.
- `node scripts\verify-scout-campaign-alpha-loop.mjs --json-only` passed.

Public screenshot roots:
- Coverage:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-023e-hidden-venue-authorship-public\coverage`.
- Hidden Anaheim no-label draft:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-023e-hidden-venue-authorship-public\anaheim-draft-no-label`.
- Visual packet:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-023e-hidden-venue-authorship-public\visual-packet`.

Visual packet result:
`HIDDEN_DRAFT_ONLY`, `promotionReady: false`, `publicPlayable: false`. Anaheim
Convention Center and ARTIC / Angel Stadium area pass the current hidden
no-label object-family read, but exact landmark promotion still requires the
0.24E readiness aggregator and later owner gates before any public claim.

Skipped:
No public Anaheim/Ontario switcher state, no playable promotion, no MCP
tool-list change, no provider geometry, no Google scene data, no package or
lockfile change, no DB, Hosted Clawd, persistence, Stripe, XP, evidence, OAuth,
automation, reports, exports, or new public UI.

Next:
0.24E Second-District Promotion Readiness Aggregator. Build one command that
combines source anchors, hidden draft proof, visual packet, product proof,
provider boundary, split guard, and public UI readiness into a machine-readable
`readyForPlayablePromotion` report. It must remain `false` until every gate is
green.

## Entry 167

Quest:
Post-Alpha 0.23E Hidden Venue Authorship Pass.

What changed:
Stabilized the 0.23E hidden Anaheim venue slice. The Anaheim draft compiler now
keeps Convention Center, ARTIC, and Angel Stadium as separate hidden civic/venue
stress cells. ARTIC support masses were tightened into the terminal envelope so
the mobile proof sees the full transit anchor instead of only the terminal and
platform edge. The Pixi renderer now draws stronger reusable venue grammar for
large hall, transit hub, and stadium-bowl forms without adding props, cars,
humans, labels, glows, or public panels.

Metric result:
The hidden Anaheim civic/venue object-kit floor moved from the failing
`0.877` ARTIC score to `0.970` overall. ARTIC mobile readiness moved from
`0.493` to `0.993`. Anaheim now reports three hidden stress cells:
`anaheim-convention-center-venue-anchor`, `artic-transit-anchor`, and
`angel-stadium-venue-anchor`.

Screenshots and packet:
Local screenshot root:
`C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-023e-hidden-venue-authorship-local`.
The visual packet is at
`C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-023e-hidden-venue-authorship-local\visual-packet`.
The packet outcome is `HIDDEN_DRAFT_ONLY`, `promotionReady: false`, and
`publicPlayable: false`.

Product boundary:
Public Riverside/Eastvale remains the only playable district. Orange shell and
Unknown/L0 recovery still pass on mobile. Anaheim stays non-public and
non-playable with no selected-place tray, no pins, no actors, no sticker tools,
and no note input.

Skipped:
No public Anaheim/Ontario switcher, no MCP tool-list change, no provider
geometry, no Google scene data, no package or lockfile change, no DB, Hosted
Clawd, persistence, Stripe, XP, evidence, OAuth, automation, reports, exports,
staging, commit, or deploy.

Verification:
Passed: `pnpm --dir packages/core test`, `pnpm typecheck:starter`,
`pnpm build:starter`, `pnpm verify:preview:http`, local `pnpm verify:mcp`,
local `pnpm verify:submission`, `node scripts\verify-engine-beta-coverage.mjs`,
`node scripts\verify-civic-venue-object-kit-contract.mjs --json-only`, `node
scripts\verify-face-orientation-source-contrast.mjs --json-only`, `node
scripts\verify-anaheim-draft-scene.mjs --url
http://127.0.0.1:8787/preview?atlasNoLabels=1 --no-label-crops`, `node
scripts\verify-second-district-draft-scene.mjs --anchor-pack
data\district_place_anchor_packs\anaheim-anchors.json --json-only`, `node
scripts\verify-anaheim-promotion-readiness.mjs --json-only`, `node
scripts\verify-second-district-visual-packet.mjs --district anaheim`, `node
scripts\verify-no-google-in-renderer.mjs --json-only`, `node
scripts\verify-provider-boundaries.mjs --json-only`, `node
scripts\verify-tool-result-shape.mjs --json-only`, and strict
`engine-beta-data` split guard with 148 files, 0 blockers, and 0 unknowns.

## Entry 166

Quest:
Atlas Real Consumer App roadmap logging and July 4 release cutline.

What changed:
Created `docs/ATLAS_REAL_CONSUMER_APP_ROADMAP.md` as the durable execution
spine for the product route: public Alpha proof, consumer entry quality, engine
quality cell, second playable district, consumer save layer, and Hosted Clawd
Beta. Updated `docs/NEXT_QUESTS.md` to point July 4 work at the public
Alpha/Engine Beta cutline and updated `docs/DECISIONS.md` with the durable
Real Consumer App decision. Added the roadmap doc to the strict selected-RC
allowlist in `scripts/verify-alpha-rc-split.mjs` so the source-of-truth plan is
treated as an intentional Engine Beta artifact instead of an unknown path.

Linear:
Saved the top-level roadmap document in Linear:
`https://linear.app/reflexfasdf/document/atlas-real-consumer-app-roadmap-chatgpt-voxel-county-engine-188753001a1c`.
Creating Linear implementation issues was blocked by the workspace free issue
limit, so repo docs remain the implementation source of truth until Linear
capacity is available.

Release cutline:
July 4 work should stabilize or park `0.23E`, prove the public app, and avoid
full paid/backend/national scope. Riverside/Eastvale remains the public
playable anchor; California shells stay honest; Anaheim/Ontario remain hidden
until promotion gates pass.

Skipped:
No runtime code, renderer behavior, MCP tool-list, public UI, provider
geometry, package or lockfile, Hosted Clawd, persistence, Stripe, XP, evidence,
OAuth, automation, reports, exports, staging, commit, or deploy. The split
verifier change only allows the new roadmap document; it does not widen
server/env/backend or paid-scope paths.

Verification:
Focused docs verification and split guard are required after this entry.

## Entry 165

Quest:
Pre-Alpha 0.13E Mobile LOD / Occlusion Budget Enforcement.

What changed:
Implemented named mobile LOD budgets in
`packages/core/src/voxel/cityWorldDerivedTerrainMap.ts`. `@atlas/core` now
exports `CityWorldMobileLodBudgetProfileId`, `CityWorldMobileLodBudget`,
`CityWorldMobileLodBudgetResult`, `CITY_WORLD_MOBILE_LOD_BUDGETS`, and
`evaluateCityWorldMobileLodBudget`. The budgets cover `playable_mobile`,
`residential_detail_probe`, `shell_mobile_empty_state`, and
`hidden_draft_mobile_probe`.

Upgraded `scripts/verify-cityworld-mobile-occlusion.mjs` from loose per-target
thresholds to named budget enforcement. The verifier now reports
`budgetProfileId`, `budgetPassed`, `budgetBlockers`, grouped blockers, counts,
and metrics for Riverside mobile, Riverside residential-detail, Orange shell,
Anaheim hidden draft, and Ontario hidden draft.

Extended `packages/core/test/city-world-derived-terrain-map.test.ts` so normal
mobile, residential-detail, shell, and hidden-draft scenes are checked against
their budget profiles. The test also proves residential-detail is not treated
as the public mobile path and that budget output does not leak provider or
promotion language.

Result:
The mobile verifier passes with named budget profiles. Riverside normal mobile
passes `playable_mobile` with `mobileOcclusionRiskScore: 0.245`,
`mobileReadabilityScore: 0.755`, `traySafeBandPressureRatio: 0.276`,
`interactiveMarkerPressureRatio: 0.313`, and `verticalStackPressureRatio:
0.075`. Residential-detail passes as a dense proof crop. Orange shell remains
empty. Anaheim/Ontario hidden drafts remain non-playable, actor-free, and
pin-free.

Skipped:
No renderer change, no browser overlay, no public UI change, no MCP tool-list
change, no provider geometry, no public Anaheim/Ontario promotion, no external
runtime dependency, no package or lockfile change, no persistence, Hosted
Clawd, Stripe, XP, evidence, OAuth, automation, reports, exports, staging,
commit, or deploy.

Verification:
Passed: `pnpm --dir packages/core test`, `pnpm typecheck:starter`, `pnpm
build:starter`, `node scripts\verify-cityworld-mobile-occlusion.mjs
--json-only`, `node scripts\verify-cityworld-derived-terrain-maps.mjs
--json-only`, `node scripts\verify-no-google-in-renderer.mjs --json-only`,
`node scripts\verify-provider-boundaries.mjs --json-only`, `node
scripts\verify-tool-result-shape.mjs --json-only`, `node --check
scripts\verify-alpha-rc-split.mjs`, and strict `engine-beta-data` split guard
with 133 files, 0 blockers, and 0 unknowns. Focused `git diff --check` passed
with only Windows LF-to-CRLF warnings.

## Entry 164

Quest:
Pre-Alpha 0.13E Mobile LOD / Occlusion Budget Enforcement planning.

What changed:
Added the execution-ready 0.13E plan in
`docs/updates/prealpha-0.13e-mobile-lod-occlusion-budget-enforcement.md` and
linked it from `docs/NEXT_QUESTS.md`. The plan makes the next code slice a
budget-enforcement artifact on top of `deriveCityWorldMobileOcclusion`, not
another subjective screenshot pass.

ChatGPT app alignment:
0.13E protects the normal 390x844 app surface: map-first view, county switcher,
selected-place tray, pins, notes, shell/L0 recovery, concise
`structuredContent`, and large scene/debug data outside public copy. It
explicitly rejects dashboards, internal LOD jargon, hidden-draft labels,
provider geometry, and public debug overlays.

Linear:
Attempted to create a Linear tracker for 0.13E, but the workspace is at its
free issue limit. The repo document remains the source of truth until Linear
capacity is available.

Skipped:
No code implementation yet, no renderer/UI change, no public Anaheim/Ontario
promotion, no provider geometry, no dependency change, no persistence, Hosted
Clawd, Stripe, XP, evidence, OAuth, automation, reports, exports, staging,
commit, or deploy.

Verification:
Pending implementation. This planning slice only touched docs.

## Entry 163

Quest:
Pre-Alpha 0.12E Axiom integration grading.

What changed:
Accepted Mira's 0.12E code artifact as the right shape of work: core engine
diagnostics, tests, and verifier scripts, not a docs-only gate. Updated
`artifacts/current-update.json` from stale 0.11E object-authorship status to
`prealpha-0.12e-derived-terrain-mobile-occlusion`, added the missing 0.12E
release-ladder update note, and advanced `docs/updates/ATLAS_RELEASE_LADDER.md`
toward 0.13E mobile LOD / occlusion budget enforcement.

Result:
The current update now matches the actual code artifact in `@atlas/core`:
`deriveCityWorldTerrainMap` and `deriveCityWorldMobileOcclusion`. The next
worker should target measured mobile/occlusion or face-orientation diagnostics,
not another broad art critique or docs-only planning pass.

Skipped:
No renderer rewrite, no public UI change, no provider geometry, no public
Anaheim/Ontario promotion, no GameBlocks/VoxCity/VoxelSpace/Pixels2Voxels
runtime dependency, no package or lockfile change, no persistence, Hosted
Clawd, Stripe, XP, evidence, OAuth, automation, reports, exports, staging,
commit, or deploy.

Verification:
Passed: `pnpm --dir packages/core test`, `pnpm typecheck:starter`, `pnpm
build:starter`, `node scripts\verify-cityworld-derived-terrain-maps.mjs
--json-only`, `node scripts\verify-cityworld-mobile-occlusion.mjs
--json-only`, `node scripts\verify-external-voxel-reference-adapter.mjs
--json-only`, `node scripts\verify-gameblocks-atlas-adapter.mjs --json-only`,
`node scripts\verify-no-google-in-renderer.mjs --json-only`, `node
scripts\verify-provider-boundaries.mjs --json-only`, `node
scripts\verify-tool-result-shape.mjs --json-only`, `node
scripts\verify-big4-artifact-packets.mjs --json-only`, and strict
`engine-beta-data` split guard with 131 files, 0 blockers, and 0 unknowns.

## Entry 162

Quest:
Pre-Alpha 0.12E Derived Terrain Map Engine Proof.

What changed:
Added an Atlas-owned terrain-map engine proof inspired by the external voxel
research without importing any external runtime. `@atlas/core` now exposes
`deriveCityWorldTerrainMap` and `deriveCityWorldMobileOcclusion` from
`CityWorldScene`. The derived map emits stable height/color arrays, cell-level
terrain/object occupancy, water-edge cut signal, color-key distributions, and
non-flat/occupied ratios. The occlusion report measures mobile frame pressure,
tray-safe-band pressure, marker pressure, and readability risk from the same
scene contract the Pixi app consumes.

Added focused tests and verifiers:
- `packages/core/test/city-world-derived-terrain-map.test.ts` protects
  Riverside terrain variation, mobile occlusion/readability, Orange shell
  zero fake object occupancy, and hidden draft non-playability.
- `scripts/verify-cityworld-derived-terrain-maps.mjs` checks Riverside, Orange
  shell, Anaheim hidden draft, and Ontario hidden draft from built core output.
- `scripts/verify-cityworld-mobile-occlusion.mjs` checks normal mobile,
  residential-detail, shell, and hidden-draft occlusion budgets.

Updated the external-reference adapter and split guards so this is a required
code artifact, not a docs-only research packet.

Result:
The derived terrain proof reports public Riverside `heightRange: 3.05`,
`nonFlatCellRatio: 0.83`, `occupiedCellRatio: 0.437`, `colorKeyCount: 26`, and
`waterEdgeCutRatio: 0.608`. Orange shell remains non-playable with
`objectOccupiedCellCount: 0`. Anaheim/Ontario hidden drafts remain
non-playable while still exposing bounded prep terrain variation and object
occupancy for screenshot harnesses only.

Skipped:
No dependency install, no vendoring VoxCity/VoxelSpace/Pixels2Voxels, no
renderer rewrite, no provider geometry, no public Anaheim/Ontario promotion, no
dashboard, no product state change, no persistence, Hosted Clawd, Stripe, XP,
evidence, OAuth, automation, reports, exports, staging, commit, or deploy.

Verification:
Passed: `pnpm --dir packages/core test -- city-world-derived-terrain-map`,
`pnpm build:core`, `node --check
scripts\verify-cityworld-derived-terrain-maps.mjs`, `node --check
scripts\verify-cityworld-mobile-occlusion.mjs`, `node
scripts\verify-cityworld-derived-terrain-maps.mjs --json-only`, and `node
scripts\verify-cityworld-mobile-occlusion.mjs --json-only`.

## Entry 161

Quest:
External Voxel Reference Adapter.

What changed:
Researched VoxCity, VoxelSpace, and Pixels2Voxels as engine references and
captured the usable pieces in `docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md`.
VoxCity contributes the strongest source-grid and voxelization lessons:
rotated grid geometry, `GridProjector` basis invariants, source coverage maps,
selected/effective source and fallback reasoning, footprint overlap thresholds,
min/max height grids, voxel layer separation, visible memory preflight, water
and elevation cleanup, face-aware material/window rhythm, surface face
metadata, surface-aware downsampling, and debug payload caps. VoxelSpace contributes terrain height/color map, occlusion buffer,
distance LOD, camera/composition, and density-budget lessons while explicitly
rejecting its demo maps/palettes. Pixels2Voxels contributes an offline
source-art channel/contrast QA idea only.

Added `scripts/verify-external-voxel-reference-adapter.mjs` to prove the
adapter exists, Axiom's reference stack names it, Next Quests and Decisions
record the dependency boundary, `package.json` does not add reference-runtime
dependencies, and runtime source does not import VoxCity/Open3D/Three/Rapier
patterns.

Dependency read:
No dependency should be taken from these repos for Atlas runtime. The right move
is to adapt contracts and diagnostics into Atlas-owned code. VoxCity is too
Python/GIS/live-ingestion heavy, Pixels2Voxels is an Open3D viewer, and
VoxelSpace is intentionally terrain-only. Their useful value is architecture
pressure, not package installation.

Skipped:
No vendoring, no package or lockfile change, no Python/Open3D/Three/Rapier
dependency, no Earth Engine or live provider ingestion, no renderer rewrite, no
terrain-only app, no image-to-voxel runtime path, no public Anaheim/Ontario
promotion, no product UI change, no persistence, Hosted Clawd, Stripe, XP,
evidence, OAuth, automation, reports, exports, staging, commit, or deploy.

Verification:
Passed: `node --check scripts\verify-external-voxel-reference-adapter.mjs`,
`node --check scripts\verify-big4-artifact-packets.mjs`, `node --check
scripts\verify-alpha-rc-split.mjs`, `node
scripts\verify-external-voxel-reference-adapter.mjs --json-only`, `node
scripts\verify-big4-artifact-packets.mjs --json-only`, strict
`engine-beta-data` split guard with 126 files and 0 blockers / 0 unknowns, and
focused `git diff --check` with only Windows LF-to-CRLF warnings.

## Entry 160

Quest:
Pre-Alpha 0.11E Public Object Authorship.

What changed:
Recorded the 0.11E metric decision: 0.10E terrain/world-edge work clears the
current floor, so the next visible weakness is public Riverside object
identity, not another terrain pass and not hidden Anaheim. Added a public
Riverside object-authorship renderer pass on top of existing `CityWorldScene`
object-family grammar. The pass strengthens Eastvale Core landmark base,
roof/cap, entry, and facade rhythm; adds clearer residential roof, porch,
window, and side-face cues; deepens commerce awning/bay caps; adds apartment
side-core/roof-inset/window rhythm; and improves service/gym entry and
sawtooth read.

The compiler now makes the public Riverside anchor intent more explicit for
Eastvale Core, the gym/service block, and the apartment lowrise blocks without
adding a parallel schema. The object-authorship verifier now evaluates built
Riverside diagnostics, preserves the 0.10E terrain floors, locks object-family
viewport presence, and keeps `homeClonePressure <= 0.20`.

Result:
0.11E passes the measured object-authorship gate. The object verifier reports
`terrainMassingCoverageRatio: 0.796`, `emptyBoardRatio: 0.151`,
`firstViewportCompositionScore: 0.754`,
`chunkEdgeReadabilityFloorScore: 0.668`, `objectFamilyCoverageRatio: 1`,
`homeClonePressure: 0.2`, and `homeVariantCount: 12`. Viewport object-family
counts remain desktop `4`, mobile `5`, and residential-detail `1`.

Screenshot read:
Riverside desktop and mobile remain map-first with tray, switcher, pins, notes,
and session-only copy intact. Eastvale Core reads as a stronger landmark,
residential/detail crops show better roof/entry/window rhythm, and apartment,
commerce, and service objects have clearer category cues. This is still
Alpha-grade art, but it is no longer just another terrain stroke pass.

Screenshots:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e011-engine-coverage\riverside\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e011-engine-coverage\riverside\alpha-product-loop-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e011-engine-coverage\residential-detail\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e011-engine-coverage\residential-detail\alpha-product-loop-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e011-engine-coverage\orange-shell\shell-county-widget-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e011-engine-coverage\unsupported\shell-county-widget-mobile-390x844.png`

Skipped:
No new object schema, no new terrain profile names, no cars, humans, walkers,
decorative props, signs, labels-as-crutches, panels, glows, provider geometry,
GameBlocks import, public Anaheim/Ontario promotion, MCP tool-list changes,
product UI changes, persistence, Hosted Clawd, Stripe, XP, evidence, OAuth,
automation, reports, or exports.

Verification:
Passed: `pnpm --dir packages/core test` (14 files / 60 tests),
`pnpm typecheck:starter`, `pnpm build:starter`, `pnpm verify:preview:http`,
`node scripts\debug-city-world-engine.mjs --out
C:\Users\mzwin\AppData\Local\Temp\atlas-e011-debug-engine --json-only`, `node
scripts\verify-object-authorship-scene-grammar.mjs --json-only`, `node
scripts\verify-terrain-chunk-massing-grammar.mjs --json-only`, `node
scripts\verify-worldbasis-terrain-sampler.mjs --json-only`, `node
scripts\verify-no-google-in-renderer.mjs --json-only`, `node
scripts\verify-provider-boundaries.mjs --json-only`, `node
scripts\verify-tool-result-shape.mjs --json-only`, and strict
`engine-beta-data` split guard with 0 blockers and 0 unknowns. Local Engine
Beta browser coverage passed with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e011-engine-coverage`.

## Entry 159

Quest:
Pre-Alpha 0.10E Terrain / World-Edge Measured Correction.

What changed:
Added `chunkEdgeReadabilityScore` to the City World diagnostics viewport
metrics. Each viewport now reports terrain massing visibility, chunk-edge
ratio, terrain elevation visibility, and a weighted chunk-edge readability
score. The debug summary now exposes the chunk-edge readability floor so future
visual-engine work can target the weakest measured terrain axis directly.

Expanded public Riverside terrain massing with the existing grammar only:
larger residential shelves, civic plinth shelves, commercial slab fields, park
basin cuts, water-edge cuts, and outer world-edge massing around the default and
mobile viewports. Added more `parcel_cluster_edge` breaks only where shelves
physically separate neighborhood, civic, commercial, park, and water-edge
regions. The renderer slightly strengthens existing side faces, rim contrast,
shadows, and strata for the current terrain massing profiles.

Result:
0.10E passes the measured terrain gate. Riverside now reports
`terrainMassingCoverageRatio: 0.796`, `emptyBoardRatio: 0.151`,
`firstViewportCompositionScore: 0.754`, and
`chunkEdgeReadabilityFloorScore: 0.668`. Viewport chunk-edge readability clears
desktop `0.843`, mobile `0.668`, and residential-detail `0.761`.

Skipped:
No new terrain type names, no cars, humans, walkers, decorative props, labels,
panels, glows, provider geometry, GameBlocks import, public Anaheim/Ontario
promotion, MCP tool-list changes, product UI changes, persistence, Hosted
Clawd, Stripe, XP, evidence, OAuth, automation, reports, or exports.

Verification:
Passed: `pnpm --dir packages/core test` (14 files / 60 tests), `pnpm
typecheck:starter`, `pnpm build:starter`, `pnpm verify:preview:http`, `node
scripts\debug-city-world-engine.mjs --out
C:\Users\mzwin\AppData\Local\Temp\atlas-e010-debug-engine --json-only`, `node
scripts\verify-worldbasis-terrain-sampler.mjs --json-only`, `node
scripts\verify-terrain-chunk-massing-grammar.mjs --json-only`, `node
scripts\verify-no-google-in-renderer.mjs --json-only`, `node
scripts\verify-provider-boundaries.mjs --json-only`, `node
scripts\verify-tool-result-shape.mjs --json-only`, and strict
`engine-beta-data` split guard with 0 blockers and 0 unknowns. Local Engine
Beta browser coverage passed with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e010-engine-coverage`. Opt-in
`?atlasDebug=engine` proof passed with debug screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e010-debug-overlay`. Focused `git diff
--check` passed with only Windows LF-to-CRLF warnings.

## Entry 158

Quest:
Pre-Alpha 0.9E WorldBasis / TerrainSampler Adapter Discipline.

What changed:
Added an Atlas-owned `CityWorldBasis` layer in `@atlas/core/voxel` with shared
2:1 tile constants, board-to-screen projection, tile diamond geometry, viewport
frame helpers, frame intersection, footprint, segment, distance, and clamp
helpers. Added a `CityWorldTerrainSampler` layer that accepts a compiled
`CityWorldScene` and returns terrain, lots, roads, buildings, authored terrain
counts, empty-board counts, terrain massing counts, and road/lot/building
contact helpers inside a viewport frame.

Rewired `cityWorldDiagnostics` through the new basis/sampler instead of keeping
private duplicate terrain, contact, distance, and viewport math. Rewired
`CityWorldRenderer` projection and diamond drawing through the shared basis
while preserving current Pixi rendering and product behavior. Added focused
core tests and `scripts/verify-worldbasis-terrain-sampler.mjs` to prove
deterministic projection, diagnostics parity, renderer import discipline, and
no GameBlocks/Three/Rapier/provider drift.

Result:
0.9E passes as an engine contract slice. It does not claim visual improvement;
it reduces coordinate/math drift so future terrain, object, camera, and
no-label slices can move measured axes rather than hand-tuning scattered
formulas.

Skipped:
No GameBlocks vendoring, no runtime dependency changes, no Three.js, no Rapier,
no physics/actor/vehicle systems, no public Anaheim/Ontario promotion, no
provider geometry, no MCP tool-list changes, no product UI change, no
persistence, Hosted Clawd, Stripe, XP, evidence, OAuth, automation, reports, or
exports.

Verification:
Passed: `pnpm --dir packages/core test` (14 files / 60 tests),
`pnpm typecheck:starter`, `pnpm build:starter`, `node
scripts\verify-worldbasis-terrain-sampler.mjs --json-only`, `node
scripts\debug-city-world-engine.mjs --out
C:\Users\mzwin\AppData\Local\Temp\atlas-e09-debug-engine --json-only`, `node
scripts\verify-gameblocks-atlas-adapter.mjs --json-only`, `node
scripts\verify-no-google-in-renderer.mjs --json-only`, `node
scripts\verify-provider-boundaries.mjs --json-only`, `node
scripts\verify-tool-result-shape.mjs --json-only`, the 0.2E-0.8E
scene-grammar verifier stack, `node scripts\verify-alpha-rc-split.mjs
--working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`,
local `pnpm verify:preview:http`, and local Engine Beta browser coverage.

Evidence:
Engine Beta coverage screenshots:
`C:\Users\mzwin\AppData\Local\Temp\atlas-e09-engine-coverage`. Debug report:
`C:\Users\mzwin\AppData\Local\Temp\atlas-e09-debug-engine`.

## Entry 157

Quest:
Pre-Alpha 0.8E No-Label Anchor Recognition.

What changed:
Improved the hidden Anaheim draft no-label path for the two target anchors:
`Anaheim Convention Center` and `ARTIC / Angel Stadium area`. The compiler now
separates ARTIC transit massing from Angel Stadium venue-bowl massing instead
of letting the pair collapse into one blue-roof cluster. The renderer now gives
the ARTIC terminal stronger transit-shed/platform language and the stadium a
clearer bowl/field read. Diagnostics now report hidden-draft no-label proxy
metrics for target-family coverage, anchor separation, and recognition proxy
score.

The Anaheim screenshot bridge now captures no-label crops for desktop, mobile,
and detail proof, and the visual packet preparer accepts the draft crop naming
used by the verifier. The canonical visual packet targets are now `Anaheim
Convention Center` and `ARTIC / Angel Stadium area`.

Result:
0.8E passes as a hidden-draft recognition gate. The two target object families
read before labels in the packet review, and Anaheim remains
`HIDDEN_DRAFT_ONLY`: `promotionReady: false`, `publicPlayable: false`,
playable district count 0, place count 0, no selected-place tray, no sticker
tools, no note input, no pins, and no actors.

Skipped:
No public Anaheim/Ontario switcher state, no public playable promotion, no
provider geometry, no MCP tool-list changes, no product UI expansion, no
persistence, Hosted Clawd, Stripe, XP, evidence, OAuth, automation, reports,
exports, cars, humans, props, panels, glows, or filler visual clutter.

Verification:
Passed: `pnpm --dir packages/core test` (13 files / 56 tests),
`pnpm typecheck:starter`, `pnpm build:starter`, local `pnpm
verify:preview:http` against `http://127.0.0.1:8787/preview`, `node
scripts\debug-city-world-engine.mjs --out
C:\Users\mzwin\AppData\Local\Temp\atlas-e08-debug-engine --json-only`,
`node scripts\verify-second-district-draft-scene.mjs --anchor-pack
data\district_place_anchor_packs\anaheim-anchors.json --json-only`, `node
scripts\verify-second-district-draft-scene.mjs --anchor-pack
data\district_place_anchor_packs\ontario-anchors.json --json-only`, the
0.1E-0.7E verifier stack, Engine Beta coverage browser proof, Anaheim hidden
draft no-label browser proof, and the Anaheim second-district visual packet
verification.

Evidence:
Engine Beta coverage screenshots:
`C:\Users\mzwin\AppData\Local\Temp\atlas-e08-engine-coverage`. Anaheim
no-label draft screenshots:
`C:\Users\mzwin\AppData\Local\Temp\atlas-e08-anaheim-no-label-final`. Visual
packet:
`C:\Users\mzwin\AppData\Local\Temp\atlas-e08-second-district-visual-packet`.

## Entry 156

Quest:
GameBlocks Atlas Adapter.

What changed:
Added `docs/GAMEBLOCKS_ATLAS_ADAPTER.md` to translate the relevant
`xt4d/GameBlocks` concepts into Atlas rules. The adapter accepts `WorldBasis`,
`PlanarUtils`, `TerrainSampler`, `BoardEnvironment`, debug projection, and
camera-framing patterns as references for Atlas-owned engine work. It rejects
vendoring, Three/Rapier runtime dependencies, actor motion, vehicles, combat,
generic HUDs, and product UI drift.

Added `scripts/verify-gameblocks-atlas-adapter.mjs` to prove the adapter doc is
present, the reference stack names it, package dependencies remain clean, and
runtime source does not import GameBlocks/Three/Rapier patterns. Updated the
Axiom reference stack, Next Quests, Decisions, Big 4 packet sentinel, and strict
`engine-beta-data` split guard so the adapter is part of the RC artifact system
instead of another loose idea.

Why:
GameBlocks can help Atlas stop reinventing fragile coordinate, terrain, bounds,
and camera proof logic, but only if it is constrained to Atlas' map-first,
Pixi/`CityWorldScene`, no-fake-playability architecture.

Anti-scope:
No package or lockfile changes, no runtime dependency, no renderer rewrite, no
Three.js, no Rapier, no actor/vehicle/combat systems, no cars/humans/filler
props, no dashboard/minimap product UI, no provider geometry, no public
Anaheim/Ontario promotion, no persistence, paid scope, XP/evidence, OAuth,
automation, reports, exports, staging, commit, or deploy.

Verification:
Passed: `node --check scripts\verify-gameblocks-atlas-adapter.mjs`, `node
--check scripts\verify-big4-artifact-packets.mjs`, `node
scripts\verify-gameblocks-atlas-adapter.mjs --json-only`, `node
scripts\verify-big4-artifact-packets.mjs --json-only`, `node
scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc
--rc-mode engine-beta-data --json-only`, and focused `git diff --check` with
only existing Windows LF-to-CRLF warnings.

## Entry 155

Quest:
Pre-Alpha 0.6E Terrain Chunk Massing / World-Edge Composition.

What changed:
Added compiler-owned `terrainChunkMassing` grammar on top of the 0.5E terrain
elevation and chunk-edge layer. Public Riverside terrain now distinguishes
outer world-edge mass, civic plinth mass, residential shelf mass, commercial
slab mass, park basin cut mass, and waterfront bank cut mass. Shell counties
get shell-boundary mass only, and hidden Anaheim/Ontario drafts get hidden
draft mass without public promotion.

The renderer consumes this grammar with stronger under-tile shadows, wider side
faces, clearer rim lines, and restrained strata bands under tile tops. The goal
is a visible first-3-second terrain massing improvement around Eastvale Core,
Neighborhood Blocks, park basin edges, waterfront cuts, and the outer world
edge. This is intentionally bigger than 0.5E's subtle side-face strokes.

Why:
0.5E passed as a foundation, but Lumen and Axiom both called the improvement
too subtle. Atlas needs chunk massing and world-edge silhouettes that read
without explanation, not another small stroke pass.

Anti-scope:
No cars, humans, decorative props, labels-as-crutches, glows, panels, public
Anaheim/Ontario promotion, provider geometry, server routes, package/env
changes, persistence, paid scope, XP/evidence, OAuth, automation, reports,
exports, staging, commit, or deploy.

Verification:
Passed early: `node --check scripts\verify-terrain-chunk-massing-grammar.mjs`,
`node scripts\verify-terrain-chunk-massing-grammar.mjs --json-only`, and
`pnpm test:core` with 13 files / 54 tests. Final build/browser/Big 4 gates are
pending.

## Entry 154

Quest:
Pre-Alpha 0.5E Terrain Elevation / Chunk Edge Language.

What changed:
Added a terrain-elevation and chunk-edge layer on top of the 0.4E
terrain/parcel composition grammar. `CityWorldScene` visual grammar now
distinguishes flat fields, raised parcel shelves, civic plinth shelves,
commercial slab fields, park basin shelves, water-edge cuts, shell-flat
terrain, hidden-draft shelves, world edges, parcel-cluster edges, waterfront
bank edges, park-basin edges, and hidden draft boundaries. Parcel grammar now
distinguishes thin pad lips, raised home shelves, commercial slab lips, civic
plinth stacks, apartment court lips, park basin lips, waterfront bank cuts, and
hidden anchor shelves.

The compiler assigns these profiles for public Riverside, shell counties, and
hidden Anaheim/Ontario draft scenes. The renderer consumes them with restrained
terrain side faces, chunk-edge rim lines, parcel shelf lips, strata lines, and
shallow plinth depth around Eastvale Core, neighborhood parcels, parks, and
waterfront edges.

Added `scripts/verify-terrain-elevation-chunk-grammar.mjs` and allowlisted it
in the strict `engine-beta-data` split guard.

Why:
0.4E made the surface less empty, but it still risked reading as painted
pattern on a flat board. Atlas needs true voxel world language: raised shelves,
chunk edges, parcel side faces, and shallow strata that support buildings
without adding props or labels.

Anti-scope:
No cars, humans, decorative props, labels, glows, panels, public
Anaheim/Ontario promotion, provider changes, server routes, package/env
changes, persistence, paid scope, XP/evidence, OAuth, automation, reports,
exports, staging, commit, or deploy.

Verification:
Passed early: `node --check scripts\verify-terrain-elevation-chunk-grammar.mjs`,
`node scripts\verify-terrain-elevation-chunk-grammar.mjs --json-only`, and
`pnpm test:core` with 13 files / 54 tests. Passed final: `pnpm
typecheck:starter`, `pnpm build:starter`, `pnpm verify:preview:http` against
`http://127.0.0.1:8813/preview`, `node
scripts\verify-engine-beta-coverage.mjs` against `http://127.0.0.1:8813`,
0.4E terrain/parcel verifier, 0.3E object-authorship verifier, 0.2E
roads/roofs verifier, and strict `engine-beta-data` split guard with 96 files
/ 0 blockers / 0 unknowns. Focused `git diff --check` passed with only Windows
LF-to-CRLF warnings.

Evidence:
Screenshots are under
`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-05e-terrain-elevation-coverage`
with a dedicated residential-detail product-loop proof under
`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-05e-terrain-elevation-residential-detail`.

Big 4 gate:
- Lumen visual verdict: PASS. The depth language improves the flat-board read
  without adding cars, humans, props, panels, labels-as-crutches, or mobile
  regression. Remaining weakness: world/chunk edges are present but still too
  subtle to feel fully tactile.
- Mira product/mobile verdict: PASS. Riverside remains map-first, the
  selected-place tray and pin/note loop remain readable, shell/L0 recovery
  CTAs remain visible, and no internal elevation/chunk/provider/compiler
  language leaks into UI.
- Forge release-split/provider verdict: SAFE. Strict `engine-beta-data` split
  guard stayed at 96 files / 0 blockers / 0 unknowns, the 0.1E provider
  verifier stack stayed green, and no server/provider/package/env/persistence
  or paid-scope drift was introduced.

Next quality bar:
The next voxel-engine artifact must be bigger than another subtle stroke pass:
stronger terrain chunk massing and world-edge composition that reads at first
glance, or a no-label object/anchor recognition pass that materially improves
the product screenshot.

## Entry 153

Quest:
Pre-Alpha 0.4E Terrain / Parcel World Composition, integrated compiler and
renderer artifact.

What changed:
Added a second composition axis to `CityWorldScene` visual grammar:
`terrainComposition` and `parcelComposition`. Terrain can now distinguish
quiet fields, neighborhood yard fabric, civic focus fields, commercial apron
fields, park basins, waterfront edge strata, shell boundaries, and hidden draft
fields. Lots can now distinguish home yard grids, commercial aprons, civic
landmark plinths, apartment courts, park basins, waterfront banks, and hidden
draft anchor pads.

The compiler assigns that composition grammar to public Riverside,
shell-county, and hidden Anaheim/Ontario draft scenes without changing
playable state. The renderer consumes the profiles with restrained field
facets, parcel seams, lot plinths, apartment court marks, park paths, and
waterfront/draft strata. This targets the broad green-board/flat-parcel problem
underneath the 0.2E roads/roofs and 0.3E object-authorship passes.

Added `scripts/verify-terrain-parcel-composition.mjs` and allowlisted it in the
strict `engine-beta-data` split guard.

Why:
The next quality blocker is not more prop clutter or more labels. Atlas needs
the ground system to feel authored: buildings, roads, and lots must sit in a
coherent county-world surface before the engine can scale to Anaheim/Ontario
or broader California slices.

Anti-scope:
No server routes, provider API changes, Google-derived geometry, MCP tool-list
changes, public Anaheim/Ontario promotion, fake playable state, cars, humans,
decorative clutter, dashboard panels, DB/persistence, Hosted Clawd, Stripe,
XP/evidence, OAuth, automation, reports, exports, staging, commit, or deploy.

Verification:
Passed: `node --check scripts\verify-terrain-parcel-composition.mjs`, `node
--check scripts\verify-alpha-rc-split.mjs`, `node
scripts\verify-terrain-parcel-composition.mjs --json-only`, `node
scripts\verify-object-authorship-scene-grammar.mjs --json-only`, `node
scripts\verify-roads-roofs-scene-grammar.mjs --json-only`, the 0.1E provider
verifier set, `pnpm test:core` with 13 files / 53 tests, `pnpm
typecheck:starter`, `pnpm build:starter`, `pnpm verify:preview:http` against
`http://127.0.0.1:8810/preview`, `node scripts\verify-engine-beta-coverage.mjs`
against `http://127.0.0.1:8810`, `node scripts\verify-alpha-product-loop.mjs
--camera-preset residential_detail` against `http://127.0.0.1:8810/preview`,
and strict `engine-beta-data` split guard with 95 files / 0 blockers / 0
unknowns. Focused `git diff --check` passed with only Windows LF-to-CRLF
warnings.

Evidence:
Screenshots are under
`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-04e-terrain-parcel-coverage`
and
`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-04e-terrain-parcel-residential-detail`.
Lumen returned PASS with no P0 visual blocker; Mira returned PASS with no P0
product/mobile blocker; Forge returned SAFE for release-split and provider
boundary.

## Entry 152

Quest:
Pre-Alpha 0.3E Object Authorship, integrated compiler and renderer artifact.

What changed:
Extended `CityWorldScene` visual grammar with object-authorship metadata:
`objectFamily`, `clusterRole`, and `noLabelPriority`. The compiler now assigns
families such as `residential_kit`, `commerce_strip`, `civic_landmark`,
`lowrise_cluster`, `service_block`, `venue_anchor`, and `transit_anchor` to
public Riverside buildings and hidden Anaheim/Ontario draft anchors. Riverside
also gets explicit anchor/support/fabric/edge roles; hidden draft anchors keep
internal no-label priority without any public switcher or playable claim.

The renderer now consumes that authorship layer. Sprite-backed rowhomes and
strip stores get extra base/entry grounding, public Riverside primitives get
family-specific silhouette and facade rhythm, Eastvale Core gets stronger
civic massing, and hidden draft venue/transit anchors get internal no-label
massing cues. This builds on the 0.2E roads/roofs grammar rather than adding
props or panels.

Added `scripts/verify-object-authorship-scene-grammar.mjs` and allowlisted it
in the strict `engine-beta-data` split guard. Updated the release ladder,
current update manifest, and architecture decisions so 0.3E is the active named
engine update.

Why:
The art critique is correct that Atlas cannot keep relying on generic cuboids.
0.3E makes object identity a typed engine contract before the next art pass:
the renderer can improve families consistently, tests can assert the object-kit
coverage, and Anaheim/Ontario no-label readiness remains hidden and honest.

Visual read:
PASS with caveat. The Riverside screenshots show better authored object read:
Eastvale Core has more civic hierarchy, rowhome/store bases sit more
deliberately, and residential/detail views have more window/entry/foundation
rhythm. This is still not final art quality; broad green-board composition and
candidate-district no-label recognition remain the next hard blockers.

Anti-scope:
No server routes, provider API changes, Google-derived geometry, MCP tool-list
changes, public Anaheim/Ontario promotion, fake playable state, cars, humans,
decorative clutter, dashboard panels, DB/persistence, Hosted Clawd, Stripe,
XP/evidence, OAuth, automation, reports, exports, staging, commit, or deploy.

Verification:
Passed: `node --check scripts\verify-object-authorship-scene-grammar.mjs`,
`node scripts\verify-object-authorship-scene-grammar.mjs --json-only`,
`pnpm test:core` with 13 files / 52 tests, `pnpm typecheck:starter`,
`pnpm build:starter`, `node scripts\verify-roads-roofs-scene-grammar.mjs
--json-only`, the 0.1E provider verifier set, `pnpm verify:preview:http`
against `http://127.0.0.1:8809/preview`, `node
scripts\verify-engine-beta-coverage.mjs` against `http://127.0.0.1:8809`,
`node scripts\verify-alpha-product-loop.mjs --camera-preset
residential_detail` against `http://127.0.0.1:8809/preview`, and strict
`engine-beta-data` split guard with 94 files / 0 blockers / 0 unknowns.
Screenshots are under
`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-03e-object-authorship-coverage`
and
`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-03e-object-authorship-residential-detail`.

## Entry 151

Quest:
Pre-Alpha 0.2E Roads & Roofs / Scene Compiler, Axiom compiler-contract half.

What changed:
Added typed visual grammar to `CityWorldScene` object contracts. Terrain,
roads, lots, buildings, and roofs now carry compiler-assigned profiles such as
`quiet_socal_grass`, `embedded_asphalt_slab`, `home_parcel_pad`,
`socal_stucco_warm`, `terracotta_barrel_tile`, `flat_parapet_cap`, and
`parcel_pad_shadow`. The compiler now routes public Riverside and hidden draft
district roads through the same road metadata helper, and the remaining loud
gym/strip-store roof inputs were muted.

Added `scripts/verify-roads-roofs-scene-grammar.mjs` and allowlisted it in the
strict `engine-beta-data` split guard. Updated the release ladder and current
update manifest so 0.2E is the active named update on top of the 0.1E provider
boundary floor.

Why:
The visual engine needs reusable scene grammar, not only renderer-side drawing.
Future districts should inherit the same road, roof, lot, material, and contact
language instead of becoming one-off art hacks.

Anti-scope:
No provider API changes, Google usage, backend routes, public Anaheim/Ontario
promotion, cars, humans, filler props, dashboard panels, DB/persistence, Hosted
Clawd, Stripe, XP/evidence, OAuth, automation, reports, exports, staging,
commit, or deploy.

Verification:
Passed: `node --check scripts\verify-roads-roofs-scene-grammar.mjs`,
`node scripts\verify-roads-roofs-scene-grammar.mjs`, the 0.1E provider
verifier set, `pnpm test:core` with 13 files / 51 tests,
`pnpm typecheck:starter`, `pnpm build:starter`, `pnpm verify:preview:http`
against `http://127.0.0.1:8808/preview`, `node
scripts\verify-engine-beta-coverage.mjs` against `http://127.0.0.1:8808`, and
strict `engine-beta-data` split guard with 93 files / 0 blockers / 0 unknowns.
Mira passed the product/mobile gate; Forge marked the release-split and
provider-boundary envelope safe.

## Entry 150

Quest:
Pre-Alpha 0.2E Roads & Roofs / Scene Compiler.

What changed:
Added a public Riverside renderer artifact for road, lot, and roof material
grammar. `web/src/CityWorldRenderer.tsx` now gives public roads restrained
asphalt wear, curb lift, slab-face shadows, and joint blockwork; lots receive
subtle curb/block edge grounding; non-draft roofs receive SoCal roof courses,
eave lips, parapet strokes, and quiet roof pad variation. The change is
renderer-only and keeps the existing `CityWorldScene` contract stable.

Why:
The public Eastvale scene still read too smooth in the first 3 seconds. This
slice improves roads/roofs/parcel contact without adding cars, people, filler
props, dashboard panels, provider data, or public Anaheim/Ontario promotion.

Visual read:
PASS with caveat. Desktop and residential-detail screenshots show more
physical roads, better roof surface logic, and stronger parcel grounding.
Mobile remains readable above the tray. This is not a final art-quality jump;
the biggest remaining weakness is still broad green-board scale and object
authorship at district scale.

Anti-scope:
No provider changes, Google usage, backend routes, public Anaheim/Ontario
switcher state, playable claim, cars, humans, filler props, dashboards, panels,
persistence, Hosted Clawd, Stripe, XP/evidence, OAuth, automation, reports,
exports, staging, commit, or deploy.

Verification:
Passed: `pnpm typecheck:starter`, `pnpm build:starter`,
`pnpm verify:preview:http` against `http://127.0.0.1:8806/preview`, and
`node scripts\verify-engine-beta-coverage.mjs` against
`http://127.0.0.1:8806` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-02e-roads-roofs-local`.

## Entry 149

Quest:
E15.5 No-Label Crop Packet + Anchor Recognition Decision.

What changed:
Added hidden no-label screenshot support for Anaheim draft review. The
production renderer now honors `atlasNoLabels=1` by suppressing map labels, and
`scripts/verify-anaheim-draft-scene.mjs` can capture no-label anchor crops plus
desktop, `390x844` mobile, desktop-detail, and mobile-detail screenshots. The
canonical Anaheim no-label packet was assembled under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e155-anaheim-no-label-packet` and
validated with `scripts/verify-second-district-visual-packet.mjs`.

Decision:
`docs/SECOND_DISTRICT_VOXEL_GRAMMAR_PACKET.md` now records the blunt E15.5
verdict: Anaheim remains `VISUAL_READINESS_FALSE` / `HIDDEN_DRAFT_ONLY`.
Convention Center partially reads as a long glass hall in detail crops, but not
strongly enough on mobile. ARTIC / Angel Stadium area still reads as a
blue-roof venue cluster rather than a recognizable transit/stadium anchor before
labels.

Anti-scope:
No public Anaheim/Ontario switcher state, playable claim, public route,
provider claim, cars, humans, decorative props, clouds, panels, glows,
persistence, Hosted Clawd, Stripe, XP/evidence, OAuth, automation, reports,
exports, renderer rewrite, staging, commit, or deploy.

Verification:
Passed: `node --check scripts\verify-anaheim-draft-scene.mjs`, `node --check
scripts\prepare-second-district-visual-packet.mjs`, `pnpm typecheck:starter`,
`pnpm build:starter`, `pnpm verify:preview:http` against
`http://127.0.0.1:8805/preview`, `node scripts\verify-engine-beta-coverage.mjs`
against `http://127.0.0.1:8805`, Anaheim no-label draft harness with
`atlasNoLabels=1`, canonical visual packet preparation, and
`node scripts\verify-second-district-visual-packet.mjs --district anaheim
--screenshots
C:\Users\mzwin\AppData\Local\Temp\atlas-e155-anaheim-no-label-packet
--json-only`.

## Entry 148

Quest:
E15.6 Golden Prompt Product Proof For Second-District Readiness.

What changed:
Extended `scripts/verify-chatgpt-entry-surface.mjs` from an exact-response
proof into a golden-prompt product proof generator. It now writes both
`docs/CHATGPT_ENTRY_SURFACE_PROOF.md` and a machine-readable JSON proof for
Forge/Axiom review. The JSON proof covers five realistic prompts:
direct Riverside play, Orange shell browsing, unknown county recovery, lookup
without saves/readiness claims, and the negative Anaheim-not-playable question.

The proof shape is intentionally conservative for readiness aggregation:
`proofStatus: "passed"` verifies product language boundaries, while
`promotionReady: false`, `publicPlayable: false`, and `miraAcceptance: false`
keep Anaheim blocked from public promotion until visual packet, product review,
and release acceptance exist.

Why:
Forge's readiness aggregator needed a consumable product proof artifact, not
more wording-only polish. This packet proves normal ChatGPT prompts preserve the
public model: play Riverside/Eastvale now, browse shell counties honestly, and
lookup places without saving or proving county readiness.

Anti-scope:
No new tool, public Anaheim/Ontario switcher state, dashboard, directory, fake
places, persistence/saves claim, Hosted Clawd, Stripe, XP/evidence, OAuth,
automation product features, reports, exports, package/lock/env drift, renderer
work, staging, commit, deploy, or Railway mutation.

Verification:
Passed: `node --check scripts\verify-chatgpt-entry-surface.mjs`,
`pnpm typecheck:starter`, local golden prompt proof against
`http://127.0.0.1:8803/mcp`, `pnpm verify:mcp`,
`node scripts\verify-world-lookup-boundary.mjs`, and
`node scripts\verify-second-district-readiness.mjs --district
anaheim-candidate --product-proof
C:\Users\mzwin\AppData\Local\Temp\atlas-e156-golden-prompt-product-proof\anaheim-product-proof.json
--json-only`. The readiness aggregate consumed the product proof path and kept
`readyForPlayablePromotion: false`; split guard inside the aggregate passed
with 0 blockers and 0 unknowns.

## Entry 147

Quest:
E15.4 Readiness Artifact Writer + Source-To-Scene Status Export.

What changed:
Added `scripts/export-second-district-readiness-artifact.mjs`, a Forge artifact
writer that creates a review folder for Anaheim or Ontario. Each folder contains
`readiness-aggregate.json`, `promotion-packet.json`,
`source-to-scene-trace.json`, and `release-status.json`. The release status
captures branch, dirty-file count, strict split guard result, and the read-only
Railway service identity from Axiom's handoff without mutating Railway.

Why:
E15.1 made readiness computable. E15.4 makes it portable for Axiom/Mira/Lumen
review without asking humans to stitch together verifier stdout. The source to
scene trace now has a stable export packet that can be attached to future
promotion reviews.

Anti-scope:
No server route changes, public UI expansion, public Anaheim/Ontario route,
fake playable claims, DB, Hosted Clawd, package/lock/env drift, persistence,
Stripe, XP/evidence, OAuth, automation product features, reports, exports,
provider-normalized claims, public-quality claims, staging, commit, deploy, or
Railway mutation.

Verification:
Passed in this slice: `node --check
scripts\export-second-district-readiness-artifact.mjs`, `node --check
scripts\verify-alpha-rc-split.mjs`, Anaheim/Ontario temp artifact exports under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e154-readiness-a468c207c8fa403f91c98509ab41bc79`,
strict `engine-beta-data` split guard (81 files, 0 blockers, 0 unknowns), and
focused diff check.

## Entry 146

Quest:
Axiom Big 4 Wakeup Protocol.

What changed:
Updated the active Codex automations `atlas-captain-light-reorg-wakeup` and
`atlas-captain-full-power-mobilization` so they run from
`C:\Users\mzwin\Documents\Atlas-alpha-path-b-rc` instead of the mixed Atlas
tree. The light wakeup now has clean prompt text and the full-power wakeup now
requires small-chunk reads from the real Forge, Lumen, and Mira threads before
dispatching work.

Added `docs/AXIOM_BIG4_WAKEUP_PROTOCOL.md` and
`scripts/verify-big4-wakeup-protocol.mjs` so the repo can verify the active
automation ids, real thread ids, RC worktree target, no-local-clone rule, and
Railway/GitHub read-only stance. The Big 4 packet sentinel and strict
`engine-beta-data` split guard now recognize this Axiom coordination artifact.

Why:
The previous Axiom loop missed finished worker reports because thread reads
were too broad and one automation still pointed at stale operating context. The
new protocol makes reading real worker handoffs a first-class verification
step, not optional manager memory.

Anti-scope:
No public product automation, no Railway mutation, no deploy, no GitHub repo or
issue creation, no server route, no Hosted Clawd, persistence, DB, Stripe,
XP/evidence, OAuth, reports, exports, cars, humans, decorative props, or public
Anaheim/Ontario playability.

Verification:
Passed: `node --check scripts\verify-big4-wakeup-protocol.mjs`, `node
scripts\verify-big4-wakeup-protocol.mjs --json-only`, `node
scripts\verify-big4-artifact-packets.mjs --json-only`, `node
scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc
--rc-mode engine-beta-data --json-only`, and focused `git diff --check`. The
wakeup verifier reported both active automations targeting the RC worktree with
0 blockers and 0 warnings. The Big 4 packet sentinel reported 4 packets ready
with 0 blockers and 0 warnings. The split guard reported 80 files, 0 blockers,
and 0 unknowns.

## Entry 145

Quest:
E15.2 Second-District Voxel Grammar Packet.

What changed:
Added `docs/SECOND_DISTRICT_VOXEL_GRAMMAR_PACKET.md` as Lumen's durable
hidden-draft voxel grammar packet. The packet records the E15.2 grammar
families, Anaheim/Ontario hidden draft verifier summaries, screenshot evidence
paths, anti-scope, and a blunt `VISUAL_READINESS_FALSE` no-label recognition
verdict. The split guard now allows the packet in `engine-beta-data` mode, and
`docs/NEXT_QUESTS.md` points future second-district visual review at it.

Why:
Axiom's Big 4 sentinel expected a Lumen packet, and the visual lane needed a
clear artifact that says compiler/renderer grammar improved without pretending
Anaheim or Ontario are public-ready. The packet prevents labels, shell copy, or
generic readiness from being mistaken for visual approval.

Anti-scope:
No renderer code in this packet follow-up, no public Anaheim/Ontario UI,
playable claim, public route, provider claim, cars, humans, decorative props,
glows, panels, persistence, Hosted Clawd, paid scope, Stripe, XP/evidence,
OAuth, automation, reports, exports, deploy, or Railway mutation.

Verification:
Pending in this slice: Big 4 packet sentinel, strict `engine-beta-data` split
guard, and focused diff check.

## Entry 144

Quest:
Axiom E15 GM Reference Stack And Big 4 Expanded Dispatch.

What changed:
Added `docs/AXIOM_ENGINE_REFERENCE_STACK.md` and
`docs/AXIOM_BIG4_ARTIFACT_DISPATCH.md` as Axiom-owned operating artifacts for
the next Big 4 cycle. The external `chatgpt-app-skill` repository was inspected
as a checklist source, not installed as a dependency. Its useful ideas are now
captured for Atlas: clear tool language, `structuredContent` versus `_meta`
separation, widget/mobile proof, golden prompts, and submission-style quality
checks. The same reference packet also records voxel/isometric engine
inspiration for Lumen: crisp face separation, declarative road/terrain modules,
hidden-draft venue grammar, and no-label anchor recognition.

The Big 4 dispatch now names larger E15 artifact packets: Forge owns candidate
readiness aggregation, Lumen owns hidden draft voxel grammar and two-anchor
native proof, Mira owns ChatGPT entry language proof, and Axiom owns integration
verification. Added `scripts/verify-big4-artifact-packets.mjs` as the packet
shape sentinel and allowed the Axiom docs/script in the `engine-beta-data` split
guard.

Anti-scope:
No public Anaheim/Ontario playability, no new tool, no server behavior change,
no renderer implementation in this Axiom slice, no package/lock/env drift, no
DB, Hosted Clawd, persistence, Stripe, XP/evidence, OAuth, automation, reports,
exports, cars, humans, decorative props, or dashboard/panel sprawl.

Verification:
Passed: `node --check scripts\verify-big4-artifact-packets.mjs`, `node
scripts\verify-big4-artifact-packets.mjs --json-only`, `node
scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc
--rc-mode engine-beta-data --json-only`, and focused `git diff --check`.
The packet sentinel reported 4 packets, 0 blockers, and only one warning:
Lumen's next optional `docs/SECOND_DISTRICT_VOXEL_GRAMMAR_PACKET.md` artifact
is not present yet. The strict split guard reported 77 files, 0 blockers, and 0
unknowns.

Additional Axiom checks:
`node --check scripts\verify-second-district-readiness.mjs` passed. `node
--check scripts\verify-chatgpt-entry-surface.mjs` passed. Anaheim and Ontario
readiness aggregation both returned `readyForPlayablePromotion: false`: data
and draft compiler gates are satisfied, while visual packet, product proof,
Lumen acceptance, Mira acceptance, and final release acceptance remain blocking.

## Entry 143

Quest:
E15.3 ChatGPT Entry Surface + Tool Language Proof Packet.

What changed:
Built a public ChatGPT entry-surface packet instead of another approval note.
The county switcher rail now states the model more cleanly: Play Riverside,
Browse CA shells, and Lookup temp. The Lookup action now asks
ChatGPT for lookup-only places that are not saved and not coverage proof. The
rail accessibility copy now says lookup places are not saved and not coverage
proof.

Added `scripts/verify-chatgpt-entry-surface.mjs`, a focused MCP proof generator
that calls the real public tools, rejects compiler/GEOID/packet/verifier
language, keeps the seven-tool list stable, and writes
`docs/CHATGPT_ENTRY_SURFACE_PROOF.md` with exact response text for
`select_county`, `render_voxel_county`, `ask_county_question`, and
`lookup_world_places`. Strengthened `scripts/verify-mcp-flow.mjs` and
`scripts/verify-county-switcher.mjs` so this product language is protected in
both tool responses and the public widget surface.

Anti-scope:
No new tool, public Anaheim/Ontario switcher state, dashboard, directory, fake
places, persistence/saves claim, Hosted Clawd, Stripe, XP/evidence, OAuth,
automation, reports, exports, package/lock/env drift, renderer work, deploy, or
Railway mutation.

Verification:
Passed: `node --check scripts\verify-chatgpt-entry-surface.mjs`,
`node --check scripts\verify-mcp-flow.mjs`,
`node --check scripts\verify-county-switcher.mjs`, `pnpm typecheck:starter`,
`pnpm build:starter`, local MCP entry-surface proof against
`http://127.0.0.1:8802/mcp`, `pnpm verify:mcp`,
`node scripts\verify-world-lookup-boundary.mjs`, desktop and `390x844` mobile
county-switcher proof, and full local Engine Beta coverage matrix against
`http://127.0.0.1:8802`.

## Entry 142

Quest:
E15.2 Hidden Draft Voxel Grammar System + Two-Anchor Native Pass.

What changed:
Strengthened the hidden draft voxel grammar system instead of adding more
process-only gates. Anaheim Convention Center now compiles as longer, lower
hall/campus massing with a wider entry spine; ARTIC compiles as a stronger
terminal shed with taller transit profile; Angel Stadium bowl massing is
slightly broader and lower. `CityWorldRenderer` now adds reusable native draft
grammar families for large venue halls, transit hubs, stadium bowls,
mixed-use edges, commercial edges, airport/logistics edges, civic cores, and
residential variety, with contact/foundation, top/left/right face separation,
roof rhythm, facade rhythm, platform/track, bowl/field, and apron cues.
`scripts/verify-second-district-draft-scene.mjs` now reports required
`grammarFamilies` and keeps visual readiness in screenshot-review-required
state.

Why:
The hidden second-district scenes still leaned too hard on labels and placeholder
mass. This pass moves the system toward recognizable native voxel object
grammar while keeping Anaheim/Ontario hidden and non-playable.

Anti-scope:
No public Anaheim/Ontario switcher state, playable claim, public route,
provider claim, cars, humans, props, clouds, panels, glows, persistence, paid
scope, Hosted Clawd, Stripe, XP/evidence, OAuth, automation, reports, exports,
deploy, or broad renderer rewrite.

Verification:
Passed: `node --check scripts\verify-second-district-draft-scene.mjs`,
`pnpm test:core`, `pnpm typecheck:starter`, `pnpm build:starter`, Anaheim and
Ontario draft-scene verifiers, visual packet template smoke,
`pnpm verify:preview:http` against local preview, Anaheim draft screenshot
harness for desktop/mobile/detail camera, strict `engine-beta-data` split guard,
and focused diff check.

## Entry 141

Quest:
E15.1 Candidate Readiness Aggregator + Source-To-Scene Trace Packet.

What changed:
Added a core second-district readiness aggregate contract and
`scripts/verify-second-district-readiness.mjs`. The new command composes the
existing promotion packet, source verifier, optional visual packet, optional
product proof, and strict split guard into one JSON object for Anaheim or
Ontario. It reports blocker groups for data, visual, product, and release, plus
a source-to-scene trace from candidate pack to anchor pack to curated pack to
draft compiler proof to visual packet to product proof to split guard.

Why:
Axiom needs one mechanical readiness read before any second district can become
public. E14.1 packets prove data and hidden compiler readiness, but E15.1 makes
the missing visual/product/release gates explicit without letting metadata or
hidden drafts become playability.

Anti-scope:
No server route changes, public UI expansion, public Anaheim/Ontario route,
fake playable claims, DB, Hosted Clawd, package/lock/env drift, persistence,
Stripe, XP/evidence, OAuth, automation, reports, exports, provider-normalized
claims, public-quality claims, deploy, or Railway mutation.

Verification:
Passed in this slice: `node --check scripts\verify-second-district-readiness.mjs`,
`node --check scripts\create-second-district-promotion-packet.mjs`,
`pnpm test:core` (13 files / 50 tests), `pnpm typecheck:starter`,
Anaheim/Ontario readiness aggregation, strict `engine-beta-data` split guard
(75 files, 0 blockers, 0 unknowns), and focused diff check.

## Entry 140

Quest:
E14.2 Hidden Draft Scene Grammar And Screenshot Packet Bridge.

What changed:
Generalized hidden second-district draft compilation so Anaheim and Ontario no
longer share one Anaheim-shaped scene. Anaheim keeps venue, transit, stadium,
and mixed-use grammar. Ontario now gets San Bernardino labeling, an
airport/logistics edge, Ontario Mills commerce core, civic/downtown service
blocks, residential variety, distinct terrain zones, and distinct road/contact
IDs. Added `scripts/verify-second-district-draft-scene.mjs` to validate hidden
draft scene shape and emit screenshot packet guidance before Lumen/Mira review.

Why:
Second-district promotion needs visual-engine proof, not just docs. Ontario
must not become a cloned named grid, and screenshot packet review needs a
machine-readable bridge from hidden draft scenes to the visual-packet verifier.

Anti-scope:
No public Anaheim/Ontario UI, switcher exposure, playable claim, renderer route,
cars, humans, decorative props, panels, glows, provider claims, persistence,
paid scope, backend route work, deploy, or Railway mutation.

Verification:
Passed: `pnpm test:core`, `pnpm typecheck:starter`, `pnpm build:starter`,
`node scripts\verify-second-district-draft-scene.mjs --anchor-pack
data\district_place_anchor_packs\anaheim-anchors.json --json-only`,
`node scripts\verify-second-district-draft-scene.mjs --anchor-pack
data\district_place_anchor_packs\ontario-anchors.json --json-only`, visual
packet template smoke, strict `engine-beta-data` split guard, and focused diff
check.

## Entry 139

Quest:
E14.3 ChatGPT Tool Response Product Language And Proof.

What changed:
Tightened the public ChatGPT tool-response copy for the core product path.
`select_county` now says Riverside/Eastvale is playable now and shell counties
are browse-only without invented places, saves, XP, evidence, or automation.
`render_voxel_county` now names the Riverside/Eastvale playable map and keeps
pins/notes in-chat. `ask_county_question` now labels curated
Riverside/Eastvale answers and blocks saved/progression/automation claims.
`lookup_world_places` now says lookup-only results are normalized, not saved,
not coverage proof, and do not unlock a playable county map.

Verifier changes:
`scripts/verify-mcp-flow.mjs` now asserts product-language boundaries for
Riverside playable responses, Orange shell responses, county Q&A, render
responses, and lookup responses. `scripts/verify-world-lookup-boundary.mjs`
now asserts lookup copy says `not coverage proof`.

Anti-scope:
No tool-list change, route behavior change, new tools, public Anaheim/Ontario
playability, fake places, persistence, DB, Hosted Clawd, package/lock/env drift,
Stripe, XP/evidence creation, OAuth, automation, reports, exports, deploy, or
Railway mutation.

Verification:
Local `ATLAS_MCP_URL=http://127.0.0.1:8801/mcp pnpm verify:mcp`,
`ATLAS_BASE_URL=http://127.0.0.1:8801 ATLAS_MCP_URL=http://127.0.0.1:8801/mcp
node scripts\verify-world-lookup-boundary.mjs`, and
`ATLAS_MCP_URL=http://127.0.0.1:8801/mcp pnpm verify:submission` passed.
Full local Engine Beta coverage also passed against `http://127.0.0.1:8801`,
including Riverside product loop, residential detail, Orange shell, Unknown
L0, county switcher, preview, MCP, and submission. Strict `engine-beta-data`
split guard passed with 69 files, 0 blockers, and 0 unknowns. Focused diff
check passed with Windows line-ending warnings only.

## Entry 138

Quest:
E14.1 Second-District Promotion Packet System.

What changed:
Added a core `DistrictPromotionPacket` contract and packet builder, exported it
through `@atlas/core`, added packet tests, and added
`scripts/create-second-district-promotion-packet.mjs` for Anaheim/Ontario review
packets. The pipeline verifier now includes the same core-built packet in each
candidate result. The split guard allowlist and promotion-gate doc now recognize
the packet generator as Engine Beta data infrastructure.

Why:
The second-district path needed a real handoff object, not another gate-only
report. Axiom, Mira, Lumen, and Forge can now review a compact packet with
candidate identity, file presence, satisfied/missing gates, no-fake-playability
flags, screenshot packet path, owner acceptance placeholders, and release
cutlines.

Anti-scope:
No UI, public switcher state, public Anaheim/Ontario route, server route
behavior, DB, Hosted Clawd, package/lock/env drift, persistence, Stripe,
XP/evidence, OAuth, automation, reports, exports, deploy, or Railway mutation.

Verification:
Passed in this slice: `node --check` for the packet generator and pipeline
verifier, `pnpm test:core` (12 files / 47 tests), `pnpm typecheck:starter`,
Anaheim and Ontario packet generation, California district pipeline verifier,
strict `engine-beta-data` split guard (68 files, 0 blockers, 0 unknowns), and
focused diff check.

## Entry 137

Quest:
E13.8 Second-District Visual Packet Prep Workflow.

What changed:
Added `scripts/prepare-second-district-visual-packet.mjs`, a packet assembler
for Lumen/Mira/Axiom screenshot evidence. It scans one or more source
screenshot roots, copies known Riverside baseline, candidate desktop/mobile,
candidate detail, shell-state, and no-label anchor files into the canonical
packet filenames, and writes a conservative `visual-review.json` template.

Why:
The verifier alone made bad packets fail, but it still left humans and agents
to hand-assemble screenshot directories. This prep workflow turns the visual
acceptance bar into a usable evidence pipeline: collect screenshots, normalize
packet names, generate hidden-draft review defaults, then run
`verify-second-district-visual-packet.mjs`.

Supporting changes:
Added the prep script to the `engine-beta-data` split-guard allowlist and
updated `docs/SECOND_DISTRICT_VISUAL_PACKET_TEMPLATE.md` plus
`docs/NEXT_QUESTS.md` with the new command path.

Anti-scope:
No renderer code, production assets, public Anaheim/Ontario UI, fake
playability, provider claims, server routes, persistence, paid scope, cars,
humans, props, panels, automation, reports, exports, deploy, or Railway
mutation.

Verification:
Focused script syntax, positive packet-prep smoke, verifier smoke on the
prepared packet, missing-source negative smoke, strict `engine-beta-data` split
guard, and focused diff check required after this entry.

## Entry 137

Quest:
E13.10 Public Path Action Rail.

What changed:
Turned the Play/Browse/Lookup rail from passive product labels into actual
actions. `Play` opens the Riverside playable map, `Browse` opens the Orange
shell proof state, and `Lookup` sends a ChatGPT message asking for lookup-only
places near Eastvale while preserving the not-saved boundary. The county chips
still work; the rail now gives a normal user a direct path instead of only
explaining the model.

Why:
Mira's prior E13.9 proof protected the rail but did not use enough product
power. This slice makes the map HUD more functional without adding a dashboard,
directory, fake county expansion, public Anaheim/Ontario state, or persistence.

Anti-scope:
No backend route, data contract, county directory, public Anaheim/Ontario UI,
fake places, fake playable tools, saved state, Hosted Clawd, persistence,
Stripe, XP, evidence, OAuth, automation, reports, exports, deploy, or Railway
mutation.

Verification:
`scripts/verify-county-switcher.mjs` passed against local preview
`http://127.0.0.1:8801/preview` on desktop and `390x844` mobile. The proof
clicked Lookup without leaving Riverside, Browse into Orange shell, Unknown L0,
and Play back to Riverside. The rail stayed compact at 34px desktop and 40px
mobile, above the tray, inside the first viewport, with no horizontal overflow
and no fake shell tools.

## Entry 136

Quest:
E13.7 Ontario Draft-Only Curated Pack.

What changed:
Added `data/district_curated_packs/ontario-curated-district-draft.json` and
extended the curated-pack tests to validate Ontario alongside Anaheim. The
Ontario pack maps every curated anchor back to the source-noted Ontario anchor
pack: district identity, inland residential cluster, Ontario Mills commerce
anchor, Ontario International Airport, civic center core, and downtown service
cluster.

Why:
Ontario needed the next real data artifact in the second-district pipeline
without becoming public or playable. This pack lets the pipeline distinguish
draft-only curated readiness from public promotion. It still blocks on
coordinates/bounds, provider category confidence, public screenshots, visual
acceptance, product readiness, and Forge split guard.

Anti-scope:
No Ontario public UI, server route behavior, selected-place tools, fake public
places, coordinates/provider-normalized claims, DB, Hosted Clawd,
package/lock/env drift, persistence, Stripe, XP/evidence, OAuth, automation,
reports, exports, deploy, or Railway mutation.

Verification:
Passed in this slice: `pnpm test:core` (11 files / 45 tests),
`pnpm typecheck:starter`,
`node scripts\verify-california-district-pipeline.mjs --json-only`
(`ok: true`, Ontario `curatedPack: true`, `promotionReady: false`),
`node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
(64 files, 0 blockers, 0 unknowns), and focused diff check.

## Entry 135

Quest:
E13.8 Second-District Visual Packet Fixture.

What changed:
Extended `scripts/verify-second-district-visual-packet.mjs` with
`--print-template` support so future Anaheim/Ontario review packets can produce
a conservative `visual-review.json` starter. The generated template defaults to
`HIDDEN_DRAFT_ONLY`, `promotionReady: false`, `publicPlayable: false`,
no-label anchor reads set to `FAIL`, and `labelDependentIdentity: true`.

Added `docs/SECOND_DISTRICT_VISUAL_PACKET_TEMPLATE.md` to document the required
packet filenames, template command, review JSON fields, outcomes, and Lumen
cutline. The packet support makes no-label review harder to fake because every
promotion packet must name two target anchors, first-three-second reads, filler
flags, P0/P1 lists, and a smallest next slice.

Supporting changes:
Added the packet-template doc to the `engine-beta-data` split-guard allowlist
and updated `docs/NEXT_QUESTS.md` to point future visual packet work at the
template and verifier.

Anti-scope:
No renderer code, production assets, public Anaheim/Ontario UI, fake
playability, provider claims, server route behavior, persistence, paid scope,
cars, humans, props, panels, automation, reports, exports, deploy, or Railway
mutation.

Verification:
Focused script syntax, positive template fixture smoke, negative smoke, strict
`engine-beta-data` split guard, and focused diff check required after this
entry.

## Entry 134

Quest:
E13.9 Public Path Product Proof.

What changed:
Hardened the county-switcher browser verifier around the public Play/Browse/
Lookup rail. It now proves the rail has exactly three chips, keeps the
accessible product-path copy, stays fully visible in the first viewport, remains
compact, and does not overlap or crowd the selected-place or coverage tray. The
same verifier still proves Riverside remains playable, Orange shell and Unknown
L0 remain recovery-only, and shell/unsupported states expose no fake place
tools.

Why:
E13.6 added the right public path surface, but the release gate needed to
protect product quality, not just string presence. This keeps the map-first
surface honest and compact while Axiom/Forge continue the second-district
pipeline.

Anti-scope:
No UI expansion, dashboard, directory, public Anaheim/Ontario state, fake
places, fake playable tools, product state, backend/data contract change,
persistence, Hosted Clawd, Stripe, XP, evidence, OAuth, automation, reports,
exports, deploy, or Railway mutation.

Verification:
`node --check scripts\verify-county-switcher.mjs`, `pnpm typecheck:starter`,
and `pnpm build:starter` passed. Local `node
scripts\verify-county-switcher.mjs --url http://127.0.0.1:8800/preview
--screenshots
C:\Users\mzwin\AppData\Local\Temp\atlas-e139-public-path-proof-local\county-switcher`
passed on desktop and `390x844` mobile. The proof reported three public-path
chips, first-viewport visibility, no horizontal overflow, no tray overlap, and
compact heights: `34px` desktop and `40px` mobile. Local `node
scripts\verify-engine-beta-coverage.mjs` passed against
`http://127.0.0.1:8800` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e139-public-path-proof-local\engine-beta-coverage`.
Strict `engine-beta-data` split guard passed with 64 files, 0 blockers, and 0
unknowns. Focused `git diff --check` passed with Windows LF-to-CRLF warnings
only.

## Entry 133

Quest:
E13 Big 4 Artifact Assignment Ladder.

What changed:
Updated `docs/BIG4_ARTIFACT_OPERATING_MODEL.md` and `docs/NEXT_QUESTS.md`
with the next artifact-sized assignments for Forge, Lumen, and Mira. The next
cycle is now explicit: Forge owns an Ontario draft-only curated pack, Lumen
owns second-district visual packet fixture support, and Mira owns a public-path
product proof around the Play/Browse/Lookup rail.

Why:
The team should not default to gate-only notes. Each captain needs a larger
build artifact with local verification: Forge on data/backend contracts, Lumen
on executable visual evidence, and Mira on product comprehension. Axiom remains
the integration and release authority.

Anti-scope:
No runtime code, renderer art, public Anaheim/Ontario UI, fake playable county,
provider-readiness claim, server route behavior, package/lock/env drift,
Hosted Clawd, persistence, Stripe, XP/evidence, OAuth, automation, reports,
exports, deploy, or Railway mutation.

Verification:
Focused docs diff check passed with Windows LF-to-CRLF warnings only.

## Entry 132

Quest:
E13.5 Second District Visual Screenshot Harness Artifact.

What changed:
Added `scripts/verify-second-district-visual-packet.mjs`, a docs/evidence
verifier that makes Lumen's second-district visual acceptance bar executable
enough for future Anaheim/Ontario promotion review. The script checks a
screenshot packet directory for required Riverside baseline, candidate
desktop/mobile/detail, no-label anchor, shell-state, and `visual-review.json`
files, then emits JSON aligned to `docs/SECOND_DISTRICT_VISUAL_ACCEPTANCE_BAR.md`.

Why:
E13.1 can report data and compiler readiness, but screenshot promotion still
needed a mechanical packet gate. This verifier does not perform image
recognition; it blocks incomplete packets and missing no-label review fields so
Axiom, Mira, Lumen, and Forge cannot promote a second district by vibes.

Supporting changes:
Added the verifier to the `engine-beta-data` split-guard allowlist and updated
`docs/NEXT_QUESTS.md` with the command's role in the second-district lane.

Anti-scope:
No renderer code, assets, public Anaheim/Ontario UI, fake playability, provider
claims, backend route behavior, persistence, paid scope, cars, humans, props,
panels, automation, reports, exports, deploy, or Railway mutation.

Verification:
`node --check scripts\verify-second-district-visual-packet.mjs` passed. A
complete temp screenshot packet with `visual-review.json` passed. An empty
packet failed as expected with explicit missing screenshot/review-file errors.
Strict `engine-beta-data` split guard passed with 63 files, 0 blockers, and 0
unknowns. Focused diff check passed with Windows LF-to-CRLF warnings only.

## Entry 131

Quest:
E13.4 Ontario Source-Noted Anchor Pack.

What changed:
Added `data/district_place_anchor_packs/ontario-anchors.json` and extended the
district-place-anchor tests to validate Ontario alongside Anaheim. The Ontario
pack names six source-noted, non-renderable anchors: city identity, inland
residential variety, Ontario Mills, Ontario International Airport, civic center
core, and downtown service core. Every anchor remains
`providerNormalized: false`, `renderableNow: false`, and `sceneEligible:
false`.

Why:
Ontario needed to move beyond metadata-only without pretending it is playable.
This gives the second candidate a real source-noted anchor artifact while
keeping curated packs, compiler proof, screenshots, and public UI locked behind
later promotion gates.

Anti-scope:
No Ontario curated pack, hidden scene, public switcher state, fake places,
provider-readiness claim, server route behavior, renderer change, DB, Hosted
Clawd, persistence, package/lock/env drift, Stripe, XP/evidence, OAuth,
automation, reports, exports, deploy, or Railway mutation.

Verification:
`pnpm test:core` passed with 11 files / 44 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. `node
scripts\verify-california-district-pipeline.mjs --json-only` passed with
Ontario now reporting `candidatePack: true`, `anchorPack: true`,
`satisfiedGates` including `candidate_contract`,
and `place_anchors_with_source_notes`, while `curated_district_pack`,
`bounded_scene_compiler_proof`, screenshots, Lumen acceptance, Mira acceptance,
and Forge split guard remain missing. `promotionReady` remains false. Strict
`engine-beta-data` split guard passed with 63 files, 0 blockers, and 0
unknowns. Focused `git diff --check` passed with Windows LF-to-CRLF warnings
only.

## Entry 130

Quest:
E13.6 Public Product Path Artifact.

What changed:
Extended the county switcher into a compact public product-path rail with three
map-native cues: Play, Browse, and Lookup. The rail says Riverside is the
playable map for pins/notes, California shells are browse-only with no fake
tools, and lookup places are not saved. This is a public app comprehension
artifact, not another Riverside renderer polish pass.

Anti-scope:
No dashboard, county directory, public Anaheim/Ontario state, fake places,
fake playable tools, backend/data contract change, persistence, Hosted Clawd,
Stripe, XP, evidence, OAuth, automation, reports, exports, deploy, or Railway
mutation.

Verification:
The focused county-switcher verifier now asserts the public product path text
on Riverside, Orange shell, Unknown/L0, and restored Riverside states. `node
--check scripts\verify-county-switcher.mjs`, `pnpm typecheck:starter`, and
`pnpm build:starter` passed. Local `node
scripts\verify-county-switcher.mjs --url http://127.0.0.1:8799/preview
--screenshots
C:\Users\mzwin\AppData\Local\Temp\atlas-e136-public-product-path-final\county-switcher`
passed on desktop and `390x844` mobile. Local `node
scripts\verify-engine-beta-coverage.mjs` passed against
`http://127.0.0.1:8799` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e136-public-product-path-final\engine-beta-coverage`.
Strict `engine-beta-data` split guard passed with 63 files, 0 blockers, and 0
unknowns. Focused `git diff --check` passed with Windows LF-to-CRLF warnings
only.

## Entry 129

Quest:
E13.3 Second District Visual Acceptance Bar.

What changed:
Added `docs/SECOND_DISTRICT_VISUAL_ACCEPTANCE_BAR.md`, a Lumen-owned
promotion contract for Anaheim and Ontario. It defines the required no-label
anchor recognition bar, screenshot packet, first-3-second standard, automatic
visual rejections, and pass/block outcomes before a second district can become
public or playable. Updated `docs/BIG4_ARTIFACT_OPERATING_MODEL.md` with an
artifact size bar so Forge, Lumen, and Mira default to multi-file build
artifacts rather than gate-only reports.

Why:
Second-district data can move faster now, but public promotion still needs a
hard visual standard. This doc prevents hidden draft scenes, labels, source
files, or verifier output from becoming public playability by vibes. Anaheim
must read through Convention Center and ARTIC before labels; Ontario must prove
an airport/logistics edge and commerce/civic core before labels.

Anti-scope:
No renderer code, assets, public Anaheim/Ontario UI, switcher state, playable
claim, provider promotion, server route behavior, persistence, paid scope, cars,
humans, props, panels, automation, reports, exports, deploy, or Railway
mutation.

Verification:
Focused `git diff --check` passed with Windows LF-to-CRLF warnings only.
Strict `engine-beta-data` split guard passed with 62 files, 0 blockers, and 0
unknowns.

## Entry 128

Quest:
E13.2 Ontario Candidate Contract Starter.

What changed:
Added `data/district_candidate_packs/ontario-candidate.json` as the first
Ontario candidate-only contract. It uses San Bernardino County GEOID `06071`
and Ontario place GEOID `0653896`, keeps `candidateStatus: "candidate_only"`,
`currentCoverageTier: "L1_COUNTY_SHELL"`, `targetCoverageTier:
"L2_CURATED_DISTRICT"`, `playableNow: false`, and `promotionBlocked: true`.
The candidate-pack tests now validate Ontario against the indexed candidate
metadata and assert that its anchors remain non-renderable.

Why:
Forge's E13.1 pipeline verifier showed Ontario was still metadata-only. This
starter gives Ontario a real data artifact without creating source anchors,
curated packs, scenes, UI, or fake playability. It lets the pipeline move
forward in a second county while Riverside remains the only playable public
loop.

Anti-scope:
No Ontario source anchor pack, curated pack, hidden scene, public switcher
state, fake places, provider-readiness claim, server route behavior, renderer
change, DB, Hosted Clawd, persistence, package/lock/env drift, Stripe,
XP/evidence, OAuth, automation, reports, exports, deploy, or Railway mutation.

Verification:
`pnpm test:core` passed with 11 files / 43 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. `node
scripts\verify-california-district-pipeline.mjs --json-only` passed with
Ontario now reporting `candidatePack: true`, `satisfiedGates:
["candidate_contract"]`, and `promotionReady: false`. Strict
`engine-beta-data` split guard passed with 62 files, 0 blockers, and 0
unknowns. Focused `git diff --check` passed with Windows LF-to-CRLF warnings
only.

## Entry 127

Quest:
E13.0 Mira Public Comprehension Prep.

What changed:
Tightened the county switcher truth line from internal coverage-count language
to a more human first-read: `Play Riverside now. Browse 57 CA shells.` This is
public product copy only. It does not add a county directory, Anaheim public
state, fake places, fake playable tools, backend/data contracts, persistence,
Hosted Clawd, Stripe, XP, evidence, OAuth, automation, reports, exports, or
deploy scope.

Verification:
Updated the focused county-switcher verifier so the new copy is protected as a
product boundary instead of a raw stats line. Local browser verification passed
on desktop and `390x844` mobile, and the full Engine Beta coverage matrix
passed against `http://127.0.0.1:8798`.

## Entry 126

Quest:
E13.1 California District Pipeline Verifier.

What changed:
Added `scripts/verify-california-district-pipeline.mjs`, a generalized Forge
verifier for the second-district path. It reports Anaheim and Ontario candidate
state, required promotion files, satisfied and missing gates, draft-scene proof
when source anchors exist, and public coverage totals. The verifier fails on
fake playable claims or coverage promotion, but missing Anaheim/Ontario
artifacts are reported as missing promotion gates rather than command failures.

Why:
Atlas needs a repeatable candidate-to-playable pipeline before any second
district appears in the switcher. This moves the team away from Riverside
micro-polish loops and toward concrete data/readiness expansion without
pretending Anaheim or Ontario is playable.

Anti-scope:
No UI expansion, public Anaheim switcher, playable claim, server route change,
world data mutation, provider promotion, DB, Hosted Clawd, persistence,
package/lock/env drift, Stripe, XP/evidence, OAuth, automation, reports,
exports, deploy, or Railway mutation.

Verification:
`node --check scripts\verify-california-district-pipeline.mjs` passed.
`node scripts\verify-california-district-pipeline.mjs --json-only` passed with
Riverside as the only playable county, zero provider-normalized counties, zero
public-quality counties, Anaheim partially gated, and Ontario missing promotion
artifacts. `node scripts\verify-anaheim-promotion-readiness.mjs --json-only`
passed with Anaheim still not promotion-ready. `pnpm test:core` passed with 11
files / 42 tests. `pnpm typecheck:starter` passed. `pnpm build:starter` passed.
Strict `engine-beta-data` split guard passed with 61 files, 0 blockers, and 0
unknowns. `git diff --check` passed on touched files with Windows LF-to-CRLF
warnings only.

## Entry 125

Quest:
E13.0 Second District Promotion Gate.

What changed:
Added `docs/SECOND_DISTRICT_PROMOTION_GATE.md`, a Forge-owned backend/data gate
that defines the exact candidate-to-playable proof required before Anaheim or
Ontario can appear as a public playable district. The gate names required data
artifacts, verifier commands, promotion blockers, public-copy cutlines, and
owner responsibilities. It keeps Riverside/Eastvale as the only playable county
world while making the second-district path mechanical instead of taste-only.

Why:
The human and Mira correction is right: Atlas cannot keep spending the main
thread on Riverside micro-polish while the expansion path stays implicit. The
next real production move is a concrete second-district readiness pipeline:
source notes, curated anchors, provider-readiness boundaries, compiler proof,
screenshots, and release gates before any switcher exposure.

Anti-scope:
No UI expansion, public Anaheim switcher, playable claim, server route change,
world data mutation, provider promotion, DB, Hosted Clawd, persistence,
package/lock/env drift, Stripe, XP/evidence, OAuth, automation, reports,
exports, deploy, or Railway mutation.

Verification:
`node --check scripts\verify-alpha-rc-split.mjs` passed. Strict
`engine-beta-data` split guard passed with the new promotion-gate doc allowed
and no blockers. `git diff --check` passed on the touched files with Windows
LF-to-CRLF warnings only.

## Entry 124

Quest:
E12.21 Riverside Residential Material Palette Pass.

What changed:
Improved the visible public Riverside residential kit instead of continuing the
hidden Anaheim tunnel. The city-world compiler now uses a warmer, quieter
SoCal-inspired residential palette for cottages, ranch homes, and rowhomes:
stucco creams, terracotta, muted teal/blue, warm clay, sage, and taupe replace
the older saturated red/blue/yellow/purple roof set. The renderer also adds
small structural material bands to primitive residential buildings: lower
stucco shadows, trim bands, window sill/recess cues, eave shadows, and a small
side-face facet.

Why:
The latest critique correctly identified the biggest public visual weakness:
common buildings still looked too plastic and default-colored. This slice
attacks that directly in the production Riverside proof cell without adding
cars, humans, filler props, labels, panels, fake places, or new product states.

Anti-scope:
No Anaheim promotion, hidden-draft expansion, new public county, new place,
prop, car, human, product panel, dashboard, county state, server route,
MCP/tool-list change, provider claim, DB, Hosted Clawd, persistence,
package/lock/env drift, Stripe, XP/evidence, OAuth, automation, reports,
exports, deploy, or Railway mutation.

Verification:
`pnpm test:core` passed with 11 files and 42 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Focused `git diff --check` on the touched
compiler/test/renderer files passed with only Windows LF-to-CRLF warnings.
Local Engine Beta coverage passed against `http://127.0.0.1:8797`, including
Riverside product loop, residential-detail, Orange shell, Unknown/L0, county
switcher, MCP, submission, and preview. `pnpm verify:preview:http` passed
against `http://127.0.0.1:8797/preview`. `node scripts\verify-mcp-flow.mjs`
passed against `http://127.0.0.1:8797/mcp`. Strict `engine-beta-data` split
guard passed with 59 files, 0 blockers, and 0 unknowns.

Screenshots:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1221-residential-material-local\riverside\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1221-residential-material-local\riverside\alpha-product-loop-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1221-residential-material-local\residential-detail\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1221-residential-material-local\residential-detail\alpha-product-loop-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1221-residential-material-local\orange-shell\shell-county-widget-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1221-residential-material-local\unsupported\shell-county-widget-mobile-390x844.png`

Visual read:
This is a quality-direction pass, not final art approval. It should reduce the
worst "default color toy block" signal in Riverside neighborhoods and give
cottages/ranches more built-surface read. Local screenshot read is positive but
modest: warmer roofs and facade material are calmer, while broad green-board
space and clean roof planes remain the next visible weaknesses.

## Entry 123

Quest:
E12.20 Eastvale Core Landmark Identity.

What changed:
Added a targeted structural detail pass for the public Riverside `building-civic`
only. Eastvale Core now gets a stronger glass entry, civic entry frame, roof
lantern, wing bay rhythm, and subtle front nameplate geometry. The shared civic
renderer still handles the base civic building treatment, but the extra landmark
read is limited to the visible Eastvale Core proof cell.

Why:
E12.19 improved grounding, but the selected landmark still leaned too much on
the marker/tray/label stack. The public proof cell needs one recognizable
landmark module that reads more authored before Atlas expands to additional
playable districts.

Anti-scope:
No new place, label, sign text, prop, car, human, product panel, county state,
server route, tool-list change, Anaheim promotion, provider claim, DB, Hosted
Clawd, persistence, package/lock/env drift, Stripe, XP/evidence, OAuth,
automation, reports, exports, deploy, or Railway mutation.

Verification:
`pnpm test:core` passed with 11 files and 42 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Strict `engine-beta-data` split guard
passed with 59 files, 0 blockers, and 0 unknowns. Local Engine Beta coverage
passed against `http://127.0.0.1:8796`, including Riverside product loop,
residential-detail, Orange shell, Unknown/L0, county switcher, MCP, submission,
and preview. `pnpm verify:preview:http` passed against
`http://127.0.0.1:8796/preview`, and `node scripts\verify-mcp-flow.mjs` passed
against `http://127.0.0.1:8796/mcp`.

Screenshots:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1220-eastvale-core-local\riverside\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1220-eastvale-core-local\riverside\alpha-product-loop-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1220-eastvale-core-local\residential-detail\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1220-eastvale-core-local\residential-detail\alpha-product-loop-mobile-390x844.png`

Visual read:
Accept as a modest landmark identity improvement. Eastvale Core has more
structure and better glass/entry read, but it still is not final visual quality.
The next meaningful visual artifact should improve residential/common-object art
or reduce the broad green-board feel, not add props.

## Entry 122

Quest:
E12.19 Riverside Public Visual Trust - Civic/Parcel Grounding.

What changed:
Improved the visible Riverside production renderer without touching product
state or hidden Anaheim. `web/src/CityWorldRenderer.tsx` now gives the civic lot
around Eastvale Core a more authored forecourt composition: warm court/green
facets, plinth shadow, paver rhythm, stepped approach, and side blockwork. Home
lots also gain subtler parcel ribs and front-setback facets so Neighborhood
Blocks read more like a planned residential kit instead of houses floating on
flat grass.

Why:
After the object-kit critique, the highest-leverage public screenshot issue is
not more labels or props; it is grounding. Buildings need to sit inside readable
lots and parcels so the first three seconds read as a voxel county world rather
than blocks on a green board.

Anti-scope:
No Anaheim promotion, hidden-draft expansion, cars, humans, filler props,
product panels, new county state, server route changes, tool-list changes,
provider claims, DB, Hosted Clawd, persistence, package/lock/env drift, Stripe,
XP/evidence, OAuth, automation, reports, exports, deploy, or Railway mutation.

Verification:
`pnpm test:core` passed with 11 files and 42 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Strict `engine-beta-data` split guard
passed with 59 files, 0 blockers, and 0 unknowns. Local Engine Beta coverage
passed against `http://127.0.0.1:8795`, including Riverside product loop,
residential-detail, Orange shell, Unknown/L0, county switcher, MCP, submission,
and preview. `pnpm verify:preview:http` passed against
`http://127.0.0.1:8795/preview`, and `node scripts\verify-mcp-flow.mjs` passed
against `http://127.0.0.1:8795/mcp`.

Screenshots:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1219-riverside-visual-local\riverside\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1219-riverside-visual-local\riverside\alpha-product-loop-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1219-riverside-visual-local\residential-detail\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1219-riverside-visual-local\residential-detail\alpha-product-loop-mobile-390x844.png`

Visual read:
Accept as a small public screenshot improvement, not a final art pass. Eastvale
Core feels more grounded and Neighborhood Blocks read slightly more planned.
The larger weakness remains object art and broad green-board feel.

## Entry 121

Quest:
E12.18 County Tool Copy De-jargon.

What changed:
Tightened the user-facing text for `select_county` and `render_voxel_county`.
The tools now describe Riverside/Eastvale as the playable county world, shell
counties as coverage status only, and the recovery path as opening
Riverside/Eastvale. Removed internal-facing phrasing such as "Engine Beta
slice" and "render a voxel scene" from the visible tool responses. The MCP flow
verifier now asserts this copy so the seven-tool surface stays product-readable.

Why:
The county data contracts are correct, but ChatGPT users should not have to
parse release-stage or compiler language. The tools should say what the user can
do now and what Atlas refuses to fake.

Anti-scope:
No tool-list change, UI, renderer, county switcher, coverage promotion, fake
places, public Anaheim route, DB, Hosted Clawd, persistence, package/lock/env
drift, Stripe, XP/evidence, OAuth, automation, reports, exports, deploy, or
Railway mutation.

## Entry 120

Quest:
E12.17 Public Lookup Readiness Copy.

What changed:
Hardened the public `lookup_world_places` MCP response text so provider-backed
or mock lookup results are described as lookup-only, not saved, and not evidence
that any county is playable. The existing `providerReadiness` structured
metadata remains the contract source of truth; this slice makes the user-facing
ChatGPT tool text match that boundary. The lookup boundary verifier now asserts
the text contains the lookup-only, not-saved, and no-playability claims on both
first and cached MCP calls.

Why:
Forge's provider-readiness contract protected the backend truth, but the tool
copy still read like a generic nearby-places result. Atlas users need the useful
lookup result and the coverage boundary in one short response, without backend
jargon or false promotion.

Anti-scope:
No UI, renderer, county switcher, visual lab, product state, provider promotion,
DB, Hosted Clawd, persistence, package/lock/env drift, Stripe, XP/evidence,
OAuth, automation, reports, exports, deploy, or Railway mutation.

## Entry 119

Quest:
E12.16 Lumen Convention Center Native Recognizability Cutline.

What changed:
Stopped the duplicate ARTIC pass after Axiom corrected the assignment. The
extra ARTIC compiler/renderer edits started in this thread were reverted, so
the accepted E12.15 ARTIC state remains intact. Implemented exactly one bounded
Convention Center native-geometry attempt in `web/src/CityWorldRenderer.tsx`:
stronger long hall/campus slab, wider curtain-wall frontage, hall side-face and
contact, roof-field breaks, skylight strips, mullion rhythm, and forecourt
grounding. No source SVG, public route, product UI, cars, humans, props, glows,
or panels were added.

Verification:
`pnpm test:core` passed with 11 files and 42 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. `pnpm verify:preview:http` passed against
`http://127.0.0.1:8787/preview`. Hidden Anaheim draft harness passed with
desktop, mobile, and residential-detail screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e1216-convention-center-native-local`.
`node scripts\verify-anaheim-promotion-readiness.mjs --json-only` passed with
`promotionReady: false`. Strict `engine-beta-data` split guard passed with 59
files, 0 blockers, and 0 unknowns. Engine Beta coverage passed against local
preview with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e1216-convention-center-coverage-local`.

Visual read:
The Convention Center is better: it reads more like a long glass civic hall or
campus than the earlier generic block/sticker hybrid. It still does not clear
the public-quality no-label bar. The label and shell card remain too important
to understanding the object, especially at mobile crop. Per the hard stop, this
should end the Anaheim visual tunnel for now.

Next:
Do not promote Anaheim and do not start another hidden Anaheim art pass. Shift
Lumen effort back to visible Riverside/public product-loop trust unless the
human explicitly reopens a tighter venue-authoring lane with a new bar.

## Entry 118

Quest:
E12.16 Anaheim Hidden Draft Mobile Comprehension Tightening.

What changed:
Compressed the hidden Anaheim shell/draft coverage tray on mobile through
CSS-only product-surface tightening. The card now uses smaller gaps, tighter
fact cells, shorter boundary/source blocks, and a slightly shorter recovery
CTA while preserving the title, counts, no-fake-playability boundary, CTA, and
source note. The Anaheim draft verifier now also asserts mobile boundary copy,
source note, and recovery CTA visibility in the first viewport.

Why:
E12.15 kept Anaheim safely hidden, but the mobile shell card still felt too
much like a bulky status/error panel. The hidden draft should read as a compact
map-native prep state while still telling the truth: no playable districts, no
places, no saves, no XP/evidence, no automation, and Riverside/Eastvale remains
the only playable recovery path.

Verification:
`pnpm typecheck:starter` passed. `pnpm build:starter` passed. `node --check
scripts\verify-anaheim-draft-scene.mjs` passed. Local
`node scripts\verify-anaheim-draft-scene.mjs --url
http://127.0.0.1:8791/preview --screenshots
C:\Users\mzwin\AppData\Local\Temp\atlas-e1216-anaheim-mobile-comprehension-local`
passed with desktop, mobile, and residential-detail screenshots. Local
`ATLAS_BASE_URL=http://127.0.0.1:8791 node
scripts\verify-engine-beta-coverage.mjs` passed with Riverside, residential
detail, Orange shell, Unknown/L0, county switcher, MCP, submission, and preview.

Anti-scope:
No backend/data contract changes, renderer changes, public Anaheim UI, switcher
expansion, public route, playable claim, fake place tools, selected-place tray,
stickers, notes, Scout Drop, campaign controls, DB, migrations, Hosted Clawd,
Stripe, XP/evidence, OAuth, automation, reports, exports, deploy, or Railway
mutation.

## Entry 117

Quest:
E12.16 Provider Readiness Contract.

What changed:
Added a typed `ProviderLookupReadiness` contract to world lookup responses.
REST `/api/world/lookup` and MCP `lookup_world_places` now expose
`providerReadiness` with lookup-only status, provider sources, adapter mode,
cache key/TTL, normalized category status, normalized category confidence, and
hard false promotion flags: `coveragePromotion`, `sceneEligible`, and
`publicQuality`. The MCP output schema and lookup verifier now enforce the same
contract.

Why:
Provider lookup needs to become production-readable without quietly turning into
coverage readiness. The contract lets Atlas say what provider data is good for:
read-only place discovery with bounded Atlas categories and source/cache notes.
It does not make counties playable, scene-eligible, provider-normalized, or
public-quality.

Verification:
`pnpm test:core` passed with 11 files and 42 tests. `pnpm typecheck:starter`
passed. `node --check scripts\verify-world-lookup-boundary.mjs` passed. The
live local `node scripts\verify-world-lookup-boundary.mjs --json-only` verifier
passed against `http://127.0.0.1:8787`, including repeat-call cache behavior,
provider readiness metadata, and no coverage promotion. Strict
`engine-beta-data` split guard passed with 59 files, 0 blockers, and 0 unknowns.

Anti-scope:
No UI, renderer, public Anaheim promotion, DB, migrations, Hosted Clawd,
persistence, package/lock/env drift, Stripe, XP/evidence, OAuth, automation,
reports, exports, staging, deploy, or Railway mutation.

## Entry 116

Quest:
E12.15B Mira Product/Backend and Anaheim Venue Research Briefs.

What changed:
Added three Mira-owned planning artifacts that turn the latest product
correction into buildable constraints:
`docs/ATLAS_PRODUCT_BACKEND_UML_SPEC.md`,
`docs/ATLAS_BACKEND_PRODUCT_TASTE_RESEARCH.md`, and
`docs/ANAHEIM_VENUE_OBJECT_GRAMMAR_RESEARCH.md`. The UML spec separates public
coverage state, hidden draft evidence, session-only map state, and future
Hosted Clawd persistence. The backend taste memo translates Apps SDK, map,
idempotency, ownership, and high-clarity product patterns into Atlas rules. The
Anaheim venue brief grounds E12.15 in real Convention Center, ARTIC, Angel
Stadium, and Platinum Triangle object grammar.

Why:
The user correction was right: Mira cannot only gate screenshots while Axiom and
Lumen polish visuals. Atlas needs product/backend taste and object-grammar
research that forces better implementation decisions. The briefs give Forge a
backend boundary lane, Lumen a researched venue-recognition bar, and Axiom a
cutline for when to stop the Anaheim visual tunnel.

Verification:
`git diff --check` passed on the three new Mira docs and the shared docs touched
for this note.

Anti-scope:
No product code, backend code, database migration, Railway mutation, public
Anaheim UI, switcher expansion, playable claim, provider-normalized claim,
Hosted Clawd implementation, Stripe, XP/evidence, OAuth, automation, reports,
exports, cars, humans, props, glows, or dashboard panels.

## Entry 114

Quest:
E12.15A Backend Service Map and Production Boundary Brief.

What changed:
Added `docs/ATLAS_BACKEND_SERVICE_MAP.md` as the current Big 4 backend/service
map. It records the Railway project/environment/service, active deployment,
runtime route map, MCP tool surface, core world service boundaries, provider
adapter policy, Railway verification commands, and the recommended next backend
artifact: E12.16 Provider Readiness Contract.

Why:
The backend was increasingly spread across route code, world contracts,
promotion verifiers, source-quality checks, and worker memory. Atlas needs one
production-facing service map so Forge can operate as backend/data owner and so
Axiom can decide visual, data, and deploy slices without guessing. This is also
the correction from the user: the Big 4 should build artifacts, not only gates.

Verification:
`node --check scripts\verify-alpha-rc-split.mjs` passed. Strict
`engine-beta-data` split guard passed with 57 files, 0 blockers, and 0 unknowns
after adding the service-map doc to the selected-RC allowlist. `git diff
--check` passed on the touched files with Windows LF-to-CRLF warnings only.

Anti-scope:
No server route changes, Railway mutation, product UI, renderer behavior, DB,
migrations, Hosted Clawd implementation, package/lock/env drift, Stripe,
XP/evidence, OAuth, automation, reports, exports, or public Anaheim promotion.

## Entry 115

Quest:
E12.16 World Lookup Provider Boundary Verifier.

What changed:
Added `scripts/verify-world-lookup-boundary.mjs`, a focused backend/service
verifier for the live provider lookup lane. The verifier calls REST
`/api/world/lookup` and MCP `lookup_world_places`, checks normalized place
categories and source notes, asserts runtime cache metadata and repeat-call
cache behavior, blocks raw provider fields in place summaries, and verifies
that provider lookup does not promote county readiness. Riverside must remain
the only playable county, and provider-normalized/public-quality counts must
stay zero.

Why:
Forge's backend service brief identified the exact next useful artifact: Atlas
already has Google-backed lookup, but lookup cannot become a back door into
fake coverage. This verifier makes the provider boundary executable before any
future provider-normalized district work.

Verification:
`node --check scripts\verify-world-lookup-boundary.mjs` passed. `node --check
scripts\verify-alpha-rc-split.mjs` passed. Local
`node scripts\verify-world-lookup-boundary.mjs` passed against
`http://127.0.0.1:8787` in mock mode with 5 normalized REST places, first REST
lookup cache miss, second REST lookup cache hit, Riverside as the only playable
county, and zero provider-normalized or public-quality county claims. Strict
`engine-beta-data` split guard passed with 59 files, 0 blockers, and 0 unknowns.
`git diff --check` passed on touched files with Windows LF-to-CRLF warnings
only.

Anti-scope:
No server route changes, Railway mutation, product UI, renderer behavior, DB,
migrations, Hosted Clawd implementation, package/lock/env drift, Stripe,
XP/evidence, OAuth, automation, reports, exports, or public Anaheim promotion.

## Entry 113

Quest:
E12.15 Product Backend Boundary DTO Guard.

What changed:
Added a typed core boundary module for product/backend DTO separation:
`public_coverage`, `hidden_draft_evidence`, and `future_hosted_clawd`. Public
coverage now has a single derived guard for playable tool affordances:
`coverageTier === L2_CURATED_DISTRICT` and `playableDistrictCount > 0`.
National world service tests now prove Riverside is the only state that enables
selected-place tray, sticker tools, note input, Scout Drop, and campaign preview
tools, while Orange shell, unsupported counties, and hidden Anaheim draft
evidence expose no playable tools.

Why:
Atlas cannot keep treating every next move as visual polish. The product
surface needs a hard backend contract that prevents shell counties and hidden
draft evidence from quietly becoming playable UI. This is also the clean
pre-persistence boundary: Hosted Clawd remains a future explicit DTO, not a
database or migration implementation.

Verification:
`pnpm test:core` passed with 11 files and 42 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. `node --check
scripts\verify-alpha-rc-split.mjs` passed. Strict `engine-beta-data` split
guard passed with 54 files, 0 blockers, and 0 unknowns. `git diff --check`
passed on touched files with Windows LF-to-CRLF warnings only.

Anti-scope:
No product UI, public Anaheim promotion, server route behavior, DB, migrations,
Hosted Clawd implementation, package/lock/env drift, Stripe, XP/evidence, OAuth,
automation, reports, exports, or deploy.

## Entry 112

Quest:
E12.14 Anaheim Source-Art Cutline.

What changed:
Added the first inspectable source-art venue asset for the hidden Anaheim draft:
`packages/assets/city-world/textures/building-venue-anaheim-convention-center.v1.svg`.
The asset is registered in the city-world atlas manifest and resolver, then
assigned only to the hidden Anaheim Convention Center entry spine. Primitive
fallback remains intact through the existing sprite manifest contract: if the
texture fails to load, the map falls back to the procedural civic building.

Why:
The hard art critique correctly called out that venue identity cannot depend on
generic cuboids and text labels. This slice tests the real production asset path
with one high-impact venue instead of adding cars, humans, props, labels, or
panels to hide weak art.

Visual read:
Accepted only as hidden-draft progress. The source-art path improves the
Convention Center's recognizability slightly and proves a venue asset can enter
the production atlas path, but it still has some sprite-on-board read and is not
public-quality art. Anaheim remains blocked from promotion until at least two
public-recognition anchors can be recognized before reading labels.

Verification:
`pnpm test:core` passed with 11 files and 40 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local hidden-draft screenshot harness
passed with desktop, mobile, and residential-detail screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e1214-anaheim-source-art-local-pass3`.
`node scripts\verify-anaheim-object-source-quality.mjs --json-only` passed and
reported the intended cutline: Convention Center source art is present, ARTIC,
Angel Stadium, and Downtown Anaheim Community Center still lack source-quality
sprites, naming/app-review risk remains open, and Anaheim remains
`promotionReady: false`.

Deployment:
Railway deployment `3c549552-4f22-4f9b-a2df-d9c4ae222ea6` completed
successfully for service `atlas-backend` in environment `production`.

Public verification:
Public `node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e1214-anaheim-source-art-public-coverage`.
Public `node scripts\verify-anaheim-draft-scene.mjs --url
https://atlas-backend-production-e6fc.up.railway.app/preview` passed with
desktop, mobile, and residential-detail screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e1214-anaheim-source-art-public`.
Public promotion-readiness and object-source-quality verifiers passed while
keeping `promotionReady: false`; Riverside remains the only playable county.

Anti-scope:
No public Anaheim UI, county switcher expansion, public route, playable claim,
provider-normalized claim, public-quality claim, package/lock/env drift, Hosted
Clawd, persistence, Stripe, XP/evidence, OAuth, automation, reports, exports,
cars, humans, decorative props, dashboard panels, or product-state changes.

## Entry 112

Quest:
E12.14 Anaheim Object Source Quality / Naming Risk Gate.

What changed:
Added `scripts/verify-anaheim-object-source-quality.mjs`, a Forge-owned
release-safety verifier for the hidden Anaheim draft. The verifier reads the
draft curated pack and city-world atlas manifest, confirms Anaheim remains
`L1_COUNTY_SHELL`, non-playable, and non-public, then reports two promotion
blocker classes: missing source-quality object art for named Anaheim anchors
and public naming/app-review risk for official venue labels.

Why:
E12.13 improved venue silhouettes, but silhouette polish is not the same as a
public-quality source artifact. Anaheim should not move toward playable/public
coverage while ARTIC, Angel Stadium, Downtown Anaheim Community Center, and
Platinum Triangle still lack dedicated source-art coverage and while official
venue names have not received an explicit public naming decision.

Verification:
`node --check scripts\verify-anaheim-object-source-quality.mjs` passed.
`node scripts\verify-anaheim-object-source-quality.mjs --json-only` passed with
`ok: true`, `promotionReady: false`, and no boundary failures. The verifier
reports source-art coverage for Platinum Triangle and Anaheim Convention Center,
then blocks public promotion on missing ARTIC, Angel Stadium, and Downtown
Anaheim Community Center source-art keys plus unresolved public naming review.
`node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc
--rc-mode engine-beta-data --json-only` passed with 51 files, 0 blockers, and
0 unknowns. `git diff --check` passed on the touched files with Windows
LF-to-CRLF warnings only.

Anti-scope:
No renderer changes, public Anaheim UI, county switcher expansion, public
route, playable claim, provider-normalized claim, public-quality claim,
package/lock/env drift, Hosted Clawd, persistence, Stripe, XP/evidence, OAuth,
automation, reports, exports, cars, humans, props, dashboard panels, or product
state changes.

## Entry 111

Quest:
E12.13 Anaheim Venue Silhouette Pass.

What changed:
Improved hidden Anaheim draft venue/object silhouettes without exposing Anaheim
as playable. The compiler now gives the draft anchors more deliberate footprint
proportions for Platinum Triangle, Anaheim Convention Center, ARTIC, and Angel
Stadium. The renderer adds stronger draft-only architectural cues: Convention
Center hall roof fields, ribbed roof lines, glass arcade bays, entry piers and
forecourt; ARTIC shed/vault language with roof ribs and platform lines; Angel
Stadium bowl, field, and tier marks; and denser Platinum Triangle mixed-use,
lowrise, terrace, and podium reads.

Why:
The art critique was directionally correct: calmer color alone was not enough.
The hidden Anaheim draft still read too much like generic cuboids on a grid.
This pass attacks silhouette and venue identity first, because a county engine
needs recognizable object families before it can honestly promote a second
playable district.

Verification:
`pnpm test:core` passed with 11 files and 40 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local
`node scripts\verify-anaheim-draft-scene.mjs --screenshots
C:\Users\mzwin\AppData\Local\Temp\atlas-e1213-anaheim-venue-silhouette-local`
passed with desktop, mobile, and residential-detail screenshots. The draft
still reports `coverageTier: L1_COUNTY_SHELL`, `playableDistrictCount: 0`, and
`placeCount: 0`.

Deployment:
Railway deployment `6098c392-1073-4956-a249-edda52f9801a` completed
successfully for service `atlas-backend` in environment `production`.

Public verification:
Public `node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e1213-anaheim-venue-silhouette-public-coverage`.
Public `node scripts\verify-anaheim-draft-scene.mjs --url
https://atlas-backend-production-e6fc.up.railway.app/preview` passed with
desktop, mobile, and residential-detail screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e1213-anaheim-venue-silhouette-public`.
The public hidden draft remains `L1_COUNTY_SHELL`, has zero playable districts,
zero places, no selected-place tray, no sticker tools, no note input, and keeps
the Riverside/Eastvale recovery CTA visible.

Visual read:
Meaningful but not final. The Anaheim Convention Center is more clearly a broad
venue complex, ARTIC reads more like a transit shed, Angel Stadium has a bowl
cue, and Platinum Triangle has stronger mixed-use block structure. Weak spots
remain: the scene still relies on procedural primitives, terrain is broad, and
some roof/foundation surfaces still lack true hand-authored sprite quality.

Anti-scope:
No public Anaheim UI, county switcher expansion, public route, playable claim,
provider-normalized claim, public-quality claim, package/lock/env drift, Hosted
Clawd, persistence, Stripe, XP/evidence, OAuth, automation, reports, exports,
cars, humans, decorative props, dashboard panels, or product-state changes.

## Entry 110

Quest:
E12.12 SoCal Voxel Material System.

What changed:
Added a draft-only material system pass for the hidden Anaheim scene. The
production renderer now detects draft terrain, lots, roads, and buildings and
uses a warmer SoCal material set for those draft objects: sun-faded grass,
warmer plaza/lot pads, darker asphalt side faces, tan curbs, subdued lane
marks, asphalt scuffs, stronger parcel lips, foundation strata, stucco facets,
shade blocks, base courses, and extra roof panel lines.

The change is intentionally renderer-gated to Anaheim draft IDs and does not
make Anaheim public. Riverside production behavior, shell/unsupported recovery,
the county switcher, selected-place tray, stickers, and notes remain protected
by the Engine Beta matrix.

Why:
E12.11 removed the loudest palette/copy failures, but the hard critique's
deeper point still stood: the scene needed material depth, not just calmer
colors. This slice establishes a stricter draft material vocabulary before any
Anaheim promotion talk: roads should feel embedded, lots should ground
buildings, and roofs/facades should carry authored marks instead of flat plastic
planes.

Visual read:
Improved modestly. Roads and curbs have more physical bite, parcels are less
dead, and the buildings have more visible roof/facade material. Still not a
public-quality art pass: broad roof planes remain too clean, the hidden Anaheim
world still leans on primitives, and the next improvement must attack object
silhouette and venue-specific art rather than adding decorative clutter.

Anti-scope:
No public Anaheim UI, county switcher expansion, public route, playable claim,
provider-normalized claim, public-quality claim, package/lock/env drift, Hosted
Clawd, persistence, Stripe, XP/evidence, OAuth, automation, reports, exports,
cars, humans, decorative props, dashboard panels, or product-state changes.

Verification:
`pnpm test:core` passed with 11 files and 40 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. `node
scripts\verify-anaheim-draft-scene.mjs --screenshots
C:\Users\mzwin\AppData\Local\Temp\atlas-e1212-socal-material-local-pass2`
passed with desktop, mobile, and residential-detail screenshots. `pnpm
verify:preview:http` passed. `node
scripts\verify-anaheim-promotion-readiness.mjs --json-only` passed with
`promotionReady: false` and zero boundary failures. Local `node
scripts\verify-engine-beta-coverage.mjs` passed with Riverside, Orange shell,
unsupported, county-switcher, and residential-detail screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e1212-socal-material-local-coverage`.

Deployment:
E12.12 deployed to Railway as deployment
`92dc0aae-b1ea-41f1-a8ad-4f979bd3f3bf`. Public `node
scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app`, and public `node
scripts\verify-anaheim-draft-scene.mjs --url
https://atlas-backend-production-e6fc.up.railway.app/preview` passed with
desktop, mobile, and residential-detail screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e1212-socal-material-public`.

## Entry 109

Quest:
E12.11 Anaheim Visual Triage Pass.

What changed:
Responded to the hard external art critique with a bounded hidden-Anaheim
triage pass. The Anaheim draft compiler now uses a quieter SoCal-leaning
palette instead of saturated toy-box roofs: warmer stucco bodies, muted
terracotta, softened glass blues, and restrained olive/teal civic roofs. The
renderer now honors authored draft building colors, adds draft-ID-gated roof
material patches, facade rhythm, stadium/convention/transit details, and backs
place labels with compact cream tags so labels do not disappear over busy
tiles.

The non-public Anaheim evidence surface also stops leaking the worst internal
language. The hidden draft screenshot harness now says `Anaheim preview` and
`not open yet` instead of presenting a compiler-draft phrase as product copy.
The county coverage UI now shows `Census ID` instead of `GEOID`, and the L0
state label no longer uses raw `L0 state` as the primary read.

Why:
The critique was correct: the Anaheim proof still looked too generic, too flat,
and too much like debug output. This slice does not claim the art is solved. It
removes the most obvious palette/copy/label failures and makes the hidden
second-district evidence less embarrassing while keeping Anaheim non-public.

Visual read:
Improved but still not final. The palette is calmer, labels are more legible,
and the Anaheim card reads more like a preview than a backend verifier. Weak
spots remain: broad roofs are still too clean, roads are still flatter than the
target voxel-engine bar, and the scene still needs a proper SoCal material
system before any Anaheim promotion discussion.

Anti-scope:
No public Anaheim UI, county switcher expansion, public route, playable claim,
provider-normalized claim, public-quality claim, package/lock/env drift, Hosted
Clawd, persistence, Stripe, XP/evidence, OAuth, automation, reports, exports,
cars, humans, decorative props, or product-panel work.

Verification:
`pnpm test:core` passed with 11 files and 40 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. `node
scripts\verify-anaheim-draft-scene.mjs --screenshots
C:\Users\mzwin\AppData\Local\Temp\atlas-e1211-anaheim-visual-triage-local-pass2`
passed with desktop, mobile, and residential-detail screenshots. `pnpm
verify:preview:http` passed. `node
scripts\verify-anaheim-promotion-readiness.mjs --json-only` passed with
`promotionReady: false`, Riverside as the only public playable county, three
satisfied gates, four missing promotion gates, and zero boundary failures.

Deployment:
E12.11 deployed to Railway as deployment
`d2c6eb14-6a1b-41ca-abf4-674e39c21caa`. Public `node
scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app`, and public `node
scripts\verify-anaheim-draft-scene.mjs --url
https://atlas-backend-production-e6fc.up.railway.app/preview` passed with
desktop, mobile, and residential-detail screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e1211-anaheim-visual-triage-public`.

## Entry 108

Quest:
E12.10 Anaheim Curated District Pack Contract.

What changed:
Added a typed draft-only curated district pack contract for Anaheim. The new
core schema lives in `packages/core/src/world/districtCuratedPack.ts`, the data
fixture lives at
`data/district_curated_packs/anaheim-curated-district-draft.json`, and
`packages/core/test/district-curated-pack.test.ts` validates the contract.

The pack names the exact Anaheim anchors carried forward from the source-noted
anchor lane: Anaheim identity, Platinum Triangle, Anaheim Convention Center,
ARTIC, Angel Stadium, and Downtown Anaheim Community Center. Each anchor is
still draft-only, carries `publicPlaceClaim: false`, and lists the required
work before public use.

The Anaheim promotion-readiness verifier now reads the curated pack when
present. With E12.10 in place it reports three satisfied gates:
`curated_district_pack`, `place_anchors_with_source_notes`, and
`bounded_scene_compiler_proof`. It still reports `promotionReady: false` because
desktop/mobile product-loop screenshots, Lumen visual acceptance, Mira readiness
acceptance, and Forge split guard are not completed for promotion.

Why:
The second playable district path needs a durable middle artifact between
source notes and public playability. This pack lets the team review intended
objects, source limits, screenshot requirements, and blockers without exposing
Anaheim as playable or pretending provider-normalized data exists.

Anti-scope:
No public Anaheim UI, county switcher expansion, public route, playable claim,
provider-normalized claim, public-quality claim, package/lock/env drift, Hosted
Clawd, persistence, Stripe, XP/evidence, OAuth, automation, reports, exports,
cars, humans, decorative props, or product-panel work.

Verification:
`pnpm test:core` passed with 11 files and 40 tests. `node --check
scripts\verify-anaheim-promotion-readiness.mjs` passed. `node --check
scripts\verify-alpha-rc-split.mjs` passed. `pnpm build:core` passed. `node
scripts\verify-anaheim-promotion-readiness.mjs --json-only` passed with
`promotionReady: false`, `curatedPackPresent: true`, public playable counties
`["riverside-ca"]`, 6 source notes, 6 place anchors, 6 curated anchors, 17
draft buildings, 5 lots, 6 road segments, and zero boundary failures.

Deployment update:
E12.10 deployed to Railway as deployment
`fd563d83-dde2-4431-b917-89a5ce0a61c7`. Public `node
scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` after deploy.

## Entry 107

Quest:
E12.9 Anaheim Draft Promotion Readiness Verifier.

What changed:
Added a promotion-readiness verifier for the Anaheim second-district lane. The
new script validates the current candidate pack, source-noted anchor pack,
Orange County coverage state, Riverside-only playable boundary, and hidden
Anaheim draft scene. It intentionally reports `promotionReady: false` today
while returning `ok: true` when the no-fake-playability boundary is intact.

The verifier checks that Anaheim remains `orange-ca` / `anaheim-candidate`,
`L1_COUNTY_SHELL`, `playableNow: false`, and `promotionBlocked: true`; that all
place anchors remain non-provider-normalized, non-renderable, and
non-scene-eligible; that Orange has zero playable districts and zero places;
that Riverside remains the only public playable county; and that the hidden
draft scene has no actors, pins, or selected public place state.

Why:
E12.8 made the hidden Anaheim draft more useful visually. The next risk is a
bad promotion path: flipping metadata or exposing Anaheim before the curated
district, screenshot, Lumen, Mira, and Forge gates exist. This verifier makes
that risk machine-readable.

Current readiness:
The script reports two satisfied gates: `place_anchors_with_source_notes` and
`bounded_scene_compiler_proof`. It reports five missing gates:
`curated_district_pack`, `desktop_mobile_product_loop_screenshots`,
`lumen_visual_acceptance`, `mira_readiness_acceptance`, and `forge_split_guard`.

Anti-scope:
No public Anaheim UI, county switcher expansion, public route, playable claim,
provider-normalized claim, public-quality claim, package/lock/env drift, Hosted
Clawd, persistence, Stripe, XP/evidence, OAuth, automation, reports, exports,
cars, humans, decorative props, or product-panel work.

Verification:
`node --check scripts\verify-anaheim-promotion-readiness.mjs` passed. `node
--check scripts\verify-alpha-rc-split.mjs` passed. `pnpm build:core` passed.
`node scripts\verify-anaheim-promotion-readiness.mjs --json-only` passed with
`promotionReady: false`, public playable counties `["riverside-ca"]`, 6 source
notes, 6 place anchors, 17 draft buildings, 5 lots, 6 road segments, 0 actors,
0 pins, and no boundary failures.

## Entry 106

Quest:
E12.8 Draft Venue/Transit Primitive Detail Support.

What changed:
Improved the hidden Anaheim draft renderer path without making Anaheim public.
`CityWorldRenderer` now adds draft-ID-gated structural detail for the Anaheim
draft's convention, transit, stadium, and downtown objects. The added details
are physical building marks only: exhibit-hall roof seams, entry canopies,
terminal platform bands, clock-tower cap/face, stadium bowl tiers, gate
forecourt, and community-center steps.

The compiler also removed accidental storefront-sprite spam from convention,
stadium, and downtown support blocks by keeping those support masses as civic
primitive objects. Platinum Triangle keeps the mixed-use/storefront stressor.
`CountyCoverageView` now honors the `atlasCamera` QA query for coverage-shell
scenes, and `scripts/verify-anaheim-draft-scene.mjs` asserts the requested
camera preset so residential-detail screenshots are not duplicate desktop
captures.

Why:
E12.7 made the hidden Anaheim draft more anchor-specific, but visual review
showed the proof was still leaning on generic civic/shop primitives and the
residential-detail harness was not proving a distinct camera. This pass makes
the hidden second-district evidence more inspectable before any promotion
discussion.

Visual read:
Improved for draft evidence. The screenshot now has a more believable terminal,
venue, convention, and downtown read, and the residential-detail screenshot is
a true crop. Still not public-quality: labels/tray cover some draft detail, and
the stadium/transit forms are still primitive approximations rather than
production object art.

Anti-scope:
No public Anaheim UI, county switcher expansion, public route, playable claim,
provider-normalized claim, public-quality claim, package/lock/env drift, Hosted
Clawd, persistence, Stripe, XP/evidence, OAuth, automation, reports, exports,
cars, humans, decorative props, or product-panel work.

Verification:
`pnpm test:core` passed with 10 files and 38 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. `node --check
scripts\verify-anaheim-draft-scene.mjs` passed. Local `node
scripts\verify-anaheim-draft-scene.mjs --screenshots
C:\Users\mzwin\AppData\Local\Temp\atlas-e128-draft-venue-transit-detail-local-pass3`
passed and asserted `desktop`, `mobile`, and `residential_detail` camera
presets. `pnpm verify:preview:http` passed against
`http://127.0.0.1:8787/preview` with 863336 bytes and city-world markup. Local
`node scripts\verify-engine-beta-coverage.mjs` passed with screenshots written
to
`C:\Users\mzwin\AppData\Local\Temp\atlas-e128-draft-venue-transit-detail-coverage-local-pass2`.
Strict `engine-beta-data` split guard passed with 45 files, 0 blockers, and 0
unknowns. Focused `git diff --check` on the E12.8 renderer/compiler/view/script
and docs files passed with only Windows CRLF warnings.

Deployment:
Railway deployment `5d057007-96d6-4e71-a85f-81b7bcfeb28c` completed
successfully for service `atlas-backend` in environment `production`.

Public verification:
Public `node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e128-draft-venue-transit-detail-public-coverage`.
The matrix covered California count `58`, Riverside `L2_CURATED_DISTRICT`,
Orange `L1_COUNTY_SHELL`, unknown `L0_UNSUPPORTED`, preview HTTP, MCP,
submission, Riverside product loop, residential-detail camera proof, Orange
shell widget, unsupported widget, and county switcher desktop/mobile states.
Public `node scripts\verify-anaheim-draft-scene.mjs --url
https://atlas-backend-production-e6fc.up.railway.app/preview` also passed with
screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e128-draft-venue-transit-detail-public`
and asserted `desktop`, `mobile`, and `residential_detail` camera presets.

## Entry 105

Quest:
E12.7 Anaheim Anchor-Specific Object Grammar.

What changed:
Improved the hidden Anaheim draft compiler again without exposing Anaheim
publicly. The draft now uses a small anchor-specific building profile table
instead of more branchy one-off compiler code. Platinum Triangle, Anaheim
Convention Center, ARTIC, Angel Stadium, and Downtown Anaheim Community Center
each compile into more deliberate object clusters with different footprints,
roof shapes, facade styles, lot footprints, and detail levels.

The convention center now separates exhibit halls from an entry spine and
frontage block. ARTIC now uses a sawtooth terminal-shed grammar, ticket hall,
and clock tower. Angel Stadium now reads as two venue-bowl masses plus gate
frontage instead of one large generic civic block. Downtown Community Center now
has a smaller hall, classroom wing, and front porch/frontage piece.

Why:
E12.6 made the Anaheim draft useful, but the strongest anchors still leaned on
the same civic/storefront primitives. This pass makes the hidden second-district
proof more honest as a compiler/object-kit stress test before any public
playable promotion discussion.

Visual read:
Improved, but still not public-quality. The desktop/mobile hidden draft now
distinguishes convention, transit, stadium, downtown, and mixed-use anchors
more clearly. The next quality bottleneck is renderer support for venue/transit
primitive details; more compiler clusters alone will have diminishing returns.

Anti-scope:
No public Anaheim UI, county switcher expansion, public route, playable claim,
provider-normalized claim, public-quality claim, server route change,
package/lock/env drift, Hosted Clawd, persistence, Stripe, XP/evidence, OAuth,
automation, reports, exports, cars, humans, decorative props, or product-panel
work.

Verification:
`pnpm test:core` passed with 10 files and 38 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local
`node scripts\verify-anaheim-draft-scene.mjs --screenshots
C:\Users\mzwin\AppData\Local\Temp\atlas-e127-anaheim-anchor-grammar-local`
passed and captured desktop, mobile, and residential-detail draft screenshots.
`pnpm verify:preview:http` passed against `http://127.0.0.1:8787/preview`
with 860387 bytes and city-world markup. `node
scripts\verify-county-index-source.mjs --offline --json-only` passed with 58
California counties, Riverside `06065`, Eastvale `0621230`, and 0 blockers.
Direct manifest validation for the compiled Anaheim draft scene passed with no
missing sprites, palettes, or tiles. Local `node
scripts\verify-engine-beta-coverage.mjs` passed with screenshots written to
`C:\Users\mzwin\AppData\Local\Temp\atlas-e127-anaheim-anchor-grammar-coverage-local`.
Strict `engine-beta-data` split guard passed with 45 files, 0 blockers, and 0
unknowns. Focused `git diff --check` on the E12.7 compiler/test/docs files
passed with only Windows CRLF warnings. Railway deployment
`08e51f37-1db1-4f66-89ad-a5be2ec7e758` reached `SUCCESS`. Public `node
scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots written
to
`C:\Users\mzwin\AppData\Local\Temp\atlas-e127-anaheim-anchor-grammar-public-coverage`.
Public `node scripts\verify-anaheim-draft-scene.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app/preview` with screenshots
written to
`C:\Users\mzwin\AppData\Local\Temp\atlas-e127-anaheim-anchor-grammar-public`.

## Entry 104

Quest:
E12.6 Anaheim Draft Composition Pass.

What changed:
Improved the hidden Anaheim draft compiler composition without exposing Anaheim
publicly. The Platinum Triangle anchor now compiles as a mixed-use cluster with
rowhome, lowrise apartment, and storefront masses. The convention center,
ARTIC, Angel Stadium, and Downtown Community Center anchors now compile as
different building clusters using existing primitive building families, palette
keys, lots, and road grammar.

Lumen follow-up tightened the draft stressor grammar inside the same hidden
compiler lane: ARTIC now reads as a terminal plus tower instead of a generic
shed, convention/stadium support masses use civic primitives instead of cloned
storefront sprites, and draft-only driveway links tie convention/stadium lots
back into the road system.

Why:
E12.5 proved the screenshot harness, but the first draft scene read too much
like repeated civic blocks. This pass makes the non-public draft more useful as
a visual/engine proof before any second-district promotion discussion.

Visual read:
Improved. The draft now reads more like a mixed-use Anaheim candidate cluster
than a row of identical civic boxes. It is still not public-quality: convention,
transit, stadium, and downtown anchors need stronger object-specific grammar
before any public playable claim.

Anti-scope:
No public UI, county switcher expansion, public Anaheim route, playable claim,
provider-normalized claim, public-quality claim, server route change,
package/lock/env drift, Hosted Clawd, persistence, Stripe, XP/evidence, OAuth,
automation, reports, exports, cars, humans, or props.

Verification:
`pnpm test:core` passed with 10 files and 38 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. `pnpm verify:preview:http` passed against
`http://127.0.0.1:8787/preview` with 860387 bytes and city-world markup. Direct
manifest validation for the compiled Anaheim draft scene passed with no missing
sprites, palettes, or tiles. Local
`node scripts\verify-anaheim-draft-scene.mjs` passed with screenshots written
to `C:\Users\mzwin\AppData\Local\Temp\atlas-e126-anaheim-draft-composition-local`.
Local `node scripts\verify-engine-beta-coverage.mjs` passed with screenshots
written to
`C:\Users\mzwin\AppData\Local\Temp\atlas-e126-anaheim-draft-composition-coverage-local`.
Strict `engine-beta-data` split guard passed with 45 files, 0 blockers, and 0
unknowns. Focused `git diff --check` on the E12.6 compiler/test/script/split/docs
files passed with only Windows CRLF warnings. Railway deployment
`400dde38-5f75-4c2e-ac2c-31408854669c` reached `SUCCESS`. Public
`node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots written
to
`C:\Users\mzwin\AppData\Local\Temp\atlas-e126-anaheim-draft-composition-public-coverage`.
Public `node scripts\verify-anaheim-draft-scene.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app/preview` with screenshots
written to
`C:\Users\mzwin\AppData\Local\Temp\atlas-e126-anaheim-draft-composition-public`.

## Entry 103

Quest:
E12.5 Anaheim Draft Screenshot Harness.

What changed:
Added `scripts/verify-anaheim-draft-scene.mjs`, a non-public verifier that
loads the Anaheim place-anchor pack, compiles the hidden draft
`CityWorldScene`, injects it into the existing preview through the test bridge
as `_meta.coverageShellScene`, and captures desktop, mobile, and
residential-detail screenshots. The harness asserts that Anaheim remains
`L1_COUNTY_SHELL`, has zero playable districts, zero public places, no
selected-place tray, no sticker tools, no note input, a visible recovery action
back to Riverside/Eastvale, one canvas, no horizontal overflow, and a clean
console. The draft compiler also now reuses existing production palette keys so
manifest validation stays clean.

Why:
E12.4 proved the compiler could produce a hidden Anaheim draft, but the team
needed a repeatable way to inspect that draft visually without exposing Anaheim
as a playable county. This creates the screenshot gate before any future
promotion discussion.

Visual read:
The first draft is useful but not public-quality. It reads as a real bounded
candidate scene, but the object kit is too civic/blue-roof heavy and does not
yet distinguish convention, transit, stadium, downtown, and mixed-use anchors
strongly enough.

Anti-scope:
No public UI, county switcher expansion, public Anaheim route, fake playable
claim, provider-normalized claim, public-quality claim, server route change,
package/lock/env drift, Hosted Clawd, persistence, Stripe, XP/evidence, OAuth,
automation, reports, exports, cars, humans, or props.

Verification:
`node --check scripts\verify-anaheim-draft-scene.mjs` passed. `pnpm test:core`
passed with 10 files and 38 tests. `pnpm typecheck:starter` passed.
`pnpm build:starter` passed. `pnpm verify:preview:http` passed against
`http://127.0.0.1:8787/preview` with 860387 bytes and city-world markup. Direct
manifest validation for the compiled Anaheim draft scene passed with no missing
sprites, palettes, or tiles. Local
`node scripts\verify-anaheim-draft-scene.mjs` passed with screenshots written
to `C:\Users\mzwin\AppData\Local\Temp\atlas-e125-anaheim-draft-harness-local`.
Local `node scripts\verify-engine-beta-coverage.mjs` passed with screenshots
written to
`C:\Users\mzwin\AppData\Local\Temp\atlas-e125-anaheim-draft-harness-coverage-local`.
Strict `engine-beta-data` split guard passed with 45 files, 0 blockers, and 0
unknowns. Focused `git diff --check` on the E12.5 compiler/script/split/docs
files passed with only Windows CRLF warnings. Railway deployment
`744f4821-eedd-4649-9df2-526b737a4ba8` reached `SUCCESS`. Public
`node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots written
to
`C:\Users\mzwin\AppData\Local\Temp\atlas-e125-anaheim-draft-harness-public-coverage`.
Public `node scripts\verify-anaheim-draft-scene.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app/preview` with screenshots
written to
`C:\Users\mzwin\AppData\Local\Temp\atlas-e125-anaheim-draft-harness-public`.

## Entry 102

Quest:
E12.4 Anaheim Bounded Scene Compiler Spike.

What changed:
Added a non-public draft compiler path that consumes the Anaheim
source-noted place-anchor pack and produces a bounded `CityWorldScene` draft
for future screenshot review. The draft scene includes deterministic terrain,
roads, lots, buildings, places, and desktop/mobile/residential-detail cameras,
but it remains coverage-safe: `coverageTier: L1_COUNTY_SHELL`,
`playable: false`, no actors, no pins, and no selected-place state.

Why:
E12.3 proved Anaheim has source-noted anchors, but Atlas still needed a compiler
proof before any second playable district discussion. This slice proves the
scene boundary can accept Anaheim anchor data without changing the public app,
county switcher, MCP surface, or playable coverage state.

Anti-scope:
No public UI, county switcher expansion, public Anaheim route, fake playable
claim, provider-normalized claim, public-quality claim, renderer visual change,
server route change, package/lock/env drift, Hosted Clawd, persistence, Stripe,
XP/evidence, OAuth, automation, reports, exports, cars, humans, or props.

Verification:
`pnpm test:core` passed with 10 files and 38 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. `pnpm verify:preview:http` passed against
`http://127.0.0.1:8787/preview` with 860387 bytes and city-world markup.
Offline `node scripts\verify-county-index-source.mjs --offline --json-only`
passed with 58 indexed California counties, Anaheim `0602000`, Eastvale
`0621230`, and Ontario `0653896`. Local
`node scripts\verify-engine-beta-coverage.mjs` passed with screenshots written
to `C:\Users\mzwin\AppData\Local\Temp\atlas-e124-anaheim-draft-compiler-local`.
Strict `engine-beta-data` split guard passed with 44 files, 0 blockers, and 0
unknowns. Focused `git diff --check` on the E12.4 compiler/export/test/docs
files passed with only Windows CRLF warnings. Railway deployment
`17f4fe23-8330-4685-92e8-e022fe157ca4` reached `SUCCESS`. Public
`node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots written
to `C:\Users\mzwin\AppData\Local\Temp\atlas-e124-anaheim-draft-compiler-public`.

## Entry 101

Quest:
E12.3 Anaheim Source-Noted Place Anchor Pack.

What changed:
Added a validated district place-anchor pack contract and checked Anaheim
anchor fixture at `data/district_place_anchor_packs/anaheim-anchors.json`.
The pack names six source-noted anchors for future compiler work: Anaheim city
identity, Platinum Triangle, Anaheim Convention Center, ARTIC, Angel Stadium,
and Downtown Anaheim Community Center. Each anchor remains
`providerNormalized: false`, `renderableNow: false`, and `sceneEligible:
false`.

Why:
E12.2 defined the Anaheim candidate pack but still lacked concrete place
anchors. This slice adds the next readiness artifact without exposing Anaheim
as playable or adding fake scene content.

Anti-scope:
No public UI, county switcher expansion, scene compilation, renderable Anaheim
objects, Google/provider-normalized claim, public-quality claim, server route
change, package/lock/env drift, Hosted Clawd, persistence, Stripe,
XP/evidence, OAuth, automation, reports, exports, cars, humans, or props.

Verification:
`pnpm test:core` passed with 10 files and 37 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local `pnpm verify:preview:http` and
`node scripts\verify-engine-beta-coverage.mjs` passed with screenshots written
to `C:\Users\mzwin\AppData\Local\Temp\atlas-e123-anaheim-place-anchors-local`.
Strict `engine-beta-data` split guard passed with 44 files and 0 blockers.
Focused `git diff --check` on the E12.3 data/core/test/split/docs files passed
with only Windows CRLF warnings. Railway deployment
`f6cb4114-cd6e-4f14-97d8-01bf749ad858` reached `SUCCESS`. Public
`node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots written
to `C:\Users\mzwin\AppData\Local\Temp\atlas-e123-anaheim-place-anchors-public`.

## Entry 100

Quest:
E12.2 Anaheim Curated District Candidate Pack Contract.

What changed:
Added a validated district-candidate pack contract and a checked Anaheim
candidate fixture at `data/district_candidate_packs/anaheim-candidate.json`.
The pack is source-noted, Census-anchored, and explicitly non-playable:
`candidateStatus: candidate_only`, `currentCoverageTier: L1_COUNTY_SHELL`,
`targetCoverageTier: L2_CURATED_DISTRICT`, `playableNow: false`, and
`promotionBlocked: true`. Anchor requirements cover residential variety,
commerce, food/service, destination landmark, transit edge, road/lot contact,
and mobile camera density, but every anchor remains `renderableNow: false`.

Why:
E12.1 chose Anaheim as the first second-playable-district candidate. E12.2
turns that choice into a concrete source/readiness artifact without pretending
Anaheim is playable or provider-normalized.

Anti-scope:
No UI state, county switcher expansion, scene compilation, fake places,
provider-normalized claim, public-quality claim, renderer change, server route
change, package/lock/env drift, Hosted Clawd, persistence, Stripe,
XP/evidence, OAuth, automation, reports, or exports.

Verification:
`pnpm test:core` passed with 9 files and 35 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local `pnpm verify:preview:http` and
`node scripts\verify-engine-beta-coverage.mjs` passed with screenshots written
to `C:\Users\mzwin\AppData\Local\Temp\atlas-e122-anaheim-candidate-pack-local`.
Strict `engine-beta-data` split guard passed with 41 files and 0 blockers.
Focused `git diff --check` on the E12.2 data/core/test/split/docs files passed
with only Windows CRLF warnings. Railway deployment
`76094157-a95b-4486-b104-9b622ab1f098` reached `SUCCESS`. Public
`node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots written
to `C:\Users\mzwin\AppData\Local\Temp\atlas-e122-anaheim-candidate-pack-public`.

## Entry 099

Quest:
E12.1 California District Candidate Pack.

What changed:
Added a typed California second-district candidate pack in the world contract
layer. The pack names two Census-anchored, non-playable L2 candidates:
Anaheim in Orange County and Ontario in San Bernardino County. Anaheim is the
first recommended second playable district candidate because it stresses dense
suburban commerce, residential variety, destination/landmark read, parking-lot
grammar without cars, and mobile camera density. Ontario remains the follow-up
inland/logistics-suburb candidate.

Why:
Engine Beta needs to generalize beyond Eastvale, but a second playable district
should start from a clear readiness contract rather than fake coverage. This
slice defines what the next curated district must prove while keeping every
candidate at `L1_COUNTY_SHELL` with zero places and zero scenes.

Anti-scope:
No UI expansion, renderer changes, fake places, new playable coverage,
provider-normalized claims, server route changes, package/lock/env drift,
Hosted Clawd, persistence, Stripe, XP/evidence, OAuth, automation, reports, or
exports.

Verification:
`pnpm test:core` passed with 8 files and 33 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local `pnpm verify:preview:http`, offline
`node scripts\verify-county-index-source.mjs --json-only`, strict
`engine-beta-data` split guard, and local
`node scripts\verify-engine-beta-coverage.mjs` passed. Railway deployment
`2ee2403a-630f-4328-9716-943ecdaec588` reached `SUCCESS`. Public
`node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots written
to `C:\Users\mzwin\AppData\Local\Temp\atlas-e121-candidate-pack-public`.

## Entry 098

Quest:
E11.7 Residential Object Art Upgrade.

What changed:
Improved the existing production residential kit without adding new product
state or object categories. Primitive cottages, ranch homes, and lowrise
apartments now get stronger foundation/contact treatment, roof lips/insets,
structural porch/stoop details, face-attached windows, entry depth, and quieter
apartment roof/entry massing. The existing rowhome SVG source also gained
subtle roof/base material facets so sprite-backed rowhomes sit better beside
the primitive house families.

Why:
After E11.5, the strongest remaining visual trust leak was still repeated
residential object art. This pass strengthens the common house/apartment read
before expanding to more California districts.

Anti-scope:
No new modules, fake places, cars, humans, decorative props, product panels,
county/data contract changes, server routes, package/lock/env drift, Hosted
Clawd, persistence, Stripe, XP/evidence, OAuth, automation, reports, exports, or
broad renderer rewrite.

Verification:
`pnpm test:core`, `pnpm typecheck:starter`, `pnpm build:starter`, local
`pnpm verify:preview:http`, and local
`node scripts\verify-engine-beta-coverage.mjs` passed with Riverside,
residential-detail, Orange shell, unsupported, and county-switcher screenshots
written to
`C:\Users\mzwin\AppData\Local\Temp\atlas-e117-residential-object-art-local`.

## Entry 097

Quest:
E11.5 Big 4 artifact integration and Railway deploy.

What changed:
Integrated the E11.5 product-surface tightening and landmark/parcel renderer
artifacts into the Engine Beta RC, then deployed them to Railway production.
The public app now has shorter Shell/L0 coverage-tray copy plus the stronger
Eastvale Core and Neighborhood Blocks parcel read from Entry 096.

Verification:
Local `pnpm test:core`, `pnpm typecheck:starter`, `pnpm build:starter`,
`pnpm verify:preview:http`, strict `engine-beta-data` split guard, and
`node scripts\verify-engine-beta-coverage.mjs` all passed. Railway deployment
`e083338f-b916-4d22-872b-897fe3426c59` reached `SUCCESS`. Public
`node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with Riverside,
residential-detail, Orange shell, unsupported, and county-switcher screenshots.

Anti-scope:
No Hosted Clawd, persistence, Stripe, XP/evidence, OAuth, automation, reports,
exports, DB, package/lock/env drift, fake places, cars, humans, decorative
props, dashboard, or new product state.

## Entry 096

Quest:
E11.5 Landmark / Parcel Read.

What changed:
Tightened the production renderer around the playable Eastvale core. Home lots
now get small per-parcel pad variation, yard facets, walks, and lot seams so
Neighborhood Blocks read less like repeated houses on a flat grid. Civic lots
now get a clearer forecourt axis, landing, and side terraces. Eastvale Core
itself gets more grounded landmark grammar: roof shadow/ridge, plinth, entry
canopy, and subtle facade rhythm.

Why:
After E11.4, the broad green field and weak selected landmark grounding were
the main first-3-second trust leaks. This pass keeps the world map-first while
making the selected civic landmark and adjacent parcels feel more authored.

Anti-scope:
No cars, humans, filler props, fake places, product panels, new product state,
server/world data contract changes, package/lock/env, Hosted Clawd,
persistence, Stripe, XP/evidence, OAuth, automation, reports, exports, or broad
renderer rewrite.

Verification:
`pnpm test:core` passed with 8 files and 32 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local
`ATLAS_PREVIEW_URL=http://127.0.0.1:8787/preview pnpm verify:preview:http`
passed. Local
`ATLAS_ENGINE_BETA_COVERAGE_SCREENSHOTS=C:\Users\mzwin\AppData\Local\Temp\atlas-e115-landmark-parcel-read-local
node scripts\verify-engine-beta-coverage.mjs --url http://127.0.0.1:8787`
passed with Riverside, residential-detail, Orange shell, unsupported, and
county-switcher desktop/mobile screenshots. `git diff --check` on the touched
renderer/docs paths passed with only Windows CRLF warnings.

## Entry 095

Quest:
E11.5 Product Surface Tightening.

What changed:
Tightened the shell/unsupported coverage tray copy so low-tier county states
read as product states instead of verifier output. The tray now uses `Shell
state` / `L0 state` as the small state label, shortens the no-live-data
boundary, and changes the source guidance to `Playable now:
Riverside/Eastvale.` The shell widget verifier was updated to protect the
shorter boundary copy without requiring the old long sentence.

Why:
The county switcher and recovery path were already functional, but the coverage
tray still exposed raw tier language too prominently. This keeps the same
behavior and state model while making Playable / Shell / L0 feel more
intentional and map-native.

Anti-scope:
No dashboard, county directory, fake places, new product state, server/data
contract change, persistence, Hosted Clawd, Stripe, XP/evidence product feature,
OAuth, automation, reports, exports, package/lock/env, renderer art tunnel,
cars, humans, or props.

Verification:
`pnpm typecheck:starter` passed. `pnpm build:starter` passed. Local
`node scripts\verify-engine-beta-coverage.mjs` passed with screenshots written
to `C:\Users\mzwin\AppData\Local\Temp\atlas-e115-product-surface-tightening-local`.
Focused screenshot review confirmed Riverside remains unchanged, Orange/L0 keep
the recovery CTA visible in the first mobile viewport, and shell/unsupported
states no longer expose raw tier labels as the primary read.

## Entry 094

Quest:
E10.7 County Switcher Product Proof and coverage directory.

What changed:
Added a compact, map-native county switcher to the production widget with three
honest states: `Riverside / Playable`, `Orange / Shell`, and `Unsupported / L0`.
Users can intentionally switch from the playable Riverside map to an indexed
Orange shell, then to an unsupported county state, then back to Riverside
without fake places, fake local scenes, selected-place tools, sticker tools,
note input, saved state, XP, evidence, payment, automation, reports, exports,
or Hosted Clawd UX appearing in shell states.

Added `/api/world/us/coverage` as a coverage-directory contract for USA-scale
readiness. It reports the current Engine Beta boundary: 58 indexed California
counties, 57 shell counties, 1 playable county, zero provider-normalized
counties, zero public-quality counties, and Riverside as the suggested playable
proof slice. Added core tests for this summary.

Verification:
`pnpm test:core` passed with 29 tests. `pnpm typecheck:starter` passed.
`pnpm build:starter` passed. Local `node scripts\verify-engine-beta-coverage.mjs`
passed with coverage directory, preview/MCP/submission, Riverside product loop,
Orange shell widget, unsupported widget, and the new county switcher verifier.
Strict split guard passed in `engine-beta-data` mode with 34 files and 0
blockers.

Deployment:
Railway production deployment `1bd6bd10-40b6-49d9-b33f-5954829bc671`
succeeded for service `atlas-backend` in environment `production` with message
`E10 county switcher product proof`.

Public verification:
Public `node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app`. Public matrix covered
coverage directory, California count `58`, Riverside `L2_CURATED_DISTRICT`,
Orange `L1_COUNTY_SHELL`, unknown `L0_UNSUPPORTED`, preview/MCP/submission,
Riverside product loop, Orange shell widget, unsupported widget, and desktop/
mobile switcher clicks through Riverside -> Orange -> unsupported -> Riverside.

Public screenshot evidence:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e107-county-switcher-public-final\riverside\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e107-county-switcher-public-final\riverside\alpha-product-loop-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e107-county-switcher-public-final\county-switcher\county-switcher-riverside-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e107-county-switcher-public-final\county-switcher\county-switcher-orange-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e107-county-switcher-public-final\county-switcher\county-switcher-unsupported-mobile-390x844.png`

Product verdict:
Mira passed E10.7 for deploy discussion before public rollout. Her P1 note was
copy polish only; no P0 product-surface blocker remained.

Next:
Move to the next Engine Beta production slice. If product QA leads, tighten the
county switcher copy without changing behavior. If engine quality leads, start
Engine Beta 2B road/lot/terrain contact grammar with Lumen's screenshot gate.
If data/API leads, continue coverage readiness without fake county content or
provider-readiness claims.

## Entry 093

Quest:
E10.6.1 mobile recovery CTA visibility fix.

What changed:
Moved the shell/unsupported coverage recovery action above the source note and
compressed the mobile coverage tray so `Open Riverside/Eastvale playable Alpha`
is visible in the first `390x844` viewport. The shell verifier now checks that
the recovery CTA is actually visible inside the tray viewport, not just present
in the DOM.

Why:
Mira blocked the first E10 public deploy from product-readiness because Orange
and unsupported mobile screenshots were honest but still effectively dead-end
states: the recovery action was below the first mobile viewport. This patch
keeps the same content and state model while making the recovery path visible.

Verification:
`pnpm test:core`, `pnpm typecheck:starter`, `pnpm build:starter`, and local
`node scripts\verify-engine-beta-coverage.mjs` passed. Local screenshot proof:
`C:\Users\mzwin\AppData\Local\Temp\atlas-e1061-mobile-recovery-local`.

Deployment:
Railway production deployment `a13a0e09-88d7-4540-aca0-659e65cf6f2a`
succeeded for service `atlas-backend` in environment `production` with message
`E10 mobile recovery CTA visibility`.

Public verification:
Public `node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with California count
`58`, Riverside `L2_CURATED_DISTRICT`, Orange `L1_COUNTY_SHELL`, unknown
`L0_UNSUPPORTED`, preview/MCP/submission green, Riverside product loop green,
Orange shell widget green, unsupported widget green, and mobile CTA visibility
asserted.

Public screenshot evidence:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1061-mobile-recovery-public\riverside\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1061-mobile-recovery-public\riverside\alpha-product-loop-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1061-mobile-recovery-public\orange-shell\shell-county-widget-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1061-mobile-recovery-public\orange-shell\shell-county-widget-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1061-mobile-recovery-public\unsupported\shell-county-widget-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-e1061-mobile-recovery-public\unsupported\shell-county-widget-mobile-390x844.png`

Next:
Continue with one production-moving Engine Beta slice. Best next candidate is
E10.7 coverage directory/readiness hardening or Engine Beta 2B road/lot/terrain
contact grammar, depending on Forge and Lumen's post-deploy recommendations.

## Entry 092

Quest:
E10.1-E10.6 Engine Beta California coverage, shell recovery, and public deploy.

What changed:
Deployed the Engine Beta data+shell candidate to Railway production for
`atlas-backend`. The public app now exposes the California county coverage
contract: all 58 California counties are indexed, Riverside remains the only
playable `L2_CURATED_DISTRICT`, Orange/other California counties are honest
`L1_COUNTY_SHELL` states, and unknown counties return `L0_UNSUPPORTED`.
Shell and unsupported widget states include the recovery action
`Open Riverside/Eastvale playable Alpha` and still do not show fake places,
selected-place tray controls, pins, notes, saved state, XP, evidence, payment,
automation, reports, exports, or Hosted Clawd UX.

Deployment:
Railway production deployment `40fa1630-a819-4929-b20f-70d27ebbb6a3`
succeeded for service `atlas-backend` in environment `production` with message
`Engine Beta data shell recovery E10`.

Public verification:
Production `/health` returned ok at
`https://atlas-backend-production-e6fc.up.railway.app`. Public
`node scripts\verify-engine-beta-coverage.mjs` passed with California county
count `58`, Riverside `L2_CURATED_DISTRICT`, Orange `L1_COUNTY_SHELL`, unknown
county `L0_UNSUPPORTED`, preview HTTP green, MCP green with the seven expected
tools, submission green, Riverside desktop/mobile product loop green, Orange
desktop/mobile shell widget green, and unsupported desktop/mobile widget green.

Public screenshot evidence:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-release-engine-beta-coverage-public\riverside\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-release-engine-beta-coverage-public\riverside\alpha-product-loop-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-release-engine-beta-coverage-public\orange-shell\shell-county-widget-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-release-engine-beta-coverage-public\orange-shell\shell-county-widget-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-release-engine-beta-coverage-public\unsupported\shell-county-widget-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-release-engine-beta-coverage-public\unsupported\shell-county-widget-mobile-390x844.png`

Next:
Keep E10 deployed and move to the next smallest Engine Beta production slice:
either road/lot/terrain contact grammar if Lumen flags visual quality, or
county coverage navigation copy if Mira finds shell comprehension drag in
public screenshots. Do not reopen Hosted Clawd, persistence, Stripe, XP,
evidence, OAuth, automation, reports, or exports.

## Entry 091

Quest:
Engine Beta 2A final product-readiness audit.

What changed:
Mira reviewed the final Engine Beta 2A desktop and mobile product-loop
screenshots and updated `docs/ALPHA_FUNCTIONAL_EVIDENCE_PACKET.md` with the 2A
human-approval verdict and artifact paths.

Verdict:
Engine Beta 2A is human-approval-ready from product QA. The selected-place tray,
sticker/pin count, saved session note, latest-note display, and session-only
boundary copy remain understandable on desktop and mobile after the building
grammar pass. No P0/P1 product-loop blocker was found.

Anti-scope:
No backend, persistence, Hosted Clawd UX, package/lock, Stripe, XP,
evidence-product features, OAuth, automation, reports, exports, broad UI
redesign, visual lab work, renderer port, staging, deploy, or production code
changes were performed by Mira in this pass.

Verification:
`git diff --check -- docs/ALPHA_FUNCTIONAL_EVIDENCE_PACKET.md
docs/BUILD_LOG.md docs/NEXT_QUESTS.md` passed with only Windows CRLF warnings.

## Entry 090

Quest:
Engine Beta RC product readiness and USA-scale product gate.

What changed:
Mira reviewed the Engine Beta production-upgrade desktop and mobile
product-loop screenshots, reviewed `docs/USA_PUBLIC_RELEASE_ENGINE_PLAN.md`,
and updated `docs/ALPHA_FUNCTIONAL_EVIDENCE_PACKET.md` with the product
readiness verdict.

Verdict:
Engine Beta RC is human-approval-ready from product QA. The selected-place,
sticker/pin, note-save, latest-note, and session-only loop remains
understandable on desktop and mobile. The USA plan is directionally correct
because it uses bounded county/district compilation, coverage tiers, and
unsupported-state honesty instead of a giant national canvas or fake coverage.

Anti-scope:
No backend, persistence, Hosted Clawd UX, package/lock, Stripe, XP,
evidence-product features, OAuth, automation, reports, exports, broad UI
redesign, visual lab work, renderer port, staging, deploy, or production code
changes were performed by Mira in this pass.

Verification:
`git diff --check -- docs/ALPHA_FUNCTIONAL_EVIDENCE_PACKET.md
docs/BUILD_LOG.md` passed with only Windows CRLF warnings.

## Entry 001

Quest:
Remapped Atlas prompt pack to actual engineering route.

What changed:
Created engineering docs, service stack, Google Maps adapter spec, voxel renderer spec, project loop, Codex prompts, plugin skills, issue templates, workflow placeholder, and Riverside demo county data.

Verification:
Prompt pack generated.

Next:
Run prompts/00_ENGINEERING_SETUP.md in Codex.

## Entry 002

Quest:
Run `prompts/00_ENGINEERING_SETUP.md` inside the Atlas workspace.

What changed:
Copied the engineering prompt pack into `engineering-prompt-pack/`, synced active docs, prompts, assets, data, plugin skills, GitHub issue template, and CI placeholder into the repo, and merged the engineering route into root `AGENTS.md`.

Verification:
Read `AGENTS.md`, `docs/ENGINEERING_ROUTE.md`, and verified required setup files exist with `Test-Path`.

Next:
Start Quest E1: bootstrap the TypeScript monorepo shape without product logic.

## Entry 003

Quest:
Quest E1: Bootstrap TypeScript monorepo.

What changed:
Created explicit pnpm workspace packages under `apps/` and `packages/`, added a Vite + React placeholder widget shell, added placeholder web/core/config/geo/mcp/assets packages, updated root scripts to typecheck/build the workspace skeleton, and documented the existing root `server/` and `web/` Apps SDK starter as a temporary sandbox.

Verification:
`pnpm build:workspaces` passed.

Next:
Start Quest E2: county pack schema and Riverside demo loader.

## Entry 004

Quest:
Quest E2: Build county pack schema.

What changed:
Added `packages/core/src/county` with Zod schemas, inferred types, `CountyPackService`, clear validation errors, and a package-level invariant test that validates the Riverside demo pack and confirms invalid shapes fail clearly.

Verification:
`pnpm --dir packages/core typecheck`, `pnpm test:core`, and `pnpm build:workspaces` passed.

Next:
Start Quest E3: define `VoxelScene` and build the first renderer shell.

## Entry 005

Quest:
User-directed Railway and Google Maps backend hookup.

What changed:
Added a real `@atlas/geo` adapter interface with mock and Google implementations, wired Geocoding API, Places API (New) nearby search, and Places Aggregate API compute insights, added backend geo probe endpoints, added Railway config-as-code, and documented secret handling.

Verification:
`pnpm --dir packages/geo typecheck`, `pnpm build:server`, and `pnpm build:starter` passed. A local Google-mode probe returned Eastvale geocoding, 3 nearby restaurant results, and an aggregate restaurant count. Railway deployment succeeded at `https://atlas-backend-production-e6fc.up.railway.app`; `/health`, `/api/geo/status`, `/api/geo/geocode?query=Eastvale%2C%20CA`, and `/preview` passed.

Next:
Use the Railway backend URL for ChatGPT Apps SDK testing, then continue Quest E3 renderer work.

## Entry 006

Quest:
Quest E3: Build the first VoxelScene renderer shell.

What changed:
Added the browser-safe `@atlas/core/voxel` contract and Riverside demo `VoxelScene`, built an SVG isometric county board renderer in `apps/widget`, mirrored it into the temporary root `web` Apps SDK preview, added Eastvale highlighting, route line, Clawd placeholder sprite, right scout report panel, and bottom flow rail.

Verification:
`pnpm --dir packages/core typecheck`, `pnpm --dir apps/widget typecheck`, `pnpm exec tsc -p web/tsconfig.json --noEmit`, `pnpm build:starter`, and `pnpm build:workspaces` passed. Browser verification loaded `http://localhost:8787/preview`, found no console errors, captured desktop/tablet/mobile screenshots, and confirmed selecting Gym / Plaza updates the report panel. Railway deployment `c1470133-62c0-46d0-b8f6-94680df96b5c` succeeded; public `/preview`, `/health`, `/api/geo/status`, and Eastvale geocode passed.

Next:
Start Quest E4: Scout Drop mock flow.

## Entry 007

Quest:
Quest E4: Implement Scout Drop mock flow.

What changed:
Added `@atlas/core/scout` with `ScoutDropService`, deterministic Eastvale/mobile-detailing signal scoring from the Riverside `VoxelScene`, a six-stop scout route, risks, channels, next actions, and Hosted Clawd upgrade copy. Wired `preview_scout_drop` into the Apps SDK server with concise model-visible `structuredContent` and widget-only `VoxelScene` data in `_meta`, added `/api/scout/drop` for local/Railway smoke checks, and made the widget default to the Eastvale Scout Drop flow in local preview. The `VoxelScene` report panel now renders best offer, scored signals, route stops, watch items, channels, next actions, and the manual campaign CTA.

Apps SDK notes:
The Scout Drop tool is read-only, non-destructive, uses the versioned `ui://widget/atlas-board-v2.html` resource/template, keeps API keys server-side, stores only widget-local selection state, sends host messages via request semantics, and does not claim persistence, posting, DMs, or live market research.

Verification:
`pnpm --dir packages/core typecheck`, `pnpm --dir apps/widget typecheck`, `pnpm exec tsc -p web/tsconfig.json --noEmit`, `pnpm typecheck:starter`, `pnpm build:starter`, and `pnpm --dir apps/widget build` passed. Compiled local API smoke returned `scout-riverside-ca-eastvale-mobile-detailing` with flow `done,done,active,next` and expected signals: Residential Demand 88, Fast Route Access 80, QR Flyer Opportunity 82, Property Manager Outreach 76, Partnership Target 72. The Scout Drop full widget preview is about 17.8 KB, while the model-visible structured output is about 3.7 KB after moving scene data to `_meta`. Browser verification loaded `/preview`, found no console errors, and captured desktop/tablet/mobile screenshots.

Next:
Deploy E4 to Railway, then start Quest E5: Campaign Engine preview.

## Entry 008

Quest:
E4.5: Upgrade the voxel board from SVG-only to PixiJS tactical visualization.

What changed:
Added PixiJS to the root Apps SDK preview and standalone widget, extended the `VoxelScene` contract with optional render objects, layers, camera, and Clawd mood/pulse fields, enriched the Riverside/Eastvale scene with tactical objects, and made Pixi the default map renderer with the existing SVG renderer preserved as fallback. The Apps SDK tools still keep model-visible `structuredContent` concise and place renderer-heavy scene data in `_meta`.

Verification:
`pnpm build:starter` and `pnpm build:workspaces` passed. Browser QA loaded `http://127.0.0.1:8796/preview`, verified one Pixi canvas, the Scout Drop report panel, no horizontal overflow on `390x844`, no console errors after a fresh reload, and captured desktop/mobile screenshots.

Next:
Deploy the E4.5 renderer to Railway, then start Quest E5: Campaign Engine preview.

## Entry 009

Quest:
Quest E5: Implement Campaign Engine preview.

What changed:
Added `CampaignPreviewService` in `@atlas/core` to create a manual 7-day campaign preview from an existing `ScoutPreviewState`. The preview includes route-aware priorities, QR/local group/property manager/partner/profile steps, asset placeholders, guardrails, and a campaign `VoxelScene` panel. Added the Apps SDK `preview_campaign_engine` tool plus `/api/campaign/preview`, kept full scene data in `_meta`, and made local `/preview` CTA transition from Scout Report to Campaign Preview without needing a ChatGPT host.

Apps SDK notes:
The campaign tool is read-only, non-destructive, closed-world, and requires the `scoutPreviewId` returned by `preview_scout_drop`. It does not post, DM, buy ads, persist state, or perform live campaign execution.

Verification:
`pnpm --dir packages/core typecheck`, `pnpm test:core`, `pnpm typecheck:starter`, `pnpm build:starter`, and `pnpm build:workspaces` passed. Local API smoke returned `campaign-riverside-ca-eastvale-mobile-detailing` with 7 days, 6 route priorities, 5 asset placeholders, and manual guardrails. Browser verification loaded `/preview`, clicked `Draft manual campaign`, confirmed the Campaign Preview panel, Pixi canvas, no console errors, and no mobile overflow at `390x844`.

Next:
Deploy E5 to Railway, then start Quest E6: Apps SDK/MCP tool hardening and submission readiness.

## Entry 010

Quest:
Quest E6: Apps SDK/MCP tool hardening and submission readiness.

What changed:
Removed the starter-era `draft_atlas_brief` and `render_atlas_brief` tools from the exposed MCP server, added the read-only `get_upgrade_options` tool for Hosted Clawd Alpha/Beta boundaries, aligned the tool contract docs with the actual review-facing tool surface, added `scripts/verify-mcp-flow.mjs`, wired `pnpm verify:mcp`, and generated `chatgpt-app-submission.json`.

Apps SDK notes:
The exposed Alpha tools are now `render_voxel_county`, `preview_scout_drop`, `preview_campaign_engine`, and `get_upgrade_options`. Every exposed tool has explicit `readOnlyHint`, `openWorldHint`, and `destructiveHint`, plus an `outputSchema`. Widget CSP remains narrow with no connect/resource domains because the bundle is inline and does not fetch external resources.

Verification:
`pnpm typecheck:starter` passed. `pnpm build:starter` passed. `pnpm build:workspaces` passed. `pnpm verify:mcp` passed against a temporary built server on `http://127.0.0.1:8790/mcp`, listing the four expected tools and calling `render_voxel_county`, `preview_scout_drop`, `preview_campaign_engine`, and `get_upgrade_options`. Railway deployment succeeded, and `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:mcp` passed after the public service rolled to the E6 build.

Next:
Review/upload `chatgpt-app-submission.json`, then start Quest E6.5: add a temporary Quest Preview slice without persistence or XP grants.

## Entry 011

Quest:
Quest E6.6: Voxel City World Map.

What changed:
Parked the partial Quest Preview slice from the active tool/app surface, added a scalable `VoxelWorld` model to `VoxelScene`, added session-only sticker and note helpers, expanded the Riverside demo into a county hub with an Eastvale playable district and known places, and changed the root/widget previews to open as a map-first city/world map instead of a Scout Drop report. Pixi now renders known places, sticker badges, ambient resident/traffic hints, pan/zoom, and hover/select place affordances; the SVG fallback renders a simplified place map.

Apps SDK notes:
The exposed Alpha tool surface remains `render_voxel_county`, `preview_scout_drop`, `preview_campaign_engine`, and `get_upgrade_options`. `render_voxel_county` keeps model-visible output concise with map summary counts while the full `VoxelScene` stays in `_meta`. Stickers and notes are widget-local session state only.

Verification:
`pnpm test:core`, `pnpm typecheck:starter`, and `pnpm --dir apps/widget typecheck` passed before browser QA.

Next:
Run browser QA for desktop/mobile canvas rendering, district/place selection, sticker placement, note saving, and no horizontal overflow.

## Entry 012

Quest:
E7.0 planning reset: Replace map UI with CityWorldRenderer.

What changed:
Created `docs/VOXEL_WORLD_BRAIN.md` as the authoritative renderer reset plan for a full-screen Eastvale voxel city map, created `docs/issues/E7.0-city-world-renderer.md`, and updated quest/decision docs so the next implementation pass replaces the card/panel map UI instead of polishing it.

Product notes:
The new target language is city/world map, town map, or Eastvale city slice. Do not use the rejected earlier naming. React should only provide tiny HUD overlays; Pixi owns the city world, interaction, layers, pins, labels, and ambient life.

Verification:
Docs-only pass. Verified the new brain and E7.0 issue exist and searched for remaining new-plan wording before handoff.

Next:
Implement E7.0 from `docs/VOXEL_WORLD_BRAIN.md`: full-viewport Pixi canvas, typed `CityWorldScene`, layered city renderer, small HUD overlays, and no old dashboard/card/report UI.

## Entry 013

Quest:
Quest E7.0: Replace map UI with CityWorldRenderer.

What changed:
Added the typed `CityWorldScene` contract and compiler, switched the root preview and widget to `CityWorldView`, built the full-viewport Pixi `CityWorldRenderer`, and parked the old card/panel renderer path as fallback/reference only. The default app now opens into an Eastvale city map with small HUD overlays, local stickers, local notes, drag, wheel zoom, pinch zoom, hover, place click, labels, pins, cars, walkers, water, and Clawd.

Apps SDK notes:
The MCP tool surface remains compatible. `render_voxel_county` still keeps model-visible `structuredContent` concise and sends the full `VoxelScene` in `_meta`. The widget resource URI is versioned for the city world surface, prefers no border, and requests fullscreen display mode when available.

Verification:
`pnpm test:core`, `pnpm typecheck:starter`, `pnpm --dir apps/widget typecheck`, `pnpm build:web`, `pnpm --dir apps/widget build`, and `pnpm build:server` passed. Browser QA on `http://localhost:8787/preview` verified one full-screen canvas, nonblank desktop and mobile screenshots, no old report/flow/card UI classes mounted, no visible campaign/report/signal/risk/tactical/board language, drag camera movement, wheel and pinch zoom, clicks on Eastvale Core, Gym, Community Park, and Apartments, sticker drop, and no mobile horizontal overflow.

Next:
Start Quest E7.1: visual quality loop. Keep the full-screen map shape, improve code-generated voxel art, and add atlas-ready metadata without adding a new UI shell or dependencies.

## Entry 014

Quest:
Quest E7.1: Visual Quality Loop.

What changed:
Added atlas-ready metadata to `CityWorldScene` render objects, including terrain, roads, lots, buildings, props, actors, and pins. Enriched the Eastvale authored scene with denser props, shrubs, benches, parked cars, extra water shimmer, additional streetlights, and more cars/walkers. Reworked the Pixi renderer with stronger terrain variation, road curbs/lane details/crosswalks, lot details, category-specific building art, richer props, clearer cars/walkers, sorted prop/actor depth, and proper destruction of old Pixi children during redraw. Kept the default UI as a full-screen city map with only small React HUD overlays.

Apps SDK notes:
The MCP tool surface and payload boundary stayed compatible. `render_voxel_county` still returns concise `structuredContent` and full scene data in `_meta`; no raw Google payload reaches the renderer. No persistence, auth, Stripe, campaign flow, Three.js, Lottie map objects, or new dependencies were added.

Verification:
`pnpm test:core`, `pnpm typecheck:starter`, `pnpm --dir apps/widget typecheck`, `pnpm build:web`, `pnpm --dir apps/widget build`, and `pnpm build:server` passed. Browser QA loaded `http://localhost:8787/preview`, verified one full-screen Pixi canvas, no old report/flow/stage/map-frame/legend UI mounted, no visible campaign/report/signal/risk/tactical/board/dashboard language, clean console after adding the favicon route, desktop and mobile no horizontal overflow, nonblank dense city screenshots, drag movement, wheel zoom, synthetic pinch zoom, Gym/Park/Apartments place clicks, sticker drop, and note save.

Next:
Start Quest E7.2: sprite atlas readiness. Keep the current map-first experience and introduce real atlas manifest validation plus a small production-art slice with code-generated fallback.

## Entry 015

Quest:
USA-scale engine direction lock.

What changed:
Added `docs/USA_ENGINE_ARCHITECTURE.md` to make the V1 national engine target explicit, created `docs/issues/E8.0-usa-engine-api-foundation.md`, and updated product, engineering, service stack, Google adapter, next quest, and decision docs. The durable direction is that Atlas should scale through backend world contracts and provider adapters, while the renderer consumes bounded `CityWorldScene` slices for the current playable county or district.

Tooling notes:
The current required MCP server remains the Atlas Apps SDK MCP server. Additional MCP servers/connectors should be added only when there is a concrete bottleneck: OpenAI Developers for submission/API-key flows, Railway deploy/log/env tooling if available, database MCP once Hosted Clawd storage is selected, and GitHub MCP when remote issue/PR workflow becomes useful.

Verification:
Docs-only pass. Read the active product/engineering/service docs before editing.

Next:
After E7.2 sprite atlas readiness, start E8.0 USA Engine API Foundation: normalized world identity, API contracts, provider-independent place categories, cache/TTL/source policy, and Google adapter expansion behind `GeoDataAdapter`.

## Entry 016

Quest:
E8.0 USA Engine API Foundation scaffold.

What changed:
Added `@atlas/core/world` contracts for US country, state, county, district, and place identity, plus cache/source-note policy. Added `NationalWorldService` backed by the current curated Riverside `VoxelScene`. Exposed read-only server routes for `/api/world/us/states`, `/api/world/us/states/:stateCode/counties`, `/api/world/counties/:countySlug`, and `/api/world/counties/:countySlug/districts/:districtSlug`.

Product notes:
This does not render the USA, add a dashboard, or call new provider APIs. It gives the server a clean contract for progressively loading US geography while the frontend continues consuming bounded `CityWorldScene` slices.

Verification:
`pnpm test:core`, `pnpm --dir packages/core typecheck`, `pnpm typecheck:starter`, and `pnpm build:server` passed before route smoke checks.

Next:
Smoke the new world API routes locally, then expand E8.0 later with provider-independent category mapping and Google-backed county/district lookup behind `GeoDataAdapter`.

## Entry 017

Quest:
Atlas brain refresh after E8.0.

What changed:
Added `docs/brain/USA_ENGINE_THINKING.md` and updated the brain index so future map/engine passes start from the combined product and service direction. Created `docs/issues/E8.1-provider-category-map-and-county-lookup.md` as the next backend-scale issue, and updated the USA architecture and next-quest docs to treat E8.0 as complete locally rather than upcoming.

Product notes:
The next best move is E8.1 if the priority is V1 USA coverage and backend scale. E7.2 remains the visual-quality lane when the next priority is sprite/atlas fidelity. Neither path should bring back the old dashboard/card/campaign framing.

Verification:
`git diff --check` passed for the updated brain, issue, architecture, next-quest, and build-log docs. `pnpm test:core` passed with 5 test files and 14 tests.

Next:
Implement E8.1 when the next execution loop starts.

## Entry 018

Quest:
E8.1 Provider Category Map + County Lookup Adapter.

What changed:
Added provider-independent world place categories, lookup-safe world response types, and `NationalWorldService.lookupPlaces`. Added geo-side provider type normalization so Google/mock nearby place data becomes Atlas-owned categories before reaching world contracts. Added the read-only `GET /api/world/lookup?query=Eastvale%2C%20CA&radiusMeters=3500` route, which returns a resolved location summary, normalized place summaries, cache policy, and source notes.

Product notes:
This is a backend scale slice only. It does not compile live provider places into a city scene, change the full-screen Pixi map, add persistence, or expose provider payloads to React/Pixi.

Verification:
`pnpm test:core`, `pnpm --dir packages/geo typecheck`, `pnpm --dir packages/core typecheck`, `pnpm typecheck:starter`, `pnpm build:server`, and `pnpm --dir packages/core exec vitest run --root ../.. packages/geo/test/place-category-normalizer.test.ts` passed. Local smoke on port 8791 passed for `/api/world/us/states`, `/api/world/us/states/CA/counties`, `/api/world/counties/riverside-ca`, `/api/world/counties/riverside-ca/districts/eastvale-city-slice`, and `/api/world/lookup?query=Eastvale%2C%20CA&radiusMeters=3500`. The lookup route ran in Google mode, returned 20 normalized place summaries, and exposed no raw `primaryType`, `types`, or `placeId` fields in place summaries.

Railway:
Deployment `60d657f2-9117-4c46-9473-884497dd2245` succeeded. Public smoke passed for `/health`, `/api/geo/status`, `/api/geo/geocode?query=Eastvale%2C%20CA`, the E8.0 world routes, and `/api/world/lookup?query=Eastvale%2C%20CA&radiusMeters=3500`. Railway reported Google mode configured/live. Public lookup returned 20 normalized place summaries with categories fitness, food/drink, landmark, park, school, service, and shop, with no raw provider fields in place summaries.

Next:
Start E8.2 world lookup caching and provider query policy, or return to E7.2 sprite atlas readiness if the next priority is visual quality.

## Entry 019

Quest:
E8.2 Apps SDK World Lookup Tool.

What changed:
Exposed the E8.1 lookup flow as the `lookup_world_places` MCP tool. The tool resolves a location, calls the same normalized world lookup helper as `/api/world/lookup`, and returns `worldPlaceLookup` structured content. It is read-only, destructive false, and correctly marked `openWorldHint: true` because it can call Google Maps Platform. Updated MCP instructions, tool docs, the verifier, and `chatgpt-app-submission.json`.

Product notes:
This makes the live provider-normalized place lookup available inside ChatGPT without changing the map UI or compiling live places into a city scene. The tool returns normalized Atlas categories and source notes, not raw provider fields.

Verification:
`chatgpt-app-submission.json` parsed successfully. `pnpm build:server` and `pnpm typecheck:starter` passed. Local `ATLAS_MCP_URL=http://127.0.0.1:8792/mcp pnpm verify:mcp` passed with tools `get_upgrade_options`, `lookup_world_places`, `preview_campaign_engine`, `preview_scout_drop`, and `render_voxel_county`; the lookup call returned 20 places. Local HTTP smoke for `/api/world/lookup?query=Eastvale%2C%20CA&radiusMeters=3500` still returned Google mode, 20 normalized places, and no raw provider fields.

Railway:
Deployment `e082c53d-7d7c-42ac-ba52-28dfaa2fa1dc` succeeded. Public `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:mcp` passed with all five tools, including `lookup_world_places`, and the lookup call returned 20 places. Public HTTP lookup still returned Google mode, 20 normalized places, categories fitness, food/drink, landmark, park, school, service, and shop, with no raw provider fields.

Next:
Start E8.3 provider query policy/caching or return to E7.2 sprite atlas readiness if the next priority is visual quality.

## Entry 020

Quest:
E8.3 World Lookup Cache + Query Policy.

What changed:
Added a bounded in-memory cache for successful world lookup responses, keyed by normalized query, radius, and adapter mode. Lookup responses now include runtime cache metadata: `cacheHit`, `cachedAt`, and `expiresAt`. The MCP verifier now calls `lookup_world_places` twice and expects the second identical call to hit cache.

Product notes:
This is a quality and quota-safety pass for the ChatGPT app tool. The cache is per server process and not user persistence. It does not alter the map renderer, save places, or expose provider payloads.

Verification:
`pnpm test:core`, `pnpm build:server`, and `pnpm typecheck:starter` passed. Local `ATLAS_MCP_URL=http://127.0.0.1:8793/mcp pnpm verify:mcp` passed with `cachedLookup: true`, proving the second identical `lookup_world_places` call hit cache. Local HTTP `/api/world/lookup?query=Eastvale%2C%20CA&radiusMeters=3500` exposed runtime cache metadata.

Railway:
Deployment `0838e7a3-797f-45f5-a223-3858c978d880` succeeded. Public `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:mcp` passed with `cachedLookup: true`. Public HTTP `/api/world/lookup?query=Eastvale%2C%20CA&radiusMeters=3500` returned Google mode, 20 places, and runtime cache metadata.

Next:
Continue with either E8.4 app submission polish or E7.2 sprite atlas readiness.

## Entry 021

Quest:
E8.4 ChatGPT App Review Polish + QA Harness.

What changed:
Added `verify:submission` for review-facing MCP/submission validation and `verify:preview:http` for served preview delivery checks. Refreshed `chatgpt-app-submission.json` to state the map-first product shape, session-only state, live lookup boundaries, and no scraping/saving/outreach limits. Added `docs/REVIEW_READINESS.md` and `docs/issues/E8.4-chatgpt-app-review-polish.md`.

Product notes:
This is a review readiness pass. It does not add tools, persistence, account creation, campaign execution, or renderer redesign.

Verification:
Local checks passed: submission JSON parse, `pnpm test:core`, `pnpm --dir packages/geo typecheck`, `pnpm --dir packages/core typecheck`, `pnpm typecheck:starter`, `pnpm build:server`, `pnpm build:web`, and `pnpm --dir apps/widget typecheck`. Local server on port 8795 passed `pnpm verify:mcp`, `pnpm verify:submission`, and `pnpm verify:preview:http`.

Browser QA:
In-app browser QA loaded `http://127.0.0.1:8795/preview`. Desktop showed one full-screen Pixi canvas, no framework overlay, no console warnings/errors, no visible banned old language, and a dense city map. Interaction checks passed for drag, wheel zoom, place click, sticker drop, and note save. Mobile viewport `390x844` showed one canvas, no horizontal overflow, no banned old language, no console warnings/errors, and a nonblank city map screenshot.

Railway:
Deployment `4f1a9c0f-1af6-4d71-9bfd-b0a926799142` succeeded. Public `/health` returned ok, `/api/geo/status` reported Google mode configured/live, `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:mcp` passed, `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:submission` passed, and `ATLAS_PREVIEW_URL=https://atlas-backend-production-e6fc.up.railway.app/preview pnpm verify:preview:http` passed.

Public browser QA:
In-app browser QA loaded `https://atlas-backend-production-e6fc.up.railway.app/preview`. Desktop showed one full-screen Pixi canvas, no framework overlay, no console warnings/errors, no visible banned old language, and a dense city map. Public interactions passed for drag, wheel zoom, place selection, sticker drop, and note save. Mobile viewport `390x844` showed one canvas, no horizontal overflow, no banned old language, no console warnings/errors, and a nonblank city map screenshot.

Next:
E8.4 is review-ready. Continue with E7.2 sprite atlas readiness if the next priority is visual quality, or E8.5 only if app review feedback identifies another submission blocker.

## Entry 022

Quest:
E7.2 Sprite Atlas Readiness planning and brain expansion.

What changed:
Added `docs/brain/SPRITE_ATLAS_READINESS.md` and `docs/issues/E7.2-sprite-atlas-readiness.md`. Updated the project brain index, voxel world brain, and next quest list so the next visual implementation loop is exact instead of vague.

Product notes:
The next map-quality pass should keep the same full-screen ChatGPT app experience: Pixi owns the city map, React stays as tiny HUD, and old dashboard/report/campaign framing stays out. E7.2 should not chase a new UI shell. It should make the current city map ready for real art by introducing a typed atlas manifest, validation, a renderer resolver, and primitive fallback.

Implementation target:
Add `CityWorldAtlasManifest`, validation helpers, `packages/assets/city-world/atlas.manifest.json`, a web/widget atlas resolver, and renderer adoption for buildings, props, actors, and markers. Include at least one visible quality improvement while keeping missing textures from blanking the map.

Next:
Implement E7.2 in the order documented in `docs/issues/E7.2-sprite-atlas-readiness.md`.

## Entry 023

Quest:
First real Atlas ChatGPT demo slice.

What changed:
Added a typed `VoxelScene` compiler that turns the curated Riverside county pack into a widget-ready scene and highlights Eastvale. Added the `select_county` MCP tool as the ChatGPT county entrypoint, kept the full scene in `_meta.scene`, and moved `render_voxel_county` onto the same compiler path. Updated submission and MCP verifiers so `select_county` is required and proves the compiled scene includes Eastvale from the curated pack.

Product notes:
This replaces the old brief-sandbox entry shape with a real county-selection slice. It does not call Google Maps, ingest live counties, save state, add auth, add Stripe, build Three.js, or expose raw provider payloads to the widget.

Verification:
`pnpm --dir packages/core test`, `pnpm --dir packages/core typecheck`, `pnpm build:server`, local `pnpm verify:mcp` against a temporary server on port 8797, `pnpm exec tsc -p packages/mcp/tsconfig.json --noEmit`, and `node -e "JSON.parse(require('fs').readFileSync('chatgpt-app-submission.json','utf8')); console.log('submission json ok')"` passed.

Next:
Run the focused MCP verification command against a local server, then continue with the next map-quality or ChatGPT-review slice.

## Entry 024

Quest:
E7.2 Sprite Atlas Readiness implementation and E7.3 browser QA hardening.

What changed:
Saved durable continuation prompts in `docs/agent-prompts/ATLAS_EXECUTION_PROMPTS.md` and created follow-up issue lanes for E7.3 browser QA, E7.4 real sprite proof, E8.5 tool-surface hardening, and E8.6 county questions. Verified the existing E7.2 atlas resolver implementation: core manifest types and validators, city-world asset manifest, asset README, scene key validation tests, web/widget resolver exports, and renderer adoption for buildings, props, actors, and pins. Fixed the city-world tray so sticker counts stay separate from note pins and saved note text is visible after note save.

Product notes:
The visible app remains the full-screen Riverside/Eastvale city map. React stays as HUD only, Pixi owns map rendering, and provider payloads still do not reach Pixi, React, `VoxelScene`, or `CityWorldScene`.

Verification:
`pnpm --dir packages/core test`, `pnpm typecheck:starter`, `pnpm --dir apps/widget typecheck`, `pnpm build:web`, `pnpm --dir apps/widget build`, `pnpm build:server`, and `pnpm verify:preview:http` against `http://127.0.0.1:8799/preview` passed. Browser QA with local Chrome against `http://127.0.0.1:8800/preview` passed: desktop and mobile each had one full-screen canvas, no horizontal overflow, no visible banned old language, and clean console. Interaction QA passed after the tray fix: sticker drop changed `1 stickers` to `2 stickers`, note save changed `0 notes` to `1 notes`, and the latest note showed `QA note`. Temporary QA server was stopped and temp files were removed.

Next:
Start E7.4 Real Sprite Proof if the next priority is visual fidelity, or E8.5 ChatGPT Tool Surface Hardening only if review feedback creates a blocker.

## Entry 026

Quest:
E7.4 Real Sprite Proof.

What changed:
Added the first real city-world texture asset at `packages/assets/city-world/textures/pin-sticker-favorite.svg`. Added frame, anchor, and scale metadata for `pin.sticker.favorite` in the atlas manifest. Updated the web build to inline SVG files as data URLs, added a typed SVG module declaration, and extended the city-world resolver with `loadCityWorldAtlasTextures`. The renderer now loads the favorite sticker pin through Pixi `Assets.load`, passes loaded textures into the atlas resolver, and renders sprite mode for the favorite pin while preserving primitive fallback for every missing texture and during loading.

Product notes:
This is intentionally a one-sprite proof. It does not create a full art pipeline, replace the whole map, add a new resource domain, or change the map-first product shape.

Verification:
`pnpm --dir packages/core test`, `pnpm typecheck:starter`, `pnpm build:web`, `pnpm --dir apps/widget typecheck`, `pnpm --dir apps/widget build`, `pnpm build:server`, and `pnpm verify:preview:http` against `http://127.0.0.1:8801/preview` passed. Browser QA with local Chrome against `http://127.0.0.1:8801/preview` passed: one full-screen canvas, no horizontal overflow, no visible banned old language, favorite SVG bundled in the served widget, sticker drop worked, and console was clean after moving texture loading to `Assets.load`. Temporary server was stopped and temp files were removed.

Next:
Start E8.6 County Question Slice unless app review feedback creates an E8.5 tool-surface blocker first.

## Entry 025

Quest:
Parallel Codex execution setup.

What changed:
Added a reusable Parallel Codex Operating Model to `docs/agent-prompts/ATLAS_EXECUTION_PROMPTS.md`. It defines the maximum useful split as two code-writing worktrees plus one integration/QA thread, with clear ownership for the visual lane, tool/backend lane, and integration captain. Updated `docs/NEXT_QUESTS.md` so future agents see the recommended split before starting new work.

Product notes:
The speedup path is not more generic parallel work. Atlas should move through small, owned slices: E8.6 as the primary county-question/tool lane, E8.5 only if review hardening is blocked, and a separate integration/QA pass. E7.4 is already complete locally, so the visual lane should stay idle until a fresh visual issue exists. No app code, renderer behavior, MCP contracts, provider access, auth, Stripe, persistence, or UI shell changes were made.

Verification:
Docs-only pass. Focused verification command passed after edits:
`pnpm --dir packages/core test` with 7 test files and 21 tests passing.

Next:
Finish or intentionally park any active dirty renderer slice, then create worker worktrees only from the clean integration state.

## Entry 027

Quest:
E8.6 County Question Slice plus production evolution gates.

What changed:
Added `CountyQuestionService` in `@atlas/core` and exposed `ask_county_question` through the Apps SDK MCP server. The tool answers closed-world Riverside/Eastvale questions from curated Alpha pack facts only, including why Eastvale is the first slice and which curated signals support mobile detailing. Unsupported counties and unsupported business claims are narrowed or refused. Updated MCP/submission verifiers, package status, review docs, tool contracts, submission JSON, and active tool lists for the new seven-tool surface.

Production gates:
Added `docs/PRODUCTION_EVOLUTION_GATES.md` and linked it from the project loop, brain index, execution prompts, next quests, and decisions. Future substantial slices must name current maturity level, target maturity level, human approval gate, what becomes more real, and what remains mock, curated, temporary, or session-only. Human approval gates are explicit for public claims, live-provider expansion, persistence, money, and automation.

Maturity:
E8.6 promotes basic county/business questions from missing product capability to M1 Curated Alpha. It does not promote to live market truth, persistence, paid behavior, or automation.

Verification:
`pnpm --dir packages/core test` passed with 8 test files and 24 tests. `pnpm --dir packages/core typecheck`, `pnpm exec tsc -p packages/mcp/tsconfig.json --noEmit`, `node -e "JSON.parse(require('fs').readFileSync('chatgpt-app-submission.json','utf8')); console.log('submission json ok')"`, and `pnpm build:server` passed. Local `ATLAS_MCP_URL=http://127.0.0.1:8802/mcp pnpm verify:mcp` passed with `ask_county_question`, `countyQuestionTopic: "business_signals"`, and `unsupportedCountyQuestion: false`. Local `ATLAS_MCP_URL=http://127.0.0.1:8802/mcp pnpm verify:submission` passed with the same seven-tool surface. Temporary server on port 8802 was stopped and temp files were removed.

Next:
Run integration/public QA for the E8.6 tool surface and deploy when ready. After that, start E9 Hosted Clawd Beta contracts only; do not implement persistence, Stripe, evidence, or XP before the approval gate.

## Entry 028

Quest:
E8.6 integration/public QA, Railway deploy, and E9 Hosted Clawd contracts.

What changed:
Ignored local `.codex/` QA screenshots so they do not keep polluting `git status`. Expanded Hosted Clawd Beta contracts in `docs/DATABASE_SCHEMA_BETA.md`, rewrote `docs/PRICING_MODEL.md` with Alpha/Beta payment boundaries, added `docs/issues/E9.0-hosted-clawd-beta-contracts.md`, and tightened future Hosted Clawd tool contracts in `docs/TOOL_CONTRACTS.md`. No persistence, auth, Stripe, evidence, XP, or automation code was added.

Local integration:
`pnpm typecheck:starter` passed. `pnpm build:starter` passed. Local server on port 8803 passed `pnpm verify:mcp`, `pnpm verify:submission`, and `pnpm verify:preview:http`. Local gstack browser QA loaded `http://127.0.0.1:8803/preview`, showed the Riverside/Eastvale map controls and selected-place tray, and `/preview` returned 200.

Railway:
`railway up --detach --service atlas-backend --environment production --message "E8.6 county question tool and E9 contracts"` succeeded. Deployment log id: `a16b8118-579d-495d-94e3-68530cae1214`.

Public verification:
Public `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:mcp` passed after rollout attempt 3 with the seven-tool surface: `ask_county_question`, `get_upgrade_options`, `lookup_world_places`, `preview_campaign_engine`, `preview_scout_drop`, `render_voxel_county`, and `select_county`. Public `pnpm verify:submission` passed with `countyQuestionTopic: "business_signals"` and `unsupportedCountyQuestion: false`. Public `pnpm verify:preview:http` passed for `https://atlas-backend-production-e6fc.up.railway.app/preview` with 806196 bytes and city-world markup.

Public browser QA:
gstack browser loaded the public preview with HTTP 200, showed the Riverside/Eastvale map controls and selected-place tray, had no console errors after a fresh console clear/reload, and sticker interaction changed the tray from `1 stickers` to `2 stickers`.

Maturity:
E8.6 is deployed as M1 Curated Alpha. E9.0 is contracts-only and remains behind `HUMAN_APPROVAL_BEFORE_PERSISTENCE` and `HUMAN_APPROVAL_BEFORE_MONEY`.

Next:
Human approval is required before implementing Hosted Clawd persistence, Stripe, evidence, or XP. The next safe code lane is either a small review polish fix if app review finds one, or a docs/design pass for Hosted Clawd onboarding copy without checkout.

## Entry 029

Quest:
E9.0A Stripe Billing Plan for Hosted Clawd.

What changed:
Added `docs/STRIPE_BILLING_PLAN.md` and updated pricing, Beta schema, tool
contracts, E9 issue docs, next quests, and decisions so Stripe is part of the
Hosted Clawd execution plan. The plan uses Stripe Billing, Stripe-hosted
Checkout Sessions in subscription mode, recurring Prices, Customer Portal, and
webhook-synced access.

Stripe:
Verified the connected Stripe account for planning as `acct_1RTDWJKHzChTixtj`
with display name `ColdCopy`. No Stripe Products, Prices, Checkout Sessions,
Customer Portal Sessions, customers, webhooks, or payment flows were created.

Maturity:
Docs-only M1/M3 planning. `HUMAN_APPROVAL_BEFORE_MONEY` and
`HUMAN_APPROVAL_BEFORE_PERSISTENCE` still block implementation.

Verification:
`pnpm --dir packages/core test` passed with 8 test files and 24 tests.
`git diff --check` passed with only Windows LF-to-CRLF warnings.

Next:
Keep E9.1 blocked until the human gates approve storage, auth, and Stripe
implementation.

## Entry 030

Quest:
E9.1 Hosted Clawd approval prep and E9.2 onboarding spec.

What changed:
Added `docs/HOSTED_CLAWD_APPROVAL_PACKET.md` and
`docs/HOSTED_CLAWD_ONBOARDING_SPEC.md`, plus issue docs for E9.1 and E9.2.
Updated `docs/NEXT_QUESTS.md` with the priority chain from approval prep to
onboarding, public QA, visual polish, persistence, and then Stripe. Added a
durable decision that persistence comes before paid checkout. Added future
Hosted Clawd failure shapes to `docs/TOOL_CONTRACTS.md` for unauthenticated,
persistence-disabled, inactive subscription, wrong-owner, limit-exceeded, and
idempotency-conflict cases.

Product notes:
The recommended first persisted capability is a confirmed business profile plus
a saved campaign preview from an existing Scout Drop. Checkout, evidence, XP,
weekly reports, exports, and automation remain out of scope. The onboarding spec
keeps Atlas map-first and avoids a generic SaaS pricing page. Session promotion
requires explicit user confirmation; demo XP never merges into the real XP
ledger.

Maturity:
Docs-only M1 planning toward M3 Persisted Beta. No code crossed
`HUMAN_APPROVAL_BEFORE_PERSISTENCE` or `HUMAN_APPROVAL_BEFORE_MONEY`.

Verification:
`pnpm --dir packages/core test` passed with 8 test files and 24 tests.
`git diff --check` passed with only Windows LF-to-CRLF warnings.

Next:
Review the approval packet with the human. If approved, start E9.3 persistence
foundation with ownership and idempotency tests first.

## Entry 031

Quest:
Integration/QA captain support playbook.

What changed:
Added `docs/INTEGRATION_QA_PLAYBOOK.md` so parallel Atlas threads have a
standard handoff format, rejection rules, verification matrix, and merge order.
Updated `docs/NEXT_QUESTS.md` to point worker and captain lanes at the playbook.

Product notes:
This is an operating-support slice only. It does not change the app, renderer,
MCP tools, submission JSON, persistence plan, Stripe plan, XP, evidence, or
deployment state.

Verification:
`pnpm --dir packages/core test` passed with 8 test files and 24 tests.
`git diff --check -- docs/INTEGRATION_QA_PLAYBOOK.md docs/NEXT_QUESTS.md docs/BUILD_LOG.md`
passed with only Windows LF-to-CRLF warnings.

Next:
Use the playbook when the E7.5 visual thread or E9.3 persistence-gate thread
lands changes.

## Entry 032

Quest:
Engine Beta cleanup slice 1: remove decorative car/human/prop noise from the
production city scene.

What changed:
Re-cut the first Engine Beta implementation from the clean Alpha Path B RC
worktree instead of the dirty mixed workspace. The city-world compiler no longer
emits moving cars, walkers, parked cars, clouds, streetlights, benches, signs,
or the fountain. It keeps buildings, roads, lots, terrain, Clawd, trees/bushes,
water shimmer, selected-place markers, and session-only user pins/notes. Core
compiler tests now assert that cars/walkers/decorative props are absent and
Clawd remains present.

Product notes:
Alpha Path B is accepted. The next Beta target is Engine Beta before Paid Beta:
cleaner voxel map, stronger building grammar, better camera/framing, and tighter
visual QA before Hosted Clawd persistence, Stripe, XP, evidence, OAuth,
automation, reports, or exports reopen.

Verification:
`pnpm test:core` passed with 8 files and 24 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. `pnpm verify:preview:http` passed against
`http://127.0.0.1:8787/preview` after starting a temporary local server.
`node scripts/verify-alpha-product-loop.mjs --url http://127.0.0.1:8787/preview
--screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-cleanup-product-loop`
passed on desktop `1280x720` and mobile `390x844`: one nonblank canvas, no
horizontal overflow, clean console, selected-place tray visible, pin count
increased, note count increased, and the latest note was visible.
Local `ATLAS_MCP_URL=http://127.0.0.1:8787/mcp pnpm verify:mcp` and
`ATLAS_MCP_URL=http://127.0.0.1:8787/mcp pnpm verify:submission` also passed
with the seven-tool Alpha surface intact.

Worker audits:
Lumen reported no P0 visual blockers and marked the cleanup deployable from a
visual gate perspective. Mira reported no product-loop blocker and confirmed the
bottom sticker/pin controls should stay because they are functional session
state, not decorative clutter. Forge confirmed no package/lock/env/server,
Hosted Clawd, persistence, renderer, type, or atlas-manifest drift in the code
slice.

Railway:
`railway up --detach --service atlas-backend --environment production --message
"Engine Beta cleanup city scene noise"` uploaded deployment
`95e4e9e8-7603-440e-be80-5fc2ca0c5bbc`.

Public verification:
Production `/health` returned ok. Public `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp
pnpm verify:mcp` passed with all seven tools. Public `pnpm verify:submission`
passed. Public `ATLAS_PREVIEW_URL=https://atlas-backend-production-e6fc.up.railway.app/preview
pnpm verify:preview:http` passed. Public
`node scripts/verify-alpha-product-loop.mjs --url https://atlas-backend-production-e6fc.up.railway.app/preview
--screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-cleanup-public-product-loop`
passed on desktop and mobile with one nonblank canvas, no horizontal overflow,
clean console, selected-place tray, pin increment, note increment, and visible
latest note.

Next:
Continue to the rowhome-only production renderer intake spike.

## Entry 033

Quest:
Engine Beta production voxel map upgrade: production object intake, controlled
residential grammar, quieter terrain, and tighter camera framing.

What changed:
Added three vetted object-kit SVG assets to the production city-world texture
lane: rowhome, three-bay strip store, and road corner. The atlas manifest now
declares the Engine Beta module keys and palettes. The web atlas resolver loads
the new SVG textures through the existing bundled data-url path with per-texture
primitive fallback. The production `CityWorldRenderer` can render sprite-backed
buildings when the atlas texture is available, while preserving primitive
building fallback, selected-place labels, markers, stickers, and notes.

The city-world compiler now emits a controlled residential module set instead
of repeated generic home loops: cottages, ranch homes, rowhome strips, low-rise
apartments, and one strip-store module. It also quiets random grass/sidewalk
noise and tightens desktop/mobile camera presets. The literal GYM text on the
primitive gym face was replaced with geometry so text does not carry object
identity. The road-corner SVG was registered but rejected from runtime drawing
in this slice because repeated road-cap placement looked pasted-on; primitive
road caps remain the fallback.

Product notes:
This remains Engine Beta, not Paid Beta. No MCP/tool contracts, server routes,
Hosted Clawd persistence, Stripe, XP, evidence, OAuth, automation, reports, or
exports changed. User pins/stickers and session notes remain functional product
state and were preserved.

Verification:
`pnpm test:core` passed with 8 files and 25 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local
`ATLAS_PREVIEW_URL=http://127.0.0.1:8787/preview pnpm verify:preview:http`
passed. Local
`node scripts/verify-alpha-product-loop.mjs --url http://127.0.0.1:8787/preview
--screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-production-upgrade-product-loop-final`
passed on desktop `1280x720` and mobile `390x844`: one nonblank canvas, no
horizontal overflow, clean console, selected-place tray visible, pin count
increased, note count increased, and the latest note was visible.

Screenshot evidence:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-production-upgrade-product-loop-final\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-production-upgrade-product-loop-final\alpha-product-loop-mobile-390x844.png`

Next:
Run local MCP/submission and split-guard checks, then get Lumen/Mira/Forge
audit responses before deploy. The next visual-engine code slice should improve
foundation/contact fit and roof/material detail for the controlled residential
set, then revisit road-corner modules only as proper road-module geometry, not
as repeated road-cap sprites.

## Entry 034

Quest:
USA public release engine plan.

What changed:
Added `docs/USA_PUBLIC_RELEASE_ENGINE_PLAN.md` as the scale contract for taking
Atlas from the Eastvale proof cell to California and then to USA public release.
The plan defines coverage tiers, national identity, county data packs, provider
normalization, scene compiler responsibilities, object-kit rules, camera and
performance gates, ChatGPT tool constraints, team ownership, verification gates,
and hard rejections. `docs/NEXT_QUESTS.md` now points the next expansion work
at California coverage contracts and county readiness tiers instead of broad
provider ingestion. `docs/DECISIONS.md` records the durable choice to scale
through explicit county readiness tiers and bounded scene compilation.

Product notes:
This is a scope expansion plan for the engine, not a reopening of Paid Beta.
Hosted Clawd persistence, Stripe, XP, evidence, OAuth, automation, reports, and
exports remain parked. The next national-scale work should make unsupported and
low-readiness counties honest before adding live provider breadth.

Verification:
Docs and split-guard verification are required for this planning slice. The
previous Engine Beta code verification remains the active implementation proof:
core tests, starter typecheck/build, preview HTTP, local MCP/submission, product
loop, and strict Engine Beta RC split guard all passed before this docs update.

Next:
Finish the current Engine Beta renderer deploy decision, then start E10.1:
California county coverage contract with coverage tiers, unsupported-county
response behavior, district selection, and a small California pilot fixture set.

## Entry 035

Quest:
Engine Beta 2A: production building foundation, contact, and roof grammar pass.

What changed:
The production `CityWorldRenderer` now draws a shared building footprint/contact
layer before both primitive and sprite-backed buildings. Sprite-backed rowhome
and strip-store modules keep their fallback path but sit on tighter, quieter
foundations. Primitive homes gained facade-specific detail for cottage, ranch,
and rowhome styles: clearer eaves, stoops, long windows, unit rhythm, and wall
depth lines. Roof rendering gained restrained material and eave/lip strokes so
the controlled residential set reads less like smooth cuboids. Eastvale Core was
slightly reduced in footprint/height and gained subtler roof/front structure so
it reads less like a giant plain block.

Product notes:
This is still Engine Beta. No new modules, cars, humans, decorative props,
provider ingestion, persistence, Stripe, XP, evidence, OAuth, automation,
reports, or exports were added. The work is deliberately about scalable
building grammar before California/USA coverage expansion.

Verification:
`pnpm test:core` passed with 8 files and 25 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local
`ATLAS_PREVIEW_URL=http://127.0.0.1:8787/preview pnpm verify:preview:http`
passed. Local
`node scripts/verify-alpha-product-loop.mjs --url http://127.0.0.1:8787/preview
--screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-2a-building-grammar-product-loop-final`
passed on desktop `1280x720` and mobile `390x844`: one nonblank canvas, no
horizontal overflow, clean console, selected-place tray visible, pin count
increased, note count increased, latest note visible, and session-only copy
visible. Local `ATLAS_MCP_URL=http://127.0.0.1:8787/mcp pnpm verify:mcp`
passed with all seven expected tools. Local
`ATLAS_MCP_URL=http://127.0.0.1:8787/mcp pnpm verify:submission` passed.
`node scripts/verify-alpha-rc-split.mjs --working-tree --strict-selected-rc
--rc-mode engine-beta-renderer` passed with 16 files and 0 blockers.
`git diff --check` on the RC paths passed with only Windows LF-to-CRLF
warnings.

Screenshot evidence:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-2a-building-grammar-product-loop-final\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-2a-building-grammar-product-loop-final\alpha-product-loop-mobile-390x844.png`

Next:
Send the final 2A screenshots to Lumen/Mira/Forge for visual/product/split
audit. If they do not report a blocker, the next product-scale slice is E10.1:
California county coverage contract and honest unsupported-county behavior.

Deployment:
Railway production deploy `1b7de9aa-3f72-481a-9625-f3777b4539e8` succeeded
for service `atlas-backend` in environment `production` with message
`Engine Beta 2A building grammar`.

Public verification:
Production `/health` returned ok. Public
`ATLAS_PREVIEW_URL=https://atlas-backend-production-e6fc.up.railway.app/preview
pnpm verify:preview:http` passed with `831282` bytes and city-world markup.
Public
`ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp
pnpm verify:mcp` passed with all seven expected tools. Public
`ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp
pnpm verify:submission` passed. Public
`node scripts/verify-alpha-product-loop.mjs --url
https://atlas-backend-production-e6fc.up.railway.app/preview --screenshots
C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-2a-public-product-loop`
passed on desktop and mobile with one nonblank canvas, no horizontal overflow,
clean console, selected-place tray, pin increment, note increment, visible
latest note, and visible session-only copy.

Public screenshot evidence:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-2a-public-product-loop\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-2a-public-product-loop\alpha-product-loop-mobile-390x844.png`

## Entry 036

Quest:
E10.1 California county coverage contract.

What changed:
Added a first USA-scale coverage contract on top of the existing
`NationalWorldService` seam. The service now indexes all 58 California counties
from the Census 2024 county gazetteer fixture, marks Riverside County `06065`
as `L2_CURATED_DISTRICT`, marks the other California counties as
`L1_COUNTY_SHELL`, and carries Eastvale district GEOID `0621230` under the
Riverside playable slice. `select_county` and `render_voxel_county` now return
the existing `voxelSceneSummary` plus `_meta.scene` only for `riverside-ca`.
Shell counties such as `orange-ca` return a structured `countyCoverageSummary`
and no fake scene data. Unknown counties return explicit `L0_UNSUPPORTED`
coverage from HTTP routes.

Product notes:
This is data/API readiness, not a visual renderer pass. Google lookup remains
available as a provider-backed place lookup, but E10.1 does not use Google to
claim county readiness. No persistence, Hosted Clawd, Stripe, XP, evidence,
OAuth, automation, reports, exports, package/lock/env changes, or visual lab
work was added.

Verification:
`pnpm test:core` passed with 8 files and 27 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local `pnpm verify:preview:http` passed
against `http://127.0.0.1:8787/preview` with `831282` bytes and city-world
markup. Local `ATLAS_MCP_URL=http://127.0.0.1:8787/mcp pnpm verify:mcp`
passed with all seven expected tools and `shellCountyTier:
L1_COUNTY_SHELL`. Local `ATLAS_MCP_URL=http://127.0.0.1:8787/mcp pnpm
verify:submission` passed. Direct HTTP smoke showed `/api/world/us/states/CA/
counties` returning 58 counties, `/api/world/counties/orange-ca` returning an
L1 shell with zero districts, and an unknown county returning 404 with
`L0_UNSUPPORTED` coverage. `node scripts\verify-alpha-rc-split.mjs
--working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
passed with 24 files and 0 blockers.

Next:
E10.2 should build the generic county shell compiler/UI contract: indexed L1
counties can show an honest map shell or tool response without fake local
places, while Riverside remains the only playable scene until another curated
district is approved.

## Entry 037

Quest:
E10.2 generic county shell compiler contract.

What changed:
Added a generic `compileCountyShellCityWorldScene` path for indexed L1 counties.
The shell scene is a bounded `CityWorldScene` with deterministic desktop/mobile
camera presets, low-detail terrain, and explicit coverage metadata. It contains
no places, buildings, lots, roads, pins, actors, or fake local activity. Shell
county tool responses now attach this scene as `_meta.coverageShellScene` while
continuing to omit `_meta.scene`; Riverside remains the only playable scene
payload. `CityWorldScene` gained optional coverage metadata so future UI work
can render shell state without parsing copy.

Product notes:
This is a UI/engine contract, not a playable-county expansion. Orange County
and the other L1 California counties are still identity shells only. The
existing widget continues to render Riverside until a future UI slice chooses
how to present `_meta.coverageShellScene`. No persistence, Hosted Clawd,
Stripe, XP, evidence, OAuth, automation, reports, exports, visual lab work, or
provider ingestion was added.

Verification:
`pnpm test:core` passed with 8 files and 28 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local `pnpm verify:preview:http` passed
against `http://127.0.0.1:8787/preview` with `831286` bytes and city-world
markup. Local `ATLAS_MCP_URL=http://127.0.0.1:8787/mcp pnpm verify:mcp`
passed with all seven tools; the verifier now proves `select_county` and
`render_voxel_county` for `orange-ca` return `countyCoverageSummary`,
`_meta.coverageShellScene`, no `_meta.scene`, no fake places, and no actors.
Local `ATLAS_MCP_URL=http://127.0.0.1:8787/mcp pnpm verify:submission` passed.
`node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc
--rc-mode engine-beta-data --json-only` passed with 25 files and 0 blockers.

Next:
E10.3 should add the product-facing shell UI/readiness surface for shell county
tool results, or keep it server-only until Mira approves the exact ChatGPT
widget behavior. The next implementation must still not fake places or local
claims for L1 counties.

## Entry 038

Quest:
E10.3 shell county widget/readiness surface.

What changed:
Added a dedicated shell-county widget surface for `countyCoverageSummary`
tool results. When ChatGPT selects an indexed L1 county such as Orange County,
the widget now renders `_meta.coverageShellScene` through the map renderer with
a coverage tray, source note, and explicit boundary copy. It no longer falls
back to the Riverside/Eastvale playable tray for shell counties, and it hides
place tools, sticker tools, and note input because L1 counties have no playable
local places yet. Added a focused `scripts/verify-shell-county-widget.mjs`
browser verifier that calls MCP for `orange-ca`, injects the real tool result
into local preview, and asserts the shell surface appears on desktop and
`390x844` mobile without fake place affordances.

Product notes:
This makes California shell coverage visible without pretending it is playable.
Riverside/Eastvale remains the only playable county loop. The bridge gained a
small local verifier hook so browser QA can inject tool results without a
ChatGPT host. No tool list changed, no renderer art was changed, and no
persistence, Hosted Clawd, Stripe, XP, evidence, OAuth, automation, reports,
exports, provider ingestion, or visual lab work was added.

Verification:
`pnpm test:core` passed with 8 files and 28 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local `pnpm verify:preview:http` passed.
Local `ATLAS_MCP_URL=http://127.0.0.1:8787/mcp pnpm verify:mcp` passed with all
seven tools and `shellCountyTier: L1_COUNTY_SHELL`. Local
`ATLAS_MCP_URL=http://127.0.0.1:8787/mcp pnpm verify:submission` passed.
`node scripts\verify-alpha-product-loop.mjs --url http://127.0.0.1:8787/preview
--screenshots %TEMP%\atlas-e103-riverside-product-loop` passed for desktop and
mobile, preserving the Riverside pin/note loop. `node
scripts\verify-shell-county-widget.mjs --url http://127.0.0.1:8787/preview
--mcp-url http://127.0.0.1:8787/mcp --screenshots
%TEMP%\atlas-e103-shell-widget` passed for desktop and mobile, proving
`orange-ca` renders as `L1_COUNTY_SHELL` with no selected-place tray. The split
guard remained green in `engine-beta-data` mode.

Next:
E10.4 should harden California coverage navigation and readiness language:
document how ChatGPT should move from a shell county back to the playable
Riverside slice, verify unsupported L0 copy in the widget/tool path, and keep
Google lookup clearly separate from coverage readiness.

## Entry 039

Quest:
E10.4 unsupported county widget/readiness hardening.

What changed:
Extended the shell county widget/verifier path to cover explicit
`L0_UNSUPPORTED` counties as well as indexed `L1_COUNTY_SHELL` counties.
Unsupported counties now use the same coverage tray and boundary language, set
`data-qa-supported="false"`, and intentionally render no shell canvas because
Atlas has no indexed county identity or playable district to show. The
`scripts/verify-shell-county-widget.mjs` verifier now accepts `--county` and
`--expected-tier`, proving both `orange-ca` as `L1_COUNTY_SHELL` and
`made-up-ca` as `L0_UNSUPPORTED` on desktop and `390x844` mobile.

Product notes:
This closes the immediate product honesty gap for California-scale navigation:
shell counties are visible, unknown counties are refused in the same UI family,
and neither path exposes selected-place tools, sticker tools, note input, fake
places, saved state, live coverage, XP, evidence, outreach, or automation.
Google lookup remains a place lookup only and is still not county readiness.

Verification:
`node scripts\verify-shell-county-widget.mjs --url http://127.0.0.1:8787/preview
--mcp-url http://127.0.0.1:8787/mcp --county orange-ca --expected-tier
L1_COUNTY_SHELL` passed for desktop and mobile. `node
scripts\verify-shell-county-widget.mjs --url http://127.0.0.1:8787/preview
--mcp-url http://127.0.0.1:8787/mcp --county made-up-ca --expected-tier
L0_UNSUPPORTED` passed for desktop and mobile. `pnpm typecheck:starter` and
`pnpm build:starter` passed after the verifier/UI hardening.

Next:
E10.5 should move from coverage honesty to coverage navigation: add a small
tool/model prompt contract or widget affordance for moving from any shell or
unsupported county back to the playable Riverside/Eastvale slice, without
adding fake counties or reopening persistence/payment scope.

## Entry 040

Quest:
E10.5 shell/unsupported recovery action.

What changed:
Added one obvious recovery action to the shell/unsupported county widget:
`Open Riverside/Eastvale playable Alpha`. The button asks the ChatGPT host to
open the playable proof slice instead of leaving users at a dead end. The
action appears in both indexed shell counties and unsupported counties, while
place tray, sticker tools, note input, scout/campaign affordances, fake places,
saved state, XP, evidence, live coverage, and automation claims remain absent.

Product notes:
This follows Mira's product bar: shell counties are a promise boundary and
navigation affordance, not the app's content. The recovery action points back
to the real product loop without making California coverage feel fake or
complete.

Verification:
`pnpm typecheck:starter` passed. `pnpm build:starter` passed. The shell widget
verifier now asserts the recovery action is visible and points to
Riverside/Eastvale. Riverside product loop, Orange L1 shell, made-up L0
unsupported, preview, MCP, and submission checks passed locally against
`http://127.0.0.1:8787`.

Next:
E10.6 should keep the verifier tiny: one command that proves Riverside
playable, Orange shell, unknown unsupported, recovery action visible, and the
existing tool/preview/submission checks remain green.

## Entry 041

Quest:
E10.6 Engine Beta coverage matrix verifier.

What changed:
Added `scripts/verify-engine-beta-coverage.mjs`, a focused all-in-one verifier
for the Engine Beta coverage contract. It checks `/health`, California's 58
county entries, Riverside `L2_CURATED_DISTRICT` with GEOID `06065`, Orange
`L1_COUNTY_SHELL`, unknown county `L0_UNSUPPORTED`, preview HTTP, MCP tool
flow, submission verifier, Riverside desktop/mobile product loop, Orange
desktop/mobile shell widget, and unsupported desktop/mobile widget. It can also
write all six screenshots under `ATLAS_ENGINE_BETA_COVERAGE_SCREENSHOTS`.

Product notes:
This is intentionally a small release gate, not a new e2e framework. It exists
to stop future USA-scale coverage work from accidentally faking a county,
breaking Riverside, or hiding the recovery path.

Verification:
`node scripts\verify-engine-beta-coverage.mjs` passed locally with 58
California counties, Riverside `L2_CURATED_DISTRICT`, Orange
`L1_COUNTY_SHELL`, unknown `L0_UNSUPPORTED`, preview/MCP/submission green, and
browser coverage for Riverside, Orange, and unsupported states. `node --check`
passed for both coverage verifier scripts.

Next:
Wait for Forge split/deploy-safety pass and Mira product-readiness pass. If
both pass, the next Axiom decision is whether to deploy the Engine Beta
data+shell candidate or cut one exact blocker.

## Entry 042

Quest:
E10.8 county index source verifier.

What changed:
Added `scripts/verify-county-index-source.mjs`, a no-dependency Forge verifier
for the California coverage index. The script downloads or reuses the 2024
Census county gazetteer plus the California place gazetteer, parses the current
`packages/core/src/world/californiaCountyIndex.ts` fixture, and checks that the
repo still has 58 California counties, Census GEOID/name/centroid agreement,
Riverside County `06065`, Eastvale place GEOID `0621230`, 57 shell counties,
one curated playable county, and zero provider-normalized or public-quality
claims.

Product notes:
This is service/data readiness work, not a new product feature. It makes the
current California coverage contract easier to trust before Atlas adds more
states, provider normalization, or playable districts. The verifier does not
add Hosted Clawd, database storage, package dependencies, Stripe, XP, evidence,
OAuth, automation, reports, exports, or fake county readiness.

Verification:
`node --check scripts\verify-county-index-source.mjs` passed. `node
scripts\verify-county-index-source.mjs --json-only` passed with 58 Census
county rows, 58 indexed rows, 57 `L1_COUNTY_SHELL`, one
`L2_CURATED_DISTRICT`, Riverside `06065`, and Eastvale `0621230`. `node
scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc
--rc-mode engine-beta-data --json-only` passed with 35 files and 0 blockers.

Next:
E10.9 should turn this into a repeatable data-intake posture before any USA
scale claim: document the fixture generation command, decide whether downloaded
gazetteer files stay temp-only or become checked test fixtures, and keep Census
identity verification separate from provider-normalized place readiness.

## Entry 043

Quest:
E10.8 First-Run County Choice Polish.

What changed:
Polished the county switcher first-read without adding product scope. The
unsupported example chip now reads `Unknown / L0` instead of using the blunt
destination label `Unsupported`, and the switcher carries one small coverage
truth line: `CA coverage: 1 playable, 57 indexed shells`. The county-switcher
browser verifier now asserts the active labels and coverage summary so this
entry-point copy cannot drift silently.

Product notes:
This is a small ChatGPT app comprehension pass, not a new directory or search
surface. Riverside remains the only playable county. Orange remains an indexed
shell. The unknown slug remains unsupported. The recovery CTA remains visible
on mobile, and no persistence, paid, XP, evidence, OAuth, automation, reports,
exports, Hosted Clawd, provider readiness, or fake county behavior was added.

Verification:
`node --check scripts\verify-county-switcher.mjs` passed. `pnpm test:core`
passed with 8 files and 29 tests. `pnpm typecheck:starter` passed. `pnpm
build:starter` passed. `node scripts\verify-engine-beta-coverage.mjs` passed
locally against `http://127.0.0.1:8787` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e108-county-choice-polish-local`.
Railway deployment `825f366c-ffa6-478f-936b-aa940d869de4` completed
successfully with message `E10.8 county choice polish`. The public E10 matrix
passed against `https://atlas-backend-production-e6fc.up.railway.app` with
screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e108-county-choice-polish-public-final`.

Next:
The next decision is between Lumen's road/lot/terrain contact grammar pass and
Forge's repeatable data-intake posture. Keep the current county switcher small;
do not turn it into a broad county directory before playable coverage exists.

## Entry 044

Quest:
Engine Beta 2B road/lot/terrain contact grammar.

What changed:
Updated the production `CityWorldRenderer` road, lot, and terrain drawing
without changing scene contracts. Roads now draw with a darker side-face/contact
layer, calmer curbs, quieter dashed markings, and less diagrammatic
intersection caps. Lots now draw with subtle contact shadows, lower lip faces,
and inner bevels so homes, shops, civic pads, parks, and waterfront areas sit
more physically under buildings. Grass terrain variation and grid strokes are
quieter, reducing the empty-board read while preserving map legibility.

Product notes:
This is a voxel-engine quality pass, not a new feature. It does not add props,
cars, humans, water expansion, panels, new county behavior, persistence,
payment, XP, evidence, OAuth, automation, reports, exports, or Hosted Clawd
scope. User pins, notes, selected-place markers, shell/unsupported recovery,
and the county switcher remain unchanged.

Verification:
`pnpm test:core` passed with 8 files and 29 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. `node
scripts\verify-engine-beta-coverage.mjs` passed locally against
`http://127.0.0.1:8787` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-2b-road-lot-terrain-local`.
Railway deployment `76556a60-bc03-4f6a-b49b-b7148a017295` completed
successfully with message `Engine Beta 2B road lot terrain contact`. The public
E10 matrix passed against `https://atlas-backend-production-e6fc.up.railway.app`
with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-2b-road-lot-terrain-public`.

Next:
The next visual slice should be a road-module geometry pass only if Lumen
confirms the 2B direction; otherwise take Forge's repeatable county source-
intake gate.

## Entry 045

Quest:
Engine Beta 2C visual density and landmark read.

What changed:
Strengthened the production renderer's civic building detail for Eastvale Core,
the selected starting landmark. The building now has clearer roof tiers, a
stronger entry block, more readable columns, side-window rhythm, and deeper
front steps. This targets the first-3-second screenshot weakness where the
selected landmark previously read as a plain beige block under the Clawd/marker
stack.

Product notes:
This is a bounded landmark readability pass. It does not add a new place, prop,
panel, car, human, water feature, product state, route, data contract,
persistence, payment, XP, evidence, OAuth, automation, report, export, or
Hosted Clawd scope. Riverside remains the only playable county; shell and L0
states remain honest and recoverable.

Verification:
`pnpm test:core` passed with 8 files and 29 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. `node
scripts\verify-engine-beta-coverage.mjs` passed locally against
`http://127.0.0.1:8787` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-2c-landmark-local`.
Railway deployment `213f3598-3546-482e-bd2a-256b11379182` completed
successfully with message `Engine Beta 2C landmark read`. The public E10
matrix passed against `https://atlas-backend-production-e6fc.up.railway.app`
with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-engine-beta-2c-landmark-public`.

Next:
Pause visual renderer work unless Lumen names a single higher-leverage blocker;
otherwise give Forge E10.9 repeatable county source intake.

## Entry 046

Quest:
E10.9 repeatable county source intake gate.

What changed:
Hardened `scripts/verify-county-index-source.mjs` so California coverage
source checks are repeatable online and offline. The verifier now reports
whether Census county/place sources were freshly downloaded or reused from the
local temp cache, includes the `offline` mode in JSON output, and supports
`ATLAS_COUNTY_SOURCE_CACHE_DIR` as a controlled cache override for CI and
release proof. Offline failures now return a structured JSON blocker with clear
copy about the missing cached file and the approved recovery path. Updated the
USA public release engine plan with the current Engine Beta status and the
immediate E11 chain: road geometry, residential variety, camera/density,
California district candidates, and one second playable district.

Product notes:
This is a source-trust and release-safety slice. It does not change runtime UI,
renderer visuals, MCP tools, county behavior, routes, package/lock files, env
files, persistence, Hosted Clawd, Stripe, XP, evidence, OAuth, automation,
reports, exports, or provider-readiness claims. Raw Census files remain
temp-only unless explicitly approved as checked fixtures.

Verification:
`node --check scripts\verify-county-index-source.mjs` passed. `node
scripts\verify-county-index-source.mjs --json-only` passed with cached sources,
58 Census county rows, 58 indexed rows, 57 `L1_COUNTY_SHELL`, one
`L2_CURATED_DISTRICT`, Riverside `06065`, and Eastvale `0621230`. `node
scripts\verify-county-index-source.mjs --offline --json-only` passed from the
cache. An empty-cache offline smoke using `ATLAS_COUNTY_SOURCE_CACHE_DIR`
failed as expected with structured JSON and clear recovery copy. `node
scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc
--rc-mode engine-beta-data --json-only` passed with 35 files and 0 blockers.
`pnpm test:core` passed with 8 files and 29 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. A temporary local built server passed
`pnpm verify:preview:http`, local `pnpm verify:mcp`, and local
`pnpm verify:submission`; the server was stopped afterward.

Next:
Move to E11.1 road module geometry or E11.4 California district candidate
selection depending on whether the next priority is visual engine quality or
coverage expansion.

## Entry 047

Quest:
E11.1 road module geometry.

What changed:
Reworked the production `CityWorldRenderer` road pass from per-segment stroke
ribbons into a small road-network module pass. The renderer now draws physical
road slabs with contact shadow, side face, curb shell, asphalt bed, quieter
surface layer, and edge bevels. It detects axis-aligned road crossings and
shared endpoints from the existing `CityWorldRoadSegment` scene data, then
draws isometric joint plates for intersections, T/cross joins, corners, and
driveway joins. Crosswalks now render as their own paver/curb module over the
road network instead of a loud white stripe overlay.

Product notes:
This is a renderer-only Engine Beta slice. It does not change county data,
server routes, MCP tools, shell/unsupported state, the county switcher,
session-only pins/notes, persistence, Hosted Clawd, Stripe, XP, evidence,
OAuth, automation, reports, exports, package/lock files, env files, or provider
readiness claims. No cars, walkers, humans, decorative props, dashboards,
labels, or water expansion were added.

Verification:
`pnpm test:core` passed with 8 files and 29 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local `node
scripts\verify-engine-beta-coverage.mjs` passed against
`http://127.0.0.1:8787` with final screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e111-road-module-geometry-local-final`.
The matrix covered preview HTTP, MCP, submission, Riverside product loop,
Orange shell, unsupported L0, and county switcher states.

Deployment:
Railway deployment `59a5eecc-8b8a-45f1-a920-c62626f8de26` completed
successfully for service `atlas-backend` in environment `production`.

Public verification:
Public `node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e111-road-module-geometry-public`.
The public matrix covered the coverage directory, California count `58`,
Riverside `L2_CURATED_DISTRICT`, Orange `L1_COUNTY_SHELL`, unknown
`L0_UNSUPPORTED`, preview HTTP, MCP, submission, Riverside product loop, Orange
shell widget, unsupported widget, and county switcher desktop/mobile states.

Visual read:
The pass improves physical road/junction structure and keeps buildings as the
focus. The road joints are still a little dark and not final atlas art, but
they read more like embedded map modules than the previous painted-line/cap
behavior. No P0 product or mobile blocker was observed in the local screenshots.

Next:
Move to E11.2 residential variety if the team wants to keep improving the
playable proof cell, or E11.4 California district candidate selection if the
next priority is coverage expansion.

## Entry 048

Quest:
E11.2 residential variety in production.

What changed:
Tightened the production home renderer so the existing cottage, ranch, and
rowhome families read as different residential modules instead of one cloned
house pattern. Cottages now get a clearer front-gable face, porch pad, eave
line, window rhythm, and chimney. Ranch homes now get lower horizontal eaves,
long window bands, a side-wing read, stoop, and separate door mass. Rowhomes
keep the asset-backed production sprite path and the primitive fallback now has
clearer parapet/unit rhythm when used.

Product notes:
This is a visual-engine slice for the existing Riverside/Eastvale playable
scene. It does not change county coverage, server routes, MCP tools, shell or
unsupported state, county switcher behavior, session-only pins/notes,
persistence, Hosted Clawd, Stripe, XP, evidence, OAuth, automation, reports,
exports, package/lock files, env files, or provider-readiness claims. No cars,
walkers, humans, decorative props, dashboards, labels, or product panels were
added.

Verification:
`pnpm test:core` passed with 8 files and 30 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. `pnpm verify:preview:http` passed. Local
`node scripts\verify-engine-beta-coverage.mjs` passed against
`http://127.0.0.1:8787` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e112-residential-variety-local`. The
matrix covered preview HTTP, MCP, submission, Riverside product loop, Orange
shell, unsupported L0, and county switcher states.

Deployment:
Railway deployment `3a8de436-9da0-45bf-80a2-f3bf7e916500` completed
successfully for service `atlas-backend` in environment `production`.

Public verification:
Public `node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e112-residential-variety-public`. The
public matrix covered the coverage directory, California count `58`, Riverside
`L2_CURATED_DISTRICT`, Orange `L1_COUNTY_SHELL`, unknown `L0_UNSUPPORTED`,
preview HTTP, MCP, submission, Riverside product loop, Orange shell widget,
unsupported widget, and county switcher desktop/mobile states.

Visual read:
The pass gives the playable neighborhood more residential grammar without
reintroducing filler props. The map still needs better production art and
camera/density work, but the cloned red-roof home signal is weaker and the
building kit now has clearer cottage/ranch/rowhome separation on desktop and
mobile.

Next:
Move to camera/visual-density or California district candidate selection. Do
not reopen paid, persistence, XP, evidence, OAuth, automation, reports,
exports, or prop clutter.

## Entry 049

Quest:
E11.3 camera and visual density.

What changed:
Added a third deterministic `CityWorldScene` camera preset,
`residential_detail`, for close inspection of the neighborhood object kit.
Tightened the default desktop camera so the public Riverside/Eastvale first
read is denser and less empty-board dominant while keeping the existing mobile
camera and product loop readable. The renderer now accepts a hidden
`?atlasCamera=residential_detail` QA camera request and exposes a data hook so
verifiers can prove the diagnostic preset was active.

Verifier support:
`scripts\verify-alpha-product-loop.mjs` now supports a proof-only camera mode
used by `scripts\verify-engine-beta-coverage.mjs`. The Engine Beta matrix now
captures both normal Riverside product-loop screenshots and residential-detail
QA screenshots. This does not add a user-facing camera mode or change the MCP
tool list.

Product notes:
This is an engine QA/framing slice. It does not change county coverage, server
routes, MCP tools, shell or unsupported state, county switcher behavior,
session-only pins/notes, persistence, Hosted Clawd, Stripe, XP, evidence,
OAuth, automation, reports, exports, package/lock files, env files, or provider
readiness claims. No cars, walkers, humans, decorative props, dashboards,
labels, or product panels were added.

Verification:
`node --check scripts\verify-alpha-product-loop.mjs` passed. `node --check
scripts\verify-engine-beta-coverage.mjs` passed. `pnpm test:core` passed with 8
files and 31 tests. `pnpm typecheck:starter` passed. `pnpm build:starter`
passed. `pnpm verify:preview:http` passed against a local built server. Local
`node scripts\verify-engine-beta-coverage.mjs` passed against
`http://127.0.0.1:8787` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e113-camera-density-local-final`. The
matrix covered preview HTTP, MCP, submission, Riverside product loop,
residential-detail camera proof, Orange shell, unsupported L0, and county
switcher states. Final strict `engine-beta-data` split guard passed with 36
files, 0 blockers, and 0 unknown paths.

Deployment:
Railway deployment `461b8adf-59e3-4e95-bae2-00d536464259` completed
successfully for service `atlas-backend` in environment `production`.

Public verification:
Public `node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e113-camera-density-public`. The public
matrix covered California count `58`, Riverside `L2_CURATED_DISTRICT`, Orange
`L1_COUNTY_SHELL`, unknown `L0_UNSUPPORTED`, preview HTTP, MCP, submission,
Riverside product loop, residential-detail camera proof, Orange shell widget,
unsupported widget, and county switcher desktop/mobile states.

Visual read:
The default desktop screenshot is tighter and makes buildings/roads occupy more
of the first read. The residential-detail proof gives a useful close crop for
judging the cottage/ranch/rowhome kit without changing the public product
surface. Mobile remains map-first and readable above the tray.

Next:
Move to E11.4 residential object art upgrade. The new residential-detail camera
proves the next quality bottleneck is house and small-building authorship, not
coverage expansion. Do not begin California district expansion until the proof
cell remains visually credible in the close camera evidence.

## Entry 050

Quest:
E11.6 California district candidate pack prep.

What changed:
Prepared the next data-readiness lane without making any new county or district
playable. The California county index now names two candidate-only districts:
Anaheim in Orange County and Ontario in San Bernardino County. Both use Census
place GEOID anchors, remain `playable: false`, stay at `L1_COUNTY_SHELL`, and
carry readiness metadata describing the minimum work needed before either can
become playable: a curated district pack, place anchors with source notes,
bounded scene compiler proof, and desktop/mobile product-loop screenshots.

The world contract now allows district summaries to expose candidate readiness
metadata. `NationalWorldService` returns that metadata for indexed shell
districts while keeping `placeCount: 0`. Riverside/Eastvale remains the only
playable `L2_CURATED_DISTRICT` loop.

Verifier support:
`scripts\verify-county-index-source.mjs` now checks every indexed district
GEOID against the 2024 Census California place gazetteer, not only Eastvale.
Candidate districts therefore need real Census place identity before they can
enter the readiness list.

Product notes:
This is not UI expansion and not a provider-readiness claim. Anaheim and
Ontario are named as candidate contracts only. They do not get fake places,
scenes, provider-normalized categories, public-quality status, saved state,
campaign state, XP, evidence, OAuth, automation, reports, exports, or deploy
scope.

Verification:
`pnpm test:core` passed with 8 files and 32 tests. `pnpm typecheck:starter`
passed. `node scripts\verify-county-index-source.mjs --offline --json-only`
passed with 58 indexed counties, Riverside `06065`, Eastvale `0621230`, and
candidate district anchors included. `node scripts\verify-alpha-rc-split.mjs
--working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
passed with 36 files, 0 blockers, and 0 unknown paths.

Next:
Before one of these candidates becomes playable, Axiom should pick one district
and require a curated pack, compiler proof, source notes, Lumen visual
acceptance, Mira product proof, and Forge split/deploy guard. Until then,
candidate districts must remain non-playable L1 shell metadata.

## Entry 051

Quest:
E11.4 terrain and parcel density.

What changed:
Tuned the production renderer terrain and lot grammar so the Eastvale proof
cell reads less like a flat green grid. Grass tile strokes are quieter and
carry sparse terrain facets. Lots now have stronger contact shadows, parcel
edge ticks, home pad/walk details, and restrained forecourt pads for commercial,
civic, gym, and apartment lots.

Product notes:
This is renderer-only map-surface work. It does not change county coverage,
server routes, MCP tools, product state, county switcher behavior, shell or
unsupported recovery, session-only pins/notes, persistence, Hosted Clawd,
Stripe, XP, evidence, OAuth, automation, reports, exports, package/lock files,
env files, or provider readiness. No cars, walkers, humans, decorative props,
dashboards, fake places, labels, or product panels were added.

Verification:
`pnpm typecheck:starter` passed. `pnpm test:core` passed with 8 files and 31
tests before the parallel E11.6 data-prep test landed. `pnpm build:starter`
passed. `pnpm verify:preview:http` passed against a local built server with
852579 bytes and city-world markup. Local
`node scripts\verify-engine-beta-coverage.mjs` passed against
`http://127.0.0.1:8787` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e114-terrain-parcel-density-local`.
Final strict `engine-beta-data` split guard passed with 36 files, 0 blockers,
and 0 unknown paths.

Deployment:
Railway deployment `ff24270d-5e9f-4689-83db-140b991ab581` completed
successfully for service `atlas-backend` in environment `production`.

Public verification:
Public `node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e114-terrain-parcel-density-public`.
The public matrix covered California count `58`, Riverside
`L2_CURATED_DISTRICT`, Orange `L1_COUNTY_SHELL`, unknown `L0_UNSUPPORTED`,
preview HTTP, MCP, submission, Riverside product loop, residential-detail
camera proof, Orange shell widget, unsupported widget, and county switcher
desktop/mobile states.

Visual read:
The change is intentionally subtle. The broad grid is less loud, residential
and commercial lots sit with more contact, and the residential-detail camera
shows a more grounded map base. The pass does not solve object-art quality or
landmark richness, but it improves first-read trust without clutter.

Next:
Run the two-lane follow-up: E11.5 landmark/parcel read for Eastvale Core and
Neighborhood Blocks, and E11.6 California district candidate pack prep. E11.6
is already present locally as a candidate-only data contract and must remain
non-playable until a curated district pack and visual/product gates pass.

## Entry 052

Quest:
Big 4 artifact-first operating model.

What changed:
Added `docs/BIG4_ARTIFACT_OPERATING_MODEL.md` as the active Engine Beta worker
contract. The model turns Mira, Lumen, and Forge from gate-only reviewers into
artifact owners: Lumen builds visual-engine improvements, Mira builds
product-surface and verifier improvements, and Forge builds data/backend glue
and release-safety artifacts. Axiom remains integration GM and final release
authority.

Worker activation:
Sent bounded implementation packets to the real Lumen, Mira, and Forge threads.
Each packet names an artifact, allowed files, anti-scope, verification commands,
and required output. The tasks are E11.5 Landmark / Parcel Read, E11.5 Product
Surface Tightening, and E11.6 Candidate Pack Hardening.

Anti-scope:
No persistence, Hosted Clawd, Stripe, XP, evidence, OAuth, automation, reports,
exports, package/lock/env drift, fake playable coverage, cars, humans,
decorative props, dashboards, or product panel sprawl.

Next:
Axiom integrates only artifact-bearing handoffs. If a worker returns only a
gate report without an artifact, send it back unless a final release verdict was
explicitly requested.

## Entry 053

Quest:
E11.8 Commerce / Landmark Object Polish.

What changed:
Tightened the existing production commerce and landmark object grammar without
adding new places or props. Plaza Row's three-bay SVG source has more restrained
roof-plane facets, awning underside depth, foundation lips, and bay material
separation. The primitive production renderer now gives Gym, Apartments, and
Eastvale Core stronger grounding, roof/side-face detail, entry pads, and
landmark massing.

Product notes:
This is a map-surface quality slice only. It does not change county coverage,
server routes, MCP tools, product state, county switcher behavior, shell or
unsupported recovery, session-only pins/notes, persistence, Hosted Clawd,
Stripe, XP, evidence, OAuth, automation, reports, exports, package/lock files,
env files, or provider readiness. No cars, walkers, humans, decorative props,
dashboards, fake places, labels, or product panels were added.

Verification:
`pnpm test:core` passed with 8 files and 32 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. The strip-store SVG parsed as XML. Focused
`git diff --check` on the renderer and strip-store SVG passed with only Windows
LF-to-CRLF warnings. `pnpm verify:preview:http` passed against
`http://127.0.0.1:8787/preview` with 860038 bytes and city-world markup. Local
`node scripts\verify-engine-beta-coverage.mjs` passed against
`http://127.0.0.1:8787` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e118-commerce-landmark-local`.
Strict `engine-beta-data` split guard passed with 37 files, 0 blockers, and 0
unknown paths.

Worker gates:
Lumen returned PASS: no P0 visual regression, Plaza Row reads more like
commerce, Gym/service is less plain, Eastvale Core remains dominant, and mobile
readability holds. Mira returned PASS: tray, switcher, note field, pin controls,
session-only copy, and shell/unsupported recovery stay intact. Forge returned
SAFE: E11.8 stays inside the renderer/art/docs envelope with no package, lock,
env, backend persistence, or payment scope.

Deployment:
Railway deployment `19dd4f59-ca7a-4321-b681-945713f88680` completed
successfully for service `atlas-backend` in environment `production`.

Public verification:
Public `node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e118-commerce-landmark-public`. The
public matrix covered California count `58`, Riverside `L2_CURATED_DISTRICT`,
Orange `L1_COUNTY_SHELL`, unknown `L0_UNSUPPORTED`, preview HTTP, MCP,
submission, Riverside product loop, residential-detail camera proof, Orange
shell widget, unsupported widget, and county switcher desktop/mobile states.

Local screenshot read:
Riverside desktop and mobile remain map-first. The commerce/landmark objects are
less plain, Eastvale Core has clearer civic structure, Apartments have more
readable stacked massing, and Gym/Plaza Row read less like flat blocks. Orange
shell and unsupported mobile states still show the recovery CTA in the first
viewport.

Next:
Choose E11.9 from a concrete public screenshot blocker rather than broad visual
churn. Lumen's highest-value visual follow-up is selected-landmark marker/Clawd
stacking cleanup around Eastvale Core: reduce roof occlusion and improve
selected-place readability without adding new UI, props, product state, or
backend scope.

## Entry 054

Quest:
E11.9 Selected Landmark Marker / Clawd Stacking Cleanup.

What changed:
Reduced the selected Eastvale Core roof-occlusion stack in the production
renderer. Clawd now renders slightly forward/down for the Eastvale Core anchor
so he reads in front of the civic building instead of sitting on the roof. The
selected landmark ring is smaller and shifted forward, and Eastvale Core pins
fan away from the exact center so note/favorite markers do not pile directly on
top of Clawd.

Product notes:
This is renderer-only selected-state clarity work. It does not change county
coverage, server routes, MCP tools, product state, county switcher behavior,
shell or unsupported recovery, session-only pins/notes, persistence, Hosted
Clawd, Stripe, XP, evidence, OAuth, automation, reports, exports, package/lock
files, env files, or provider readiness. No cars, walkers, humans, decorative
props, dashboards, fake places, labels, or product panels were added.

Verification:
`pnpm test:core` passed with 8 files and 32 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Focused `git diff --check` on the renderer
passed with only Windows LF-to-CRLF warnings. `pnpm verify:preview:http` passed
against `http://127.0.0.1:8787/preview` with 860383 bytes and city-world
markup. Local `node scripts\verify-engine-beta-coverage.mjs` passed against
`http://127.0.0.1:8787` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e119-selected-marker-cleanup-local`.
Strict `engine-beta-data` split guard passed with 37 files, 0 blockers, and 0
unknown paths.

Worker gates:
Mira returned PASS: Eastvale Core remains readable as the selected place,
pin/note controls, tray, switcher, session-only copy, and shell/unsupported
recovery remain intact. Forge returned SAFE, with the E11.9 envelope limited to
renderer/docs and no server, world data, contracts, product state, package,
lock, env, Hosted Clawd, persistence, or payment scope. Lumen's thread read hit
a tool-layer error during final polling, so Axiom used the local screenshot read
and Lumen's prior E11.8 blocker note as the visual basis.

Deployment:
Railway deployment `5cf3aca4-ac5c-46e3-8836-fe1abb0f3ce9` completed
successfully for service `atlas-backend` in environment `production`.

Public verification:
Public `node scripts\verify-engine-beta-coverage.mjs` passed against
`https://atlas-backend-production-e6fc.up.railway.app` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e119-selected-marker-cleanup-public`.
The public matrix covered California count `58`, Riverside
`L2_CURATED_DISTRICT`, Orange `L1_COUNTY_SHELL`, unknown `L0_UNSUPPORTED`,
preview HTTP, MCP, submission, Riverside product loop, residential-detail
camera proof, Orange shell widget, unsupported widget, and county switcher
desktop/mobile states.

Local screenshot read:
Riverside desktop and mobile remain map-first. Clawd now reads more clearly in
front of Eastvale Core, while marker/pin affordances remain visible. Orange
shell and unsupported mobile states still show honest copy and recovery CTA in
the first viewport.

Next:
The selected landmark stack is improved enough to stop this mini visual loop.
The next production-moving artifact should shift back toward California district
readiness or second playable district contracts unless a fresh public screenshot
reveals a sharper P0 visual blocker.

## Entry 055

Quest:
E12.15 Native Anaheim Venue Object Grammar Runtime Correction.

What changed:
Corrected the Anaheim Convention Center draft runtime path away from the broad
source-SVG sprite and back toward renderer-native voxel object grammar. The
Convention Center entry spine no longer asks for
`building.venue.anaheim_convention_center.v1` as its runtime sprite/palette.
It falls back through the regular civic primitive metadata while the renderer
adds native glass run, canopy, plaza, frontage bay, pier, roof-band, and
forecourt-axis details. The exhibit hall native detail was also strengthened
with a curtain-wall band and wave cornice cue.

Product notes:
This is hidden Anaheim draft work only. The inspectable source-art SVG remains
as a review artifact and atlas-manifest evidence, but it is not treated as the
main runtime answer for the venue. Anaheim remains `L1_COUNTY_SHELL`, hidden,
non-playable, and blocked from public promotion. No county switcher expansion,
public Anaheim route, selected-place tray, sticker tools, note tools, fake
places, provider-readiness claim, persistence, Hosted Clawd, Stripe, XP,
evidence, OAuth, automation, reports, exports, cars, humans, props, dashboard,
or product panel was added.

Verification:
`pnpm test:core` passed with 11 files and 42 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. `node
scripts\verify-anaheim-promotion-readiness.mjs --json-only` passed while
reporting `promotionReady: false`. `node
scripts\verify-anaheim-object-source-quality.mjs --json-only` passed while
keeping source-art/naming blockers. Local `node
scripts\verify-anaheim-draft-scene.mjs --url http://127.0.0.1:8791/preview
--screenshots
C:\Users\mzwin\AppData\Local\Temp\atlas-e1215-native-venue-grammar-local`
passed for desktop, mobile, and residential-detail cameras. Local `node
scripts\verify-engine-beta-coverage.mjs` passed against
`http://127.0.0.1:8791` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e1215-engine-beta-coverage-local`.
Local `node scripts\verify-world-lookup-boundary.mjs --json-only` passed
against `http://127.0.0.1:8791`, proving lookup cache behavior without coverage
promotion.

Screenshot read:
Native object grammar is a better direction than the pasted source-SVG runtime
for this kind of voxel engine. The Convention Center now has more integrated
glass, roof, plaza, and entry-spine cues. It is still not public-quality: the
draft relies too much on labels, the mobile card consumes a large part of the
view, and the scene still needs a second recognizable anchor before any Anaheim
promotion conversation.

Next:
Do not promote Anaheim. If the visual lane continues, the next bounded artifact
should be ARTIC native grammar because it has the strongest silhouette after
Convention Center. If ARTIC plus Convention Center still require labels after
one pass, stop the Anaheim visual tunnel and move to a user-visible Riverside or
product-loop improvement.

Lumen follow-up:
Added a second native-grammar renderer refinement for the same hidden target
pair without adding public behavior or art crutches. Convention Center now gets
stronger hall side-face/contact, layered roof fields, skylight strips, and
curtain-wall mullions. ARTIC gets a stronger parabolic shell rim, crossed rib
rhythm, platform/track edge, end glass portals, and tower rib cue. Local pass2
hidden Anaheim screenshots were captured under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e1215-native-venue-grammar-local-pass2`.

Lumen visual read:
Better engine direction, not public art approval. ARTIC now has the stronger
label-hidden read as a transit hall. Convention Center is improved as a long
glass civic/campus object, but it still relies too much on the label and mobile
card framing to explain itself. The right product cutline is: do not promote
Anaheim; do not start a broad Anaheim art tunnel. Either make Convention Center
recognizable in one more bounded pass, or shift work back to visible
Riverside/product-loop trust.

## Entry 056

Quest:
E12.16 Anaheim Hidden Draft Mobile Comprehension Tightening.

What changed:
Executed Mira's product-surface plan in the Axiom thread because Mira's thread
remained in plan mode. The hidden Anaheim shell/draft coverage tray is now
denser on mobile: header status and indexed pill share one row, coverage facts
use compact grid cells, boundary/source copy has less vertical bulk, and the
recovery CTA stays full-width without eating as much of the map. The Anaheim
draft verifier now records first-viewport visibility for the CTA and source
note and fails the mobile pass if either falls below the first `390x844`
viewport.

Product notes:
This is UI compression for a hidden draft state, not Anaheim promotion. It does
not add a public Anaheim route, county-switcher state, selected-place tray,
sticker tools, note input, Scout Drop, campaign controls, fake places, backend
data changes, renderer behavior, provider-readiness claims, persistence,
Hosted Clawd, Stripe, XP, evidence, OAuth, automation, reports, or exports.

Verification:
`pnpm typecheck:starter` passed. `pnpm build:starter` passed. `node --check
scripts\verify-anaheim-draft-scene.mjs` passed. Local `pnpm
verify:preview:http` passed against `http://127.0.0.1:8792/preview` with
875833 bytes and city-world markup. Local `node
scripts\verify-anaheim-draft-scene.mjs --url http://127.0.0.1:8792/preview
--screenshots
C:\Users\mzwin\AppData\Local\Temp\atlas-e1216-mobile-comprehension-local`
passed for desktop, mobile, and residential-detail cameras. The mobile tray
height reported about 180px, with recovery CTA, boundary copy, and source note
all visible in the first viewport. Local `node
scripts\verify-engine-beta-coverage.mjs` passed against
`http://127.0.0.1:8792` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-e1216-engine-beta-coverage-local`.
Focused `git diff --check` on the touched UI/verifier/command-board files
passed with only Windows LF-to-CRLF warnings.

Screenshot read:
The hidden draft mobile state now feels less like a bulky error panel and more
like a compact map-native prep state. It still honestly blocks Anaheim
playability and keeps the recovery action visible.

## Entry 057

Quest:
Pre-Alpha 0.1E Provider Boundary Update.

What changed:
Adapted the Axiom handoff pack into the existing RC architecture instead of
copying a parallel `shared/contracts` or `server/src/geo` stack. The current
`@atlas/geo` adapter boundary now carries explicit provider usage policy flags
on geocode, nearby place, aggregate, and route signal contracts. Google-backed
signals default to non-renderable, non-cacheable, and non-readiness; mock lookup
signals remain runtime-cacheable for smoke checks but still cannot promote
coverage or become permanent voxel map geometry.

Added architecture/update artifacts for the named update ladder:
`docs/architecture/*`, `docs/updates/*`, and `artifacts/current-update.json`.
Added focused verifiers for no Google/provider imports in renderer code,
provider policy defaults, and MCP tool result shape. Updated the RC split guard
with a `provider-boundary` mode and allowed the same focused files under the
existing `engine-beta-data` envelope.

Skipped:
No renderer visual work, no Anaheim/Ontario public promotion, no DB,
persistence, Hosted Clawd, Stripe, XP, evidence, OAuth, automation, reports,
exports, package/lock/env drift, or provider-derived scene geometry.

Verification:
`node --check scripts\verify-no-google-in-renderer.mjs` passed. `node --check
scripts\verify-provider-boundaries.mjs` passed. `node --check
scripts\verify-tool-result-shape.mjs` passed. `node
scripts\verify-no-google-in-renderer.mjs` passed with zero blockers. `node
scripts\verify-provider-boundaries.mjs` passed with zero blockers and checks
for `sourceConfidence`. `node scripts\verify-tool-result-shape.mjs` passed
with zero blockers. `pnpm test:core` passed, 13 files / 50 tests. `pnpm
typecheck:starter` passed. `pnpm build:starter` passed. Local server-backed
`pnpm verify:mcp`, `pnpm verify:submission`, `pnpm verify:preview:http`, and
`node scripts\verify-world-lookup-boundary.mjs` passed. `node
scripts\verify-chatgpt-entry-surface.mjs --json-out
C:\Users\mzwin\AppData\Local\Temp\atlas-01e-chatgpt-entry-proof.json` passed:
seven tools stable, lookup is not saved/not coverage proof, Anaheim is not
playable, and product text has no internal implementation language. Strict
`engine-beta-data` split guard passed with 92 files and zero blockers. Narrow
`provider-boundary` mode correctly identified only the 0.1E subset as allowed
and blocked the broader already-dirty Engine Beta tree.

## Entry 058

Quest:
Pre-Alpha 0.3E Object Authorship Renderer Artifact.

What changed:
Added a bounded production renderer object-authorship pass on top of the 0.2E
roads/roofs work. Sprite-backed rowhome and strip-store modules now get native
foundation, contact, stoop/apron, awning underside, and parapet fit details so
they sit in the map instead of reading like loose stickers. Primitive
residential modules get deterministic cottage/ranch variation through dormer,
porch, garage-face, and side-entry construction. Gym/service, apartment, and
Eastvale Core civic buildings get stronger roof, base, entry, side-face, and
landmark hierarchy details.

Skipped:
No provider changes, Google usage, public Anaheim/Ontario promotion, new
product states, backend routes, persistence, Hosted Clawd, Stripe, XP,
evidence, OAuth, automation, reports, exports, cars, humans, filler props,
dashboard panels, glows, or broad renderer rewrite.

Verification:
`pnpm test:core` passed, 13 files / 51 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local `pnpm verify:preview:http` passed
against `http://127.0.0.1:8807/preview`. Local `node
scripts\verify-engine-beta-coverage.mjs` passed against
`http://127.0.0.1:8807` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-03e-object-authorship-final`.
`node scripts\verify-roads-roofs-scene-grammar.mjs` passed. `node
scripts\verify-object-authorship-scene-grammar.mjs` passed. Strict
`engine-beta-data` split guard passed with 94 files and zero blockers.
Focused `git diff --check` on the touched renderer/docs files passed with only
Windows LF-to-CRLF warnings.

## Entry 059

Quest:
Pre-Alpha 0.4E Terrain / Parcel World Composition.

What changed:
Added typed terrain and lot composition grammar for the public Riverside proof
cell. The compiler now distinguishes `neighborhood_parcel_field`,
`landmark_civic_ground`, and `residential_yard_grid` from quiet background
grass and generic pads. The renderer consumes those profiles to add restrained
parcel facets, civic ground bands, residential yard/setback structure,
forecourt seams, lot-to-road walk joins, and stronger parcel contact without
adding props or new places.

Skipped:
No object micro-detail pass, public Anaheim/Ontario promotion, provider
changes, Google usage, backend routes, product state, persistence, Hosted
Clawd, Stripe, XP, evidence, OAuth, automation, reports, exports, cars,
humans, filler props, dashboard panels, labels, glows, or broad renderer
rewrite.

Verification:
`pnpm test:core` passed, 13 files / 52 tests. `pnpm typecheck:starter`
passed. `pnpm build:starter` passed. Local `pnpm verify:preview:http` passed
against `http://127.0.0.1:8811/preview`. Local `node
scripts\verify-engine-beta-coverage.mjs` passed against
`http://127.0.0.1:8811` with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-04e-terrain-parcel-composition-final`.
`node scripts\verify-roads-roofs-scene-grammar.mjs` passed. `node
scripts\verify-object-authorship-scene-grammar.mjs` passed. `node
scripts\verify-terrain-parcel-composition.mjs` passed. Strict
`engine-beta-data` split guard passed with 95 files and zero blockers.
Focused `git diff --check` on touched core/renderer/docs files passed with
only Windows LF-to-CRLF warnings.

## Entry 060

Quest:
Pre-Alpha 0.6F Engine Diagnostics / Theory Harness.

What changed:
Added a core `CityWorldScene` diagnostics API so Atlas can measure engine
quality instead of relying only on screenshots. The report covers terrain
massing distribution, terrain-authorship coverage, empty-board ratio, focal
feature density, building/lot and lot/road contact, object-family coverage,
residential clone pressure, no-label anchor counts, sprite/fallback coverage,
hidden-draft safety, and hard boundary blockers. Added
`scripts/debug-city-world-engine.mjs`, which reports Riverside playable, Orange
shell, Unknown/L0, Anaheim hidden draft, and Ontario hidden draft scenarios and
writes JSON plus Markdown summaries. Added a dev-only renderer overlay behind
`?atlasDebug=engine`; it marks terrain chunks, road lines, lot footprints,
object families, and anchors without changing public UI by default.

Diagnostic read:
The first report passed with zero hard blockers. Riverside metrics were:
terrain massing coverage about 33.4%, empty-board ratio about 33.5%,
first-viewport composition floor about 57.2% across desktop, mobile, and
residential-detail cameras, building/lot contact 100%, lot/road contact about
80.5%, home clone pressure about 20%, and `terrain_massing` as the weakest
playable axis. Orange remains shell-only, Unknown/L0 compiles no scene, and
Anaheim/Ontario remain hidden draft/non-playable.

Skipped:
No new visual polish pass, no public Anaheim/Ontario promotion, no provider
scene geometry, no server route/tool-list changes, no persistence, Hosted
Clawd, Stripe, XP, evidence, OAuth, automation, reports, exports, cars, humans,
or decorative prop reintroduction.

Verification:
`pnpm --dir packages/core test` passed, 13 files / 56 tests. `pnpm
typecheck:starter` passed. `pnpm build:starter` passed. Local `pnpm
verify:preview:http` passed against `http://127.0.0.1:8815/preview`. `node
--check scripts\debug-city-world-engine.mjs` passed. `node
scripts\debug-city-world-engine.mjs --out
C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-06f-engine-diagnostics-final
--json-only` passed and wrote `city-world-engine-diagnostics.json` plus
`city-world-engine-diagnostics.md`. The 0.1E-0.6E verifier stack passed,
including terrain chunk massing, terrain elevation/chunk grammar, terrain
parcel composition, object authorship, roads/roofs, provider isolation,
provider boundaries, and tool-result shape. Local Engine Beta coverage browser
proof passed against `http://127.0.0.1:8815`, and `?atlasDebug=engine`
product-loop proof passed with debug overlay screenshots. Strict
`engine-beta-data` split guard passed with zero blockers and zero unknowns.
Focused `git diff --check` passed with only Windows LF-to-CRLF warnings on
docs.

## Entry 061

Quest:
Pre-Alpha 0.7E Terrain / World-Edge Massing Correction.

What changed:
Expanded the public Riverside terrain massing fields using existing
`CityWorldScene` grammar. The compiler now treats broader residential shelves,
Eastvale Core plinth ground, commercial apron, park basin, waterfront edge, and
outer world boundary as structural massing instead of quiet flat board. The
renderer now draws stronger edge-side faces, darker underside strata, and
cleaner shelf breaks while keeping interior shelves quieter to avoid fake
visual noise. Core diagnostics tests now lock the 0.7E floor for empty-board
ratio, mobile/desktop viewport composition, and contact coverage.

Metric result:
The debug report passed with zero hard blockers. Riverside moved from the 0.6F
baseline to terrain massing coverage about 67.4%, empty-board ratio about
20.2%, mobile first-viewport score about 71.9%, desktop score about 96.9%,
residential-detail score about 77.5%, building/lot contact 100%, lot/road
contact about 80.5%, and home clone pressure about 20%.

Skipped:
No new objects, cars, humans, decorative props, labels, panels, glows, product
state, MCP tool-list changes, server/provider route changes, Google/provider
geometry, public Anaheim/Ontario promotion, persistence, Hosted Clawd, Stripe,
XP, evidence, OAuth, automation, reports, or exports.

Verification:
`pnpm --dir packages/core test` passed, 13 files / 56 tests. `pnpm
typecheck:starter` passed. `pnpm build:starter` passed. Local `pnpm
verify:preview:http` passed against `http://127.0.0.1:8816/preview`. `node
scripts\debug-city-world-engine.mjs --out
C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-07e-terrain-massing-diagnostics
--json-only` passed. The 0.1E-0.6E verifier stack passed, including terrain
chunk massing, terrain elevation/chunk grammar, terrain parcel composition,
object authorship, roads/roofs, provider isolation, provider boundaries, and
tool-result shape. Local Engine Beta coverage browser proof passed against
`http://127.0.0.1:8816`, with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-07e-terrain-massing-coverage`.
`?atlasDebug=engine` product-loop proof passed with screenshots under
`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-07e-terrain-massing-debug-overlay`.
Strict `engine-beta-data` split guard passed with zero blockers and zero
unknowns.

Crew gates:
Lumen PASS from visual-engine standpoint: the massing improvement is visible
and not prop noise, with a P1 note that broad green fields can still read a bit
like transparent overlay. Mira PASS from product/mobile standpoint: map-first
read, tray, switcher, session-only loop, shell recovery, and no internal debug
language held. Forge SAFE from split/provider standpoint: strict split,
provider guard, provider boundary, and tool result shape all had zero blockers.

## Entry 062

Quest:
Forge engine/backend organization brief for Axiom.

What changed:
Added `docs/ATLAS_ENGINE_BACKEND_OPERATING_BRIEF.md`, a buildable operating
brief that frames Atlas as a county-to-scene engine. It maps the live stack
from service surface, world identity, provider boundary, candidate promotion
packets, compiler, diagnostics, renderer, and split guard into clear owner
lanes. It also turns engine references into Atlas-specific rules and defines a
near-term backend/engine ladder: mobile occlusion budget, source-to-cell
assignment, scene budget preflight, object face grammar, and provider promotion
preflight.

Skipped:
No runtime code, server route, provider adapter, renderer behavior, package,
lockfile, env, DB, Hosted Clawd, persistence, Stripe, XP, evidence, OAuth,
automation, reports, exports, public Anaheim/Ontario promotion, staging, or
deploy changes.

Verification:
Docs-only verification with `git diff --check` on the touched docs passed.

## Entry 063

Quest:
Pre-Alpha 0.14E Face Orientation / Source-Art Contrast Gate.

What changed:
Extended `CityWorldScene` diagnostics with object face/source-art metrics:
`faceOrientationCoverageRatio`, `roofSideSeparationRatio`,
`facadeContrastCoverageRatio`, `objectSignatureCoverageRatio`,
`weakestObjectFamily`, `hiddenAnchorContrastScore`, and
`weakestHiddenAnchor`. Added `scripts/verify-face-orientation-source-contrast.mjs`
as the focused 0.14E gate and wired the existing object-authorship verifier and
strict RC split guard to recognize it.

Metric result:
Riverside remains green on 0.10E terrain floors and now reports
face/orientation, roof-side, facade-contrast, and object-signature coverage at
1.0. The verifier names `civic_landmark` as the weakest public object family,
which makes Eastvale Core the next public object-art target if the next slice
stays public. Anaheim stays hidden/non-playable and reports
`hiddenAnchorContrastScore: 0.851`, with `angel-stadium` as the weakest hidden
anchor for any later source-art pass.

Skipped:
No renderer art, public UI, MCP tool-list changes, server/provider route
changes, Google/provider geometry, GameBlocks/Three/Rapier import, public
Anaheim/Ontario promotion, persistence, Hosted Clawd, Stripe, XP, evidence,
OAuth, automation, reports, or exports.

Verification:
`pnpm --dir packages/core test` passed, 15 files / 64 tests. `pnpm build:core`
passed. `pnpm typecheck:starter` passed. `pnpm build:starter` passed. Local
`pnpm verify:preview:http` passed after starting the normal dev server on
`127.0.0.1:8787`; the server was stopped after the smoke. `node
scripts\verify-face-orientation-source-contrast.mjs --json-only` passed. `node
scripts\verify-object-authorship-scene-grammar.mjs --json-only` passed. `node
scripts\debug-city-world-engine.mjs --json-only` passed. `node
scripts\verify-worldbasis-terrain-sampler.mjs --json-only` passed. `node
scripts\verify-cityworld-mobile-occlusion.mjs --json-only` passed. `node
scripts\verify-no-google-in-renderer.mjs --json-only` passed. `node
scripts\verify-provider-boundaries.mjs --json-only` passed. `node
scripts\verify-tool-result-shape.mjs --json-only` passed. Strict
`engine-beta-data` split guard passed with 134 files, zero blockers, and zero
unknowns. Focused `git diff --check` passed with only Windows LF-to-CRLF
warnings on existing touched docs/scripts/tests.

## Entry 064

Quest:
Pre-Alpha 0.15E Civic / Venue Object-Kit Contract.

What changed:
Added a reusable civic/venue stress-cell contract to `CityWorldScene`
diagnostics. Public Riverside now reports `eastvale-core-civic-landmark` as a
`public_civic_landmark` stress cell. Hidden Anaheim now reports
`angel-stadium-venue-anchor` as a `hidden_venue_anchor` stress cell. Both use
the same score model: silhouette, hierarchy, mobile readiness, and no-label
readiness. Ontario remains a hidden control with no civic/venue stress-cell
classification.

Metric result:
Eastvale Core currently scores `0.955`; Angel Stadium currently scores `0.970`.
That makes the next public engine move Eastvale Core authorship, not more
generic polish and not public Anaheim promotion.

Skipped:
No renderer art pass, public UI, MCP tool-list change, server/provider route
change, Google/provider geometry, GameBlocks/Three/Rapier import, public
Anaheim/Ontario promotion, persistence, Hosted Clawd, Stripe, XP, evidence,
OAuth, automation, reports, exports, staging, or deploy.

Verification:
`pnpm --dir packages/core test` passed, 15 files / 64 tests. `pnpm build:core`
passed. `pnpm typecheck:starter` passed. `pnpm build:starter` passed. `node
scripts\verify-civic-venue-object-kit-contract.mjs --json-only` passed. `node
scripts\verify-face-orientation-source-contrast.mjs --json-only` passed. `node
scripts\verify-object-authorship-scene-grammar.mjs --json-only` passed. `node
scripts\debug-city-world-engine.mjs --json-only` passed. `node
scripts\verify-cityworld-mobile-occlusion.mjs --json-only` passed. `node
scripts\verify-no-google-in-renderer.mjs --json-only` passed. `node
scripts\verify-provider-boundaries.mjs --json-only` passed. `node
scripts\verify-tool-result-shape.mjs --json-only` passed. Strict
`engine-beta-data` split guard passed with 135 files, zero blockers, and zero
unknowns. Focused `git diff --check` passed with only Windows LF-to-CRLF
warnings on existing touched docs/scripts/tests.

## Entry 065

Quest:
Pre-Alpha 0.16E Public Civic Landmark Authorship Pass.

What changed:
Moved the civic landmark lane from a diagnostic contract into the production
Pixi renderer. `CityWorldRenderer` now applies a reusable public civic landmark
object-kit pass for civic base hierarchy, roof hierarchy, facade rhythm, and an
Eastvale Core stress-cell signature. Added
`scripts/verify-public-civic-landmark-authorship.mjs` so the pass is protected
by renderer-hook checks, diagnostic floors, public UI leakage checks, and the
existing terrain floors.

Why:
0.15E named Eastvale Core as the lower public civic/venue stress cell. The next
visible engine step was not more hidden Anaheim work; it was making the public
Riverside proof cell read more like an authored civic landmark without labels,
props, panels, or fake activity.

Skipped:
No public UI, MCP tool-list change, server/provider route change,
Google/provider geometry, GameBlocks/Three/Rapier import, public
Anaheim/Ontario promotion, persistence, Hosted Clawd, Stripe, XP, evidence,
OAuth, automation, reports, exports, staging, or deploy.

Verification:
`node --check scripts\verify-public-civic-landmark-authorship.mjs` passed.
`pnpm --dir packages/core test` passed, 15 files / 64 tests. `pnpm build:core`
passed. `pnpm typecheck:starter` passed. `pnpm build:starter` passed. `node
scripts\verify-public-civic-landmark-authorship.mjs --json-only` passed. `node
scripts\verify-civic-venue-object-kit-contract.mjs --json-only` passed. `node
scripts\verify-object-authorship-scene-grammar.mjs --json-only` passed. `node
scripts\debug-city-world-engine.mjs --json-only` passed. `node
scripts\verify-cityworld-mobile-occlusion.mjs --json-only` passed. Local
`pnpm verify:preview:http` passed against `http://127.0.0.1:8788/preview`.
Local `node scripts\verify-engine-beta-coverage.mjs` passed against
`http://127.0.0.1:8788`, including Riverside product loop,
residential-detail, Orange shell, Unknown/L0, county switcher, MCP,
submission, and preview. Temporary server was stopped after verification.

Screenshots:
- `C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-016e-public-civic-local\riverside\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-016e-public-civic-local\riverside\alpha-product-loop-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-016e-public-civic-local\residential-detail\alpha-product-loop-desktop-1280x720.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-016e-public-civic-local\residential-detail\alpha-product-loop-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-016e-public-civic-local\orange-shell\shell-county-widget-mobile-390x844.png`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-016e-public-civic-local\unsupported\shell-county-widget-mobile-390x844.png`

Visual read:
Accept as a visible public civic-landmark improvement, not final art approval.
Desktop Eastvale Core has clearer civic entry, roof cap, facade rhythm, and
plinth hierarchy. Mobile still keeps the map, switcher, tray, note input, and
pin controls readable. The civic object is more legible above the tray, but the
overall map still needs higher-quality object art and less prototype-board feel
before any broader public-quality claim.

## Entry 066

Quest:
Pre-Alpha 0.17E Scout Drop Alpha Loop Boundary.

What changed:
Added typed `alphaBoundary` data to Scout Drop and Campaign Preview results.
Scout Drop now explicitly points to `preview_campaign_engine` as the next free
Alpha action. Campaign Preview points to `get_upgrade_options` for future saved
Hosted Clawd state. Both states declare `session_only_alpha`, no saves, no
action execution, no XP, and Hosted Clawd required before saved state. Server
tool output schemas and tool text now expose that boundary, and MCP/submission
verifiers protect it.

Why:
The product promise is not only visual. The Alpha loop needs to say what Clawd
does now: temporary scouting and manual campaign preview. It must not imply
posting, DMs, paid ads, saved campaigns, evidence, XP, automation, reports, or
exports.

Skipped:
No new MCP tools, public UI surface, persistence, Hosted Clawd implementation,
Stripe, XP, evidence, OAuth, automation, reports, exports, provider geometry,
public Anaheim/Ontario promotion, staging, or deploy.

Verification:
- `node --check scripts\verify-scout-campaign-alpha-loop.mjs` passed.
- `node --check scripts\verify-alpha-rc-split.mjs` passed.
- `pnpm --dir packages/core test` passed, 15 files / 64 tests.
- `pnpm build:core` passed.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `node scripts\verify-scout-campaign-alpha-loop.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-no-google-in-renderer.mjs --json-only` passed.
- Local preview on `http://127.0.0.1:8789/preview` passed `pnpm verify:preview:http`.
- Local MCP on `http://127.0.0.1:8789/mcp` passed `node scripts\verify-mcp-flow.mjs`.
- Fresh local MCP on `http://127.0.0.1:8789/mcp` passed `pnpm verify:submission`.
- Local coverage/browser proof passed via `node scripts\verify-engine-beta-coverage.mjs`.
- Screenshot root: `C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-017e-scout-alpha-loop-local`.
- Strict split guard passed: `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`, 143 files, 0 blockers, 0 unknowns.
- Focused `git diff --check` passed with Windows LF-to-CRLF warnings only.

## Entry 067

Quest:
0.18A Alpha RC Freeze Packet.

What changed:
Recorded the current RC as the Alpha deploy candidate in
`docs/ALPHA_FUNCTIONAL_EVIDENCE_PACKET.md`. No product behavior was added in
this slice. The work was proof, split safety, and release documentation.

Why:
0.17E made the Scout Drop and Campaign Preview loop explicit enough for public
Alpha. The next correct step was to freeze and prove the RC rather than start
another engine or art pass.

Skipped:
No renderer work, public UI changes, MCP tool-list changes, public
Anaheim/Ontario promotion, provider geometry, persistence, Hosted Clawd,
Stripe, XP, evidence, OAuth, automation, reports, exports, staging, or deploy
inside the freeze packet.

Verification:
- `pnpm --dir packages/core test` passed, 15 files / 64 tests.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `node scripts\verify-scout-campaign-alpha-loop.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-no-google-in-renderer.mjs --json-only` passed.
- Strict split guard passed: `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`, 143 files, 0 blockers, 0 unknowns.
- Local `pnpm verify:preview:http` passed against `http://127.0.0.1:8787/preview`, preview bytes 928473.
- Local `pnpm verify:mcp` passed against `http://127.0.0.1:8787/mcp`, 7 tools.
- Local `pnpm verify:submission` passed against `http://127.0.0.1:8787/mcp`, 7 tools.
- Local `node scripts\verify-engine-beta-coverage.mjs` passed against `http://127.0.0.1:8787`.
- Screenshot root: `C:\Users\mzwin\AppData\Local\Temp\atlas-alpha-completion-local-proof`.
- Temporary local server was stopped after verification.

## Entry 068

Quest:
0.19A Railway Deploy and 0.20A Public Alpha Proof.

What changed:
Deployed the current Alpha RC from
`C:\Users\mzwin\Documents\Atlas-alpha-path-b-rc` to Railway production service
`atlas-backend`, then ran public preview, MCP, submission, and browser coverage
proof against the Railway URL. Updated
`docs/ALPHA_FUNCTIONAL_EVIDENCE_PACKET.md` with public URL, deploy evidence,
public verifier results, screenshot root, and the public coverage cache note.

Why:
The local RC freeze was green. The product needed a public proof packet, not
another feature or art slice.

Skipped:
No env mutation, DB, persistence, Hosted Clawd, Stripe, XP, evidence, OAuth,
automation, reports, exports, public Anaheim/Ontario promotion, provider
geometry, MCP tool-list change, or new product behavior.

Verification:
- Railway deploy command succeeded: `railway up --detach --message "Atlas Alpha 0.18A RC freeze"`.
- Railway build completed and healthcheck passed on `/health`.
- Public `pnpm verify:preview:http` passed against `https://atlas-backend-production-e6fc.up.railway.app/preview`, preview bytes 928473.
- Public `pnpm verify:mcp` passed against `https://atlas-backend-production-e6fc.up.railway.app/mcp`, 7 tools.
- Public `pnpm verify:submission` passed against `https://atlas-backend-production-e6fc.up.railway.app/mcp`, 7 tools.
- Public `node scripts\verify-engine-beta-coverage.mjs` passed against `https://atlas-backend-production-e6fc.up.railway.app`.
- Public coverage: 58 indexed California counties, 1 playable county, 57 shell counties, Riverside `L2_CURATED_DISTRICT`, Orange `L1_COUNTY_SHELL`, Unknown/L0 unsupported.
- Public screenshot root: `C:\Users\mzwin\AppData\Local\Temp\atlas-alpha-completion-public-proof`.

## Entry 069

Quest:
0.21A Alpha Handoff Lock and 0.22E Public Product Entry Compression.

What changed:
Locked the public Alpha baseline into
`docs/ALPHA_FUNCTIONAL_EVIDENCE_PACKET.md` and tightened the public entry rail
copy. The county switcher now says `Play Riverside now. Browse CA shells.
Lookup without saving.` The lookup action still sends the stronger boundary to
ChatGPT: lookup-only, not saved, and not coverage proof. Shell and unsupported
coverage copy was compressed so mobile recovery remains the main action.

Why:
Post-Alpha work is Engine Beta. Before hidden Anaheim readiness or more voxel
engine work, the live ChatGPT app needs a sharper three-second entry read
without changing tools, public coverage, persistence, or playability.

Skipped:
No MCP tool-list change, public Anaheim/Ontario promotion, renderer art pass,
provider geometry, DB, Hosted Clawd, persistence, Stripe, XP, evidence, OAuth,
automation, reports, or exports.

Verification:
Local proof passed:
- `pnpm --dir packages/core test` passed, 15 files / 64 tests.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- Local `pnpm verify:preview:http` passed against
  `http://127.0.0.1:8787/preview`, preview bytes 928542.
- Local `pnpm verify:mcp` passed against `http://127.0.0.1:8787/mcp`, 7 tools.
- Local `pnpm verify:submission` passed against `http://127.0.0.1:8787/mcp`,
  7 tools.
- `node scripts\verify-county-switcher.mjs --url
  http://127.0.0.1:8787/preview --screenshots
  C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-022e-entry-compression-local\county-switcher`
  passed desktop and mobile.
- `node scripts\verify-shell-county-widget.mjs` passed for `orange-ca`
  `L1_COUNTY_SHELL` and `made-up-ca` `L0_UNSUPPORTED`, desktop and mobile.
- Local `node scripts\verify-engine-beta-coverage.mjs` passed.
- Provider/tool guards passed:
  `verify-no-google-in-renderer`, `verify-provider-boundaries`, and
  `verify-tool-result-shape`.
- Strict split guard passed: `node scripts\verify-alpha-rc-split.mjs
  --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`,
  143 files, 0 blockers, 0 unknowns.

Screenshot root:
`C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-022e-entry-compression-local`.

Public deploy/proof passed:
- Railway deploy command succeeded: `railway up --detach --message "Atlas 0.22E
  public entry compression"`.
- Railway build completed; deployment logs show the server listening on
  `http://localhost:8080/mcp`.
- Public `pnpm verify:preview:http` passed against
  `https://atlas-backend-production-e6fc.up.railway.app/preview`, preview bytes
  928542.
- Public `pnpm verify:mcp` passed against
  `https://atlas-backend-production-e6fc.up.railway.app/mcp`, 7 tools.
- Public `pnpm verify:submission` passed against
  `https://atlas-backend-production-e6fc.up.railway.app/mcp`, 7 tools.
- Public `node scripts\verify-county-switcher.mjs` passed desktop and mobile.
- Public `node scripts\verify-engine-beta-coverage.mjs` passed: 58 indexed CA
  counties, 1 playable, 57 shells, Riverside `L2_CURATED_DISTRICT`, Orange
  `L1_COUNTY_SHELL`, Unknown/L0 unsupported.
- Public screenshot root:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-022e-entry-compression-public`.

## Entry 070

Quest:
0.23E Hidden Venue Authorship Pass and Axiom wakeup reliability.

What changed:
Advanced the current quest pointer from the completed 0.22E public entry
baseline to 0.23E hidden venue authorship. Refreshed the Anaheim readiness
export at `artifacts/second-district-readiness/latest/anaheim-candidate`,
including `readiness-aggregate.json`, `promotion-packet.json`,
`source-to-scene-trace.json`, and `release-status.json`. Added a verifier-backed
thread-bridge fallback rule to `docs/AXIOM_BIG4_WAKEUP_PROTOCOL.md` and
`scripts/verify-big4-wakeup-protocol.mjs`.

Why:
The full-power Axiom wakeup could not access the real Forge, Lumen, and Mira
thread read/send tools in this session. Atlas still needed artifact movement,
but not fake worker state. The safe local move was to refresh the machine-
readable readiness export, keep Anaheim blocked from promotion, and make future
wakeups report missing thread tools explicitly.

Skipped:
No real worker assignments were sent because the thread bridge was unavailable.
No public Anaheim/Ontario promotion, MCP tool-list change, renderer art change,
provider geometry, DB, Hosted Clawd, persistence, Stripe, XP, evidence, OAuth,
automation product feature, user-facing report/export, staging, commit, deploy,
Railway mutation, GitHub mutation, package drift, or env drift.

Verification:
- `node scripts\verify-big4-artifact-packets.mjs --json-only` passed, 4 packets,
  0 blockers.
- `node scripts\verify-second-district-readiness.mjs --district anaheim-candidate --json-only`
  passed with `readyForPlayablePromotion: false`.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed, 143 files, 0 blockers, 0 unknowns.
- `node scripts\export-second-district-readiness-artifact.mjs --district anaheim-candidate --out artifacts\second-district-readiness\latest --json-only`
  wrote the readiness export and kept `readyForPlayablePromotion: false`.
- `node scripts\verify-chatgpt-entry-surface.mjs --district anaheim-candidate --json-only`
  was not a valid verifier invocation; that script uses `--json-out` and needs a
  live MCP server.

## Entry 071

Quest:
0.26E Public Engine Beta Quality Pass.

What changed:
Picked public Riverside terrain/world-edge readability as the single measured
axis because 0.25E keeps Anaheim blocked from public promotion and diagnostics
still named terrain massing as the weakest public playable axis. Extended the
existing public world-edge shelf grammar from a thin one-tile rim into a
three-tile structural rim for grass terrain, while preserving water, park,
plaza, shell, and hidden-draft behavior. Locked the stronger public terrain
floors in the compiler test and terrain verifier.

Metric movement:
- `terrainMassingCoverageRatio`: `0.796` -> `0.899`.
- `emptyBoardRatio`: `0.151` -> `0.056`.
- `firstViewportCompositionScore`: `0.754` -> `0.775`.
- `chunkEdgeReadabilityFloorScore`: `0.668` -> `0.761`.
- Mobile `chunkEdgeReadabilityScore`: `0.668` -> `0.783`.
- Building/lot contact stayed `1.0`; lot/road contact stayed `0.805`.

Files changed:
- `packages/core/src/voxel/cityWorldCompiler.ts`
- `packages/core/test/city-world-compiler.test.ts`
- `scripts/verify-terrain-chunk-massing-grammar.mjs`
- `artifacts/current-update.json`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `docs/updates/ATLAS_RELEASE_LADDER.md`

Skipped:
No public Anaheim/Ontario promotion, MCP tool-list change, public UI change,
provider geometry, Google import, renderer rewrite, GameBlocks/VoxCity runtime
dependency, cars, humans, decorative props, panels, DB, Hosted Clawd,
persistence, Stripe, XP, evidence, OAuth, automation, reports, exports, deploy,
package drift, or env drift.

Verification:
- `pnpm build:core` passed.
- `pnpm --dir packages/core test -- city-world-compiler` passed, 16 files / 67
  tests.
- `node scripts\debug-city-world-engine.mjs --json-only` passed, 0 hard
  blockers.
- `node scripts\verify-terrain-chunk-massing-grammar.mjs --json-only` passed
  with `postAlphaQualityFloor:
  postalpha-0.26e-public-engine-beta-quality-pass`.
- `node scripts\verify-object-authorship-scene-grammar.mjs --json-only` passed.

## Entry 072

Quest:
Atlas loop-engineering adaptation and Captain Light notes reconciliation.

What changed:
Read the updated RC docs, loop files, Captain Light and Full Power automation
prompts, automation memory, and latest small chunks from Mira, Forge, and Lumen.
Adapted the local loop contract so future wakeups must read real worker threads
when the bridge is available, record missing bridge access as a blocker when it
is not, and avoid local Mira/Forge/Lumen clones. Added the loop files and
`scripts/verify-atlas-loop-readiness.mjs` to the strict `engine-beta-data` split
guard envelope. Updated the existing Codex automations so both Light and
Full-Power wakeups read the loop contract and readiness verifier before acting.

Why:
The scheduled wakeups existed and pointed at the RC worktree, but the repo-side
loop readiness verifier could not pass because the strict split guard treated
the new loop files as unknown. The loop also needed to reflect the current
thread bridge availability instead of the stale Captain Light fallback state.

Skipped:
No runtime product behavior, renderer behavior, MCP tool list, public
Anaheim/Ontario exposure, Railway mutation, staging, commit, deploy,
package/env drift, persistence, Hosted Clawd, Stripe, XP, evidence, OAuth,
automation product feature, reports, or exports.

## Entry 073

Quest:
0.40E Engine Quality Axis Review / Next Target Selection.

What changed:
Reworked `scripts/select-engine-quality-axis.mjs` into the current 0.40E
selector. The selector now runs the current 0.39E evidence stack, scores seven
candidate axes, blocks green or parked lanes, and writes
`artifacts/engine-quality-axis/postalpha-0.40e-next-target-selection.json`.
Updated the current update manifest, source-of-truth drift verifier, release
ladder, decisions, and next-quest docs to the selector result.

Selector result:
- Selected axis: `provider_normalization_preflight`.
- Recommended next quest:
  `0.41E Provider Normalization Preflight / Lookup-to-Scene Boundary Contract`.
- Blocked public object identity continuation because the 0.39E civic/service
  verifier is green and no named blocker exists.
- Blocked terrain/world-edge because terrain massing, empty-board,
  first-viewport, and chunk-edge floors are green.
- Blocked mobile entry density because the playable mobile budget and
  readability floors are green.
- Blocked hidden second-district readiness because Anaheim remains
  non-promotion-ready with 11 blockers.
- Blocked commerce repeat unless a human names one exact Plaza Row blocker.

Skipped:
No 0.41E implementation, renderer geometry, UI redesign, MCP tool-list change,
server route change, DB implementation, provider geometry, live provider
normalization, public Anaheim/Ontario promotion, Hosted Clawd, Stripe, OAuth,
XP, evidence, automation, reports, exports, cars, humans, props, panels, glows,
or label crutches.

Verification:
- `node --check scripts\select-engine-quality-axis.mjs` passed.
- `node --check scripts\verify-atlas-source-of-truth-drift.mjs` passed.
- `node scripts\select-engine-quality-axis.mjs --json-only` passed with
  `selectedAxis: provider_normalization_preflight`.
- `node scripts\select-engine-quality-axis.mjs --out artifacts\engine-quality-axis --json-only`
  passed and wrote the 0.40E selector artifact.
- `node scripts\verify-atlas-source-of-truth-drift.mjs --json-only` passed with
  0 blockers.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed with 20 files, 0 blockers, and 0 unknowns.

## Entry 074

Quest:
0.41E Provider Normalization Preflight / Lookup-to-Scene Boundary Contract.

What changed:
Added a typed provider-normalization preflight contract in `@atlas/geo`,
centralized the Google Nearby Search field-mask allowlist, and made the Google
adapter consume that allowlist. Removed model-visible provider IDs from
`lookup_world_places`: `resolvedLocation.placeId` is no longer in the output
schema, and place summaries now use Atlas-owned `lookup-*` ids. Extended
provider readiness with hard-false geometry, readiness, public-quality, and raw
payload flags. Added `scripts/verify-provider-normalization-preflight.mjs` and
tightened existing provider/tool lookup guards.

Why:
The 0.40E selector picked provider normalization preflight because public
object, terrain, mobile, commerce, and product-entry gates were green enough.
The risk was provider lookup quietly becoming scene geometry, coverage
readiness, or public playability. 0.41E keeps lookup useful but bounded.

Skipped:
No provider-created geometry, public Anaheim/Ontario exposure, DB persistence,
migrations, new MCP tools, paid/Stripe/OAuth/Hosted Clawd, renderer/UI change,
coverage-readiness promotion, or CityWorldScene geometry from provider lookup.

Verification:
- `node --check scripts\verify-provider-normalization-preflight.mjs` passed.
- `node scripts\verify-provider-normalization-preflight.mjs --json-only`
  passed with 47 checks and 0 blockers.
- `pnpm --dir packages/core test -- national-world-service` passed, 19 files /
  85 tests.
- `pnpm --dir packages/geo build` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.

## Entry 075

Quest:
0.42E Provider Lookup Runtime Boundary Proof preparation.

What changed:
Prepared the next runtime-proof slice without increasing scope. Added
`artifacts/provider-runtime-boundary/postalpha-0.42e-runtime-proof-plan.json`
and `docs/updates/postalpha-0.42e-provider-lookup-runtime-boundary-proof.md`.
Updated `docs/NEXT_QUESTS.md` and the release ladder to point 0.42E at the
existing runtime verifier, `scripts/verify-world-lookup-boundary.mjs`.

Scope decision:
Do not increase scope. 0.42E should start the local server and prove the 0.41E
provider boundary through REST and MCP calls. It should not add live provider
normalization, provider-created geometry, DB persistence, renderer/UI work,
public Anaheim/Ontario, new MCP tools, or paid scope.

Skipped:
No 0.42E execution, server start, runtime proof, provider call, DB, migration,
renderer/UI change, new MCP tool, public Anaheim/Ontario exposure, Hosted
Clawd, Stripe, OAuth, XP, evidence, automation, reports, or exports.

## Entry 076

Quest:
0.42E Provider Lookup Runtime Boundary Proof.

What changed:
Executed the prepared 0.42E runtime boundary proof against a local server at
`http://127.0.0.1:8787`. No runtime code changes were needed. The proof
confirmed REST and MCP lookup paths return sanitized Atlas-normalized
`structuredContent`, use Atlas-owned `lookup-*` ids, keep provider readiness in
`lookup_only`, and do not promote coverage or create scene geometry.

Runtime result:
- REST `/api/world/lookup` returned 5 mock places, first call cache miss and
  second call cache hit.
- MCP `lookup_world_places` passed the same boundary and proved cached repeat
  behavior.
- Orange remained `L1_COUNTY_SHELL` after lookup.
- Coverage remained 1 playable county, 0 provider-normalized counties, and 0
  public-quality counties.
- The seven Alpha MCP tools stayed unchanged.

Skipped:
No provider-created geometry, public Anaheim/Ontario exposure, DB persistence,
migrations, new MCP tools, paid/Stripe/OAuth/Hosted Clawd, renderer/UI change,
coverage-readiness promotion, or CityWorldScene geometry from provider lookup.

Verification:
- `pnpm build:starter` passed.
- `pnpm verify:preview:http` passed.
- `node scripts\verify-world-lookup-boundary.mjs` passed.
- `node scripts\verify-provider-normalization-preflight.mjs --json-only`
  passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `pnpm verify:mcp` passed.
- `pnpm verify:submission` passed.
- `node scripts\verify-no-google-in-renderer.mjs --json-only` passed.
- `node scripts\verify-atlas-source-of-truth-drift.mjs --json-only` passed.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed with 37 files, 0 blockers, and 0 unknowns.

## Entry 077

Quest:
0.43E Engine Quality Axis Review / Next Target Selection.

What changed:
Updated `scripts/select-engine-quality-axis.mjs` from the old 0.40E selector
to the current 0.43E selector. It now accepts 0.42E as input, reads the 0.42E
provider runtime proof, runs the current diagnostics/verifiers, scores the next
engine axes, writes `artifacts/engine-quality-axis/postalpha-0.43e-next-target-selection.json`,
and records one recommended next quest.

Selector result:
- Selected axis: `hidden_second_district_readiness`.
- Recommended next quest: `0.44E Hidden Second-District Visual/Product Proof Packet`.
- Blocked repeat public object, terrain, mobile, provider, commerce, and public
  entry work because current verifiers are green and there is no named blocker.
- Kept Anaheim/Ontario non-public and non-playable.

Skipped:
No renderer geometry, public UI redesign, MCP tool-list change, server route
change, DB implementation, migration, persistence, provider-created geometry,
live provider-to-scene normalization, public Anaheim/Ontario exposure, Hosted
Clawd, Stripe, OAuth, XP, evidence, automation, reports, exports, cars, humans,
props, panels, glows, or label crutches.

Verification:
- `node --check scripts\select-engine-quality-axis.mjs` passed.
- `node scripts\select-engine-quality-axis.mjs --json-only` passed.
- `node scripts\select-engine-quality-axis.mjs --out artifacts\engine-quality-axis --json-only`
  passed and wrote the 0.43E selector artifact.

## Entry 078

Quest:
0.44E Hidden Second-District Visual/Product Proof Packet.

What changed:
Regenerated the hidden Anaheim proof chain against the local server at
`http://127.0.0.1:8787` and moved the visual evidence out of temp-only state.
The repo-local visual packet now lives at
`artifacts/second-district-visual-packets/postalpha-0.44e-anaheim-hidden-proof`.
The product proof was regenerated at
`artifacts/second-district-readiness/latest/anaheim-candidate/product-proof.json`,
and the readiness aggregate now points to the repo-local visual/product proof
paths.

Result:
- Public Riverside coverage remained playable.
- Orange shell and Unknown/L0 recovery remained honest.
- Hidden Anaheim no-label screenshots were captured for desktop, mobile,
  detail, and two anchor crops.
- The visual packet outcome is still `HIDDEN_DRAFT_ONLY`.
- The readiness aggregate remains `readyForPlayablePromotion: false`.
- The owner cutline remains `BLOCK_PROMOTION`.

Skipped:
No public Anaheim/Ontario exposure, public playable second district, renderer
or public UI change, provider-created geometry, DB persistence, migrations, new
MCP tools, paid/Stripe/OAuth/Hosted Clawd, XP, evidence, automation, reports,
exports, cars, humans, props, panels, glows, or label crutches.

Verification:
- `pnpm build:starter` passed.
- `ATLAS_BASE_URL=http://127.0.0.1:8787 ATLAS_ENGINE_BETA_COVERAGE_SCREENSHOTS=<temp> node scripts\verify-engine-beta-coverage.mjs`
  passed.
- `node scripts\verify-anaheim-draft-scene.mjs --url http://127.0.0.1:8787/preview?atlasNoLabels=1 --screenshots <temp> --no-label-crops`
  passed.
- `node scripts\verify-chatgpt-entry-surface.mjs --mcp-url http://127.0.0.1:8787/mcp --json-out artifacts\second-district-readiness\latest\anaheim-candidate\product-proof.json --district anaheim-candidate`
  passed.
- `node scripts\verify-second-district-visual-packet.mjs --district anaheim --screenshots artifacts\second-district-visual-packets\postalpha-0.44e-anaheim-hidden-proof --json-only`
  passed.
- `node scripts\verify-second-district-draft-scene.mjs --anchor-pack data\district_place_anchor_packs\anaheim-anchors.json --json-only`
  passed.
- `node scripts\export-second-district-readiness-artifact.mjs --district anaheim-candidate --out artifacts\second-district-readiness\latest --visual-packet artifacts\second-district-visual-packets\postalpha-0.44e-anaheim-hidden-proof --product-proof artifacts\second-district-readiness\latest\anaheim-candidate\product-proof.json --json-only`
  passed.
- `node scripts\verify-second-district-owner-gate-cutline.mjs --readiness artifacts\second-district-readiness\latest\anaheim-candidate\readiness-aggregate.json --out artifacts\second-district-readiness\latest\anaheim-candidate\owner-gate-cutline.json --json-only`
  passed.
- `pnpm verify:preview:http` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `node scripts\verify-atlas-source-of-truth-drift.mjs --json-only` passed.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed with 55 files, 0 blockers, and 0 unknowns.
- Focused `git diff --check` passed with Windows LF-to-CRLF warnings only.

## Entry 079

Quest:
0.45E Owner Gate Cutline / Next Axis Selection.

What changed:
Added `scripts/select-second-district-owner-gate-next-axis.mjs`, a decision
selector over the 0.44E hidden Anaheim proof packet. It reads the readiness
aggregate, owner cutline, visual review, and product proof, then selects the
next axis without changing product behavior.

Selector result:
- Selected axis: `owner_gate_review`.
- Decision: `REQUEST_OWNER_REVIEW`.
- Recommended next quest: `0.46E Owner Gate Review Packet`.
- Controlled public Anaheim spike score: `0`.
- Blocked public Anaheim because readiness is not promotion-ready and the
  cutline is still `BLOCK_PROMOTION`.

Skipped:
No public Anaheim/Ontario exposure, public playable second district, renderer
or public UI change, provider-created geometry, DB persistence, migrations, new
MCP tools, paid/Stripe/OAuth/Hosted Clawd, XP, evidence, automation, reports,
exports, cars, humans, props, panels, glows, or label crutches.

Verification:
- `node --check scripts\select-second-district-owner-gate-next-axis.mjs`
  passed.
- `node scripts\select-second-district-owner-gate-next-axis.mjs --json-only`
  passed.
- `node scripts\select-second-district-owner-gate-next-axis.mjs --write-default --json-only`
  passed and wrote the 0.45E selector artifact.
- `node scripts\verify-second-district-owner-gate-cutline.mjs --readiness artifacts\second-district-readiness\latest\anaheim-candidate\readiness-aggregate.json --json-only`
  passed and kept `BLOCK_PROMOTION`.
- `node scripts\verify-atlas-source-of-truth-drift.mjs --json-only` passed.
- `node scripts\verify-second-district-owner-gate-cutline.mjs --readiness artifacts\second-district-readiness\latest\anaheim-candidate\readiness-aggregate.json --json-only`
  passed and kept `BLOCK_PROMOTION`.
- `node scripts\verify-atlas-source-of-truth-drift.mjs --json-only` passed.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  passed with 58 files, 0 blockers, and 0 unknowns.
- Focused `git diff --check` passed with Windows LF-to-CRLF warnings only.

## Entry 080

Quest:
0.48P Design Ultra-Pass (Fable supermove). Product/app-quality track slice that
clears gate G3 (widget quality). Branch `fable/0.48p-design-ultra-pass`.

What changed (web/src/ only — the shipped ChatGPT widget):
Executed the "Instrument" direction from `docs/0.48P_DESIGN_ULTRA_PASS.md` (Fable
audit + `/plan-design-review`, design score 8.5 -> ~9.5). Rebuilt `styles.css` on a
three-tier token system (primitives -> semantics -> existing --city-*/--atlas-*
aliases); every rgba/hex literal moved onto tokens; the two opacity-ladder
pseudo-palettes and ~10 ad-hoc yellows eliminated. Two-layer grammar: chrome is now
achromatic ChatGPT-native hairline plates, color lives only in the map. Retired the
yellow accent from chrome (owner-approved) -> solid-ink primary actions. De-pilled
everything (999px kept only on dots/scrollbar thumb); collapsed to two elevation
tokens; added the motion set (90/140/200ms, one ease-out, transform/opacity only,
hover = tint not lift, hover != selected) with a prefers-reduced-motion guard;
system font stack (Inter dropped) with integer 11/12/13/14 scale and 'tnum'. Deleted
the ~1470-line unreachable legacy voxel/pixi CSS block (VoxelSceneView /
PixiVoxelSceneView proven orphaned). Extracted `web/src/MapChrome.tsx` (shared
zoom/center controls + URL-param readers) consumed by CityWorldView and
CountyCoverageView. Replaced the ASCII sticker glyphs (H S P * ! ?) with inline
stroke-SVG glyphs. Wrapped the left rail in one flex column, deleting the four
calc(safe + Npx) magic offsets. Wired dark theme from `window.openai.theme` +
globals-change -> `data-theme`. County switcher is now one hairline plate with plain
rows (active = ink fill) so no left-rail text floats bare over the map.

Copy:
"Generate district" -> "Turn to a new district" / "generated · session-only";
county-switcher "L0" -> "Not indexed"; PreviewPanel kicker/asset separators
" - " -> " · ". Honesty copy preserved verbatim ("Session preview. Nothing is saved,
sent, or scheduled."; "Pins and notes stay in this chat."). All 103 data-qa /
city-world-* hooks preserved (bundle-audited); Play/Browse product-path nodes hidden
(display:none), not removed.

Skipped:
No new npm deps, no package/lock/env changes, no deploy, no renderer voxel-art
rewrite (that is 0.51E), no MCP tool changes, no Anaheim/owner-gate or artifacts/
edits, no persistence/paid/OAuth/XP/evidence/automation, no provider geometry, no
props/cars/humans/glows/label crutches.

Verification:
- `pnpm typecheck:starter` passed (green baseline before and after).
- `pnpm build:web` and `pnpm build:starter` passed.
- `pnpm test:core` passed 85/85.
- G3 browser verifiers passed `ok:true` with zero console errors:
  verify-alpha-product-loop, verify-scout-campaign-panel, verify-shell-county-widget,
  verify-county-switcher, verify-generated-district-widget, verify:preview:http.
- `verify:submission` passed (7-tool surface + honesty copy intact).
- Manual `/browse` proof at localhost:8787/preview: desktop 1280x832 and mobile
  390x844, light AND dark — zero horizontal overflow, zero JS errors, hover != active.
- Net -1160 lines (styles.css 2882 -> ~1200 after legacy excision).

## Entry 081

Quest:
Product use-case + submission positioning (feeds `0.50P`, gate G6). Doc + copy only.

What changed:
Added `docs/ATLAS_CHATGPT_USE_CASE.md` — the office-hours-rigor case for Atlas as a
ChatGPT app (why-ChatGPT wedge, three personas, killer demo, free->paid arc, honest
weaknesses, submission-ready copy). Owner decision (2026-07-04): position BROAD across
all three personas with the mobile-detailing scout as the flagship concrete example.
Replaced the placeholder `app_info` in `chatgpt-app-submission.json`: subtitle
"Explore a voxel city map" -> "Explore your county as a voxel city and scout it with an
AI agent"; description rewritten use-case-forward while keeping the honesty statements
and the `verify-submission.mjs`-required literals ("voxel city map", "session-only",
"do not save state").

Skipped:
No tool/schema changes, no new deps, no deploy, no persistence/paid/provider changes.

Verification:
- `node -e JSON.parse(chatgpt-app-submission.json)` valid.
- `node scripts/verify-submission.mjs` passed (7-tool surface, live sweep, honesty
  literals intact).
