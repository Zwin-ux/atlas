# Atlas playable maproom design specification

**Status:** Proposed for user review  
**Date:** 2026-08-26  
**Planning authority:** `docs/brain/PROJECT_PLAN.md`  
**Visual authority:** `DESIGN.md`

This specification defines the WebMCP challenge slice before implementation.
Its proposed page-tool names and schemas are temporary design inputs. Once
approved and implemented, the executable page-tool surface and its verifier
become canonical; this document will link to them rather than duplicate them.

## Problem

Atlas already draws truthful Census-backed geography, but the page behaves as
a private React view: a person can operate it, while an agent cannot reliably
observe or change the same state. A challenge-only text action would prove a
protocol and weaken the product. The useful version makes the live map a shared
object that both participants can understand and continue manipulating.

## Audience and job

The first audience is a curious ChatGPT user, not a school-specific or
professional niche. Their job is simple: orient me somewhere in the United
States, show me what is there, and let me keep exploring without pretending an
ambiguous name is certain.

## Product thesis

**The Playable Maproom:** ask for a place, watch Atlas open it, touch a real
feature, let the agent focus it, then move the map yourself. Fun comes from a
responsive shared object—not points, badges, or a quiz wrapper.

```text
ASK FOR A PLACE
       |
       v
RESOLVE TRUTHFULLY ---- ambiguous/refused ---> KEEP MAP + EXPLAIN
       |
       v
OPEN THE LIVE PLATE
       |
       v
HUMAN OR AGENT FOCUSES A REAL FEATURE
       |
       v
HUMAN CONTINUES EXPLORING THE SAME STATE
```

## Approaches considered

### Utility atlas

Expose a search action and return a location. This is easy to ship but feels
like a form submission with a map attached. It does not demonstrate meaningful
human-agent continuity.

### Geography game

Add trivia, points, or a scavenger hunt. It supplies a ready-made loop but
narrows the audience, expands scope, and risks turning trustworthy geography
into a gimmick.

### Playable maproom — selected

Use visible map actions and an observable shared state. This makes WebMCP
material to the consumer experience while remaining inside Atlas's read-only,
Census-owned boundaries.

## Scope

### In scope

- A full-screen shared map on desktop and phone.
- Three narrow, read-only page tools: open a place, focus a current visible
  feature, and read the bounded current view.
- A shared controller used by human input, page tools, and rendering.
- Server-backed place resolution with existing structured ambiguity and
  refusal behavior.
- Stable identifiers for focusable Census-backed features.
- Designed ready, loading, focus, ambiguity, refusal, error, and unsupported-
  host states.
- Keyboard and screen-reader access to agent-focusable features.
- Local emulator proof and proof in a real WebMCP-capable host.
- Reuse of a small maintained registration hook, plus a narrow upstream bug
  fix rather than a home-grown React integration layer.

### Out of scope

- Directions, route traces, businesses, weather, live third-party data, or
  Google lookup.
- Accounts, writes, saved state, analytics, payment, or social features.
- Voxel or city-world restoration.
- Place comparison in v1.
- Points, badges, streaks, trivia, or a generic game framework.
- A second client-side gazetteer.
- A broad page-tool framework or production WebMCP polyfill.

## Surface boundary

The existing server MCP surface does not change in this slice. Its executable
contract remains `scripts/lib/atlas-tool-surface.mjs`, and its two registered
tools continue to be verified by the existing MCP drift gate.

The three capabilities below are **browser-local WebMCP page tools** registered
on `document.modelContext` inside the Atlas widget. They are not
`registerAppTool` server tools and must never be added to the server MCP surface
module. After approval, create a separate executable contract at
`web/src/atlas/pageToolSurface.ts` and a separate
`scripts/verify-webmcp-page-surface.mjs` gate. The executable module will own
names, schemas, caps, and annotations; this spec will then link to it.

