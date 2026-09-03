# Technical Spec

## Overview

Atlas is a no-login, browser-native U.S. field atlas designed for shared use by a person and ChatGPT. The application already implements the hard product contract: one live map controller, exactly five top-level WebMCP tools, Census-backed place resolution, visible session notes, atomic two-to-five-stop trails, a pure SVG renderer, and normal-browser fallback.

This specification does not authorize a rewrite. It records the existing architecture as the build baseline and narrows the remaining challenge work to one evidence-led field-atlas polish slice, complete deterministic and real-ChatGPT acceptance, synchronized sanitized-release output, and owner-gated publication and submission.

The critical technical invariant is:

> A human control and a ChatGPT tool must mutate the same `AtlasMapController` snapshot, and a write tool must not return success until `AtlasApp` confirms that the matching revision and required trail markers are visible.

Implements: `prd.md > Epic 1` through `Epic 7`.

## Approved Technical Decisions

- Keep the current React, TypeScript, Node.js, pnpm, and pure SVG stack.
- Keep `/` and `/explore` as the only top-level challenge routes.
- Keep exactly five WebMCP tools: `get_map_state`, `search_places`, `open_place`, `add_map_note`, and `create_map_trail`.
- Keep page-native imperative WebMCP registration. Do not add a remote MCP mutation server, iframe registration path, or sixth tool.
- Keep `AtlasMapController` as the only mutable session-state owner for both human and agent actions.
- Keep notes and trails in memory for the page session. Refresh intentionally resets them.
- Keep Atlas geometry and the Census-backed place index server-owned and read-only at runtime.
- Keep the existing isolated Railway challenge service as the deployment target. Any deployment change, public repository visibility change, or Devpost submission remains an explicit owner gate.
- Treat Higgsfield output, if used, as one pre-budgeted static visual study. It cannot become a runtime dependency, geographic source, or substitute for working interaction.
- Do not merge or cherry-pick historical Atlas branches. They contain retired product surfaces and alternate state architectures that violate this cut.

## Stack

| Layer | Choice | Role | Decision |
|---|---|---|---|
| Language | TypeScript 5.9 | Shared contracts, browser runtime, server, tests, and build scripts | Keep |
| UI | React 18.3 + React DOM | Top-level Atlas composition and state subscription | Keep |
| Map renderer | Native SVG, CSS, and DOM events | Crisp county geometry, labels, trail overlays, keyboard targets, pan, and zoom | Keep; no Canvas/WebGL migration |
| State | `AtlasMapController` + `useSyncExternalStore` | One in-memory snapshot and revision stream for human and agent actions | Keep; no Redux, database, or local storage |
| Server | Node.js 22.12+ HTTP server | Serves the app, immutable plates, place search/resolution, and readiness | Keep |
| Package manager | pnpm 11.7 | Frozen installs and workspace/release scripts | Keep |
| WebMCP contract | `webmcp-types@0.1.5` | Browser-native tool types and registration contract | Keep pinned until a deliberate compatibility review |
| Agent evaluation | `webmcp-evals@0.0.4` | Schema-derived probabilistic tool-selection evaluation | Keep pinned; deterministic smoke remains the release floor |
| Deployment | Railway isolated challenge service | Public HTTPS judge route and `/ready` health check | Keep; owner-gated changes only |
| Geographic data | U.S. Census-derived county/place artifacts | Nationwide lookup and map plates | Keep; no third-party runtime geocoder |

No new runtime dependency is required by the remaining plan.

## Architecture

### 1. Challenge Route And Application Shell

`web/src/main.tsx` chooses the product surface from the current pathname. `/` and `/explore` create one `AtlasMapController`, mount top-level WebMCP registration, and render `AtlasApp` with that controller. Other routes retain the legacy preview path without registering challenge tools.

`AtlasApp` subscribes through `useSyncExternalStore`, fetches the plate identified by the current controller snapshot, and composes breadcrumbs, place finder, readiness/activity feedback, the SVG map, notes, and trail editing. It owns no parallel copy of map workspace state; its only local state is plate-loading state and request coordination.

