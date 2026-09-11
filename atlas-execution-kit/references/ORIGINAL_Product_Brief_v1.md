# Atlas — Product Brief for a Finished ChatGPT App

**Status:** Proposed product direction for Mazen’s review. This document is not a repository modification, an implementation report, or evidence of a tested release.

**Product:** The current read-only US Census atlas in `Zwin-ux/atlas`, not the retired voxel project, the separate WebMCP challenge snapshot, or the proposed satellite ML project.

## Product decision

Atlas should help a person understand a US place in the context of a conversation. Its distinctive interaction is not merely opening a map: the person can point to a real mapped place, and the next supported question can refer to that selection correctly.

**Product promise:** Understand a US place without leaving the conversation.

**Interaction loop:** Ask → see the relevant geography → explore → select → ask a grounded follow-up.

The first release is for curious ChatGPT users who need geographic orientation. Learning and local research are initial test contexts, not separate products. Do not frame the app as school-only, professional GIS, navigation, real-estate advice, a business directory, or an all-purpose local intelligence service.

The product hypothesis is that a conversation-aware map helps people understand location and geographic context more clearly than a text-only answer. This needs user testing; it is not an established demand or retention claim.

## Evidence and constraints

The repository handoff defines a read-only, Census-backed application without accounts, commerce, public notes, or external geodata calls. Its design establishes the map-first Playable Maproom. Preserve those boundaries. [R1, R2]

OpenAI’s product guidance recommends small capabilities that contribute to a conversation rather than reproducing a complete destination application. Its current UI guidance distinguishes compact inline output from richer fullscreen interaction. Apply those principles to the existing app, not through a rewrite. [O1, O2]

Two proposed changes to the existing design specification need explicit reconciliation:

1. Make layout display-mode-specific. A compact inline answer is not a full-viewport maproom. Fullscreen may use the available map canvas; inline must respect its host allocation.
2. Keep the atlas character in cartographic linework, land/water treatment, and a restrained selection accent. Use host-compatible system typography and interface controls rather than requiring the custom UI fonts in the current design document. Avoid repeating a large logo already supplied by the ChatGPT app wrapper. [R2, O2]

These are product proposals. When accepted, integrate them into `DESIGN.md` and the existing project plan instead of adding another competing authority document. Runtime status remains in `docs/STATUS.md`. The challenge plan must not silently expand this app’s release scope. [R3]

## The three jobs v1 must complete

### 1. Orient me

Start from the requested place rather than making the user navigate from a national home screen. Show the correct geographic level, a clearly identified subject, enough surrounding context to understand it, and available source information. A city-name request should identify the city’s mapped representation and its supported county/state context; it must not mislabel a county outline as the city’s boundary.

A county view needs a clear way to open its parent state, including when the county was the first result. Parent geography is not the same thing as navigation history: “California” should work even when the user never visited it earlier. “Back” means the previous view, while “Show state” means the geographic parent.

### 2. Let me inspect a place

Selectable features need reliable hit targets, a visible selected state, and a compact explanation of what the selected object is. A named town, a county, and a body of water must not share misleading semantics. Only make a feature selectable when the app has a supported identity and an honest useful response for it.

The first selection detail should answer “What am I looking at?” rather than open a large dashboard. Show the name, geographic type, available parent context, and only useful verified facts. More detail belongs in a small fullscreen inspector, not another navigation tree.

### 3. Continue from what I selected

A person can select a mapped place and ask a supported follow-up without retyping its identity. Include an explicit action named for the selection, such as “Ask about Eastvale,” rather than an ambiguous “Ask AI.” It should send a short, user-readable question with the actual selected identity.

Selection must not automatically start a conversation turn. Panning must not send a stream of chat messages. Publish only bounded, meaningful settled view/selection context through supported host mechanisms. [O3]

When a pronoun is ambiguous, context is stale, or the host cannot provide reliable selection context, use the explicit named action or request clarification. Do not pretend the model sees an arbitrary tap or every pixel of the map.

## Hero interaction to design and test

This is an acceptance scenario, not a report of current behavior. Use current repository data to establish the expected identities.

| Step | Person’s intent/action | Required product behavior |
|---|---|---|
| Open | “Show me Eastvale, California, on a map.” | Resolve the intended place, show the correct county-level geographic context, visibly identify the place, and label the view honestly. |
| Explore | Select “Explore map.” | Enter supported fullscreen mode without resetting the result or selection. Respect the native ChatGPT composer. |
| Inspect | Tap a different supported named place. | Move the single focus treatment to that place; show its identity and available contextual facts immediately. |
| Converse | “What county is this place in?” or the explicit named action. | Answer about the actual selection, grounded in the current data. Do not answer about the originally opened place by mistake. |
| Broaden | Select the parent-state control. | Show the state context without confusing a geographic parent with back-history. |
| Resolve uncertainty | Make an ambiguous place request. | Offer real disambiguating candidates, preserve the last correct view, and navigate only after a valid choice. |

