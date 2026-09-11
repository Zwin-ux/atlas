/**
 * Atlas cartography: projection, level of detail, and the place index.
 *
 * Everything here is pure and data-only — no DOM, no filesystem, no network —
 * so the same code runs in the build scripts, the server, the widget, and the
 * tests without adaptation.
 */

export {
  boundsOf,
  CONUS_ALBERS,
  CONUS_EXTENT,
  conusProjection,
  EARTH_RADIUS_KM,
  extentOf,
  fitToBox,
  groundDistanceKm,
  INSET_FRAMES,
  INSET_STATE_CODES,
  projectionCenteredOn,
  projectNational,
} from "./projection.js";
export type { AlbersParameters, BoundingBox, Box, LonLat, Point, RegionProjection } from "./projection.js";

export { dropTinyRings, dissolveRings } from "./dissolve.js";
export type { DissolveResult } from "./dissolve.js";

export { quantizeRing, ringAreaDegrees, simplifyClosedRing, simplifyRing } from "./simplify.js";

export { decodeRing, encodedVertexCount, encodeRing } from "./ringCodec.js";
export type { EncodedRing, RingPrecision } from "./ringCodec.js";

export { labelBudget, placeLabels } from "./labels.js";
export type { LabelBox, LabelCandidate, LabelPlacementOptions, PlacedLabel } from "./labels.js";

export { createGazetteer, editDistance, foldName } from "./gazetteer.js";
export type { Gazetteer, GazetteerInput, GazetteerPlace, Resolution } from "./gazetteer.js";

export {
  ATLAS_VIEW_CONTRACT_VERSION,
  fingerprintMapView,
  nextRequestGeneration,
  parseAtlasMapView,
  parseAtlasPlateRef,
  plateFromMapView,
  readHostCapabilities,
  retainDisplayedPlate,
} from "./viewContract.js";
export type {
  AtlasHostCapabilities,
  AtlasMapView,
  AtlasOpenedMapView,
  AtlasPlateRef,
  AtlasPublicPlace,
  AtlasRefusedMapView,
  AtlasSelectedFeature,
  AtlasViewStatus,
  AtlasWidgetView,
} from "./viewContract.js";

export { classifyTownAnchors, countyStem } from "./townTiers.js";
export type { TieredTown, TownAnchorInput, TownTier } from "./townTiers.js";
