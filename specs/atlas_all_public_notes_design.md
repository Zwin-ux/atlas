# Feature: Atlas Commons Map Radar

Slice: `postalpha-0.81d-atlas-commons-map-radar`

## Requirements

While the commons flag is enabled, when anyone opens `ALL`, Atlas shall return only approved public notes and render only notes anchored in the active map scene.

While a player has a verified commons identity, when they confirm `Post publicly`, Atlas shall validate the canonical map anchor and persist one idempotent pending note without publishing any private/session note.

While a note is pending or removed, when an unrelated player lists public notes, Atlas shall not reveal the note, owner, or provider identity.

While public notes are visible, when multiple notes share one canonical place, Atlas shall render one spatial count beacon and one selected note instead of a scrolling or overlapping feed.

While the player is in `ALL` or `NEARBY`, when they select `HOT` or `NEW`, Atlas shall request the matching server sort and preserve the active place when it remains in the result.

While a public note is selected, when the player reads or acts on it, Atlas shall keep the map dominant and present actions in a slim bottom strip with no horizontal overflow at 390 CSS pixels.

## Frontend

- Add public-safe commons types and mode state.
- Add an Apps SDK `tools/call` helper; keep the host as the tool broker.
- Add one compact `ALL / NEARBY / MINE` map control.
- Add a quiet `HOT / NEW` control for public modes and persist the selected sort in widget state.
- Aggregate public markers per canonical place and render county-scale activity rings that resolve to compact count beacons at place scale.
- Render exactly one selected public note with previous/next navigation and a slim bottom action strip; do not render a feed list.
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
- Add a bounded token-gated moderation queue for `pending` and `removed` notes; expose only operator-safe note fields and preserve report-threshold context through counts/audit events.
- Make Commons readiness require database, pseudonym secret, OIDC verification, and operator credential when the feature is enabled.
- Enforce the moderation state machine (`pending -> visible|removed`, `visible -> removed`) and reject removed-note resurrection.
- Serialize Postgres report mutations per note so concurrent unique reports cannot miss the auto-hide threshold.
- Advertise Commons-only OAuth scopes when the Hosted Clawd surface is closed.
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
- [x] Add persisted `HOT / NEW` sort state and tool request parity.
- [x] Replace overlapping note/list presentation with one per-place radar beacon and one selected-note surface.
- [x] Reshape the public contextual surface into a desktop/mobile bottom strip with an explicit expandable composer.
- [x] Add operator queue, fail-closed readiness, least-privilege OAuth metadata, safe moderation transitions, and concurrent report protection.
- [x] Add focused DOM contracts, responsive browser proof, and visual comparison against the approved composite.
- [ ] Deploy the completed bundle to staging with Commons disabled, then repeat connector, moderation, rollback, and production-isolation proof.

## No-ship boundaries

No production deploy or enablement, moderator dashboard, private-note import, new MCP tool, unrelated road/engine expansion, or generic social feed is authorized by this completion pass. Staging mutation remains permitted by the owner's explicit instruction; Auth0 login itself remains owner-authenticated.
