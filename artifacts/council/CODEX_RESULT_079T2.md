# CODEX RESULT 0.79-T2 - Landmark Fully In Frame

## Scope

Packet: `ATLAS PACKET 0.79-T2 - LANDMARK FULLY IN FRAME (surgical)`.

Read first:

- `artifacts/council/CODEX_RESULT_079T.md`

Fence held for my edits:

- Core generated overview focus/composition path:
  `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- Core regression coverage:
  `packages/core/test/city-world-generated-district.test.ts`
- Visual scoring helper and generated score artifacts:
  `scripts/lib/visual-score.mjs`
  `artifacts/visual-score/report.json`
  `artifacts/visual-score/REPORT.md`
- Required result note:
  `artifacts/council/CODEX_RESULT_079T2.md`

Concurrent worktree note:

- `packages/core/src/county/CountyQuestionService.ts`,
  `packages/core/test/county-question.test.ts`, and
  `packages/core/src/voxel/cityWorldCountyGeoScene.ts` were concurrent
  non-079T2 edits. I did not modify them.
- No git add, commit, or push.

## Constraint Design

0.79-T treated landmark framing as a soft score term and checked only the
ground footprint. That allowed the Ridge lodge's projected roof/top mass to
clear the old scorer while still being edge-cut in the opening screenshot.

0.79-T2 makes non-water generated opening-camera candidates obey a hard
projected landmark constraint:

- Compute the landmark projected bounding box from footprint corners plus
  `position.z + height`.
- Compare it against the projected opening camera window.
- Require all four projected margins to be at least `2` tile units.
- If the default zoom cannot produce a compliant candidate, evaluate pullback
  zooms within preset bounds.
- Keep water-aware openings under the existing water-composition path.
- Keep relief-aware mountain openings probing pullback candidates so the
  landmark fix does not erase cliff-course visibility.

The search is two-phase for perf: score all anchors at default zoom, then
probe only priority anchors at pullback zooms when the hard constraint fails or
the landmark margin is too tight.

## Butte Before / After

| Metric | Before 0.79-T2 | After 0.79-T2 |
| --- | ---: | ---: |
| Visual score | 98.9 | 98.9 |
| Opening buildings | 4/4 | 5/4 |
| Landmark projected in frame | no | yes |
| Landmark top margin | -3.73 tiles | 4.625 tiles |
| Landmark margin floor | 2 tiles | 2 tiles |
| Mountain drop tiles | 31 | 64 |
| Failing signals | none in old scorer | none |

After margins:

- left `23.404`
- right `29.699`
- top `4.625`
- bottom `43.813`

## Worst 10 Before / After

| Rank | Before 0.79-T | Score | After 0.79-T2 | Score |
| ---: | --- | ---: | --- | ---: |
| 1 | montcalm-mi | 83.36 | chaves-nm | 84.36 |
| 2 | potter-tx | 83.36 | logan-il | 85.06 |
| 3 | jackson-wi | 83.38 | pawnee-ok | 85.06 |
| 4 | bibb-al | 83.66 | robertson-ky | 85.06 |
| 5 | okfuskee-ok | 83.66 | cibola-nm | 85.8 |
| 6 | franklin-nc | 83.92 | loving-tx | 85.8 |
| 7 | marion-ia | 83.92 | lynn-tx | 85.8 |
| 8 | carteret-nc | 84.34 | schleicher-tx | 85.8 |
| 9 | jasper-in | 84.34 | iron-ut | 85.84 |
| 10 | mercer-ky | 84.34 | scurry-tx | 85.84 |

## Distribution And Floors

Before 0.79-T2 from the 0.79-T result:

- Count: `3222/3222`
- Min: `83.36`
- p10: `94.06`
- p25: `97.9`
- Median: `98.6`
- p75: `99.58`
- p90: `100`
- Max: `100`
- Mean: `97.84`

After 0.79-T2:

- Count: `3222/3222`
- Min: `84.36`
- p10: `95.1`
- p25: `98.32`
- Median: `98.6`
- p75: `100`
- p90: `100`
- Max: `100`
- Mean: `98.15`
- `landmarkInFrame` failures: `0`

Floor decision:

- `VISUAL_SCORE_MEDIAN_FLOOR`: `98.46 -> 98.6`
- `VISUAL_SCORE_HARD_FLOOR`: `78.36 -> 79.36`

The hard floor keeps a five-point cushion under the new observed min `84.36`.
The median floor is raised only to the stable observed median.

## Gate Tails

- `pnpm typecheck:starter` - PASS.
- `pnpm test:core` - PASS, `23` files, `151` tests.
- `node scripts/build-visual-score-report.mjs` - PASS twice, identical output.
  - First/second summary: `3222/3222`, median `98.6`, min `84.36`, worst
    `chaves-nm 84.36`.
  - `artifacts/visual-score/report.json` SHA256:
    `1D61497CBFBEEF0F4FD36E02672BB89371CF451C3DB764FF60B207E6F413B81F`
  - `artifacts/visual-score/REPORT.md` SHA256:
    `4FB65773B5C4F816C3E4897DFF6BA9F568A905E23352C2CA42860DFC4C4807A6`
- `node scripts/verify-archetype-identity-sweep.mjs ALL GATES` - PASS.
  - Structural full-index compile: `3222` counties, `0` failures.
  - Perf gate: `12.19ms/county`, `0` budget failures.
  - Mountain opening relief: `summit-co drops 97 [48+]`,
    `butte-id drops 64 [30+]`.
  - Visual score floor gate: count `3222/3222`; median `98.6 >= 98.6`;
    min `84.36 >= 79.36`.
  - All listed gates passed.

## Risks / Follow-Up

- The new hard constraint is scoped to the non-water generated composition path.
  Water-aware openings still prioritize water visibility and lower-frame
  occupancy.
- The new national worst tail is sparse desert/prairie opening occupancy, not
  landmark framing.
- The report builder's console label still says `0.79-1`; the report payload
  and markdown are `0.79-T2`. I left the builder script untouched because it
  was outside the requested fence.
