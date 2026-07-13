# Atlas Packet P1.3 Result

## Summary

P1.3 routes preview-county place questions through the county's own generated
scene places while keeping the old honesty boundary intact.

Generated preview answers now use only drawn place labels and place types. They
do not use provider data, local facts, real businesses, business-demand claims,
addresses, hours, prices, listings, saved state, XP, evidence, outreach, or
automation.

## Routing Design

- `ask_county_question` keeps the Riverside/Eastvale curated path unchanged.
- For non-Riverside `L1_COUNTY_SHELL` counties, the server compiles the
  deterministic preview scene transiently through the existing scene-packet
  cache path.
- The compiled preview scene is used only to match `question` against
  `CityWorldScene.places`.
- The model-visible answer includes `targetNodeId`, `targetPlaceId`,
  `targetLabel`, `targetKind`, and additive `cameraIntent`.
- `_meta` carries safe `scenePacket`, `generatedDraftPacket`, and
  `generatedDraftSpec` for the widget; it does not return a fake playable
  `_meta.scene` for preview county questions.
- The widget resolves camera intent against the active interaction scene, so
  generated preview places focus the same one-shot selection path as curated
  places.

## Sample Q/A

| County | Question | Answer | Intent |
| --- | --- | --- | --- |
| `mobile-al` | `Where is the riverfront landing?` | `In this preview, Riverfront landing is a shop place. Tap it on the map.` | `focus_place` |
| `loving-tx` | `Where is the market?` | `In this preview, Desert market row is a shop place. Tap it on the map.` | `focus_place` |
| `miami-dade-fl` | `Where is the civic square?` | `In this preview, Civic square is a landmark place. Tap it on the map.` | `focus_landmark` |

Unsupported example:
`Will mobile detailing work here?` is refused because that requires business
truth outside the drawn labels and place types.

## Honesty Boundary

Supported preview questions are limited to "where is this visible map place?"
style prompts. Anything requiring local truth, business viability, provider
lookup, full county coverage, saved work, or public-playable status is refused.

The generated-place copy was checked against the P1.2 banned identity words:
`alpha`, `tier`, `spec`, `generated`, `draft`, and `archetype`.

## Gate Tails

`pnpm --dir packages/core test county-question.test.ts`

```text
Test Files 1 passed (1)
Tests 9 passed (9)
```

`pnpm typecheck:starter`

```text
FAIL
src/voxel/cityWorldParametricGenerator.ts(3088,65): TS2375 optional zoom assignment
src/voxel/cityWorldParametricGenerator.ts(3090,71): TS2375 optional zoom assignment
src/voxel/cityWorldParametricGenerator.ts(3096,7): TS2375 optional zoom assignment
src/voxel/cityWorldParametricGenerator.ts(3105,3): TS2375 optional zoom assignment
```

`pnpm test:core`

```text
FAIL
Test Files 1 failed | 22 passed (23)
Tests 3 failed | 148 passed (151)
Failing file: test/city-world-generated-district.test.ts
Failures: mountain cliff opening frame, mountain frontier tail framing, river-town opening-frame water/lower-frame occupancy
```

`node scripts\verify-tool-result-shape.mjs`

```text
"ok": true
"blockerCount": 0
```

`GEO_DATA_ADAPTER=mock ATLAS_MCP_URL=http://127.0.0.1:8788/mcp node scripts\verify-mcp-flow.mjs`

```text
"ok": true
"lookupPlaceCount": 5
"cachedLookup": true
"countyQuestionTopic": "business_signals"
"generatedQuestionSummaries": mobile-al, loving-tx, miami-dade-fl all answered with camera intents
"unsupportedCountyQuestion": false
```

## Files Changed

- `server/src/index.ts`
- `packages/core/src/county/CountyQuestionService.ts`
- `web/src/App.tsx`
- `packages/core/test/county-question.test.ts`
- `scripts/verify-mcp-flow.mjs`
- `artifacts/council/CODEX_RESULT_P13.md`

## Risks

- The required starter typecheck and full core test gates are blocked by
  existing failures in `packages/core/src/voxel/cityWorldParametricGenerator.ts`
  and `packages/core/test/city-world-generated-district.test.ts`, both outside
  the P1.3 fence and assigned to the concurrent voxel composition lane.
- The server compiles the preview scene only for routing. If the scene-packet
  path returns queued/no payload, the question falls back to refusal rather than
  inventing a place answer.
- Alias matching is intentionally plain. It handles direct place words like
  market, homes, civic, riverfront, landing, park, and tower; it does not try to
  infer real-world synonyms.
