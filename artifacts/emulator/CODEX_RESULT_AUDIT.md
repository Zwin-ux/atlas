# Emulator Product Audit Harness

Touched files:

- `scripts/verify-emulator-audit.mjs`
- `package.json`
- `artifacts/emulator/CODEX_RESULT_AUDIT.md`

What the harness does:

- Runs the production `/emulator` surface through runtime-resolved generated county archetypes plus Riverside.
- Adds the dedicated `orange-ca` shell desktop/light CTA roundtrip cell.
- Captures Runtime and Log error entries before navigation.
- Checks delivered state, iframe horizontal overflow, generated honesty copy, single-canvas structure, mobile CDP touch pan/pinch/tap behavior, mobile touch target sizes, generated draft payload size, graphics count, and the shell-to-Riverside CTA route.
- Writes `artifacts/emulator/audit/report.json`, `artifacts/emulator/audit/REPORT.md`, and clipped iframe screenshots named `<county>-<viewport>-<theme>.png` when the audit is run.
- Exits non-zero when any fail-level check is emitted. Warn-level checks stay visible in both reports but do not fail the process.

Uncertainties and boundaries:

- The full audit was not run here because it requires Chrome plus a live Atlas server serving `/emulator` and `/mcp`.
- Screenshot clipping uses the emulator iframe bounds with the CDP clip scale set from `window.devicePixelRatio`, so mobile captures preserve the 390x844 frame at device-scale output.
- The `--theme` argument is explicit: when provided, it applies to all selected counties. Without it, the default bounded matrix runs light/dark only for Riverside and the generated metro archetype, and light only for the other generated counties.

Reviewer run list:

1. `pnpm build:core`
2. Start the Atlas server, for example `pnpm dev`
3. `node scripts/verify-emulator-audit.mjs --url http://127.0.0.1:8787`
4. Or `pnpm verify:emulator:audit -- --url http://127.0.0.1:8787`
5. Narrow as needed with `--county <slug>`, `--viewport desktop|mobile|both`, and `--theme light|dark|both`.

Verification run during this implementation:

- `node --check scripts/verify-emulator-audit.mjs`
- Matrix-resolution smoke via `packages/core/dist/index.js`
