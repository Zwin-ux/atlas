# CODEX_RESULT_W1 - Server Hardening

Date: 2026-07-11
Branch: `codex/integrate-hosted-clawd-fable-058e`
Scope: W1.4 MCP endpoint hardening, W1.6 rate limits, W1.7 hosted-clawd router gate.

## Implementation

- Added request Host validation before route dispatch. Production accepts configured public hosts from `APP_BASE_URL` and `RAILWAY_PUBLIC_DOMAIN`; non-production also accepts localhost, `127.0.0.1`, and `::1`.
- Replaced MCP CORS `*` with reflected allowlisted origins only. No-Origin requests still pass for server-to-server MCP clients and ChatGPT host/backend traffic.
- Added `ATLAS_ALLOWED_ORIGINS` as a comma-separated browser-Origin allowlist. `APP_BASE_URL` origin is always included as self; localhost origins are allowed only outside production.
- Added Origin admission on `/mcp` and mutating HTTP routes. Hostile browser Origins get 403 before MCP transport, body parsing, or service logic.
- Changed generated draft rate key from county-only to `generated_draft:{clientAddress}:{countySlug}`.
- Added a 120/min per-client ceiling for expensive MCP map tool paths: `select_county` and `render_voxel_county`.
- Client address now trusts `X-Forwarded-For` only when Railway runtime env is present and the direct peer is private/loopback. In that case it uses the rightmost forwarded address as the last untrusted hop; otherwise it uses the socket address.
- Non-production loopback requests are rate-limit exempt so local verifiers and emulator hammering do not trip server limits.
- Hosted-Clawd write routes now 404 at the router when persistence is not mounted. Reads keep existing behavior. Startup logs `hosted_clawd_router_mode` with `write_routes_mounted` or `write_routes_404`.

## Verification

- `pnpm typecheck:starter` -> exit 0.
  - Tail: `pnpm build:core`, `pnpm build:geo`, `tsc -p server/tsconfig.json --noEmit`, `tsc -p web/tsconfig.json --noEmit`.
- `node scripts/verify-server-hardening.mjs` -> exit 0.
  - Gates green: hostile `/mcp` Origin 403; no-Origin `/mcp` POST 2xx; hostile Host rejected; hosted-clawd write without persistence 404; allowed preflight reflects ACAO and hostile preflight does not.
  - Tail: `hosted_clawd_router_mode` logged `write_routes_404`; denied requests logged `origin_not_allowed` and `host_not_allowed`.
- `node scripts/verify-tool-result-shape.mjs` -> exit 0.
  - Tail: `ok: true`, `blockerCount: 0`.
- `node scripts/verify-provider-boundaries.mjs` -> exit 0.
  - Tail: `ok: true`, `blockerCount: 0`.

## Risks / Reviewer Notes

- Production must set `APP_BASE_URL` or `RAILWAY_PUBLIC_DOMAIN`; otherwise Host validation fails closed.
- If ChatGPT/browser traffic sends a concrete Origin instead of no Origin, that platform Origin must be added to `ATLAS_ALLOWED_ORIGINS`.
- Reviewer still owns emulator liveMcp audit and production deploy checks.
