# Apps SDK Implementation Notes

These notes come from the supplied OpenAI Apps SDK docs and the official `openai/openai-apps-sdk-examples` repo.

## Architecture

- ChatGPT Apps have three parts: MCP server, widget UI bundle, and the model.
- The MCP server defines tools, instructions, auth boundaries, resources, and structured results.
- The widget runs inside a ChatGPT iframe and communicates through the MCP Apps bridge.
- The model decides when to call tools based on server instructions, tool metadata, schemas, and user intent.

## Server Rules

- Use `text/html;profile=mcp-app` for widget resources. Prefer `RESOURCE_MIME_TYPE` from `@modelcontextprotocol/ext-apps/server`.
- Keep server instructions concise. The first 512 characters should stand alone.
- Treat widget resource URIs as cache keys. Version them when bundle contracts change.
- Define one tool per user intent.
- Include input schemas, output schemas, and accurate tool annotations.
- Keep handlers idempotent because tool calls can be retried.
- Keep `structuredContent` concise and model-readable.
- Use `_meta` for larger widget-only data. Never put secrets in it.
- Use `_meta.ui.csp` and `_meta.ui.domain` before broad distribution.

## UI Rules

- Use the MCP Apps bridge by default:
  - `ui/notifications/tool-input`
  - `ui/notifications/tool-result`
  - `tools/call`
  - `ui/message`
  - `ui/update-model-context`
- Treat incoming structured content as untrusted input.
- Do not assume tool input exists on first render when approval is required.
- Use `window.openai` only for optional ChatGPT-only extensions such as files, modal, widget state, display mode, or close behavior.

## Tool Pattern

Prefer a data tool plus render tool split:

- Data tools fetch, compute, or mutate authoritative state and return structured results without a widget template.
- Render tools take final data or an ID and return a widget template.
- The render tool should include `_meta.ui.resourceUri` and, for compatibility, `_meta["openai/outputTemplate"]`.

This avoids remounting the iframe on every data operation and lets the model reason over the data before showing UI.

## Atlas E4 Pattern

- `select_county` is the first ChatGPT county entrypoint. It returns a compact
  county scene summary in `structuredContent` and the full compiled
  `VoxelScene` in `_meta.scene`.
- `ask_county_question` answers closed-world Riverside/Eastvale questions from
  curated Alpha facts only. It returns source notes, limitations, and a
  supported/refused flag.
- `render_voxel_county` returns a compact scene summary in `structuredContent` and the full `VoxelScene` in `_meta.scene`.
- `preview_scout_drop` returns model-readable scout signals, route, risks, limitations, and upgrade prompt in `structuredContent`.
- The Scout Drop widget reads the full preview from `_meta.scoutPreview` and treats local fallback data as preview-only.
- Widget CTAs that ask ChatGPT to continue use `ui/message` as a request, not a fire-and-forget notification.
- Widget resource URIs are versioned when the bundle contract changes; E4 uses `ui://widget/atlas-board-v2.html`.

## State Model

- Business state lives on the MCP server or backend.
- UI state lives inside the current widget instance.
- Cross-session state lives in backend storage.
- Widget state is message-scoped. Each widget returned in a conversation gets its own state.
- Use `ui/update-model-context` when selected UI state should influence the model.
- Use `window.openai.widgetState` and `window.openai.setWidgetState` only when ChatGPT widget-scoped persistence is useful.
- Avoid `localStorage` for core state.

## Local Workflow

1. Build the widget bundle.
2. Start the MCP server.
3. Test `/preview` for basic rendering.
4. Use MCP Inspector against `http://localhost:8787/mcp`.
5. Use ngrok or another HTTPS tunnel for ChatGPT developer mode.

## Local Machine Notes

- Use `pnpm`, not `npm`.
- `npm --version` currently fails on this host with `ERR_INVALID_PACKAGE_CONFIG` inside `walk-up-path`.
- `pnpm` and Corepack are available.
