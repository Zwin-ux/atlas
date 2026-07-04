import type {
  CityWorldBuilding,
  CityWorldObjectKitMetadata,
  CityWorldObjectKitPaletteRole,
  CityWorldObjectKitPrefabFamily,
  CityWorldScene,
} from "./cityWorldTypes.js";
import { analyzeCityWorldScene } from "./cityWorldDiagnostics.js";

export type CityWorldObjectKitFamilyMetric = {
  prefabFamily: CityWorldObjectKitPrefabFamily;
  count: number;
  paletteRoleCount: number;
  roofBodySeparationFloor: number;
  clonePressure: number;
  landmarkSignatureScore: number | null;
};

export type CityWorldObjectKitReport = {
  type: "cityWorldObjectKitReport";
  update: "postalpha-0.34e-public-object-kit-prefab-palette-contract";
  sceneId: string;
  playable: boolean;
  counts: {
    buildings: number;
    prefabAssigned: number;
    homes: number;
    cloneGroups: number;
  };
  distributions: {
    prefabFamilies: Record<string, number>;
    paletteRoles: Record<string, number>;
  };
  metrics: {
    prefabCoverageRatio: number;
    paletteCohesionRatio: number;
    roofBodySeparationRatio: number;
    clonePressureRatio: number;
    landmarkSignatureScore: number;
    terrainMassingCoverageRatio: number;
    emptyBoardRatio: number;
    firstViewportCompositionScore: number;
    buildingLotContactRatio: number;
    lotRoadContactRatio: number;
  };
  weakestPrefabFamily: string;
  familyMetrics: CityWorldObjectKitFamilyMetric[];
  blockers: string[];
};

const PUBLIC_PREFAB_FAMILIES: CityWorldObjectKitPrefabFamily[] = [
  "civic_landmark",
  "residential_cottage",
  "residential_ranch",
  "residential_rowhome",
  "commerce_strip",
  "lowrise_apartment",
  "service_gym",
];

const REQUIRED_PALETTE_ROLES: CityWorldObjectKitPaletteRole[] = [
  "stucco",
  "terracotta",
  "glass",
  "foundation",
];

const LOUD_DEFAULT_COLORS = new Set(["#e05d45", "#73a7d6", "#d95f45", "#4f92b8", "#6da76f", "#e0bd4e", "#895c9e", "#77b8d5"]);

export function assignCityWorldObjectKit(building: CityWorldBuilding): CityWorldObjectKitMetadata {
  const prefabFamily = inferPrefabFamily(building);
  const paletteRoles = uniquePaletteRoles([
    paletteRoleForMaterial(building),
    paletteRoleForRoof(building),
    "foundation",
    ...(prefabFamily === "commerce_strip" || prefabFamily === "service_gym" || prefabFamily === "civic_landmark" ? ["glass" as const] : []),
  ]);
  const roofBodySeparationScore = colorSeparationScore(building.bodyColor, building.roofColor);
  const signatureTags = signatureTagsForBuilding(building, prefabFamily);
  const metadata: CityWorldObjectKitMetadata = {
    prefabFamily,
    paletteRoles,
    cloneGroupKey: cloneGroupKeyForBuilding(building, prefabFamily),
    signatureTags,
    roofBodySeparationScore,
  };
  if (prefabFamily === "commerce_strip") {
    metadata.commerceGeometry = commerceStripPrefabGeometry(building);
  }
  if (prefabFamily === "civic_landmark") {
    metadata.civicGeometry = civicLandmarkPrefabGeometry(building);
    metadata.landmarkSignatureScore = civicLandmarkSignatureScore(building, signatureTags);
  }
  if (prefabFamily === "service_gym") {
    metadata.serviceGeometry = serviceGymPrefabGeometry(building);
  }
  return metadata;
}

