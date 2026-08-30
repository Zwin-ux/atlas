# ChatGPT Site Tools Acceptance

This is the judge-facing interaction contract for Atlas in ChatGPT's built-in browser. It tests the experience as a conversation around one shared map, not as a developer console exercise.

## Supported setup

As of August 30, 2026, OpenAI documents Site Tools as available in the built-in browser in the ChatGPT desktop app for ChatGPT Work and Codex. Use the latest app with GPT-5.6 Sol or GPT-5.6 Terra; GPT-5.6 Luna currently has WebMCP disabled, and Site Tools are not available in Enterprise or Edu workspaces. Availability can also depend on rollout and the current page.

Open the no-login Atlas route in the built-in browser. In the address bar, **Site tools → Available site tools** must list exactly:

1. `get_map_state`
2. `search_places`
3. `open_place`
4. `add_map_note`
5. `create_map_trail`

The tools must come from the top-level Atlas page. Navigating away can make them unavailable.

## The conversation should feel like this

### 1. Establish shared context

**Person:** “What am I looking at in Atlas right now?”

Expected: ChatGPT calls `get_map_state` and answers from the live page. It does not navigate or write. This is also the recovery move after the person pans, opens a county, clicks a trail marker, or edits the rail manually.

### 2. Clarify a place without guessing

**Person:** “I'd like to look at Springfield, but I'm not sure which state. Show me the choices first.”

Expected: ChatGPT calls `search_places`, summarizes the bounded candidates with state and county context, and asks one narrow follow-up. The map stays where it was.

**Person:** “The one in Illinois.”

Expected: ChatGPT calls `open_place` with Springfield plus Illinois. It confirms navigation only after the county view is visible.

### 3. Leave one place-bound thought

**Person:** “Leave this note here: Verify the local source before quoting a number.”

Expected: ChatGPT uses the selected Springfield context to call `add_map_note` with a specific place and the supplied body. The visible note remains editable by the person and lasts only for the browser session.

### 4. Build the visual centerpiece

**Person:** “Set up a research trail called County access check: first Riverside County, California for public records, then Miami-Dade County, Florida for transit access, then Travis County, Texas for meeting notices.”

Expected: ChatGPT makes one `create_map_trail` call with the requested order. Atlas resolves every stop before mutating, returns to the national view, and renders one route plus three numbered markers before success is returned.

### 5. Hand control back and forth

The person clicks marker 2 or the matching rail row.

**Person:** “What am I looking at now?”

Expected: `get_map_state` reports Miami-Dade County and active stop 2. ChatGPT does not need a separate memory of the trail; it reads the same state the person just changed.

## Result contract for conversational recovery

| Situation | Result signal ChatGPT can rely on | Expected response |
|---|---|---|
| Read or search | Tool annotation and description say the map stays unchanged | Answer or present candidates without claiming navigation. |
| Place opened | `mapChanged: true`, `visible: true`, and the visible county `view` | Confirm the place now on screen. |
| Note added | `noteAdded: true`, `mapChanged: true`, `visible: true`, and the visible county `view` | Confirm the note and session-only boundary. |
| Trail created | `trailChanged: true`, `mapChanged: true`, `visible: true`, national trail `view`, and ordered stop summary | Confirm the complete visual route, not merely that a request started. |
| Ambiguous place | `ok: false`, candidates, and `mapChanged: false` | Ask which candidate the person means. Do not guess. |
| Trail stop fails | `ok: false`, one-based `stopNumber`, `trailChanged: false`, and `mapChanged: false` | Identify the stop that needs clarification and explain that the previous map and trail remain intact. Retry the whole trail only after clarification. |

Write success already means the matching interface revision rendered. A redundant `get_map_state` call is useful only when the person explicitly asks for verification or has changed the map manually.

## Acceptance record

Capture this separately from Chrome protocol smoke:

- ChatGPT desktop app version and workspace type;
- selected model;
- tested URL and immutable candidate SHA;
- screenshot of **Available site tools** showing exactly five;
- transcript covering the five turns above;
- screenshot of Springfield candidates before mutation;
- screenshot of the completed national trail before ChatGPT confirms success;
- screenshot or transcript showing a manual marker click followed by a correct state read;
- **Recently used** / Sources record for the calls;
- one failed trail attempt proving the prior map and trail remain unchanged.

Do not mark this gate complete from local Chrome smoke alone. The browser smoke proves the page contract; this record proves the actual ChatGPT conversation.

Copy `evals/atlas-chatgpt.transcript.template.json` outside the repository, replace each placeholder with the observed result and evidence path, set `status` to `captured`, and validate it with:

```powershell
$env:ATLAS_CHATGPT_TRANSCRIPT = "C:\path\to\atlas-chatgpt-transcript.json"
pnpm e2e:chatgpt:transcript
```

The validator rejects a template, placeholder host, missing client version, wrong model, extra tool, invisible write, or mutation-unsafe failure. The full live-URL sequence is in `CHATGPT_E2E.md`.

## Sources

- [OpenAI Site Tools documentation](https://learn.chatgpt.com/docs/webmcp)
- [Chrome WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Chrome WebMCP evaluation guidance](https://developer.chrome.com/docs/ai/webmcp/evals)
