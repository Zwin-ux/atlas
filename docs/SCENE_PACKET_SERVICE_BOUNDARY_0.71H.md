# 0.71H Scene Packet Service Boundary

Status: local green.

Decision: `GENERATED_DRAFT_PACKETS_META_ONLY_NO_FRAME_LOOP`.

## Product Promise

Atlas can request a generated draft district for an indexed shell county without
claiming that the county is public playable or locally verified.

The user should experience this as:
- open or inspect a shell county
- ask ChatGPT to generate a draft scene packet
- receive a visual draft in the widget
- pan and zoom locally after the packet arrives

## Service Boundary

Railway/server may:
- compile deterministic generated draft `CityWorldScene` packets
- cache them in runtime memory
- key them by county slug, generated district slug, camera/window profile,
  scene schema version, and generator update id
- return safe packet summaries from `/api/engine/scene-packets/status`

Railway/server must not:
- sit in the pan/zoom or render frame loop
- expose generated draft payloads from a public browser HTTP render route
- put generated scene geometry in `structuredContent`
- persist generated draft scene packets to a database
- create provider geometry

## MCP Delivery

No public MCP tools were added.

`select_county` and `render_voxel_county` accept:
- `includeGeneratedDraft?: boolean`

Default behavior is unchanged. Shell counties return the county coverage
summary and optional shell scene metadata.

When `includeGeneratedDraft` is true for an indexed shell county:
- `structuredContent` remains the county coverage summary
- `_meta.generatedDraftScene` carries the generated `CityWorldScene`
- `_meta.generatedDraftPacket` carries the safe cache summary
- the draft is `generated_draft`, non-playable, non-public, provider-free, and
  meta-only

## Widget Consumption

The widget no longer compiles generated previews locally. The generated preview
button sends a ChatGPT request to call the existing tool with
`includeGeneratedDraft true`.

When `_meta.generatedDraftScene` is present, the widget renders it through the
existing `CityWorldView` generated-preview mode. After the scene arrives,
browser Pixi pan/zoom is retained and local.

## Status Route

`/api/engine/scene-packets/status` remains summary-only. It may show cache keys,
readiness, payload kind, cache hit state, packet boundary, policy, and safety
counts.

It must not show:
- payload bodies
- terrain, roads, lots, buildings, props, actors, pins, or places
- generated district specs
- provider payloads

## Anti-Scope

No DB/Auth/Stripe changes. No new public MCP tools. No browser HTTP generated
scene route. No provider-created geometry. No public Anaheim/Ontario exposure.
No all-US playable claim. No renderer visual overhaul in this slice.

## Proof

- `packages/core/src/world/scenePacketCache.ts`
- `packages/core/test/scene-packet-cache.test.ts`
- `server/src/scenePacketMemoryAdapter.ts`
- `server/src/index.ts`
- `web/src/App.tsx`
- `scripts/verify-generated-draft-scene-packet.mjs`
- `artifacts/national-generation/0.71h/generated-draft-scene-packet.json`

## Next

`0.72H Fable Generated Draft Visual Quality Gate`.

That slice should use the packet path and judge the actual generated draft
visuals: object grammar, silhouettes, density, material discipline,
desktop/mobile screenshots, and measurable visual gates. It should not reopen
service routing, DB persistence, money, provider geometry, or public promotion.
