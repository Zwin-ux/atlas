# Post-Alpha 0.33E - DB Scene Packet Persistence Plan

## Promise

Atlas can prepare for persisted scene packets without changing the public Alpha
loop, adding a database dependency, or promoting shell/hidden counties.

## What This Adds

- Machine-readable plan:
  `artifacts/scene-packet-persistence/0.33e-db-scene-packet-persistence-plan.json`
- Human review doc:
  `docs/SCENE_PACKET_DB_PERSISTENCE_PLAN.md`
- Verifier:
  `scripts/verify-scene-packet-db-persistence-plan.mjs`

## Planned Schema

- `scene_packet_cache_entries`
- `scene_packet_generation_jobs`
- `scene_packet_audit_events`

These are planned tables only. No migration is created in this slice.

## Rollout Shape

Future storage switch:

1. `runtime_memory`
2. `db_read_through`
3. `db_write_through`

Rollback is always `runtime_memory`.

## Hard Boundaries

- No DB dependency.
- No `DATABASE_URL`.
- No migration.
- No server DB read/write code.
- No live provider normalization.
- No raw Google/provider payload storage.
- No user, Stripe, OAuth, XP, evidence, or automation data.
- No public Anaheim/Ontario promotion.

## Verification

Run:

```powershell
node scripts\verify-scene-packet-db-persistence-plan.mjs --json-only
```

The verifier checks the plan artifact, human doc, schema coverage, rollback
path, forbidden stored fields, package dependencies, migrations, env drift, and
server DB runtime tokens.

## Next

Default next move is engine quality. DB implementation only starts after
explicit human approval and a separate DB preflight/migration-review gate.
