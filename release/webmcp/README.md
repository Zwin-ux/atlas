# Atlas WebMCP

Atlas is a shared geographic canvas where a person explores U.S. counties while an agent reads and changes the same live map through browser-native WebMCP tools.

No login. No saved profile. One map, one research session.

![Atlas national map with a numbered three-county research trail](docs/assets/trail-overview.png)

## Try the shared map

- Live app: `[OWNER REQUIRED: approved public deployment]`
- Public source: `[OWNER REQUIRED: approved public repository]`
- Suggested prompt: “Create a civic research trail through Riverside County, California; Travis County, Texas; and Miami-Dade County, Florida.”

The map supports pan, zoom, county drill-in, breadcrumbs, and a keyboard/touch place finder in every modern browser. A WebMCP-capable browser additionally discovers exactly five page-native tools:

| Tool | Effect |
|---|---|
| `get_map_state` | Reads the visible location, recent notes, and active trail. |
| `search_places` | Searches the bounded Census-backed place index without changing the map. |
| `open_place` | Opens one resolved place; ambiguous names return candidates without mutation. |
| `add_map_note` | Opens a place and adds one editable session-only note. |
| `create_map_trail` | Resolves every stop first, then atomically shows one editable 2–5 stop trail on the national map. |

Human controls and tools use one `AtlasMapController`. A write returns success only after the matching map revision is visible. Failed, canceled, ambiguous, or superseded work cannot claim a visible success.

## Run locally

Requirements: Node.js 22.12+, pnpm 11, and Chrome for the browser smoke gate.

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm verify:webmcp
pnpm eval:webmcp:smoke
pnpm start
```

Open `http://127.0.0.1:8787/` or `http://127.0.0.1:8787/explore`. A normal browser shows `Site tools unavailable` while retaining the complete human map.

## What is included

This repository is the compact challenge edition: the standalone React client, a small no-login Node server, the Census-backed place index and county geometry required at runtime, exact-five tests, deterministic Chrome smoke journeys, model-eval fixtures, public documentation, and Railway deployment contract.

Atlas existed before the challenge as a Census-backed map engine. [CHALLENGE_DELTA.md](CHALLENGE_DELTA.md) separates that baseline from the browser-native work. [ATTRIBUTION.md](ATTRIBUTION.md) records data and dependency provenance.

## Evidence and submission material

- [Evaluation guide](docs/EVALS.md)
- [Verification boundary](docs/VERIFICATION.md)
- [Devpost copy](docs/SUBMISSION.md)
- [Under-three-minute video script](docs/VIDEO_SCRIPT.md)

The deterministic gates pass locally. Credentialed model scores, the public URL, real ChatGPT acceptance, video upload, and Devpost submission remain separate external evidence and must not be claimed until their artifacts exist.

## License

Source code is available under [Apache-2.0](LICENSE). U.S. Census data attribution and third-party package licenses are described in [ATTRIBUTION.md](ATTRIBUTION.md).

