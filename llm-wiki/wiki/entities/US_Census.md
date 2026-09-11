---
title: US Census
type: entity
created: 2026-09-10
updated: 2026-09-10
sources: [agents-md]
tags: [data, census]
---

# US Census

Atlas geography is US Census geography. County outlines, water, and town
anchors come from Atlas-owned Census packs, not live Google or Mapbox.

Primary runtime index: `data/census/us-county-town-anchors.json`.
`docs/STATUS.md` records working-tree totals of 3,222 counties and 21,155
places as of 2026-08-26; HEAD at `b6f2f821` still had 18,447 places. Always
read the JSON totals rather than copying a number from this page.

County geo packs live under `data/geo-packs/`. Progressive TIGER roads are
enhancement at NEAR zoom only and must not block board open. Full national
road trees do not belong in git as the long-term path.

## Related

- [[Location_Truth]]
- [[Current_Product]]
