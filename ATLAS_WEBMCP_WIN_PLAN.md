# Atlas WebMCP Challenge Win Plan

**Prepared:** August 29, 2026  
**Deadline:** Thursday, September 3, 2026 at 1:00 PM Pacific  
**Recommended submission:** a focused, public, no-login WebMCP website built from the existing Atlas map engine

## Executive verdict

Atlas has enough technical depth and visual distinctiveness to become a credible top-10 entry, but the current repository and deployment are not submission-ready.

The winning move is **not** to add more Atlas product surface. It is to make the existing map a genuinely shared workspace where a human and an agent can inspect and change the same visible state through browser-native WebMCP tools.

The product thesis should be:

> **Atlas is a shared geographic canvas. A person explores U.S. counties visually while their agent can understand the current map, open places, focus mapped towns, and attach research notes directly to the geography on screen.**

The challenge entry should be judged as a meaningful WebMCP extension added during the August 25–September 3 submission window. The old Apps SDK/MCP plugin can remain as a separate integration, but it is not the competition entry.

---

## 1. What the current Atlas project already gives us

The existing codebase is not a toy. It already contains most of the expensive product work:

- A nationwide U.S. county map and place-resolution layer grounded in Census geography.
- A polished voxel/clay map experience with a richer Riverside/Eastvale authored slice.
- React state for the active county, selected place, camera focus, stickers, and notes.
- Existing UI handlers for changing county, selecting a place, placing a sticker, and saving a note.
- Server-side place search, county facts, ambiguity handling, map packs, and rendering infrastructure.
- Mature TypeScript build, test, and verification scripts.
- Multiple Atlas deployments that can be used as regression references.

This means the WebMCP work should be a **thin page-native command layer over real existing actions**, not another parallel backend or a rewrite of the renderer.

### How to use the three Atlas variants

| Variant | Role during the challenge | Submission role |
|---|---|---|
| **Atlas 2** | Public, no-auth behavioral reference for nationwide map opening and place resolution | Best functional baseline |
| **Atlas** | Regression reference for the richer voxel map and older map interaction surface | Internal reference only |
| **Atlas Staging** | Internal validation of gated/experimental functionality | Do not put it in the judge path |

The Auth0 signup page that appeared came from the Atlas Staging authentication boundary. Do not use that route in the submission or demo. A judge should reach the working map immediately without creating an account.

---

## 2. Submission blockers found in the audit

| Blocker | Why it matters | Required fix |
|---|---|---|
| The repository is private | Devpost requires a public repository | Publish a sanitized submission repo or safely make the current repo public |
| No root open-source license was found | An open-source license is required and must be visible | Add MIT or Apache-2.0 after confirming all included code/assets can be licensed |
| No `document.modelContext.registerTool` implementation exists | The current implementation is MCP/Apps SDK, not WebMCP | Add imperative WebMCP tools directly to the website |
| No meaningful challenge-period WebMCP commits were found | Existing projects are evaluated only on work added after August 25 | Create a clearly dated challenge branch and a challenge-delta document |
| The default branch is an old branch hundreds of commits behind `main` | Judges may land on stale code and a stale README | Make the clean challenge branch the public default before submission |
| The production Railway preview could not be loaded in independent checks | The live URL is mandatory | Deploy a new stable public URL and test it from an incognito browser and ChatGPT desktop |
| The current Devpost project is an old Build Week draft | Its title/tagline and empty writeup do not match this competition | Create or fully repurpose a WebMCP-specific Devpost project |
| The repo is very large and contains many historical artifacts, prompts, and abandoned product directions | Judge friction and public-release risk | Publish a clean challenge-focused tree and run a secret/license audit |
| Current copy mixes Atlas maps, Scout Drop, campaigns, Hosted Clawd, billing, Commons, public notes, and staging auth | It weakens execution and impact scores | Hide everything except the shared map workspace for the challenge build |

### Honest current score

| Criterion | Current state | Target after challenge extension |
|---|---:|---:|
| WebMCP Leverage | 0/5 | 5/5 |
| Execution | 2/5 | 4.5–5/5 |
| Potential Impact | 2.5–3/5 | 4–4.5/5 |
| Creativity & Ambition | 4/5 | 4.5–5/5 |

**As submitted today, Atlas would fail. With the focused extension below, it becomes a serious contender. Winning is not guaranteed, especially in a crowded field, but this is a credible path rather than wishful thinking.**

