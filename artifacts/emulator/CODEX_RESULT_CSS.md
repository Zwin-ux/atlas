# CODEX_RESULT_CSS

## Scope

- Modified: `web/src/styles.css`
- Added: `artifacts/emulator/CODEX_RESULT_CSS.md`
- Not touched: TSX files, loop logs, split guards, BUILD_LOG, NEXT_QUESTS, DECISIONS, or other docs.

## Deletion Count

- `web/src/styles.css` line count changed from 3,579 to 2,223.
- Net file reduction: 1,356 lines.

Removed chunks:

- Early hosted-clawd maroon modal block: 270 lines.
- Early hosted-clawd mobile overrides: 31 lines.
- Backend console hosted-clawd clay block: 923 lines.
- Backend console hosted-clawd mobile overrides: 132 lines.

## Deleted Top-Level Selectors

Early maroon hosted-clawd modal:

- `.city-world-hosted-clawd`
- `.city-world-hosted-clawd-windowbar`
- `.city-world-hosted-clawd-head`
- `.city-world-hosted-clawd-close`
- `.city-world-hosted-clawd-state`
- `.city-world-hosted-clawd-gates`
- `.city-world-hosted-clawd-save-strip`
- `.city-world-hosted-clawd-saved-shelf`
- `.city-world-hosted-clawd-setup`
- `.city-world-hosted-clawd-local`
- `.city-world-hosted-clawd-save-slots`
- `.city-world-hosted-clawd-saved-list`
- `.city-world-hosted-clawd-motion-rail`
- `.city-world-hosted-clawd-stage-buttons`
- `.city-world-hosted-clawd-stage-button`
- `.city-world-hosted-clawd-foot`
- `.city-world-hosted-clawd-primary`
- `.city-world-hosted-clawd-action-message`

Backend console clay system:

- `.city-world-hosted-clawd`
- `.city-world-hosted-clawd > *`
- `.city-world-hosted-clawd-windowbar`
- `.city-world-hosted-clawd-head`
- `.city-world-hosted-clawd-section-head`
- `.city-world-hosted-clawd-copy`
- `.city-world-hosted-clawd-save`
- `.city-world-hosted-clawd-save-strip`
- `.city-world-hosted-clawd-local`
- `.city-world-hosted-clawd-save-slots`
- `.city-world-hosted-clawd-motion-rail`
- `.city-world-hosted-clawd-setup`
- `.city-world-hosted-clawd-stage-buttons`
- `.city-world-hosted-clawd-stage-button`
- `.city-world-hosted-clawd-recovery`
- `.city-world-hosted-clawd-billing`
- `.city-world-hosted-clawd-billing-head`
- `.city-world-hosted-clawd-billing-steps`
- `.city-world-hosted-clawd-saved-shelf`
- `.city-world-hosted-clawd-saved-head`
- `.city-world-hosted-clawd-saved-list`
- `.city-world-hosted-clawd-dot`
- `.city-world-hosted-clawd-foot`
- `.city-world-hosted-clawd-primary`
- `.city-world-hosted-clawd-action-message`
- `.city-world-hosted-clawd-gates`

Deleted keyframes and animation-only overrides:

- `@keyframes city-world-hosted-clawd-clay-settle`
- `@keyframes city-world-hosted-clawd-slot-pop`
- `@keyframes city-world-hosted-clawd-rail-tick`
- Reduced-motion override for the deleted hosted-clawd clay animations.
- Mobile overrides that only styled deleted hosted-clawd clay/backend-console classes.

## Cross-Reference Proof

Post-deletion classname cross-reference:

```json
{
  "beforeCssClassCount": 121,
  "afterCssClassCount": 106,
  "tsxClassLiteralCount": 123,
  "lostUsedDefinitionCount": 0,
  "lostUsedDefinitions": [],
  "currentMissingCount": 33,
  "hostedCssCount": 19,
  "hostedUnused": [],
  "hostedClayBgReferences": 0,
  "clayKeyframeReferences": 0
}
```

Notes:

- `lostUsedDefinitionCount: 0` is the gate: no TSX-referenced classname that had a definition before this edit lost its only CSS definition.
- `currentMissingCount: 33` is unchanged pre-existing coverage outside this deletion pass.
- Remaining hosted-clawd CSS classes exactly match hosted-clawd TSX literals used by the live bottom sheet.
- `--hosted-clay-bg` has zero remaining references.

## Selectors Kept

No uncertain dead selectors were kept.

Deliberately kept because they are live or outside the dead clay system:

- `.city-world-hosted-clawd-open`
- The live achromatic bottom-sheet block near the end of `web/src/styles.css`
- `.city-world-recovery-action`
- `.city-world-shell.has-preview .city-world-zoom`

## Local Verification

- Classname before/after cross-reference: passed.
- Clay token/keyframe grep: passed, zero matches for `--hosted-clay-bg`, clay keyframes, `hosted-setup`, hosted-clawd windowbar/billing/recovery/local/motion-rail/copy/dot/foot/gates selectors.
- `git diff --check -- web/src/styles.css`: passed.

## Reviewer-Run

- `pnpm build:web` - blocked in this sandbox; reviewer should run.
- `pnpm verify:emulator:audit` - reviewer should run.
