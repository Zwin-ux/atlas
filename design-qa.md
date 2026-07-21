# Atlas Commons map radar — design QA

## Evidence

- Source visual truth: `C:\Users\mzwin\.codex\generated_images\019f822c-00f0-7210-9c18-db89598e1ed9\exec-7e8acaa0-7440-4f38-afe7-1f3ac9afc731.png`
- Browser-rendered desktop implementation: `artifacts/emulator/atlas-commons-browser/atlas-commons-desktop-outer-1360x900-inner-1280x720.png`
- Browser-rendered mobile implementation: `artifacts/emulator/atlas-commons-browser/atlas-commons-mobile-outer-430x1000-inner-390x844.png`
- Full-view comparison evidence: `artifacts/emulator/atlas-commons-design-comparison.png`
- Focused comparison evidence: `artifacts/emulator/atlas-commons-strip-comparison.png` (bottom public-note strip; no additional focused pass needed for the map canvas because the full-view pass exposes the beacon, selected note, controls, and map hierarchy together)
- Matched viewports: desktop 1280x720 inner widget and mobile 390x844 inner widget, light theme, Riverside/Eastvale, Commons ALL + HOT, one selected moderated note, public composer collapsed
- Browser QA capture: Chrome browser-rendered screenshots above; the canonical 8787 server was also smoke-opened during this pass and reported the emulator shell, while the committed browser captures remain the authoritative Commons render because they were taken with the configured Commons demo asset origin.

## Fidelity review

- Fonts and typography: Atlas UI stack is consistent across controls, selected-note copy, byline, pager, and policy text. Weight and line-height preserve hierarchy; no broken wrapping or truncation appears at either matched viewport.
- Spacing and layout rhythm: the map remains the dominant surface. Compact layer controls, place beacons, one anchored note, and the single bottom action strip retain the source interaction hierarchy. The desktop map stays at 0.854 visible-area ratio; mobile stays at 0.795 with no horizontal overflow.
- Viewport resilience: desktop and mobile keep controls reachable and separated from the selected note. Mobile collapses the strip without collision; persistent Commons actions remain at least 44x44.
- Colors and tokens: the shipped light clay-map palette, achromatic controls, hairline borders, and restrained elevation are internally consistent. Active states use high-contrast black without gradients or glow.
- Image quality and asset fidelity: the real Pixi map is sharp and fills the canvas. No placeholder logo, illustration, or CSS-art substitute is used. The dark satellite concept remains a directional interaction/density reference, not a runtime asset.
- Copy and content: public visibility, moderation, private-note boundaries, realistic pseudonymous handles, and the explicit review step are clear and visually legible.
- Icons and controls: expand, zoom, locate, useful, report, pager, and compose controls are aligned and visually consistent; no missing icon state was observed.
- States and interactions: ALL/NEARBY/MINE, HOT/NEW, next-note cycling, Useful, composer open/input/review, and Post publicly → MINE/pending were exercised by the browser verifier. Console errors and warnings were empty.
- Accessibility: keyboard-reachable controls and labels are present; mobile tap targets meet the 44px floor; text remains readable without clipped regions.

## Findings

- No actionable P0/P1/P2 findings remain.
- [P3] The implementation intentionally keeps Atlas’s light clay-map tokens instead of copying the concept’s dark satellite treatment. The concept is used for interaction and density pressure; the shipped Pixi scene and token system remain the product source of truth.
- [P3] Desktop strip metadata is denser than the concept. It remains readable at the target viewport and preserves more than 85% visible map area, so no enlargement is warranted for this slice.

## Comparison history

1. Initial desktop comparison found a P1 collision between the selected-place sticker and anchored-note caption. The caption was shifted clear of the sticker/beacon; post-fix evidence is `atlas-commons-desktop-final.png` plus `atlas-commons-design-comparison.png`.
2. Initial mobile comparison found a P2 density failure: the collapsed strip left only 0.700 visible-map area. The mobile head was removed, note copy was clamped to two lines, policy/action layout was compacted, and controls were normalized to 44px; post-fix evidence is `atlas-commons-mobile-final.png` and the committed browser mobile capture.
3. Follow-up design-qa pass (2026-07-21): source and matched desktop/mobile browser captures were opened together and rechecked against the five required fidelity surfaces. No new P0/P1/P2 mismatch was found; no code change was required.

## Implementation checklist

- [x] Map remains the primary canvas.
- [x] Aggregate one public beacon per place in the renderer.
- [x] Show exactly one selected public note with Prev/Next.
- [x] Keep HOT/NEW and ALL/NEARBY/MINE compact and keyboard-reachable.
- [x] Keep the public composer collapsed until explicitly opened.
- [x] Preserve explicit public/private and moderation copy.
- [x] Pass desktop/mobile browser verifier and console checks.

final result: passed
