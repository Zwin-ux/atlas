---
title: ChatGPT Apps SDK
type: entity
created: 2026-09-10
updated: 2026-09-10
sources: [agents-md, status-2026-08-26]
tags: [chatgpt, mcp, widget]
---

# ChatGPT Apps SDK

Atlas ships as an Apps SDK / MCP app plus a widget. ChatGPT talks to `/mcp`.
The widget is a self-contained skybridge HTML plate, not a transcript that
carries bulk geometry.

Store packet: `chatgpt-app-submission.json`. Widget URI and CSP details are
in `docs/STATUS.md` (2026-08-22 widget debug trail). Cached ChatGPT sessions
can keep a stale template; retry on an old message is not a product bug.

The WebMCP challenge is a **sister** browser-native tool surface, not a
replacement for this MCP surface. Keep them distinct.

## Related

- [[Current_Product]]
- [[Railway]]
- [[Repository_Map]]
