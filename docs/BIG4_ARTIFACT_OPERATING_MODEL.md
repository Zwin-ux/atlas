# Atlas Big 4 Artifact Operating Model

Status: active for Engine Beta.

Purpose:
Make the Big 4 produce shippable artifacts, not just approval packets. Gates
still matter, but only after a worker has built or hardened something concrete.

## Roles

- Axiom: integration GM. Owns scope, conflict arbitration, deploy, rollback,
  and final release decision.
- Lumen: voxel-engine builder. Owns visual renderer/compiler/art-system slices
  that improve the map.
- Mira: product software builder. Owns ChatGPT app comprehension, mobile UX,
  county state surfaces, and verifier-backed product loops.
- Forge: data/backend glue builder. Owns county/district contracts, source
  verification, split guards, and deploy mechanics.

## Artifact Rule

Every worker handoff must identify an artifact:

- code, data contract, verifier, or documented operating contract;
- exact files changed;
- verification run;
- screenshots when the change affects visible product quality;
- what was skipped;
- next artifact.

Gate-only reports are allowed only when Axiom explicitly asks for a final
visual/product/release verdict after an artifact is built.

## Artifact Size Bar

Default captain tasks should be large enough to change the product trajectory,
not just confirm the current state.

- Forge artifacts should usually include a data contract or verifier plus tests
  or split-guard behavior.
- Lumen artifacts should usually include a screenshot/verifier harness, object
  grammar contract, renderer improvement, or visual acceptance packet tied to a
  real promotion decision.
- Mira artifacts should usually include a user-facing component, product-flow
  verifier, mobile density fix, or copy/layout pattern that changes how a
  normal user understands Atlas.

Small copy or doc-only edits are allowed only when they unblock a larger build
artifact or protect a release gate. If a worker returns plan-only because their
thread mode blocks edits, Axiom either converts the plan into a patch in the RC
worktree or reassigns a concrete artifact to another active lane.

## Lane Ownership

Lumen owns:

- `web/src/CityWorldRenderer.tsx`
- city-world voxel compiler/types/tests when visual metadata is required
- city-world asset manifest/textures when sprite or atlas work is required

Mira owns:

- `web/src/CountyCoverageView.tsx`
- `web/src/CountySwitcher.tsx`
- `web/src/CityWorldView.tsx`
- product-loop and shell/switcher verifiers when product selectors need guards
- focused app surface styles

Forge owns:

- `packages/core/src/world/*`
- national/world service tests
- source/county/split/deploy verification scripts
- data-readiness docs and durable backend boundary decisions

Axiom owns:

- integration ordering;
- cross-lane conflict resolution;
- final strict split guard;
- Railway deploy;
- public matrix verification;
- rollback if public verification regresses.

## Current Artifact Queue

## E15 Expanded Voxel-Engine Artifact Cycle

The E15 cycle expands scope beyond small gates. The Big 4 must produce system
artifacts that compound toward a second playable district and a stronger voxel
engine.

1. Forge E15.1 Candidate Readiness Aggregator.
   Build one machine-readable readiness report for Anaheim and Ontario. It must
   read promotion packet state, source/curated/draft evidence, visual packet
   status, product proof, and split guard status, then group blockers by data,
   visual, product, and release. The output must keep `readyForPlayablePromotion`
   false until all required gates pass.
2. Lumen E15.2 Hidden Draft Voxel Grammar System.
   Build a reusable hidden-draft voxel grammar artifact, not a critique note.
   The default first target is Anaheim Convention Center plus ARTIC/Angel
   Stadium area. The work should improve venue/transit/commercial massing,
   foundations, road/lot grounding, face separation, and regional palette while
   preserving hidden non-playable state. At least two anchors must be
   recognizable before labels before any promotion discussion.
3. Mira E15.3 ChatGPT Entry Surface.
   Build a product-language artifact proving the public model: Play
   Riverside/Eastvale now, browse California shell counties, and lookup places
   without saving. Tool and widget language must avoid compiler/promotion/GEOID
   jargon and must not imply persistence, XP, evidence, automation, or fake
   coverage.