---

## 3. The product cut that can win

### Keep in the challenge build

- Nationwide county/state/place opening.
- Census-grounded identity, boundaries, towns, water, and existing county facts.
- The strongest current map renderer.
- Human map navigation and place selection.
- Session-only research notes and map markers.
- A small visible agent-activity area.
- Browser-native WebMCP registration.
- A graceful normal-browser fallback when WebMCP is unavailable.

### Hide or remove from the challenge path

- Scout Drop and local-business campaign planning.
- Hosted Clawd, subscription, checkout, billing, or waitlist surfaces.
- Auth0 signup/login.
- Public Atlas Commons posting and moderation.
- Any claim that generated streets/buildings are verified geography.
- Internal engine-quality dashboards and historical build terminology.
- Old OpenAI Apps SDK submission copy.

The judge should understand Atlas in one sentence within five seconds. Every unrelated feature makes that harder.

---

## 4. Specific audience and problem

Do not pitch Atlas as “a map for everyone.” The impact criterion rewards a credible problem for a real audience.

### Primary audience

**Students, local journalists, civic researchers, and community organizers who need to understand an unfamiliar U.S. county and keep a visible trail of what they are investigating.**

### Existing problem

A normal map is visual but agent-blind. A normal chat answer is textual but detached from the map the user is seeing. The person repeatedly explains where they are looking, and an agent either guesses through UI controls or produces prose in a separate context.

### WebMCP improvement

Atlas exposes the map’s real client-side capabilities. The human and agent can now hand control back and forth:

1. A person clicks Eastvale.
2. The agent reads the exact selected county/place and existing session notes.
3. The agent opens another county or mapped place through a reliable tool.
4. The map visibly changes before the tool returns.
5. The agent attaches a research note to a real mapped place.
6. The person edits the workspace manually.
7. The agent reads the new state and continues from the human’s change.

That collaboration is the product. The WebMCP registration is only the mechanism.

---

## 5. Recommended WebMCP tool surface

Use **five core tools**. Add the sixth only after the first five work perfectly in both ChatGPT and Chrome.

| Tool | Purpose | Visible page effect | Annotations |
|---|---|---|---|
| `get_map_state` | Read the active level, county, selected place, visible places, notes, and current research trail | None | `readOnlyHint: true` |
| `search_places` | Search the bundled Atlas place/county index and return exact or ambiguous candidates | None | `readOnlyHint: true` |
| `open_place` | Open one U.S. state, county, or Census place on the visible map | Map navigates, focuses, and highlights target | `readOnlyHint: false` |
| `add_map_note` | Attach a short session-only research note to a mapped place | Note appears visibly beside/on the map | `readOnlyHint: false`, `untrustedContentHint: true` |
| `create_map_trail` | Create an editable ordered trail of two to five mapped places with a short research prompt at each stop | Trail rail appears; first stop opens and highlights | `readOnlyHint: false`, `untrustedContentHint: true` |

### Why no deletion tool in the first release

The current WebMCP annotations emphasize read-only and untrusted-content hints. Rather than expose a destructive action during a short hackathon, let the human delete or edit notes directly in the UI. This also demonstrates human control instead of pretending the agent owns the workspace.

### Tool contracts

#### `get_map_state`

Input:

```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

Output should stay under roughly 1,500 characters:

```json
{
  "level": "county",
  "state": "California",
  "county": "Riverside County",
  "selectedPlace": "Eastvale",
  "visiblePlaces": ["Eastvale", "Corona", "Norco"],
  "notes": [{"id":"note-1","place":"Eastvale","body":"Check commuter growth."}],
  "trail": null
}
```

#### `search_places`

Input:

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "A U.S. state, county, city, town, or Census place name."
    }
  },
  "required": ["query"],
  "additionalProperties": false
}
```

Return exact matches or a concise candidate list. Never guess when a name is ambiguous.

#### `open_place`

Input:

```json
{
  "type": "object",
  "properties": {
    "place": {
      "type": "string",
      "description": "The U.S. state, county, city, town, or Census place to open."
    },
    "level": {
      "type": "string",
      "enum": ["auto", "nation", "state", "county", "place"],
      "description": "Preferred map level; auto resolves the best supported level."
    }
  },
  "required": ["place"],
  "additionalProperties": false
}
```

