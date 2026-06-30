# Atlas Agent Instructions

You are building **Atlas**.

Atlas is a ChatGPT app that turns counties into high-quality voxel worlds. Users explore local data with **Clawd Companion** for free, then can pay to host **Clawd Daemon** for persistent business memory, saved Scout Drops, campaigns, quests, evidence, XP, and progress.

## Product sentence

Atlas lets users drop Clawd into a county/location, scout local business opportunities, generate a local campaign, and turn that campaign into action quests.

## Core loop

Explore county → Ask data → Drop Clawd → Scout location → Generate campaign → Create quests → Submit evidence → Level up Clawd.

Every feature must support this loop.

## Hard rules

1. Build TypeScript-first.
2. Apps SDK/MCP server is the platform entrypoint.
3. Widget renders backend/tool state; widget does not invent source-of-truth state.
4. Free users still get Clawd as a companion.
5. Paid users get Hosted Clawd Daemon.
6. Do not build a full 3D engine in Alpha.
7. Do not add Stripe/Auth/GitHub/Claude/Codex-plugin runtime until the relevant phase asks.
8. Do not create broad testing infrastructure in Alpha.
9. Use curated county data packs first; do not hallucinate live data.
10. Do not build spam automation. Atlas plans campaigns; users approve and execute.
11. Keep local marketing outputs public/business-oriented, not creepy individual targeting.
12. Do not copy OpenAI/Codex/third-party pet assets. Use original Atlas/Clawd assets.

## Patch workflow

Before editing:
- Read AGENTS.md.
- Read docs/PRODUCT_NORTH_STAR.md.
- Read docs/PHASE_PLAN.md.
- Read docs/TOOL_CONTRACTS.md.
- Read docs/NEXT_QUESTS.md.
- State the current quest, likely files, and anti-scope.

After editing:
- Update docs/BUILD_LOG.md.
- Update docs/NEXT_QUESTS.md.
- Update docs/DECISIONS.md if an architecture/product choice was made.
- Run one focused verification command.
- Return files changed, what works, what was skipped, next quest.

## Testing rule

Avoid testing hell.

Alpha automated tests only protect:
- usage limits
- ownership/access control
- XP/evidence idempotency
- county pack parsing
- map state schema validity

No broad E2E suite in Alpha.
