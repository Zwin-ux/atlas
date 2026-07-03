# Pre-Alpha 0.7E - Terrain / World-Edge Massing Correction

## Why this exists

0.6F proved Atlas needed metric-driven engine work. Riverside passed hard
boundaries, but the playable scene still measured as too flat: terrain massing
was the weakest axis and the mobile/detail camera scores were held back by
quiet board area.

0.7E corrects that through structural terrain grammar, not props or extra
objects.

## What changed

- Expanded public Riverside massing fields around residential shelves, Eastvale
  Core, commercial apron, park basin, waterfront edge, and the outer world
  boundary.
- Kept the existing `CityWorldScene` terrain profiles; no new public state,
  provider geometry, or county promotion was added.
- Strengthened renderer treatment for terrain chunks with darker side faces,
  clearer edge shelves, and more visible strata on structural edges.
- Kept broad interior shelves quieter than hard edges so the map does not turn
  into noisy stroke work.
- Locked the 0.7E diagnostic floor in core tests.

## Metric result

Riverside diagnostics after 0.7E:

- terrain massing coverage: about 67.4%;
- empty-board ratio: about 20.2%;
- mobile first-viewport score: about 71.9%;
- desktop first-viewport score: about 96.9%;
- residential-detail score: about 77.5%;
- building/lot contact: 100%;
- lot/road contact: about 80.5%;
- hard blockers: zero.

## Browser proof

Evidence root:

`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-07e-terrain-massing-coverage`

Debug overlay proof:

`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-07e-terrain-massing-debug-overlay`

## Next decision

0.7E passes the terrain/world-edge metric gate. The next slice should not
continue generic terrain tuning unless a new diagnostic target is named. The
strongest next candidate is no-label object / anchor recognition for hidden
districts, or another metric-backed pass if Lumen identifies a sharper
Riverside blocker.
