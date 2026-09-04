# Atlas WebMCP Submission Draft

This copy is ready for owner review. Replace the remaining `[OWNER REQUIRED]` fields only with verified public evidence. Do not submit before the release checklist is green.

Live Devpost preflight at `2026-09-04T00:53Z` reports `submissions_open`. The September 3 announcement extends the deadline by twelve hours to **September 4, 2026 at 1:00 AM Pacific** because of an OpenAI outage. Re-check the live phase immediately before submitting; once the extended deadline passes, do not change the submitted repo, video, or live site during judging.

## Listing fields

- Project name: **Atlas**
- Tagline: **Explore a county with a person and an agent on the same live map.**
- Live app URL: [https://atlas-webmcp-production.up.railway.app/explore](https://atlas-webmcp-production.up.railway.app/explore)
- Public source URL: `[OWNER REQUIRED: make https://github.com/Zwin-ux/atlas-webmcp-challenge public and verify it logged out]`
- Open-source license: **Apache-2.0**
- Demo video: `[OWNER REQUIRED: public YouTube URL, under three minutes, with audio]`

## Required form answers

| Devpost field | Prepared answer |
| --- | --- |
| Submitter Type | `[OWNER REQUIRED: Individual, Team of Individuals, or Organization]` |
| Country of residence | `[OWNER REQUIRED]` |
| App Status | **Existing** |
| Existing-project update | Atlas already had the Census-backed U.S. map. During the submission period we added the no-login top-level WebMCP route, exact-five browser-native tools, one shared human/agent controller, visible completion acknowledgments, ambiguity-safe search/open behavior, session notes, atomic editable trails, accessibility and mobile hardening, evals, and a sanitized challenge repository. |
| Live URL | `https://atlas-webmcp-production.up.railway.app/explore` |
| Testing instructions | No login. Open the live URL in ChatGPT's in-app browser or Chrome 149+ with WebMCP enabled. Ask: “Create a civic research trail through Riverside County, California; Miami-Dade County, Florida; and Travis County, Texas.” Select stop two by hand, then ask: “What place is open now?” ChatGPT should read Miami-Dade County from the same visible session. Search for Springfield to see candidate-first ambiguity recovery without changing the map. |
| Public code repo | `[OWNER REQUIRED: public URL after logged-out verification]` |
| Tested clients | Chrome 152 with WebMCP enabled; Codex in-app browser Site Tools; ordinary Chrome fallback. Authenticated ChatGPT conversation acceptance is still pending and must be added only after capture. |
| AI tools used | OpenAI Codex for repository inspection, implementation, tests, browser/release automation, reviews, and submission drafting; Product Design and Figma workflows for HCI and visual review; Devpost Hackathons plugin for official requirements and deadline checks. Atlas itself makes no runtime model API call. |
| Learning derived | `[OWNER REQUIRED: None, Moderate, or Significant]` |
| Career AI value | `[OWNER REQUIRED: Yes or No]` |

## Short description

Atlas is a no-login U.S. county map that a person and an agent can use together. A person pans, zooms, drills into counties, and finds places normally. In a supported browser, an agent discovers five browser-native tools that read the live map, search Census-backed places, open a place, add a session note, or create a numbered national research trail.

Both sides operate on the same controller and the same visible session. The point is turn-taking on one map—not a chatbot beside a map. Atlas does not maintain a hidden agent copy of the map.

## Inspiration

Research about an unfamiliar county usually breaks across map tabs, notes, and a chat window. The person sees geography while the agent sees text. Atlas makes the map the shared surface: both can inspect the same county, leave the same bounded research artifacts, and recover from ambiguous place names without guessing.

The target users are students, local journalists, civic researchers, and community organizers starting an investigation in an unfamiliar U.S. county.

## What it does

Atlas opens directly to a full-screen national county map. The normal interface supports pan, zoom, county drill-in, breadcrumbs, and a keyboard/touch place finder.

The top-level page imperatively registers exactly five WebMCP tools:

1. `get_map_state`
2. `search_places`
3. `open_place`
4. `add_map_note`
5. `create_map_trail`

The two read tools return bounded public projections. The three write tools update visible session state and wait for the matching map revision to render before returning success. Ambiguous locations return candidates. A trail resolves every stop before one atomic mutation, then shows its numbered county route on the national map; a bad stop never leaves a partial trail.

In ChatGPT's Site Tools menu, the same five tools use plain human-readable titles and descriptions that say when each action fits. Successful writes return the visible map effect. Ambiguous or failed writes return an explicit unchanged-state signal and bounded recovery context, including which trail stop needs clarification.

## How it was built

- TypeScript server and React map shell.
- Existing Census-backed national, state, county, and place data.
- Imperative top-level `document.modelContext.registerTool` registration with feature detection.
- One `AtlasMapController` external store for human navigation and agent actions.
- Narrow JSON Schemas with `additionalProperties: false` at root and nested levels.
- One shared abort lifecycle for all-or-none tool registration.
- Session-only React state for notes, trails, activity, and edits.
- Focused Node tests, a static `pnpm verify:webmcp` contract verifier, and official `webmcp-evals@0.0.4` suites generated from the live descriptors.

## Meaningful challenge-period extension

Atlas predates the challenge. Judges should evaluate the work after baseline `b6f2f8213a9acef3629a2c5f9f84cebab32fea56`:

- no-login top-level `/` and `/explore` routes;
- shared human/agent controller and visible-revision acknowledgment;
- the exact five browser-native tools;
- Census-backed bounded search and ambiguity-safe resolution;
- visible site-tool activity;
- editable session notes and atomic editable research trails;
- exact-five, cancellation, rollback, output-bound, and fallback verification;
- deterministic Chrome WebMCP execution of all five tools plus credentialed static/live model-eval commands;
- natural-language tool-selection and follow-up trajectories for ChatGPT, including manual-map-state reads and ambiguity recovery;
- keyboard place finding, responsive proof, accessibility audit, and design review.

The detailed evidence ledger is in `CHALLENGE_DELTA.md` and `WEBMCP_STATE.md`.

## Hard parts

The hard part was not registering five functions. It was making them truthful.

Atlas had to prevent stale React state, keep manual and agent behavior on one transition path, avoid giant geometry payloads, preserve ambiguous Census place names, roll back partial registration, resolve a whole trail before mutation, and wait until a write was actually visible before claiming success.

## What we learned

Browser-native tools work best when they expose a small, legible projection of an existing interface. The agent does not need raw geometry. It needs the current location, a bounded place index, and a few clear actions whose effects the person can see.

The normal-browser fallback also matters. A WebMCP experiment should still be a good website when the experimental API is absent.

## What comes next

Before submission:

- capture and validate all five tools in a real authenticated ChatGPT conversation;
- replace the reserved ChatGPT shots in the local proof cut, review the audio, and upload the under-three-minute final to YouTube;
- approve public visibility for the already-audited sanitized repository and verify its README/license logged out;
- keep the already-public Railway deployment unchanged unless a separately approved candidate update is required;
- run the public URL and clean-source checks against the exact submitted artifacts;
- fill the owner-only form answers above and submit before the live extended deadline.

No account system, public posting, or sixth tool is part of this candidate.

## Evidence map

| Claim | Evidence |
|---|---|
| No-login top-level map | Route verifier and desktop/mobile screenshots in `artifacts/webmcp-release-proof/39d1e141-20260902/` |
| Exactly five tools | `pnpm verify:webmcp`, registry tests, generated eval schema, and Chrome 152 discovery |
| Shared human/agent state | `AtlasMapController`, place-finder verifier check, controller tests, and keyboard-marker/browser-agent smoke |
| Visible completion | revision acknowledgment tests, browser map transitions, and completed national-overlay smoke transcript |
| Ambiguity safety | Springfield API/controller/browser proof plus unchanged-state WebMCP smoke assertion |
| Atomic trails | success/failure controller tests plus unresolved-stop unchanged-state browser assertion |
| Agent understanding | 12-case natural-language model suite with three-run/90% threshold; execution is credential-gated and must not be claimed until a report exists |
| Normal fallback | `01-national-entry-desktop.png` plus the feature-detected registry |
| Accessibility | gstack accessibility tree, 390x844 target/overflow audit, design review |
| Demo truth boundary | `VIDEO_PRODUCTION.md`, 74-second local proof-cut manifest, and a required real-ChatGPT replacement list |

## Claim discipline

- Do not say real ChatGPT acceptance, source publication, video, or Devpost submission is complete until the corresponding artifact, URL, or owner action exists.
- Do not claim generated streets or buildings as verified geography.
- Do not present unrelated historical Atlas work as part of this WebMCP entry.