The handler must resolve, update the visible UI, wait for the state/render transition, and only then return success.

#### `add_map_note`

Input:

```json
{
  "type": "object",
  "properties": {
    "place": {
      "type": "string",
      "description": "A mapped place in the current Atlas workspace."
    },
    "body": {
      "type": "string",
      "description": "A session-only research note, maximum 240 characters."
    }
  },
  "required": ["place", "body"],
  "additionalProperties": false
}
```

The code must enforce the 240-character limit, reject unknown places, and show the new note before returning.

#### `create_map_trail`

Input:

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "A short title for the map investigation."
    },
    "stops": {
      "type": "array",
      "minItems": 2,
      "maxItems": 5,
      "items": {
        "type": "object",
        "properties": {
          "place": {"type": "string"},
          "prompt": {"type": "string"}
        },
        "required": ["place", "prompt"],
        "additionalProperties": false
      }
    }
  },
  "required": ["title", "stops"],
  "additionalProperties": false
}
```

Resolve every stop before mutating state. If any stop is ambiguous or unknown, return candidates and make no partial trail.

---

## 6. Implementation architecture

### Core rule

**The human UI and WebMCP tools must call the same command/controller functions.** Do not duplicate behavior inside tool callbacks.

Create an `AtlasMapController` with methods similar to:

```ts
export interface AtlasMapController {
  getSnapshot(): AtlasMapSnapshot;
  searchPlaces(query: string): Promise<PlaceSearchResult>;
  openPlace(input: OpenPlaceInput): Promise<OpenPlaceResult>;
  addMapNote(input: AddMapNoteInput): Promise<MapNote>;
  createMapTrail(input: CreateMapTrailInput): Promise<MapTrail>;
}
```

The existing React handlers for county switching, place selection, stickers, and notes should call this controller. WebMCP tool callbacks should call it too.

### React lifecycle pattern

Use feature detection, current-state refs, and an `AbortController` so the tools register once and cleanly unregister.

```ts
useEffect(() => {
  const modelContext = document.modelContext;
  if (!modelContext?.registerTool) return;

  const registration = new AbortController();

  void Promise.all(
    createAtlasWebMcpTools(controllerRef).map((tool) =>
      modelContext.registerTool(tool, { signal: registration.signal }),
    ),
  ).then(() => activity.setAvailable(true));

  return () => registration.abort();
}, []);
```

Do not let `execute` closures capture stale React state. Read the current state through a ref or controller snapshot at invocation time.

### Page and hosting requirements

- Serve the challenge app as a **top-level, same-origin page**, preferably `/explore` or the root path.
- Do not make the judge open the old Apps SDK iframe preview.
- Do not set `document.domain` or emit `Origin-Agent-Cluster: ?0`.
- Do not apply a restrictive Permissions Policy that disables the `tools` feature.
- Keep HTTPS enabled.
- Feature-detect WebMCP and render a calm fallback message in ordinary browsers.
- Keep the site fully usable without WebMCP.

### Visible agent activity

Add a small unobtrusive rail or footer containing:

- `Site tools: available` or `Site tools: not detected in this browser`.
- The last tool name.
- A plain-English action summary.
- A timestamp or sequence number.
- A subtle map pulse/highlight on the affected place.

The activity record is not decoration. It gives judges direct proof that tool calls affected the same visible page state.

### Suggested files

```text
web/src/controller/atlasMapController.ts
web/src/webmcp/atlasWebMcpTools.ts
web/src/webmcp/useAtlasWebMcp.ts
web/src/webmcp/webmcp.d.ts
web/src/components/AgentActivityRail.tsx
web/src/components/MapTrailRail.tsx
web/src/state/mapTrail.ts
scripts/verify-webmcp.mjs
docs/WEBMCP_CHALLENGE.md
docs/WEBMCP_TOOL_CONTRACTS.md
docs/WEBMCP_EVALS.md
CHALLENGE_DELTA.md
VIDEO_SCRIPT.md
SUBMISSION.md
LICENSE
```

---

## 7. Reliability, security, and evals

### Code-level requirements

- Validate all inputs in code, not only in JSON Schema.
- Cap queries, titles, prompts, and note bodies.
- Reject URLs or instruction-like markup in notes if it adds unnecessary prompt-injection risk.
- Mark note/trail outputs with `untrustedContentHint: true`.
- Return concise, factual results.
- Never return raw internal scene payloads or huge geometry arrays.
- Never expose OAuth tokens, provider payloads, environment variables, or hidden moderation data.
- Pass an execution `AbortSignal` to any fetch or long-running operation.
- Update the UI before resolving the tool result.
- Resolve ambiguous names to candidates instead of choosing silently.
- Make repeated calls deterministic and idempotent where practical.

### Automated verifier

Create `pnpm verify:webmcp` that installs a mock `document.modelContext` and checks:

1. Exactly the expected tools register.
2. Names and parameter names stay within recommended character budgets.
3. Descriptions and outputs stay within recommended output budgets.
4. Schemas are valid objects with `additionalProperties: false` where appropriate.
5. Read-only annotations match behavior.
6. UGC-returning tools set `untrustedContentHint`.
7. Abort cleanly unregisters all tools.
8. `open_place` visibly changes the map state.
9. `add_map_note` visibly adds a note and rejects invalid input.
10. `create_map_trail` is atomic when a stop cannot be resolved.
11. Normal browsers without `document.modelContext` still render and work.
12. Old MCP-only tools are not presented as the WebMCP challenge surface.

### Manual eval prompts

Run each prompt in ChatGPT desktop and the Chrome Model Context Tool Inspector:

1. “What map am I looking at right now?”
2. “Open Riverside County, California.”
3. “Show me Springfield.” — must return ambiguity instead of guessing.
4. “Open Miami-Dade County, focus Miami Beach, and leave a note to verify coastal flooding sources.”
5. “Read the change I just made to the map and continue from it.”
6. “Build a three-stop research trail through Eastvale, Norco, and Corona.”
7. “Add a 500-character note.” — must fail gracefully.
8. Repeat the same open/note call — no duplicated or corrupted state.
9. Cancel a tool while it is resolving — no late state mutation.
10. Use the app in a browser without WebMCP — normal map controls still work.

---

## 8. Public repository strategy

### Recommended route

Because the current repository is large and carries a long history of experiments, the safest judge-friendly route is a **sanitized public challenge edition** containing the full source needed to run the submitted app, while explicitly documenting the pre-existing Atlas baseline.

Do not pretend a fresh repo means the whole project was created during the challenge. Be unusually transparent.

Add `CHALLENGE_DELTA.md`:

```md
# Challenge work statement

