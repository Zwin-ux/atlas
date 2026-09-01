# Product Requirements Document

## Product Summary

Atlas is a ChatGPT-native U.S. field atlas. It lets a person discuss a place with ChatGPT, see that place open on a shared map, continue exploring manually, attach notebook-like observations, and connect several places into an ordered geographic trail.

The product exists to close the gap between conversational understanding and spatial understanding. ChatGPT should not merely describe a county while the person imagines it or opens a separate generic map. Atlas gives the conversation a visible geographic object that both person and agent can read and change.

Atlas is not a chatbot panel beside a map. The map is the product. ChatGPT is one participant in the map session.

## Product Goals

1. Make a geographic request in ChatGPT produce an immediate, legible, visible result on a U.S. map.
2. Let the person and ChatGPT alternate control without losing or duplicating state.
3. Make notes and multi-place trails feel like a travel field notebook rather than application records.
4. Preserve uncertainty honestly so Atlas never silently chooses the wrong place or partially completes a failed journey.
5. Feel like a high-quality atlas before it feels like a hackathon integration.
6. Demonstrate why WebMCP is materially better than a detached chatbot response or blind UI automation.

## Experience Principles

### Map first

The map remains the largest and clearest object on desktop and mobile. Search, status, notes, and trails support the map rather than competing with it.

### Conversation becomes geography

Atlas responds to explicit geographic intent: show, explore, compare, remember, or make a trail. Casual mentions of a place should not cause intrusive map changes.

### Shared means editable

An action initiated by ChatGPT must appear in the same interface the person can touch. A person can then change the location, select a marker, edit a note, or remove a stop, and ChatGPT's next read must reflect that visible correction.

### Honest uncertainty

Ambiguous and unknown places produce clear recovery choices. Atlas does not guess, create half a trail, or claim success when the visible map did not change.

### Field-atlas character

Warm paper, precise ink, restrained green, handwritten cartographic accents, and tactile motion create a travel-notebook identity. Legibility, geographic confidence, and map area take priority over decoration.

### Session clarity

Notes and trails are intentionally temporary. The interface should say this plainly so refresh behavior is unsurprising and no one mistakes Atlas for a saved travel account.

## Target User

The primary user is a regular person who is curious about a place in the United States and already talks with ChatGPT. They should not need mapping expertise, civic-data expertise, an Atlas account, or knowledge of WebMCP.

Examples include:

- A traveler comparing counties before a trip.
- A student following places discussed in a history or civics conversation.
- A resident learning about nearby counties.
- A local journalist or organizer collecting place-bound questions.
- A curious ChatGPT user asking where several places are in relation to one another.

The broad audience affects the product language: controls and feedback use direct phrases such as “Place not changed,” “Choose a Springfield,” “Trail ready,” and “Session only.” Internal tool or protocol vocabulary should not dominate the map.

## Core User Journey

### Entry

The person opens Atlas and immediately sees the United States. There is one obvious place finder, a quiet readiness indicator, and no modal, onboarding tour, empty card grid, or blank notebook demanding setup.

### Conversational place opening

The person asks ChatGPT to show or explore a U.S. place. If the name resolves clearly, Atlas opens the county visibly and updates its location cues. If the name is ambiguous, Atlas stays where it is and provides candidates for deliberate selection.

### Human continuation

After ChatGPT opens the place, the person can pan, zoom, use breadcrumbs, select a county, or use the finder. Their action changes the same current map state, not a separate manual state.

### Notebook action

The person asks ChatGPT to remember an observation about the place or adds one manually. The note appears attached to the place, remains editable and removable, and is labeled session-only.

### Multi-place journey

The person asks ChatGPT to compare or connect several U.S. places. Atlas validates all requested stops first. When every stop is ready, Atlas shows the national map, draws a numbered route in the requested order, and displays matching notebook entries. Selecting a marker or an entry opens the same stop.

### Correction and recovery

