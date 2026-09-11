# AT-005 host capability spike

Recorded 2026-09-11. Local Atlas checkout `daddaa77` after AT-010. **Not ChatGPT host proof.**

## Installed versions (this machine)

| Package | Declared | Installed |
|---|---|---|
| `@modelcontextprotocol/sdk` | ^1.20.2 | 1.29.0 |
| `@modelcontextprotocol/ext-apps` | ^1.0.1 | 1.7.4 |
| `react` / `react-dom` | ^18.3.1 | 18.3.1 |
| Node | | v24.18.0 |
| pnpm | pnpm@11.7.0 | 11.7.0 |

## Current official guidance (fetched 2026-09-11)

Sources:

- https://developers.openai.com/apps-sdk/build/mcp-server
- https://developers.openai.com/plugins/build/chatgpt-ui

What the docs say now:

- Tools first; UI is optional. Keep tools useful without a component.
- New UI should associate a resource with `_meta.ui.resourceUri` and talk over the MCP Apps JSON-RPC bridge (`ui/initialize`, `ui/notifications/tool-result`, `tools/call`, `ui/message`).
- `window.openai.toolOutput` / `openai/outputTemplate` are ChatGPT **compatibility aliases**, not the portable foundation.
- New resource MIME is `text/html;profile=mcp-app`. Feature-detect ChatGPT-only extensions (`requestDisplayMode`, `setWidgetState`, checkout). Do not wait forever for a missing host.

## What Atlas actually ships

Resource path (server/src/index.ts):

1. Tool `_meta["openai/outputTemplate"]` and `_meta.ui.resourceUri` both set to `ui://widget/atlas-plate.html`.
2. MCP `resources/read` returns inlined HTML, MIME `text/html+skybridge`, CSP connect/resource domains from `WIDGET_DOMAIN`.
3. HTTP `GET /widget/atlas-plate.html` serves the same inlined IIFE (local probe: HTTP 200, ~185KB, `text/html; charset=utf-8`, contains `atlas-boot`).
4. Widget reads `window.openai.toolOutput` and `_meta` via `useToolPlate` / `readHostCapabilities`. Listens for `openai:set_globals`.
5. `search_atlas_places` has no widget template (data-only). `open_atlas_map` always attaches the plate template.

Present locally without a ChatGPT host:

- `hasOpenAiHost: false`
- `hasToolOutput: false`
- `displayMode: unknown`

Absent / not proven here:

- Live `window.openai` hydration in ChatGPT
- MCP Apps `ui/notifications/tool-result` bridge (widget does not subscribe to `postMessage` JSON-RPC yet)
- `callTool` / `sendFollowUpMessage` / `requestCheckout` (out of product scope)
- Portal domain challenge (`ATLAS_OPENAI_APPS_CHALLENGE_TOKEN` still required)
- Cached-template behavior in an authenticated ChatGPT session

## Local handshake (HOST-04)

`http://127.0.0.1:8787/preview` with no `window.openai`:

- Widget mounts.
- Status is `idle`, not a hang and not a fake United States map.
- Copy: “Ask Atlas for a US county, state, or town.”
- No `/api/atlas/nation` fetch.

That is a usable human fallback when the host capability is missing. It is **not** proof that ChatGPT injects `toolOutput`.

MCP endpoint locally answered OPTIONS `/mcp` with 204 while `tsx server/src/index.ts` was running.

## Guidance mismatches (do not “fix” in this spike)

- Atlas still depends on skybridge MIME + `window.openai`, not the 2026 MCP Apps `postMessage` bridge.
- Atlas still sets **both** `openai/outputTemplate` and `ui.resourceUri`. Community reports (2026-06) said that pairing once broke hydration; a host-side fix was claimed. Unverified on ChatGPT in this spike.
- Official docs now prefer a separate render tool. Atlas keeps the map on `open_atlas_map` because the map is the answer. Changing that is a product decision, not this task.

## Owner actions (blocked here)

1. Set `ATLAS_OPENAI_APPS_CHALLENGE_TOKEN` in the OpenAI portal and Railway. Challenge route is ready; token is not.
2. After any widget HTML change, refresh the Atlas connection and start a **new** chat so ChatGPT does not keep a cached template.
3. Run HOST-04 and the kit’s real-host checklist on an authorized ChatGPT session. Local preview cannot substitute.

No product files were changed for AT-005.