Atlas existed before August 25, 2026 as an Apps SDK/MCP county-map project.
The WebMCP Challenge submission evaluates only the browser-native extension
implemented from August 25 through September 3, 2026.

## Pre-existing baseline
- Nationwide Census map engine
- Place and county resolver
- React renderer and manual map controls
- Existing Apps SDK/MCP integration

## Added during the challenge
- Top-level public web experience
- `document.modelContext.registerTool` integration
- Shared Atlas map controller used by humans and agents
- Map-state reading, place opening, map notes, and research trails
- Visible site-tool activity record
- WebMCP security annotations, lifecycle cleanup, and eval suite
- Public challenge documentation and demo
```

### Release checks before making anything public

- Search the entire Git history and current tree for secrets.
- Inspect `.env*`, deployment files, prompts, screenshots, logs, and artifacts.
- Confirm every included asset can be redistributed under the chosen license.
- Remove generated binaries, old checkpoints, giant diagnostic dumps, and private prompt packs.
- Confirm the repo can be cloned and built from scratch.
- Open the repo in an incognito window.
- Verify the license appears in GitHub’s About panel.

### Suggested challenge commit sequence

1. `challenge: add public Atlas explore route and challenge boundary`
2. `challenge: centralize human and agent map commands`
3. `challenge: register core browser-native WebMCP tools`
4. `challenge: add visible agent activity and session map notes`
5. `challenge: add editable multi-place research trail`
6. `challenge: add WebMCP security checks and eval suite`
7. `challenge: publish challenge delta, README, submission, and video script`
8. `release: freeze WebMCP Challenge submission`

Tag the final commit, for example `webmcp-submission-v1`, and record its SHA in Devpost testing instructions.

---

## 9. Five-day execution schedule

### Saturday, August 29

- Freeze the challenge scope to the shared map workspace.
- Create the challenge branch from current `main`.
- Decide public-repo strategy and run a secret/license inventory.
- Deploy a clean no-login `/explore` page.
- Prove the ordinary map loads from a fresh browser.
- Write `CHALLENGE_DELTA.md` before coding so the boundary stays honest.

**Exit gate:** live HTTPS page works, no Auth0, one product story.

### Sunday, August 30

- Extract/refactor the shared `AtlasMapController`.
- Implement `get_map_state`, `search_places`, and `open_place`.
- Register via `document.modelContext.registerTool` with abort lifecycle.
- Add feature detection and basic activity status.

**Exit gate:** ChatGPT or the Chrome inspector can open a county and the visible map changes.

### Monday, August 31

- Implement `add_map_note`.
- Add the session note UI and untrusted-content annotation.
- Implement `create_map_trail` and its editable visual rail.
- Complete the human-to-agent-to-human handoff flow.

**Exit gate:** the full flagship demo works end to end without narration or setup tricks.

### Tuesday, September 1

- Add automated WebMCP verification and manual eval fixtures.
- Test ambiguity, invalid input, repeat calls, cancellation, and fallback behavior.
- Test desktop and mobile layout.
- Finish public README and challenge-delta documentation.
- Claim any still-available sponsor credits before their separate cutoff.

**Exit gate:** all build, typecheck, test, and WebMCP verification commands are green.

### Wednesday, September 2

- Run acceptance tests in the latest ChatGPT desktop app and Chrome 149+.
- Record the demo in short clips.
- Edit to 2:30–2:50 with audio and no dead time.
- Upload public YouTube video.
- Complete the Devpost writeup and testing instructions.
- Ask one person unfamiliar with Atlas to test the live link and README.

**Exit gate:** every submission field is complete and every public link works incognito.

### Thursday, September 3

- Final smoke test early in the morning.
- Submit well before 1:00 PM Pacific; target 10:00 AM.
- Record the submitted URLs and commit SHA.
- Freeze the submitted repo, video, and live site after the deadline until judging ends.

---

## 10. Demo video storyboard

Target length: **2 minutes 40 seconds**.

### 0:00–0:12 — show the product immediately

Open Atlas on the national map. The address-bar site-tools indicator is visible.

Narration:

> “Atlas is a shared U.S. county map. I can explore it visually, and my agent can act on this same live page through WebMCP instead of guessing through map controls.”

### 0:12–0:32 — human establishes context

Manually open Riverside County and click Eastvale. Add a short human note.

> “I’ll start the investigation myself and leave one note at Eastvale.”

### 0:32–1:10 — agent reads and changes the same page

Prompt:

> “Read the current Atlas state. Then open Miami-Dade County, focus Miami Beach, and add a note: verify coastal flooding sources.”

Show the actual tool calls and visible map transition. The note appears on the page.

### 1:10–1:40 — hand control back to the human

Manually change a note or select a nearby place.

Prompt:

> “Read what I changed and continue from my current map state.”

Show `get_map_state` reading the human’s change and the agent adding the next note.

### 1:40–2:12 — creation workflow

Prompt:

> “Create a three-stop research trail comparing Eastvale, Norco, and Corona, with one question to investigate at each stop.”

Show the editable trail rail appear and the first location open.

### 2:12–2:34 — prove WebMCP depth

Briefly show the registered tool list and activity record.

> “These are page-native tools registered with `document.modelContext`. The human controls and the agent tools call the same map controller, and every write is visible and reversible in the interface.”

### 2:34–2:44 — close

> “Atlas turns a map from something an agent looks at into a place where people and agents investigate together.”

No signup, installation, architecture monologue, loading screen, or old Atlas feature tour.

---

## 11. Devpost description draft

Edit this in Mazen’s own voice before submitting and remove any claim that is not demonstrably live.

### Inspiration

Maps are excellent for spatial thinking, but they are poor collaboration surfaces for an AI agent. Chat answers have the opposite problem: they can explain geography, but they are detached from the map a person is actively exploring. We wanted the person and agent to work on the same visible geographic state instead of repeatedly translating between a map and a conversation.

### What it does

Atlas is a shared visual workspace for exploring U.S. counties. A person can navigate the map, select towns, and leave session-only research notes. Through WebMCP, an agent can read the current map state, search Atlas’s place index, open a state/county/place, attach a note to mapped geography, and create an editable multi-place research trail. Every tool call changes the page the person is already looking at.

### Why WebMCP fits

Atlas’s useful capabilities live in the browser: the active county, selected place, camera focus, annotations, and current research trail. A remote MCP server can answer geographic queries, but it does not automatically share this live visual context. WebMCP lets Atlas expose those page-native actions directly so humans and agents can hand control back and forth without the agent guessing through the interface.

### Human-agent collaboration

A person can begin an investigation by clicking a place and writing a note. The agent can read that exact state, navigate to the next county, and add a visible note. The person can then change the selection or edit the workspace manually, and the agent can continue from the new state. The result is a single shared map rather than two disconnected experiences.

### How it was built

The challenge extension registers a focused set of tools through `document.modelContext.registerTool`. The WebMCP callbacks and human controls use the same TypeScript map controller, so agent calls trigger the same validated state transitions as direct UI actions. The implementation includes lifecycle cleanup with `AbortController`, strict input validation, ambiguity handling, concise outputs, untrusted-content annotations for notes, a visible activity record, normal-browser fallback behavior, and an automated WebMCP verification suite.

### Existing project disclosure

Atlas existed before the challenge as a Census-grounded map engine and Apps SDK/MCP integration. During the WebMCP Challenge period, we added the top-level web experience, browser-native tool layer, shared human-agent controller, map notes and research-trail collaboration, visible activity, security handling, evals, public documentation, and challenge deployment. The repository’s `CHALLENGE_DELTA.md` identifies the exact baseline and challenge-period commits.

---

## 12. README front page structure

A judge should understand and run the project without opening old product documents.

1. One-sentence product claim.
2. Animated GIF or still image of agent opening and annotating a county.
3. Live URL.
4. “Try these prompts” with three tested prompts.
5. WebMCP tool table.
6. Human-agent handoff explanation.
7. Exact challenge work statement.
8. Local setup: install, dev, build, verify.
9. Browser testing instructions.
10. Architecture diagram.
11. Security and data boundaries.
12. License.
13. Final submitted commit SHA.

Move historical engineering diaries and abandoned feature docs out of the judge path.

---

## 13. Final acceptance checklist

### Eligibility and repo

- [ ] Registered for The WebMCP Challenge.
- [ ] Correct Devpost project is attached to this hackathon.
- [ ] Repository is public in an incognito window.
- [ ] Open-source license exists and is detected by GitHub.
- [ ] Default branch contains the final challenge build.
- [ ] Challenge-period commits are dated after August 25.
- [ ] `CHALLENGE_DELTA.md` clearly separates prior work from new WebMCP work.
- [ ] No secret, credential, private prompt, or unlicensed asset is exposed.

### Product

- [ ] Live URL opens without authentication.
- [ ] Main experience appears immediately.
- [ ] No stale Scout Drop, Hosted Clawd, billing, or Commons copy appears.
- [ ] Normal map controls work without an agent.
- [ ] Site tools register in ChatGPT desktop.
- [ ] Site tools register in Chrome 149+ with WebMCP enabled.
- [ ] Tool calls visibly update the page before returning.
- [ ] Ambiguous names never silently resolve.
- [ ] Notes are explicitly session-only.

### Engineering

- [ ] `pnpm install` works from a clean clone.
- [ ] Typecheck, build, tests, and `verify:webmcp` pass.
- [ ] Tool registration cleans up on unmount/navigation.
- [ ] Network work respects cancellation.
- [ ] Tool outputs stay concise.
- [ ] UGC outputs are marked untrusted.
- [ ] Unsupported browsers receive a graceful fallback.

### Submission

- [ ] Public YouTube video is under three minutes and has narration.
- [ ] Product works in the first 10–15 seconds of the video.
- [ ] Description explains why WebMCP is necessary, not merely present.
- [ ] Testing instructions include exact prompts and submitted commit SHA.
- [ ] Live URL, repo URL, and video URL all work incognito.
- [ ] Submission is not left as a draft.
- [ ] Repo and live site are frozen after the deadline.

---

## Final direction

Atlas should not try to win by being the biggest app. It should win by making one idea undeniable:

> **A map is more useful when the human and agent can see, change, and continue from the same geographic workspace.**

The existing voxel/Census engine supplies the ambition. The challenge work must supply the shared page state, clean WebMCP implementation, visible collaboration, and ruthless product coherence.