The person can correct the journey manually. The next ChatGPT state read describes the corrected visible map. If a request fails or becomes stale, Atlas preserves the last completed state and explains what did not change.

## Epics And User Stories

### Epic 1: Enter A Real Atlas

#### Story 1.1 — Immediate national context

As a curious person, I want to see the United States as soon as Atlas opens so that I understand the geographic scope without setup.

Acceptance criteria:

- The national map is the dominant visible surface on first open.
- State and county geography is recognizable without requiring an interaction.
- The place finder is visible and usable.
- No tutorial, login request, empty notebook panel, feature grid, or marketing overlay blocks the map.
- A quiet status cue distinguishes a ready map from a loading or unavailable one.

#### Story 1.2 — Normal-browser usefulness

As a person opening Atlas outside ChatGPT, I want the atlas to remain fully usable so that the product does not collapse when Site Tools are absent.

Acceptance criteria:

- Search, pan, zoom, county opening, breadcrumbs, notes, and trails remain usable through human controls.
- The interface states that Site Tools were not detected without presenting the map as broken.
- The absence message does not consume meaningful map area or ask the person to install something before exploring.

### Epic 2: Open A Place Through Conversation

#### Story 2.1 — Explicit geographic intent

As a ChatGPT user, I want requests such as “show,” “explore,” “compare,” or “note” to affect Atlas so that conversational intent becomes visible geography.

Acceptance criteria:

- A clearly resolved request opens the intended county visibly.
- The location name and breadcrumb/status agree with the displayed place.
- ChatGPT does not report completion before the matching place is visible.
- After the place opens, the person can immediately pan, zoom, search, or navigate manually.
- A casual place mention without geographic intent does not require Atlas to interrupt the conversation.

#### Story 2.2 — Ambiguous place choice

As a person asking about a common place name, I want Atlas to show the available candidates so that I choose deliberately.

Acceptance criteria:

- A request such as “Springfield” returns labeled candidates with enough context to distinguish them.
- The map, active place, notes, and trail remain unchanged while the request is unresolved.
- The feedback explicitly says that the place did not change.
- Selecting one candidate opens only that candidate and clears the ambiguity state.

#### Story 2.3 — Unknown place recovery

As a person entering an unknown or unsupported place, I want a direct explanation so that I know what to try next.

Acceptance criteria:

- Atlas does not invent a place, silently substitute a similar name, or move the map.
- The previous visible state remains intact.
- The response uses plain language and suggests a narrower U.S. city/county-and-state query when helpful.

### Epic 3: Share Control With ChatGPT

#### Story 3.1 — One current map

As a person moving between ChatGPT and the map, I want both sides to refer to the same current place so that I never reconcile two versions of the session.

Acceptance criteria:

- A place opened by ChatGPT is immediately available to human controls.
- A place or trail stop opened manually becomes the current place returned on ChatGPT's next state read.
- A manually edited trail title, stop prompt, or note appears in the next state read.
- The interface does not label one version “agent” and another “manual” as if they were separate documents.

#### Story 3.2 — Visible agent activity

As a person watching ChatGPT act, I want concise progress and completion feedback so that I understand what is happening without reading developer logs.

Acceptance criteria:

- An active tool action has a visible, restrained running state.
- Completion feedback names the visible effect, such as a place opening, note appearing, or trail rendering.
- Failure feedback names what stayed unchanged.
- Activity text remains secondary to the map and does not become a permanent dashboard.

#### Story 3.3 — Newest completed action wins

As a person issuing or interrupting multiple actions, I want the final visible state to remain stable so that an older request cannot overwrite my newer choice.

Acceptance criteria:

- When actions overlap, only the newest visibly completed action remains current.
- A canceled, superseded, or stale action cannot later report success and move the map backward.
- The visible status and ChatGPT's next state read agree about which action completed.

### Epic 4: Build An Ordered Journey

#### Story 4.1 — Create a complete trail

As an explorer discussing several U.S. places, I want one ordered geographic trail so that I can understand their relationship at a glance.