The demo should include a genuine human-to-conversation handoff. A one-shot map render alone does not demonstrate the thesis.

## Two presentations, one product

### Inline: the answer

The inline result should work even when the person never expands it. Its visual hierarchy is the requested place, the meaningful geographic view, one short useful contextual statement when warranted, and discreet source/vintage information.

Keep one primary action, “Explore map.” A selection-specific conversational action may be the secondary action when genuinely useful. Basic selection is appropriate; deep navigation, a long scrolling fact sheet, multiple tabs, and an extra chat composer are not.

Use host-bounded responsive sizing rather than applying `100dvh` universally. Do not hijack ordinary conversation scrolling with map zoom. Render important labels legibly without requiring hover.

No splash screen or welcome modal should precede a specific requested result. For an invocation without a place, a useful national overview and a short invitation to name a supported US place are enough. Do not request precise device location or infer an intended place from unrelated personal information.

### Fullscreen: exploration

Fullscreen adds usable pan/zoom, fit, parent navigation, feature inspection, and the existing supported map interactions. It should preserve the map and selection on entering and returning, where the host supports restoration; test actual clients rather than assuming local React state survives every transition. [O2, O3]

Keep controls away from the host composer and phone safe areas. Use the phone’s available space deliberately: at most one compact contextual panel at a time, dismissible without losing the map. Keyboard focus and screen-reader access need equivalent paths to meaningful place selection.

There is no Atlas chat input. The native ChatGPT conversation handles questions.

## Conversational behavior

Use a small, specific answer contract: answer the requested question, name the relevant place, add only the geographic context needed to interpret the map, and disclose a material limitation. Do not narrate every visible label or repeat the same boilerplate after every turn.

Pointing and conversation should agree. If a response says a place is selected, the actual map state must support that claim. If rendering fails, the text may still answer from authoritative returned data, but must not claim that the user can see a successful map.

Do not guarantee that every earlier map widget in a ChatGPT thread becomes a synchronized live view. Scope context to the active interaction and its data/view revision. If a tool result causes a new widget instance, make the destination and selection explicit instead of promising cross-widget behavior the host has not demonstrated.

Only surface next actions that are supported and relevant. Do not advertise comparison, routes, live businesses, or historical explanations because a model can generate plausible text about them.

## Trust is visible in the product

Use the same place identity and source-backed facts for the interface and the conversation. A point marker is not an exact municipal boundary. A truncated list of mapped places is not an exhaustive inventory. An unavailable measurement is not zero. A familiar name is not proof of a unique match.

The reviewed `server/src/atlasTools.ts` maps missing population values to zero and labels the first entries in an anchor list as the largest towns. This is a source-level observation, not an end-to-end finding: verify upstream ordering and population coverage before relying on either representation in product copy. [R5]

Display each fact’s relevant source vintage and units. Do not label an entire experience “live” because its server is online. Prefer “mapped Census places” over a claim about every town unless coverage supports the stronger claim. Do not imply legal or survey-grade boundaries from a generalized display.

Use a quiet source line and disclose limitations where they matter, rather than putting a large disclaimer over every map. A missing road layer needs an honest boundary on directions requests; it does not need to dominate an unrelated county-location answer.

Treat UI context as untrusted input for any data operation. Keep only necessary public geographic context, not raw conversation history, secrets, or background browsing/location telemetry. Do not promise no logging without checking actual server and diagnostics behavior.

## State copy and behavior

| Situation | Example copy | View behavior |
|---|---|---|
| First load | “Loading the map…” | Intentional loading state; no invented placeholder geography. |
| Switching place | “Opening the next map…” | Keep the prior map accurately labelled until the new one succeeds. |
| Ambiguous name | “Which place did you mean?” | Show source-backed candidates distinguished by state/county or other supported identity. |
| Unknown place | “I couldn’t match that place. Try its county or state.” | Preserve the current view; suggestions must remain suggestions. |
| Retryable failure | “That map didn’t load. Try again.” | Preserve context and provide a functioning retry. |
| Unsupported directions | “Atlas shows geography, not driving routes.” | Do not draw a plausible-looking route or invent travel times. |
| Selection | “[Selected place]” | Make the named object visibly selected without stealing keyboard focus. |

The reviewed widget source currently replaces the stage during loading/error and renders diagnostics without a production condition. Those observations motivate explicit product acceptance checks; this brief does not claim to have run the interface. [R4]

## Scope and sequence

**Release-critical:** Correct requested-place framing; compact inline and usable fullscreen presentations; honest selection and supported follow-ups; clear parent/back behavior; accessible ambiguity and recovery; source/vintage clarity; actual ChatGPT-host verification.

