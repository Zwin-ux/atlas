# CODEX_RESULT_W15

## Quest

COPY-TRUTH + SAVE-SURFACE-HIDE for W1.5/W2.2.

## Files Changed

- `server/src/index.ts`
- `web/src/App.tsx`
- `chatgpt-app-submission.json`
- `scripts/verify-submission.mjs`
- `scripts/verify-save-surface-flag.mjs`
- `artifacts/council/CODEX_RESULT_W15.md`

`web/src/CityWorldView.tsx` was inspected and left unchanged: the save entry button and tray already key on `hostedClawdContext`, so the correct fix was to make that context nullable upstream.

## Server Flag

Added `ATLAS_SAVE_SURFACE` with values `on` and `off`; default is `on`.

When `ATLAS_SAVE_SURFACE=off`, tool `_meta` omits the `hostedClawd` key for:

- `select_county`
- `render_voxel_county`
- `preview_scout_drop`
- `preview_campaign_engine`
- `get_upgrade_options`

Hosted Clawd routes, services, schemas, and protected code paths remain present. This is presentation gating, not feature removal.

`get_upgrade_options` keeps the same output schema, but flag-off copy describes Atlas V1 as session-only: pins, notes, Scout Drops, and campaign previews live in this chat; no account, checkout, saved progress, XP, evidence, posting, messaging, ads, or automation starts.

## Exact Widget Conditional

Implemented in `web/src/App.tsx`:

```ts
const hasToolResult = result !== null;

const hostedClawdContext =
  metaHostedClawd
    ? storedHostedClawdContext ?? metaHostedClawd
    : !hasToolResult
      ? storedHostedClawdContext ?? defaultHostedClawdContext(...)
      : null;
```

Then:

- `hostedClawdOpen` is true only when `activeSceneMatches && hostedClawdContext`.
- `hostedClawdActionMessage` is read only when `activeSceneMatches && hostedClawdContext`.
- `onOpenHostedClawd`, `onCloseHostedClawd`, and `onHostedClawdPrimaryAction` are passed to `CityWorldView` only when `hostedClawdContext` exists.
- Campaign-preview advance opens Hosted Clawd only when `hostedClawdContext` exists.

Effect: default local preview with no tool result still gets the fallback demo surface; any real tool result that lacks `_meta.hostedClawd` hides the save button and sheet and ignores stale `hostedClawdOpen` widget state.

## Submission Copy Diff Summary

Old subtitle:

`Explore your county as a voxel city and scout it with an AI agent`

New subtitle:

`Explore Riverside/Eastvale and preview generated US county drafts`

Old description promised "your county" as an explorable voxel city map and framed Hosted Clawd as planned persistence.

New description states:

- Riverside/Eastvale is the playable voxel town map.
- Other indexed US counties can show coverage status and generated draft previews.
- Generated drafts are synthetic, session-only, non-playable, provider-free, and not local truth.
- Things live in this chat.
- Atlas does not save state, provider data, XP, accounts, checkout, posts, messages, ad buys, scraped lists, or live campaign execution.
- Hosted Clawd persistence is not part of the V1 app surface.

`scripts/verify-submission.mjs` now asserts the new truthful subtitle/description and still keeps tool annotation and safety checks.

## Verifiers Run

Green:

- `pnpm typecheck:starter`
- `pnpm test:core`
- `node scripts\verify-tool-result-shape.mjs`
- `node scripts\verify-save-surface-flag.mjs`
- `node scripts\verify-submission.mjs` against a temporary local MCP server with `GEO_DATA_ADAPTER=mock`

Notes:

- An initial `verify-submission` attempt failed at `lookup_world_places` because the host environment can prefer `GEO_DATA_ADAPTER=google`; rerun with explicit mock geo passed.
- Temporary MCP servers were stopped; only TIME_WAIT sockets remained.

Hosted Clawd node-side verifiers attempted:

- `node scripts\verify-hosted-clawd-scaffold.mjs` failed. The metadata string-sensitive blockers introduced by the first helper shape were removed; remaining blockers are older 0.58H slice assumptions about waitlist response copy, grey setup UI tokens, OAuth/Stripe/pg absence, and style tokens.
- `node scripts\verify-hosted-clawd-save-ux.mjs` failed on older 0.61H artifact/current-update/docs/style assumptions.
- `node scripts\verify-hosted-clawd-stripe-billing.mjs` failed on older 0.62H artifact/current-update/docs/billing UI assumptions.

Deferred to reviewer/browser environment:

- `node scripts\verify-hosted-clawd-browser-proof.mjs`
- `node scripts\verify-hosted-clawd-save-ux-browser.mjs`
- `node scripts\verify-hosted-clawd-saved-read-browser.mjs`
- `node scripts\verify-mobile-interaction-hardening.mjs`

## Risks

- `upgradeOptions.structuredContent.hostedClawd` remains for schema compatibility, but the widget no longer uses structured content to show the save surface.
- Legacy hosted-Clawd verifiers are stale against the current 0.72B/0.76 branch state; making them all green would require touching docs/artifacts/styles outside the W1.5/W2.2 strict scope.
- This pass hides presentation only. It does not disable protected Hosted Clawd HTTP routes when their existing feature flags/config allow them.