export function analyzeCityWorldObjectKit(scene: CityWorldScene): CityWorldObjectKitReport {
  const diagnostics = analyzeCityWorldScene(scene, scene.coverage?.playable === false ? "shell" : "playable");
  const buildings = scene.buildings;
  const objectKits = buildings.map((building) => building.objectKit ?? assignCityWorldObjectKit(building));
  const prefabFamilies = countBy(objectKits, (kit) => kit.prefabFamily);
  const paletteRoles = countBy(objectKits.flatMap((kit) => kit.paletteRoles), (role) => role);
  const homes = buildings.filter((building) => building.kind === "home");
  const homeCloneGroups = countBy(
    homes.map((building) => building.objectKit ?? assignCityWorldObjectKit(building)),
    (kit) => kit.cloneGroupKey,
  );
  const maxHomeCloneGroup = Math.max(0, ...Object.values(homeCloneGroups));
  const familyMetrics = PUBLIC_PREFAB_FAMILIES.map((family) => familyMetric(family, buildings, objectKits));
  const blockers: string[] = [];

  for (const family of PUBLIC_PREFAB_FAMILIES) {
    if (!prefabFamilies[family]) blockers.push(`Missing public object-kit prefab family ${family}.`);
  }
  for (const role of REQUIRED_PALETTE_ROLES) {
    if (!paletteRoles[role]) blockers.push(`Missing public object-kit palette role ${role}.`);
  }
  for (const building of buildings) {
    if (LOUD_DEFAULT_COLORS.has(building.bodyColor.toLowerCase()) || LOUD_DEFAULT_COLORS.has(building.roofColor.toLowerCase())) {
      blockers.push(`Loud/default palette token returned on ${building.id}.`);
    }
  }

  const landmarkScores = objectKits
    .filter((kit) => kit.prefabFamily === "civic_landmark")
    .map((kit) => kit.landmarkSignatureScore ?? 0);
  const roofBodySeparatedCount = objectKits.filter((kit) => kit.roofBodySeparationScore >= 0.42).length;
  const cohesivePaletteCount = objectKits.filter((kit) => paletteCohesionPasses(kit)).length;
  const [firstFamilyMetric, ...remainingFamilyMetrics] = familyMetrics;
  const weakestFamily = firstFamilyMetric ? remainingFamilyMetrics.reduce((weakest, metric) => {
    const currentScore = familyReadinessScore(metric);
    const weakestScore = familyReadinessScore(weakest);
    return currentScore < weakestScore ? metric : weakest;
  }, firstFamilyMetric) : null;

  return {
    type: "cityWorldObjectKitReport",
    update: "postalpha-0.34e-public-object-kit-prefab-palette-contract",
    sceneId: scene.id,
    playable: scene.coverage?.playable ?? true,
    counts: {
      buildings: buildings.length,
      prefabAssigned: objectKits.filter(Boolean).length,
      homes: homes.length,
      cloneGroups: Object.keys(homeCloneGroups).length,
    },
    distributions: {
      prefabFamilies,
      paletteRoles,
    },
    metrics: {
      prefabCoverageRatio: roundRatio(objectKits.length, Math.max(1, buildings.length)),
      paletteCohesionRatio: roundRatio(cohesivePaletteCount, Math.max(1, objectKits.length)),
      roofBodySeparationRatio: roundRatio(roofBodySeparatedCount, Math.max(1, objectKits.length)),
      clonePressureRatio: roundRatio(maxHomeCloneGroup, Math.max(1, homes.length)),
      landmarkSignatureScore: roundMetric(Math.min(1, ...landmarkScores, 1)),
      terrainMassingCoverageRatio: diagnostics.metrics.terrainMassingCoverageRatio,
      emptyBoardRatio: diagnostics.metrics.emptyBoardRatio,
      firstViewportCompositionScore: diagnostics.metrics.firstViewportCompositionScore,
      buildingLotContactRatio: diagnostics.metrics.buildingLotContactRatio,
      lotRoadContactRatio: diagnostics.metrics.lotRoadContactRatio,
    },
    weakestPrefabFamily: weakestFamily?.prefabFamily ?? "none",
    familyMetrics,
    blockers,
  };
}

function inferPrefabFamily(building: CityWorldBuilding): CityWorldObjectKitPrefabFamily {
  if (building.kind === "civic" || building.visualGrammar?.objectFamily === "civic_landmark") return "civic_landmark";
  if (building.kind === "shop" || building.facadeStyle === "strip_store" || building.facadeStyle === "storefront") return "commerce_strip";
  if (building.kind === "apartment" || building.facadeStyle === "lowrise") return "lowrise_apartment";
  if (building.kind === "gym" || building.facadeStyle === "fitness" || building.visualGrammar?.objectFamily === "service_block") return "service_gym";
  if (building.facadeStyle === "rowhome") return "residential_rowhome";
  if (building.facadeStyle === "ranch") return "residential_ranch";
  return "residential_cottage";
}

