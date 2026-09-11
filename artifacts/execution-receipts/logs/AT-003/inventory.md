# AT-003 baseline inventory

Repo: C:/Users/mzwin/Documents/Atlas
HEAD at first inventory: 7cee6389. Continue-session SHA recorded at receipt.

## Checks run this session

| Check | Exit | Notes |
|---|---|---|
| pnpm test:core | 0 | 38 files, 357 tests. Includes 24 county-vs-town ambiguity cases. |
| pnpm typecheck:starter | 0 | core + geo + server + web |
| pnpm brain:verify | 0 | 489 documents after kit classification |
| pnpm verify:location-truth | 0 | 0 confidently wrong. Springfield etc. ambiguous. Nonsense unresolved. |
| pnpm verify:public-http | 0 | static surface; live URL not re-run this session |
| node scripts/verify-atlas-source-of-truth-drift.mjs | 0 | 2-tool surface. Warning: 5 retired names remain in dead server/src/index.ts |

## Separated outcomes

- Green and current: location truth, core tests, typecheck starter, public-http static, tool-surface.
- Warning, not a fail: dead retired tool strings in index.ts (AT-031 later).
- Stale STATUS verifier table still dated 2026-08-26 for MCP/live Railway; not re-run here.
- Environment limit: live `ATLAS_HTTP_URL` public-http not re-run; static gate was 0.
- Unrun: full workspace `pnpm build` (starter build attempted this continue session), live MCP, emulator audit, native workflow smoke, real ChatGPT.
- Not a regression: Location Truth still 0 confidently wrong.

## First safe fix selected

Do not patch location truth; it is green. Do not resurrect dead tools to silence the warning.

Next product work after AT-004/AT-006/AT-007: prove named-place + ambiguity fixtures (already sourced) through the tool/widget path. Existing gazetteer regression `Kane, IL` must remain refuse-to-guess. Widget stale-title-during-pending-load is the first UI hypothesis to reproduce, not assumed broken.
