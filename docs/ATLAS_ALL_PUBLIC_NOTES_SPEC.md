# Atlas ALL Public Notes Foundation

Status: Approved product direction; implementation slice open

Slice ID: `postalpha-0.81c-atlas-all-public-notes-foundation`

## Player promise

Atlas feels inhabited. A player can open a county, switch the map to `ALL`, and see short public notes attached to real Atlas places. Reading is open. Posting is an explicit, authenticated act. Private and session notes never become public by accident.

The map remains the feed. Atlas does not add a dashboard, social timeline, or permanent card rail.

## Engineering promise

Ship the smallest durable commons contract behind a default-off feature flag. Reuse the existing Postgres and OIDC foundations, keep public identity pseudonymous, moderate every new note before broad visibility, and preserve the frozen release candidate and current production behavior.

## Scope

This foundation includes:

- an `ALL` public-note layer for the active county;
- a compact `ALL / NEARBY / MINE` map control;
- anonymous reads of approved public notes;
- authenticated, explicit public posting;
- author-visible pending notes;
- one lightweight positive reaction;
- reporting from day one;
- operator moderation outside the player-facing MCP surface;
- capped, cursor-based responses and deterministic ranking;
- local and staged verification with the feature disabled by default.

`ALL` means the shared Atlas commons. In the county map it renders public notes anchored in that county. The server contract may return a cross-county public feed when no county is supplied, so a later national overview does not require a new storage model.

`NEARBY` means public notes for the selected place. With no place selected, it falls back to the active county.

`MINE` means the player's existing private/session notes plus that player's pending public submissions. Existing private/session notes are never copied, promoted, or published implicitly.

## Product decisions

- Anyone may read approved public notes.
- Posting, reacting, reporting, and reading one's pending submissions require a valid Atlas identity token.
- Writers are represented by stable Atlas-generated pseudonyms. Email addresses, OAuth subjects, and provider profile names are never exposed publicly.
- Public posting uses a dedicated `Post publicly` action and a confirmation state. The existing private note action remains private.
- New notes start as `pending`. The author sees them immediately in `MINE`; everyone else sees them only after approval.
- V1 allows text only, 1-240 visible characters after trimming.
- External links are rejected in V1. Notes containing common URL schemes or `www.` do not enter the moderation queue.
- Notes attach to a known Atlas county and known place/town identifier. V1 does not accept arbitrary coordinates.
- Public-note storage is durable. Private/session-note persistence remains a separate product decision and is not silently expanded by this slice.
- The commons is off unless `ATLAS_COMMONS_ENABLED=true` and the persistence/auth dependencies are configured.
- No production deploy, frozen-RC mutation, billing change, or Hosted Clawd product revival is part of this slice.

## Functional requirements

### Discovery and reading

- When the commons flag is enabled, the system shall expose `list_atlas_notes` as a read-only MCP tool.
- When no county is supplied, `list_atlas_notes` shall return a capped cross-county `ALL` feed of approved notes.
- When a county is supplied, `list_atlas_notes` shall return only approved notes for that county.
- When both a county and place are supplied, `list_atlas_notes` shall return only approved notes for that anchor.
- When a valid authenticated identity requests `mine`, the system shall include that identity's pending and approved public submissions and shall exclude every other identity's pending submissions.
- The system shall never return removed notes to the player-facing read tool.
- The system shall order `hot` results with a deterministic score derived from reactions, reports, age, and creation time. It shall also support `new` order.
- The system shall return no more than 100 notes per call and shall default to 30.

### Posting and community actions

- When an authenticated player explicitly chooses `Post publicly`, the system shall create one pending note attached to the supplied known Atlas anchor.
- When the same identity retries a post with the same `clientRequestId`, the system shall return the original note and shall not create a duplicate.
- If a request is anonymous, the system shall reject posting, reacting, reporting, and `mine` reads with an OAuth challenge.
- If a note body is empty, longer than 240 characters, or contains an external link, the system shall reject it before persistence.
- If a county or place identifier is unknown to Atlas, the system shall reject the request before persistence.
- When an authenticated player reacts to an approved note, the system shall store at most one positive reaction from that identity for that note.
- When an authenticated player removes a reaction, the system shall remove only that identity's reaction.
- When an authenticated player reports a visible note, the system shall store at most one report from that identity for that note.
- The author shall not be able to report their own note.

