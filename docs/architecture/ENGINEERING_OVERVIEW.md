# Atlas Engineering Overview

Atlas is a ChatGPT-native voxel county engine. External providers may help
resolve what a user means, but Atlas owns readiness, scene compilation, and the
rendered world.

## Boundary

```txt
Provider lookup or curated source pack
-> @atlas/geo normalized signals
-> provider usage policy
-> @atlas/core readiness and world rules
-> VoxelScene / CityWorldScene compiler
-> React/Pixi widget
```

Provider responses are not Atlas scenes. Google lookup is not playable county
readiness. The renderer consumes compiled scene contracts only.

## Current Public Truth

- Riverside/Eastvale is the only public playable proof cell.
- California shells are indexed but not playable.
- Unknown counties are unsupported.
- Anaheim/Ontario candidate work remains hidden and non-public.
- Public notes, pins, and lookup results are session-only.

## Active Update

Pre-Alpha 0.1E - Provider Boundary Update.

Engineering promise: no renderer component imports provider APIs, and no
provider result becomes permanent map geometry or readiness proof without a
separate Atlas readiness gate.
