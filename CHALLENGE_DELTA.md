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
| `get_map_state`, `search_places`, `open_place` | IMPLEMENTED | Slice 3 contracts and tests; registration held until exact-five set is complete |
| Visible site-tool activity rail | NOT STARTED | Slice 4 |
| Session-only `add_map_note` workflow | NOT STARTED | Slice 5 |
| Atomic editable `create_map_trail` workflow | NOT STARTED | Slice 6 |
| WebMCP verifier, lifecycle, negative cases, and fallback proof | NOT STARTED | Slice 7 |
| Judge-path accessibility and desktop/mobile proof | NOT STARTED | Slice 8 |
| Challenge-first README, submission copy, and video script | NOT STARTED | Slice 9 |
| Clean-clone and public-release safety audit | BLOCKED | Existing repository/history is not publication-safe; sanitized challenge edition recommended |

## Submission boundary

The challenge experience does not claim that generated roads or buildings are verified geography. It does not require login and does not expose persistence, public posting, campaigns, Scout, Hosted Clawd, billing, pricing, checkout, or subscriptions. Notes and research trails are session-only.

Repository visibility, open-source license selection, public deployment, and Devpost submission remain explicit owner decisions.