### Moderation

- New public notes shall start in `pending`.
- When an authorized operator approves a pending note, the system shall set it to `visible` and record its publication time.
- When an authorized operator removes a pending or visible note, the system shall set it to `removed` without deleting its audit record.
- Operator moderation shall use a server-side operator credential and shall not be exposed as a ChatGPT/MCP player tool.
- When a visible note reaches the configured report threshold, the system shall hide it from public reads pending operator review while preserving it for audit.

### Map-native interface

- When the commons is available, the county map shall show one compact `ALL / NEARBY / MINE` control without reducing the map from the primary full-screen surface.
- When `ALL` or `NEARBY` is selected, approved public notes with anchors in the active scene shall appear as restrained map markers.
- When a public-note marker is selected, the interface shall show the note, pseudonym, relative time, reaction count, and report action in the existing contextual surface.
- When `MINE` is selected, the interface shall preserve the current private/session-note flow and may show the player's pending public submissions with an explicit `Pending review` label.
- On narrow screens, every mode and action target shall be at least 44 CSS pixels and shall remain reachable without horizontal scrolling.
- The interface shall not add a permanent feed rail, result-list takeover, generic card grid, or separate social dashboard.

### Availability and compatibility

- When `ATLAS_COMMONS_ENABLED` is absent or false, the server shall not register the two commons MCP tools and shall preserve the current public tool surface.
- When the commons flag is enabled but Postgres is unavailable, the server shall report the commons as unavailable and shall fail commons calls without affecting county search, selection, or rendering.
- Existing Atlas county, national-generation, and session-note contracts shall remain backward compatible.
- Existing private/session note data shall remain client-local unless a separate approved slice changes that contract.

## MCP contract

### `list_atlas_notes`

Read-only. Anonymous for public modes; authenticated for `mine`.

Input:

- `mode`: `all | mine`, default `all`
- `countySlug`: optional canonical county slug
- `placeId`: optional; requires `countySlug`
- `sort`: `hot | new`, default `hot`
- `limit`: integer 1-100, default 30
- `cursor`: optional opaque pagination cursor

Output:

- `notes`: capped public-safe note records
- `nextCursor`: optional opaque cursor
- `scope`: normalized query scope
- `_meta.atlasCommons`: availability, active mode, moderation copy, and public-safe counts

### `write_atlas_note`

Authenticated. One narrow mutation tool with an explicit operation enum.

Operations:

- `post`: `countySlug`, `placeId`, `placeLabel`, `body`, `clientRequestId`
- `react`: `noteId`, `active`
- `report`: `noteId`, `reason`

The tool returns only the affected public-safe record and operation result. It never returns provider subject IDs, email addresses, raw moderation evidence, or other users' private state.

## Public-safe note shape

- `id`
- `countySlug`
- `placeId`
- `placeLabel`
- `body`
- `authorHandle`
- `status` only when the requesting author is allowed to see it
- `reactionCount`
- `createdAt`
- `publishedAt` when visible
- `viewerHasReacted` only for an authenticated viewer
- `viewerCanReport`

## Non-functional requirements

### Security and privacy

- OAuth issuer, audience, signature, expiry, and required scopes are validated server-side.
- Authorization is enforced inside the service boundary as well as the transport boundary.
- Database reads are explicitly scoped; no request may infer another user's pending notes or provider identity.
- Public outputs use allowlisted fields.
- All SQL is parameterized.
- Operator credentials and bearer tokens are never logged.
- Bodies are rendered as text, never HTML.

### Reliability and performance

- Public-list p95 target is under 350 ms at the service boundary for a warm Postgres connection and a 30-note response.
- Write operations are idempotent where retries can duplicate state.
- Pagination order is stable for equal scores through a creation-time and ID tie-breaker.
- Public responses remain below 64 KiB through record and body caps.
- A commons failure cannot take down the map or existing MCP tools.

### Accessibility and product quality

