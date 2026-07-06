# Atlas Agent Instructions

Build with strong product taste, not generic SaaS defaults.

Do not generate a generic SaaS homepage. Do not use the common AI fallback of a hero headline, subcopy, dual CTAs, floating mockup, and feature-card grid. Treat that pattern as a design failure for Atlas.

## Current Product Law

Atlas is a ChatGPT App and voxel county-to-scene engine. Users open Atlas inside ChatGPT, explore a county-scale voxel world, ask location questions, drop Clawd, preview Scout/Campaign flows, and keep session-only notes.

Current phase is Engine Beta, not Paid Beta.

Alpha Path B is accepted. Riverside/Eastvale is the only public playable district. Anaheim/Ontario remain hidden and non-public until owner-gate approval explicitly allows controlled public promotion.

Hosted Clawd DB/Auth persistence is now local-green only for owner-protected rows. Atlas remains the map/chat app and voxel world engine; Hosted Clawd / Clawdbot is the paid neighborhood operator layered on top of owned Atlas state. Stripe/money, public paid claims, XP, evidence, automation, reports, and exports remain parked.
The human explicitly reopened DB/Auth preparation on 2026-07-05.

Current human-directed local-green slice is `0.61H Invite Beta Save UX`. It uses `postalpha-0.60h-hosted-clawd-persistence-foundation` as input, keeps branch `codex/integrate-hosted-clawd-fable-058e` as the local canonical candidate, and makes owned local state understandable inside the Hosted Clawd map tray.

0.61H decision is `MAP_FIRST_SAVE_UX_LOCAL_GREEN_STRIPE_CLOSED` with selected axis `hosted_clawd_invite_beta_save_ux`. It keeps the Superior grey setup console and adds claymation save slots for business/location, local notes, Scout Drop, and campaign draft state. The 0.60H Railway Postgres/OAuth/OIDC owner-protected persistence foundation remains local-green.

Default next slice after 0.61H is `0.62H Stripe Test Billing`. It may attach test-mode Stripe only after ownership, idempotency, and the map-first save UX are boring: Checkout, Customer Portal, webhook replay protection, inactive read-only state, and proof that success URLs grant nothing by themselves.

Stripe/money remains downstream of 0.60H and 0.61H. Do not implement Stripe Checkout, Billing Portal, webhooks, public paid claims, evidence, XP, reports, exports, automation, or public Anaheim/Ontario unless a later named gate explicitly opens that scope.

Use `hosted-clawd-save-ux` for strict split checks on the 0.61H save UX branch.

The owner-gate ladder is parked at `0.45E Owner Gate Cutline / Next Axis Selection`. It reads the 0.44E hidden Anaheim proof packet, product proof, readiness aggregate, and owner cutline, then selects the next axis without exposing Anaheim/Ontario publicly. Default owner-gate slice after 0.45E remains `0.46E Owner Gate Review Packet`. Do not start a public Anaheim spike unless the cutline changes to `APPROVE_CONTROLLED_PUBLIC_SPIKE`. 0.45E selected owner-gate review because hidden visual/product proof passed as evidence, but promotion readiness and owner acceptance are still blocked.

Do not continue commerce, terrain, mobile, Anaheim, paid, or Stripe implementation unless a new verifier or selector names a real blocker that changes the axis. DB/Auth persistence and map-first save UX are now local-green; continue into `0.62H Stripe Test Billing` only as a named test-billing slice. Do not continue commerce unless a human names one exact Plaza Row blocker. Do not turn provider lookup into geometry, readiness, persisted provider data, or playable county claims.

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
- strict `engine-beta-data` split guard, strict `hosted-clawd-scaffold` split guard for the reopened Hosted Clawd scaffold slice, strict `hosted-clawd-fable-integration` split guard for the integrated local canonical candidate, strict `hosted-clawd-persistence-foundation` split guard for the 0.60H DB/Auth foundation, or strict `hosted-clawd-save-ux` split guard for the 0.61H save UX branch

Browser screenshot proof is required only when renderer or UI output changes.

## Safety

Atlas plans campaigns. It does not auto-post, auto-DM, scrape private individuals, target sensitive traits, guarantee ROI, silently persist state, or imply paid access before Hosted Clawd is explicitly reopened.

Keep local marketing outputs public and business-oriented. Ask users to verify local rules before flyers, outreach, or regulated local actions.

## Copy

Remove AI-sounding phrasing, corporate filler, and hype language. Use direct, human, concise copy. Avoid words like "seamless", "empower", "leveraging", and "revolutionary".

## gstack

Use `/browse` from gstack for web browsing. Never use `mcp__claude-in-chrome__*` tools.
