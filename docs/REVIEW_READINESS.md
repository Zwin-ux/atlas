# Review Readiness

## Public Endpoints

- App preview: `https://atlas-backend-production-e6fc.up.railway.app/preview`
- MCP endpoint: `https://atlas-backend-production-e6fc.up.railway.app/mcp`
- Health: `https://atlas-backend-production-e6fc.up.railway.app/health`

## Active Alpha Tools

- `select_county`
- `ask_county_question`
- `render_voxel_county`
- `lookup_world_places`
- `preview_scout_drop`
- `preview_campaign_engine`
- `get_upgrade_options`

## Alpha Limits

- Session stickers and notes are local preview state only.
- Live lookup returns normalized nearby place summaries only.
- Atlas Alpha does not save provider data, persist campaigns, grant XP, create accounts, start checkout, post, message, buy ads, scrape, or execute outreach.
- Hosted Clawd persistence is planned for Beta.

## Local Smoke Commands

```powershell
node -e "JSON.parse(require('fs').readFileSync('chatgpt-app-submission.json','utf8')); console.log('submission json ok')"
pnpm test:core
pnpm --dir packages/geo typecheck
pnpm --dir packages/core typecheck
pnpm typecheck:starter
pnpm build:server
pnpm build:web
pnpm --dir apps/widget typecheck
$env:ATLAS_MCP_URL='http://127.0.0.1:<port>/mcp'; pnpm verify:mcp
$env:ATLAS_MCP_URL='http://127.0.0.1:<port>/mcp'; pnpm verify:submission
$env:ATLAS_PREVIEW_URL='http://127.0.0.1:<port>/preview'; pnpm verify:preview:http
```

## Public Smoke Commands

```powershell
$env:ATLAS_MCP_URL='https://atlas-backend-production-e6fc.up.railway.app/mcp'; pnpm verify:mcp
$env:ATLAS_MCP_URL='https://atlas-backend-production-e6fc.up.railway.app/mcp'; pnpm verify:submission
$env:ATLAS_PREVIEW_URL='https://atlas-backend-production-e6fc.up.railway.app/preview'; pnpm verify:preview:http
```

## Browser QA

The rendered app must be checked in the in-app browser because this repo does not include Playwright.

Required checks:

- `/preview` loads the first meaningful screen.
- One full-screen Pixi canvas is visible.
- Desktop and mobile viewports are nonblank.
- No framework error overlay.
- No visible old default-map language: `campaign`, `report`, `signal`, `risk`, `tactical`, `dashboard`, `board`.
- Drag, wheel zoom, place click, sticker drop, and note save respond.
