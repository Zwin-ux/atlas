# Second District Promotion Gate

Status: Forge backend/data gate for Anaheim and Ontario candidate promotion.

Purpose:
Define exactly what must exist before a second district can appear in the public
county switcher or behave as playable. This is not a promotion approval. It is
the mechanical checklist that prevents Atlas from turning candidate metadata,
hidden draft scenes, or provider lookup into fake coverage.

Current public truth:

- Riverside/Eastvale is the only playable county world.
- Orange/Anaheim and San Bernardino/Ontario are candidate-only L1 shell paths.
- Provider lookup is read-only, not saved, and does not unlock a playable map.
- Hidden Anaheim draft evidence is not public UI, not a route, and not a
  playable claim.

## Candidate Order

1. Anaheim, Orange County
   - County slug: `orange-ca`
   - County GEOID: `06059`
   - District slug: `anaheim-candidate`
   - District GEOID: `0602000`
   - Current tier: `L1_COUNTY_SHELL`
   - Target tier: `L2_CURATED_DISTRICT`
   - Current public state: not playable

2. Ontario, San Bernardino County
   - County slug: `san-bernardino-ca`
   - County GEOID: `06071`
   - District slug: `ontario-candidate`
   - District GEOID: `0653896`
   - Current tier: `L1_COUNTY_SHELL`
   - Target tier: `L2_CURATED_DISTRICT`
   - Current public state: not playable

## Required Data Before Public Switcher Exposure

The district must have all of these artifacts before it can appear as a
playable option:

- Candidate contract: a parsed `DistrictCandidatePack` with Census county and
  district GEOIDs, `candidateStatus: "candidate_only"`, `playableNow: false`,
  and `promotionBlocked: true`.
- Source-noted anchors: a parsed `DistrictPlaceAnchorPack` whose anchors have
  source note IDs, source facts, categories, `providerNormalized: false`,
  `renderableNow: false`, and `sceneEligible: false` until later gates pass.
- Curated district pack: a parsed `DistrictCuratedPack` that maps curated
  anchors back to source-noted anchors, keeps `promotionStatus: "draft_only"`,
  `playableNow: false`, `publicNow: false`, and `publicPlaceClaim: false`.
- Provider-readiness boundary: lookup outputs may expose
  `providerReadiness`, but the district cannot use provider lookup as promotion
  evidence while `coveragePromotion`, `sceneEligible`, and `publicQuality` are
  false.
- Compiler proof: a bounded `CityWorldScene` compiled from the curated/source
  anchors with deterministic desktop, mobile, and residential-detail cameras.
- Screenshot proof: desktop, mobile, and residential-detail screenshots that
  prove the district reads as a usable map without relying on fake places,
  labels alone, cars, humans, props, or public copy.

## Required Verifiers

Before public switcher exposure, Axiom must attach a green packet with these
commands:

- `node scripts/verify-second-district-readiness.mjs --district anaheim-candidate --json-only`
- `node scripts/verify-second-district-readiness.mjs --district ontario-candidate --json-only`
- `node scripts/create-second-district-promotion-packet.mjs --district anaheim-candidate --json-only`
- `node scripts/create-second-district-promotion-packet.mjs --district ontario-candidate --json-only`
- `node scripts/verify-county-index-source.mjs --offline --json-only`
- `node scripts/verify-anaheim-promotion-readiness.mjs --json-only`
- `node scripts/verify-anaheim-object-source-quality.mjs --json-only`
- `node scripts/verify-anaheim-draft-scene.mjs --url <preview-url> --screenshots <artifact-dir>`
- `node scripts/verify-engine-beta-coverage.mjs --url <preview-or-public-url>`
- `node scripts/verify-world-lookup-boundary.mjs --json-only`
- `node scripts/verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`

Ontario needs equivalent candidate, anchor, curated, draft-scene, source-quality,
and promotion-readiness verifiers before it can replace Anaheim in this gate.

## Promotion Packet Contract

The promotion packet is the handoff object for Axiom, Mira, Lumen, and Forge.
It is produced by `scripts/create-second-district-promotion-packet.mjs` from the
same candidate, anchor, curated-pack, county-coverage, and hidden draft compiler
state used by the pipeline verifier.

Required packet shape:

- `candidate identity`: county slug/GEOID, district slug/GEOID, current tier
  `L1_COUNTY_SHELL`, target tier `L2_CURATED_DISTRICT`.
- `file presence`: candidate pack, source-noted anchor pack, and draft-only
  curated pack.
- `gate summary`: satisfied and missing promotion gates in the canonical order.
- `noFakePlayability`: shell county, zero playable districts, zero public
  places, non-playable draft scene, no actors, no pins, no selected public
  place, no provider promotion, and no public-quality claim.
- `reviewPlaceholders`: required screenshot packet path plus Lumen, Mira, and
  Forge acceptance placeholders.
- `releaseCutline`: public switcher exposure and public scene compilation stay
  false until every gate is present and Axiom accepts the packet.

The packet is allowed to report draft compiler proof. It is not allowed to make
Anaheim or Ontario public, playable, provider-normalized, or public-quality by
metadata alone.

## Readiness Aggregator

`scripts/verify-second-district-readiness.mjs` is the one-command Forge readout
for Axiom. It wraps the promotion packet with source, visual, product, and
release evidence:

- `data`: candidate contract, source-noted anchors, draft-only curated pack,
  bounded compiler proof, Census/source verifier, and no-fake-playability flags.
- `visual`: screenshot packet availability, visual verdict fields, and Lumen
  acceptance.
- `product`: ChatGPT/product proof packet and Mira acceptance.
- `release`: strict `engine-beta-data` split guard and Forge acceptance.

Default behavior is conservative. If no visual packet or product proof path is
provided, the command reports those blockers and keeps
`readyForPlayablePromotion: false`. A district can only become promotion-ready
when the aggregator reports no data, visual, product, or release blockers and
Axiom accepts the resulting packet.

## Promotion Blockers

Any one of these blocks public switcher exposure:

- `playableNow: true` appears before all promotion gates are satisfied.
- `publicNow: true` appears before public screenshot proof and Mira acceptance.
- A shell county gains `_meta.scene` instead of `_meta.coverageShellScene`.
- Provider lookup is treated as provider-normalized county coverage.
- Raw provider fields reach renderer/widget contracts.
- Source notes are missing, stale, or disconnected from anchors.
- Curated anchors claim public places before naming/app-review decisions.
- Desktop/mobile screenshots are missing or fail product-loop proof.
- Lumen has not accepted object recognition for the district.
- Mira has not accepted user-facing readiness.
- Forge split guard reports blockers or unknown paths.

## Public-Copy Cutline

Allowed public wording:

- Riverside/Eastvale is playable.
- Anaheim/Ontario are candidate or shell coverage only.
- Lookup can find nearby places, but results are not saved and do not unlock a
  playable county map.

Blocked public wording:

- "Anaheim is playable."
- "Ontario is playable."
- "Provider-normalized county" without a separate provider promotion packet.
- "Public-quality" before visual, product, and source gates pass.
- Any claim that Atlas has local places for a candidate district before curated
  public places are approved.

## Owner Cutline

- Forge owns data contracts, verifier gates, provider boundary, and split
  safety.
- Mira owns whether the public product can expose the district without confusing
  users.
- Lumen owns whether the district's object grammar and screenshots are
  visually credible.
- Axiom owns final promotion and deploy decisions.
