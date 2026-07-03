# Pre-Alpha 0.3E - Object Authorship

## Status

Local integrated artifact. No staging, commit, deploy, backend, persistence, or
paid scope.

## Product Promise

Riverside/Eastvale should read less like generic colored blocks and more like a
small authored voxel town. The first 3 seconds should show clearer building
categories: civic landmark, residential fabric, commerce strip, service block,
and lowrise/apartment cluster.

## Engineering Contract

0.3E extends `CityWorldScene` visual grammar with object-authorship metadata:

- `objectFamily`
- `clusterRole`
- `noLabelPriority`

The renderer consumes those profiles to add object-family details, but the
renderer still only consumes compiled `CityWorldScene` data. It does not read
provider payloads, Google internals, county readiness metadata, or product
state directly.

## Public Riverside Scope

Included:

- Eastvale Core civic landmark massing and base/entry/roof hierarchy.
- Residential kit rhythm for cottages, ranches, and rowhomes.
- Sprite-backed rowhome and strip-store foundation/contact cues.
- Commerce-strip bay rhythm and awning/sign-mount geometry.
- Service-block and lowrise/apartment window/entry/foundation rhythm.

Excluded:

- cars, humans, decorative props, glows, or panels;
- new public places;
- new county switcher states;
- backend, provider, paid, persistence, XP, evidence, OAuth, automation,
  reports, or exports.

## Hidden Draft Scope

Anaheim and Ontario remain hidden draft only. Their draft buildings can carry
internal no-label priority so screenshot packets can judge whether major
anchors read before labels. This is not a public claim and not playable
promotion.

Protected hidden anchor families:

- Anaheim Convention Center: `venue_anchor`
- ARTIC transit center: `transit_anchor`
- Angel Stadium: `venue_anchor`
- Platinum Triangle: `lowrise_cluster`
- Ontario International Airport: `transit_anchor`
- Ontario Mills: `commerce_strip`

## Verification

Required 0.3E checks:

- `node scripts\verify-object-authorship-scene-grammar.mjs`
- `node scripts\verify-roads-roofs-scene-grammar.mjs`
- `node scripts\verify-no-google-in-renderer.mjs`
- `node scripts\verify-provider-boundaries.mjs`
- `node scripts\verify-tool-result-shape.mjs`
- `pnpm test:core`
- `pnpm typecheck:starter`
- `pnpm build:starter`
- `pnpm verify:preview:http`
- `node scripts\verify-engine-beta-coverage.mjs`
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`

Current local screenshot roots:

- `C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-03e-object-authorship-coverage`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-03e-object-authorship-residential-detail`

## Pass / Block

Pass when:

- Riverside desktop, mobile, and residential-detail screenshots show stronger
  object-family read without clutter.
- Orange shell and Unknown L0 recovery remain honest and visible.
- Anaheim/Ontario remain hidden and non-playable.
- Provider-boundary checks remain green.

Block when:

- the pass adds props, panels, labels, cars, or humans to hide weak object art;
- hidden draft no-label priority leaks into public UI;
- provider lookup becomes map geometry or readiness proof;
- Anaheim/Ontario become public/playable by metadata flip;
- mobile map/tray comprehension regresses.

## Next Update

Default next update: `Pre-Alpha 0.4E - No-Label Anchor Recognition`.

The next hard visual problem is not another small Riverside polish pass. It is
whether hidden candidate district anchors can be recognized before labels. If
Anaheim still fails, choose between better source art for the top anchors or a
different candidate district path.
