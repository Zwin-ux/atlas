# Atlas Agent Instructions

You are building Atlas.

## Product

Atlas is a ChatGPT app that turns counties into voxel worlds. Users explore with Clawd Companion for free. Paid users host Clawd Daemon to save campaigns, business memory, quests, evidence, XP, and progress.

## Main loop

Explore county → Ask data → Drop Clawd → Scout location → Generate campaign → Create quests → Submit evidence → Level up Clawd.

## Engineering law

Do not build a giant product in one patch. Build one shippable slice at a time.

## High-quality route

1. Mock-first.
2. Typed data contracts.
3. Service-layer first.
4. Renderer only consumes VoxelScene.
5. Google Maps adapter is behind GeoDataAdapter.
6. Apps SDK tools return structuredContent.
7. Widget renders state from the MCP server.
8. Free tools support exploration.
9. Paid tools require Hosted Clawd.
10. No spam automation.

## Anti-scope until explicitly asked

- Real Google Maps API calls in Alpha
- Three.js world
- Live county ingestion
- Stripe
- OAuth
- Automated posting/DMs
- Full e2e testing stack
- Every county
- Every business type

## Required after every patch

- Update docs/BUILD_LOG.md
- Update docs/NEXT_QUESTS.md
- Update docs/DECISIONS.md if durable choice was made
- Run one focused verification command
- Return files changed, what works, what was skipped, next quest
