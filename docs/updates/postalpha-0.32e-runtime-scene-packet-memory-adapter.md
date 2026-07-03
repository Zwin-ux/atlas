# Post-Alpha 0.32E - Runtime Scene Packet Memory Adapter

## Promise

Atlas can cache the current public Riverside playable scene packet in server
runtime memory without changing the public Alpha loop, adding persistence, or
pretending shell counties are playable.

## What Shipped Locally

- `server/src/scenePacketMemoryAdapter.ts` adds a bounded per-process memory
  adapter backed by the 0.31E scene packet cache contract.
- Public Riverside scene packets track deterministic keys, TTL expiry,
  `createdAt`, `expiresAt`, `lastAccessedAt`, `hitCount`, `cacheHit`, policy,
  generation status, and safety summary.
- `select_county` and `render_voxel_county` attach safe packet metadata in
  `_meta.scenePacket`.
- Full playable scenes stay only in `_meta.scene`.
- Shell and unsupported counties return packet status metadata only and never
  receive `_meta.scene`.
- `GET /api/engine/scene-packets/status` returns cache summaries only.

## Verification

- `pnpm build:server`
- `node --check scripts\verify-scene-packet-memory-adapter.mjs`
- `node --check scripts\verify-mcp-flow.mjs`
- `node --check scripts\verify-submission.mjs`
- `node --check scripts\verify-tool-result-shape.mjs`
- `node scripts\verify-scene-packet-memory-adapter.mjs --json-only`

## Anti-Scope Held

No DB persistence, migrations, live provider calls, provider geometry,
package/env drift, MCP tool-list changes, public Anaheim/Ontario promotion,
Hosted Clawd, Stripe, XP, evidence, OAuth, automation, reports, exports, or
Railway mutation.

## Next

`0.33E DB Scene Packet Persistence Plan` is a schema/review/rollback planning
gate only. It should decide what can be persisted, how TTL/refresh works, how
migrations roll back, and which provider-boundary tests block the work before
any database code lands.
