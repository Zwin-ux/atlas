# Atlas National Engine Production Contract

Status: `0.69H US County Index Import / Nationwide Shells`.

Atlas cannot be called production-ready for "anywhere in the US" until the
engine satisfies a staged, source-backed contract. Eastvale/Riverside remains
the public playable proof cell. The national engine work expands the engine
contract without pretending every county is public-quality.

## Production Ladder

### P0 - Sourced US County Identity

Every county or county-equivalent Atlas can name must come from a sourceable
county index. 0.69H satisfies this identity gate for the 2024 Census national
county gazetteer: 3,222 county/equivalent rows across 52 state/territory codes.

Gate:
- Census-backed national county index.
- State count is national, not a California fixture.
- County/equivalent count is source-derived.
- Slugs, GEOIDs, state codes, names, and centroids are verified.

### P1 - Honest County Shells Everywhere

Every indexed county must render an honest shell before it has local playable
content. Shells are browse-only. They cannot borrow Riverside places, labels,
Scout data, campaign context, pins, actors, roads, lots, or buildings. 0.69H
satisfies this shell gate for indexed non-Riverside counties.

Gate:
- `select_county` and `render_voxel_county` return shell coverage for indexed
  non-playable counties.
- Shell `CityWorldScene` has no invented places, pins, actors, notes, or
  generated local claims.
- Unsupported slugs remain `L0_UNSUPPORTED`.

### P2 - Deterministic Generated Districts

For counties without curated packs, Atlas needs deterministic generated district
specs. These are not provider geometry. They are typed scene plans: bounded
grid, land-use zones, road seeds, lots, buildings, terrain, object-kit metadata,
and windowed render packets.

Gate:
- The generator takes a typed spec and seed.
- Generated districts compile through shared `CityWorldScene` enrichment.
- The generator creates roads, zones, lots, buildings, terrain, places, and
  camera presets without live provider geometry.
- Desktop and `390x844` proof is required before promotion.

### P3 - Provider-Normalized Local Anchors

Lookup data can become local anchors only after category, attribution, cache,
field-mask, and safety policies pass. Provider lookup is not coverage readiness
by itself and does not directly create renderer geometry.

Gate:
- Provider results are normalized into Atlas categories.
- Raw payloads do not leak to structured content.
- Sources, TTLs, and attribution are attached.
- Anchor promotion is separate from playable promotion.

### P4 - Public-Quality Playable Counties

A county becomes public-quality only after scene proof, visual proof, product
proof, split guard, provider boundary guard, and owner acceptance. Public
playable claims require explicit promotion.

Gate:
- Coverage tier reaches `L4_PUBLIC_QUALITY`.
- Desktop and mobile screenshots pass.
- Renderer windowing keeps payloads bounded.
- Public tools remain stable.
- Human owner gate approves promotion.

## Current Truth

Current Atlas is not production-ready for every US county. It has:

- National county identity index: 3,222 Census county/equivalent rows.
- National shell coverage: 3,221 non-playable shell counties.
- Riverside/Eastvale: one playable public proof cell.
- Orange/Anaheim and San Bernardino/Ontario: hidden or shell/draft lanes only.
- A parametric generator seam that can support generated districts, but it is
  not yet a production deterministic district contract for arbitrary counties.

## Next Build Slice

`0.70H Deterministic Generated District Specs`.

That slice should convert sourced county identity into bounded deterministic
generated district specs. It must keep provider data out of geometry, keep scene
packets windowed, and keep public playable promotion behind visual/product
proof.