Acceptance criteria:

- Atlas accepts a focused journey of two to five requested stops.
- The national map appears with a single connecting line and numbered markers.
- Marker numbers match the requested order.
- The notebook lists the same stops in the same order.
- The trail title is visible and editable.
- The route is visible before ChatGPT reports that the trail was created.

#### Story 4.2 — Open and edit a trail stop

As a person reviewing the trail, I want markers and notebook entries to open the same stop so that map and list never disagree.

Acceptance criteria:

- Selecting a marker opens the corresponding county.
- Selecting the matching notebook entry has the same effect.
- The active stop is identifiable without relying on color alone.
- The stop's prompt can be edited manually and the updated text remains attached to that stop.
- A stop can be removed manually; marker numbering and the notebook update together.

#### Story 4.3 — Reject incomplete trails atomically

As a person asking for a journey with an invalid or ambiguous stop, I want the entire request paused or rejected so that I never mistake a partial route for my requested trail.

Acceptance criteria:

- Atlas resolves every stop before showing a new route.
- If any stop is unknown or ambiguous, no marker, line, title, or notebook entry from the attempted trail appears.
- The previous map and trail remain intact.
- Feedback identifies the unresolved stop and states that the trail did not change.

### Epic 5: Keep A Place-Bound Notebook

#### Story 5.1 — Add a visible note

As an explorer, I want to attach an observation to a place so that the conversation produces something I can continue editing.

Acceptance criteria:

- A successfully added note appears visibly with its place name.
- If adding the note also opens the place, the location is visible before success is reported.
- The note text is presented as user-authored content, not trusted system guidance.
- The notebook clearly indicates that the note exists only for the current session.

#### Story 5.2 — Edit and remove a note manually

As a person refining my notebook, I want to change or remove notes directly so that ChatGPT does not own my observations.

Acceptance criteria:

- Note text can be edited in the visible notebook.
- A note can be removed without removing unrelated notes or trail stops.
- ChatGPT's next state read reflects the edited or removed note.
- Empty-note behavior does not leave a broken or misleading notebook row.

#### Story 5.3 — Intentional session reset

As a person using a temporary atlas session, I want the session boundary stated clearly so that refresh behavior is predictable.

Acceptance criteria:

- Notes and trails are labeled session-only wherever their permanence matters.
- Refresh starts a clean notebook and trail state.
- Refresh does not imply that data was saved or that recovery is available.
- The underlying atlas remains ready and usable after the reset.

### Epic 6: Feel Like A Field Atlas

#### Story 6.1 — Cartographic hierarchy

As a person exploring the map, I want geography to remain visually primary so that Atlas feels confident and easy to read.

Acceptance criteria:

- The map occupies the primary visual area on desktop and mobile.
- Search, status, notes, and trail controls have clear hierarchy without covering essential geography.
- Warm paper and ink establish the base visual language.
- Restrained green identifies current shared geography and route state.
- Decorative effects do not obscure county boundaries, labels, markers, or scale information.

#### Story 6.2 — Handwritten notebook character

As a person keeping observations, I want subtle authored character so that the notebook feels personal rather than like a generic database.

Acceptance criteria:

- Handwritten character appears in selected cartographic, title, or note accents.
- Finder text, buttons, feedback, and longer passages remain conventionally legible.
- Handwriting never becomes the sole signal for state or action.
- The design does not drift into scrapbook clutter or novelty typography.

#### Story 6.3 — Tactile completion

As a person opening, zooming, drawing, or noting, I want each action to feel physically connected to the map so that the product feels finished.

Acceptance criteria:

- Opening a place provides visible continuity between the prior and next map state.
- Trail creation communicates the ordered route without delaying interaction.
- Note creation makes the new notebook object easy to locate.
- Zoom controls provide immediate feedback and preserve orientation.
- Motion uses one restrained vocabulary rather than unrelated effects.
- Reduced-motion preference preserves every state change and completion cue without unnecessary movement.

