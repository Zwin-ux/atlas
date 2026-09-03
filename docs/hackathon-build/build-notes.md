# Atlas Hackathon Build Notes

## 2026-08-31 — Guided build onboarding

- The participant explicitly redirected onboarding to inspect the current Atlas project before planning: “look at the current atlas project.” This is an active-shaping decision and prevents blank-slate ideation from erasing verified work.
- Inspected the current branch, README, package scripts, challenge delta, repository status, and desktop/mobile national-trail proof.
- Verified product baseline from repository evidence: no-login nationwide map, exactly five imperative WebMCP tools, one shared controller for human and agent actions, visible notes and atomic trails, ambiguity-safe failures, normal-browser fallback, and focused deterministic/Chrome acceptance infrastructure.
- The current product hypothesis is already concrete: Atlas helps students, local journalists, civic researchers, and community organizers investigate unfamiliar U.S. counties through a shared human-agent geographic workspace.
- Onboarding round 1 remains open only for participant background and confirmation of how they personally frame the existing Atlas idea. No product code or public service was changed.

### Participant confirmation and full branch audit

- The participant confirmed the sentence: “Atlas lets people and ChatGPT investigate U.S. counties together on one shared, visible map.”
- The participant then redirected the interview again: “look at all the branches.” All 25 local branches, 21 remote refs, and eight registered worktrees were inspected read-only without checkout, merge, reset, or mutation.
- Sixteen local branches are already merged into `main`. These contain the historical alpha, Fable, voxel, Hosted Clawd, national-world, and core-quality work that predates the challenge baseline.
- Eight non-challenge local branches remain outside `webmcp-challenge`:
  - `backup/0.75r-stage2-wip` contains only a handoff change and two clay-board references.
  - `codex/e6-apps-sdk-readiness`, `codex/f2-clean-product-code-rc`, `codex/g3-world-identity-hardening`, `codex/g4-reference-asset-intake`, and `codex/g5-road-lot-terrain-contact` are July checkpoint branches centered on legacy Apps SDK context, Hosted Clawd, voxel assets, national-world services, road/lot/terrain work, and large historical planning packets.
  - `release/atlas-v0.2.0` contains the earlier map-only Apps SDK release, server-owned session state, iframe/RPC bridge, and Railway promotion machinery.
  - `wip/cityworld-refactor-2026-07` adds one parked CityWorld renderer/style refactor on top of that older release line.
- The old checkpoint `web/src/modelContext.ts` only formats selected voxel-place context. The old release `AtlasSessionState` and `rpcBridge` implement a separate server/iframe synchronization path. They are not the browser-native top-level WebMCP/shared-controller product built on the current challenge branch.
- `webmcp-challenge` is the only branch containing the 51-commit challenge delta: top-level no-login route, current imperative registration, exact-five tools, shared controller, visible notes/trails, evals, accessibility, sanitized release, and current judge evidence.
- Branch decision: do not merge or cherry-pick any historical branch into the challenge candidate. Their useful product lessons are already represented in the current map-first direction; their code would reintroduce retired scope, stale protocol paths, or pre-challenge work that complicates the judging story.
- One local/remote mismatch exists: local `fable/0.51e-voxel-art` is one commit ahead of its remote, but the local branch is already contained in `main`; it has no challenge release impact.

### Onboarding sharpening answers

- Technical experience: “high.” Specific languages, frameworks, and prior AI agents were not enumerated, so downstream guidance should stay compact and tradeoff-oriented rather than inventing a tool history.
- Audience: “Regular people that just wanna explore with the ChatGPT.” This actively broadens the positioning from specialist civic research to approachable geographic curiosity. Students, journalists, and organizers remain credible examples, not the product boundary.
- Opening beat: the participant accepted the recommended three-county trail but expressed no attachment to that exact storytelling choice (“Sure whatever idc”). Treat the trail as a replaceable presentation tactic, not product identity.
- Quality bar: “High quality map/atlas.” The submission must feel cartographically intentional before it reads as an agent demo. Avoid generic hackathon chrome, developer-tool framing, or UI that competes with the map.
- Mandatory sharpening rounds complete. One optional visual/vibe round remains before the learner profile is finalized and Scope begins.

### Optional visual and vibe round

- Desired identity: “Field atlas.”
- Material direction: “Warm paper ink,” with a request to flesh the direction out using Higgsfield.
- Interaction priority: drawing, opening, zooming, and noting should all feel satisfying; no single action may carry the experience while the others feel unfinished.
- Cartographic character: “hand written.” Product translation: handwriting belongs in display/cartographic accents and authored note character, while controls and body copy remain readable and accessible.
- Explicit anti-reference: “Slop generic dark aesthetic that you default to.” Dark AI-dashboard styling, glow, floating panels, and generic SaaS visual defaults are prohibited.
- Higgsfield capabilities are available in the current environment, but no generation job or credit-spending action was started during onboarding. A later scoped visual-development task should define the exact artifact, model, reference image, cost, and acceptance bar first.
- Onboarding is complete. The learner profile now contains confirmed audience, technical calibration, branch decisions, map-first quality bar, and visual direction. Next step: Scope.

