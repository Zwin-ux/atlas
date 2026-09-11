---
title: Railway
type: entity
created: 2026-09-10
updated: 2026-09-10
sources: [status-2026-08-26]
tags: [deploy, railway]
---

# Railway

Production host for the ChatGPT Atlas backend. Project identity and deploy
SHAs belong in `docs/STATUS.md` and Railway itself, not in this page.

Railway may compile or cache scene packets. Browser pan/zoom must not wait on
Railway. Road chunks, when used, should hit a public origin rather than stuffing
the nation into the app image.

The WebMCP challenge uses a separate Railway project/service. Do not deploy
one tree onto the other's service.

## Related

- [[ChatGPT_Apps_SDK]]
- [[Repository_Map]]