#### Story 6.4 — Mobile field use

As a person exploring on a phone-sized screen, I want the map and notebook to remain practical so that mobile is not a compressed desktop afterthought.

Acceptance criteria:

- The place finder remains easy to reach and use at 390x844.
- Map controls and trail markers have usable touch targets.
- The national route remains understandable at mobile scale.
- The active note or trail editing task is available without permanently shrinking the map to an unusable area.
- Lower-value text yields before the map or primary action becomes too small.

### Epic 7: Prove The Product Honestly

#### Story 7.1 — Judge-visible WebMCP value

As a challenge judge, I want to see ChatGPT operate the same atlas a person uses so that WebMCP's benefit is obvious without reading architecture notes.

Acceptance criteria:

- The top-level route exposes exactly five focused Site Tools together.
- The opening demo produces a visible three-place route through ChatGPT.
- A human marker selection changes what ChatGPT reads as current.
- An ambiguous request visibly preserves state.
- A ChatGPT note appears in the shared notebook and can be edited manually.
- The experience remains a useful atlas when Site Tools are unavailable.

#### Story 7.2 — Honest submission media

As a judge watching the submission video, I want every claim to match the live candidate so that I can trust the project.

Acceptance criteria:

- The video uses the live or immutable candidate represented by the public source.
- The under-three-minute video includes audio and demonstrates the working product loop.
- Generated visual references are not presented as live functionality or geographic data.
- The description separates pre-existing Atlas capabilities from the challenge-period WebMCP work.

## Edge Cases

### First run and empty state

- Atlas opens on the national map even when there are no notes or trails.
- Empty notebook areas do not occupy prominent space or display filler copy.
- Site Tool registration can be loading, available, unavailable, or failed without blocking human exploration.

### Search and ambiguity

- Blank or whitespace-only search does not move the map.
- Common names return candidates rather than a silent first result.
- “Open Springfield and add this note” adds nothing until one Springfield is selected.
- Unsupported or unknown queries preserve the current map and notebook.

### Trail boundaries

- Fewer than two or more than five requested stops do not create a misleading route.
- Duplicate place requests must be handled consistently and not produce confusing stacked markers.
- One unresolved stop prevents all mutation from the attempted trail.
- Removing a stop updates marker order, route line, and notebook together.
- Removing enough stops to invalidate a trail produces a clear remaining state rather than a broken line.

### Shared corrections

- Manual marker, breadcrumb, finder, note, title, prompt, and removal actions update the state ChatGPT reads next.
- ChatGPT does not restore a deleted item merely because it appeared earlier in the conversation.
- Overlapping actions cannot leave status text describing a different place than the visible map.

### Session boundary

- Refresh clears notes and trails intentionally.
- Route transitions within the challenge page do not duplicate tool availability or unexpectedly reset current session state.
- No interface copy implies cloud saving, account recovery, or cross-device availability.

### Accessibility and motion

- Every trail marker can be reached and activated without a mouse.
- Focus is visible against paper, map, and notebook surfaces.
- Active state is not communicated by green alone.
- Reduced motion retains order, completion, and error comprehension.
- At mobile size, touch targets remain practical and the current map area remains useful.

## Priority

### Must be excellent for submission

- Top-level ChatGPT place opening and state reading.
- Three-place atomic trail with national overlay.
- Shared human/agent correction.
- Place-bound session notes.
- Ambiguity and failure safety.
- Field-atlas map hierarchy on desktop and mobile.
- Coherent completion feedback and reduced-motion behavior.
- Real ChatGPT/WebMCP proof, final screenshots, video, and release consistency.

### Must remain functional

- Human place finder, pan, zoom, county opening, and breadcrumbs.
- Normal-browser fallback.
- Legacy iframe preview as a secondary compatibility surface.

### May receive one bounded study

