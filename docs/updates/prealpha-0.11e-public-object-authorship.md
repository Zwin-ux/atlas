# Pre-Alpha 0.11E - Public Object Authorship

## Decision

0.10E terrain/world-edge work clears the current measured floor, so the next
visible product weakness is public Riverside object identity. 0.11E focuses on
existing public buildings instead of hidden Anaheim/Ontario drafts or another
terrain pass.

## Scope

- Strengthen Eastvale Core, residential homes, rowhomes, strip-store/commerce,
  apartment/lowrise, and service/gym category read.
- Use existing `CityWorldScene` object-family grammar.
- Preserve 0.10E terrain floors, provider isolation, shell honesty, and hidden
  Anaheim/Ontario non-public status.

## Acceptance

- Riverside first-read shows stronger landmark and building-category identity.
- `terrainMassingCoverageRatio >= 0.72`.
- `emptyBoardRatio <= 0.18`.
- `firstViewportCompositionScore >= 0.75`.
- `homeClonePressure <= 0.20`.
- Desktop/mobile object-family viewport presence remains covered.
- No public Anaheim/Ontario exposure, provider geometry, product behavior
  change, cars, humans, props, glows, panels, paid scope, or persistence.

## Next Decision

After 0.11E screenshots and diagnostics, choose the next measured axis:

- continue public object authorship only if first-read building identity still
  blocks the map;
- move hidden Anaheim source-object authorship only if public Riverside is
  stable enough;
- return to terrain only if chunk-edge readability or screenshots regress;
- assign Mira product-surface work only if mobile comprehension regresses.
