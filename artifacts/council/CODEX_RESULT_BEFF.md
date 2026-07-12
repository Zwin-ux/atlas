# Atlas Packet B-EFF - Backend Efficiency

## Session Reuse Design

`/mcp` now uses stateful Streamable HTTP sessions instead of constructing a server and transport for every request.

- New initialize requests create one `McpServer` plus one `StreamableHTTPServerTransport`.
- The SDK generates the `mcp-session-id` with `randomUUID()`.
- `onsessioninitialized` stores `{ server, transport, lastSeenAtMs }` in an in-memory `mcpSessions` map.
- Later POST/GET/DELETE requests with the same `mcp-session-id` reuse that entry and do not reconnect the server.
- Idle eviction is lazy on request: 30 minute TTL, max 100 sessions, oldest first over cap.
- Session close/eviction calls `server.close()`, which closes the owned transport.
- Per-request W6.5 instrumentation and rate limiting still run inside `requestContext.run(...)` around `transport.handleRequest(...)`.

Protocol shape remains Streamable HTTP: initialize handshake returns a session id, subsequent requests must send it, invalid session ids return JSON-RPC session-not-found, and DELETE closes through the SDK transport.

## Latency

Measured against a local mock server with one MCP client and 20 sequential `select_county` calls for `orange-ca`.

| Build | Total ms | Mean ms | Median ms | P95 ms | Min ms | Max ms | Last `_meta` chars | Last `_meta` keys |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Before | 108.064 | 5.403 | 3.838 | 13.415 | 3.292 | 17.011 | 131,278 | `coverageShellScene`, `scenePacket` |
| After | 52.682 | 2.634 | 2.256 | 3.254 | 1.855 | 6.801 | 844 | `scenePacket` |

## New Wire Shape

Shell county tool results no longer attach `_meta.coverageShellScene`.

- `structuredContent` remains `countyCoverageSummary`.
- `_meta.scenePacket` remains for shell readiness.
- `_meta.generatedDraftSpec` and `_meta.generatedDraftPacket` still attach only when `includeGeneratedDraft` is true and a packet is ready.
- The widget compiles shell scenes from the coverage summary with `compileCountyShellCityWorldScene(...)`, memoized in `App.tsx`.
- Legacy read compatibility remains: if an old result carries `_meta.coverageShellScene`, the widget can still consume it.

Emulator source did not need a change. `web/src/emulator/mockHost.ts` delivers the result object with `_meta` intact and only strips oversized `generatedDraftScene` under its existing payload policy.

## Worst `_meta`

Worst measured draft-county call after the slice:

```json
{
  "countySlug": "jefferson-al",
  "metaChars": 7751,
  "metaKeys": ["generatedDraftPacket", "generatedDraftSpec", "scenePacket"],
  "generatedDraftSpecChars": 5933,
  "generatedDraftPacketChars": 925,
  "hasCoverageShellScene": false
}
```

This is under the requested 15KB ceiling.

## Files Changed

- `server/src/index.ts`
- `web/src/App.tsx`
- `packages/core/test/city-world-compiler.test.ts`
- `scripts/verify-mcp-flow.mjs`
- `scripts/verify-shell-county-widget.mjs`
- `artifacts/council/CODEX_RESULT_BEFF.md`

The required generated-draft verifier refreshed its pre-existing dirty artifact at `artifacts/national-generation/0.71h/generated-draft-scene-packet.json`; it was not staged.

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
city-world-compiler.test.ts (19 tests) passed, including:
compiles county shell scenes deterministically from JSON-round-tripped coverage summaries

Test Files 1 failed | 21 passed (22)
Tests 7 failed | 130 passed (137)
Failing file: test/city-world-generated-district.test.ts
Representative failures: palette distinctness 0.133 < 0.145; material richness 0.4 < 0.6; coastal California expected coastal_grid but got metro_grid.
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

`node scripts/verify-mcp-flow.mjs` against self-hosted mock server

```text
Shell county assertions reached the new wire shape:
_meta keys after shell select_county: ["scenePacket"]

Error: Upgrade options must clearly say checkout is unavailable in Alpha.
    at scripts/verify-mcp-flow.mjs:325:5
```

`node scripts/verify-server-hardening.mjs`

```text
Command timed out after 122s with no JSON summary.
Manual recorded-PID harness passed: mcp_hostile_origin_403, mcp_no_origin_200_family,
hostile_host_rejected, health_probes_bypass_host_admission,
hosted_clawd_write_404_without_persistence, mcp_preflight_cors_reflection.
Manual Redis leg failed: /api/world/lookup timed out while Redis connection retries logged ECONNREFUSED;
expected rate_limit_redis_fail_open event was not logged.
```

`node scripts/verify-generated-draft-scene-packet.mjs`

```text
"ok": true
"update": "postalpha-0.76t-ship-params-not-scenes"
"maxGeneratedDraftSpecChars": 5933
"maxGeneratedDraftWireMetaChars": 6905
"representativeCompileMs": 13.595
"blockerCount": 0
```

## Risks

- `pnpm test:core` is still blocked by generated-district visual/parameter expectations outside the shell payload and MCP lifecycle changes.
- `verify-mcp-flow` is still blocked by Hosted Clawd upgrade-copy text outside this packet.
- `verify-server-hardening` is blocked by Redis rate-limit fail-open behavior hanging instead of returning promptly.
- The shell payload path is now dependent on `stateCode` staying in `countyCoverageSummary`; verifiers now assert that field for shell counties.
