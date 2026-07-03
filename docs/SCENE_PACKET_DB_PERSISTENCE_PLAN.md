# 0.33E DB Scene Packet Persistence Plan

Status: planning only. No database implementation is approved by this document.

## Purpose

0.31E created the scene packet cache contract. 0.32E proved runtime memory on the
server. 0.33E defines the database shape that can be reviewed later, before any
database client, migration, environment variable, or persistent code path lands.

The goal is instant scene packet lookup without weakening Atlas boundaries:
Riverside is playable, shells are metadata only, hidden drafts stay hidden, and
provider lookup cannot become map geometry or readiness.

## Storage Decision

Preferred future store: Postgres-compatible relational database, likely Railway
Postgres or equivalent after review.

Reason:
- deterministic key lookup is primary;
- TTL expiry and refresh need indexed timestamps;
- packet summaries and bounded scene payloads fit JSON columns;
- additive migrations and rollback are straightforward;
- no queue or object store is needed for the first persistence gate.

Not chosen in 0.33E:
- provider or exact database;
- migration tool;
- DB client package;
- `DATABASE_URL` shape;
- background worker;
- Hosted Clawd persistence.

## Future Feature Flag

Future name: `ATLAS_SCENE_PACKET_STORAGE`.

Values:
- `runtime_memory`: current behavior and rollback default.
- `db_read_through`: read DB if present, otherwise compile/runtime-cache.
- `db_write_through`: compile/runtime-cache and write approved packet rows.

This slice does not add the env var.

## Proposed Tables

### `scene_packet_cache_entries`

Stores deterministic packet metadata and, after approval, optional bounded scene
payloads.

Required fields:
- `key` primary key.
- readiness and identity: country, state, county, district.
- cache key parts: camera preset, window hash, scene schema version, engine
  update id.
- payload kind: `voxel_scene`, `coverage_shell_metadata`,
  `unsupported_status`, or `hidden_draft_evidence`.
- safe packet summary JSON.
- optional scene payload JSON, allowed only for readiness states that may carry
  a scene.
- source notes JSON with no raw provider payload.
- generation status/mode/blockers.
- safety result.
- created, refreshed, expires, last accessed timestamps.
- hit count.
- soft delete timestamp.

Hard constraints:
- shell and unsupported rows must never store scene payloads.
- hidden drafts must never become public routes.
- provider/background generation modes stay blocked until later gates reopen.
- diagnostic output must never expose scene payload JSON.

### `scene_packet_generation_jobs`

Future status only. No worker is enabled by this plan.

It records packet key, mode, status, blockers, and timing so future provider or
background generation can be reviewed without inventing product state.

### `scene_packet_audit_events`

Small audit trail for cache writes, refreshes, expiry, evictions, and rollback
actions. It must not store user data, provider payloads, evidence, XP, OAuth,
or payment data.

## TTL Plan

- `public_playable`: 1 hour TTL, 5 minute stale-while-revalidate window.
- `shell_only`: 24 hour metadata TTL, no scene payload.
- `hidden_draft`: 30 minute internal evidence TTL, no public route.
- `unsupported`: not persisted.

## Data Boundaries

Allowed:
- deterministic packet key;
- readiness;
- county/district identity;
- camera/window/schema/update parts;
- safe packet summary;
- curated source notes;
- generation status and blockers;
- safety result;
- bounded compiled scene payload only after approval.

Forbidden:
- raw Google provider payload;
- Google `placeId`, `primaryType`, or `types`;
- provider geometry;
- user id;
- Clawd id;
- private business notes;
- Stripe customer id;
- OAuth token;
- XP ledger;
- evidence payload;
- automation target.

## Migration Review Plan

Pre-migration checks:
- human approval;
- DB provider and env review;
- dependency review for the smallest DB client;
- additive SQL migration review;
- provider-boundary verifier green;
- MCP/submission verifiers green;
- split guard green.

Post-migration checks:
- `runtime_memory` still works;
- `db_read_through` falls back safely on DB miss;
- `db_write_through` writes only approved packet shapes;
- diagnostic route never returns scene payload JSON;
- Riverside product loop remains green;
- Orange shell and Unknown/L0 remain honest and recoverable.

Rollback:
1. Set storage mode back to `runtime_memory`.
2. Redeploy without changing MCP tools or widget contracts.
3. Leave additive tables in place while expired rows age out.
4. Run a reviewed purge for expired cache entries if needed.
5. Drop tables only in a later reviewed migration after no code path reads them.

## Required Gates Before Implementation

- Axiom/human approval.
- Forge env review.
- Forge migration review.
- Forge provider-boundary review.
- Mira MCP/product proof.
- Mira public loop proof.
- Lumen visual check only if renderer behavior changes.

## Blocked Until Approval

- DB package dependencies.
- `DATABASE_URL`.
- migrations.
- server persistence code.
- background generation jobs.
- live provider normalization.
- Hosted Clawd persistence.
- Stripe.
- XP/evidence.
- OAuth.
- automation, reports, exports.
