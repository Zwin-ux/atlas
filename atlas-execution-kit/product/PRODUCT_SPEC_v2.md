# Atlas v2 execution brief / product scope, not a redesign

## Positioning and success

**Understand a US place without leaving the conversation.** Atlas gives a question a geographic object the person can see and inspect. The first release is for everyday ChatGPT users who want orientation while learning or researching. It is not navigation software, a business directory, a live local-intelligence service, a professional GIS replacement, or an ML demonstration.

The distinguishing interaction is **point and ask**: open a map about a supported place; select a different named feature; ask a supported question about that selection; keep the answer and visible geography aligned. This remains a product hypothesis until observed with users.

A successful interaction produces geographic understanding. More clicks, longer visits, or animated transitions are not substitutes. Do not add engagement mechanics to manufacture use.

This specification consolidates the supplied v1 brief. Apply accepted changes to existing repository authorities. It is not itself a new status source.

## Jobs and boundaries

**Orient.** Show the requested place at the most specific supported geographic level, with enough context to explain what is shown. A town point on a county map must be labelled as a town in county context, not as an exact town boundary.

**Inspect.** Select an Atlas-owned identifiable feature, see a clear focus and a compact explanation, and continue human navigation. A shape with no useful supported identity need not become a clickable feature.

**Continue.** A follow-up can refer to the meaningful current selection when the host context supports it. Always offer the named alternative, such as “Ask about [place]”. Do not assume arbitrary old widgets share one global selection.

**Recover.** Uncertain location, unavailable map, and unsupported request are intended states, not exceptions that get replaced by plausible geography.

**Do not expand** into user accounts, saved collections, comparison, external geodata, routes, businesses, weather, new layer catalogs, payments, public notes, voxel rendering, or satellite/ML work. Changes needed for today's scope have priority over everything in historical TODOs.

## End-to-end release story

Use independently checked real fixtures rather than inventing data for the demo. A named-place prompt such as “Show me Eastvale, California” is an example input; verify its expected identity against current data before using it as an assertion.

1. The requested place appears inline at a useful scale. Its title and geographic type agree with the tool result and map. Missing data is absent or described, never zero-filled.
2. “Explore map” enters the host-supported larger mode. Geography, selection, and compatible view state survive the transition; unavailable host capabilities produce a usable bounded alternative.
3. The person selects another supported named place. Only one feature has the focus accent. Selection changes the inspector but does not send a message.
4. The person uses “Ask about [selected place]” or a supported natural follow-up. The correct identity accompanies the request. A stale/ambiguous context produces a clarification, not a confident answer about the original place.
5. “Show state” displays the geographic parent, whether or not it was visited earlier. “Back” returns to the previous view. Those operations are distinct.
6. An ambiguous request presents real candidates while preserving the last correct map and title. The candidate choice is explicit, and keyboard focus returns sensibly afterward.
7. A failed request leaves the last good map usable and provides a real retry. A late successful response to an older request cannot overwrite a newer choice.

Do not hard-code this story to one county. After one complete vertical slice, run the same contracts across diverse supported fixtures.

## Inline answer

The inline result must be useful without expansion. Use a legible map, requested-place identity, minimal useful context, a discreet source/vintage affordance, and one primary expansion action. Add the named-question action only when selection exists and the host supports a real conversation handoff.

Ordinary conversation scrolling should not unexpectedly zoom the map. Do not add deep drill-in menus, nested scrolling fact panels, a second chat composer, a splash screen, or a card grid. No precise-device-location request is needed to answer an explicit place query.

On first load, show a intentional short loading state. On later loads, preserve the old map and its correct title until the new map succeeds. “Opening [new place]” is pending status, not a new label for the old map.

## Fullscreen maproom

Fullscreen deepens the same answer: comfortable pan/zoom, fit, selection, context, parent navigation, and back. The native host composer is part of the layout, not space the app may cover. Respect safe areas and reduced viewport sizes. Keep only one compact inspector or candidate panel visible at a time on a phone.

Entering/exiting must not fire duplicate location requests solely because the component remounts. Restoration is best-effort per host and widget, never marketed as cross-conversation saves. If restoration fails, use the last authoritative tool result and clearly recover.

## Selection semantics

Use a stable canonical feature ID plus a display name and supported geography context. A selected county is not a selected town. A town's represented point does not imply its exact border. Multiple entities sharing a name must stay distinguishable through the flow.

Show focus on the actual geometry/point. Avoid a decorative reticle at a nearby coordinate. Selection is independent from camera motion: selecting can cause a bounded focus adjustment, while panning does not continuously change the question subject.

When selection becomes incompatible with a new plate or refreshed source, clear it deliberately and announce the change rather than carrying a stale name across geographies. The named action uses the current canonical identity at click time, not a captured old render closure.

## Conversation behavior

Treat tool descriptions and model-visible facts as product copy. The app should be used for supported map/lookup intents, not hijack every question containing a place name. Short successful narration complements the map instead of repeating all its labels.

Publishing selection context does not itself start an assistant turn. Clicking the named follow-up action is the intentional turn. Dedupe repeated host events. Keep question wording user-readable, and do not put hidden policy instructions, bulk geometry, diagnostics, or private history into the context.

If an old widget is reactivated, identify its own view explicitly. Do not claim synchronized maps across a conversation unless tested and supported; the release does not need this feature.

## Facts and map truth

Source vintage and units follow the actual fields used, not a blanket “current/live” label. Missing population is not zero. A list is not “largest” until sorting and completeness justify it. Data covering mapped Census places does not automatically cover every named community.

Use available supported parent relationships; where source membership spans multiple geographies, do not flatten it to a unique county assertion without evidence. Derived geography must state its method and limits. Do not infer commercial or legal conclusions from a general-purpose map.

A qualitative fact strip can be useful, but it is not a prerequisite to release. Identity, place type, and accurate parent context beat a large weakly sourced statistics panel.

## Visual and accessibility quality

Preserve restrained atlas character in geographic linework, land/water distinction, labels, and one clear selection accent. Reconcile structural UI fonts/colors/sizing with current official host guidance before implementation. Do not ship concept images as geography or reintroduce a prominent duplicate logo inside the result.

Keyboard, touch, pointer, and screen-reader paths reach the same meaningful actions. Keep labels readable; remove lower-priority labels rather than shrinking them past the tested floor. Maintain touch targets, contrast, reduced motion, and focus return. Agent updates announce a change without forcibly stealing keyboard focus.

Differentiate hover, keyboard focus, selected place, and pending destination. Color is not the only indicator. A decorative frame is less important than an accurate title, stable map, and visible controls.

## What “finished” means

Every requirement in `graph/requirements.json` has assigned implementation and verification nodes. The product's runtime acceptance cases are in `qa/cases.json`. They start as unrun specifications.

A local candidate is not a public release. Real-host evidence, deployment permission, production smoke checks, portal verification, submission, and external review have distinct outcomes. Usability research informs iteration and exposes defects; it does not invent market demand or silently block unrelated engineering.

The lead reports a finite outcome: implemented and locally verified; exact-host proof completed or blocked; release/publish status separately stated. Do not describe Atlas as a model-training project or promise jobs from the app alone.

## Reading references

Repository scope and design: references R1–R4 in `../references/SOURCES.md`. Host guidance should be rechecked through O1–O4 before making API or layout decisions. These links inform compatibility, while the behaviors above are the proposed Atlas product contract.
