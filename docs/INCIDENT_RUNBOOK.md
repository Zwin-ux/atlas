# Atlas Incident Runbook (P5.2)

Production crash classes observed and fixed 2026-07-11/12, with diagnosis
recipes. Read this BEFORE debugging any deploy failure or Redis anomaly.

## Class 1 — node-redis unhandled 'error' event kills the process
**Signature:** deploy fails healthcheck; deployment logs show
`Cannot read properties of undefined (reading 'reject')` then
`Socket closed unexpectedly`, process exits, restart loop.
**Cause:** node-redis emits 'error' events; with no listener Node kills the
process. Trigger was error replies during handshake (see Class 3) and
WRONGTYPE replies from legacy-typed keys.
**Fixed by:** error listener in `createLazyRedisConnector`
(server/src/scenePacketMemoryAdapter.ts) + v2 queue key namespace +
process-level guard in server/src/index.ts (redis-internal errors log
`redis_internal_error_guarded` and continue; everything else still
fail-fast).
**If it recurs:** check the guard still covers the stack (`@redis/client`
in error.stack); check for NEW redis client instances created without the
lazy connector.

## Class 2 — node-redis connectTimeout throws UNCAUGHT on slow connects
**Signature:** same healthcheck death but logs show `TimeoutError` from
`commands-queue.js` thrown in a timer callback.
**Cause:** @redis/client v6 implements socket connectTimeout with an abort
timer whose rejection is not routed to any promise. Cold containers
connecting to redis.railway.internal can exceed small timeouts.
**Fixed by:** NO connectTimeout on the client; bounded reconnectStrategy
(3 attempts, returns Error => connect() rejects promptly) + connectPromise
reset-on-failure so later calls retry fresh.
**Rule:** never add socket.connectTimeout back without upstream fix.

## Class 3 — Redis maxclients exhaustion (the root of release night)
**Signature:** new deploys die at handshake with Class-1 symptoms while the
OLD deployment keeps working; read-only diagnostic cannot connect;
`ERR max number of clients reached` if anything gets a reply through.
**Cause:** failed deployments crash-loop (restartPolicy), each boot opens
connections; storms from repeated failed deploys exhaust the pool. The
worker service's inherited HTTP healthcheck guarantees crash-loops on
every worker deploy (it cannot answer HTTP).
**Fixed by:** restartPolicyMaxRetries 10 -> 3 (railway.json); release
script SKIPS the worker (guard in scripts/release-deploy.ps1) until its
dashboard Healthcheck Path is cleared (P0.4, HUMAN).
**Recovery:** `railway redeploy --service Redis --yes` (HUMAN — clears all
connections), wait ~30s, verify with
`ATLAS_REPRO_REDIS_URL=<public url> node scripts/repro-redis-claim.mjs`
(read-only), then redeploy backend only.

## Standing diagnosis tools
- `scripts/verify-release-prod.mjs` — 9-contract prod gate (run after ANY
  deploy; ATLAS_PUBLIC_BASE_URL env).
- `scripts/repro-redis-claim.mjs` — read-only prod-Redis probe (ping,
  zCard/zRange, read-only EVAL, connection-survival).
- `railway logs <deployment-id> -d --lines 40` — logs of a FAILED
  deployment (plain `railway logs` shows the ACTIVE one — wrong logs!).
- Live traffic tail during G8 sessions: poll
  `railway logs --service atlas-backend --lines 40` + grep
  mcp_tool_/widget events (CLI does not stream when piped).
- `/api/ops/mcp-stats` + `/ready` scenePacketCache block (claimedCount,
  queueDepth, redisReachable).

## Deploy protocol (the one that works)
1. Clean worktree at certified commit (`Documents/atlas-deploy-worktree`).
2. `scripts/release-deploy.ps1` (backend-only until P0.4; polls to SUCCESS;
   runs release gate + public sanity with cold-start retries built in).
3. Any failure: get the deployment id from the script output, pull ITS
   logs (`-d`), match against the classes above BEFORE redeploying.