4. Axiom E15 Integration Control.
   Use `docs/AXIOM_BIG4_ARTIFACT_DISPATCH.md` as the dispatch source and
   `scripts/verify-big4-artifact-packets.mjs` as the packet-shape sentinel.
   Integrate Forge first, Lumen second, Mira third, then run the combined
   verification stack before any deploy discussion.

The next voxel-engine work should favor reusable grammar and second-district
proof over Riverside micro-polish. Riverside remains the regression anchor; it
is not the main artifact lane unless a change generalizes the engine or fixes a
real product/mobile blocker.

## Active Assignment Ladder

The next Big 4 cycle should run artifact-first, not approval-first:

1. Forge E13.7 Ontario Draft-Only Curated Pack.
   Build `data/district_curated_packs/ontario-curated-district-draft.json`
   and extend curated-pack tests so Ontario can satisfy
   `curated_district_pack` and `bounded_scene_compiler_proof` while still
   reporting `playableNow: false`, `publicNow: false`, zero public places, no
   provider-normalized categories, and no public switcher exposure.
2. Lumen E13.8 Second-District Visual Packet Fixture.
   Build a reusable example visual-review packet or harness support that
   exercises `scripts/verify-second-district-visual-packet.mjs` against Anaheim
   and Ontario-style promotion evidence. The artifact should make no-label
   anchor review harder to fake, not reopen renderer art.
3. Mira E13.9 Public Path Product Proof.
   Build one verifier-backed product artifact around the Play/Browse/Lookup
   rail: prove the rail stays compact, accessible, and truthful across
   Riverside, Orange shell, Unknown/L0, and recovery to Riverside. If no UI
   change is needed, the artifact should harden the focused product verifier
   rather than add copy.

These are larger captain tasks. Axiom integrates them only if their file
ownership stays disjoint and their verification passes.

1. Axiom/Forge E13.4 Ontario Source-Noted Anchor Pack.
   Local. Ontario now has source-noted, non-renderable anchors while staying
   non-playable, scene-ineligible, and L1 shell. Next Forge artifact should be
   an Ontario draft-only curated pack only if it maps back to these anchors
   without public-place claims.
2. Mira E13.6 Public Product Path Artifact.
   Local. The county switcher now has a compact Play/Browse/Lookup rail that
   explains the public app path without adding dashboards, directories, fake
   counties, or paid/persistence claims.
3. Axiom/Forge E13.2 Ontario Candidate Contract Starter.
   Local. Ontario now has a candidate-only JSON contract with Census identity
   and Atlas stressors while staying non-playable, non-renderable, and L1 shell.
4. Axiom/Lumen E13.3 Second District Visual Acceptance Bar.
   Local. `docs/SECOND_DISTRICT_VISUAL_ACCEPTANCE_BAR.md` defines no-label
   recognition, screenshot packets, and automatic visual rejections before
   Anaheim/Ontario can become public.
5. Axiom/Forge E13.1 California District Pipeline Verifier.
   Local. `scripts/verify-california-district-pipeline.mjs` makes the second-
   playable-district path executable across Anaheim and Ontario: Riverside-only
   playable coverage, candidate/source/curated pack discovery, bounded hidden
   compiler proof, missing promotion gates, and no fake playable claims. This is
   the main expansion artifact before any new public county UI.
6. Riverside micro-polish freeze.
   Riverside remains the regression anchor. Further Riverside-only visual work
   is lower priority unless it generalizes the renderer/object kit, fixes a real
   product/mobile blocker, or supports second-district proof.
7. Axiom/Lumen E12.21 Riverside Residential Material Palette Pass.
   Local. Production Riverside cottages, ranch homes, and rowhomes use a
   quieter SoCal-inspired palette plus subtle renderer-side stucco, trim, sill,
   eave, and side-face material cues. Keep only if screenshots reduce the
   default-color/plastic common-building read without mobile noise or product
   loop regression.
