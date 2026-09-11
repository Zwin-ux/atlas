# Atlas GitHub map

Private unless noted. ChatGPT should treat this file as the repo index.

## Canonical remotes

| GitHub | Local tree | Branch | Role |
|---|---|---|---|
| [Zwin-ux/atlas](https://github.com/Zwin-ux/atlas) | `C:\Users\mzwin\Documents\Atlas` | `main` | **Current ChatGPT app.** Census plates, two-tool MCP surface, widget, local GBrain, LLM wiki. |
| [Zwin-ux/atlas-webmcp-challenge](https://github.com/Zwin-ux/atlas-webmcp-challenge) | `C:\Users\mzwin\Documents\Atlas-WebMCP-Release` | `main` @ `97792d84` | Frozen WebMCP challenge candidate. Do not mix with the ChatGPT-app tree. |
| [Zwin-ux/atlas-alpha-engine-beta-checkpoint](https://github.com/Zwin-ux/atlas-alpha-engine-beta-checkpoint) | same git object store as Documents/Atlas (older remote) | default `codex/engine-beta-cleanup` | Voxel-era checkpoint. Historical. Default branch is **not** current product. |

## Local worktrees (same git object store as Documents/Atlas)

These are checkouts of historical or parallel branches. They are not a second
product. Prefer the `main` tree above unless you are recovering a named slice.

- `C:\Users\mzwin\Documents\Atlas-WebMCP` — branch `webmcp-challenge` (full challenge working tree; sanitized release lives in the challenge repo)
- `C:\Users\mzwin\Documents\Atlas-national-roads`
- `C:\Users\mzwin\Documents\Atlas-0782a-core-quality`
- `C:\Users\mzwin\Documents\atlas-53e-fable`
- Many `Atlas-WebMCP-Release-Clean-*` clones used as one-commit judge reproductions

## What was pushed on 2026-09-10

- Current `Documents/Atlas` working tree (ChatGPT two-tool census product + wiki)
- Branch `webmcp-challenge` onto the canonical `atlas` remote
- Existing checkpoint remote `origin` still points at `atlas-alpha-engine-beta-checkpoint`

## Do not confuse

- Root `README.md` still describes the retired voxel plugin. Current product
  copy is `CHATGPT.md` and `AGENTS.md`.
- `data/road-chunks` is large progressive-enhancement data. National trees do
  not belong in git as the long-term path; live origin is object storage.
- `.env` / `.env.local` stay local. Never commit secrets.