**After the core works:** Label decluttering and frame composition across diverse supported geography; measured responsiveness; one concise comprehension-oriented explanation derived from existing facts; refinements based on observed user difficulty. These are polish slices, not new product categories.

**Explicitly deferred:** County comparison, data-layer expansion, cross-session saves, exports/share infrastructure, guided tours, or additional interaction modes. Any later comparison needs an explicit scope decision, real comparable data, and a declared scale/projection convention. It must not hold this release hostage. No accounts, commerce, external geodata, voxel revival, or ML work belongs in this release. [R1, R3]

A bounded first product slice is: make one supported county/place flow succeed inline, in fullscreen, through a new selection and named follow-up, and through one ambiguity/recovery case. Apply the same rules to the remaining supported geography; do not hard-code the featured demo location.

## Discovery and expectation-setting

Suggested listing direction: **Atlas — US Geography**. This retains the brand while making scope legible; it is not a claim of name approval or availability.

Suggested listing copy: “Explore US counties and mapped places with interactive Census-based maps. Open a place, inspect its geography, and continue asking questions in ChatGPT.” Publish selection-follow-up promises only after they are verified.

Candidate starter requests should illustrate different supported jobs: a named place in context, a state map, and a clearly scoped county lookup. Avoid aspirational prompts that rely on deferred features.

Treat descriptions as routing-facing product copy as well as human copy. Test direct requests, equivalent requests that omit Atlas’s name, follow-ups, and requests that should not invoke Atlas. Do not optimize descriptions to hijack unrelated questions. [O4, O5]

## Validate usefulness, not just appearance

Run an initial formative test with eight people unfamiliar with the repository, spanning everyday ChatGPT users and people who use maps for learning or local research. This is a proposed small usability study, not statistically representative market research.

Give each participant supported tasks without naming the controls they should click: orient a named place; inspect another feature; ask about the selection; resolve an ambiguous name; return to broader context. Include a directions request to test scope comprehension.

For suitable comprehension questions, compare the Atlas experience with a text-only answer. Counterbalance task/order where practical. Ask whether they can correctly describe the geography and identify what the map represents; do not simply ask whether they like the visual style.

Proposed initial gates: at least six of eight complete the main flow without coaching; all factual mistakes and map/text mismatches are investigated before release; users can distinguish missing data from a zero or definitive negative. Report positive completion alongside refusal correctness so refusal cannot game the results.

Measure local selection feedback separately from map-data/render latency and overall model/host time. Record device, network, cache state, and cold/warm behavior. Do not publish a speed claim until measured. A local feedback target around 100 ms can be explored as a design budget, not claimed performance.

Use developer-controlled regression tests for broad name/data coverage, and human tests for comprehension and control. Refresh the actual ChatGPT connection after relevant changes and verify the real widget plus model-readable results; preview tests alone are insufficient evidence. [O5]

Prefer task completion, comprehension, and appropriate future-use intent over session length or forced engagement. Do not add production tracking infrastructure solely to run this small study; use consented observation and minimal test records.

## Product completion statement

A first release is product-complete when a new user can understand its scope, get a correct useful map, identify and inspect the subject, make a supported follow-up without identity loss, recover from uncertainty or error, and leave with a better understanding of the place—on both desktop and phone.

The map should help answer the question, not become another interface the person must learn.

## Sources

Repository sources reviewed through the connected GitHub account. These are source/document observations, not runtime verification. Re-read the current checkout before implementation.

- [R1 — Current product handoff](https://github.com/Zwin-ux/atlas/blob/main/CHATGPT.md)
- [R2 — Existing design system](https://github.com/Zwin-ux/atlas/blob/main/DESIGN.md)
- [R3 — Existing project plan](https://github.com/Zwin-ux/atlas/blob/main/docs/brain/PROJECT_PLAN.md)
- [R4 — Widget source](https://github.com/Zwin-ux/atlas/blob/main/web/src/atlas/AtlasApp.tsx)
- [R5 — Tool facts and output](https://github.com/Zwin-ux/atlas/blob/main/server/src/atlasTools.ts)
- [O1 — OpenAI: What makes a great ChatGPT app](https://developers.openai.com/blog/what-makes-a-great-chatgpt-app)
- [O2 — OpenAI: UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines)
- [O3 — OpenAI: Add UI to your MCP server, including state management](https://developers.openai.com/plugins/build/chatgpt-ui)
- [O4 — OpenAI: Optimize metadata](https://developers.openai.com/plugins/guides/optimize-metadata)
- [O5 — OpenAI: Connect and test](https://developers.openai.com/plugins/deploy/connect-chatgpt)

OpenAI’s Apps SDK URLs redirected to the current documentation paths above during this review. Check current official guidance again when implementing.
