# 0.72B Redis Scene Packet Cache / Job Spine

## Summary

Atlas now has a production-leaning scene packet spine without putting Railway in
the browser render loop. The ChatGPT app tool surface stays stable. The browser
keeps retained Pixi pan/zoom local after it receives `_meta.generatedDraftScene`.
Railway compiles deterministic generated draft packets, caches them, coordinates
duplicate compiles, and can run a separate worker for queued packets.

## Player Promise

Atlas may prepare a generated draft packet for an indexed shell county, but it
does not claim that county is public, playable, provider-normalized, persisted,
or local truth.

## Engineering Promise

`0.72B` moves generated draft packet work behind internal cache, lock, and queue
contracts:

- `ScenePacketCacheStore`
- `ScenePacketCompileLock`
- `ScenePacketJobQueue`

Each has a memory implementation for local/dev and a Redis implementation for
Railway production.

## Runtime Modes

Environment:

- `ATLAS_SCENE_PACKET_CACHE_BACKEND=memory|redis`
- `ATLAS_REDIS_URL`
- `ATLAS_SCENE_PACKET_WORKER_ENABLED=false|true`
- `ATLAS_SCENE_PACKET_LOCK_TTL_SECONDS=30`
- `ATLAS_SCENE_PACKET_LOCK_WAIT_MS=2000`

Default local behavior:

- no Redis required
- memory cache
- memory lock
- memory queue

Production behavior:

- Redis is required for generated draft packet cache/job readiness
- invalid production Redis config blocks startup
- generated draft packet data still does not persist to DB

## Request Behavior

For `select_county` and `render_voxel_county`:

- `includeGeneratedDraft` remains optional
- default shell behavior remains shell-only
- `structuredContent` remains the county coverage summary
- `_meta.generatedDraftScene` is present only when a scene payload is ready
- `_meta.generatedDraftPacket` may be present with `generationStatus: "queued"`

Cache flow:

1. Cache hit returns `_meta.generatedDraftScene` immediately.
2. Cache miss tries a compile lock.
3. Lock acquired compiles once, writes cache with TTL, and returns the scene.
4. Lock held waits briefly for cache.
5. Timeout returns queued-safe packet metadata with no scene payload.

## Worker

`server/src/scenePacketWorker.ts` can run separately with:

```bash
pnpm start:scene-packet-worker
```

The worker:

- claims generated draft packet jobs
- compiles deterministic `CityWorldScene` payloads
- writes packets to the same cache spine
- records safe completion/failure state
- does not call live providers
- does not write DB rows
- does not affect browser pan/zoom

## Status And Readiness

`GET /api/engine/scene-packets/status` may expose:

- `cacheBackend`
- `entryCount`
- `hitRate`
- `queueDepth`
- `oldestQueuedMs`
- safe packet summaries

It must not expose payloads, terrain, roads, buildings, places, provider data,
generated district bodies, or raw Redis values.

`GET /ready` exposes safe booleans and counts only:

- server up
- web dist present
- Redis configured/reachable
- Hosted Clawd persistence DB configured/reachable when enabled
- provider lookup mode/configuration

## Backend Guardrails

Added first-pass production guardrails:

- request IDs on HTTP responses
- structured JSON logs for backend request start, provider lookup cache
  hit/miss, generated draft packet outcomes, Hosted Clawd write outcomes, auth
  denials, Stripe webhook decisions, and rate-limit denials
- per-process rate limits for provider lookup, geocode, generated draft
  requests, and Hosted Clawd writes
- production Redis config verifier

## Anti-Scope

This slice does not add:

- new public MCP tools
- browser HTTP generated-scene route
- Railway work in the pan/zoom frame loop
- DB persistence for scene packets
- provider-created geometry
- public Anaheim/Ontario
- all-US playable claims
- Hosted Clawd public paid launch
- evidence, XP, reports, exports, automation, or scheduled outreach

## Proof

- `scripts/verify-production-backend-spine.mjs`
- `artifacts/national-generation/0.72b/production-backend-spine.json`
- `pnpm verify:production-backend-spine`
