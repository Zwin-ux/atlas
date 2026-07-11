# W6-SRE Result

Packet: W6.3 worker durability, W6.4 shared rate limits, W6.5 MCP instrumentation.

## Claim/Ack Design

Redis job keys:
- Pending jobs: `atlas:scene-packet-jobs:pending` sorted set, score `enqueuedAtMs`, value JSON `ScenePacketGeneratedDraftJob`.
- Claimed jobs: `atlas:scene-packet-jobs:claimed` sorted set, score `claimExpiresAtMs`, value JSON `{ job, claim }`.
- Done markers: `atlas:scene-packet-jobs:done:<jobId>` string, `EX 3600`.
- Failed markers: `atlas:scene-packet-jobs:failed:<jobId>` JSON string, `EX 86400`.
- Durable packet payload: `atlas:scene-packet-cache:<scenePacketCacheKey>`.

Claim metadata:

```json
{
  "ownerId": "scene-packet-worker:<pid>:<uuid>",
  "claimedAtMs": 1720000000000,
  "claimExpiresAtMs": 1720000030000
}
```

TTL:
- Claim TTL follows the existing scene-packet lock TTL: `ATLAS_SCENE_PACKET_LOCK_TTL_SECONDS * 1000`.
- Default claim TTL is 30 seconds, matching the default compile lock TTL.

Crash recovery:
1. `claim()` first requeues expired claimed envelopes from `claimed` back to `pending` when no done marker exists.
2. Claim then atomically moves the oldest pending job into `claimed` with owner/timestamp metadata.
3. If a worker crashes after claim and before ack, no done marker is written. After TTL, the next claim/status pass returns the job to `pending`.
4. `complete(jobId)` now acks generated-draft jobs only after the matching scene packet cache payload exists. A deferred/no-payload compile leaves the claim in place so TTL recovery can requeue it.
5. `fail(jobId, error)` removes pending/claimed entries and writes the failed marker for explicit compile failures.

Memory backend:
- Keeps the current in-process queue behavior, but exposes the same claim/ack/status interface.
- Memory claims include owner/timestamps for interface parity; `claimedCount` remains `0` because memory claims are removed immediately as before.

## Shared Rate Ledger

Redis rate keys:
- Storage prefix: `atlas:rate-limit:`.
- Existing logical keys are preserved after the prefix, for example:
  - `generated_draft:<clientAddress>:<countySlug>`
  - `mcp_expensive_tool:<clientAddress>`
  - `world_lookup:<clientAddress>:<discriminator>`
  - `hosted_clawd_write:<clientAddress>:<operation>`

Window:
- Same fixed 60 second window as the previous in-memory ledger.
- Redis value is JSON `{ resetAtMs, count }` with PX expiry to the reset time.
- The Redis ledger uses one Lua `EVAL` to read/increment/deny atomically across replicas.

Fallback:
- If Redis is absent, the existing in-memory `Map` ledger is used.
- If Redis is configured but connect/eval/result parsing fails, the tool logs `rate_limit_redis_fail_open` and falls back to memory for that call. The request continues; Redis outage does not become a 500.
- `verify-server-hardening.mjs` now has an additive `redis_rate_limit_fail_open` gate using `ATLAS_REDIS_URL=redis://127.0.0.1:1` plus mock geo. It proved a 200 world lookup and the fail-open log event.

## MCP Instrumentation

Every registered MCP tool is wrapped by `instrumentMcpTool()`:
- `lookup_world_places`
- `select_county`
- `ask_county_question`
- `render_voxel_county`
- `preview_scout_drop`
- `preview_campaign_engine`
- `get_upgrade_options`

Events:
- `mcp_tool_started`: request id and tool name.
- `mcp_tool_finished`: request id, tool name, duration ms, `ok`, and error class only on failure.

Read-only endpoint:
- `GET /api/ops/mcp-stats`

Sample shape:

