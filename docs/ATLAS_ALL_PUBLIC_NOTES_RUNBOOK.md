# Atlas Commons Staging Runbook

Status: staging authorized; production locked off

Slice: `postalpha-0.81d-atlas-commons-map-radar`

## Release boundary

The owner authorized the isolated staging sequence: deploy with Commons off,
verify migration and OAuth, refresh the staging connector, enable staging,
prove moderation, prove flag rollback, then leave staging enabled. Production
must remain unchanged with the original seven tools and
`ATLAS_COMMONS_ENABLED=false`.

The fastest rollback is the flag. Turning it off removes the two Commons tools
and UI metadata without deleting notes or changing private/session notes.

## Known environments

| Environment | Base URL | Required final state |
| --- | --- | --- |
| Staging | `https://atlas-backend-staging-9d6c.up.railway.app` | Commons enabled only after all gates |
| Production | `https://atlas-backend-production-e6fc.up.railway.app` | Commons off; exactly seven tools |

Read-only baseline captured July 21, 2026:

- staging deployment `69bae4cc-2cf2-44cb-a62c-c7522c1ed905`, image digest
  `sha256:7ad8d4fd3fe3d480ed789395d0a945aa5f76ab29f32071a1585314b8bf6f5a01`;
- production deployment `1913ad33-8abd-48a8-a36f-193a08f0d5ce`, image digest
  `sha256:a4d7e4b86db47b02dd465e90c08b634aa2cba40d5f68ce0abdb67943eafa3bbd`;
- both services have no automatic repo/image source, so a branch push does not
  auto-deploy production.

Immediately before mutation, both environments were healthy, reported no
`atlasCommons` readiness block, exposed exactly seven tools, and returned 404
for protected-resource metadata. Staging served widget `081c`; production
served `0781v`.

## Configuration

| Variable | Staging | Production |
| --- | --- | --- |
| `ATLAS_COMMONS_ENABLED` | `false` through deploy/migration/OAuth; `true` only for proof | `false` |
| `DATABASE_URL` | isolated staging Postgres | do not change |
| `ATLAS_COMMONS_PSEUDONYM_SECRET` | configured secret | do not change |
| `ATLAS_COMMONS_OPS_TOKEN` | configured independent secret | do not change |
| `ATLAS_OIDC_ISSUER` | required before enablement | do not change |
| `ATLAS_OIDC_AUDIENCE` | staging MCP resource | do not change |
| `ATLAS_OIDC_JWKS_URL` | required before enablement | do not change |
| Hosted Clawd persistence/money/save surface | off | off |

Secrets stay in the platform secret manager. The verifier accepts user,
reporter, and operator credentials through environment variables only and does
not print them.

## Ordered staging sequence

1. Capture staging and production deployment IDs, image digests, `/ready`, and
   MCP tool lists. Production must report seven tools.
2. Push the green commit. Confirm no production deployment starts.
3. Deploy that commit to staging with `ATLAS_COMMONS_ENABLED=false`.
4. Run:

   ```powershell
   pnpm verify:atlas-commons:staging -- --base https://atlas-backend-staging-9d6c.up.railway.app --expect disabled
   ```

5. Run the additive migration and staging Postgres smoke. The Railway CLI
   smoke prefers its injected `DATABASE_PUBLIC_URL` because
   `*.railway.internal` is not resolvable from the operator host.
6. Configure the staging OIDC issuer, audience, JWKS URL, and exact scopes:
   `atlas:commons.read` and `atlas:commons.write`.
7. Refresh the ChatGPT staging connector. While the flag is off it must still
   expose only seven tools and no Commons scopes.
8. Enable Commons in staging, deploy/restart once, then run:

   ```powershell
   pnpm verify:atlas-commons:staging -- --base https://atlas-backend-staging-9d6c.up.railway.app --expect enabled
   ```

9. For the real lifecycle proof, provide three distinct staging credentials:
   `ATLAS_COMMONS_USER_TOKEN`, `ATLAS_COMMONS_REPORTER_TOKEN`, and
   `ATLAS_COMMONS_OPS_TOKEN`, then add `--prove-moderation`. The verifier proves
   anonymous OAuth challenges, pending isolation, operator queue/approval,
   anonymous visibility, reaction, distinct-user report, removal, and cleanup.
10. Prove rollback: flag off -> redeploy -> seven tools; flag on -> redeploy ->
    nine tools. Leave staging enabled only if every enabled gate passes.
11. Recheck production deployment ID, digest, `/ready`, and exactly seven tools
    after every staging mutation phase.

## Migration and data safety

Migration `003_atlas_commons_public_notes.sql` is additive and repeat-safe. It
creates the notes, reactions, reports, moderation events, and action-ledger
tables. It does not import or rewrite private/session notes.

Do not drop Commons tables during rollback. Keeping rows preserves moderation
evidence and pending submissions. Schema removal requires a separate retention,
backup, and destructive-change decision.

## Monitoring and stop conditions

Watch Commons readiness, database readiness, authentication failures without
token logging, operator queue age, report auto-hides, list latency, MCP error
rates, connection saturation, and widget console errors.

Stop and return to the disabled staging state if any of these fail:

- the map readiness becomes unhealthy;
- the disabled surface exposes more than seven tools;
- enabled readiness is not fully true;
- OAuth advertises Hosted Clawd scopes;
- pending/removed notes appear anonymously;
- moderation cannot remove a proof note;
- production deployment ID, digest, tool count, or flag posture changes.

Public launch remains a separate owner decision covering moderation staffing,
retention, legal copy, abuse response, and a production window.