## 2026-08-31 — Guided build scope

### Mandatory beat 1: brain dump

- Core ambition: “a good atlas for ChatGPT.” The participant sees current embedded-map experiences as too weak for direct geographic requests.
- Product analogy: some of the immediacy and route legibility of Waze or Google Maps, combined with a notebook feeling that accumulates context while a person travels or explores.
- Geographic boundary: focus on the United States.
- Experience bar: animation and the ChatGPT-facing map surface must actually work, not merely appear in a submission mockup.
- Higgsfield boundary: use it for authored assets and animation studies that make the submission visually memorable; do not use generated content as geographic truth or as a substitute for working interaction.
- Pride condition: the result must be an actually high-quality atlas.
- Scope ambiguity surfaced: “direct directions” may mean connecting chosen research/travel stops on the national map, or true street-by-street turn guidance. The current candidate proves the former and does not contain a verified road-routing stack for the latter.
- Surface ambiguity surfaced: “widget” may mean the top-level Atlas page running inside ChatGPT's in-app browser or the fenced legacy iframe preview. The challenge architecture intentionally uses the top-level page for WebMCP registration and shared visible state.

### Mandatory beats 2-3: reference reaction and time budget

- Reference reaction: borrow the clarity and simplicity of mainstream maps, but make lookup feel native to how people already talk with ChatGPT rather than recreating a dense navigation product.
- Directions resolved: the participant does not require street-by-street routing. When a conversation describes or discusses a U.S. location, ChatGPT should bring up that place in Atlas, preserve the visible geographic context, and let the person leave notes.
- Existing implementation fit: `search_places`, `open_place`, and `add_map_note` already cover the core conversational geography loop; `create_map_trail` turns multiple discussed places into an ordered visual journey.
- Surface preference: the participant wants both the iframe preview and top-level ChatGPT experience to feel excellent, while explicitly reaffirming that winning the WebMCP challenge remains the priority.
- Technical constraint: WebMCP tools must remain registered at the top-level page. The iframe preview is a secondary visual surface and cannot replace top-level ChatGPT/WebMCP proof.
- Time budget: three days until the deadline, with self-reported distraction risk. Scope must minimize parallel tracks and use explicit completion blocks.

### Mandatory beats 4-5: sharpen and cut

- Participant accepted the focused cut with “ok lets do it.”
- Natural-language trigger: Atlas should open for clear geographic intent such as show, explore, compare, or note; it should not intrusively react to every casual place mention.
- State boundary: session-only notes and trails are sufficient for the challenge and keep the shared-map promise honest.
- Surface priority: the top-level Atlas page inside ChatGPT's browser is the winner surface because that is where the exact five WebMCP tools register and where shared visible state is proven. The fenced iframe preview receives additional polish only after the primary release, test, video, and submission gates are green.
- Explicitly cut from the three-day scope: street-by-street navigation, a sixth WebMCP tool, accounts or persistence, voxel/CityWorld branch work, a full iframe rewrite, and more than one bounded Higgsfield visual study before primary release gates pass.
- Three-block execution ruler: first one high-value visual/interaction slice; second real ChatGPT and video proof; third public-release and Devpost packaging under existing owner gates.
- Mandatory scope beats are complete. Deepening-round decision is pending before `scope.md` is written.

### Scope document decision

- The participant chose “write” instead of another deepening round.
- Deepening rounds taken: 0.
- Created `docs/hackathon-build/scope.md` from the confirmed brain dump, reference reaction, three-day time budget, resolved ambiguities, and accepted cut list.
- Scope keeps the existing Atlas implementation intact and defines the remaining winner slice as field-atlas quality, natural ChatGPT place opening, shared session notes/trails, one bounded Higgsfield study, real ChatGPT/video proof, and owner-gated release packaging.
- The scope explicitly protects the top-level WebMCP surface while retaining only a functional secondary iframe preview; it does not authorize product code, generation spend, publication, or submission.

## 2026-08-31 — Guided build PRD

### Mandatory beat 1: precise visible behavior

- The participant approved all four proposed behaviors with “sure yeah.”
- First open: show the full United States immediately, keep the map dominant, provide one simple place finder, and avoid tutorials, empty dashboards, or unnecessary panels.
- Single-place request: a clear ChatGPT request visibly opens the resolved county and updates breadcrumb/status and completion feedback.
- Multi-place request: return to the national view, draw one numbered route in requested order, and show matching editable notebook entries.
- Place note: keep each note visibly attached to its place, allow manual edit/removal, and identify it as session-only.
- These behaviors remain user-facing requirements; implementation choices are deferred to build-spec.

