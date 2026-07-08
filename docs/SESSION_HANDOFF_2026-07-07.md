# Session Handoff — 2026-07-07 (Fable → successor)

Written by the Fable session that shipped the 0.75C series, the canonical
merge, and G6. Read this + `docs/SHIP_READINESS.md` + `docs/NORTH_STARS.md`
+ the auto-memory (`project_atlas`, `feedback_codex_delegation`) before
touching anything.

## Exact state

- **Canonical** `Documents/Atlas`, branch `codex/integrate-hosted-clawd-fable-058e`
  at `1874efa`, PUSHED. Contains: hosted-clawd 0.72B stack + 0.73F/0.74F +
  0.75C series (depth interleave, dense fabric, material texture, NS-3
  presentation) + G6 assets + merge hardening. G1–G6 ALL GREEN per-exit-code
  (`docs/SHIP_READINESS.md` has the classified 82-verifier table).
- **Engine worktree** `Documents/atlas-53e-fable`, branch
  `fable/0.58e-prop-cleanup` at `ef29367`, PUSHED. Superseded by the merge —
  future engine work should branch from canonical.
- **Sibling session WIP preserved**: `docs/0.75R_HANDOFF.md` (modified) +
  `docs/design/clay-board/` (untracked) belong to a parallel 0.75R session
  (claymation design track, Stage 2 mid-flight). DO NOT commit/revert them on
  canonical; they are backed up on origin branch `backup/0.75r-stage2-wip`
  (plumbing commit; working tree untouched).
- **Legal: user-approved 2026-07-07** (recorded in SHIP_READINESS).
- **Railway: user says CLI is logged in.** Deploy = user-authorized. NOT yet
  executed.

## In flight RIGHT NOW

- **Codex packet 0.75S** (ship-pass legwork) was launched in background:
  brief at scratchpad `packet5-ship-passes.md`. Deliverables (uncommitted when
  it lands): `scripts/capture-ship-pass-evidence.mjs` (reviewer runs it —
  codex sandbox can't launch chrome/esbuild), plus
  `artifacts/0.75s-ship-passes/GAMEPLAY_INVENTORY.md` and `USER_STORY_AUDIT.md`
  and `CODEX_RESULT.md`. If the session died before it returned: check the
  working tree for those files; re-launch from the brief if absent.
- **Preview server** may be running on :8787 (background task) — kill by port
  before starting another.
- Uncommitted in canonical: evidence re-emissions in `artifacts/ops` +
  `artifacts/product-quality-audit` (from my gameplay session) + whatever
  codex lands + `artifacts/0.75s-ship-passes/art-*.png` (my art-pass
  captures). Commit together as the 0.75S pass-results commit.

## The three ship passes (user-ordered, before deploy)

1. **Art pass** — authored Riverside JUDGED: no merge regressions, ~7.5–8/10.
   Ceiling items logged: Plaza Row saturated flat slabs (weakest read), faint
   roof-seam linework at mid-zoom. REMAINING: judge generated district +
   scout/campaign/shell captures at the NEW curated bar (see directive below)
   once the capture script runs.
2. **Gameplay pass** — live feel MEASURED AND PASSED: hover overlay-only
   (0 rebuilds), pan 1×38.8ms window rebuild (expected), zoom ×2 = exactly one
   rebuild (1.55 texture-gate crossing), tap/sticker/note all respond <40ms,
   session state survives county round-trip (2 pins + 1 note). Quirk: shell
   "Open Riverside" recovery button is a host-bridge no-op locally (works in
   real ChatGPT; county chips are the instant path). REMAINING: reconcile
   with codex's GAMEPLAY_INVENTORY findings.
3. **User story pass** — REMAINING: review codex's USER_STORY_AUDIT, judge
   gaps, fix blockers. Note the hosted-clawd "Save with ChatGPT / This chat
   is temporary." block in the tray — audit what tapping it does today.

## Then: deploy (user-authorized)

Runbook in `docs/SHIP_READINESS.md`. Short form: `railway up` (or linked
GitHub deploy) of canonical to the existing service
(`atlas-backend-production-e6fc.up.railway.app`; env: ADMIN_PASSWORD,
REDIS_URL, optional ATLAS_CONTACT_EMAIL) → prod validation
(`verify-alpha-public-sanity`, `verify-engine-beta-coverage` vs prod — both
currently red BECAUSE prod is stale; they're the flip signal) → user submits
`chatgpt-app-submission.json` + `assets/brand/atlas-icon-512.png`.

## Standing directives (user, this session — all in memory too)

1. **Highest standards, ChatGPT-native (NS-3).** Crop test vs native ChatGPT
   chrome; code survives first-party review.
2. **Codex (GPT-5.5) is the workhorse, managed radically hard.** Exact-spec
   briefs; adversarial review of its diffs; verify everything it couldn't run
   (its sandbox blocks esbuild + chrome); undeclared deviation = bounce. Its
   misses TODAY: silent zone.density clamp, undeclared product-path deletion,
   desktop copy truncation, undefined `tray` crash in a verifier it rewrote,
   duplicate decision number. All caught in review — keep that posture.
3. **"We are making the USA region"** — every county at the curated bar, not
   just Riverside. This REDEFINED NS-6 (see NORTH_STARS.md). It is the 0.76+
   program: deepen the six archetypes into region-true identity, promote
   parity gates from floors to curated-equivalence, batch-verify all 3,222
   counties (probe: 5.8ms/county, ~780KB scene, 0 budget failures / 120
   sampled — infra scales; `_meta` transport is the watch-item).

## Hard-won operational knowledge (this session)

- `pnpm` is now globally shimmed (`AppData\Roaming\npm\pnpm.cmd` →
  corepack). No more per-call PATH dance.
- One gate per exit code. NEVER pattern-match multiple verifier outputs in
  one pipe — it masked a crashed verifier once today.
- PowerShell: `Start-Process -PassThru` needs `$null = $p.Handle` before
  WaitForExit or ExitCode is null; `Set-Content -Encoding utf8` writes a BOM
  that breaks node JSON.parse (use node to rewrite JSON); git commit with
  embedded double quotes breaks native arg quoting (use `git commit -F file`).
- Browser verifiers race Pixi's async canvas mount — the canvas `waitFor` is
  now in 4 verifiers; add it to any new one.
- Pixi v8: destroying an Application before `init()` resolves crashes the
  resize plugin — the renderer's teardown is now init-aware (CityWorldRenderer
  `destroyApp`/`initComplete`); keep that pattern.
- `artifacts/current-update.json` is FROZEN at the 0.45E state (parked-track
  drift contract). Codex packets keep trying to rewrite it — revert to the
  frozen content every time; per-pass status goes in BUILD_LOG + artifacts.
- The readiness sweep harness lives in the session scratchpad
  (`readiness-sweep*.ps1`) — recreate from SHIP_READINESS's gate list if gone.
- Full-sweep expectation on canonical: 60/82 green + classified reds (list in
  SHIP_READINESS). Anything outside that classification is NEW — investigate.