Why: this keeps the map immediately useful, lets React render one authoritative snapshot, and prevents the legacy iframe path from becoming a second challenge architecture.

Implements: `prd.md > Epic 1: Enter A Real Atlas`, `Epic 3: Share Control With ChatGPT`, and `Epic 6: Feel Like A Field Atlas`.

### 2. Shared Session Controller

`web/src/atlas/AtlasMapController.ts` owns:

- the navigation stack and current plate reference;
- the selected place;
- session notes;
- the optional ordered trail and active stop;
- WebMCP availability and last activity;
- monotonically increasing `revision` and `visibleRevision` values;
- pending visibility waiters for writes.

Every mutation creates a complete next snapshot through `commitWorkspace()`. That method rejects an older unresolved visibility waiter before publishing a newer revision, so a stale action cannot later claim success or move the interface backward. Human methods such as `openCandidate`, `openTrailStop`, `updateTrailTitle`, `updateTrailPrompt`, `removeTrailStop`, `updateNote`, and `removeNote` use the same commit path as WebMCP writes.

Why: shared control is a state-ownership problem. A second reducer, remote session, iframe bridge, or agent-only store would break the product promise even if both surfaces looked similar.

Implements: `prd.md > Epic 2`, `Epic 3`, `Epic 4`, and `Epic 5`.

### 3. Top-Level WebMCP Adapter

`web/src/atlas/webmcpRegistry.ts` feature-detects `document.modelContext?.registerTool`, requires `window.top === window`, fences registration to `/` and `/explore`, and registers all five tools with one abort lifecycle. If registration is absent, the controller reports a calm unavailable status and the human interface remains operational. A partial registration failure aborts the set rather than exposing a misleading subset.

`web/src/atlas/webmcpTools.ts` is a thin adapter from narrow schemas to controller methods. It supplies human-readable names and descriptions, side-effect annotations, untrusted-content annotations where session text is returned, abort-signal propagation, activity summaries, compact result shaping, and explicit `visible`, `mapChanged`, or `trailChanged` outcomes.

Tool responsibilities remain non-overlapping:

| Tool | Mutation | Responsibility |
|---|---:|---|
| `get_map_state` | No | Read the currently visible location, selection, recent session notes, and active trail |
| `search_places` | No | Return bounded U.S. candidates without changing the map |
| `open_place` | Yes | Resolve one clear place and visibly open its county |
| `add_map_note` | Yes | Resolve/open one place and add one visible editable session note |
| `create_map_trail` | Yes | Resolve every requested stop, then create one visible ordered national trail atomically |

Why: the smallest credible tool cut maps directly to conversational intents while keeping side effects predictable for ChatGPT and understandable to a judge.

Implements: `prd.md > Epic 2: Open A Place Through Conversation`, `Epic 3: Share Control With ChatGPT`, `Epic 5: Keep A Place-Bound Notebook`, and `Epic 7: Prove The Product Honestly`.

### 4. Geographic Search And Plate API

`server/src/atlasIndex.ts` loads the built Census-derived county/place index. `server/src/atlasPlaceSearch.ts` exposes bounded search and deliberate resolution with three outcomes: `resolved`, `ambiguous`, or `unresolved`. It returns only public candidate fields and caps results at eight.

`server/src/atlasPlates.ts` serves immutable national, state, and county plate JSON. The server keeps large geometry out of WebMCP results; the browser fetches it over HTTP and receives cache headers, an ETag, and cross-origin access suitable for the ChatGPT sandbox.

Why: geographic truth stays in one deterministic read-only source, while tool outputs remain compact enough for an agent conversation.

Implements: `prd.md > Epic 1`, `Epic 2`, and `Epic 4`.

### 5. SVG Map And National Trail Overlay

`web/src/atlas/plateGeometry.ts` decodes and projects immutable plate geometry into a fixed plate coordinate system. For national plates it also calculates an internal county-center lookup keyed by county slug. Coordinates never enter WebMCP results.

`web/src/atlas/AtlasPlate.tsx` renders map paths, state/place labels, scale and attribution, pointer pan, wheel/button/double-click zoom, county selection, and the national trail overlay. A trail contains one always-visible base path, a restrained animated path, numbered markers, a text-independent active ring, SVG titles, accessible stop names, keyboard activation, and stable hit targets. `prefers-reduced-motion` removes decorative motion without removing state or completion cues.

