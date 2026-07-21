# Atlas Commons Staging Runbook

Status: staging acceptance complete; staging enabled; production locked off

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
served `0781v`. The final accepted staging deployment serves `081d`, advertises
the Commons protected-resource metadata, and exposes exactly nine tools.

## Configuration

| Variable | Staging | Production |
| --- | --- | --- |
| `ATLAS_COMMONS_ENABLED` | `true` after successful proof and rollback | `false` |
| `DATABASE_URL` | isolated staging Postgres | do not change |
| `ATLAS_COMMONS_PSEUDONYM_SECRET` | configured secret | do not change |
| `ATLAS_COMMONS_OPS_TOKEN` | configured independent secret | do not change |
| `ATLAS_OIDC_ISSUER` | configured for the isolated Auth0 tenant | do not change |
| `ATLAS_OIDC_AUDIENCE` | staging MCP resource | do not change |
| `ATLAS_OIDC_JWKS_URL` | configured for the isolated Auth0 tenant | do not change |
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

## Completed acceptance record

Acceptance completed on July 21, 2026.

- Commit `ac34e2af` deployed disabled as
  `040989f0-51ae-4d31-b8fc-a4b8ec2276e1`; the disabled verifier saw seven
  tools and isolated Commons readiness/routes.
- OIDC configuration was applied while disabled and redeployed as
  `7906f0bd-41c8-4127-a8b2-6c27ae1804e2`; migration and live staging
  Postgres smoke remained green.
- The first enabled deployment was
  `3d7bc556-4ae4-4dd3-9b2d-712cad760d67`.
- Commit `ea5225ec` repaired the explicit per-tool OAuth policy and complete
  relink challenges; deployment `0a7d85a0-afce-457e-bf60-3e9cdc4a4a2f`
  passed the enabled verifier.
- Auth0 imported ChatGPT's Client Identifier Metadata Document, granted only
  `atlas:commons.read` and `atlas:commons.write`, and connected `Atlas Staging`
  through OAuth. ChatGPT shows all nine actions and widget `081d`. Connector
  action propagation took one additional reopen/refresh after OAuth; the raw
  MCP tool list was correct throughout.
- Two distinct staging users plus the operator credential proved pending
  isolation, queue approval, anonymous visibility, reaction, distinct-user
  report, removal, and cleanup. After proof, the author-only proof user was
  blocked, the proof client's device grant was disabled, and its Commons API
  grant was revoked. The dedicated `Atlas Staging Connector` identity was
  retained so the real ChatGPT connector can refresh and remain connected.
- Rollback deployment `06d79cea-0cad-4080-80ce-5a541df25884` passed with
  Commons off and exactly seven tools. Final re-enable deployment
  `fa23c787-0208-4dbc-87be-94c72c83aedf` passed with exactly nine tools and
  image digest
  `sha256:9fcb350bf048cb3ce00ebc287783b54bcb849c26381431dcb565f02709f866f5`.
- Production remained deployment `1913ad33-8abd-48a8-a36f-193a08f0d5ce`,
  image digest
  `sha256:a4d7e4b86db47b02dd465e90c08b634aa2cba40d5f68ce0abdb67943eafa3bbd`,
  healthy, Commons-absent, seven-tool, and on widget `0781v`.

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
