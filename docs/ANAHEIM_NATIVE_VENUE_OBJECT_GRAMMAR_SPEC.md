# Anaheim Native Venue Object Grammar Spec

## Decision

E12.14 proved that source-authored SVG assets can enter the production atlas
path with primitive fallback. It did not prove that large source SVGs are the
right main art system for a voxel county engine.

E12.15 shifts the next visual work to native renderer object grammar:
recognizable 2:1 venue construction built from consistent voxel faces,
foundations, roof masses, side faces, and contact rules. Source art remains
allowed only when it fits the same grammar and does not read as pasted onto the
board.

## Scope

Allowed:

- Hidden Anaheim draft scene only.
- `Anaheim Convention Center`, `ARTIC transit center`, `Angel Stadium of
  Anaheim`, and `Platinum Triangle` native object grammar.
- Renderer-native geometry, compiler footprints, atlas fallback metadata, and
  focused tests/verifiers.
- Desktop, mobile `390x844`, and residential-detail screenshot proof.

Not allowed:

- Public Anaheim switcher state, public route, playable claim, place tray,
  sticker tools, note tools, or fake local controls.
- Cars, humans, decorative props, glows, labels-as-art, dashboard panels, or UI
  compensation.
- Provider-normalized claims, public-quality claims, persistence, Hosted Clawd,
  Stripe, XP, evidence, OAuth, automation, reports, or exports.

## Visual Bar

The scene must pass these checks before any promotion conversation:

1. Label-off recognition: at least two major anchors are recognizable before
   reading labels.
2. Silhouette: each venue has a distinct big shape, not just a recolored box.
3. Face separation: top, left, and right faces are visible without black
   outlines.
4. Grounding: buildings sit inside their lot/road context with contact shadows
   and foundation logic.
5. Mobile read: venue type still reads in a `390x844` crop.
6. No compensation: the scene still works with cars, humans, props, glows, and
   extra panels removed.

## Native Grammar Rules

Convention Center:

- Wide low exhibit halls, long roof bands, glass arcade rhythm, entry spine,
  and broad plaza/apron.
- Avoid vertical tower language. It should read as a horizontal venue complex.

ARTIC:

- Long transit shed/vault, ribbed roof, platform edge, and small tower/clock
  accent.
- Avoid making it a generic gym or shop block.

Angel Stadium:

- Low oval/bowl mass, inner field color, tier/ring marks, and gate forecourt.
- Avoid making it a civic rectangle with a label.

Platinum Triangle:

- Dense mixed-use podiums, rowhome/lowrise rhythm, terraces, and walkable lot
  edges.
- Avoid random primary-color blocks.

## Source Art Policy

Source SVG/PNG assets can be kept as inspectable art artifacts, but runtime use
must be rejected if:

- the asset reads pasted-on against native renderer objects;
- anchor/scale cannot be fixed in two attempts;
- it needs labels, props, or UI panels to make sense;
- it breaks mobile read or hides the lot/road system.

The safer default for E12.15 is native geometry first, source asset second.

## E12.15 Runtime Result

The first E12.15 correction moved the Anaheim Convention Center entry-spine
runtime off `building.venue.anaheim_convention_center.v1` and back to native
renderer geometry with regular civic primitive fallback metadata. The source
SVG remains useful as an inspectable critique artifact, but it did not beat the
engine-native object grammar as the production runtime direction.

Screenshot read:

- Better: Convention Center now has more integrated glass, canopy, plaza,
  roof-band, pier, and frontage-bay cues.
- Still weak: recognition still leans too much on labels, especially on mobile.
- Next allowed native target: ARTIC only, because it has a strong parabolic
  transit-hall silhouette.
- Stop rule: if Convention Center plus ARTIC still need labels after one ARTIC
  pass, stop Anaheim visual work and return to a user-visible Riverside or
  product-loop improvement.

## Verification

Required local gates:

```powershell
pnpm test:core
pnpm typecheck:starter
pnpm build:starter
pnpm verify:preview:http
node scripts\verify-anaheim-draft-scene.mjs --screenshots <dir>
node scripts\verify-anaheim-promotion-readiness.mjs --json-only
node scripts\verify-anaheim-object-source-quality.mjs --json-only
node scripts\verify-engine-beta-coverage.mjs
node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only
```

Required screenshot judgment:

- desktop Anaheim draft;
- mobile Anaheim draft;
- residential-detail Anaheim draft;
- Riverside product loop stays green;
- Orange shell and unknown/L0 recovery remain honest and visible.

## Stop Rule

If two major Anaheim anchors still require labels after one bounded native
grammar pass, stop Anaheim visual work. Move the next sprint to a user-visible
Riverside/product-loop improvement instead of continuing the visual tunnel.