Why: SVG keeps the national map crisp, accessible, and testable. The overlay makes the agent action visible on the same geographic canvas rather than in a detached transcript or panel.

Implements: `prd.md > Epic 1`, `Epic 4: Build An Ordered Journey`, and `Epic 6`.

### 6. Finder, Notebook, And Activity Feedback

`AtlasPlaceFinder` gives a person the same resolver/controller path used by tools, including aborting stale requests, candidate selection, plain-language feedback, and keyboard semantics.

`AtlasApp` renders notes and trails only when they exist. Trail title, stop prompt, stop removal, note body, and note removal commit directly to the controller. The active stop is expressed with number, text, `aria-current`, border treatment, and map ring rather than color alone. On mobile, inactive stops collapse lower-value editing controls before map area or place context is sacrificed.

The activity line shows readiness and the latest meaningful agent effect without exposing a permanent developer dashboard. Structured mutation-safe failures may say the map or trail stayed unchanged. Unexpected post-commit/render failures must say that Atlas could not confirm the visible result; they must not promise no mutation unless the controller can prove it.

Why: the person must be able to inspect and correct agent work immediately, and failures must communicate the actual trust boundary.

Implements: `prd.md > Epic 1`, `Epic 3`, `Epic 5`, and `Epic 6`.

### 7. Verification, Sanitized Release, And Submission Evidence

The source repository contains historical Atlas systems that are intentionally excluded from the challenge. `scripts/assemble-webmcp-release.mjs` projects only the approved challenge runtime, data, tests, documentation, license, and deployment configuration into `release/webmcp/`. Generated release files must not be edited by hand.

Verification has four distinct layers:

1. **Contract tests:** exact-five descriptors, annotations, schemas, shared-controller behavior, ambiguity safety, cancellation, atomic trails, geometry, registry lifecycle, and bounded outputs.
2. **Deterministic browser smoke:** actual Chrome WebMCP discovery and execution, visible completion, mobile measurements, keyboard behavior, reduced motion, refresh, and fallback.
3. **Probabilistic model evaluation:** correct tool and argument trajectories across repeated cases, reported separately from deterministic correctness.
4. **Real ChatGPT acceptance:** a captured built-in-browser transcript and visual evidence. Local Chrome or Codex browser proof cannot be relabeled as ChatGPT acceptance.

Why: this separates code correctness, browser-protocol behavior, model judgment, and host-product acceptance instead of collapsing them into one inflated “pass.”

Implements: `prd.md > Epic 7: Prove The Product Honestly`.

## File Structure

Only challenge-relevant paths are listed. Historical Atlas systems outside this tree are out of scope and should remain untouched.

