# Atlas ALL Public Notes Runbook

Status: local-ready, no deploy authorized

Slice: `postalpha-0.81c-atlas-all-public-notes-foundation`

## Operating boundary

The commons is additive and default-off. The fastest rollback is always
`ATLAS_COMMONS_ENABLED=false`. Disabling the flag removes the two commons MCP
tools and the map control while preserving existing notes for later review. It
does not change the seven-tool Atlas surface, private/session notes, billing,
or the full-screen map.

No production migration, environment change, connector change, or deployment
is authorized by this runbook.

## Environment matrix

| Setting | Local development | Staging candidate | Production |
| --- | --- | --- | --- |
| `ATLAS_COMMONS_ENABLED` | `false` by default; `true` only for an isolated QA run | Start `false`; enable only after migration and smoke gates | Keep `false` until an explicit launch decision |
| `DATABASE_URL` | Isolated local Postgres | Staging Postgres secret | Production Postgres secret |
| `ATLAS_COMMONS_PSEUDONYM_SECRET` | Disposable local value | Secret-manager value, different from production | Secret-manager value; stable and access-restricted |
| `ATLAS_COMMONS_OPS_TOKEN` | Disposable local value | Secret-manager value | Secret-manager value; rotate independently |
| OIDC issuer/audience/JWKS | Optional for anonymous read QA | Required before authenticated write QA | Required before any enablement |
| Report threshold | Default `3` or test override | Explicit staging value | Explicit launch-policy value |
| Write limit | Default `30` actions/hour | Explicit staging value | Explicit launch-policy value |

Secrets belong in the Railway/environment secret manager. Do not commit them,
paste them into CI YAML, or store them in `.env` files checked into Git.

## Pre-enable gates

1. Install with the lockfile and run the CI-equivalent quality job.
2. Apply all committed migrations with `pnpm migrate:hosted-clawd`.
3. Run `pnpm smoke:atlas-commons:postgres` against the target staging database.
4. Start with `ATLAS_COMMONS_ENABLED=false` and verify `/ready` is healthy.
5. Confirm the MCP tool list is the original seven tools.
6. Configure OIDC and confirm protected-resource metadata advertises:
   - `atlas:commons.read`
   - `atlas:commons.write`
7. Set a stable pseudonym secret and an independent operator token.
8. Enable the flag in staging only.
9. Verify `/ready.atlasCommons` reports `enabled=true`, `available=true`,
   `databaseReady=true`, `authConfigured=true`, and `operatorConfigured=true`.
10. Run anonymous read, authenticated pending post, operator approval, public
    read, reaction, report, and mobile map checks.

## Migration behavior

Migration `003_atlas_commons_public_notes.sql` is additive. It creates only:

- `atlas_public_notes`
- `atlas_note_reactions`
- `atlas_note_reports`
- `atlas_note_moderation_events`
- `atlas_commons_actions`

It does not rewrite existing Hosted Clawd tables or private/session note data.
The migration runner records the migration and safely skips it on repeat runs.

## Rollback

### Immediate functional rollback

1. Set `ATLAS_COMMONS_ENABLED=false` in the affected environment.
2. Redeploy/restart the last approved server artifact through the normal
   platform workflow.
3. Verify `/ready` is healthy and no `atlasCommons` readiness requirement is
   gating the server.
4. Verify MCP lists exactly the original seven tools.
5. Verify Riverside opens, renders, and keeps private notes in the current chat.

This rollback leaves commons rows intact. That is intentional: an incident
should not destroy moderation evidence or user submissions.

### Artifact rollback

Promote the previously approved immutable commit/artifact, then repeat the
health, tool-list, and Riverside map checks above. Do not roll back by editing
the live filesystem or by using an unversioned image tag.

### Schema removal

Do not drop commons tables during an incident. Schema removal is a separate,
destructive data-retention decision that requires a backup, an approved
retention/export plan, and explicit owner authorization. If that later decision
is made, foreign-key order is actions, moderation events, reports, reactions,
then notes. The existing `users` table must not be removed.

## Monitoring and incident signals

Watch:

- `/ready` commons availability and database readiness;
- `list_atlas_notes` and `write_atlas_note` error counts by public error code;
- list latency against the 350 ms warm-service p95 target;
- authentication failures without logging bearer tokens;
- moderation queue age and volume;
- report-threshold auto-hides;
- database connection saturation;
- widget console errors and failures that affect the map.

If the commons fails while the map is healthy, disable only the commons flag.
Map browsing and private/session notes must remain available.

## Operator moderation probe

The operator endpoint is server-side only:

`POST /api/atlas-commons/moderation`

Send the operator token as a bearer credential and a JSON body with `noteId`
and `action` (`approve` or `remove`). Never expose this endpoint as an MCP tool
or put the operator token in the widget.

## Release decision

The local slice may be considered implementation-ready when CI, the real
Postgres smoke, feature-disabled compatibility, feature-enabled staging smoke,
and desktop/mobile map proof are green. Public launch still requires a separate
owner decision covering moderation staffing, legal copy, retention, abuse
response, and the production enablement window.