All page-tool outputs are small structured objects. Geometry stays in the
existing Atlas data path and never enters the model transcript.

## Proposed page-tool contracts

Until the executable page surface exists, the proposed names are
`atlas_open_place`, `atlas_focus_feature`, and `atlas_read_view`.

### Open a place

Input contains exactly one of `place` or `candidateId`. Trim a place string,
require 1–120 Unicode code points, and resolve it through the shared server
service described below. A candidate ID is valid only in the controller's
current ambiguity set and revision; stale or invented IDs are rejected. A
successful result loads the plate into the shared controller. Ambiguous,
unresolved, and retryable failures preserve the current plate. A later agent
request supersedes an earlier one, and repeating a successful request is
idempotent.

The page-tool result is:

```ts
type AtlasCandidateV1 = {
  candidateId: string;
  label: string;
  kind: "county" | "place";
  state: string;
  countySlug: string;
};

type AtlasOpenPlaceResultV1 =
  | { status: "opened"; view: AtlasViewSnapshotV1 }
  | { status: "ambiguous"; candidates: AtlasCandidateV1[]; view: AtlasViewSnapshotV1 }
  | { status: "unresolved"; reason: "not_in_atlas" | "invalid_input"; view: AtlasViewSnapshotV1 }
  | { status: "error"; code: "resolver_unavailable" | "plate_unavailable"; retryable: boolean; view: AtlasViewSnapshotV1 };
```

Candidates are deterministically ordered by the existing resolver and capped
at eight. Candidate IDs reuse the stable `county:<census-geoid>` or
`place:<census-place-geoid>` namespace and are accepted only from the current
candidate set. Human candidate buttons and the page tool issue the same
`chooseCandidate(candidateId)` controller command, which commits the candidate's
stored internal target without re-resolving display text.

This vocabulary maps the existing resolver's `resolved | ambiguous |
unresolved` result once at the service boundary. Visible copy may say that
Atlas refused to guess, but `refused` and `unsupported` are not additional
machine outcomes. `not_in_atlas` deliberately does not guess whether an unknown
string is a misspelled US place or a real place outside US coverage.

### Focus a visible feature

Input is one opaque `featureId` of 1–80 Unicode code points from the current
visible-feature registry. The tool rejects stale or invented identifiers and
never accepts raw coordinates, selectors, URLs, or host metadata as a fallback.

The ID namespace is:

- `county:<census-geoid>` for a county with its Census GEOID;
- `place:<census-place-geoid>` for an incorporated place or Census-designated
  place with its Census place GEOID.

There is no slug fallback in v1. A feature without a source GEOID can remain
visible to a person but is excluded from the page-tool registry and release
coverage report. Preserve source IDs through anchor data, server plate JSON,
client types, rendered elements, the registry, and tool output; one shared
helper owns formatting and validation.

Only features represented by a current rendered target are focusable. County
geometry must intersect the viewport; a town must have survived label
collision and have a rendered hit target. Success selects the feature, moves it
inside the safe map center only when necessary, and resolves after the camera
settles—or immediately under reduced motion. It produces one semantic revision.
Repeating the current focus without a viewport change is idempotent.

The page-tool result is:

```ts
type AtlasFocusFeatureResultV1 =
  | { status: "focused"; feature: AtlasVisibleFeatureV1; view: AtlasViewSnapshotV1 }
  | { status: "invalid_feature"; reason: "stale_or_unknown"; view: AtlasViewSnapshotV1 }
  | { status: "error"; code: "focus_failed"; retryable: boolean; view: AtlasViewSnapshotV1 };
```

### Read the current view

Input is empty. The version-1 output shape is:

```ts
type AtlasVisibleFeatureV1 = {
  id: string;
  kind: "county" | "place";
  label: string;
  state: string;
  countySlug: string;
};