8. Axiom/Lumen E12.20 Eastvale Core Landmark Identity.
   Local. Renderer-only targeted civic-building detail for public Riverside:
   glass entry, entry frame, roof lantern, wing bay rhythm, and front landmark
   geometry. Keep only if screenshots improve Eastvale Core identity without
   marker/tray/mobile clutter.
9. Axiom/Lumen E12.19 Riverside Public Visual Trust.
   Local. Renderer-only civic/parcel grounding around Eastvale Core and
   Neighborhood Blocks. This should make the public Riverside proof cell read
   more like a planned voxel county world without props, panels, or product
   state. Keep only if desktop, mobile, and residential-detail screenshots
   improve or hold.
10. Axiom E12.17/E12.18 Public Tool Copy Artifacts.
   Local. `lookup_world_places` now states lookup-only, not saved, and not
   county-playability evidence. `select_county` and `render_voxel_county` now
   avoid internal release/compiler language and explain the playable
   Riverside/Eastvale path plainly. Forge reviews backend/split safety, Mira
   reviews product wording, and Lumen stays out unless there is a visible
   regression.
11. Lumen E12.16 Convention Center Recognizability Cutline.
   ARTIC native grammar already improved enough to read as the stronger
   label-hidden transit object. Lumen should either make one bounded Convention
   Center pass so it reads as a long glass convention hall/campus before labels,
   or stop Anaheim visual work and hand effort back to the public product loop.
   No props, cars, humans, glows, panels, public Anaheim route, playable claim,
   or provider-readiness claim.
12. Mira/Axiom E12.16 Hidden Draft Mobile Comprehension Tightening.
   Implemented in Axiom thread because Mira remained in plan mode. The hidden
   Anaheim shell/draft tray is now denser on mobile, and the Anaheim draft
   verifier protects first-viewport CTA/source visibility. Next Mira artifact
   should return to visible public product quality unless a shell/draft mobile
   regression appears.
13. Forge E12.16 Provider Readiness Contract.
   Completed. `WorldPlaceLookupResponse.providerReadiness` now records lookup
   source/mode/cache/status/confidence while `coveragePromotion`,
   `sceneEligible`, and `publicQuality` remain hard false. The MCP output schema
   and lookup boundary verifier were tightened. No DB, Hosted Clawd,
   package/lock/env drift, persistence, Stripe, XP, evidence, OAuth,
   automation, reports, or exports.
14. Axiom Integration Loop.
   Read worker threads before integrating, prevent duplicate assignments, run
   strict split guard, and only deploy if the public product matrix and Big 4
   gates stay green.

## Integration Rules

- Integrate Forge first if the changes are pure data contract/verifier work.
- Integrate Lumen only if screenshots show a real first-read improvement.
- Integrate Mira only if the product surface becomes clearer or mobile safer.
- If two workers touch the same file, Axiom pauses the lower-impact lane and
  integrates serially.
- If a worker is in plan mode and returns only a plan for an approved artifact,
  Axiom must send an explicit implementation command or move the slice to the
  current thread. Do not let plan-mode output become the final artifact.
- Before assigning a follow-up, Axiom reads the target worker's recent thread
  summary to avoid duplicate work. The ARTIC duplicate assignment in E12.16 is
  the example to avoid.
- No worker may reopen persistence, Hosted Clawd, Stripe, XP, evidence, OAuth,
  automation, reports, exports, package/lock/env drift, or fake playable
  coverage without explicit human approval.

## Required Verification

Every accepted integrated slice runs:

```powershell
pnpm test:core
pnpm typecheck:starter
pnpm build:starter
pnpm verify:preview:http
node scripts\verify-engine-beta-coverage.mjs
node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only
```

Visible product slices also need desktop `1280x720`, mobile `390x844`, and
residential-detail screenshots from the Engine Beta coverage verifier.