- Mode controls expose pressed/selected state to assistive technology.
- Public/private actions use words, not color alone, to communicate scope.
- Loading, empty, pending, unavailable, and rejected states have direct human copy.
- The UI uses the existing Atlas visual system and avoids additional panels or decorative chrome.

## Acceptance criteria

### Public read

Given the feature is enabled and one note is visible in Riverside County, when an anonymous client lists Riverside public notes, then the visible note is returned and no pending or removed note is returned.

### Explicit authenticated post

Given an authenticated player has selected a known Riverside place, when they confirm `Post publicly`, then one pending note is persisted and returned to that player with `Pending review` state.

### Private-note isolation

Given a player has existing session notes, when the commons feature is enabled, then those notes remain in `MINE` and none appears in `ALL` unless the player separately creates a public post.

### Cross-user isolation

Given user A has a pending public note, when user B requests `mine` or public notes, then user B cannot observe user A's pending note or identity.

### Moderated publication

Given a pending note, when an authorized operator approves it, then it becomes visible in anonymous `ALL` reads and retains its pseudonymous author handle.

### Idempotent retry

Given an authenticated post succeeded, when the same identity retries the same `clientRequestId`, then the original note is returned and the note count does not increase.

### Link rejection

Given a post body contains an external URL, when the player submits it, then the request is rejected and no row is created.

### Report threshold

Given a visible note reaches the configured unique-report threshold, when the threshold-crossing report is accepted, then the note disappears from anonymous reads and remains available to operator review.

### Disabled compatibility

Given `ATLAS_COMMONS_ENABLED` is false, when the server starts, then the commons tools are absent and the pre-existing Atlas verification suite sees no tool-surface change.

### Mobile map integrity

Given a 390-pixel-wide viewport, when a player switches among `ALL`, `NEARBY`, and `MINE`, then the control remains operable, the map stays the dominant surface, and no horizontal overflow or permanent feed rail appears.

## Error contract

- `COMMONS_DISABLED`: feature is not enabled on this server.
- `COMMONS_UNAVAILABLE`: persistence dependency is unavailable.
- `AUTH_REQUIRED`: identity token is missing or invalid; include OAuth challenge metadata.
- `FORBIDDEN`: valid identity lacks the required action scope.
- `INVALID_NOTE`: body or operation validation failed.
- `LINKS_NOT_ALLOWED`: body contains an external link.
- `UNKNOWN_ANCHOR`: county/place does not exist in the Atlas anchor index.
- `NOTE_NOT_FOUND`: note is absent or not visible to the requester.
- `ALREADY_REPORTED`: duplicate report; safe no-op may return the existing result.
- `RATE_LIMITED`: identity exceeded the configured write rate.

Errors shown to players use concise recovery copy and do not expose database, token, or moderation internals.

## Verification gates

- service unit coverage for validation, idempotency, authorization, cross-user isolation, reactions, reports, moderation, and deterministic ordering;
- migration and Postgres smoke coverage where a local database is configured;
- MCP tool registration and OAuth challenge coverage with the feature both disabled and enabled;
- tool-result shape and public-field allowlist verification;
- map UI tests for all three modes, pending copy, explicit public confirmation, empty/unavailable states, and mobile interaction targets;
- current Atlas typecheck, build, core tests, national-generation verifier, selected-RC split guard, emulator audit, and local ship check;
- no production deploy or live mutation.

## Explicitly deferred

- comments, reply threads, direct messages, following, profiles, hashtags, rich media, external links, and free-form locations;
- personalized or machine-learned ranking;
- monetization, subscriptions, or paid promotion;
- bulk import of private/session notes;
- public editing after publication; a later slice may implement revise-and-remoderate;
- national overview UI for the cross-county feed;
- public launch policy, legal text, and production enablement.

## Source alignment

This slice extends `docs/ATLAS_COMMONS_VISION.md` and `docs/0.80_GRAPHICS_AND_PERSONAL_ATLAS.md`. It intentionally supersedes the older "session-only notes / persistence out of lane" rule only for explicitly created public notes, because the owner has now reopened this scope. It does not alter the frozen release candidate described by the Atlas Release Command Center.