- One Higgsfield-authored texture, graphic, or motion reference only when its purpose, cost, and acceptance bar are declared before generation and it can improve the actual live surface or submission clarity.

## What We Are Building

- A no-login U.S. atlas that opens directly to the map.
- Natural place lookup and visible ChatGPT place opening.
- Exactly five focused WebMCP tools.
- One shared, editable map state for person and agent.
- Session-only place notes and ordered trails.
- Atomic writes and ambiguity-safe recovery.
- A warm field-atlas visual system with accessible tactile feedback.
- Desktop, mobile, normal-browser, and real ChatGPT proof.
- A concise, honest, reproducible public submission package.

## What We Would Add With More Time

### Saved fieldbooks

Opt-in persistence, named notebooks, and return sessions could turn temporary exploration into an ongoing travel or research practice. This is deferred because the challenge loop works anonymously and persistence would add account, privacy, and trust work.

### Richer travel routing

Verified road or transit services could turn ordered trails into real travel directions. This is deferred because turn-by-turn navigation requires new data, accuracy, and product commitments beyond the current county atlas.

### Broader geography

Additional countries or worldwide coverage could extend the concept. This is deferred because the current Census-backed United States boundary is clear, credible, and testable.

### Full iframe redesign

The legacy embedded preview could receive a separate interaction model and visual rebuild. This is deferred because the top-level ChatGPT WebMCP page is the challenge's primary shared-control surface.

### Rich asset library

Additional authored paper textures, cartographic marks, stamps, and motion studies could deepen the field-atlas identity. This is deferred until the core surface and submission proof are finished so generated decoration cannot outrun the product.

### Larger notebooks and trails

Longer journeys, tagging, filtering, and larger note sets could support serious planning. This is deferred because the focused two-to-five-stop session is easier to understand, edit, and prove in a short demo.

## Non-Goals

- Atlas will not provide live traffic or turn-by-turn navigation in this submission because that would require a different data and safety contract.
- Atlas will not require user profiles because anonymous session exploration demonstrates the complete product loop.
- Atlas will not add a sixth WebMCP tool because the five-tool surface already covers read, search, open, note, and trail intents.
- Atlas will not revive voxel, CityWorld, Hosted Clawd, Scout, Commons, billing, or other historical branches because they weaken the focused challenge story.
- Atlas will not adopt a generic dark AI-dashboard aesthetic because it makes the map secondary and erases the field-atlas identity.
- Atlas will not use generated imagery as geographic truth or claim that a visual reference is functioning product behavior.

## Submission Proof Points

### WebMCP leverage

- Exactly five tools appear together on the top-level page.
- Tool descriptions map to distinct conversational intents and accurately state side effects.
- ChatGPT can read the visible state, find places, open a place, add a note, and create a complete trail.
- Manual actions immediately alter the state ChatGPT reads next.

### Execution

- Visible completion precedes write success.
- Ambiguous place resolution and failed trails are mutation-safe.
- Refresh and route transitions do not duplicate tool registrations.
- Normal-browser fallback remains complete.
- Desktop, 390x844 mobile, keyboard, touch, contrast, and reduced-motion behavior are demonstrated.

### Potential impact

- The demo shows a regular person using ChatGPT to gain spatial context rather than reading detached prose.
- Notes and trails make the conversation useful beyond a single answer while remaining transparent and editable.
- The U.S. boundary makes the product immediately understandable and credible.

### Creativity and ambition

- Atlas reframes a map as a shared human-agent object rather than a visual result delivered after the conversation.
- The travel-notebook and field-atlas identity gives the interaction emotional and visual character without obscuring the geographic work.
- Human correction is a first-class product behavior, not an exception to agent control.

## Product Acceptance Summary

Atlas is ready for submission when a judge can open the live route, ask ChatGPT for a small U.S. journey, see the route appear before success, manually change the map or notebook, have ChatGPT read that correction, recover safely from an ambiguous Springfield request, and understand the field-atlas experience on desktop or mobile without setup or unsupported claims.
