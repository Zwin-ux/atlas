# Atlas ChatGPT App Workspace

Atlas is a ChatGPT app that turns counties into playable voxel worlds. The Alpha map opens as a geo-grounded Riverside County city map: users pick a district, inspect known places, drop stickers, and keep session-only notes. Scout Drops and campaign previews still exist as backend tools, but the primary UI is the map.

The first Alpha demo is:

> Drop Clawd in Eastvale for a mobile detailing business.

The current engineering route is Alpha-first:

- Curated county JSON.
- Typed service contracts.
- PixiJS `VoxelScene` renderer with SVG fallback.
- Google Maps behind `GeoDataAdapter`, not as the main renderer.
- Apps SDK/MCP tools as the ChatGPT entrypoint.

This repo already has a lean starter for the OpenAI Apps SDK pattern:

- A TypeScript MCP server exposed at `/mcp`.
- A separate React widget bundle rendered inside ChatGPT.
- The MCP Apps bridge for iframe communication.
- A decoupled data tool and render tool, so the model can reason over structured data before mounting UI.

This repo is intentionally not a generic SaaS shell. The current root `server/` and `web/` starter is a temporary Apps SDK sandbox; the Atlas monorepo skeleton now lives under `apps/` and `packages/`.

## Tooling

Use `pnpm`. On this machine, global `npm` fails under `walk-up-path`, so the scripts are written around `pnpm` and Corepack.

Required:

- Node.js 18 or newer. Current local check found Node `v24.16.0`.
- pnpm. Current local check found pnpm `11.7.0`.
- Git.

No OpenAI API key is required for this local MCP app scaffold. ChatGPT connects to the `/mcp` endpoint through developer mode and a public HTTPS tunnel or deployment.

## Commands

```powershell
pnpm install
pnpm env:check
pnpm typecheck:workspaces
pnpm build
pnpm verify:mcp
pnpm dev
```

The dev server listens on:

- `http://localhost:8787/` for a plain health page.
- `http://localhost:8787/preview` for the local widget preview.
- `http://localhost:8787/mcp` for ChatGPT, MCP Inspector, or a tunnel.

`pnpm verify:mcp` is a client smoke for a running MCP server. By default it
checks `http://127.0.0.1:8787/mcp`; set `ATLAS_MCP_URL` to verify another local,
tunnel, or Railway endpoint.

To test with MCP Inspector:

```powershell
pnpm inspect
```

To connect from ChatGPT during development, expose the local server with a tunnel such as ngrok:

```powershell
ngrok http 8787
```

Then create a ChatGPT connector in developer mode with the HTTPS URL ending in `/mcp`.

## Structure

```text
engineering-prompt-pack/ preserved source copy of the engineering prompt pack
prompt-pack/             preserved source copy of the first Atlas prompt pack
prompts/                 active Codex prompt sequence
docs/                    product and engineering route docs
plugins/                 Atlas daemon skill scaffold
data/county_packs/       curated county data
assets/                  asset prompts and placeholders
apps/widget/             Vite + React placeholder widget shell
apps/web/                placeholder web shell
packages/config/         shared constants placeholder
packages/core/           core contracts placeholder
packages/geo/            geo adapter placeholder
packages/mcp/            MCP layer placeholder
packages/assets/         asset package placeholder
server/
  src/index.ts        MCP server, tools, resources, HTTP endpoint
web/
  src/                React widget and MCP Apps bridge helpers
  dist/               Generated bundle, ignored by Git
scripts/
  build-web.mjs       esbuild widget build
  check-env.mjs       local environment sanity check
docs/
  apps-sdk-notes.md   distilled setup notes from the supplied docs
```

The official Apps SDK examples repo is cloned under `.reference/openai-apps-sdk-examples` for inspection and is intentionally ignored by Git.

## Current Quest

See `docs/NEXT_QUESTS.md`.

Quest E6 is complete. Quest E6.6 shifts the visible product toward a map-first city world.
The active ChatGPT county entrypoint is now `select_county` for the Riverside/Eastvale demo slice:

- `select_county`
- `ask_county_question`
- `render_voxel_county`
- `lookup_world_places`
- `preview_scout_drop`
- `preview_campaign_engine`
- `get_upgrade_options`

The Railway backend is live at `https://atlas-backend-production-e6fc.up.railway.app` with Google geo configured server-side.

## State Model

- Server or backend owns business data.
- Widget state owns ephemeral view behavior such as selected district/place, stickers, and notes.
- Durable cross-session state belongs in a backend storage layer once the product needs it.
- The widget can call `ui/update-model-context` when UI state should affect the model's next turn.

Avoid putting secrets, tokens, or private data in `structuredContent`, `content`, `_meta`, or widget state.