type AtlasViewSnapshotV1 = {
  schemaVersion: 1;
  phase: "ready" | "resolving" | "loading" | "ambiguous" | "error";
  level: "nation" | "state" | "county";
  label: string;
  state?: string;
  countySlug?: string;
  selectedFeature: AtlasVisibleFeatureV1 | null;
  visibleFeatures: AtlasVisibleFeatureV1[];
  interactionRevision: number;
};
```

The list contains up to 40 current rendered targets, sorted selected first,
then by renderer priority, then stable ID. Strings are capped at 120 Unicode
code points and the serialized result must remain at or below 16 KiB.

It does not include geometry, raw coordinates, DOM text, debug values, URLs,
or host metadata. The interaction revision lets an agent recognize a human
pan, drill, or selection without scraping the DOM.

Unbounded candidates, visible features, strings, or serialized output are a
release failure. These limits move into the executable page surface after
approval.

## Server resolution boundary

Extract the current gazetteer call from the server MCP callback into a typed
`atlasPlaceService`. Both the existing MCP handler and a cross-origin
`POST /api/atlas/resolve` route call that service; the browser never receives a
second gazetteer. The route accepts only JSON `{ place }`, applies the same
code-point validation and outcome mapping, and returns no plate geometry.

The internal successful resolution includes the plate-fetch target needed by
the controller but is never copied into the page-tool result:

```ts
type AtlasResolvedTarget =
  | { level: "nation"; label: "United States" }
  | { level: "state"; label: string; state: string }
  | {
      level: "county";
      label: string;
      state: string;
      countySlug: string;
      countyGeoid: string;
      focusFeatureId?: string;
};

type AtlasResolveHttpResponseV1 =
  | { status: "resolved"; target: AtlasResolvedTarget }
  | {
      status: "ambiguous";
      candidates: Array<AtlasCandidateV1 & { target: AtlasResolvedTarget }>;
    }
  | { status: "unresolved"; reason: "not_in_atlas" | "invalid_input" };
```

A full state name or two-letter state code resolves to the state plate before
the gazetteer; recognized United States aliases resolve to the national plate.
Other input uses the current gazetteer. A place result opens its county plate
and carries its `place:<census-place-geoid>` as the internal focus target. This
requires preserving Census place GEOID in the gazetteer entry. No longitude or
latitude crosses into the page-tool contract.

The real ChatGPT widget runs on a sandbox origin, so the route follows the
existing public plate CORS model: `Access-Control-Allow-Origin: *`,
`Cross-Origin-Resource-Policy: cross-origin`, `POST, OPTIONS`, and only the
`content-type` request header. The browser uses the injected Atlas `apiBase`,
`mode: "cors"`, and `credentials: "omit"`; the Atlas API origin remains in the
widget CSP `connect-src`. The route returns only public Census lookup data and
is IP-rate-limited. It must bypass credential-oriented origin admission while
still passing host admission, request-size validation, and rate limiting.

Reject non-JSON bodies, bodies above 2 KiB, unknown fields, and malformed
values. Route and MCP-service parity tests must prove that the same place input
produces the same resolver outcome and candidates.

The browser consumes the HTTP envelope. The controller retains the resolved
target or current candidate targets only for plate fetching. The page-tool
handler strips every internal `target` before returning a model-facing result;
only the bounded view and public candidate fields cross that boundary.

All three page tools carry `readOnlyHint: true`, `destructiveHint: false`, and
`openWorldHint: false`. Opening or focusing changes local view state, not data;
the resolver calls only the Atlas-owned service.

## Shared state architecture

Extract the private state from both `AtlasApp` and `AtlasPlate` into a typed
controller. It owns the place trail, last good plate, controlled viewport,
selection, visible-feature registry, phase/error, open-request sequence,
interaction revision, and last interaction source. The renderer subscribes to
it and reports settled viewport and collision-layout changes. Human controls
and page-tool handlers issue the same controller commands.

```text
                         +----------------+
human input ------------>|                |
browser page tools ----->| view controller|-----> React map renderer
resolver + plate API ---->|                |-----> bounded view snapshot
                         +----------------+

