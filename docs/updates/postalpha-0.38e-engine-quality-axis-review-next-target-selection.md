# Post-Alpha 0.38E - Engine Quality Axis Review / Next Target Selection

## Status

Local green.

## Player-Facing Promise

Atlas stops repeating commerce polish and chooses the next public
engine-quality target from measured evidence.

## Engineering Promise

`scripts/select-engine-quality-axis.mjs` reads the current update manifest,
structural diagnostics, object-kit metrics, mobile LOD budget, screenshot
evidence, and Anaheim readiness blockers. It outputs one recommended next
quest, candidate scores, blocked axes, required evidence, and anti-scope.

## Selector Result

- Recommended next quest: `0.39E Public Object Identity / Civic-Service Read Pass`.
- Selected axis: `public_object_identity`.
- Public object identity score: `87`.
- Hidden second-district readiness score: `52`.
- Terrain/world-edge score: `31`.
- Mobile entry-density score: `28`.
- Commerce repeat score: `0`.

## Why This Axis

- `homeClonePressure`: `0.2`.
- `weakestObjectFamily`: `civic_landmark`.
- `weakestCivicVenueStressCell`: `eastvale-core-civic-landmark`.
- Terrain floors are green:
  `terrainMassingCoverageRatio 0.899`, `emptyBoardRatio 0.056`,
  `chunkEdgeReadabilityFloorScore 0.761`.
- Mobile is green:
  `mobileReadabilityScore 0.752`, `mobileOcclusionRiskScore 0.248`.
- Commerce is green enough after 0.37E:
  `plazaRowBayCount 7`, `plazaRowSignMountCount 5`,
  `commerceWindowCommandVisibilityRatio 0.059`.
- Anaheim remains blocked from public promotion with 9 readiness blockers.

## Artifact

`artifacts/engine-quality-axis/postalpha-0.38e-next-target-selection.json`

## Verification

- `node --check scripts\select-engine-quality-axis.mjs` passed.
- `node scripts\select-engine-quality-axis.mjs --json-only` passed.
- `node scripts\select-engine-quality-axis.mjs --out artifacts\engine-quality-axis --json-only` passed.

## Skipped

No renderer geometry, public UI, server route, MCP tool-list, DB, provider
geometry, public Anaheim/Ontario promotion, Hosted Clawd, Stripe, XP, evidence,
OAuth, automation, reports, exports, cars, humans, props, panels, glows, or
labels-as-crutches.

## Next

Run `0.39E Public Object Identity / Civic-Service Read Pass`. Target public
Riverside civic/service readability, especially Eastvale Core and service/gym
read, using object-kit metadata and focused screenshot proof.
