# Atlas Pastel Voxel Lab

Standalone visual lab for testing cleaner Atlas voxel houses away from the
production server, MCP tools, Railway deploy path, persistence, and current
Pixi renderer.

Open:

```text
experiments/voxel-pastel-lab/index.html
```

Design target:

- Simple authored house cuboids before decorative detail.
- 2:1 orthographic isometric projection.
- Pastel face palettes: top, left, and right colors are deliberately separate.
- Ambient occlusion/contact shadows under every object.
- No humans, cars, roads, civic markers, water, plaza props, or trees in this
  lab pass.
- Larger houses, stronger gable silhouettes, quiet plot pads, and readable
  wall/roof face ramps.
- Terrain is only a neutral stage so the house quality cannot hide behind
  clutter.

Primary spec:

- `OBJECT_KIT_SPEC.md` defines the common Atlas module vocabulary for houses,
  regular buildings, stores, roads, lots, terrain support, markers, acceptance
  gates, and the next build sequence.

Research notes:

- MagicaVoxel's official site documents baked exports with ambient occlusion and
  soft shadow; the lab fakes that direction in canvas through face shading and
  contact shadows.
- Lospec's isometric pixel art tutorial index points at light-source and color
  discipline; the lab uses separate palette ramps instead of one flat green map.
- Voxelmade describes MagicaVoxel as a lightweight voxel editor with an
  integrated renderer; the product implication is that our engine needs an
  artist-authored block kit, not endless procedural surface garnish.

Honest critique:

The current production renderer improved the asset pipeline but still looks too
procedural. This lab now starts with the smallest honest target: house shape,
lighting, palette, and camera. Nothing here is wired to production until the
houses beat the current renderer on taste without using roads, cars, people, or
props as distraction.