```text
Atlas-WebMCP/
├── web/
│   ├── src/
│   │   ├── main.tsx                         # Chooses challenge vs legacy route; owns controller creation and registry mount.
│   │   └── atlas/
│   │       ├── AtlasApp.tsx                 # Subscribes to controller, loads plates, composes map/notebook/activity, acknowledges visibility.
│   │       ├── AtlasMapController.ts        # Sole mutable session state, resolution orchestration, atomic commits, visible-revision waiters.
│   │       ├── AtlasPlaceFinder.tsx         # Human search, ambiguity candidates, stale-request cancellation, shared-controller opening.
│   │       ├── AtlasPlate.tsx               # SVG map, zoom/pan, county hit testing, trail route/markers, accessibility, render acknowledgment.
│   │       ├── plateGeometry.ts             # Deterministic projection, paths, labels, scale, and internal county-center lookup.
│   │       ├── webmcpRegistry.ts            # Top-level route fencing, feature detection, exact-five registration lifecycle.
│   │       ├── webmcpTools.ts               # Five schemas/descriptions/annotations, controller adapters, compact results, activity copy.
│   │       ├── webmcpEvalSchema.ts          # Extracts evaluation fixture fields from real descriptors to prevent drift.
│   │       ├── useToolPlate.ts              # Legacy preview plate bridge only; not a challenge state owner.
│   │       └── atlas.css                    # Warm field-atlas tokens, hierarchy, interaction states, responsive layout, motion reductions.
│   └── test/
│       ├── atlas-map-controller.test.ts      # Shared state, visible writes, mutation safety, cancellation, manual edits.
│       ├── plate-geometry.test.ts            # Projection, county centers, scale behavior.
│       ├── webmcp-tools.test.ts              # Exact descriptors, tool behavior, copy, output bounds.
│       ├── webmcp-registry.test.ts           # Route/top-level fencing, all-or-none lifecycle, cleanup/remount.
│       └── webmcp-eval-schema.test.ts        # Fixture generation stays coupled to real descriptors.
├── server/
│   ├── src/
│   │   ├── index.ts                         # HTTP routes, challenge headers, readiness, plates, search, and resolution.
│   │   ├── atlasIndex.ts                    # Loads the packaged Census-derived place/county index.
│   │   ├── atlasPlaceSearch.ts              # Bounded search and resolved/ambiguous/unresolved contract.
│   │   ├── atlasPlates.ts                   # Reads and serves immutable plate artifacts with cache metadata.
│   │   └── countySlug.ts                    # Normalizes/validates public county identifiers.
│   └── test/
│       └── atlas-place-search.test.ts        # Resolution, ambiguity, unknown-query, and result-bound coverage.
├── data/census/                              # Packaged public county/place lookup and town-anchor artifact.
├── artifacts/atlas-plates/                   # Build-generated national/state plate JSON consumed by the source server.
├── scripts/
│   ├── assemble-webmcp-release.mjs           # Creates the sanitized challenge projection; source of truth for release mirroring.
│   ├── audit-webmcp-release.mjs              # Audits tracked paths, secrets, scope, generated output, and candidate consistency.
│   ├── verify-webmcp.mjs                     # Static runtime and exact-five product invariants.
│   ├── verify-webmcp-docs.mjs                # Judge-copy, attribution, command, and anti-scope guards.
│   ├── verify-webmcp-browser-smoke.mjs       # Chrome protocol journey, visible completion, mobile, keyboard, motion, fallback.
│   ├── write-webmcp-eval-tools.ts            # Generates evaluator schemas from live descriptors.
│   ├── run-webmcp-evals.mjs                  # Static/browser/smoke evaluation runner.
│   ├── run-grok-webmcp-evals.mjs             # Optional exact Grok 4.6 adversarial evaluation lane.
│   ├── prepare-chatgpt-session.mjs            # Creates an ignored, no-overwrite acceptance runbook and evidence directory.
│   ├── verify-chatgpt-live.mjs               # Public HTTPS, headers, exact-five metadata, and resolver preflight.
│   ├── verify-chatgpt-transcript.mjs         # Rejects placeholder or incomplete real-ChatGPT evidence.
│   └── run-chatgpt-e2e.mjs                   # Consolidates automated proof while reporting external gates separately.
├── docs/webmcp/                              # Compatibility, HCI, evaluation, acceptance, release, submission, and video evidence.
├── docs/hackathon-build/
│   ├── learner-profile.md                    # Confirmed participant, audience, pace, and visual preferences.
│   ├── scope.md                              # Fixed three-day product boundary.
│   ├── prd.md                                # User-facing epics and observable acceptance criteria.
│   ├── spec.md                               # This repository-grounded implementation contract.
│   ├── checklist.md                          # Next-stage executable work order.
│   └── build-notes.md                        # Durable guided-build decisions and shaping history.
├── release/webmcp/                           # Generated sanitized candidate; never the manual editing source.
├── package.json                              # Source build, verification, evaluation, ChatGPT E2E, and release audit commands.
└── WEBMCP_STATE.md                           # Challenge ledger, evidence, blockers, last green SHA, and exact next action.
```

## Data Model And State Ownership

### Controller Snapshot

The browser owns one immutable-style `AtlasMapViewSnapshot` at a time:

- `revision`: newest committed controller transition;
- `visibleRevision`: newest revision confirmed by the rendered interface;
- `navigationStack` and `current`: nation/state/county navigation;
- `selectedPlace`: normalized public candidate, when one is selected;
- `notes`: ordered in-memory `MapNote[]`;
- `trail`: optional title, ordered stops, and active index;
- `toolStatus`: registration/fallback state;
- `lastActivity`: one concise running/completed/failed tool event.

There is no server session row, cookie-owned workspace, browser persistence, or agent-only state. Plate-loading state inside React is derived transient state and cannot supersede the controller snapshot.

## Data Flow

### Important Data Lifecycle: ChatGPT Creates A Trail

1. ChatGPT selects `create_map_trail` from the five descriptors and supplies a title plus two to five `{ place, prompt }` items.
2. `webmcpTools.ts` validates the narrow schema, marks a running activity, and forwards the browser execution `AbortSignal`.
3. `AtlasMapController.createMapTrail()` trims and bounds all inputs.
4. The controller calls `GET /api/atlas/resolve?query=...` for every stop and waits for all results.
5. If any result is ambiguous, unknown, invalid, or aborted, the method returns/rejects before `commitWorkspace()`. The previous navigation, selection, notes, and trail remain intact.
6. If every stop resolves, the controller creates one complete `MapTrail` and calls `commitWorkspace()` once with national navigation and the new trail.
7. `commitWorkspace()` increments `revision`, rejects any older pending visible transition, publishes the snapshot, and returns a visibility promise.
8. `AtlasApp` observes the revision, fetches `/api/atlas/nation`, and gives the ready plate plus trail to `AtlasPlate`.
9. `plateGeometry.ts` projects the plate and county centers. `AtlasPlate` places every stop, renders the base route, animated route, numbered markers, and matching accessible names.
10. `AtlasPlate.onRendered()` reports the marker count after the DOM commit. `AtlasApp` compares it with the expected trail length and calls `controller.acknowledgeVisible(revision)` only when the plate revision and all markers agree.
11. The controller resolves the tool promise. `webmcpTools.ts` marks the activity complete and returns a compact success result with `visible: true`, the revision, national view, and bounded stop summary.
12. A person can select a marker or rail entry. Both call `openTrailStop()` on the same controller, so the next `get_map_state` returns the human-selected county and active index.

### Place And Note Lifecycles

- `search_places` performs `GET /api/atlas/search` and never commits.
- `open_place` resolves first, commits county navigation once, and waits for the matching plate acknowledgment.
- `add_map_note` validates the note, resolves the place, then commits the place navigation and appended note in one revision; success waits until both are rendered.
- Finder candidate selection calls `openCandidate()` and therefore enters the same visible-revision pipeline.
- Manual note/trail edits commit a new snapshot and are immediately observable through `get_map_state`.
- Refresh reconstructs the controller with `{ level: "nation" }`; session notes and trails intentionally disappear.

## HTTP API Contracts

All challenge endpoints are public read-only HTTP operations. Browser session mutations never leave the controller.

### `GET /api/atlas/search?query=<1..120 chars>`

- Success: `{ ok: true, query: string, candidates: AtlasPlaceCandidate[] }`.
- Candidate limit: eight.
- Invalid query: HTTP 400 with a plain error.
- Side effect: none.

### `GET /api/atlas/resolve?query=<1..120 chars>`

- Resolved: `{ ok: true, status: "resolved", place: AtlasPlaceCandidate }`.
- Ambiguous: `{ ok: true, status: "ambiguous", query, candidates }`.
- Unresolved: `{ ok: true, status: "unresolved", query, candidates }`.
- Side effect: none. The controller decides whether a resolved result becomes a visible mutation.

### Plate endpoints

- `GET /api/atlas/nation`
- `GET /api/atlas/state/:stateCode`
- `GET /api/atlas/county/:countySlug`

Successful plate responses contain immutable build-time geometry, source attribution, and the fields needed by the renderer. Responses include ETag/cache headers and public cross-origin access. Invalid or missing identifiers return an honest 4xx response. Geometry is never copied into tool output.

### `GET /ready`

Railway health check and release preflight. It must remain fast, unauthenticated, and independent of user session state.

## Components And Responsibilities

### `ChallengeAtlas`