```json
{
  "ok": true,
  "version": "0.1.0",
  "mcp": {
    "tools": {
      "select_county": {
        "calls": 2,
        "errors": 0,
        "latency": {
          "count": 2,
          "totalMs": 14,
          "maxMs": 11
        }
      }
    }
  }
}
```

No PII is exposed; stats are counts and timings only.

## Ready Shape

`/ready` remains additive. Scene packet cache now includes:

```json
{
  "scenePacketCache": {
    "cacheBackend": "memory",
    "redisConfigured": false,
    "redisReachable": null,
    "entryCount": 2,
    "hitRate": 0.5,
    "queueDepth": 0,
    "claimedCount": 0,
    "oldestQueuedMs": null,
    "oldestClaimedMs": null
  }
}
```

## Files Changed

- `packages/core/src/index.ts`
- `packages/core/src/world/index.ts`
- `packages/core/src/world/scenePacketJobQueue.ts`
- `packages/core/test/scene-packet-cache.test.ts`
- `server/src/index.ts`
- `server/src/scenePacketMemoryAdapter.ts`
- `scripts/verify-server-hardening.mjs`
- `artifacts/council/CODEX_RESULT_W6SRE.md`

## Gate Tails

`pnpm typecheck:starter`

```text
$ pnpm build:core && pnpm build:geo && tsc -p server/tsconfig.json --noEmit && tsc -p web/tsconfig.json --noEmit
$ pnpm --dir packages/core build
$ tsc -p tsconfig.json
$ pnpm --dir packages/geo build
$ tsc -p tsconfig.json
```

`pnpm test:core`

```text
Test Files  22 passed (22)
Tests       136 passed (136)
scene-packet-cache.test.ts (11 tests) passed
```

`node scripts/verify-server-hardening.mjs`

```json
{
  "ok": true,
  "gates": [
    "mcp_hostile_origin_403",
    "mcp_no_origin_200_family",
    "hostile_host_rejected",
    "health_probes_bypass_host_admission",
    "redis_rate_limit_fail_open",
    "hosted_clawd_write_404_without_persistence",
    "mcp_preflight_cors_reflection"
  ],
  "blockerCount": 0,
  "tail": [
    "rate_limit_redis_fail_open scope=world_lookup error=Error",
    "provider_lookup_cache_miss mode=mock"
  ]
}
```

`node scripts/verify-tool-result-shape.mjs`

```json
{
  "ok": true,
  "update": "postalpha-0.32e-runtime-scene-packet-memory-adapter",
  "blockerCount": 0,
  "blockers": []
}
```

`node scripts/verify-mcp-flow.mjs` self-hosted mock-mode

```json
{
  "ok": true,
  "ready": {
    "ok": true,
    "cacheBackend": "memory",
    "claimedCount": 0,
    "oldestClaimedMs": null
  },
  "mcpStats": {
    "select_county": { "calls": 2, "errors": 0 },
    "render_voxel_county": { "calls": 2, "errors": 0 },
    "lookup_world_places": { "calls": 2, "errors": 0 }
  },
  "verifierTail": {
    "lookupPlaceCount": 5,
    "cachedLookup": true,
    "selectedCountySceneId": "voxel-riverside-ca-eastvale-alpha",
    "shellCountyTier": "L1_COUNTY_SHELL",
    "hostedClawdStatus": "planned_beta"
  }
}
```

## Risks

- Redis claim/ack is covered by code path and local fail-open verification, but not by a live Redis integration test in this run.
- Explicit compile failures still move to the failed marker; W6.3 crash recovery covers unacked claims, not automatic retries for deterministic compile exceptions.
- The worker entrypoint was not edited because it is outside the packet's hard writable fence. The Redis queue adapter now prevents premature ack on missing durable payload even if the worker calls `complete()` after a deferred result.
- `verify-server-hardening.mjs` no longer uses Windows `taskkill /t`; it stops only the direct spawned child process. Probe ports used in this run were confirmed closed afterward.
