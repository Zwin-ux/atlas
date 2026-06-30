# Atlas Agent Instructions

Build with strong product taste, not generic SaaS defaults.

Do not generate a generic SaaS homepage. Do not use the common AI fallback of a hero headline, subcopy, dual CTAs, floating mockup, and feature-card grid. Treat that pattern as a design failure for this project.

## Product

Atlas is a ChatGPT app that turns counties into voxel worlds.

Users explore with Clawd Companion for free. Paid users host Clawd Daemon to save campaigns, business memory, quests, evidence, XP, and progress.

Product sentence: Drop Clawd anywhere. Turn the location into a campaign.

Core loop: Explore county -> Ask data -> Drop Clawd -> Scout location -> Generate campaign -> Create quests -> Submit evidence -> Level up Clawd.

Every feature must support that loop.

## Engineering Law

Do not build a giant product in one patch. Build one shippable slice at a time.

The route is:

1. Mock-first.
2. Typed data contracts.
3. Service-layer first.
4. Renderer only consumes `VoxelScene`.
5. Google Maps adapter stays behind `GeoDataAdapter`.
6. Apps SDK tools return `structuredContent`.
7. Widget renders state from the MCP server.
8. Free tools support exploration.
9. Paid tools require Hosted Clawd.
10. No spam automation.

## Required Reading Before Product Patches

- `docs/PRODUCT_NORTH_STAR.md`
- `docs/ENGINEERING_ROUTE.md`
- `docs/PHASE_PLAN.md`
- `docs/TOOL_CONTRACTS.md`
- `docs/NEXT_QUESTS.md`

State the current quest, likely files, and anti-scope before substantial edits.

## Anti-Scope Until Explicitly Asked

- Real Google Maps API calls in Alpha
- Three.js world
- Live county ingestion
- Stripe
- OAuth
- Automated posting or DMs
- Full e2e testing stack
- Every county
- Every business type
- Broad production infrastructure

## Apps SDK Rules

- Use the MCP Apps bridge first: JSON-RPC over postMessage.
- Keep server tools, structured data, and iframe UI responsibilities separate.
- Keep business data authoritative on the server or backend.
- Keep UI state local to the widget, and use `ui/update-model-context` only when the model needs to see the UI state.
- Use `window.openai` as an optional ChatGPT extension layer, not as the baseline app contract.
- Keep `structuredContent` concise. Put large widget-only details in `_meta`.
- Include accurate tool annotations.
- Version widget resource URIs when markup or bundle contracts change.

## Product And Design

- Avoid SaaS slop: overused gradients, random glowing cards, too many badges, too many floating panels, vague buzzwords, and generic landing-page layouts.
- Prefer simple, distinctive, intentional interfaces with strong hierarchy and clean spacing.
- Use retro-futurist, arcade, OS-like, pixel-informed, tactical, or culturally sharp aesthetics when they fit, but keep them usable.
- Make interfaces feel like real products, not template exports.
- Respect the difference between a cool visual and a good interface.
- Visual direction for Atlas: voxel county board, dark interface panels, bright readable map, original Clawd scout identity, no generic mascot clone.

## UI Work

- Think through layout, spacing, type scale, interaction states, density, and responsiveness.
- Desktop and mobile both matter.
- Reduce clutter. Cut unnecessary sections, duplicate labels, repeated cards, and weak decoration.
- Preserve strong silhouettes, strong logo usage, and readable screens.
- Make screens feel premium through restraint, hierarchy, rhythm, and alignment.
- Prefer clearer navigation and fewer competing focal points.

## Implementation

- Do not overengineer.
- Reuse patterns, centralize tokens, and keep components modular.
- Maintain clean file structure and predictable naming.
- Respect the existing stack unless there is a strong reason to change it.
- Do not introduce unnecessary dependencies.
- Write production-leaning code that is easy to iterate.
- Use curated county data packs first. Do not hallucinate live data.

## Safety

- Atlas plans campaigns. It does not auto-post, auto-DM, scrape private individuals, target sensitive traits, or guarantee ROI.
- Keep local marketing outputs public and business-oriented.
- Ask users to verify city rules before flyers, outreach, or regulated local actions.
- Do not copy OpenAI, Codex, or third-party pet assets. Use original Atlas and Clawd assets.

## Copy

- Remove AI-sounding phrasing, corporate filler, and hype language.
- Use direct, human, concise copy.
- Avoid words like "seamless", "empower", "leveraging", and "revolutionary".
- Copy should sound confident, specific, and culturally aware.

## Required After Every Patch

- Update `docs/BUILD_LOG.md`.
- Update `docs/NEXT_QUESTS.md`.
- Update `docs/DECISIONS.md` if a durable architecture or product choice was made.
- Run one focused verification command.
- Return files changed, what works, what was skipped, and the next quest.

## Testing Rule

Avoid testing hell.

Alpha automated tests only protect:

- usage limits
- ownership or access control
- XP and evidence idempotency
- county pack parsing
- map state schema validity

No broad e2e suite in Alpha.

## gstack

Use `/browse` from gstack for web browsing.
Never use `mcp__claude-in-chrome__*` tools.
