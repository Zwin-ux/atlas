# Pre-Alpha 0.6F - Engine Diagnostics / Theory Harness

## Why this exists

0.2E through 0.6E added real scene grammar, but screenshot review became too
blunt. The engine now needs a debug layer that can say why a scene is stronger
or weaker before another renderer pass starts.

0.6F makes `CityWorldScene` measurable. It does not replace screenshot review,
but it prevents screenshots from becoming the only proof.

## Engine report

`analyzeCityWorldScene` produces a machine-readable report for each compiled
city-world scene:

- terrain massing and terrain-authorship coverage;
- empty-board ratio and focal feature density;
- first-viewport composition for desktop, mobile, and detail cameras;
- building-to-lot and lot-to-road contact coverage;
- object-family coverage;
- residential clone pressure;
- no-label anchor counts;
- sprite/fallback coverage;
- hard boundary blockers for fake playability, provider payloads, cars,
  walkers, decorative props, public hidden-draft state, pins, or actors.

Use:

```powershell
node scripts\debug-city-world-engine.mjs --out C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-06f-engine-diagnostics --json-only
```

The command writes:

- `city-world-engine-diagnostics.json`
- `city-world-engine-diagnostics.md`

## Debug overlay

`?atlasDebug=engine` enables a dev-only overlay in the Pixi renderer. It shows
terrain massing, road lines, lot footprints, object-family outlines, and anchor
tags. It is off by default and is not public product UI.

## Current diagnostic read

The first 0.6F run reports zero hard blockers. Riverside still points at
terrain massing as the weakest axis, with useful supporting numbers:

- terrain massing coverage: about 33.4%;
- empty-board ratio: about 33.5%;
- first-viewport composition floor: about 57.2%;
  - desktop: about 86.2%;
  - mobile: about 63.1%;
  - residential detail: about 57.2%;
- building/lot contact: 100%;
- lot/road contact: about 80.5%;
- home clone pressure: about 20%.

That is a better engineering signal than another subjective screenshot note.

## Next decision

Future visual-engine slices must name the metric they intend to move. If a
slice cannot move density, contact, terrain massing, clone pressure, no-label
readiness, or fallback safety, it should not run.
