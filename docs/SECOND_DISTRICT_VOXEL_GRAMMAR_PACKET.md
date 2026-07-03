# Second District Voxel Grammar Packet

Owner: Lumen - Art Captain / Voxel-Engine Captain.

Status: E15.5 no-label crop packet decision. This is not public promotion
approval.

## Purpose

This packet records the current native voxel grammar decision for hidden
second-district drafts. It exists to stop Anaheim or Ontario from becoming
public because a compiler passed or a label explained a weak object. The visual
bar is object-first: a human should recognize the district-defining anchor from
silhouette, massing, material, and ground contact before reading a label.

## Current Scope

Target district:
Anaheim hidden draft first.

Primary no-label anchor pair:

- Anaheim Convention Center.
- ARTIC / Angel Stadium area.

Comparative hidden stressor:
Ontario remains useful as a second grammar stressor for airport/logistics,
commerce/civic core, residential variety, and road/lot contact. It is not
public and not playable.

Anti-scope honored:
No public Anaheim/Ontario switcher state, public route, playable claim, provider
claim, cars, humans, decorative props, clouds, glows, panels, dashboards,
persistence, Hosted Clawd, paid scope, Stripe, XP/evidence, OAuth, automation,
reports, exports, or deploy.

## Grammar Decisions

The hidden draft renderer now treats draft buildings as object families instead
of isolated named boxes.

Required grammar families:

- `large_venue_hall`: long low hall massing, broad roof fields, glass or arcade
  run, layered hall contact, forecourt/foundation.
- `transit_hub`: barrel or shed read, rib/diagrid rhythm, platform/track edge,
  end portals, transit-adjacent grounding.
- `stadium_bowl`: low broad bowl footprint, tier bands, field/infield cue, gate
  apron.
- `mixed_use_edge`: podium/lowrise rhythm, residential/commercial facade bays,
  less generic block repetition.
- `commercial_edge`: strip/storefront bay rhythm, parapet edge, apron contact,
  restrained glass/awning geometry.
- `airport_logistics_edge`: long terminal/apron grammar, control tower cue,
  road/lot edge contact, restrained runway/platform lines.
- `civic_core`: civic steps, roof hierarchy, forecourt, formal contact.
- `residential_variety`: rowhome/ranch/lowrise mix with stoops, windows, and
  parcel contact.

Renderer rule:
These families may add native geometry only when it improves massing,
face separation, material logic, or ground contact. They may not add props or
UI compensation.

Compiler rule:
Second-district draft profiles must differ by district. Ontario cannot reuse
Anaheim venue positions, Anaheim road IDs, or Anaheim anchor-building IDs.

## Evidence

E15.2 Anaheim hidden draft screenshots:

- Desktop:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-e152-hidden-draft-voxel-grammar\anaheim-draft-desktop-1280x720.png`
- Mobile:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-e152-hidden-draft-voxel-grammar\anaheim-draft-mobile-390x844.png`
- Detail camera:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-e152-hidden-draft-voxel-grammar\anaheim-draft-residential-detail-1280x720.png`

E15.5 canonical no-label packet:

- Packet root:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-e155-anaheim-no-label-packet`
- Hidden no-label draft root:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-e155-anaheim-no-label`
- Public baseline/shell root:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-e155-no-label-coverage`
- Packet verifier:
  `node scripts\verify-second-district-visual-packet.mjs --district anaheim --screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-e155-anaheim-no-label-packet --json-only`

Draft verifier summaries:

- Anaheim: `playable: false`, 875 terrain tiles, 6 roads, 5 lots, 17 buildings,
  5 places, 0 props, 0 pins, 0 actors. Grammar families include
  `large_venue_hall`, `transit_hub`, `stadium_bowl`, `mixed_use_edge`, and
  `civic_core`.
- Ontario: `playable: false`, 875 terrain tiles, 7 roads, 5 lots, 14 buildings,
  5 places, 0 props, 0 pins, 0 actors. Grammar families include
  `airport_logistics_edge`, `commercial_edge`, `residential_variety`, and
  `civic_core`.

## No-Label Recognition Verdict

Verdict:
`VISUAL_READINESS_FALSE`

Reason:
E15.5 proves the blocker instead of arguing around it. The hidden screenshot
harness can now suppress map labels with `atlasNoLabels=1` and capture desktop,
`390x844` mobile, desktop detail, mobile detail, and two anchor crops. The
result still does not clear public promotion. Convention Center reads partially
as a long glass hall/campus in the detail crop, but it is not unmistakable on
mobile. ARTIC / Angel Stadium area reads as an interesting blue-roof venue
cluster, not as a clearly recognizable transit/stadium anchor before labels.

