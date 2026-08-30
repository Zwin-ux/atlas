# Atlas WebMCP Challenge — Codex Master Implementation Prompt

Use this prompt from the root of `Zwin-ux/atlas-alpha-engine-beta-checkpoint`.

---

You are the principal engineer and submission owner for the Atlas WebMCP Challenge extension.

## Mission

Transform the existing Atlas county-map codebase into a focused, public, no-login WebMCP website in which a human and an agent share the same visible map state.

The challenge deadline is September 3, 2026 at 1:00 PM Pacific. Existing Atlas work predates the challenge, so all new work must be cleanly isolated, dated, tested, and documented as a meaningful WebMCP extension added after August 25, 2026.

Do not rebuild the map renderer. Reuse the strongest current `main` implementation.

## Product thesis

Atlas is a shared geographic canvas. A person explores U.S. counties visually while an agent uses browser-native WebMCP tools to read the current map, search/open places, add session-only research notes, and create an editable multi-place research trail on the same page.

## Scope to keep

- Nationwide state/county/Census-place opening and ambiguity handling.
- Existing Census-grounded geography and map renderer.
- Existing React state for selected county/place, camera focus, notes, and markers.
- Human navigation and note controls.
- Session-only data.
- A small visible site-tool activity record.
- A normal-browser fallback when WebMCP is unavailable.

## Scope to remove or hide from the challenge path

- Scout Drop.
- Campaign planning.
- Hosted Clawd.
- Checkout, subscriptions, billing, pricing, or waitlists.
- Auth0/login requirements.
- Atlas Commons/public-note posting and moderation.
- Staging-only functionality.
- Old Apps SDK submission language.
- Claims that generated streets/buildings are verified geography.

Do not delete reusable old systems unless necessary. Keep them feature-gated and out of the public challenge route, README, demo, and Devpost story.

## Repository safety rules

1. Start from current `main`, not the stale default branch.
2. Create/use a branch named `webmcp-challenge`.
3. Do not make the repository public, change repository visibility, delete branches, rotate credentials, or deploy to production without explicit owner approval.
4. Before recommending public release, inventory secrets, private artifacts, generated binaries, licenses, and large files.
5. Do not claim that pre-existing Atlas work was created during the challenge.
6. Add `CHALLENGE_DELTA.md` that distinguishes the pre-August-25 baseline from challenge-period work.
7. Keep commits small, descriptive, and demonstrably after August 25, 2026.

## Required WebMCP tools

Implement exactly these five core tools first:

1. `get_map_state`
   - Read-only.
   - Returns current map level, state/county, selected place, a concise visible-place list, notes, and active trail.
   - No geometry arrays or internal scene payloads.

2. `search_places`
   - Read-only.
   - Accepts raw place query text.
   - Reuses Atlas’s existing bundled place/county resolver.
   - Returns exact or ambiguous candidates; never guesses.

3. `open_place`
   - Writes client UI state.
   - Accepts `place` and optional `level` (`auto`, `nation`, `state`, `county`, `place`).
   - Opens/focuses the result on the visible map.
   - Resolves the UI transition before returning.

4. `add_map_note`
   - Writes session-only page state.
   - Accepts a mapped place and note body up to 240 characters.
   - Rejects missing/ambiguous places and invalid body.
   - Displays the note before returning.
   - Set `untrustedContentHint: true` because output includes user/agent-authored text.

5. `create_map_trail`
   - Writes session-only page state.
   - Accepts a title and 2–5 `{ place, prompt }` stops.
   - Resolves all stops first; mutation must be atomic.
   - Displays an editable trail rail and numbered county route on the national map.
   - Set `untrustedContentHint: true`.

Do not add more tools until all five pass automated and manual evals. Do not expose a deletion tool in the first release; the human can edit/remove notes and trail items through the UI.

## API requirements

Use the WebMCP Imperative API directly:

```ts
await document.modelContext.registerTool(tool, { signal });
```

- Add `webmcp-types` or an accurate local declaration for TypeScript.
- Feature-detect `document.modelContext?.registerTool`.
- Use an `AbortController` for registration lifecycle.
- Pass execution cancellation signals into fetch/long work.
- Register as a top-level same-origin page.
- Do not use `document.domain` or `Origin-Agent-Cluster: ?0`.
- Do not return raw third-party/provider content.
- Keep tool names under 30 characters, parameter descriptions concise, tool descriptions under 500 characters, and outputs under about 1,500 characters.
- Annotations supported by current WebMCP are `readOnlyHint` and `untrustedContentHint`. Do not invent unsupported annotations in the browser tool definitions.

## Architecture requirement

Extract a shared controller used by both manual UI actions and WebMCP callbacks.

Target interface:

