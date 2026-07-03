import type { CityWorldBuilding, CityWorldLot, CityWorldRoadSegment, CityWorldScene, CityWorldTerrainTile } from "./cityWorldTypes.js";
import {
  cityWorldPointDistanceToSegment,
  cityWorldPointInsideFootprint,
  cityWorldPointInsideFrame,
  cityWorldSegmentTouchesFrame,
  type CityWorldViewportFrame,
  cityWorldViewportFrameForCameraPreset,
} from "./cityWorldBasis.js";

export type CityWorldTerrainSample = {
  frame: CityWorldViewportFrame;
  terrainTiles: CityWorldTerrainTile[];
  lots: CityWorldLot[];
  roadSegments: CityWorldRoadSegment[];
  buildings: CityWorldBuilding[];
  authoredTerrainCount: number;
  emptyTerrainCount: number;
  terrainMassingCount: number;
  chunkEdgeCount: number;
  elevatedTerrainCount: number;
};

export function sampleCityWorldViewport(scene: CityWorldScene, frame: CityWorldViewportFrame): CityWorldTerrainSample {
  const terrainTiles = scene.terrainTiles.filter((tile) => cityWorldPointInsideFrame(tile.position, frame));
  const lots = scene.lots.filter((lot) => cityWorldPointInsideFrame(lot.position, frame));
  const roadSegments = scene.roadSegments.filter((road) => cityWorldSegmentTouchesFrame(road.from, road.to, frame));
  const buildings = scene.buildings.filter((building) => cityWorldPointInsideFrame(building.position, frame));

  return {
    frame,
    terrainTiles,
    lots,
    roadSegments,
    buildings,
    authoredTerrainCount: terrainTiles.filter(isAuthoredCityWorldTerrainTile).length,
    emptyTerrainCount: terrainTiles.filter((tile) => isEmptyCityWorldBoardTerrainTile(tile, scene)).length,
    terrainMassingCount: terrainTiles.filter((tile) => (tile.visualGrammar?.terrainChunkMassing ?? "none") !== "none").length,
    chunkEdgeCount: terrainTiles.filter((tile) => (tile.visualGrammar?.chunkEdge ?? "none") !== "none").length,
    elevatedTerrainCount: terrainTiles.filter((tile) => {
      const elevation = tile.visualGrammar?.terrainElevation;
      return Boolean(elevation && elevation !== "flat_field" && elevation !== "shell_flat");
    }).length,
  };
}

export function sampleCityWorldViewportForCameraPreset(scene: CityWorldScene, preset: CityWorldScene["cameraPresets"][number]): CityWorldTerrainSample {
  return sampleCityWorldViewport(scene, cityWorldViewportFrameForCameraPreset(preset));
}

export function isAuthoredCityWorldTerrainTile(tile: CityWorldTerrainTile): boolean {
  const grammar = tile.visualGrammar;
  return Boolean(
    grammar &&
      (grammar.terrainComposition !== "quiet_field" ||
        grammar.terrainElevation !== "flat_field" ||
        grammar.chunkEdge !== "none" ||
        grammar.terrainChunkMassing !== "none"),
  );
}

export function isEmptyCityWorldBoardTerrainTile(tile: CityWorldTerrainTile, scene: CityWorldScene): boolean {
  const grammar = tile.visualGrammar;
  if (tile.kind !== "grass") return false;
  if (grammar?.terrainComposition !== "quiet_field") return false;
  if (grammar?.terrainElevation !== "flat_field") return false;
  if (grammar?.chunkEdge !== "none") return false;
  if (grammar?.terrainChunkMassing !== "none") return false;
  const point = tile.position;
  return !scene.lots.some((lot) => cityWorldPointInsideFootprint(point, lot.position, lot.width + 0.75, lot.depth + 0.75)) &&
    !scene.buildings.some((building) => cityWorldPointInsideFootprint(point, building.position, building.width + 0.75, building.depth + 0.75)) &&
    !scene.roadSegments.some((road) => cityWorldPointDistanceToSegment(point, road.from, road.to) <= road.width + 0.75);
}

export function cityWorldBuildingTouchesLot(building: CityWorldBuilding, lot: CityWorldLot): boolean {
  if (building.placeId && lot.placeId && building.placeId === lot.placeId) return true;
  return cityWorldPointInsideFootprint(building.position, lot.position, lot.width + 0.45, lot.depth + 0.45);
}

export function cityWorldLotTouchesRoad(lot: CityWorldLot, road: CityWorldRoadSegment): boolean {
  return cityWorldPointDistanceToSegment(lot.position, road.from, road.to) <= Math.max(road.width + 2.2, Math.min(lot.width, lot.depth) * 0.8);
}
