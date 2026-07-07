# Fable No-Browser Grading Packet - 0.66H

Use this packet when Claude/Fable browser automation is unstable.

## Prompt

Read:

- `docs/design/fable-prompts/PRODUCT_QUALITY_PROFESSOR_AUDIT_0.66H.md`
- `artifacts/product-quality-audit/0.66h/metrics.json`
- `artifacts/product-quality-audit/0.66h/FABLE_RUN_STATUS.md`

Screenshots:

- `artifacts/product-quality-audit/0.66h/screens/desktop-1280x720-rest.png`
- `artifacts/product-quality-audit/0.66h/screens/mobile-390x844-rest.png`
- `artifacts/hosted-clawd/postalpha-0.65h-browser-proof/hosted-clawd-auth-required-desktop-1280x720.png`
- `artifacts/hosted-clawd/postalpha-0.65h-browser-proof/hosted-clawd-auth-required-mobile-390x844.png`

Write:

- `artifacts/product-quality-audit/0.66h/FABLE_PRODUCT_QUALITY_AUDIT.md`

Do not run browser automation. Do not edit product code. Grade from the prompt,
metrics, screenshots, and repo inspection only.

## Evidence summary

Payload:

- Preview HTML: 1,082,674 bytes.
- `web/dist/component.js`: 1,002,155 bytes.
- `web/dist/component.css`: 80,199 bytes.

Source pressure:

- `web/src/styles.css`: 3,451 lines.
- `city-world-hosted-clawd` selector mentions: 253.
- `backdrop-filter` mentions: 10.
- `box-shadow` mentions: 59.
- gradient mentions: 22.
- `web/src/CityWorldRenderer.tsx`: 5,803 lines.
- renderer pointer-move mentions: 5.
- renderer Pixi/filter mentions: 17.

Unknowns:

- First visible map timing.
- Time to interactive.
- Pan/zoom frame timing.

Reason unknown:
The Fable browser pass and the first Codex CDP measurement both hung during
browser/performance automation. Mark this as a QA tooling blocker, not as a
pass.

## Required stance

Be neutral and blunt. Treat the human D+ grade as plausible unless the evidence
clearly disproves it. Do not say the app is product-ready because tests pass.

The report must explain:

- why this feels laggy or unfinished,
- what is proven versus only suspected,
- what percentage is real by subsystem,
- the next three implementation slices,
- the exact first coding prompt for 0.66H.

