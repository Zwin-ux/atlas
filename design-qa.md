# Atlas Commons map radar — design QA

- Source visual truth: `C:\Users\mzwin\.codex\generated_images\019f822c-00f0-7210-9c18-db89598e1ed9\exec-7e8acaa0-7440-4f38-afe7-1f3ac9afc731.png`
- Desktop implementation: `C:\Users\mzwin\Documents\Atlas-national-roads\artifacts\emulator\atlas-commons-desktop-final.png`
- Mobile implementation: `C:\Users\mzwin\Documents\Atlas-national-roads\artifacts\emulator\atlas-commons-mobile-final.png`
- Full-view comparison: `C:\Users\mzwin\Documents\Atlas-national-roads\artifacts\emulator\atlas-commons-design-comparison.png`
- Focused strip comparison: `C:\Users\mzwin\Documents\Atlas-national-roads\artifacts\emulator\atlas-commons-strip-comparison.png`
- Viewports: desktop widget 1280x720; mobile widget 390x844
- State: Riverside/Eastvale, Commons ALL + HOT, one selected moderated note, public composer collapsed

## Findings

- No actionable P0/P1/P2 findings remain.
- [P3] The implementation keeps Atlas's existing light clay-map tokens instead of copying the concept's dark satellite treatment. This is intentional: the concept is the interaction and density target, while the shipped Pixi scene and current token system remain the product's visual source of truth.
- [P3] Desktop strip metadata is denser than the concept. It remains readable at the target viewport and preserves more than 85% visible map area, so no enlargement is required for this slice.

## Required fidelity surfaces

- Fonts and typography: existing Atlas UI stack retained; mode/sort labels, place title, note body, byline, pager, and policy copy remain distinct and readable. No broken wrapping or truncation is visible at either target viewport.
- Spacing and layout rhythm: the interaction hierarchy matches the source direction — compact layer controls, spatial beacons, one anchored note, and one bottom action strip. Desktop visible-map ratio is 0.854. Mobile collapsed visible-map ratio is 0.795.
- Colors and visual tokens: existing warm clay map, achromatic controls, hairline borders, and restrained elevation are internally consistent. Active controls retain the concept's high-contrast black treatment without adding gradients or glow.
- Image quality and asset fidelity: the real Atlas Pixi map remains sharp and full-screen. No source logo, illustration, or product imagery was replaced with placeholder/CSS art. The concept's satellite map is treated as directional reference, not a missing production asset.
- Copy and content: public/private boundaries are direct and visible; posting requires a separate review state; note text and pseudonymous handles use realistic data.

## Interaction and accessibility evidence

- Tested ALL/NEARBY/MINE presence, HOT/NEW selection, next-note cycling, Useful state, collapsed composer, text entry, explicit review, and Post publicly transition to MINE/pending.
- Mobile has zero horizontal overflow and every persistent Commons action measures at least 44x44.
- Desktop and mobile console error/warning checks returned empty.
- Public mode contains exactly one selected-note article and no feed list.

## Comparison history

1. Initial desktop comparison found a P1 collision between the selected-place sticker and anchored note caption. The caption was shifted clear of the sticker/beacon. Post-fix evidence: `atlas-commons-desktop-final.png` and `atlas-commons-design-comparison.png`.
2. Initial mobile comparison found a P2 density failure: the collapsed strip left only 0.700 visible-map area. The mobile head was removed from the strip, note copy was clamped to two lines, policy/action layout was compacted, and all controls were normalized to 44px. Post-fix evidence: `atlas-commons-mobile-final.png`; measured visible-map ratio is 0.795 with 390px client/scroll width parity.

## Implementation checklist

- [x] Map remains the primary canvas.
- [x] Aggregate one public beacon per place in the renderer.
- [x] Show exactly one selected public note with Prev/Next.
- [x] Keep HOT/NEW and ALL/NEARBY/MINE compact and keyboard-reachable.
- [x] Keep the public composer collapsed until explicitly opened.
- [x] Preserve explicit public/private and moderation copy.
- [x] Pass desktop/mobile browser verifier and console checks.

final result: passed