function paletteRoleForMaterial(building: CityWorldBuilding): CityWorldObjectKitPaletteRole {
  const material = building.visualGrammar?.materialProfile;
  if (material === "civic_glass_stucco") return "glass";
  if (material === "socal_storefront") return "glass";
  if (building.kind === "shop" || building.kind === "gym") return "glass";
  return "stucco";
}

function paletteRoleForRoof(building: CityWorldBuilding): CityWorldObjectKitPaletteRole {
  const roof = building.visualGrammar?.roofProfile;
  if (roof === "blue_metal_utility" || roof === "civic_glass_cap") return "glass";
  return "terracotta";
}

function uniquePaletteRoles(roles: CityWorldObjectKitPaletteRole[]): CityWorldObjectKitPaletteRole[] {
  return [...new Set(roles)];
}

function signatureTagsForBuilding(building: CityWorldBuilding, prefabFamily: CityWorldObjectKitPrefabFamily): string[] {
  const tags = new Set<string>();
  if (building.roofShape) tags.add(`roof:${building.roofShape}`);
  if (building.facadeStyle) tags.add(`facade:${building.facadeStyle}`);
  if (building.visualGrammar?.clusterRole) tags.add(`role:${building.visualGrammar.clusterRole}`);
  if (building.width >= 3 || building.depth >= 2) tags.add("broad-footprint");
  if (building.height >= 2.4) tags.add("tall-silhouette");
  if (prefabFamily === "civic_landmark") tags.add("landmark-base");
  if (building.id === "building-civic") {
    tags.add("eastvale-core-focus");
    tags.add("tiered-civic-plinth");
    tags.add("civic-entry-rhythm");
    tags.add("roof-cap-hierarchy");
  }
  if (prefabFamily === "residential_rowhome") tags.add("party-wall-rhythm");
  if (prefabFamily === "commerce_strip") tags.add("storefront-bay-rhythm");
  if (building.id === "building-plaza-strip") {
    tags.add("plaza-row-focus");
    tags.add("deep-storefront-apron");
    tags.add("continuous-parapet");
  }
  if (prefabFamily === "lowrise_apartment") tags.add("stacked-window-rhythm");
  if (prefabFamily === "service_gym") tags.add("service-entry-depth");
  if (building.id === "building-gym") {
    tags.add("eastvale-gym-focus");
    tags.add("sawtooth-service-roof");
    tags.add("recessed-service-entry");
    tags.add("utility-apron-depth");
  }
  return [...tags];
}

function commerceStripPrefabGeometry(building: CityWorldBuilding): NonNullable<CityWorldObjectKitMetadata["commerceGeometry"]> {
  const isPlazaRow = building.id === "building-plaza-strip";
  return {
    bayCount: isPlazaRow ? 7 : Math.max(4, Math.round(building.width)),
    signMountCount: isPlazaRow ? 5 : 3,
    apronDepth: isPlazaRow ? 0.4 : 0.24,
    glassRecessDepth: isPlazaRow ? 0.42 : 0.24,
    parapetWeight: isPlazaRow ? 1.18 : 0.72,
    ...(isPlazaRow ? { focusTarget: "plaza_row" as const } : {}),
  };
}

function civicLandmarkPrefabGeometry(building: CityWorldBuilding): NonNullable<CityWorldObjectKitMetadata["civicGeometry"]> {
  const isEastvaleCore = building.id === "building-civic";
  return {
    plinthTierCount: isEastvaleCore ? 3 : 2,
    entryBayCount: isEastvaleCore ? 5 : Math.max(3, Math.round(building.width)),
    facadePierCount: isEastvaleCore ? 6 : Math.max(4, Math.round(building.width + 1)),
    glassBandCount: isEastvaleCore ? 3 : 2,
    roofCapWeight: isEastvaleCore ? 1.24 : 0.84,
    civicCanopyDepth: isEastvaleCore ? 0.34 : 0.24,
    ...(isEastvaleCore ? { focusTarget: "eastvale_core" as const } : {}),
  };
}

function serviceGymPrefabGeometry(building: CityWorldBuilding): NonNullable<CityWorldObjectKitMetadata["serviceGeometry"]> {
  const isEastvaleGym = building.id === "building-gym";
  return {
    serviceBayCount: isEastvaleGym ? 4 : Math.max(3, Math.round(building.width)),
    sawtoothCount: isEastvaleGym ? 5 : 3,
    entryRecessDepth: isEastvaleGym ? 0.34 : 0.22,
    utilityApronDepth: isEastvaleGym ? 0.42 : 0.26,
    roofMonitorWeight: isEastvaleGym ? 1.18 : 0.82,
    ...(isEastvaleGym ? { focusTarget: "eastvale_gym" as const } : {}),
  };
}

