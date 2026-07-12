# ATLAS PACKET G8-5 - TOOL-CALL CONFIDENCE

## Scope

- Quest: G8-5 Tool-call confidence after the first real-host "show me Riverside County" call spent 31s in host/model deliberation while the backend answered in 116ms.
- Files changed: `server/src/index.ts` tool metadata only; this result note.
- Files intentionally unchanged: handler bodies, schemas, security, Scout logic, `chatgpt-app-submission.json`, `scripts/verify-mcp-flow.mjs`, `scripts/verify-submission.mjs`.

## Description changes

| Tool | Before | After | Routing rationale |
| --- | --- | --- | --- |
| `lookup_world_places` | "Use this when the user asks what places are near a real-world location, in any county. Read-only lookup normalized into Atlas place categories; may use Google Maps Platform when configured. Results are not saved and are not coverage proof - this never unlocks a playable map." | "Use this when the user asks to search for real nearby places or place categories around a location. This is lookup-only and may use Google Maps Platform when configured; it does not open, show, refresh, or unlock a county map. Results are read-only, not saved, and not coverage proof." | Keeps lookup scoped to place search and explicitly tells the model not to use it for county opening, map refresh, or county coverage promotion. |
| `select_county` | "Use this when the user asks to open Atlas or switch to a US county. Riverside returns the playable Eastvale voxel city map in the widget; any other indexed county returns its honest browse-only coverage state. Not for refreshing an already-open map - use render_voxel_county for that." | "Use this when the user asks to show, open, load, view, map, or switch to a US county in Atlas, including bare requests like \"show me Riverside County.\" This is the entry point for county maps: safe, read-only, and normally instant for open/show requests. Riverside opens the playable Eastvale voxel map; other indexed counties show honest browse-only coverage. For refreshing or focusing an already-open map, use render_voxel_county." | Makes `select_county` the obvious first-call tool for "show/open/map county" phrasing and adds the bare "show me X county" cue from the real-host finding. |
| `ask_county_question` | "Use this when the user asks a factual Riverside/Eastvale county or local-business question. Answers come only from the curated Atlas Alpha pack - closed-world and read-only; unsupported questions are refused rather than guessed." | "Use this when the user asks a factual Riverside/Eastvale county, map, or local-business question. It answers from the curated Atlas Alpha pack only; it does not open or refresh the map and does not search live nearby places. Closed-world and read-only; unsupported questions are refused rather than guessed." | Protects the fact-answer lane from competing with `select_county`, `render_voxel_county`, or lookup. |
| `render_voxel_county` | "Use this when the user asks to refresh, re-render, or focus the county map that is already open. Renders the Riverside/Eastvale playable scene in the widget, or honest coverage state for non-playable counties. To open Atlas or switch counties, use select_county instead." | "Use this when the user asks to refresh, re-render, refocus, or move the Atlas county map that is already open. It updates the widget scene or coverage state for the current county; it is not the entry point for bare \"show me X county\" requests. To show, open, map, or switch counties, use select_county." | Narrows render to already-open map refresh/focus and removes "opens" pressure from first-call routing. |
| `preview_scout_drop` | "Use this when the user asks to drop Clawd, scout a location, or find where to launch a local offer. Returns a session-only Scout Drop preview (route, signals, risks, channels, next actions) rendered on the map. Uses curated scene data where available and synthetic session-only template signals elsewhere; nothing is saved, posted, or executed." | "Use this when the user asks to drop Clawd, scout a chosen location, or find where to launch a local offer. It creates a session-only Scout Drop preview with route, signals, risks, channels, and next actions; it does not open or refresh county maps. Uses curated scene data where available and synthetic session-only template signals elsewhere; nothing is saved, posted, or executed." | Keeps Scout as the Clawd/local-offer planning lane, not a map-open or map-refresh fallback. |
| `preview_campaign_engine` | "Use this when the user wants a 7-day manual campaign plan for an existing Atlas Scout Drop. Pass the scoutPreviewId returned by preview_scout_drop when available; if the id is stale, Atlas rebuilds the Scout preview from the supplied args and continues. Session-only: Alpha does not post, DM, buy ads, persist state, or perform live campaign execution." | "Use this when the user wants a 7-day manual campaign plan after an Atlas Scout Drop exists. Pass the scoutPreviewId returned by preview_scout_drop when available; if the id is stale, Atlas rebuilds the Scout preview from the supplied args and continues. Session-only: Alpha does not post, DM, buy ads, persist state, or perform live campaign execution." | Strengthens the call-order dependency: campaign follows Scout Drop and should not compete with initial map or Scout selection. |