READY --open--> RESOLVING --resolved--> LOADING --plate--> READY
                    |                         |
                    +--> AMBIGUOUS/UNRESOLVED +--> RETRYABLE ERROR

READY --focus, pan, drill, or select--> READY + one semantic revision
```

`AtlasPlate` becomes controlled or emits settled viewport changes; pointer,
wheel, fit, keyboard, and page-tool camera moves cannot bypass the controller.
The feature registry is built from the renderer's accepted label/hit-target
layout, not DOM scraping.

### Command ordering and revisions

- Every agent open captures an open-request sequence and the current human
  revision. A later agent open cancels the earlier sequence.
- Any meaningful human pan, zoom, drill, or selection after an agent open
  starts cancels that pending open. Human control wins; a late resolver or plate
  response cannot overwrite it.
- A pan is meaningful after more than 4 CSS pixels of settled movement. A zoom
  is meaningful at a scale delta of at least 0.05. Location, drill, or selected
  feature changes are always meaningful.
- Resize, animation frames, loading phases, refused requests, and failed
  requests do not increment the interaction revision.
- A successful open commits the new plate, fitted viewport, cleared selection,
  and one revision atomically. A successful focus commits its selection and any
  required camera settle as one revision.

Loading preserves the last good plate. Every async result validates its request
sequence and captured human revision immediately before commit.

## Existing code to reuse and change

- Keep `web/src/atlas/AtlasPlate.tsx` as the renderer, but move its private
  viewport and selection ownership behind the controller.
- Extend `web/src/atlas/plateGeometry.ts` to carry the stable feature contract.
- Keep `server/src/atlasPlates.ts` for plate construction and preserve anchor
  GEOIDs through its output.
- Reuse `packages/core/src/atlas/gazetteer.ts` through the new shared resolver
  service.
- Extend the current widget host bridge and emulator rather than replacing
  them.
- Fix the existing drag/click ordering before using county drill-down as human
  continuation proof.

Agent-focusable SVG features use a roving focus model or synchronized semantic
feature rail with named controls and 44px hit targets. Human-initiated async
open moves focus to the newly named map region; agent-initiated open announces
without stealing focus. Ambiguous candidates are labelled buttons with Escape
and focus-return behavior. Development diagnostics remain behind an explicit
development flag, not permanent interface furniture.

## Open-source and service reuse

Use
[`use-webmcp-tool@0.2.0`](https://github.com/GoogleChromeLabs/use-webmcp-tool)
as the production React registration seam, locked with `pnpm` integrity
metadata. The reviewed upstream main commit is
`4a9505e7dc2e82a8468d7510dde264915bc7d394`. The package is small,
dependency-free at runtime, React 18 compatible, feature-detects the host API,
and already covers Strict Mode, late API injection, cleanup, and
re-registration behavior.

Use
[`GoogleChromeLabs/webmcp-tools`](https://github.com/GoogleChromeLabs/webmcp-tools)
only for development inspection and examples. Do not ship a production
polyfill; an unsupported host keeps the normal human Atlas experience.

The reviewed hook currently treats `registerTool()` as synchronous even though
the current
[`webmachinelearning/webmcp`](https://github.com/webmachinelearning/webmcp)
contract returns a promise. A rejected registration can therefore surface as
an unhandled rejection after the hook reports success. Prepare an upstream
test and patch that:

1. waits for registration to resolve before reporting success;
2. records an asynchronous rejection as `registered: false` plus an error;
3. ignores late resolution or rejection after effect cleanup;
4. preserves handling for synchronous throws from partial implementations.

Base the upstream change on the reviewed commit and run that repository's full
test and build commands plus an Atlas registration integration test. The
upstream repository requires Google's contributor agreement, so do not open a
pull request until the account/CLA gate is handled.

If no fixed release exists at the challenge freeze, use `pnpm patch` against
the locked 0.2.0 tarball, commit the generated patch and lockfile integrity,
and document the upstream issue/PR. Remove the patch only after a released
version passes the same rejection, cleanup, Strict Mode, and Atlas integration
tests.

## Visual and responsive requirements

`DESIGN.md` is the visual authority. The supplied desktop and phone concepts
set the bar for hierarchy and atmosphere, not literal geography. The final
surface keeps the map dominant, uses the brand orange for a single focus
signal, avoids a dashboard shell, and has no mobile white tail. Controls never
cover important labels. The desktop concept's dotted path must not ship, and
the phone concept's menu icon is not a requirement.

### Signature Atlas moment

The acceptance sequence is a visual state change, not only an API success:

1. The agent opens Riverside County while the prior plate stays visible.
2. One real town target receives the unmistakable orange reticle.
3. The human drills or moves from that target with touch or keyboard.
4. The agent reads the changed revision and correctly names or focuses a feature
   from the new visible registry.

Capture the four settled states as a desktop filmstrip and repeat states 2–4 on
phone. The reticle must be attached to the selected rendered feature; the map
must remain visually continuous; no protocol panel or transcript result may be
the main evidence.

### Phone acceptance storyboard

At 390x844, capture the national ready state, preserved-map loading state,
candidate bottom sheet, and focused-feature state. Repeat the candidate state
with the visual viewport reduced to 520px to simulate browser chrome or a
software keyboard. The ready state uses a compact top place path, scale at
lower left, and one fit/zoom group at lower right. The candidate sheet is at
most 44dvh and scrolls without creating a white tail. A focus label and reticle
must displace nearby furniture rather than collide with it.

Visual review applies the checklist in `DESIGN.md`: map dominance, one real
focus signal, readable labels, no label/control collision, no white mobile
tail, stable map during transitional states, and a named keyboard path for
every agent-focusable feature.

## Error and edge behavior

| Condition | Visible behavior | Structured behavior |
| --- | --- | --- |
| Place resolves | Prior map remains until the new plate is ready, then transitions | `opened` with bounded view |
| Name is ambiguous | Current map remains; concise candidate choice appears | `ambiguous` with bounded candidates |
| Place is unsupported or out of scope | Current map remains; direct boundary copy appears | `unresolved` with reason |
| Network or plate load fails | Current map remains; one retry is offered | retryable `error` |
| Feature ID is stale or invented | Selection does not change | terminal invalid-feature result |
| Host lacks WebMCP | No agent affordance or warning pollutes the map | human interaction continues |
| A superseded request resolves late | No visible change | response discarded by sequence token |
| Human acts while an agent open is pending | Human change commits; loading state clears | pending open is cancelled |

## Security and privacy

- Page tools are read-only and accept only bounded strings or opaque IDs.
- The browser resolver route is public cross-origin Census lookup, JSON-only,
  credential-free, rate-limited, and size-limited; it shares service logic with
  the existing server MCP handler.
- No arbitrary URL, coordinate, selector, HTML, or script input.
- Tool descriptions state their geographic and read-only limits.
- View snapshots exclude DOM content, diagnostics, network locations, and bulk
  geometry.
- Resolver and focus errors use structured public messages; raw exceptions stay
  in development logging.
- No user identity, conversation, or interaction history is persisted.

## Verification strategy

### Unit and integration

- Registration hook: success, synchronous throw, asynchronous rejection,
  cleanup before settlement, Strict Mode, and late host injection.
- Server resolution: route/MCP parity, national/state/county/place targets,
  CORS preflight and wildcard response, omitted credentials, invalid JSON,
  2 KiB body bound, unknown field, Unicode code-point bound, rate limit, and
  candidate cap.
- Open-place controller: resolved, ambiguous, unresolved, retryable error,
  idempotent repeat, current candidate selection, stale/invented candidate ID,
  internal-target stripping, and stale-response discard.
- Focus controller: valid feature, stale feature, invented feature, repeat, and
  human/agent state parity, safe-center movement, and reduced motion.
- Command arbitration: later agent open wins; meaningful human pan, zoom,
  drill, or selection cancels a pending agent open; late results cannot commit.
- Read-view snapshot: 40-feature and 16 KiB caps, deterministic ordering,
  schema version, revision thresholds, and no geometry/debug leakage.
- Stable feature IDs: GEOID preservation from source data through plate JSON,
  registry, rendered targets, and output; missing-GEOID features are excluded.
- Viewport control: pointer, wheel, fit, keyboard, and agent motion all pass
  through the controller; resize and animation frames do not create revisions.
- Pointer regression: a drag cannot become a county click or drill on release.
- Accessibility: roving focus or semantic rail, arrow/Enter/Escape behavior,
  human-versus-agent focus movement, candidate focus return, live-region copy,
  and 44px targets.
- Loading behavior: the last good plate never disappears.
- Production rendering: debug furniture is absent.
- Page-surface verifier: browser-only registration, exact annotations, schema
  bounds, and proof that no page tool enters the server MCP surface.

### End to end

1. Record the signature Atlas moment: agent opens Riverside County, agent or
   human focuses a visible town, human drills or moves, and agent reads the
   changed view before focusing a current feature.
2. Agent asks for Springfield; ambiguity appears without destroying the map;
   human chooses a candidate and keeps exploring.
3. Human pans or drills; agent reads the new revision; agent focuses a current
   feature without a DOM selector.
4. Unsupported host: the same page remains fully usable by a person.
5. Repeat the phone storyboard at 390x844 and a 390x520 visual viewport with
   keyboard, screen-reader semantics, touch targets, and reduced motion.

Run the existing type, build, location-truth, MCP, document-registry, and
submission gates appropriate to the changed surface. A local emulator is code
evidence only; challenge readiness requires a real capable host and public URL.

## Demo shape

The public demonstration should take 90–150 seconds:

1. Start on the national plate with almost no explanatory chrome.
2. Ask the agent to open an unambiguous place and show the visible transition.
3. Touch or keyboard-focus a landmark or town yourself.
4. Ask the agent what is selected, then have it focus another visible feature.
5. Ask for an ambiguous place and show Atlas refusing to guess.
6. End with the human continuing from the agent-created state on phone.

This sequence demonstrates usefulness, shared state, product feel, and truth
handling without turning the video into a protocol inspector.

## Release gates

- The interaction contracts are represented once in executable source and
  verified against registration.
- Real-host registration, invocation, cleanup, and phone behavior are proven.
- No agent action can blank the current map.
- Ambiguity and refusal preserve context and pass the location-truth gate.
- Production contains no debug panel, fake route, menu-without-navigation, or
  inaccessible pointer-only feature.
- The repository is public from a clean, reproducible SHA with setup and demo
  instructions.
- Generated concept PNGs are labelled public design documentation, excluded
  from the production bundle, and not presented as shipped UI or geography.
- The upstream patch is either accepted/released or documented as a temporary
  local package patch with a removal condition.

## Kill criteria

Stop or reduce the challenge slice if any of these remain true at the release
cut:

- The required host cannot register and call the page tools reliably.
- Shared state works only through DOM scraping or duplicate client geography.
- The demo requires hidden manual correction to avoid a wrong location.
- Mobile loses the map-dominant experience.
- The open-source patch or dependency cannot be pinned and audited safely.

## Implementation sequence after approval

1. Patch and test the registration seam in isolation.
2. Build the shared controller, server reuse seam, stable IDs, and page-tool
   adapter with failing tests first.
3. Apply the visual system, accessibility behavior, and responsive state
   treatment.
4. Verify locally, then in a real capable host, then prepare release evidence.

Each packet should use a clean sibling worktree, red/green tests, focused
engineering and design review, and verification before a completion claim.
