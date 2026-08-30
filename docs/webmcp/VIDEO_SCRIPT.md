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

### 0:00-0:12, the shared surface

**Picture:** Full U.S. map, `ATLAS / United States`, place finder, no login screen.

**Narration:** “Atlas is a shared U.S. county canvas. I can explore it normally, and an agent can read and change this same live map through browser-native WebMCP tools.”

### 0:12-0:35, normal human exploration

**Action:** Pan or zoom once. Use the finder for `Riverside, CA`. Show the county plate and breadcrumb.

**Narration:** “The website works without an agent. I can pan, zoom, drill into counties, or find a place with the keyboard. Atlas uses its existing Census-backed county and place index.”

### 0:35-0:58, ambiguity without guessing

**Action:** Search `Springfield`. Pause on the candidate list, then press Escape or leave it open briefly.

**Narration:** “Place names are messy. Atlas does not guess which Springfield I meant. It keeps the current map unchanged and returns labeled candidates.”

### 0:58-1:20, agent reads and opens the live map

**Prompt:** “Read the current Atlas map state, then open Eastvale, California.”

**Picture:** Show `get_map_state`, then `open_place`; activity line updates; Riverside County/Eastvale becomes visible.

**Narration:** “The agent first reads a small projection of the live state. `open_place` then uses the same controller as the human finder and waits until the matching map revision is visible.”

### 1:20-1:43, visible session note

**Prompt:** “Add a map note at Eastvale: Compare flood-risk sources before quoting a number.”

**Picture:** Show `add_map_note`, visible place transition, activity completion, and editable note.

**Narration:** “Writes do not disappear into hidden model state. This note is visible, editable, and session-only before the tool returns success.”

### 1:43-2:14, atomic research trail

**Prompt:** “Create a trail called River corridor with Eastvale, California: check flood sources; and Norco, California: compare river access.”

**Picture:** Show `create_map_trail`, two visible stops, editable title/prompts, then click the second stop manually.

**Narration:** “A trail resolves every stop first and mutates once. If one stop is unknown or ambiguous, Atlas creates nothing. When it succeeds, the person can edit it and keep exploring by hand.”

### 2:14-2:32, exact-five and fallback

**Picture:** Briefly show the five tool names, then a pre-recorded normal-browser fallback frame if time allows.

**Narration:** “The cut is intentionally five tools. Registration is top-level and all-or-none. In a browser without WebMCP, the same no-login map stays fully usable and reports that site tools are unavailable.”

### 2:32-2:45, challenge delta

**Picture:** Return to the map with the trail and note visible.

**Narration:** “Atlas existed before the challenge. The challenge work is this browser-native shared-control layer: one map, one live controller, and visible bounded research actions for people and agents.”

## Mandatory proof before upload

- Video is under three minutes and includes audible narration.
- Public URL in the recording matches the submitted URL.
- Tool picker shows exactly five names.
- Every shown agent effect completes visibly.
- Ambiguous search leaves the prior map unchanged.
- Trail has two resolved stops and is editable.
- No login, public posting, or unrelated historical product story appears.
- YouTube visibility and challenge form fields match current official rules.
