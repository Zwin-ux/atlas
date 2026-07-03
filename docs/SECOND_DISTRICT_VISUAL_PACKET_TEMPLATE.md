# Second District Visual Packet Template

Owner: Lumen - Art Captain / Voxel-Engine Captain.

Use this with `scripts/verify-second-district-visual-packet.mjs` and
`docs/SECOND_DISTRICT_VISUAL_ACCEPTANCE_BAR.md`. The goal is to make Anaheim,
Ontario, or later district visual promotion hard to fake: a reviewer must
provide screenshots plus explicit no-label reads before public playability can
be considered.

## Packet Directory Shape

Create one packet directory per district review. The verifier expects these
exact filenames:

```text
riverside-baseline-desktop-1280x720.png
riverside-baseline-mobile-390x844.png
<district>-desktop-1280x720.png
<district>-mobile-390x844.png
<district>-detail-desktop-1280x720.png
<district>-detail-mobile-390x844.png
<district>-no-label-anchor-1.png
<district>-no-label-anchor-2.png
shell-state-desktop-1280x720.png
shell-state-mobile-390x844.png
visual-review.json
```

Before assembling a packet, verify the hidden draft scene shape:

```powershell
pnpm build:starter
node scripts\verify-second-district-draft-scene.mjs --anchor-pack data\district_place_anchor_packs\anaheim-anchors.json --json-only
node scripts\verify-second-district-draft-scene.mjs --anchor-pack data\district_place_anchor_packs\ontario-anchors.json --json-only
```

The draft-scene verifier does not approve pixels. It confirms the scene stays
hidden and non-playable, reports object/road counts, catches Anaheim/Ontario
grammar leakage, and prints the screenshot names plus visual-packet commands a
reviewer should use next.

For E15+ hidden drafts, the verifier also reports `grammarFamilies` and keeps
`visualReadiness: "requires-screenshot-review"`. Counts and grammar markers
only prove the engine emitted the right object families; public promotion still
requires no-label screenshots where at least two anchors read from silhouette,
roof massing, facade rhythm, foundation/contact, and road/lot grounding before
labels are considered.

Example:

```powershell
node scripts\verify-second-district-visual-packet.mjs --district anaheim --print-template > C:\path\to\packet\visual-review.json
node scripts\verify-second-district-visual-packet.mjs --district anaheim --screenshots C:\path\to\packet --json-only
```

To normalize screenshots from existing harness output into the packet shape:

```powershell
node scripts\prepare-second-district-visual-packet.mjs --district anaheim --source C:\path\to\anaheim-screenshots --source C:\path\to\riverside-baseline --source C:\path\to\shell-state --out C:\path\to\packet
node scripts\verify-second-district-visual-packet.mjs --district anaheim --screenshots C:\path\to\packet --json-only
```

For a district without defaults:

```powershell
node scripts\verify-second-district-visual-packet.mjs --district ontario --print-template --target-anchor "Ontario airport/logistics edge" --target-anchor "Ontario commerce/civic core" > C:\path\to\packet\visual-review.json
```

The preparer also supports explicit file overrides such as
`--candidateDesktop`, `--candidateMobile`, `--noLabelAnchor1`, and
`--shellStateMobile` when source harness names do not match the default
patterns.

## Review JSON Rules

`visual-review.json` must include:

- `districtSlug`
- `outcome`
- `promotionReady`
- `publicPlayable`
- exactly two `targetAnchors`
- `firstThreeSecondRead.desktop`
- `firstThreeSecondRead.mobile`
- `firstThreeSecondRead.detail`
- exactly two `noLabelRecognition` entries
- all filler flags
- `p0Blockers`
- `p1Backlog`
- `smallestNextSlice`

The generated template intentionally defaults to:

- `outcome: "HIDDEN_DRAFT_ONLY"`
- `promotionReady: false`
- `publicPlayable: false`
- no-label reads set to `FAIL`
- `labelDependentIdentity: true`

Do not flip these to passing values unless the screenshots prove object
identity before labels.

For Anaheim, the first no-label pair is:

- Anaheim Convention Center: must read as a long glass convention hall/campus.
- ARTIC / Angel Stadium area: must read as transit hub and/or venue district
  from barrel shell, platform/track, bowl/field, or tier grammar.

For Ontario, the first no-label pair is:

- Ontario International Airport: must read as airport/logistics edge.
- Ontario Mills / commerce core: must read as commercial edge, not generic
  boxes.

## Outcome Meanings

`PASS_FOR_PUBLIC_PROMOTION`:
Both anchors read before labels on desktop, mobile, and detail camera, and the
data/product/split gates are green.

`HIDDEN_DRAFT_ONLY`:
The packet is useful as internal evidence, but at least one anchor still needs
labels or the district is not promotion-ready.

`BLOCK_VISUAL_TUNNEL`:
One bounded visual pass failed to improve no-label recognition enough. Return
effort to public product-loop quality or a different blocker.

`HARD_FAIL`:
The packet shows fake playability, provider claims, UI compensation, props,
cars, humans, panels, or public state drift.

## Lumen Cutline

If the no-label anchor crops do not make the object family recognizable, the
district stays hidden. A complete packet is not the same thing as visual
approval.
