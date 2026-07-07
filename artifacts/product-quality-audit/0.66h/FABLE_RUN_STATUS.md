# Fable Run Status - 0.66H Professor Audit

Date: 2026-07-05

Status: completed after delayed write, with browser timing still blocked.

## What was launched

Prompt:
`docs/design/fable-prompts/PRODUCT_QUALITY_PROFESSOR_AUDIT_0.66H.md`

Target output:

- `artifacts/product-quality-audit/0.66h/FABLE_PRODUCT_QUALITY_AUDIT.md`
- `artifacts/product-quality-audit/0.66h/metrics.json`

Live preview:
`http://127.0.0.1:8787/preview`

## What happened

Claude Code with `--model fable` was available, but the first background launch
started idle instead of consuming the prompt.

The first non-interactive launch failed because `--add-dir` consumed the prompt
text as an extra directory argument.

The corrected stdin launch began real work and produced artifacts, then appeared
to hang during browser/performance automation. The process had to be stopped to
restore local shell responsiveness. After control returned, the final report was
present on disk.

A second bounded no-browser relaunch also timed out. A final no-tool health
check exited with code 0 but returned empty stdout, so this shell should not be
trusted for Claude stdout. The reliable output from this run is the filesystem
artifact, not terminal stdout.

## Final Fable artifact

- `artifacts/product-quality-audit/0.66h/FABLE_PRODUCT_QUALITY_AUDIT.md`

Result:

- Grade: D+ / 46 out of 100.
- Completion estimate: about 52%.
- Primary blocker: `web/src/PixiVoxelSceneView.tsx` rebuilds the Pixi scene on
  pan/zoom/hover instead of retaining the scene graph and moving the container.
- Next implementation slice: `0.66H-a Retained scene graph (pan/zoom must be
  free)`.

## Artifacts produced by Fable / follow-up measurement

- `artifacts/product-quality-audit/0.66h/screens/desktop-1280x720-rest.png`
- `artifacts/product-quality-audit/0.66h/screens/mobile-390x844-rest.png`
- `artifacts/product-quality-audit/0.66h/scratch/pixi-probe.js`
- `artifacts/product-quality-audit/0.66h/scratch/frame-pan.js`
- `artifacts/product-quality-audit/0.66h/fable-launch-prompt.txt`
- `artifacts/product-quality-audit/0.66h/FABLE_PRODUCT_QUALITY_AUDIT.md`
- empty logs:
  - `artifacts/product-quality-audit/0.66h/fable-run.log`
  - `artifacts/product-quality-audit/0.66h/fable-run.err.log`

## Important run lesson

The browser/performance portion of the professor audit is likely the part that
blocked. The next launch should avoid open-ended browser control and instead
run a small deterministic measurement script from Codex or Node first, then ask
Fable to grade from the resulting screenshots and metrics.

## Recommended next attempt

1. Do not rerun the professor audit unless new code lands.
2. Use `artifacts/product-quality-audit/0.66h/FABLE_PRODUCT_QUALITY_AUDIT.md`
   as the source of truth for 0.66H-a.
3. If a later Fable run is needed, prefer a no-browser prompt with
   `artifacts/product-quality-audit/0.66h/FABLE_NO_BROWSER_GRADING_PACKET.md`
   and inspect filesystem outputs instead of waiting on stdout.

## Deterministic evidence added after the failed run

- `artifacts/product-quality-audit/0.66h/metrics.json`
- `artifacts/product-quality-audit/0.66h/FABLE_NO_BROWSER_GRADING_PACKET.md`
- `artifacts/product-quality-audit/0.66h/measure-atlas-product-quality.mjs`

The CDP measurement script still exceeded the outer timeout, so
`metrics.json` intentionally marks first-visible-map, interactive timing, and
pan-frame timing as unknown. It does record payload, source-pressure, and
screenshot evidence.
