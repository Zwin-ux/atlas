# Post-Alpha 0.25E - Owner Gate Closure / Public Promotion Cutline

## Summary

0.25E is the decision slice after the 0.24E readiness aggregator. It does not
make Anaheim public by default. It forces the remaining owner gates into a
binary result:

- **Promote path:** Anaheim earns a controlled public playable spike only after
  Lumen, Mira, Forge, and Axiom gates all pass with evidence.
- **Block path:** Anaheim stays hidden and Atlas returns to public Engine Beta
  quality work instead of forcing a fake second district.

The current 0.24E aggregator state is useful but not enough for promotion:

- Source/data evidence: passed.
- Hidden draft proof: passed.
- Visual packet: passed as evidence, not promotion-ready.
- Product proof: passed as boundary evidence, not public-playable.
- Split guard: passed.
- `readyForPlayablePromotion`: `false`.

## Product Cutline

Public users still only play Riverside/Eastvale unless Anaheim clears every
owner gate. Anaheim may not appear as a public switcher state, playable county,
selected-place tray, pins, actors, session notes, Scout/Campaign target, or
route-exposed public scene until 0.25E closes cleanly.

Allowed public truth during 0.25E:

- Riverside/Eastvale is playable now.
- Orange/Anaheim is indexed or hidden candidate evidence only.
- Lookup can find nearby places but does not save, unlock coverage, or create a
  playable map.
- Scout/Campaign remain session-only previews.

Blocked public truth:

- Anaheim is playable.
- Anaheim has public local places.
- Google/provider lookup proves readiness.
- Hidden draft screenshots are public-quality proof.
- Hosted Clawd, persistence, Stripe, XP, evidence, OAuth, automation, reports,
  or exports exist.

## Owner Artifacts

### Lumen: Public-Promotion Visual Verdict Packet

Build a promotion-specific visual verdict from the existing public visual
packet, not another broad art pass.

Required output:

- A machine-readable review that can set only one of:
  - `PASS_FOR_PUBLIC_PROMOTION`
  - `HIDDEN_DRAFT_ONLY`
  - `BLOCK_VISUAL_TUNNEL`
  - `HARD_FAIL`
- Explicit no-label read for:
  - Anaheim Convention Center
  - ARTIC / Angel Stadium area
- Desktop, mobile, and detail verdicts for each anchor.
- One of two decisions:
  - `lumenAcceptance: true` only if public promotion is visually defensible.
  - `lumenAcceptance: false` with the single next visual blocker.

Pass bar:

- Both anchors read before labels on desktop and `390x844` mobile.
- The district reads as one physical voxel map, not a card over a background.
- No cars, humans, decorative props, glows, panels, or labels doing the work.

### Mira: Public-Playable Product Proof

Build a product proof for what the public ChatGPT app would show if Anaheim
were exposed. This can be a proof plan or hidden harness; it cannot expose
public UI until the gate passes.

Required output:

- Product proof JSON that distinguishes:
  - current boundary proof;
  - public-playable proof;
  - Mira acceptance.
- Confirmation that a normal user understands in 3 seconds:
  - Riverside is playable now;
  - Anaheim is either still hidden or clearly playable;
  - shell counties do not get fake controls;
  - lookup is not saved and not coverage proof.
- Mobile proof plan for `390x844`.

Pass bar:

- `publicPlayable: true` only if the public surface has a clear Anaheim entry,
  recovery path, and no fake save/XP/evidence/automation language.
- `miraAcceptance: true` only after desktop/mobile product proof exists.

### Forge: Release And Split Acceptance

Turn split safety into a release acceptance object, not a verbal note.

Required output:

- `forgeAcceptance: true | false`.
- Exact split guard output.
- Exact forbidden-path audit:
  - package/lock/env;
  - server/provider drift;
  - DB/persistence;
  - Hosted Clawd;
  - Stripe/XP/evidence/OAuth/automation/reports/exports;
  - public Anaheim/Ontario exposure.
- Railway deploy risk note if a public playable spike is proposed.

Pass bar:

- Strict `engine-beta-data` split guard has `0 blockers` and `0 unknowns`.
- No forbidden scope enters the promotion candidate.
- No deploy command is run until Axiom accepts the promotion cutline.

### Axiom: Final Cutline

Axiom integrates the owner packets and updates the aggregator result. Axiom has
only two valid outcomes:

1. **Approve controlled 0.26E spike:** all owner gates pass, the aggregator has
   no blockers, and the next slice can implement a controlled public Anaheim
   playable spike.
2. **Block promotion:** one or more gates remain blocked, Anaheim stays hidden,
   and the next slice becomes public Engine Beta quality or a focused hidden
   source-art correction.

There is no third path where Anaheim becomes public because metadata changed.

## Required Aggregator Behavior

`scripts/verify-second-district-readiness.mjs` remains the source of truth. A
0.25E run must report:

- `sourceVerifier: passed`
- `visualPacket: passed | failed`
- `productProof: passed | failed`
- `splitGuard: passed | failed`
- grouped blockers under:
  - `data`
  - `visual`
  - `product`
  - `release`
- `readyForPlayablePromotion: false | true`

`readyForPlayablePromotion` may become `true` only when:

- data blockers are empty;
- visual blockers are empty;
- product blockers are empty;
- release blockers are empty;
- promotion packet readiness is true;
- owner acceptance fields are true;
- Axiom records the final promotion decision.

## Implementation Order

1. Generate or reuse the latest public visual packet.
2. Generate or reuse the latest ChatGPT product proof.
3. Add owner acceptance fields only as explicit artifacts, not inferred comments.
4. Run the readiness aggregator with those artifacts.
5. If the aggregator still blocks, update the blocker log and stop.
6. If the aggregator clears, define 0.26E as a controlled public spike with no
   extra scope.

## Verification

Minimum commands:

```powershell
pnpm --dir packages/core test
pnpm typecheck:starter
pnpm build:starter
node scripts\verify-second-district-readiness.mjs --district anaheim-candidate --visual-packet <packet-dir> --product-proof <proof-json> --json-only
node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only
```

If public UI is touched, also run:

```powershell
pnpm verify:preview:http
pnpm verify:mcp
pnpm verify:submission
node scripts\verify-engine-beta-coverage.mjs
```

## Automatic Rejection

Reject 0.25E if it:

- flips Anaheim metadata to playable without owner gates;
- exposes Anaheim in the public switcher before approval;
- claims provider-normalized or public-quality coverage from lookup;
- adds cars, humans, filler props, glows, panels, or dashboard UI;
- leaks internal terms into public copy;
- changes the seven-tool MCP list;
- opens DB, Hosted Clawd, persistence, Stripe, XP, evidence, OAuth,
  automation, reports, or exports.

## Next Slice Decision

If all owner gates pass:

- Next slice: `0.26E Controlled Anaheim Public Playable Spike`.

If any owner gate fails:

- Next slice: either `0.26E Public Engine Beta Quality Pass` or a single hidden
  source-art blocker named by Lumen.

