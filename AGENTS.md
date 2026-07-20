# Atlas Agent Instructions

Build with strong product taste, not generic SaaS defaults.

Do not generate a generic SaaS homepage. Do not use the common AI fallback of a hero headline, subcopy, dual CTAs, floating mockup, and feature-card grid. Treat that pattern as a design failure for Atlas.

## Current Product Law

**Read `docs/NORTH_FACE.md` first.** It is the ship authority. Conflicting
slice history below is background only.

Atlas County Scout is a ChatGPT **plugin** (Apps SDK / MCP + widget). North Face
loop: open map → inspect places → scout → 7-day plan. Session-only free tier is
a complete product, not a demo.

- Riverside/Eastvale = only public **playable** district.
- Other US counties = honest **generated previews** with real Census town names;
  streets/buildings are not verified coverage.
- Public tools stay at 7. Do not add tools casually.
- Hosted Clawd / Stripe / saves / XP / evidence / automation / reports / exports
  are **fenced** off the free public loop unless a human reopens them.
  `ATLAS_SAVE_SURFACE` defaults off; no public paid or checkout claims in ChatGPT
  (OpenAI apps may not sell digital goods/subscriptions in-app).
- Anaheim/Ontario remain hidden/non-public.
- Provider lookup never becomes scene geometry or readiness.
- Census geo board (`?atlasGeoBoard=1`) and national road bakes are not ship
  blockers; do not expand them as the active track.

Parked history (do not re-activate without human ask): owner-gate 0.45E ladder,
full Hosted Clawd paid surface, Plaza Row commerce, national road-chunk program.

## Named-Slice Rule

Work must happen as named, gated slices. Every slice needs:

- player-facing promise
- engineering promise
- axis
- contract
- metric or verifier
- proof
- anti-scope
- logs
- stop condition

If the human says "continue," continue only the named next quest. If the next quest conflicts with permanent gates, stop and report the conflict.

The next quest is chosen from:

1. `artifacts/current-update.json`
2. `docs/NEXT_QUESTS.md`
3. latest selector output
4. a new verifier or selector result created during the current slice

## Architecture Law

- Mock-first.
- Typed data contracts.
- Service-layer first.
- Renderer consumes compiled `VoxelScene` / `CityWorldScene` only.
- Google Maps and provider data stay behind `GeoDataAdapter` and provider policy.
- Provider lookup is not coverage readiness and must not create scene geometry.
- Widget renders from server/tool state; it should not require the transcript to carry giant voxel arrays.
- Railway may compile/cache scene packets, but browser pan/zoom must not wait on Railway.
- Use curated county and district packs first. Do not hallucinate live data.
- Do not introduce unnecessary dependencies.
- Do not overengineer.

## ChatGPT App Rules

- Keep MCP tool surface stable.
- Current public tools are: `select_county`, `ask_county_question`, `render_voxel_county`, `lookup_world_places`, `preview_scout_drop`, `preview_campaign_engine`, `get_upgrade_options`.
- Do not add new MCP tools casually.
- Keep `structuredContent` concise.
- Put large widget-only or renderer-only scene data in `_meta`.
- Keep server tools, structured data, and iframe UI responsibilities separate.
- Use `window.openai` as an optional ChatGPT extension layer, not as the baseline app contract.
- Version widget resource URIs when markup or bundle contracts change.

## Engine And Visual Grammar

- No labels, props, cars, humans, panels, glows, or decorative clutter to hide weak art.
- Improve identity through silhouettes, geometry, massing, roof/facade rhythm, contact shadows, object-kit metadata, and renderer/compiler grammar.
- Map-first remains the product surface. No dashboard shell.
- Desktop and mobile both matter; 390x844 mobile proof is required when the product surface changes.
- Mobile is a primary interaction mode, especially inside ChatGPT on iPhone-sized screens. Use 44x44 CSS pixel targets for primary touch controls, keep one-tap alternatives for core map gestures, make trays/bottom sheets keyboard and screen-reader reachable, announce async Hosted Clawd states with status semantics, and honor reduced motion in Pixi as well as CSS.
- Public Riverside quality beats hidden district polish unless a selector or owner gate changes the axis.

## Required Reading Before Product Patches

- `docs/PRODUCT_NORTH_STAR.md`
- `docs/ENGINEERING_ROUTE.md`
- `docs/PHASE_PLAN.md`
- `docs/TOOL_CONTRACTS.md`
- `docs/NEXT_QUESTS.md`
- `artifacts/current-update.json`

State the current quest, likely files, and anti-scope before substantial edits.

## Required After Every Patch

- Update `docs/BUILD_LOG.md`.
- Update `docs/NEXT_QUESTS.md`.
- Update `docs/DECISIONS.md` if a durable architecture or product choice was made.
- Update `artifacts/current-update.json` for named update slices.
- Run the relevant Engine Beta ladder verifiers, not just one arbitrary command.
- Return files changed, what works, what was skipped, and the next quest.

## Testing Rule

Avoid testing hell, but do not skip the relevant gate.

For Engine Beta source-of-truth and code slices, default to:

- core tests when core contracts changed
- starter typecheck/build when server or web contracts changed
- focused verifier for the slice
- provider boundary guard
- tool-result shape guard
- strict `engine-beta-data` split guard, strict `hosted-clawd-scaffold` split guard for the reopened Hosted Clawd scaffold slice, strict `hosted-clawd-fable-integration` split guard for the integrated local canonical candidate, strict `hosted-clawd-persistence-foundation` split guard for the 0.60H DB/Auth foundation, strict `hosted-clawd-save-ux` split guard for the 0.61H save UX branch, strict `hosted-clawd-stripe-billing` split guard for the 0.62H billing branch, strict `hosted-clawd-protected-tool-gate` split guard for the 0.63H protected gate branch, strict `hosted-clawd-saved-read-surface` split guard for the 0.64H saved read branch, strict `hosted-clawd-browser-proof` split guard for the 0.65H browser proof branch, strict `mobile-interaction-hardening` split guard for the 0.66H mobile hardening branch, strict `product-feel-cleanup` split guard for the 0.67H graphics cleanup branch, or strict `national-generation-contract` split guard for the current national-generation and real-geography branch

Browser screenshot proof is required only when renderer or UI output changes.

## Safety

Atlas plans campaigns. It does not auto-post, auto-DM, scrape private individuals, target sensitive traits, guarantee ROI, silently persist state, or imply paid access before Hosted Clawd is explicitly reopened.

Keep local marketing outputs public and business-oriented. Ask users to verify local rules before flyers, outreach, or regulated local actions.

## Copy

Remove AI-sounding phrasing, corporate filler, and hype language. Use direct, human, concise copy. Avoid words like "seamless", "empower", "leveraging", and "revolutionary".

## gstack

Use `/browse` from gstack for web browsing. Never use `mcp__claude-in-chrome__*` tools.