### Mandatory beats 2-3: user stories and acceptance criteria

- The participant approved the proposed stories and criteria without changes.
- **Open the atlas:** a curious person sees the United States immediately, with a dominant map, available finder, and no blocking empty panel.
- **Explore with ChatGPT:** an explicit geographic request visibly opens the intended place, updates location/status, and leaves the person able to continue manually.
- **Build a journey:** requested places appear as one ordered route whose markers, line, and notebook entries agree; either representation opens the same stop.
- **Keep field notes:** notes stay visibly place-bound, manually editable/removable, and marked session-only.
- **Trust the atlas:** ambiguous input returns candidates without mutation; unknown places and incomplete trails preserve the previous visible state.
- Cross-story feel requirement: warm paper and ink, legible handwritten accents, restrained motion, and a map-dominant desktop/mobile composition.

### Mandatory beats 4-5: edge cases and time-budget guard

- The participant approved all recommended edge-case behaviors.
- Ambiguous combined action: a request such as “Open Springfield and add this note” shows candidates and adds nothing until one place is deliberately chosen.
- Broken trail: if any requested stop cannot resolve, no partial route appears and the previous map/trail remains intact.
- Human correction: when the person edits or removes a stop or note, ChatGPT's next state read reflects the newest visible version rather than an earlier conversational assumption.
- Refresh and overlapping actions: refresh intentionally clears session notes/trails; when actions overlap, only the newest visibly completed action remains.
- Explicit later list: saved notebooks, richer iframe treatment, route services, broader geography, and additional authored asset studies. These are not required for the three-day submission.
- Mandatory PRD beats are complete. The optional deepening-round decision is pending before `prd.md` is written.

### PRD document decision

- The participant chose “writ” instead of another deepening round.
- Deepening rounds taken: 0.
- Created `docs/hackathon-build/prd.md`, expanding the fixed scope into product goals, experience principles, a complete user journey, seven behavior epics, screen-observable criteria, edge cases, priority tiers, explicit later items, non-goals, and submission proof points.
- The PRD is intentionally user-facing. Technical architecture and code decisions remain deferred to build-spec.
- No product code, Higgsfield job, release action, repository visibility change, or Devpost submission was authorized or performed.

## 2026-09-02 — Repository-grounded technical spec

### Mandatory beats 1-2: stack and deployment

- The existing implementation was treated as the baseline rather than a blank-slate stack choice. Source inspection confirmed React 18, TypeScript 5.9, Node 22.12+, pnpm 11.7, a native SVG renderer, one in-memory `AtlasMapController`, deterministic Census-derived data, and an isolated Railway challenge service.
- Recommended the boring reliable choice: no framework migration, renderer swap, state library, database, local persistence, remote MCP mutation server, or new runtime dependency.
- Deployment remains the current public Railway judge route through the sanitized challenge projection. Repository publication, deployment changes, video publication, and Devpost submission remain separate owner gates.
- Higgsfield remains optional and bounded to one pre-budgeted static visual study with no runtime dependency or geographic authority.

### Mandatory beats 3-5: architecture, file structure, and data flow

- Current version-specific WebMCP behavior is already pinned in `docs/webmcp/OFFICIAL_COMPATIBILITY.md`, including the reviewed upstream commit, ChatGPT top-level discovery boundary, annotations, abort lifecycle, and acceptance limits. No new dependency or speculative API research was needed.
- Mapped all seven PRD epics onto the current route shell, shared controller, top-level registry/tool adapter, Census resolver and plate API, SVG geometry/overlay, finder/notebook/activity interface, and layered proof/release tooling.
- Defined the challenge-relevant file tree with purpose annotations and explicitly fenced historical Atlas systems and generated `release/webmcp` files away from manual edits.
- Walked the complete trail lifecycle: tool selection, schema bounds, all-stop resolution, pre-commit failure, one workspace revision, React plate load, projected county centers, base route and numbered marker render, expected-marker validation, visible-revision acknowledgment, compact tool success, and human marker/rail handoff back into the same controller.
- Documented exact public HTTP endpoints, browser-owned session data, structured versus operational failure language, cancellation and supersession behavior, accessibility/privacy boundaries, deterministic/model/ChatGPT proof separation, and release drift controls.

### Architecture approval and document decision

- The participant approved every proposed technical decision with “approva all” and asked for an effective high-intensity execution workflow to finish the work.
- That answer also selected writing the document now rather than adding another interview round. Deepening rounds taken: 0.
- Created `docs/hackathon-build/spec.md`. It distinguishes verified implementation from the remaining bounded work, preserves the exact-five and shared-visible-state invariants, and gives `build-checklist` an explicit dependency-ordered handoff.
- No product code, runtime dependency, generated asset, model credential, deployment, repository visibility, video publication, or Devpost submission changed during this planning stage.
