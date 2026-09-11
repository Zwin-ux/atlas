# Interaction and state contract

This is a proposed design for the existing components, not an instruction to adopt a state-machine library. Implement with the simplest typed reducer/state structure appropriate to the repository.

## State owners

**Server:** source-backed place identity, source revision/vintage, facts, permitted plate references and geographic relationships.

**Widget instance:** displayed plate reference, pending destination/request ID, selected feature, camera, back history, display mode, inspector/candidate UI, short-lived error/retry state.

**Host adapter:** supported capability detection, tool-result events, mode requests, bounded selection context, optional widget-scoped state restoration. The adapter does not own geographic truth.

**Conversation:** the user's stated intent and explicit follow-up. A widget cannot assume it controls every future assistant message or other widget instance.

## Important distinctions

- `requested` is the destination being fetched; `displayed` is the last authoritative map actually visible.
- `geographicParent` is a source-backed relationship; `historyPrevious` is the prior UI state.
- `selectedFeatureId` is the question subject; `camera` is just framing.
- `toolResultId` identifies an incoming result; `requestGeneration` identifies this widget's current async work.
- `hostContextPublished` is a best-effort update, not proof the next model turn has interpreted it.

## Transition rules

| Event | Precondition | State/result | Required invariant |
|---|---|---|---|
| Initial valid result | Schema and identity accepted | Fetch matching plate | No fake fallback geography. |
| Later valid result | Newer compatible result | Mark destination pending; retain displayed map | Old title stays attached to old map. |
| Candidate/unknown result | Explicit refusal status | Open bounded choice/refusal UI | No navigation disguised as success. |
| Fetch success | Matches current request generation | Atomically replace plate, title, context | No old response overwrites new intent. |
| Fetch failure | Matches current request generation | Preserve map; attach retry to failed request | Error does not clear known good state. |
| Candidate selected | Candidate still belongs to current response | Resolve/open exact canonical identity | No stale candidate from another request. |
| Feature selected | Belongs to displayed plate | Update selected ID and compact detail | Tap does not automatically send a turn. |
| Named question clicked | Selection remains valid | Send readable named question through supported bridge | Identity captured from current state once. |
| Map panned | Human gesture | Change camera | No repeated conversational messages. |
| Parent opened | Valid parent in source contract | Navigate to parent | Independent of navigation history. |
| Back | History entry remains usable | Restore compatible prior view | Not silently interpreted as parent. |
| Enter/exit larger mode | Host advertises support | Preserve compatible selection/view | No new product instance with unrelated state. |
| Host result repeated | Already applied result identity | Idempotent no-op or safe refresh | No duplicate asks or listeners. |
| Remount | Valid restoration plus authoritative source | Restore bounded compatible state | No durable-save promise. |
| Unsupported host | Capability absent | Keep human-readable map and controls | No infinite handshake wait. |
| Source identity invalidated | Current selection not in new plate | Clear selection intentionally | No ghost focus or stale question subject. |

## Refusal precedence

Discriminate on result status before using a level or plate reference. An explicit ambiguous/unresolved payload cannot be overridden by an earlier success's metadata. Do not choose whichever host field happens to be present without defining which result it belongs to.

## Race and cancellation examples

A→B→A is three intents, even if two names match. Start A, start B, complete B, complete A: display B. Select a place, switch county, then click a delayed inspector action: reject stale action instead of asking about a feature no longer represented. Agent opens one map while a human navigates: use an explicit latest-intent policy, tested in the real host; do not silently overwrite a recent user action due to an old notification.

## Context envelope proposal

Keep a small versioned envelope: widget instance/reference, public view level and identity, selected feature ID/name/type, optional supported parents, source revision, and a monotonic local generation. Use existing types rather than inventing a competing domain model.

Treat IDs and names coming back from UI context as untrusted. Validate against current Atlas-owned data before returning authoritative facts. No arbitrary URL fetch, JavaScript, filesystem path, SQL, or model instruction is accepted as a location field.

A proposed payload cap and debounce policy should be measured on actual host behavior and documented in the current contract. Do not use continuous pointer updates. Test missing context and make named questions work even when pronoun context is unreliable.

## View and focus guarantees

Keyboard focus and visual map selection are distinct. Human searches may move focus to a result/choice; agent-driven updates should announce without stealing active control. Closing candidate UI returns focus to its initiator. Focusable geometry needs an equivalent semantic navigation path; hiding SVG labels from assistive technology is not enough.

Target the supported host sizes, including phone and a reduced keyboard viewport. Exact layout values belong to design tokens/tests, not duplicated prose. Example QA phone viewport remains 390×844 because it is an existing repository requirement.
