# Atlas Production Evolution Gates

Atlas should move fast, but every mock must have a promotion path. A mock that
cannot graduate becomes dead weight. A production claim without a gate becomes
trust debt.

## Maturity Levels

### M0: Mock Scaffold

Purpose:
- Shape UI, contracts, and interaction feel before real data or persistence.

Allowed:
- Hard-coded or generated demo state.
- Fake-but-labeled visuals.
- Local-only session state.

Required label:
- Say `mock`, `temporary`, `session-only`, or `Alpha` in docs and user-facing
  output where the distinction matters.

Exit gate:
- Typed contract exists.
- Anti-scope is written.
- Next promotion step is named.

Human approval:
- Required before mock copy or screenshots are used externally.

### M1: Curated Alpha

Purpose:
- Replace generic mock behavior with authored, bounded product truth.

Allowed:
- Curated county packs.
- Deterministic services.
- Closed-world answers.
- Map and campaign previews grounded in curated facts.

Required label:
- Source notes and confidence limits.

Exit gate:
- Core tests cover the contract.
- Tool output is structured.
- Unsupported scope narrows or refuses.
- Docs say exactly what is not live.

Human approval:
- Required before calling a curated signal a market signal, demand signal, or
  production recommendation in public copy.

### M2: Verified Live Read-Only

Purpose:
- Add live provider data without saving it or letting raw payloads reach the UI.

Allowed:
- Google/provider lookup behind server adapters.
- Cache with TTL and attribution.
- Normalized source notes.

Required label:
- Provider mode, cache status, attribution, and TTL.

Exit gate:
- No raw provider fields in renderer, React, `VoxelScene`, or `CityWorldScene`.
- Verifier proves normalized output only.
- Quota and cache behavior are bounded.

Human approval:
- Required before broadening provider radius, adding new provider categories, or
  using live lookup in review-facing claims.

### M3: Persisted Beta

Purpose:
- Hosted Clawd stores user-owned business memory, Scout Drops, campaigns,
  quests, evidence, XP, and reports.

Allowed:
- Accounts.
- Database-backed state.
- Access control.
- Idempotent XP/evidence writes.
- Exports.

Required label:
- Saved vs session-only state must be clear in the UI and tool responses.

Exit gate:
- Ownership/access-control tests.
- Usage-limit tests.
- Evidence and XP idempotency tests.
- Migration/rollback notes.

Human approval:
- Required before enabling persistence for real users, charging money, or
  exposing evidence/XP as durable.

### M4: Production Release

Purpose:
- Public app behavior is stable enough to invite real local business users.

Allowed:
- Multiple supported counties.
- Paid Hosted Clawd path.
- Public onboarding, privacy, terms, and support flow.

Required label:
- Clear source policy and limits for every claim.

Exit gate:
- App review passes.
- Public smoke passes.
- Browser QA passes desktop and mobile.
- Safety review passes.
- Support/rollback path is known.

Human approval:
- Required for launch, pricing changes, public campaign examples, and any
  automation beyond manual planning.

## Approval Gates

Use these exact labels in issue docs, build logs, and handoffs:

- `NO_APPROVAL_NEEDED`: internal docs, tests, narrow refactors, or clearly
  labeled mock/curated Alpha work.
- `HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM`: screenshots, demo copy, submission copy,
  market claims, or public-facing examples.
- `HUMAN_APPROVAL_BEFORE_LIVE_PROVIDER_EXPANSION`: new provider, broader radius,
  new place category, higher quota risk, or provider-derived scoring.
- `HUMAN_APPROVAL_BEFORE_PERSISTENCE`: accounts, saved business memory, saved
  campaigns, evidence, XP, reports, exports, or database migrations.
- `HUMAN_APPROVAL_BEFORE_MONEY`: checkout, pricing, subscription access, paid
  limits, or billing copy.
- `HUMAN_APPROVAL_BEFORE_AUTOMATION`: posting, messaging, ad buying, scheduled
  outreach, scraping, or any action outside manual planning.

No Codex thread should cross an approval gate by implication. It should stop,
name the gate, and leave a concrete next quest.

## Required Slice Template

Every substantial Atlas quest should state:

- Current quest.
- Current maturity level.
- Target maturity level.
- Likely files.
- Anti-scope.
- Human approval gate.
- What becomes more real.
- What remains mock, curated, temporary, or session-only.
- Verification command.
- Merge risk.

## Domain Gates

### Data

M0:
- Hand-authored placeholders.

M1:
- Curated county packs with source notes and confidence limits.

M2:
- Provider lookup normalized behind `GeoDataAdapter`.

M3:
- Saved user-specific data with ownership checks.

Gate:
- No raw provider payload enters renderer or widget contracts.

### Map And Renderer

M0:
- Primitive shapes and temporary art.

M1:
- Authored `CityWorldScene` with stable atlas keys and primitive fallback.

M2:
- Real sprite assets through manifest and resolver.

M3:
- Asset pipeline with versioned manifests and visual regression smoke.

Gate:
- No new visual system, dashboard shell, or renderer rewrite without a quest and
  browser QA.

### MCP Tools

M0:
- Local-only tool stubs.

M1:
- Structured closed-world tools over curated data.

M2:
- Read-only live-provider tools with normalized output.

M3:
- Paid tools with server-side plan checks and persistence.

Gate:
- Every exposed tool needs annotations, output schema, verifier coverage, and
  accurate submission copy.

### UI And Copy

M0:
- Internal-only copy can be rough but must not be generic SaaS filler.

M1:
- User-visible Alpha copy states temporary limits.

M2:
- Live-data copy states source and confidence.

M3:
- Saved-state copy distinguishes session, account, and Hosted Clawd behavior.

Gate:
- Public copy requires human approval if it implies demand, ROI, current market
  truth, persistence, payment, or automation.

### Persistence And XP

M0-M2:
- Session-only state only.

M3:
- Persisted entities require access-control and idempotency tests first.

Gate:
- No evidence, XP, saved campaign, or business memory implementation without a
  written Beta contract and human approval.

## Integration Rule

Parallel Codex threads can move fast only when each one names its maturity level
and approval gate. The integration thread rejects any slice that:

- hides a mock behind production copy,
- changes tool behavior without verifier updates,
- adds live/provider scope without source notes,
- adds persistence without ownership tests,
- changes the map without browser QA,
- leaves `docs/BUILD_LOG.md` or `docs/NEXT_QUESTS.md` stale.
