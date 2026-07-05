# Atlas Agent Instructions

Build with strong product taste, not generic SaaS defaults.

Do not generate a generic SaaS homepage. Do not use the common AI fallback of a hero headline, subcopy, dual CTAs, floating mockup, and feature-card grid. Treat that pattern as a design failure for Atlas.

## Current Product Law

Atlas is a ChatGPT App and voxel county-to-scene engine. Users open Atlas inside ChatGPT, explore a county-scale voxel world, ask location questions, drop Clawd, preview Scout/Campaign flows, and keep session-only notes.

Current phase is Engine Beta, not Paid Beta.

Alpha Path B is accepted. Riverside/Eastvale is the only public playable district. Anaheim/Ontario remain hidden and non-public until owner-gate approval explicitly allows controlled public promotion.

Hosted Clawd implementation beyond the gated setup UI/scaffold, Stripe, paid, DB persistence implementation, OAuth, XP, evidence, automation, reports, exports remain parked until explicitly reopened by the human. The human explicitly reopened DB/Auth preparation on 2026-07-05; Stripe/money, public paid claims, XP, evidence, automation, reports, and exports remain parked.

Current human-directed local-green slice is `0.59H Hosted Clawd Storage/Auth Decision Packet`. It uses `0.58J Hosted Clawd Setup UI Port` plus the 2026-07-05 human DB/Auth reopening as the input update, keeps branch `codex/integrate-hosted-clawd-fable-058e` as the local canonical candidate, and chooses the Hosted Clawd DB/Auth implementation path.

0.59H decision is `DB_AUTH_PREP_APPROVED_STRIPE_STAYS_CLOSED` with selected axis `hosted_clawd_storage_auth`. It chooses Railway Postgres, committed SQL migrations plus a small Node runner, OAuth/OIDC account linking for protected MCP Hosted Clawd actions, and a first persisted capability of owned Hosted Clawd plus business profile, Scout Drop summary, and campaign preview draft.

Default next slice after 0.59H is `0.60H Persistence Foundation`. It may implement DB/Auth persistence only inside the named slice: authenticated account context, Postgres migrations, owner-enforced Clawd/business/Scout Drop/campaign rows, usage events, idempotency, and no Stripe.

Stripe/money remains downstream of 0.60H. Do not implement Stripe Checkout, Billing Portal, webhooks, public paid claims, evidence, XP, reports, exports, automation, or public Anaheim/Ontario unless a later named gate explicitly opens that scope.

Use `hosted-clawd-fable-integration` for strict split checks on the integrated branch.

The owner-gate ladder is parked at `0.45E Owner Gate Cutline / Next Axis Selection`. It reads the 0.44E hidden Anaheim proof packet, product proof, readiness aggregate, and owner cutline, then selects the next axis without exposing Anaheim/Ontario publicly. Default owner-gate slice after 0.45E remains `0.46E Owner Gate Review Packet`. Do not start a public Anaheim spike unless the cutline changes to `APPROVE_CONTROLLED_PUBLIC_SPIKE`. 0.45E selected owner-gate review because hidden visual/product proof passed as evidence, but promotion readiness and owner acceptance are still blocked.

Do not continue commerce, terrain, mobile, Anaheim, paid, or Stripe implementation unless a new verifier or selector names a real blocker that changes the axis. DB/Auth persistence may continue only as `0.60H Persistence Foundation`. Do not continue commerce unless a human names one exact Plaza Row blocker. Do not turn provider lookup into geometry, readiness, persisted data, or playable county claims.

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
- strict `engine-beta-data` split guard, strict `hosted-clawd-scaffold` split guard for the reopened Hosted Clawd scaffold slice, or strict `hosted-clawd-fable-integration` split guard for the integrated local canonical candidate

Browser screenshot proof is required only when renderer or UI output changes.

## Safety

Atlas plans campaigns. It does not auto-post, auto-DM, scrape private individuals, target sensitive traits, guarantee ROI, silently persist state, or imply paid access before Hosted Clawd is explicitly reopened.

Keep local marketing outputs public and business-oriented. Ask users to verify local rules before flyers, outreach, or regulated local actions.

## Copy

Remove AI-sounding phrasing, corporate filler, and hype language. Use direct, human, concise copy. Avoid words like "seamless", "empower", "leveraging", and "revolutionary".

## gstack

Use `/browse` from gstack for web browsing. Never use `mcp__claude-in-chrome__*` tools.