What passes:

- Hidden state stays honest: no public playability, no pins, no actors, no
  selected-place tray.
- The object families are more distinct than E14.2.
- The grammar is native renderer geometry, not pasted source-art stickers.
- Anaheim and Ontario are no longer duplicate placeholder scenes.
- The proof mode is honest: labels are hidden before no-label crops are
  captured, and the packet includes public Riverside baseline plus Orange shell
  screenshots for regression context.

What fails:

- 0.8E improves the no-label two-anchor read enough for a hidden-draft packet,
  but not enough for public promotion.
- The mobile and mobile-detail screenshots still look proof-grade rather than
  public-quality second-district art.
- The broad green board and shell overlay still weaken first-three-second
  district comprehension.
- Venue material specificity is better but still below public-quality object
  art.

Promotion rule:
Do not promote Anaheim or Ontario until a visual packet includes no-label crops
where two anchors pass on desktop, `390x844` mobile, and detail camera.

## Required Commands

Hidden draft scene checks:

```powershell
node scripts\verify-second-district-draft-scene.mjs --anchor-pack data\district_place_anchor_packs\anaheim-anchors.json --json-only
node scripts\verify-second-district-draft-scene.mjs --anchor-pack data\district_place_anchor_packs\ontario-anchors.json --json-only
```

Visual packet template:

```powershell
node scripts\verify-second-district-visual-packet.mjs --district anaheim --print-template --target-anchor "Anaheim Convention Center" --target-anchor "ARTIC / Angel Stadium area"
```

Visual packet verification once screenshots/crops exist:

```powershell
node scripts\verify-second-district-visual-packet.mjs --district anaheim --screenshots <packet-dir> --json-only
```

## E15.5 No-Label Packet Commands

No-label draft screenshots and crops:

```powershell
node scripts\verify-anaheim-draft-scene.mjs --url "http://127.0.0.1:<port>/preview?atlasNoLabels=1" --screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-e155-anaheim-no-label --no-label-crops
```

Canonical packet assembly:

```powershell
node scripts\prepare-second-district-visual-packet.mjs --district anaheim --source C:\Users\mzwin\AppData\Local\Temp\atlas-e155-anaheim-no-label --source C:\Users\mzwin\AppData\Local\Temp\atlas-e155-no-label-coverage --out C:\Users\mzwin\AppData\Local\Temp\atlas-e155-anaheim-no-label-packet --target-anchor "Anaheim Convention Center" --target-anchor "ARTIC / Angel Stadium area" --overwrite-review
```

Packet verification:

```powershell
node scripts\verify-second-district-visual-packet.mjs --district anaheim --screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-e155-anaheim-no-label-packet --json-only
```

## Next Lumen Artifact

Do not continue a broad Anaheim polish tunnel from this packet. If visual work
reopens, the next artifact must be either:

- a one-anchor authored/native silhouette pass for the weakest no-label crop,
  with before/after crops proving the read improved; or
- a deliberate stop that returns visual energy to public Riverside/product-loop
  trust.

Recommended blocker if Axiom asks for another visual-engine artifact:
ARTIC / Angel Stadium area needs stronger object-family separation. It cannot
stay a shared blue-roof venue cluster; transit shed, stadium bowl, and road/lot
grounding need to separate at mobile size before any public promotion
discussion.

Stop line:
The 0.8E no-label packet passes as `HIDDEN_DRAFT_ONLY`, not as public
promotion. Keep Anaheim hidden, keep `promotionReady: false`, keep
`publicPlayable: false`, and do not add cars, humans, props, panels, glows, or
broader district UI to compensate.

## 0.8E Result

Evidence packet:
`C:\Users\mzwin\AppData\Local\Temp\atlas-e08-second-district-visual-packet`.

Outcome:
`HIDDEN_DRAFT_ONLY`.

What improved:

- Anaheim Convention Center reads as a long hall/campus mass before labels.
- ARTIC / Angel Stadium area now separates transit-shed language from stadium
  bowl/field language.
- The hidden draft still exposes no public playable state, no pins, no actors,
  no selected-place tray, no sticker tools, and no note input.

What remains blocked:

- Anaheim is not public-quality.
- Anaheim must not appear in the public county switcher as playable.
- Any next Anaheim work must be source-object authorship for the same two
  anchors, not broader district polish or visual clutter.
