# Atlas WebMCP

Atlas is a shared geographic canvas. A person explores U.S. counties on the map while an agent reads and changes the same live session through browser-native WebMCP tools.

No login. No saved profile. One map, one research session.

![Atlas national map with a numbered three-county research trail](artifacts/webmcp-proof/trail-overview-desktop.png)

## What the candidate does

- Opens a nationwide Census-backed county map at `/` and `/explore`.
- Lets a person pan, zoom, drill into counties, follow breadcrumbs, and find a U.S. city or county with the keyboard.
- Preserves ambiguity. `Springfield` returns labeled candidates instead of silently choosing one.
- Registers exactly five imperative WebMCP tools from the top-level page.
- Shows agent activity and every write in the same interface the person is using, including a numbered national trail overview.
- Keeps notes and research trails in the current browser session only.
- Falls back to a complete normal map when WebMCP is unavailable.

## The five tools

| Tool | Effect |
|---|---|
| `get_map_state` | Reads the visible location, selection, recent notes, and active trail. |
| `search_places` | Searches the bounded Census-backed place index without changing the map. |
| `open_place` | Resolves one place and opens it visibly. Ambiguous names return candidates without mutation. |
| `add_map_note` | Resolves a place, opens it, and adds one visible session-only note. |
| `create_map_trail` | Resolves every stop first, then atomically shows one editable 2-5 stop trail on the national map. |

Human controls and tool callbacks share one `AtlasMapController`. Write calls resolve only after the matching map revision is visible. A canceled, failed, or superseded transition cannot report success.

## Run locally

Requirements: Node.js 22.12 or newer, pnpm 11, Git, and Chrome for the WebMCP smoke gate.

```powershell
pnpm install --frozen-lockfile
pnpm build:atlas-plates
pnpm dev
```

Open:

- `http://127.0.0.1:8787/` for the top-level judge route.
- `http://127.0.0.1:8787/explore` for the equivalent explicit route.
- `http://127.0.0.1:8787/preview` only for the fenced legacy widget preview.

The challenge route feature-detects `document.modelContext?.registerTool`. A normal browser shows `Site tools unavailable` and keeps the human map fully usable.

Current WebMCP setup details live in the [OpenAI Site Tools documentation](https://learn.chatgpt.com/docs/webmcp), [Chrome imperative API guide](https://developer.chrome.com/docs/ai/webmcp/imperative-api), and [WebMCP draft](https://webmachinelearning.github.io/webmcp/).

## Verify the candidate

```powershell
pnpm verify:webmcp
pnpm typecheck
pnpm build
pnpm eval:webmcp:smoke
```

`pnpm verify:webmcp` covers the exact-five contract, schemas, annotations, output bounds, shared-controller path, ambiguity, cancellation, atomic trails, projected county centers, top-level registration, all-or-none rollback, route fencing, normal-browser feature detection, and evaluation-fixture drift. `pnpm eval:webmcp:smoke` starts the built judge route, enables Chrome WebMCP, executes all five real tools without a model or API key, and checks visible completion plus mutation-safe failures.

Model-selection runs are credentialed, explicit gates:

```powershell
$env:ATLAS_WEBMCP_EVAL_MODEL = "openai:gpt-5-mini"
$env:OPENAI_API_KEY = "..."
pnpm eval:webmcp:static
pnpm eval:webmcp:browser
```

Both model commands run each case three times, require at least 90% correct tool/argument trajectories, and reject any critical write-selection or atomicity failure. See [docs/webmcp/EVALS.md](docs/webmcp/EVALS.md) for provider options and evidence boundaries.

The deterministic local gates currently pass. Chrome 152 WebMCP proof covers exact-five discovery, 9/9 official smoke steps, 13 deeper browser executions, visible trail rendering, keyboard marker navigation, ambiguity recovery, atomic failure, refresh/route registration, and zero console errors. Model-score and real ChatGPT built-in-browser acceptance remain separate credentialed or external gates.

## Challenge-period delta

Atlas existed before the WebMCP Challenge opened on August 25, 2026. The submission delta begins at baseline commit `b6f2f8213a9acef3629a2c5f9f84cebab32fea56` and adds the no-login top-level route, shared live controller, exact-five WebMCP surface, visible activity, session notes, atomic trails, verifier, and judge-path accessibility work.

See [CHALLENGE_DELTA.md](CHALLENGE_DELTA.md) for the capability ledger and [WEBMCP_STATE.md](WEBMCP_STATE.md) for exact commands, results, screenshots, and current gates.

## Deliberate boundaries

The challenge experience requires no account and keeps its research artifacts session-only. It makes no generated-street or building claims. Tool output excludes raw geometry, large scene objects, credentials, and third-party payloads.

The owner-selected Apache-2.0 license is applied only to the sanitized challenge edition. Repository visibility, public deployment, and Devpost submission still require explicit owner approval. The current historical repository is not safe to publish as-is; use the audited sanitized-release path in [docs/webmcp/RELEASE_PACKET.md](docs/webmcp/RELEASE_PACKET.md).

## Submission materials

- [Devpost copy and evidence map](docs/webmcp/SUBMISSION.md)
- [Under-three-minute video script](docs/webmcp/VIDEO_SCRIPT.md)
- [Owner-gated release packet](docs/webmcp/RELEASE_PACKET.md)
- [Evaluation guide and thresholds](docs/webmcp/EVALS.md)
- [Official challenge page](https://webmcp.devpost.com/)
- [Official rules](https://webmcp.devpost.com/rules)
