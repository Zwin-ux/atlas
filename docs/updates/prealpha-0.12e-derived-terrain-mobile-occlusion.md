# Pre-Alpha 0.12E - Derived Terrain Maps / Mobile Occlusion

## Decision

0.12E turns the external voxel-reference work into Atlas-owned engine code.
Instead of importing VoxCity, VoxelSpace, Pixels2Voxels, GameBlocks, Three,
Rapier, Python, or Open3D, Atlas now derives height/color maps and mobile
occlusion reports from compiled `CityWorldScene`.

This is an engine-theory slice, not an art pass. It gives Axiom, Lumen, Mira,
and Forge a measured way to decide whether future work should target terrain,
object density, camera framing, or product mobile readability.

## Scope

- Extend `@atlas/core/voxel` with derived terrain-map and mobile-occlusion
  diagnostics.
- Keep the renderer and public UI unchanged.
- Verify Riverside playable, Orange shell, Anaheim hidden draft, and Ontario
  hidden draft without making hidden districts public.
- Add focused tests and verifiers so future visual density cannot crowd the
  mobile product loop without a measurable signal.

## Acceptance

- Public Riverside derived terrain reports meaningful height/color variation,
  object occupancy, and water-edge signal.
- Riverside normal mobile stays readable while reporting tray-safe-band,
  marker, object-footprint, and vertical-stack pressure.
- Orange shell reports zero object occupancy and no fake playable geometry.
- Anaheim/Ontario hidden drafts stay non-public and non-playable.
- No external voxel runtime dependency, provider geometry, renderer rewrite,
  public debug UI, public Anaheim/Ontario promotion, paid scope, or persistence.

## Next Decision

0.13E should use the new reports to choose one measured correction:

- if mobile occlusion regresses, enforce mobile LOD and tray-safe-band budgets;
- if derived maps show weak terrain or edge signal, return to terrain/world-edge
  correction;
- if object occupancy is strong but recognition stays weak, add face-orientation
  and source-art contrast diagnostics before another object-art pass;
- if product comprehension regresses, hand the next slice to Mira.
