# Atlas Engineering Prompt Pack

This is the remapped Codex engineering pack for **Atlas**.

Atlas is a ChatGPT app that turns counties into voxel worlds. Free users explore with **Clawd Companion**. Paid users host **Clawd Daemon** for $20/month to save business memory, Scout Drops, campaigns, quests, evidence, and progress.

## Engineering route

The route is intentionally staged:

1. **Pre-production docs**
2. **TypeScript monorepo**
3. **County pack schema + mock data**
4. **PixiJS voxel scene renderer**
5. **Apps SDK/MCP free tools**
6. **Scout Drop engine**
7. **Campaign Engine**
8. **Google Maps adapter behind a mock interface**
9. **Hosted Clawd persistence**
10. **Payments/auth**
11. **Codex plugin + Claude adapter**

Do not start with Google Maps or full 3D. Build against deterministic mock/curated data first.

## First demo

> Drop Clawd in Eastvale for a mobile detailing business.

This demo must produce:
- voxel county scene
- Clawd scout route
- opportunity signals
- campaign preview
- quest preview
- Hosted Clawd $20 upgrade moment

## Prompt order

Run prompts in `/prompts` in numeric order.
