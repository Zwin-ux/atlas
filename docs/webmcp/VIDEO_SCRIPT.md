# Atlas WebMCP Demo Script

Target runtime: **2:45**. Hard maximum: **2:55**. Record one continuous supported-browser session with clear audio. Do not simulate `document.modelContext`; record only after the real built-in browser discovers the exact five tools.

## Recording setup

- Use the owner-approved public no-login URL.
- Start at `/explore` on a desktop viewport with the map fitted to the U.S.
- Confirm the tool picker exposes exactly the five approved Atlas tools.
- Clear prior browser session state.
- Keep the activity line and research rail visible when agent writes occur.
- Do not show private tabs, local paths, credentials, developer consoles, unrelated historical features, or unpublished release material.

## Shot list and narration

### 0:00-0:12, the result first

**Prompt:** “Create a civic research trail through Riverside County, California; Travis County, Texas; and Miami-Dade County, Florida, with one question at each stop.”

**Picture:** The fitted U.S. map immediately gains three numbered markers, one connecting route, and the restrained editable trail rail.

**Narration:** “Atlas is a shared U.S. county canvas. My agent just created this research route through the same live map I can use by hand.”

### 0:12-0:40, human and agent share one state

**Action:** Click the Travis County marker, then ask: “What map am I looking at now?”

**Picture:** Travis County opens through the marker; `get_map_state` reads the same county and active stop.

**Narration:** “A marker is not a decorative pin. It calls the same controller path as the rail and human finder. The agent reads my manual change without a second hidden map.”

### 0:40-1:10, ambiguity without guessing

**Prompt:** “Search for Springfield, then open the Illinois candidate.”

**Picture:** Show `search_places` returning labeled candidates before `open_place` receives the deliberate state-qualified choice.

**Narration:** “Place names are messy. Atlas does not guess which Springfield I meant. Search is read-only; the map changes only after a specific candidate is chosen.”

### 1:10-1:35, visible session note

**Prompt:** “Add a map note at Springfield, Illinois: Verify the local source before quoting a number.”

**Picture:** Show `add_map_note`, visible place transition, activity completion, and editable note.

**Narration:** “Writes do not disappear into model state. This note is visible, editable, and session-only before the tool returns success.”

### 1:35-2:00, manual trail edit

**Action:** Return to the U.S. breadcrumb. Edit one prompt, remove the first stop, and click the newly renumbered active marker.

**Picture:** The route and rail update together; the selected marker opens its county.

**Narration:** “The person stays in control. Trail edits and removals immediately update the route, stop order, active state, and the next map action.”

### 2:00-2:25, exact-five, atomic failure, fallback

**Picture:** Show the exact five tools with their human-readable Site Tools titles, one unresolved trail attempt leaving the prior trail intact, and a short normal-browser fallback frame.

**Narration:** “The cut is intentionally five tools. Every write tells ChatGPT what is already visible, and a failed trail says the prior state stayed intact. In a normal browser, the same no-login map stays usable and calmly says site tools were not detected.”

### 2:25-2:45, challenge delta

**Picture:** Return to the national trail overview. Show the verified public URL, source URL, and submitted commit only after those owner fields are real.

**Narration:** “Atlas existed before the challenge. The challenge work is this browser-native shared-control layer: one map, one live controller, and visible bounded research actions for people and agents.”

## Mandatory proof before upload

- Video is under three minutes and includes audible narration.
- Public URL in the recording matches the submitted URL.
- Tool picker shows exactly five names.
- Every shown agent effect completes visibly.
- Ambiguous search leaves the prior map unchanged.
- Trail has three resolved stops, a visible national route, keyboard markers, and synchronized edits.
- No login, public posting, or unrelated historical product story appears.
- YouTube visibility and challenge form fields match current official rules.
