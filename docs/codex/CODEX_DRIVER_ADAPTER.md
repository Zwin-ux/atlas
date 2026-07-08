# Codex Driver Adapter — Atlas 0.76 USA Region

**Purpose:** let a Codex (GPT-5.5) session take over as the **primary driver**
of the 0.76 USA-region archetype program — not just execute one packet, but
own the queue end-to-end — while preserving the factory model's guardrails.
Opus/human remain the taste + final-verify authority; this adapter encodes
everything a Codex driver needs so nothing depends on Opus being in the room.

> If you are Codex and you are reading this, you are the driver now. Read the
> "Boot sequence" then work the queue top-down. Stay inside anti-scope. Leave
> every packet UNCOMMITTED for reviewer verification unless this file's commit
> protocol says otherwise.

---

## Boot sequence (read in this order, every session)

1. `AGENTS.md` — the standing product law, named-slice rule, architecture law,
   anti-scope. Binding. If a packet conflicts with it, STOP and report.
2. `docs/NORTH_STARS.md` — NS-6 is the star this program moves. Every packet
   names its NS and rates before/after honestly.
3. `docs/0.76_USA_REGION_ARCHETYPES.md` — the program: honest baseline, four
   levers, gate-promotion plan, packet sequence.
4. This file — queue, verify recipe, sandbox limits, commit/report protocol.
5. `docs/SHIP_READINESS.md` — the ship state you must not regress (G1–G6 green).

State the current packet, likely files, and anti-scope before substantial
edits (AGENTS.md requirement).

## Ground truth about the codebase

- **Canonical:** `C:\Users\mzwin\Documents\Atlas`, branch
  `codex/integrate-hosted-clawd-fable-058e`. Future engine work branches from
  canonical (the `atlas-53e-fable` worktree is superseded by the merge).
- **Engine lives in `packages/core/src/voxel/`.** Generated-district identity =
  `cityWorldGeneratedDistrictArchetypes.ts` (classifier, zones, roads, terrain)
  + `cityWorldParametricGenerator.ts` (building templates, palettes, landmark).
- **The widget is top-level `web/`** (esbuild → served by `server/` on :8787),
  NOT `apps/`. Generation is CLIENT-side (`generateParametricCityWorldScene`).
- Renderer consumes compiled `CityWorldScene` only. Compiler authors typed
  grammar; renderer never sniffs ids at draw time (0.73F facade contract).

## The queue (RESHAPED 2026-07-07 around the parameter-model spine)

The meta-analysis in `docs/0.76_BACKEND_ARCHITECTURE.md` reshaped this queue:
the spine (0.76-P) lands right after palettes so landmarks/massing/terrain plug
into a real layered model (archetype × region × climate × name) instead of six
flat buckets. The transport slice (0.76-T) runs in PARALLEL — it's orthogonal
to the visual work.

| Order | Packet | File | State |
|--:|---|---|---|
| 1 | 0.76-1 Regional palettes | `packet-0.76-1-regional-palettes.md` | IN REVIEW (Codex landed / reviewer verifying) |
| 2 | 0.76-P Parameter model spine | `packet-0.76-P-parameter-spine.md` | READY (after 0.76-1 verified) |
| 3 | 0.76-2 Region-aware landmarks | `packet-0.76-2-landmarks.md` | QUEUED (now plugs into the spine) |
| 4 | 0.76-3 Massing & zone variants | (author from 0.76 doc Lever 2) | QUEUED |
| 5 | 0.76-4 Terrain features | (Lever 4) | QUEUED |
| 6 | 0.76-5 Gate promotion + batch sweep | (Gate-promotion section) | QUEUED — run last |
| ∥ | 0.76-T Ship parameters, not scenes | (arch doc §5 — client-side compile) | PARALLEL — own gated slice |

Pick the top READY packet. When it lands and is reviewer-verified, promote the
next QUEUED packet to READY by writing its full spec in the same house format
(Repo / Problem / Goal / Approach / Gates / Verify-CAN / Verify-CANNOT /
Deliverable). Do not skip ahead: palettes → spine → region-aware visual levers,
so each later packet is certified against the gates its predecessor added.

