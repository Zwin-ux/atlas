# 0.76-1 Baseline — Archetype Identity Sweep (pre-palette)

Captured by the reviewer (Opus) via `node scripts/verify-archetype-identity-sweep.mjs`
on the current build, BEFORE the regional-palette packet lands. This is the
objective "before" number the 0.76-1 work must move.

## Index coverage — 3,222 counties classified (all six reachable)

| Archetype | Counties | Share | Example |
|---|--:|--:|---|
| metro_grid | 1,323 | 41.1% | Autauga County, AL |
| coastal_grid | 675 | 20.9% | Aleutians East Borough, AK |
| prairie_town | 608 | 18.9% | Adair County, IA |
| mountain_valley | 277 | 8.6% | Adams County, CO |
| river_town | 234 | 7.3% | Butler County, AL |
| desert_basin | 105 | 3.3% | Apache County, AZ |

## Palette distinctness — **FAILS (the gap, quantified)**

- Building body+roof fingerprints are ~29–34 colors each, drawn from the same
  global kind-keyed pools.
- **Worst pair: `desert_basin ~ mountain_valley = 0.886` Jaccard** (gate ≤ 0.50).
  A desert county and a mountain county share ~89% of their building colors —
  the "six templates × jitter" failure, measured.

## Perf at scale — PASS

- 120-county sample: **4.39 ms/county mean, 0 budget failures** (gate ≤ 20 ms).
  Confirms the infrastructure scales to the full index.

## Gates (this run)

| Gate | Result |
|---|---|
| archetype_coverage (6/6 reachable) | PASS |
| palette_distinctness (worst ≤ 0.50) | **FAIL — 0.886** |
| perf_at_scale (≤20ms, 0 fail) | PASS |
| verifier_teeth (fires on identical palettes) | PASS |

**Exit target after 0.76-1:** worst-pair Jaccard ≤ 0.50 (regional palettes),
all four gates green after a `packages/core` rebuild.
