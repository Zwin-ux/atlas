# Axiom Big 4 Wakeup Protocol

Status: active operating contract.

Purpose: keep Axiom from missing real worker handoffs and keep Atlas moving
through artifact-sized work. This is an internal coordination contract, not a
public product feature.

## Real Threads

- Axiom: current GM thread.
- Forge: `019f1be1-9914-7aa2-94b1-c5e920dadec1`.
- Lumen: `019f1a00-39c1-7330-a256-79564ba0cdb1`.
- Mira: `019f1a01-72d8-7122-9087-c071313f4ee3`.

Do not create local Mira, Forge, or Lumen clones. If coordination is needed,
send work to the real threads and read their latest handoffs in small chunks.

## Automation Contract

The active wakeups are:

- `atlas-captain-light-reorg-wakeup`: light reorg every 3 hours.
- `atlas-captain-full-power-mobilization`: full artifact loop every 12 hours.

Both wakeups must run from:

`C:\Users\mzwin\Documents\Atlas-alpha-path-b-rc`

If an automation points at the mixed `Atlas` tree, treat it as stale before
accepting any wakeup result.

## Full-Power Read Order

1. `git status --short` in the RC worktree.
2. `docs/NEXT_QUESTS.md` top section.
3. `docs/BUILD_LOG.md` tail.
4. Latest 1-2 turns from Forge, Lumen, and Mira with `includeOutputs=false`.
5. Current sentinels:
   - `node scripts\verify-big4-artifact-packets.mjs --json-only`
   - `node scripts\verify-second-district-readiness.mjs --district anaheim-candidate --json-only`
   - `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`

If any thread read is truncated, retry with a smaller `turnLimit`. Do not
summarize from stale memory while a real thread can be read.

## Thread Bridge Unavailable Fallback

If the Codex app does not expose `read_thread` / `send_message_to_thread` tools
during a wakeup, Axiom must not invent Forge, Lumen, or Mira reports and must
not spawn local role clones. The allowed fallback is:

1. Record the missing thread bridge as a blocker in the wakeup summary.
2. Run the local sentinels from the read order.
3. Produce or refresh one local integration artifact that does not overlap a
   worker lane, such as the second-district readiness export.
4. Leave crew assignments as unsent, with the exact objective ready for the real
   worker threads once the bridge is available.

The fallback may guide the next owner decision from verified local artifacts,
but it cannot count as worker acceptance.

## Current Artifact State

- Forge E15.1 is the readiness backbone:
  `scripts/verify-second-district-readiness.mjs`.
- Lumen E15.2 is the visual-engine packet:
  `docs/SECOND_DISTRICT_VOXEL_GRAMMAR_PACKET.md`.
- Mira E15.3 is the product language proof:
  `docs/CHATGPT_ENTRY_SURFACE_PROOF.md`.
- Axiom validates the packet shape with:
  `scripts/verify-big4-artifact-packets.mjs`.

The current readiness posture is deliberate:

- Riverside/Eastvale is the only playable public district.
- Anaheim and Ontario have candidate/draft data, but
  `readyForPlayablePromotion` remains `false`.
- Missing gates are visual packet/product proof/release acceptance, not county
  identity or compiler proof.
- Latest local Axiom readiness export path:
  `artifacts/second-district-readiness/latest/anaheim-candidate`.

## Railway And GitHub Use

Railway is available for the Atlas backend, but Axiom must not mutate Railway,
deploy, change variables, or add routes just to improve internal coordination.
Read-only Railway checks are allowed when they help release safety.

GitHub is authenticated on the machine, but the RC worktree currently does not
have a remote configured. Do not create a repo, push, or open issues unless
Axiom decides that external project tracking is now the best communication
surface and the human is aware.

Recommended future path if internal communication still fails:

1. Forge builds a local `artifacts/axiom-status/latest.json` exporter from the
   Big 4 sentinel, readiness aggregators, git status, and Railway status.
2. Axiom reviews it locally.
3. Only after that, decide whether a Railway read-only status endpoint or a
   GitHub issue board is worth adding.

## Dispatch Standard

Every worker assignment must be artifact-sized:

- objective
- allowed files
- anti-scope
- verification
- report format

Gate-only reports are acceptable only after a worker has built an artifact or
Axiom explicitly asks for a final pass/fail.

## Next Artifact Cycle

- Forge: E15.4 readiness artifact writer and source-to-scene export.
- Lumen: E15.5 no-label crop packet and anchor recognition decision.
- Mira: E15.6 golden prompt product proof that the readiness aggregator can
  consume.
- Axiom: integrate those artifacts and decide whether Anaheim keeps advancing
  or the second-district visual lane is blocked by object-art quality.