## Invocation copy changes

| Tool | Before | After | Rationale |
| --- | --- | --- | --- |
| `select_county` | "Loading Riverside County..." / "Riverside County ready." | "Opening Atlas county..." / "Atlas county ready." | Avoids hardcoding Riverside in host status when the user opens another indexed county shell. |
| `render_voxel_county` | "Opening city map..." / "City map ready." | "Refreshing Atlas map..." / "Atlas map refreshed." | Removes "Opening" from the render tool so it does not compete with `select_county`. |

## Seven-tool overlap analysis

- `select_county`: opens or switches counties. It is the first-call route for show/open/load/view/map county prompts, including "show me X county."
- `render_voxel_county`: refreshes, re-renders, refocuses, or moves an already-open Atlas county map.
- `ask_county_question`: answers curated Riverside/Eastvale factual questions; it does not open maps or search live nearby places.
- `lookup_world_places`: searches real nearby places/categories only; it does not open, refresh, or unlock a county map and is not coverage proof.
- `preview_scout_drop`: creates a session-only Scout Drop for a chosen place or local offer; it does not open or refresh maps.
- `preview_campaign_engine`: creates a session-only 7-day manual campaign only after a Scout Drop exists.
- `get_upgrade_options`: explains save/persistence/pricing/Hosted Clawd limits; unchanged because it does not compete with map opening.

## Annotation audit

- All seven tools carry `readOnlyHint: true` and `destructiveHint: false`.
- Six closed-world/read-only tools carry `openWorldHint: false`: `select_county`, `ask_county_question`, `render_voxel_county`, `preview_scout_drop`, `preview_campaign_engine`, `get_upgrade_options`.
- `lookup_world_places` remains `openWorldHint: true` because it can call Google Maps Platform. Marking it false would be dishonest and would conflict with the existing submission contract.

## Gate tails

- `pnpm typecheck:starter`: passed. Tail: `pnpm build:core`, `pnpm build:geo`, `tsc -p server/tsconfig.json --noEmit`, and `tsc -p web/tsconfig.json --noEmit`.
- `node scripts/verify-tool-result-shape.mjs`: passed with `ok: true`, `blockerCount: 0`.
- `node scripts/verify-mcp-flow.mjs` against self-hosted mock `http://127.0.0.1:8794/mcp`: passed with 7 tools, `lookupPlaceCount: 5`, `cachedLookup: true`, `selectedCountySceneId: voxel-riverside-ca-eastvale-alpha`, `shellCountyTier: L1_COUNTY_SHELL`, `countyQuestionTopic: business_signals`, `hostedClawdStatus: planned_beta`.
- `node scripts/verify-save-surface-flag.mjs` against the same local server: passed with `save_surface_on_emits_hosted_clawd_meta: true`, `save_surface_off_omits_hosted_clawd_meta: true`, `blockerCount: 0`.
- Supplemental `node scripts/verify-submission.mjs` against self-hosted mock: passed with 7 tools, `lookupPlaceCount: 5`, `cachedLookup: true`, `sceneMetaPlaces: 7`, `hostedClawdStatus: planned_beta`.

## Risks

- This is metadata-only. It should reduce first-call deliberation, but only another cold real ChatGPT session can prove the 31s host/model delay is fixed.
- The local MCP verifier must be run with `GEO_DATA_ADAPTER=mock` for the requested self-hosted mock lane; the first local attempt inherited Google lookup mode and failed before the successful mock rerun.
- `lookup_world_places` intentionally remains `openWorldHint: true`; this is the honest provider lookup exception, not a closed-world fast-path tool.