## Verify recipe — split by what your sandbox CAN and CANNOT run

**You CAN run (do it, report tails):**
- `pnpm typecheck:starter`
- `pnpm test:core`
- `node scripts/verify-generated-district-parity.mjs`
- any other node-side `scripts/verify-*.mjs` touching generator/scene grammar
- `node --check <file>` for standalone scripts

**You CANNOT run (sandbox blocks esbuild + Chrome — the reviewer runs these;
list them explicitly as reviewer-run in your result note):**
- `pnpm build:web`
- `verify-generated-district-widget.mjs`, `verify-widget-performance.mjs`,
  and every browser/screenshot verifier
- anything that launches a dev server or Pixi canvas

Never pattern-match multiple verifier outputs through one pipe — **one gate
per exit code** (masking a crashed verifier has happened here).

## Windows toolchain (this box — will bite you)

- `pnpm` is globally shimmed (`AppData\Roaming\npm\pnpm.cmd` → corepack); bare
  `pnpm` works. In **git-bash** the `.cmd` shim is invisible — use PowerShell
  for `pnpm`.
- `Set-Content -Encoding utf8` writes a BOM that breaks `JSON.parse` — rewrite
  JSON via a node one-liner.
- `git commit -m` with embedded double quotes breaks native arg quoting — use
  `git commit -F <msgfile>`.
- `artifacts/current-update.json` is FROZEN at the 0.45E state. Do NOT rewrite
  it per-packet; restore the frozen content if you touched it. Per-pass status
  goes in `docs/BUILD_LOG.md` + `artifacts/0.76-*/`.
- Pixi v8: destroying an `Application` before `init()` resolves crashes the
  resize plugin — keep `CityWorldRenderer`'s init-aware teardown.

## Commit / report protocol (per packet)

1. Implement completely. Leave working tree **UNCOMMITTED** for reviewer
   verification (the reviewer runs the esbuild/Chrome gates you cannot).
2. Write `artifacts/0.76-<n>-<slug>/CODEX_RESULT.md`: levers chosen + why,
   before/after metric tails (esp. the gate the packet threatens), files
   touched, verify evidence (CAN-run results + the reviewer-run list), known
   risks, and the honest NS-6 before/after read.
3. Per AGENTS.md "Required After Every Patch": update `docs/BUILD_LOG.md`,
   `docs/NEXT_QUESTS.md`, and `docs/DECISIONS.md` if a durable choice was made.
4. Return: files changed, what works, what was skipped, next packet.

## Guardrails that promote you from executor to driver safely

- **Anti-scope is binding, not advisory.** No new deps / Three.js / provider
  geometry / persistence / money / new MCP tools / public Anaheim-Ontario.
  Curated Riverside/Eastvale scene + props are untouched. If a packet seems to
  need any of these, STOP and report the conflict — do not "solve" it.
- **Undeclared deviation from spec = bounce.** If you change a constant the
  packet did not authorize (e.g. a density clamp, a copy string, a deleted
  surface), you must declare it prominently in CODEX_RESULT with justification.
  Silent changes are the failure mode the reviewer is watching for.
- **Never loosen a quality assertion to make a test pass.** Add a new
  deterministic assertion when you raise a bar; never delete one.
- **Honesty (NS-4) is stop-ship.** Any red on a provider-boundary / banner /
  tool-result-shape guard halts the packet regardless of visual progress.
- **Do not self-resume past your deliverable.** When the packet's deliverable
  is done and reported, STOP. Do not invent the next packet's work or fabricate
  inputs — a prior background agent did exactly that and stacked unsanctioned
  commits. The human/Opus promotes the next packet.

## Reviewer contract (what Opus/human runs after you)

The reviewer runs the esbuild + Chrome gates, judges the visual read against
the NS-1 crop test and NS-6 region-identity, checks your declared deviations,
and either commits the packet or bounces it with specifics. You are not done
until the reviewer confirms — your green node-side gates are necessary, not
sufficient.
