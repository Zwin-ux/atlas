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
