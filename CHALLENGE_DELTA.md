# Atlas WebMCP Challenge Work Statement

Atlas existed before the WebMCP Challenge submission period opened on August 25, 2026. Judges should evaluate only the browser-native WebMCP extension implemented on `webmcp-challenge` from baseline commit `b6f2f8213a9acef3629a2c5f9f84cebab32fea56`.

## Pre-existing baseline

- Nationwide Census-backed state, county, and place data.
- Atlas plate generation and the stable SVG map renderer.
- Manual pan, zoom, county drill-in, and breadcrumb navigation.
- Server-side Census gazetteer resolution and ambiguity handling.
- A separate Apps SDK/MCP integration and iframe widget preview.
- Historical Atlas systems outside the challenge cut, including Scout, Hosted Clawd, Commons, billing, road infrastructure, and internal QA tooling.

## Challenge-period work

This section is an implementation ledger, not a roadmap claim. An item moves to `VERIFIED` only after it exists in a green challenge commit and its evidence is recorded in `WEBMCP_STATE.md`.

| Capability | Status | Evidence |
|---|---|---|
| Top-level no-login Atlas judge route | VERIFIED | Slice 1 route verifier plus desktop and 390x844 browser proof |
| Shared human/agent `AtlasMapController` | VERIFIED | Slice 2 focused tests plus browser county/breadcrumb proof |
| `get_map_state`, `search_places`, `open_place` | VERIFIED | Exact-five registry plus controller, descriptor, lifecycle, and output tests |
| Visible site-tool activity rail | VERIFIED | Availability, sequence, timestamp, tool state, and effect summary |
| Human-agent comprehension and shared correction | VERIFIED | Ready-state civic-trail cue; explicit unchanged-state ambiguity/failure copy; live exact-five trail/note creation; and human marker, rail, title, prompt, and note edits reflected in the next `get_map_state` read |
| Session-only `add_map_note` workflow | VERIFIED | Resolution-first controller test and editable visible note rail |
| Atomic editable `create_map_trail` workflow | VERIFIED | All-stops-first tests plus numbered national overlay, keyboard markers, and synchronized editable rail |
| WebMCP verifier, lifecycle, negative cases, and fallback proof | VERIFIED | `pnpm verify:webmcp` plus desktop/mobile normal-browser proof |
| Current WebMCP and ChatGPT Site Tools compatibility | VERIFIED | Primary-source review pinned to WebMCP proposal commit `41d12f057167ccf5954dbcf49d99502cb6c84491` and current OpenAI Site Tools documentation; descriptor serialization/annotation guards plus a cleanup-race regression test keep Atlas inside ChatGPT's top-level imperative subset without adding a remote MCP mutation path |
| Official WebMCP eval fixtures and Chrome smoke acceptance | DETERMINISTIC VERIFIED / MODEL GATED | `webmcp-evals@0.0.4`; 9/9 official smoke steps and 15 deeper executions with mobile editor handoff and reduced-motion assertions passing on Chrome 152; model runs require a working model backend |
| ChatGPT-first Site Tools conversation contract | DETERMINISTIC VERIFIED / CHATGPT GATED | Human-readable titles, intent-specific descriptions, visible/unchanged write signals, 12 natural-language trajectories, and Chrome protocol proof; actual ChatGPT built-in-browser acceptance remains external |
| Live ChatGPT end-to-end evidence environment | PUBLIC CHROME AND REAL CODEX IN-APP VERIFIED / CHATGPT, MODEL GATED | Exact candidate `39d1e141` is private remote `main` and is live at `https://atlas-webmcp-production.up.railway.app/explore` through isolated deployment `cd899386`. HTTPS readiness, no-login, exact-five metadata, Chrome 152 and real Codex in-app Site Tools execution, visible atomic writes, Springfield safety, human marker-to-agent state handoff, refresh lifecycle, fallback, responsive Product Design proof, and reduced motion pass. The real ChatGPT transcript and exact `grok-4.6` three-run/90% lane remain separately gated. |
| Judge-path accessibility and desktop/mobile proof | VERIFIED | Shared keyboard/touch finder, W3C COGA/STE100-inspired HCI manual, plain-language agent feedback, compact active-only mobile editing, deterministic curved ink trails with exact endpoints, restrained agent-origin stamping, immediate route/marker visibility beneath reduced-motion-safe continuity effects, a 20-second shared-control test, computed 44px target and usable-map-area assertions, matched before/after Product Design QA, and current 1280x720/390x844 proof |
| Challenge-first README, submission copy, and demo production pack | PROVISIONAL CUT VERIFIED / CHATGPT AND PUBLICATION OWNER-GATED | Root README plus `docs/webmcp/SUBMISSION.md`, `VIDEO_SCRIPT.md`, `VIDEO_PRODUCTION.md`, locked narration/captions, and a 74-second local proof cut assembled from SHA-bound real-product frames. The cut has H.264 video, AAC narration, sidecar captions, a source-hash manifest, and no fake ChatGPT chrome. Real ChatGPT shots, participant approval, and public YouTube upload remain required. |
| Clean-clone and public-release safety audit | PRIVATE REMOTE AND DEPLOYMENT VERIFIED / PUBLICATION OWNER-GATED | Deployed/private candidate `39d1e1413e72ea050845ffbaa6323fffeb8c28f1`, projected from source `52b42b1899209de0cc38e11ea27e913d974d0129`, passed a no-local frozen install, typecheck, build, 38/38 verifier, Chrome smoke with 9/9 official steps and 15 deeper executions, release audit, diff/clean-status proof, public post-deploy repetition, and official Gitleaks `8.30.1` full-history scan with zero findings. Latest unpublished presentation candidate `97792d84d66239745011624690769e99ab25838c`, projected from source `da0f4eae8582a345ada3de891422a21b0ac9c4dd`, is a normal fast-forward from deployed `39d1e141` and passes the complete no-local clean-clone sequence with 39/39 verification, the same exact-five Chrome proof, and a 16-commit Gitleaks scan with zero findings. Public visibility and deployment remain owner-gated. |

## Submission boundary

The challenge experience does not claim that generated roads or buildings are verified geography. It does not require login and does not expose persistence, public posting, campaigns, Scout, Hosted Clawd, billing, pricing, checkout, or subscriptions. Notes and research trails are session-only.

The owner-selected Apache-2.0 license is present in the sanitized challenge edition. The no-login challenge runtime is publicly deployed on an isolated Railway service while its source repository remains private. Public source visibility and Devpost submission remain explicit owner decisions.
