# Atlas Council Packet W3 Result

## Files changed

- `packages/core/src/county/CountyQuestionService.ts`
  - Added optional answer target fields: `targetNodeId`, `targetPlaceId`, `targetLabel`, `targetKind`.
  - Routes location-style questions through compiled curated scene places/districts plus the existing authored city map zones for Community park and Water edge.
  - Refuses unknown place targets without inventing camera targets.
- `packages/core/src/voxel/cityWorldTypes.ts`
  - Widened `CityWorldCameraPreset.id` with `"focus"` only.
- `packages/core/test/county-question.test.ts`
  - Added curated place-target and unknown-place refusal coverage.
- `server/src/index.ts`
  - Added optional `cameraIntent` schemas for `select_county`, `render_voxel_county`, and `ask_county_question`.
  - Added server-side `focus` camera preset decoration in `_meta.cityWorldScene` without changing the compiler.
  - Made `ask_county_question` map-first by attaching widget metadata, `_meta.scene`, `_meta.scenePacket`, and gated Hosted Clawd context only when enabled.
- `web/src/App.tsx`
  - Reads tool `cameraIntent`, accepts `_meta.cityWorldScene`, and selects a resolvable focused place when present.
- `web/src/CityWorldView.tsx`
  - Merges the server-provided `focus` preset into the locally compiled city scene.
- `web/src/MapChrome.tsx`
  - Lets a scene-carried `focus` preset win over the `atlasCamera` URL parameter.

## Camera Intent Contract

`structuredContent.cameraIntent` is optional:

```json
{
  "type": "focus_place | focus_district | focus_water_edge | focus_landmark",
  "targetNodeId": "optional Atlas node id",
  "targetLabel": "optional human label"
}
```

The server only emits it when it can also attach a matching `_meta.cityWorldScene.cameraPresets[]` entry with `id: "focus"`. The focus preset center is derived from scene places, districts, nodes, or authored city lots, and its zoom is clamped inside the selected base preset min/max.

## Sample Payloads

Question focus:

```json
{
  "type": "countyQuestionAnswer",
  "supported": true,
  "targetNodeId": "eastvale",
  "targetLabel": "Community park",
  "targetKind": "place",
  "cameraIntent": {
    "type": "focus_place",
    "targetNodeId": "eastvale",
    "targetLabel": "Community park"
  }
}
```

`select_county` default:

```json
{
  "type": "voxelSceneSummary",
  "sceneId": "voxel-riverside-ca-eastvale-alpha",
  "selectedNodeId": "eastvale",
  "cameraIntent": {
    "type": "focus_landmark",
    "targetNodeId": "eastvale",
    "targetLabel": "Eastvale"
  }
}
```

Refusal:

```json
{
  "type": "countyQuestionAnswer",
  "supported": false,
  "topic": "unsupported"
}
```

Refusal widget metadata still attaches the scene, with no focus preset:

```json
{
  "hasScene": true,
  "hasFocusPreset": false
}
```

## Gate Tails

- `pnpm typecheck:starter` - blocked outside W3 fence:
  - `web/src/CityWorldRenderer.tsx(1541,54): error TS2304: Cannot find name 'CityWorldBounds'.`
  - `pnpm build:server` passed after W3 edits.
- `pnpm test:core` - W3 tests passed, curated Riverside byte-identity test passed, overall blocked by existing generated-district drift:
  - `test/county-question.test.ts (7 tests) passed`
  - `leaves curated Riverside compile output byte-identical while generated attachments are active` passed
  - Failing unrelated tails: palette distance `0.149 < 0.16`; W4.2 road tone expected `coastal_light` got `river_light`; `generatedTreeReadout is not defined`; vegetation expected `23` got `24`.
- `node scripts/verify-tool-result-shape.mjs`:
  - `ok: true`, `blockerCount: 0`
- `node scripts/verify-mcp-flow.mjs`:
  - Self-hosted with `GEO_DATA_ADAPTER=mock`.
  - `ok: true`, 7 tools listed, `countyQuestionTopic: "business_signals"`, `unsupportedCountyQuestion: false`, `hostedClawdStatus: "planned_beta"`.
- `node scripts/verify-save-surface-flag.mjs`:
  - `ok: true`
  - `save_surface_on_emits_hosted_clawd_meta: true`
  - `save_surface_off_omits_hosted_clawd_meta: true`

## Reviewer Risks

- Full `typecheck:starter` and `test:core` remain red because of pre-existing dirty files outside the W3 fence.
- Community park and Water edge are authored city map zones, not persisted VoxelScene places, so they focus correctly but fall back to existing scene nodes for model-visible target ids.
- Browser/emulator certification was intentionally not run; reviewer owns CDP/browser proof for this packet.