Creates exactly one controller per mounted challenge page, mounts WebMCP registration, and passes the same instance to the UI.

Implements: `prd.md > Epic 1`, `Epic 3`, `Epic 7`.

### `AtlasMapController`

Defines all human/agent transitions, enforces atomicity, owns session state, forwards cancellation, resolves places, and gates write completion on visible revisions.

Implements: `prd.md > Epic 2`, `Epic 3`, `Epic 4`, `Epic 5`.

### `AtlasApp`

Turns the controller snapshot into the complete visible workbench, coordinates plate loading, protects against stale fetches, and accepts/rejects render completion.

Implements: `prd.md > Epic 1`, `Epic 3`, `Epic 5`, `Epic 6`.

### `AtlasPlaceFinder`

Provides human lookup and ambiguity recovery without bypassing the shared state path.

Implements: `prd.md > Epic 1`, `Epic 2`, `Epic 3`.

### `AtlasPlate` And `plateGeometry`

Produce the responsive geographic canvas, interaction model, and national trail centerpiece without exposing geometry to ChatGPT.

Implements: `prd.md > Epic 1`, `Epic 4`, `Epic 6`.

### WebMCP Registry And Tool Descriptors

Expose the exact five conversational capabilities on supported top-level pages and preserve the normal interface elsewhere.

Implements: `prd.md > Epic 2`, `Epic 3`, `Epic 7`.

### Atlas HTTP Services

Serve deterministic geography, resolution, and readiness without storing session text or agent inputs.

Implements: `prd.md > Epic 1`, `Epic 2`, `Epic 4`, `Epic 7`.

### Proof And Release Tooling

Reproduce the candidate, prevent source/release drift, exercise the real browser protocol, and keep external acceptance claims honest.

Implements: `prd.md > Epic 7`.

## External APIs And Dependencies

