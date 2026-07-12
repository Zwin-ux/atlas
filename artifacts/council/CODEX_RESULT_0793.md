# CODEX RESULT 0.79-3

## Scope

Fence held for source changes: added `scripts/pick-challenge-sample.mjs` and this result note only. No git add, commit, or push.

## Strata Definition

The sampler builds the county universe from `US_COUNTY_INDEX`, `US_COUNTY_FACTS`, `createDeterministicGeneratedDistrictSpec`, and `resolveCountyParameters` from `packages/core/dist`.

Each county resolves to one stratum:

`archetype x urbanizationTier x waterFactBand x censusDivision`

Ledger priority is:

1. hard-case anchors first, regardless of stratum
2. never-sampled strata
3. sampled strata with the oldest last-seen ISO week
4. deterministic week-seeded tie-break

## 2026-W28 Sample

`node scripts/pick-challenge-sample.mjs --week 2026-W28 --dry-run`

1. `kalawao-hi`
2. `aleutians-east-borough-ak`
3. `loving-tx`
4. `orleans-parish-la`
5. `larimer-co`
6. `lawrence-in`
7. `ascension-parish-la`
8. `kootenai-id`
9. `greene-mo`
10. `centre-pa`
11. `grand-isle-vt`
12. `rio-grande-co`
13. `susquehanna-pa`
14. `baltimore-md`
15. `winnebago-wi`
16. `jefferson-ny`

Ready command:

```sh
node scripts/verify-emulator-audit.mjs --county kalawao-hi --county aleutians-east-borough-ak --county loving-tx --county orleans-parish-la --county larimer-co --county lawrence-in --county ascension-parish-la --county kootenai-id --county greene-mo --county centre-pa --county grand-isle-vt --county rio-grande-co --county susquehanna-pa --county baltimore-md --county winnebago-wi --county jefferson-ny
```

## Ledger Format

Default path: `artifacts/visual-score/sample-ledger.json`.

Shape:

```json
{
  "version": 1,
  "sampleSize": 16,
  "generatedBy": "scripts/pick-challenge-sample.mjs",
  "hardCaseAnchors": ["kalawao-hi", "aleutians-east-borough-ak", "loving-tx", "orleans-parish-la"],
  "strataDefinition": {
    "fields": ["archetype", "urbanizationTier", "waterFactBand", "censusDivision"],
    "key": "archetype=<value>|tier=<value>|water=<value>|division=<value>"
  },
  "countyCount": 3222,
  "totalStrata": 238,
  "lastWrittenWeek": "2026-W28",
  "strataSeen": {
    "archetype=...|tier=...|water=...|division=...": ["2026-W28"]
  },
  "samplesByWeek": {
    "2026-W28": [
      {
        "countySlug": "kalawao-hi",
        "stratum": "archetype=coastal_grid|tier=frontier|water=very_high|division=pacific",
        "reason": "hard-case-anchor"
      }
    ]
  }
}
```

`--dry-run` prints the sample and audit command without writing the ledger.

## Gates

- `node --check scripts/pick-challenge-sample.mjs`: pass.
- `node scripts/pick-challenge-sample.mjs --week 2026-W28 --dry-run` twice: identical.
- `node scripts/pick-challenge-sample.mjs --week 2026-W29 --dry-run`: different 16-county sample.
- Ledger write at default path, then same-week dry run: shifted priorities; `strataSeen=15` because the two Pacific frontier hard anchors share one stratum; cleanup removed the generated ledger to keep the repo fence clean.
- `pnpm typecheck:starter`: pass.

## Risks

- Same-week re-runs after a ledger write intentionally rotate away from newly seen strata, except fixed anchors.
- The sampler depends on built `packages/core/dist`; stale dist will produce stale sample decisions.
- Anchor counties can duplicate strata. That is intentional because the hard cases are county-level anchors, not a unique-stratum quota.
