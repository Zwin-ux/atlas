# Feature: Atlas ALL Public Notes Foundation

## Requirements

While the commons flag is enabled, when anyone opens `ALL`, Atlas shall return only approved public notes and render only notes anchored in the active map scene.

While a player has a verified commons identity, when they confirm `Post publicly`, Atlas shall validate the canonical map anchor and persist one idempotent pending note without publishing any private/session note.

While a note is pending or removed, when an unrelated player lists public notes, Atlas shall not reveal the note, owner, or provider identity.

## Frontend

- Add public-safe commons types and mode state.
- Add an Apps SDK `tools/call` helper; keep the host as the tool broker.
- Add one compact `ALL / NEARBY / MINE` map control.
- Render public markers only when the active scene contains their anchor.
- Keep private note composition unchanged; public composition requires separate copy and confirmation.
- Handle loading, empty, unavailable, pending, authentication, and rejected states.
- Preserve 44-pixel mobile targets and the map's dominant layout.

## Backend

- Add `atlasCommons` types, service, in-memory repository, and Postgres repository.
- Add migration `003_atlas_commons_public_notes.sql`.
- Add canonical county/place anchor validation.
- Attach optional verified OIDC identity to MCP request auth info.
- Feature-register `list_atlas_notes` and `write_atlas_note`.
- Add a token-gated operator moderation route.
- Add public-safe commons metadata to map-opening tool results.
- Keep the default-off tool surface byte-for-byte compatible in behavior.

## Security checkpoint

- Authentication: optional at MCP transport; required for `mine` and mutations.
- Authorization: read/write scopes checked in service; owner pending reads scoped in repository; operator route separate.
- Input: Zod transport schemas plus service validation; canonical anchor resolver; 240-character cap; link rejection.
- Output: explicit public mapper excludes owner ID, subject, email, raw reports, and audit data.
- Queries: parameterized SQL only; unique keys handle concurrency and idempotency.
- Rendering: React text nodes only; no HTML injection path.
- Abuse: per-identity write limit plus unique reaction/report rows; report threshold auto-hide.
- Secrets: pseudonym and operator secrets are environment-only and never logged.
- Failure: database/auth failures return narrow codes and do not affect existing map tools.

## Implementation plan

- [x] Add domain contracts, error codes, configuration, and canonical anchor resolver.
- [x] Add in-memory repository and service behavior with focused tests.
- [x] Add additive SQL migration and parameterized Postgres repository.
- [x] Integrate optional MCP request authentication and commons tools.
- [x] Add moderation route and readiness metadata.
- [x] Add widget tool bridge, modes, markers, and explicit posting UX.
- [x] Add emulator forwarding and verification scripts.
- [x] Run focused, regression, browser, and release-readiness gates.

## No-ship boundaries

No production deploy, live database migration, Auth0 mutation, legal-policy assertion, moderator dashboard, private-note import, or frozen-RC change is authorized by this implementation pass.