function cloneGroupKeyForBuilding(building: CityWorldBuilding, prefabFamily: CityWorldObjectKitPrefabFamily): string {
  const footprint = `${Math.round(building.width * 10) / 10}x${Math.round(building.depth * 10) / 10}`;
  return [
    prefabFamily,
    building.facadeStyle ?? "none",
    building.roofShape ?? "none",
    footprint,
    building.bodyColor.toLowerCase(),
    building.roofColor.toLowerCase(),
    building.paletteKey ?? "none",
  ].join(":");
}

function civicLandmarkSignatureScore(building: CityWorldBuilding, signatureTags: string[]): number {
  const hasAnchorRole = building.visualGrammar?.clusterRole === "anchor" ? 1 : 0;
  const hasCivicFacade = building.facadeStyle === "civic" ? 1 : 0;
  const hasStrongHeight = building.height >= 2.4 ? 1 : 0;
  const hasBroadBase = building.width >= 3 && building.depth >= 2 ? 1 : 0;
  const hasSignatureTags = signatureTags.length >= 5 ? 1 : 0;
  return roundMetric((hasAnchorRole + hasCivicFacade + hasStrongHeight + hasBroadBase + hasSignatureTags) / 5);
}

function paletteCohesionPasses(kit: CityWorldObjectKitMetadata): boolean {
  return kit.paletteRoles.includes("foundation") && kit.paletteRoles.length >= 2 && kit.roofBodySeparationScore >= 0.42;
}

function familyMetric(
  prefabFamily: CityWorldObjectKitPrefabFamily,
  buildings: CityWorldBuilding[],
  objectKits: CityWorldObjectKitMetadata[],
): CityWorldObjectKitFamilyMetric {
  const familyKits = objectKits.filter((kit) => kit.prefabFamily === prefabFamily);
  const familyBuildings = buildings.filter((building, index) => objectKits[index]?.prefabFamily === prefabFamily);
  const familyCloneGroups = countBy(familyKits, (kit) => kit.cloneGroupKey);
  const maxFamilyClone = Math.max(0, ...Object.values(familyCloneGroups));
  return {
    prefabFamily,
    count: familyKits.length,
    paletteRoleCount: new Set(familyKits.flatMap((kit) => kit.paletteRoles)).size,
    roofBodySeparationFloor: familyKits.length > 0 ? roundMetric(Math.min(...familyKits.map((kit) => kit.roofBodySeparationScore))) : 0,
    clonePressure: roundRatio(maxFamilyClone, Math.max(1, familyBuildings.length)),
    landmarkSignatureScore: prefabFamily === "civic_landmark" ? roundMetric(Math.min(1, ...familyKits.map((kit) => kit.landmarkSignatureScore ?? 0), 1)) : null,
  };
}

function familyReadinessScore(metric: CityWorldObjectKitFamilyMetric): number {
  const presence = metric.count > 0 ? 1 : 0;
  const palette = Math.min(1, metric.paletteRoleCount / 2);
  const separation = metric.roofBodySeparationFloor;
  const clone = 1 - metric.clonePressure;
  const landmark = metric.landmarkSignatureScore ?? 1;
  return presence * 0.32 + palette * 0.2 + separation * 0.2 + clone * 0.18 + landmark * 0.1;
}

function colorSeparationScore(bodyColor: string, roofColor: string): number {
  const body = parseHexColor(bodyColor);
  const roof = parseHexColor(roofColor);
  if (!body || !roof) return 0;
  const channelDistance = Math.sqrt(
    (body.r - roof.r) ** 2 +
    (body.g - roof.g) ** 2 +
    (body.b - roof.b) ** 2,
  );
  return roundMetric(Math.min(1, channelDistance / 220));
}

function parseHexColor(color: string): { r: number; g: number; b: number } | null {
  const match = color.trim().match(/^#([0-9a-f]{6})$/i);
  const hex = match?.[1];
  if (!hex) return null;
  const value = Number.parseInt(hex, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function countBy<T>(items: T[], keyForItem: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = keyForItem(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function roundRatio(numerator: number, denominator: number): number {
  return roundMetric(denominator > 0 ? numerator / denominator : 0);
}

function roundMetric(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : 0;
}
