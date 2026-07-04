# Asset Intake Index

Status: standalone lab source index. These files are source candidates, not a
production renderer port.

## Accepted Lab Sources

| Key | File | Frame | Footprint | Current production stance |
| --- | --- | --- | --- | --- |
| `building.house.rowhome.flat_parapet.v1` | `assets/building-house-rowhome-flat_parapet.v1.svg` | `420x300` | `2.46 x 1.08` tiles | Rowhome-only proof is the only allowed production intake pattern. |
| `building.store.strip.three_bay.v1` | `assets/building-store-strip-three_bay.v1.svg` | `470x320` | `2.94 x 1.28` tiles | Parked until rowhome/contact grammar pass. |
| `road.corner.two_lane.v1` | `assets/road-corner-two_lane.v1.svg` | `330x250` | `2.2 x 2.2` tiles | Parked until road/lot/terrain contact grammar pass. |

## Quality Rules

- Keep the source transparent.
- Preserve the 2:1 isometric footprint.
- Include contact shadow only inside the apparent footprint.
- Keep top, left, and right face separation.
- Do not rely on signs, labels, cars, humans, trees, glows, or UI markers.
- Do not broaden the module set from this index.

## Production Intake Rule

If a production intake is reopened, use one key only and preserve primitive
fallback. The target building or road module must be controlled and reversible.
If it looks pasted on after at most two manifest-only scale/anchor adjustments,
disable the runtime sprite use and keep fallback.

## Related Files

- `docs/design/ATLAS_REFERENCE_ASSET_PACKET.md`
- `docs/design/atlas-reference-asset-manifest.json`
- `docs/brain/THREE_ASSET_PRODUCTION_INTAKE_SPEC.md`
- `docs/brain/ROAD_LOT_TERRAIN_CONTACT_GRAMMAR_SPEC.md`
- `REFERENCE_BAR_DECISION.md`
- `ACTUAL_ASSET_AUTHORING_HANDOFF.md`
