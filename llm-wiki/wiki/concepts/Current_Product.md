---
title: Current Product
type: concept
created: 2026-09-10
updated: 2026-09-10
sources: [agents-md, status-2026-08-26, chatgpt-handoff]
tags: [product, chatgpt, census]
---

# Current Product

Atlas is a ChatGPT app that draws a United States place as a Census-backed
cartographic plate and answers questions from the same data. It is read-only:
no accounts, no writes, no commerce, no third-party geodata.

The public MCP tool surface is **not** listed here. Names, retired names, and
annotations live in `scripts/lib/atlas-tool-surface.mjs`. Implementations live
in `server/src/atlasTools.ts`. Those two must agree;
`scripts/verify-atlas-source-of-truth-drift.mjs` fails if they do not.

## What a session looks like

A person asks ChatGPT to open a county, state, or the nation. Atlas resolves
the name ([[Location_Truth]]), draws an SVG plate, and keeps the widget on
that place. Search finds places Atlas actually carries. Ambiguous names return
candidates. Unknown names refuse.

## What this is not

It is not the voxel county game, not Hosted Clawd, not Commons notes, and not
the WebMCP challenge snapshot. Those live as history or sister repos
([[Repository_Map]]). The 2026-07-25 pivot deleted the old public surface.
[[Hard_Stops]] lists what must stay deleted.

## Visual system

`DESIGN.md` is the active visual reference for the current map. The root
`README.md` still describes the retired voxel plugin; do not follow it.

## Related

- [[Authority_Split]]
- [[ChatGPT_Apps_SDK]]
- [[US_Census]]