```ts
export interface AtlasMapController {
  getSnapshot(): AtlasMapSnapshot;
  searchPlaces(query: string): Promise<PlaceSearchResult>;
  openPlace(input: OpenPlaceInput): Promise<OpenPlaceResult>;
  addMapNote(input: AddMapNoteInput): Promise<MapNote>;
  createMapTrail(input: CreateMapTrailInput): Promise<MapTrail>;
}
```

The controller must be the single source of truth for state transitions. Do not duplicate React state mutation logic inside tool callbacks.

Avoid stale closures. Register tools once and read live state through refs/controller snapshots at execution time.

## UI requirement

Create a public top-level challenge route, preferably `/explore`, that immediately renders Atlas without authentication.

Add a restrained `AgentActivityRail` showing:

- Site tools available/unavailable.
- Last tool executed.
- Concise effect summary.
- Sequence/timestamp.
- Current agent-highlighted place.

Add an editable `MapTrailRail` for the ordered research trail.

Tool calls must create obvious but tasteful visual changes: map transition, selected-place pulse, added note, or trail update. Do not add a large debug dashboard.

## Test and verification requirement

Add `scripts/verify-webmcp.mjs` and a `pnpm verify:webmcp` command.

Mock `document.modelContext` and verify:

- Exact expected tool list.
- Valid JSON schemas.
- Correct `readOnlyHint` and `untrustedContentHint` values.
- Lifecycle abort unregisters tools.
- No stale React state in callbacks.
- `open_place` changes visible state.
- `add_map_note` enforces 240 characters and displays the note.
- `create_map_trail` validates all stops before mutation.
- Ambiguous names return candidates.
- Unknown names fail with actionable errors.
- Outputs remain concise.
- Browser fallback works without WebMCP.
- Existing build, typecheck, and tests continue to pass.

Add browser/manual eval documentation for ChatGPT desktop and Chrome 149+ with WebMCP testing enabled.

## Required documentation

Create or rewrite:

- `README.md` — challenge-first, no historical product confusion.
- `CHALLENGE_DELTA.md` — prior work vs challenge-period work.
- `docs/WEBMCP_CHALLENGE.md` — architecture and user flow.
- `docs/WEBMCP_TOOL_CONTRACTS.md` — exact schemas and annotations.
- `docs/WEBMCP_EVALS.md` — prompts, expected tools, pass/fail evidence.
- `SUBMISSION.md` — accurate Devpost copy and testing instructions.
- `VIDEO_SCRIPT.md` — sub-three-minute demo.
- `LICENSE` — only after owner confirms the license choice and asset rights.

README must lead with:

- One sentence explaining the shared geographic workspace.
- Live URL placeholder.
- A visual.
- Three tested prompts.
- Tool table.
- Challenge work statement.
- Build/test commands.
- Data and safety boundaries.

## Flagship acceptance flow

The following must work without a login:

1. Human opens Atlas and manually selects Riverside County and Eastvale.
2. Human adds a short note.
3. Agent calls `get_map_state` and sees that exact selection/note.
4. Agent calls `open_place` for Miami-Dade County / Miami Beach.
5. Agent calls `add_map_note` with “Verify coastal flooding sources.”
6. The visible map and note update before each tool returns.
7. Human manually changes the selected place or note.
8. Agent reads the updated state and continues correctly.
9. Agent calls `create_map_trail` for Eastvale, Norco, and Corona.
10. The trail appears and remains editable by the human.

## Delivery order

Work in these slices and run relevant checks after each:

1. Audit current `main`, document baseline, and create challenge route.
2. Extract shared map controller without changing behavior.
3. Register `get_map_state`, `search_places`, and `open_place`.
4. Add visible activity rail.
5. Add `add_map_note` with strict validation and UGC annotation.
6. Add atomic `create_map_trail` and editable trail UI.
7. Add automated WebMCP verifier and manual eval fixtures.
8. Clean challenge README/docs and remove stale surface from judge path.
9. Run clean-clone build, typecheck, tests, and browser smoke tests.
10. Produce a release-readiness report listing blockers, exact commands run, results, changed files, and final commit SHA.

## Non-negotiable quality bar

- No fake success states.
- No hidden partial mutation.
- No login in the judge path.
- No stale default branch in public release.
- No private repository at submission time.
- No missing license at submission time.
- No claim that MCP/Apps SDK alone is WebMCP.
- No giant tool payloads.
- No ambiguous place guessing.
- No unrelated feature tour.
- No deployment claim until the URL is tested in ChatGPT desktop and Chrome.

Begin by reading the repository’s `main` branch, identifying the current route/render/state boundaries, and producing a short implementation map. Then implement the slices without asking for confirmation unless an action would change repository visibility, public deployment, licensing, secrets, billing, or destructive Git history.