- [React 18 documentation](https://react.dev/) — component runtime and `useSyncExternalStore` subscription.
- [TypeScript documentation](https://www.typescriptlang.org/docs/) — compile-time contracts across browser, server, scripts, and tests.
- [Node.js documentation](https://nodejs.org/docs/latest/api/) — production HTTP runtime and test/build scripts.
- [pnpm documentation](https://pnpm.io/) — locked dependency installation and project commands.
- [WebMCP proposal repository](https://github.com/webmachinelearning/webmcp) — imperative page-tool contract; Atlas pins the reviewed upstream commit in `docs/webmcp/OFFICIAL_COMPATIBILITY.md`.
- [OpenAI Site Tools documentation](https://learn.chatgpt.com/docs/webmcp) — ChatGPT host behavior and top-level discovery boundary recorded in the compatibility audit.
- [Chrome WebMCP evaluation guidance](https://developer.chrome.com/docs/ai/webmcp/evals) and [webmcp-evals](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/webmcp-evals) — deterministic/probabilistic evaluation split.
- [Railway configuration reference](https://docs.railway.com/reference/config-as-code) — isolated service build, start, health check, and rollback configuration.
- U.S. Census-derived public geography packaged in the repository — deterministic county/place coverage and attribution; no live Census request occurs during a map session.

Version-specific WebMCP behavior must be updated only through a deliberate compatibility review, lockfile update, focused tests, browser smoke, and documentation change. The current spec does not require new external research or dependency upgrades.

## AI Usage

### Runtime

Atlas does not call an inference API from its server or browser. ChatGPT is the host that chooses and invokes the five page-native tools. Atlas receives only the bounded arguments required for the selected action and returns bounded structured results.

### Development And Evaluation

- Codex is used to inspect the repository, implement bounded changes, run tests, review diffs, and prepare release/submission artifacts.
- `webmcp-evals` may use a configured model provider to evaluate tool selection and arguments. Credentials stay in environment variables and results must distinguish deterministic correctness from probabilistic performance.
- The optional adversarial lane targets exact `xai:grok-4.6` only when the owner supplies `XAI_API_KEY`. Missing credentials are a blocked optional lane, not a reason to weaken or fabricate the threshold.
- Higgsfield may produce one visual study only after documenting the intended artifact, source/reference input, exact model, expected credit cost, destination, and pass/fail bar. Generated output is reference/decoration only and must never alter county geometry or attribution.

## Accessibility, Privacy, And Safety

- Trail markers remain keyboard reachable and expose useful accessible names and current-state semantics.
- Visible focus, 44px mobile controls, non-color active cues, and reduced-motion fallbacks are release requirements.
- Session note and trail text is untrusted user-authored content. Render it as text through React; never inject it as HTML, code, instructions, or map geometry.
- Tool schemas request only place names, note text, trail title, and stop prompts. Do not request conversation summaries, personal details, credentials, or unrelated context.
- No note or trail is sent to the server or persisted. Refresh intentionally clears it.
- Tool results exclude secrets, raw geometry, third-party payloads, and oversized state.
- Mutating tools remain accurately annotated as writes. Do not relabel them read-only to avoid host confirmations.
- Public release audits must continue to scan tracked paths, generated artifacts, file size, challenge scope, and full history of the sanitized repository.

## Error Strategy

### Recoverable Structured Outcomes

- Ambiguous place: return candidates; do not commit; say the map stayed unchanged.
- Unknown place: return recovery guidance; do not commit.
- Invalid note/trail input: return a bounded validation error; do not commit.
- Any unresolved trail stop: report the one-based failing stop; do not create any part of the attempted trail.

### Operational Failures

- Search/resolve network or response-shape failure: reject honestly and preserve the last confirmed interface where possible.
- Plate load/render failure after a controller revision: reject the visibility waiter and say Atlas could not confirm the visible result. Do not claim “unchanged” unless no commit occurred.
- Abort: stop pending fetch/resolution/visibility work and prevent a stale completion message.
- Superseded action: reject the older visibility waiter when a newer revision commits; the newest completed action wins.
- WebMCP unavailable: show a quiet status and retain all human controls.
- Registration failure: abort the entire five-tool lifecycle and show tools offline; never advertise a partial set.

The last confirmed map must remain useful during recoverable failures. No retry loop may delay the demo or duplicate a write.

## Remaining Implementation Boundary

The baseline already satisfies the primary product architecture. The build checklist should authorize only the following bounded work:

1. **Current-state design audit:** inspect the exact live/local entry, ambiguity, county, trail, note, dark-theme, keyboard, reduced-motion, and 390x844 states. Select at most one high-value field-atlas polish slice only if it solves an observable issue. Do not add permanent coaching, cards, or decoration to manufacture work.
2. **One coherent visual/interaction slice:** change only the smallest relevant `AtlasApp`, `AtlasPlate`, `AtlasPlaceFinder`, or `atlas.css` surface; add focused regression coverage; retain immediate completion and map area. If no P1/P2 product issue exists, skip product mutation and spend the block on evidence/video composition.
3. **Optional one-shot asset study:** run only after a written budget and direct live/submission use are approved. An unused or inferior result is discarded rather than forced into the product.
4. **Deterministic proof:** run focused tests, `pnpm verify:webmcp`, `pnpm typecheck`, `pnpm build`, and `pnpm eval:webmcp:smoke`; capture desktop, 390x844, keyboard, reduced-motion, normal-browser, and WebMCP states.
5. **Real ChatGPT proof:** use the existing generated runbook and transcript validator in an authenticated user-controlled ChatGPT session. Capture exact-five discovery, all five calls, ambiguity safety, failed-trail atomicity, visible note/trail completion, and one human-edit/read-back handoff.
6. **Release projection:** regenerate `release/webmcp`, audit it, prove a frozen clean clone, and identify one immutable candidate SHA. Source, private/public challenge repository, Railway deployment, screenshots, video, and Devpost copy must identify the same candidate.
7. **Owner gates:** request separate approval before making the repository public, changing the live deployment, publishing the video, or submitting Devpost. Each request includes SHA, evidence, risk, rollback, and one narrow decision.

## Risks And Verification

| Risk | Failure signal | Mitigation and proof |
|---|---|---|
| Source and sanitized release drift | Release diff or clean-clone mismatch | Regenerate through assembler; never hand-edit mirror; run release audit and clean clone |
| False WebMCP success | Tool returns before correct plate/markers exist | Visible revision + expected marker count; controller/tool/browser tests |
| Partial trail mutation | Some markers/rows appear after one stop fails | Resolve every stop before one commit; negative snapshot equality test |
| Human/agent state divergence | Human edit absent from next state read | Route every edit through controller; live handoff E2E |
| Stale transition wins | Older request replaces newer map/status | Reject prior visibility waiter on new commit; cancellation/supersession tests |
| Mobile map squeezed by UI | Small map, overflow, or hidden controls at 390x844 | Measured viewport/map area and 44px targets in browser smoke |
| Decorative motion hides completion | Success depends on animation or reduced-motion loses state | Always-visible base route/markers; computed reduced-motion assertions |
| Ambiguity feels like failure | Springfield changes map or offers no recovery | Candidate UI + explicit unchanged feedback + state-revision test |
| ChatGPT proof overstated | Automated Chrome pass presented as real ChatGPT | Separate transcript validator and `releaseReady` field |
| Model eval credential missing | No three-run 90% trajectory evidence | Report blocked lane honestly; deterministic release stays independent |
| Generated asset weakens map truth | Texture obscures boundaries or resembles geographic data | One bounded study, before/after review, easy removal, no geometry changes |
| Deadline dilution | Work spreads into routing, persistence, iframe, or old branches | Checklist enforces one slice and named anti-scope |

### Required Verification Commands

From the source worktree after any product/runtime change:

```powershell
pnpm verify:webmcp
pnpm typecheck
pnpm build
pnpm eval:webmcp:smoke
git diff --check
```

Before release, additionally regenerate/audit the sanitized projection and repeat its documented clean-clone commands:

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm verify:webmcp
pnpm eval:webmcp:smoke
pnpm audit:release
```

For public-host acceptance:

```powershell
$env:ATLAS_CHATGPT_URL = "https://atlas-webmcp-production.up.railway.app/explore"
pnpm e2e:chatgpt
```

An `ok: true` automated report is not sufficient by itself. Final ChatGPT acceptance requires a validated observed transcript and evidence files; probabilistic threshold evidence remains a separate field.

## Demo And Submission Flow

The product and the video should follow one uninterrupted state story:

1. Start on the national map, not a landing page or setup screen.
2. Ask ChatGPT to build a three-place U.S. investigation trail. Show the national route and numbered markers before the tool success is narrated.
3. Select stop two manually on the map or rail; ask ChatGPT what is currently visible; show that it reads the human-selected county.
4. Ask for Springfield without a state; show candidates and prove the map/trail revision did not change.
5. Resolve one candidate deliberately.
6. Ask ChatGPT to add a place-bound note; show it in the notebook, edit it manually, and read the updated state back.
7. Show one invalid trail request preserving the previous completed trail.
8. Briefly show the exact-five surface and normal-browser fallback.
9. Close with audience, session-only boundary, public source, live URL, and challenge-period delta. Do not claim turn-by-turn routing, persistence, global geography, or generated city detail.

The national trail overview is the opening frame and thumbnail because it simultaneously proves map quality, agent action, ordered geography, and the shared editable object.

## Build Checklist Handoff

`build-checklist` should turn this spec into a dependency-ordered checklist with these gates:

1. Reconfirm branch, dirty-tree ownership, authority docs, live candidate, and current evidence.
2. Run a fresh product-design/browser audit and select zero or one implementation slice.
3. If selected, implement and review that slice with focused tests before broad gates.
4. Run the full deterministic source sequence and capture current desktop/mobile/fallback/WebMCP proof.
5. Complete the real ChatGPT acceptance transcript; run the optional Grok lane only if its credential exists.
6. Regenerate, audit, and clean-clone the sanitized candidate; record the immutable SHA.
7. Capture and edit the under-three-minute narrated video from that candidate.
8. Reconcile README, challenge delta, submission copy, URLs, screenshots, license, AI usage, limitations, and evidence.
9. Present separate owner approval packets for public repository visibility, any final deployment, video publication, and Devpost submission.

Each checklist item must name exact files, commands, visible acceptance, and blocker handling. A recap is not a stop condition; only a real owner gate, credential gate, or verified completion should pause execution.
