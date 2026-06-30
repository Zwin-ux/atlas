import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Application, Container, Graphics, Sprite, Text } from "pixi.js";
import type {
  CityWorldActor,
  CityWorldBuilding,
  CityWorldLot,
  CityWorldPin,
  CityWorldPlace,
  CityWorldPoint,
  CityWorldProp,
  CityWorldRoadSegment,
  CityWorldScene,
  CityWorldTerrainTile,
} from "@atlas/core/voxel";
import { createCityWorldAtlasResolver, loadCityWorldAtlasTextures, type CityWorldAtlasResolver, type CityWorldTextureMap } from "./cityWorldAtlasResolver";

export type CityWorldRendererHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  center: () => void;
};

type CityWorldRendererProps = {
  scene: CityWorldScene;
  selectedPlaceId?: string | undefined;
  onSelectPlace: (placeId: string) => void;
};

type ProjectedPoint = {
  x: number;
  y: number;
};

type CameraState = {
  x: number;
  y: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
};

type AnimatedTarget = {
  target: Container | Graphics;
  kind: "car" | "walker" | "water" | "cloud" | "pulse" | "clawd";
  path: CityWorldPoint[];
  speed: number;
  phase: number;
  baseAlpha: number;
  origin: ProjectedPoint;
};

type LayerMap = Record<
  "terrainLayer" | "roadLayer" | "lotLayer" | "buildingLayer" | "propLayer" | "actorLayer" | "labelLayer" | "markerLayer" | "hudBridgeLayer",
  Container
>;

type BuildingGeometry = {
  bottom: ProjectedPoint;
  top: ProjectedPoint;
  footprintWidth: number;
  footprintDepth: number;
  height: number;
  bodyColor: number;
  roofColor: number;
  highlightColor: number;
  accentColor: number;
  trimColor: number;
  outline: number;
  activeStrokeAlpha: number;
};

const TILE_WIDTH = 44;
const TILE_HEIGHT = 24;
const TILE_DEPTH = 18;

const TERRAIN_COLORS = {
  grass: 0x92c977,
  park: 0x65b765,
  plaza: 0xd8c79d,
  water: 0x69bfd0,
  sidewalk: 0xaed39b,
} satisfies Record<CityWorldTerrainTile["kind"], number>;

const LOT_COLORS = {
  home: 0xcbe7a2,
  shop: 0xe8d4a8,
  park: 0x72c56b,
  gym: 0xb8d3df,
  apartments: 0xd9c5a8,
  civic: 0xe5d6b4,
  waterfront: 0x8fd5df,
} satisfies Record<CityWorldLot["kind"], number>;

const PARKED_CAR_COLORS = [0xd94c42, 0x3c7fb5, 0x5ca96a, 0xf1d36d, 0xb45c8c];

export const CityWorldRenderer = forwardRef<CityWorldRendererHandle, CityWorldRendererProps>(function CityWorldRenderer(
  { scene, selectedPlaceId, onSelectPlace },
  ref,
) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const sceneRef = useRef(scene);
  const cameraRef = useRef<CameraState>({ x: 0, y: 0, zoom: 1, minZoom: 0.6, maxZoom: 1.8 });
  const animatedRef = useRef<AnimatedTarget[]>([]);
  const movedRef = useRef(false);
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const selectPlaceRef = useRef(onSelectPlace);
  const [ready, setReady] = useState(false);
  const [hoverPlaceId, setHoverPlaceId] = useState<string | undefined>();
  const [atlasTextures, setAtlasTextures] = useState<CityWorldTextureMap>({});

  useImperativeHandle(ref, () => ({
    zoomIn: () => zoomBy(1.12),
    zoomOut: () => zoomBy(0.88),
    center: () => resetCamera(scene),
  }));

  useEffect(() => {
    selectPlaceRef.current = onSelectPlace;
  }, [onSelectPlace]);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    let cancelled = false;
    void loadCityWorldAtlasTextures()
      .then((textures) => {
        if (!cancelled) setAtlasTextures(textures);
      })
      .catch((error) => {
        console.warn("Atlas city-world sprite textures failed to load. Primitive fallback remains active.", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const mountElement = mount;

    const app = new Application();
    appRef.current = app;
    let cancelled = false;

    async function initPixi() {
      await app.init({
        autoDensity: true,
        antialias: true,
        background: 0xa8d982,
        preference: "webgl",
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        resizeTo: mountElement,
      });

      if (cancelled) {
        app.destroy({ removeView: true }, { children: true });
        return;
      }

      app.canvas.className = "city-world-canvas";
      mountElement.appendChild(app.canvas);
      const world = new Container();
      world.sortableChildren = true;
      worldRef.current = world;
      app.stage.addChild(world);
      app.ticker.add((ticker) => animateTargets(animatedRef.current, ticker.deltaTime));
      setReady(true);
    }

    void initPixi().catch((error) => {
      console.warn("CityWorldRenderer failed to initialize Pixi.", error);
    });

    return () => {
      cancelled = true;
      setReady(false);
      animatedRef.current = [];
      worldRef.current = null;
      appRef.current = null;
      app.destroy({ removeView: true }, { children: true });
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomBy(event.deltaY > 0 ? 0.92 : 1.08);
    };
    const handlePointerDown = (event: PointerEvent) => {
      activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      dragRef.current = { active: true, x: event.clientX, y: event.clientY };
      movedRef.current = false;
      mount.setPointerCapture?.(event.pointerId);
      const distance = pointerDistance(activePointersRef.current);
      if (distance) {
        pinchRef.current = { distance, zoom: cameraRef.current.zoom };
      }
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (activePointersRef.current.has(event.pointerId)) {
        activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }

      const distance = pointerDistance(activePointersRef.current);
      if (distance && pinchRef.current) {
        movedRef.current = true;
        const camera = cameraRef.current;
        camera.zoom = clamp(pinchRef.current.zoom * (distance / pinchRef.current.distance), camera.minZoom, camera.maxZoom);
        applyCamera();
        return;
      }

      if (!dragRef.current.active) {
        setHoverPlaceId((current) => {
          const next = findHitPlace(event.clientX, event.clientY);
          return current === next ? current : next;
        });
        return;
      }

      const dx = event.clientX - dragRef.current.x;
      const dy = event.clientY - dragRef.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) movedRef.current = true;
      dragRef.current = { active: true, x: event.clientX, y: event.clientY };
      cameraRef.current.x += dx;
      cameraRef.current.y += dy;
      applyCamera();
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (!movedRef.current) {
        const placeId = findHitPlace(event.clientX, event.clientY);
        if (placeId) selectPlaceRef.current(placeId);
      }
      activePointersRef.current.delete(event.pointerId);
      if (activePointersRef.current.size < 2) pinchRef.current = null;
      dragRef.current.active = false;
      mount.releasePointerCapture?.(event.pointerId);
    };
    const handlePointerCancel = (event: PointerEvent) => {
      activePointersRef.current.delete(event.pointerId);
      if (activePointersRef.current.size < 2) pinchRef.current = null;
      dragRef.current.active = false;
      mount.releasePointerCapture?.(event.pointerId);
    };

    mount.addEventListener("wheel", handleWheel, { passive: false });
    mount.addEventListener("pointerdown", handlePointerDown);
    mount.addEventListener("pointermove", handlePointerMove);
    mount.addEventListener("pointerup", handlePointerUp);
    mount.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      mount.removeEventListener("wheel", handleWheel);
      mount.removeEventListener("pointerdown", handlePointerDown);
      mount.removeEventListener("pointermove", handlePointerMove);
      mount.removeEventListener("pointerup", handlePointerUp);
      mount.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    resetCamera(scene);
  }, [ready, scene.id]);

  useEffect(() => {
    const app = appRef.current;
    const world = worldRef.current;
    if (!ready || !app || !world) return;
    drawScene(world, scene, selectedPlaceId ?? scene.hudDefaults.selectedPlaceId, hoverPlaceId, atlasTextures, (placeId) => {
      if (!movedRef.current) selectPlaceRef.current(placeId);
    }, setHoverPlaceId, animatedRef.current);
    applyCamera();
  }, [atlasTextures, hoverPlaceId, ready, scene, selectedPlaceId]);

  function zoomBy(multiplier: number) {
    const camera = cameraRef.current;
    camera.zoom = clamp(camera.zoom * multiplier, camera.minZoom, camera.maxZoom);
    applyCamera();
  }

  function resetCamera(nextScene: CityWorldScene) {
    const mount = mountRef.current;
    const world = worldRef.current;
    if (!mount || !world) return;
    const preset = mount.clientWidth < 720 ? nextScene.cameraPresets.find((item) => item.id === "mobile") : nextScene.cameraPresets.find((item) => item.id === "desktop");
    const cameraPreset = preset ?? nextScene.cameraPresets[0];
    if (!cameraPreset) return;
    const focus = project(cameraPreset.center);
    cameraRef.current = {
      x: mount.clientWidth / 2 - focus.x * cameraPreset.zoom,
      y: mount.clientHeight / 2 - focus.y * cameraPreset.zoom - 18,
      zoom: cameraPreset.zoom,
      minZoom: cameraPreset.minZoom,
      maxZoom: cameraPreset.maxZoom,
    };
    applyCamera();
  }

  function applyCamera() {
    const world = worldRef.current;
    if (!world) return;
    const camera = cameraRef.current;
    world.scale.set(camera.zoom);
    world.position.set(camera.x, camera.y);
  }

  function findHitPlace(clientX: number, clientY: number): string | undefined {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const rect = mount.getBoundingClientRect();
    const camera = cameraRef.current;
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    let nearest: { id: string; distance: number } | undefined;

    for (const place of sceneRef.current.places) {
      const point = project(place.anchor);
      const x = camera.x + point.x * camera.zoom;
      const y = camera.y + point.y * camera.zoom;
      const distance = Math.hypot(screenX - x, screenY - y);
      const threshold = Math.max(34, place.hitRadius * 14 * camera.zoom);
      if (distance <= threshold && (!nearest || distance < nearest.distance)) {
        nearest = { id: place.id, distance };
      }
    }

    return nearest?.id;
  }

  return <div ref={mountRef} className="city-world-renderer" aria-label={`${scene.region.district} voxel city map`} />;
});

function pointerDistance(pointers: Map<number, { x: number; y: number }>): number | undefined {
  if (pointers.size < 2) return undefined;
  const pair = Array.from(pointers.values()).slice(0, 2);
  const first = pair[0];
  const second = pair[1];
  if (!first || !second) return undefined;
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function drawScene(
  world: Container,
  scene: CityWorldScene,
  selectedPlaceId: string,
  hoverPlaceId: string | undefined,
  atlasTextures: CityWorldTextureMap,
  onSelectPlace: (placeId: string) => void,
  onHoverPlace: (placeId: string | undefined) => void,
  animated: AnimatedTarget[],
) {
  const previousChildren = world.removeChildren();
  for (const child of previousChildren) {
    child.destroy({ children: true });
  }
  animated.length = 0;

  const layers = createLayers();
  Object.values(layers).forEach((layer) => world.addChild(layer));
  const atlas = createCityWorldAtlasResolver(scene, atlasTextures);

  for (const tile of scene.terrainTiles) drawTerrainTile(layers.terrainLayer, tile);
  for (const road of scene.roadSegments) drawRoad(layers.roadLayer, road);
  for (const lot of scene.lots) drawLot(layers.lotLayer, lot);

  const buildings = [...scene.buildings].sort((a, b) => a.position.x + a.position.y - (b.position.x + b.position.y));
  for (const building of buildings) drawBuilding(layers.buildingLayer, building, building.placeId === selectedPlaceId, building.placeId === hoverPlaceId, atlas);

  const props = [...scene.props].sort((a, b) => a.position.x + a.position.y - (b.position.x + b.position.y));
  for (const prop of props) drawProp(layers.propLayer, prop, animated, atlas);
  const actors = [...scene.actors].sort((a, b) => a.position.x + a.position.y - (b.position.x + b.position.y));
  for (const actor of actors) drawActor(layers.actorLayer, actor, animated, atlas);
  for (const place of scene.places) drawPlaceMarker(layers.markerLayer, place, selectedPlaceId, hoverPlaceId, onSelectPlace, onHoverPlace, animated);
  for (const pin of scene.pins) drawPin(layers.markerLayer, pin, atlas);
  for (const place of scene.places) drawPlaceLabel(layers.labelLayer, place, selectedPlaceId, hoverPlaceId);
}

function createLayers(): LayerMap {
  return {
    terrainLayer: namedLayer("terrainLayer"),
    roadLayer: namedLayer("roadLayer"),
    lotLayer: namedLayer("lotLayer"),
    buildingLayer: namedLayer("buildingLayer"),
    propLayer: namedLayer("propLayer"),
    actorLayer: namedLayer("actorLayer"),
    labelLayer: namedLayer("labelLayer"),
    markerLayer: namedLayer("markerLayer"),
    hudBridgeLayer: namedLayer("hudBridgeLayer"),
  };
}

function namedLayer(label: keyof LayerMap): Container {
  const layer = new Container();
  layer.label = label;
  return layer;
}

function drawTerrainTile(layer: Container, tile: CityWorldTerrainTile) {
  const point = project(tile.position);
  const baseColor = TERRAIN_COLORS[tile.kind];
  const variation = (tile.variant - 2) * (tile.kind === "water" ? 5 : 4);
  const color = shadeColor(baseColor, variation);
  const alpha = tile.kind === "water" ? 0.95 : tile.kind === "grass" ? 0.78 + tile.variant * 0.025 : 0.86;
  const graphic = polygon(diamondPoints(point, TILE_WIDTH + 1, TILE_HEIGHT + 1), color, alpha, tile.kind === "water" ? 0x3a8ea1 : 0x5b8b52, 0.14);

  if (tile.kind === "water" && tile.variant % 2 === 0) {
    graphic
      .moveTo(point.x - 11, point.y - 1)
      .lineTo(point.x + 13, point.y - 1)
      .stroke({ color: 0xe9fbff, alpha: 0.24, width: 1.2, cap: "round" });
  } else if (tile.kind === "park" && tile.variant % 3 === 0) {
    graphic.circle(point.x - 5, point.y - 1, 1.8).fill({ color: 0xd8f0b2, alpha: 0.32 });
  } else if (tile.kind === "plaza" && tile.variant % 2 === 0) {
    graphic
      .moveTo(point.x - TILE_WIDTH * 0.22, point.y)
      .lineTo(point.x + TILE_WIDTH * 0.22, point.y)
      .stroke({ color: 0xf5e7c1, alpha: 0.26, width: 1 });
  } else if (tile.kind === "grass" && tile.variant === 4) {
    graphic.circle(point.x + 7, point.y + 1, 1.3).fill({ color: 0xe0efb4, alpha: 0.24 });
  }

  layer.addChild(graphic);
}

function drawRoad(layer: Container, road: CityWorldRoadSegment) {
  const start = project(road.from);
  const end = project(road.to);
  const baseWidth = road.width * 15;
  const shadow = new Graphics().moveTo(start.x, start.y + 4).lineTo(end.x, end.y + 4);
  shadow.stroke({ color: 0x35504a, alpha: 0.24, width: baseWidth + 7, cap: "round", join: "round" });

  if (road.kind === "crosswalk") {
    const curb = new Graphics().moveTo(start.x, start.y).lineTo(end.x, end.y);
    curb.stroke({ color: 0xefe2c8, alpha: 0.88, width: baseWidth + 3, cap: "butt", join: "round" });
    layer.addChild(shadow, curb);
    drawCrosswalk(layer, start, end, baseWidth);
    return;
  }

  const curb = new Graphics().moveTo(start.x, start.y).lineTo(end.x, end.y);
  curb.stroke({ color: road.kind === "driveway" ? 0xb7a782 : 0xd3c28f, alpha: road.kind === "driveway" ? 0.46 : 0.82, width: baseWidth + 5, cap: "round", join: "round" });
  const ribbon = new Graphics().moveTo(start.x, start.y).lineTo(end.x, end.y);
  ribbon.stroke({ color: road.kind === "driveway" ? 0x8d9486 : 0x646f69, alpha: road.kind === "driveway" ? 0.78 : 0.98, width: baseWidth, cap: "round", join: "round" });
  layer.addChild(shadow, curb, ribbon);

  if (road.kind === "avenue" || road.kind === "street") {
    drawDashedLine(layer, start, end, road.kind === "avenue" ? 10 : 7, 6, 0xf8e8a6, road.kind === "avenue" ? 2.1 : 1.6, 0.76);
    drawIntersectionCap(layer, start, road.kind === "avenue" ? 17 : 13);
    drawIntersectionCap(layer, end, road.kind === "avenue" ? 17 : 13);
  } else if (road.kind === "driveway") {
    drawDashedLine(layer, start, end, 4, 9, 0xe8dfbd, 1.1, 0.28);
  }
}

function drawCrosswalk(layer: Container, start: ProjectedPoint, end: ProjectedPoint, roadWidth: number) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const stepCount = Math.max(3, Math.floor(length / 9));
  const nx = -dy / length;
  const ny = dx / length;
  const ux = dx / length;
  const uy = dy / length;
  const stripes = new Graphics();

  for (let index = 0; index <= stepCount; index += 1) {
    const centerX = start.x + ux * ((length / stepCount) * index);
    const centerY = start.y + uy * ((length / stepCount) * index);
    stripes
      .moveTo(centerX - nx * roadWidth * 0.42, centerY - ny * roadWidth * 0.42)
      .lineTo(centerX + nx * roadWidth * 0.42, centerY + ny * roadWidth * 0.42);
  }

  stripes.stroke({ color: 0xffffff, alpha: 0.84, width: 2.5, cap: "round" });
  layer.addChild(stripes);
}

function drawDashedLine(
  layer: Container,
  start: ProjectedPoint,
  end: ProjectedPoint,
  dashLength: number,
  gapLength: number,
  color: number,
  width: number,
  alpha: number,
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0) return;

  const ux = dx / length;
  const uy = dy / length;
  const graphic = new Graphics();
  let cursor = gapLength * 0.5;

  while (cursor < length) {
    const next = Math.min(cursor + dashLength, length);
    graphic
      .moveTo(start.x + ux * cursor, start.y + uy * cursor)
      .lineTo(start.x + ux * next, start.y + uy * next);
    cursor = next + gapLength;
  }

  graphic.stroke({ color, alpha, width, cap: "round" });
  layer.addChild(graphic);
}

function drawIntersectionCap(layer: Container, point: ProjectedPoint, radius: number) {
  const cap = new Graphics().ellipse(point.x, point.y, radius, radius * 0.48).fill({ color: 0x5f6963, alpha: 0.58 });
  cap.stroke({ color: 0xd3c28f, alpha: 0.24, width: 1.4 });
  layer.addChild(cap);
}

function drawLot(layer: Container, lot: CityWorldLot) {
  const point = project(lot.position);
  const width = lot.width * TILE_WIDTH;
  const height = lot.depth * TILE_HEIGHT;
  const lotGraphic = polygon(diamondPoints(point, width, height), LOT_COLORS[lot.kind], lot.kind === "waterfront" ? 0.34 : 0.42, 0x28473f, 0.2);
  layer.addChild(lotGraphic);

  if (lot.kind === "park") {
    const path = new Graphics()
      .moveTo(point.x - width * 0.28, point.y - height * 0.08)
      .lineTo(point.x - width * 0.05, point.y + height * 0.12)
      .lineTo(point.x + width * 0.25, point.y - height * 0.02);
    path.stroke({ color: 0xf1d9a5, alpha: 0.72, width: 5, cap: "round", join: "round" });
    const court = polygon(diamondPoints({ x: point.x + width * 0.14, y: point.y + height * 0.16 }, 34, 18), 0xc3d989, 0.72, 0x5b8b52, 0.28);
    layer.addChild(path, court);
  } else if (lot.kind === "shop" || lot.kind === "civic") {
    const lines = new Graphics();
    for (let i = -2; i <= 2; i += 1) {
      lines
        .moveTo(point.x + i * 24 - width * 0.25, point.y + height * 0.16)
        .lineTo(point.x + i * 24 + width * 0.04, point.y - height * 0.08);
    }
    lines.stroke({ color: 0xf4e8c7, alpha: 0.28, width: 1 });
    layer.addChild(lines);
  } else if (lot.kind === "waterfront") {
    const edge = new Graphics()
      .moveTo(point.x - width * 0.38, point.y - height * 0.08)
      .lineTo(point.x - width * 0.02, point.y + height * 0.12)
      .lineTo(point.x + width * 0.34, point.y - height * 0.04);
    edge.stroke({ color: 0xe9fbff, alpha: 0.42, width: 3, cap: "round", join: "round" });
    layer.addChild(edge);
  }
}

function drawBuilding(layer: Container, building: CityWorldBuilding, selected: boolean, hovered: boolean, atlas: CityWorldAtlasResolver) {
  const geometry = createBuildingGeometry(building, selected, hovered, atlas);
  drawBuildingShell(layer, geometry, building, selected, hovered);

  if (building.kind === "home") drawHomeDetails(layer, geometry, building);
  if (building.kind === "shop") drawShopDetails(layer, geometry, building);
  if (building.kind === "gym") drawGymDetails(layer, geometry, building);
  if (building.kind === "apartment") drawApartmentDetails(layer, geometry);
  if (building.kind === "civic") drawCivicDetails(layer, geometry);
}

function createBuildingGeometry(building: CityWorldBuilding, selected: boolean, hovered: boolean, atlas: CityWorldAtlasResolver): BuildingGeometry {
  const bottom = project(building.position);
  const top = project({ x: building.position.x, y: building.position.y, z: building.height });
  const asset = atlas.resolveAsset(building.spriteKey, building.paletteKey, "building");
  return {
    bottom,
    top,
    footprintWidth: building.width * TILE_WIDTH,
    footprintDepth: building.depth * TILE_HEIGHT,
    height: building.height * TILE_DEPTH,
    bodyColor: paletteColor(asset.palette.colors.base, building.bodyColor),
    roofColor: paletteColor(asset.palette.colors.roof, building.roofColor),
    highlightColor: paletteColor(asset.palette.colors.highlight, "#fff4d8"),
    accentColor: paletteColor(asset.palette.colors.accent, asset.palette.colors.roof ?? "#ffcf56"),
    trimColor: paletteColor(asset.palette.colors.trim, "#26332c"),
    outline: selected ? 0xffffff : hovered ? 0xffee88 : 0x26332c,
    activeStrokeAlpha: hovered || selected ? 0.82 : 0.38,
  };
}

function drawBuildingShell(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, selected: boolean, hovered: boolean) {
  const { bottom, top, footprintWidth, footprintDepth, bodyColor, roofColor, outline, activeStrokeAlpha } = geometry;
  const sideLeft = shadeColor(bodyColor, -20);
  const sideRight = shadeColor(bodyColor, -36);
  const topLeft = { x: top.x - footprintWidth / 2, y: top.y };
  const topRight = { x: top.x + footprintWidth / 2, y: top.y };
  const topFront = { x: top.x, y: top.y + footprintDepth / 2 };
  const bottomLeft = { x: bottom.x - footprintWidth / 2, y: bottom.y };
  const bottomRight = { x: bottom.x + footprintWidth / 2, y: bottom.y };
  const bottomFront = { x: bottom.x, y: bottom.y + footprintDepth / 2 };
  const leftSide = [topLeft.x, topLeft.y, topFront.x, topFront.y, bottomFront.x, bottomFront.y, bottomLeft.x, bottomLeft.y];
  const rightSide = [topRight.x, topRight.y, topFront.x, topFront.y, bottomFront.x, bottomFront.y, bottomRight.x, bottomRight.y];

  const shadow = new Graphics()
    .ellipse(bottom.x, bottom.y + footprintDepth * 0.22, footprintWidth * 0.46, footprintDepth * 0.58)
    .fill({ color: 0x23342e, alpha: selected ? 0.28 : 0.2 });
  const left = polygon(leftSide, sideLeft, 0.98, outline, activeStrokeAlpha);
  const right = polygon(rightSide, sideRight, 0.98, outline, activeStrokeAlpha);
  layer.addChild(shadow, left, right);

  drawRoof(layer, geometry, building, selected, hovered);
}

function drawRoof(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, selected: boolean, hovered: boolean) {
  const { top, footprintWidth, footprintDepth, roofColor, outline, activeStrokeAlpha } = geometry;
  const roofShape = building.roofShape ?? "flat";
  const roof = polygon(diamondPoints(top, footprintWidth, footprintDepth), roofColor, 0.98, outline, hovered || selected ? 0.92 : activeStrokeAlpha);
  layer.addChild(roof);

  const lines = new Graphics();
  if (roofShape === "gable") {
    lines
      .moveTo(top.x - footprintWidth * 0.24, top.y - footprintDepth * 0.13)
      .lineTo(top.x + footprintWidth * 0.24, top.y + footprintDepth * 0.13)
      .moveTo(top.x - footprintWidth * 0.24, top.y - footprintDepth * 0.13)
      .lineTo(top.x - footprintWidth * 0.5, top.y)
      .moveTo(top.x + footprintWidth * 0.24, top.y + footprintDepth * 0.13)
      .lineTo(top.x + footprintWidth * 0.5, top.y);
  } else if (roofShape === "hip") {
    lines
      .poly(diamondPoints(top, footprintWidth * 0.54, footprintDepth * 0.5), true)
      .moveTo(top.x, top.y - footprintDepth * 0.25)
      .lineTo(top.x, top.y + footprintDepth * 0.25);
  } else if (roofShape === "sawtooth") {
    for (let i = -2; i <= 2; i += 1) {
      lines
        .moveTo(top.x + i * (footprintWidth / 7) - 5, top.y - footprintDepth * 0.28)
        .lineTo(top.x + i * (footprintWidth / 7) + 12, top.y + footprintDepth * 0.24);
    }
  } else if (roofShape === "tower") {
    lines
      .poly(diamondPoints({ x: top.x, y: top.y - 12 }, footprintWidth * 0.36, footprintDepth * 0.34), true)
      .moveTo(top.x, top.y - 24)
      .lineTo(top.x, top.y - 3);
  } else {
    lines.poly(diamondPoints(top, footprintWidth * 0.72, footprintDepth * 0.64), true);
  }
  lines.stroke({ color: shadeColor(roofColor, -44), alpha: 0.34, width: 1.4, cap: "round", join: "round" });
  layer.addChild(lines);
}

function drawHomeDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, trimColor } = geometry;
  const trim = new Graphics()
    .roundRect(top.x - footprintWidth * 0.18, bottom.y - footprintDepth * 0.04, footprintWidth * 0.14, 11, 2)
    .fill({ color: trimColor, alpha: 0.9 })
    .roundRect(top.x + footprintWidth * 0.06, bottom.y - footprintDepth * 0.1, footprintWidth * 0.14, 7, 2)
    .fill({ color: highlightColor, alpha: 0.86 })
    .roundRect(top.x - footprintWidth * 0.35, bottom.y - footprintDepth * 0.12, footprintWidth * 0.13, 7, 2)
    .fill({ color: highlightColor, alpha: 0.76 })
    .rect(top.x + footprintWidth * 0.22, top.y - footprintDepth * 0.18, 5, 11)
    .fill({ color: shadeColor(roofColor, -48), alpha: 0.88 });
  trim.stroke({ color: 0x26332c, alpha: 0.28, width: 1 });
  layer.addChild(trim);

  if ((building.spriteKey ?? "").endsWith(".0")) {
    const porch = polygon(diamondPoints({ x: bottom.x - footprintWidth * 0.12, y: bottom.y + footprintDepth * 0.26 }, footprintWidth * 0.24, 8), 0xf6e6bd, 0.82, 0x7f6d4e, 0.25);
    layer.addChild(porch);
  }
}

function drawShopDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, accentColor, highlightColor } = geometry;
  const signColor = building.paletteKey?.endsWith(".0") ? 0x5b9fcb : accentColor;
  const details = new Graphics()
    .roundRect(top.x - footprintWidth * 0.36, top.y + footprintDepth * 0.24, footprintWidth * 0.72, 8, 3)
    .fill({ color: signColor, alpha: 0.95 })
    .stroke({ color: 0x26332c, alpha: 0.44, width: 1 })
    .roundRect(top.x - footprintWidth * 0.34, bottom.y - footprintDepth * 0.16, footprintWidth * 0.22, 12, 2)
    .fill({ color: highlightColor, alpha: 0.82 })
    .roundRect(top.x + footprintWidth * 0.02, bottom.y - footprintDepth * 0.13, footprintWidth * 0.22, 10, 2)
    .fill({ color: highlightColor, alpha: 0.78 });
  layer.addChild(details);

  const awning = new Graphics();
  for (let stripe = 0; stripe < 5; stripe += 1) {
    awning
      .roundRect(top.x - footprintWidth * 0.36 + stripe * (footprintWidth * 0.14), top.y + footprintDepth * 0.36, footprintWidth * 0.1, 7, 2)
      .fill({ color: stripe % 2 === 0 ? roofColor : 0xfff4d8, alpha: 0.92 });
  }
  awning.stroke({ color: 0x26332c, alpha: 0.3, width: 1 });
  layer.addChild(awning);
}

function drawGymDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor } = geometry;
  const details = new Graphics()
    .roundRect(top.x - footprintWidth * 0.3, top.y + footprintDepth * 0.22, footprintWidth * 0.6, 10, 3)
    .fill({ color: highlightColor, alpha: 0.88 })
    .stroke({ color: roofColor, alpha: 0.78, width: 2 })
    .roundRect(top.x - footprintWidth * 0.28, bottom.y - footprintDepth * 0.18, footprintWidth * 0.2, 15, 2)
    .fill({ color: 0xa9d7e6, alpha: 0.76 })
    .roundRect(top.x + footprintWidth * 0.08, bottom.y - footprintDepth * 0.16, footprintWidth * 0.22, 12, 2)
    .fill({ color: 0xa9d7e6, alpha: 0.72 });
  layer.addChild(details);

  const sign = new Text({
    text: "GYM",
    style: { fill: 0x26332c, fontFamily: "Arial", fontSize: 9, fontWeight: "900" },
  });
  sign.anchor.set(0.5);
  sign.position.set(top.x, top.y + footprintDepth * 0.25 + 5);
  layer.addChild(sign);

  const stripe = new Graphics()
    .moveTo(top.x - footprintWidth * 0.36, top.y - footprintDepth * 0.04)
    .lineTo(top.x + footprintWidth * 0.36, top.y + footprintDepth * 0.26);
  stripe.stroke({ color: 0xffffff, alpha: 0.32, width: 2, cap: "round" });
  layer.addChild(stripe);
}

function drawApartmentDetails(layer: Container, geometry: BuildingGeometry) {
  const { top, bottom, footprintWidth, footprintDepth } = geometry;
  const windows = new Graphics();
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      windows
        .roundRect(top.x - footprintWidth * 0.28 + col * (footprintWidth * 0.19), top.y + footprintDepth * 0.22 + row * 9, 7, 5, 1.5)
        .fill({ color: row % 2 === 0 ? 0xfff4bd : 0xdaf2ff, alpha: 0.82 });
    }
  }
  windows.stroke({ color: 0x26332c, alpha: 0.2, width: 0.8 });
  layer.addChild(windows);

  const courtyard = polygon(diamondPoints({ x: bottom.x + footprintWidth * 0.12, y: bottom.y + footprintDepth * 0.38 }, footprintWidth * 0.34, 12), 0x7ec36d, 0.5, 0x477f43, 0.18);
  layer.addChild(courtyard);
}

function drawCivicDetails(layer: Container, geometry: BuildingGeometry) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, accentColor } = geometry;
  const columns = new Graphics();
  for (let col = -2; col <= 2; col += 1) {
    columns
      .roundRect(top.x + col * (footprintWidth * 0.12) - 2, bottom.y - footprintDepth * 0.28, 4, 20, 1.5)
      .fill({ color: highlightColor, alpha: 0.92 });
  }
  columns
    .roundRect(top.x - footprintWidth * 0.26, bottom.y - footprintDepth * 0.34, footprintWidth * 0.52, 6, 2)
    .fill({ color: highlightColor, alpha: 0.94 })
    .circle(top.x, top.y - 15, 6)
    .fill({ color: roofColor, alpha: 0.96 })
    .stroke({ color: 0x26332c, alpha: 0.32, width: 1 });
  layer.addChild(columns);

  const flag = new Graphics()
    .rect(top.x + footprintWidth * 0.08, top.y - 28, 2, 17)
    .fill({ color: 0x46564f, alpha: 0.86 })
    .poly([top.x + footprintWidth * 0.1, top.y - 28, top.x + footprintWidth * 0.28, top.y - 23, top.x + footprintWidth * 0.1, top.y - 19], true)
    .fill({ color: accentColor, alpha: 0.92 });
  layer.addChild(flag);
}

function drawProp(layer: Container, prop: CityWorldProp, animated: AnimatedTarget[], atlas: CityWorldAtlasResolver) {
  const point = project(prop.position);
  const asset = atlas.resolveAsset(prop.spriteKey, prop.paletteKey, "prop");
  const baseColor = colorToNumber(asset.palette.colors.base);
  const shade = colorToNumber(asset.palette.colors.shade);
  const highlight = colorToNumber(asset.palette.colors.highlight);
  const accent = paletteColor(asset.palette.colors.accent, asset.palette.colors.highlight);

  if (prop.kind === "tree" || prop.kind === "bush") {
    const foliage = prop.variant % 2 === 0 ? baseColor : shadeColor(baseColor, 12);
    const tree = new Graphics()
      .ellipse(point.x, point.y - 2, prop.kind === "bush" ? 9 : 12, 4)
      .fill({ color: 0x23342e, alpha: 0.16 });
    if (prop.kind === "tree") {
      tree
        .rect(point.x - 2.4, point.y - 16, 4.8, 14)
        .fill({ color: shade, alpha: 0.95 })
        .circle(point.x - 6, point.y - 20, 8)
        .circle(point.x + 5, point.y - 22, 9)
        .circle(point.x, point.y - 29, 10)
        .fill({ color: foliage, alpha: 0.96 })
        .circle(point.x + 2, point.y - 31, 4)
        .fill({ color: highlight, alpha: 0.38 });
    } else {
      tree
        .circle(point.x - 5, point.y - 10, 6)
        .circle(point.x + 2, point.y - 13, 8)
        .circle(point.x + 8, point.y - 9, 5)
        .fill({ color: foliage, alpha: 0.92 })
        .circle(point.x + 1, point.y - 15, 3)
        .fill({ color: highlight, alpha: 0.24 });
    }
    tree.stroke({ color: 0x26332c, alpha: 0.26, width: 1 });
    layer.addChild(tree);
    return;
  }

  if (prop.kind === "fountain") {
    const fountain = new Graphics()
      .ellipse(point.x, point.y - 7, 20, 11)
      .fill({ color: baseColor, alpha: 0.85 })
      .stroke({ color: shade, alpha: 0.8, width: 2 })
      .circle(point.x, point.y - 14, 4)
      .fill({ color: highlight, alpha: 0.9 });
    animated.push({ target: fountain, kind: "water", path: [], speed: 0.025, phase: prop.variant * 0.2, baseAlpha: 0.78, origin: point });
    layer.addChild(fountain);
    return;
  }

  if (prop.kind === "water_shimmer") {
    const shimmer = new Graphics()
      .moveTo(point.x - 28, point.y)
      .lineTo(point.x + 28, point.y)
      .moveTo(point.x - 18, point.y + 9)
      .lineTo(point.x + 22, point.y + 9);
    shimmer.stroke({ color: highlight, alpha: 0.54, width: 2, cap: "round" });
    animated.push({ target: shimmer, kind: "water", path: [], speed: 0.02, phase: prop.variant * 0.35, baseAlpha: 0.52, origin: point });
    layer.addChild(shimmer);
    return;
  }

  if (prop.kind === "streetlight") {
    layer.addChild(
      new Graphics()
        .ellipse(point.x, point.y - 1, 6, 2.5)
        .fill({ color: 0x23342e, alpha: 0.16 })
        .rect(point.x - 1.2, point.y - 22, 2.4, 20)
        .fill({ color: baseColor, alpha: 0.9 })
        .rect(point.x - 1.2, point.y - 22, 11, 2)
        .fill({ color: baseColor, alpha: 0.9 })
        .circle(point.x + 2, point.y - 24, 4)
        .fill({ color: highlight, alpha: 0.92 })
        .circle(point.x + 2, point.y - 24, 9)
        .fill({ color: highlight, alpha: 0.08 }),
    );
    return;
  }

  if (prop.kind === "bench") {
    const bench = new Graphics()
      .ellipse(point.x, point.y - 1, 11, 3)
      .fill({ color: 0x23342e, alpha: 0.14 })
      .roundRect(point.x - 12, point.y - 10, 24, 5, 2)
      .fill({ color: baseColor, alpha: 0.96 })
      .roundRect(point.x - 11, point.y - 16, 22, 4, 2)
      .fill({ color: highlight, alpha: 0.96 })
      .rect(point.x - 8, point.y - 5, 2, 6)
      .rect(point.x + 7, point.y - 5, 2, 6)
      .fill({ color: accent, alpha: 0.82 })
      .stroke({ color: 0x26332c, alpha: 0.28, width: 1 });
    layer.addChild(bench);
    return;
  }

  if (prop.kind === "parked_car") {
    layer.addChild(
      drawSmallCarGraphic(point, PARKED_CAR_COLORS[prop.variant % PARKED_CAR_COLORS.length] ?? baseColor, prop.variant % 2 === 0 ? "east-west" : "north-south", {
        windowColor: highlight,
        lightColor: accent,
        outlineColor: shade,
      }),
    );
    return;
  }

  if (prop.kind === "sign") {
    const boardColor = prop.variant % 3 === 0 ? baseColor : prop.variant % 3 === 1 ? accent : highlight;
    layer.addChild(
      new Graphics()
        .ellipse(point.x, point.y - 1, 8, 3)
        .fill({ color: 0x23342e, alpha: 0.16 })
        .rect(point.x - 1, point.y - 20, 2, 20)
        .fill({ color: shade })
        .roundRect(point.x - 14, point.y - 31, 28, 13, 3)
        .fill({ color: boardColor, alpha: 0.95 })
        .moveTo(point.x - 8, point.y - 25)
        .lineTo(point.x + 8, point.y - 25)
        .stroke({ color: 0x26332c, alpha: 0.65, width: 1.5 }),
    );
    return;
  }

  if (prop.kind === "cloud") {
    const cloud = new Graphics()
      .circle(point.x - 14, point.y - 22, 12)
      .circle(point.x, point.y - 30, 16)
      .circle(point.x + 16, point.y - 22, 12)
      .fill({ color: 0xffffff, alpha: 0.38 });
    animated.push({ target: cloud, kind: "cloud", path: [], speed: 0.009, phase: prop.variant * 0.4, baseAlpha: 0.36, origin: point });
    layer.addChild(cloud);
  }
}

function drawActor(layer: Container, actor: CityWorldActor, animated: AnimatedTarget[], atlas: CityWorldAtlasResolver) {
  const point = project(actor.position);
  const asset = atlas.resolveAsset(actor.spriteKey, actor.paletteKey, "actor");
  const actorBase = colorToNumber(actor.color);
  const shade = colorToNumber(asset.palette.colors.shade);
  const highlight = colorToNumber(asset.palette.colors.highlight);
  const accent = paletteColor(asset.palette.colors.accent, asset.palette.colors.highlight);
  const color = colorToNumber(actor.color);
  let graphic: Graphics;

  if (actor.kind === "car") {
    const first = actor.path[0] ?? actor.position;
    const second = actor.path[1] ?? first;
    graphic = drawSmallCarGraphic(point, actorBase, Math.abs(second.x - first.x) >= Math.abs(second.y - first.y) ? "east-west" : "north-south", {
      windowColor: highlight,
      lightColor: accent,
      outlineColor: shade,
    });
  } else if (actor.kind === "walker") {
    graphic = new Graphics()
      .ellipse(point.x, point.y - 1, 5, 2)
      .fill({ color: 0x23342e, alpha: 0.18 })
      .circle(point.x, point.y - 15, 4.4)
      .fill({ color, alpha: 0.94 })
      .roundRect(point.x - 2.6, point.y - 12, 5.2, 9, 2)
      .fill({ color: shade, alpha: 0.66 })
      .moveTo(point.x - 1, point.y - 3)
      .lineTo(point.x - 4, point.y + 2)
      .moveTo(point.x + 1, point.y - 3)
      .lineTo(point.x + 4, point.y + 1)
      .stroke({ color: shade, alpha: 0.64, width: 1.5, cap: "round" });
  } else {
    graphic = new Graphics()
      .ellipse(point.x, point.y - 3, 12, 5)
      .fill({ color: 0x23342e, alpha: 0.18 })
      .circle(point.x, point.y - 22, 9)
      .fill({ color: highlight, alpha: 0.98 })
      .stroke({ color: shade, width: 2 })
      .circle(point.x - 3, point.y - 22, 1.4)
      .circle(point.x + 3, point.y - 22, 1.4)
      .fill({ color: shade })
      .roundRect(point.x - 6, point.y - 15, 12, 10, 4)
      .fill({ color: colorToNumber(asset.palette.colors.base), alpha: 0.92 })
      .circle(point.x - 7, point.y - 28, 3)
      .circle(point.x + 7, point.y - 28, 3)
      .fill({ color: shade, alpha: 0.95 });
  }

  animated.push({
    target: graphic,
    kind: actor.kind,
    path: actor.path,
    speed: actor.speed,
    phase: actor.phase,
    baseAlpha: 0.92,
    origin: point,
  });
  layer.addChild(graphic);
}

function drawSmallCarGraphic(
  point: ProjectedPoint,
  color: number,
  orientation: "east-west" | "north-south",
  details: { windowColor?: number; lightColor?: number; outlineColor?: number } = {},
): Graphics {
  const wide = orientation === "east-west";
  const bodyWidth = wide ? 23 : 15;
  const bodyHeight = wide ? 12 : 18;
  const hoodOffset = wide ? 7 : 4;
  const outlineColor = details.outlineColor ?? 0x26332c;
  const windowColor = details.windowColor ?? 0xf5fbff;
  const lightColor = details.lightColor ?? 0xfff0a8;
  const car = new Graphics()
    .ellipse(point.x, point.y - 1, bodyWidth * 0.5, bodyHeight * 0.28)
    .fill({ color: 0x23342e, alpha: 0.16 })
    .roundRect(point.x - bodyWidth / 2, point.y - bodyHeight - 1, bodyWidth, bodyHeight, 4)
    .fill({ color, alpha: 0.97 })
    .stroke({ color: outlineColor, alpha: 0.68, width: 1.3 })
    .roundRect(point.x - bodyWidth * 0.2, point.y - bodyHeight - 4, bodyWidth * 0.4, 6, 2)
    .fill({ color: windowColor, alpha: 0.86 })
    .circle(point.x - hoodOffset, point.y - 2, 2)
    .circle(point.x + hoodOffset, point.y - 2, 2)
    .fill({ color: 0x222826, alpha: 0.72 });

  if (wide) {
    car
      .rect(point.x - bodyWidth * 0.48, point.y - bodyHeight * 0.58, 3, 3)
      .rect(point.x + bodyWidth * 0.36, point.y - bodyHeight * 0.58, 3, 3)
      .fill({ color: lightColor, alpha: 0.86 });
  } else {
    car
      .rect(point.x - 4, point.y - bodyHeight - 1, 8, 3)
      .fill({ color: lightColor, alpha: 0.82 });
  }

  return car;
}

function drawPlaceMarker(
  layer: Container,
  place: CityWorldPlace,
  selectedPlaceId: string,
  hoverPlaceId: string | undefined,
  onSelectPlace: (placeId: string) => void,
  onHoverPlace: (placeId: string | undefined) => void,
  animated: AnimatedTarget[],
) {
  const point = project(place.anchor);
  const selected = place.id === selectedPlaceId;
  const hovered = place.id === hoverPlaceId;
  const radius = selected ? 30 : hovered ? 27 : 22;
  const ring = new Graphics()
    .ellipse(point.x, point.y - 4, radius, radius * 0.48)
    .fill({ color: selected ? 0xfff2a6 : 0xffffff, alpha: selected ? 0.26 : hovered ? 0.2 : 0.04 })
    .stroke({ color: selected ? 0xffe16c : hovered ? 0xffffff : 0x1f362f, alpha: selected || hovered ? 0.86 : 0.12, width: selected ? 3 : 2 });
  animated.push({ target: ring, kind: "pulse", path: [], speed: 0.02, phase: place.activity, baseAlpha: selected || hovered ? 0.78 : 0.22, origin: point });
  layer.addChild(ring);

  const hit = new Graphics().circle(point.x, point.y - 12, place.hitRadius * 13).fill({ color: 0xffffff, alpha: 0.001 });
  hit.eventMode = "static";
  hit.cursor = "pointer";
  hit.on("pointertap", () => onSelectPlace(place.id));
  hit.on("pointerover", () => onHoverPlace(place.id));
  hit.on("pointerout", () => onHoverPlace(undefined));
  layer.addChild(hit);
}

function drawPin(layer: Container, pin: CityWorldPin, atlas: CityWorldAtlasResolver) {
  const point = project(pin.anchor);
  const asset = atlas.resolveAsset(pin.spriteKey, pin.paletteKey, "marker");
  if (asset.mode === "sprite") {
    const sprite = new Sprite(asset.texture);
    sprite.anchor.set(asset.anchor.x, asset.anchor.y);
    sprite.scale.set(asset.scale);
    sprite.position.set(point.x, point.y + 1);
    sprite.label = `sprite-${pin.id}`;
    layer.addChild(sprite);
    return;
  }
  const color = colorToNumber(asset.palette.colors.base);
  const shade = colorToNumber(asset.palette.colors.shade);
  const highlight = colorToNumber(asset.palette.colors.highlight);
  const badge = new Graphics()
    .poly([point.x, point.y - 2, point.x - 6, point.y - 10, point.x + 6, point.y - 10], true)
    .fill({ color: shade, alpha: 0.86 })
    .circle(point.x, point.y - 18, 11)
    .fill({ color, alpha: 0.98 })
    .circle(point.x - 3.5, point.y - 22, 2.4)
    .fill({ color: highlight, alpha: 0.34 })
    .stroke({ color: shade, alpha: 0.75, width: 1.8 });
  const label = new Text({
    text: pin.kind === "note" ? "N" : stickerGlyph(pin.kind),
    style: { fill: shade, fontFamily: "Arial", fontSize: 10, fontWeight: "900" },
  });
  label.anchor.set(0.5);
  label.position.set(point.x, point.y - 18);
  layer.addChild(badge, label);
}

function drawPlaceLabel(layer: Container, place: CityWorldPlace, selectedPlaceId: string, hoverPlaceId: string | undefined) {
  const selected = place.id === selectedPlaceId;
  const hovered = place.id === hoverPlaceId;
  if (!selected && !hovered && place.labelPriority < 7) return;

  const point = project(place.anchor);
  const text = new Text({
    text: place.label,
    style: {
      fill: 0x1f2d28,
      fontFamily: "Arial",
      fontSize: selected || hovered ? 13 : 11,
      fontWeight: "900",
      stroke: { color: 0xfff8e7, width: 4 },
    },
  });
  text.anchor.set(0.5);
  text.position.set(point.x, point.y - (selected || hovered ? 55 : 44));
  layer.addChild(text);
}

function animateTargets(targets: AnimatedTarget[], delta: number) {
  const elapsed = performance.now() / 1000;
  for (const item of targets) {
    if (item.path.length > 1) {
      const ratio = (elapsed * item.speed + item.phase) % 1;
      const position = pointOnPath(item.path, ratio);
      const point = project(position);
      item.target.position.set(point.x - item.origin.x, point.y - item.origin.y);
    }

    if (item.kind === "water") {
      item.target.alpha = item.baseAlpha + Math.sin(elapsed * 2.2 + item.phase * 8) * 0.16;
    } else if (item.kind === "cloud") {
      item.target.x += delta * item.speed * 8;
      item.target.alpha = item.baseAlpha + Math.sin(elapsed + item.phase * 4) * 0.06;
    } else if (item.kind === "walker" || item.kind === "clawd") {
      item.target.y += Math.sin(elapsed * 4 + item.phase * 5) * 0.05;
    } else if (item.kind === "pulse") {
      item.target.alpha = item.baseAlpha + Math.sin(elapsed * 2 + item.phase * 4) * 0.1;
    }
  }
}

function pointOnPath(path: CityWorldPoint[], ratio: number): CityWorldPoint {
  if (path.length === 0) return { x: 0, y: 0, z: 0 };
  if (path.length === 1) return path[0] ?? { x: 0, y: 0, z: 0 };

  const scaled = ratio * path.length;
  const index = Math.floor(scaled) % path.length;
  const nextIndex = (index + 1) % path.length;
  const local = scaled - Math.floor(scaled);
  const start = path[index] ?? path[0] ?? { x: 0, y: 0, z: 0 };
  const end = path[nextIndex] ?? start;
  return {
    x: start.x + (end.x - start.x) * local,
    y: start.y + (end.y - start.y) * local,
    z: start.z + (end.z - start.z) * local,
  };
}

function project(point: CityWorldPoint): ProjectedPoint {
  return {
    x: (point.x - point.y) * (TILE_WIDTH / 2),
    y: (point.x + point.y) * (TILE_HEIGHT / 2) - point.z * TILE_DEPTH,
  };
}

function diamondPoints(center: ProjectedPoint, width: number, height: number): number[] {
  return [center.x, center.y - height / 2, center.x + width / 2, center.y, center.x, center.y + height / 2, center.x - width / 2, center.y];
}

function polygon(points: number[], fill: number, alpha = 1, stroke = 0x26332c, strokeAlpha = 0.42): Graphics {
  return new Graphics().poly(points, true).fill({ color: fill, alpha }).stroke({ color: stroke, alpha: strokeAlpha, width: 1 });
}

function colorToNumber(color: string): number {
  return Number.parseInt(color.replace("#", ""), 16);
}

function paletteColor(color: string | undefined, fallback: string): number {
  return colorToNumber(color ?? fallback);
}

function shadeColor(color: number, amount: number): number {
  const r = clamp(((color >> 16) & 255) + amount, 0, 255);
  const g = clamp(((color >> 8) & 255) + amount, 0, 255);
  const b = clamp((color & 255) + amount, 0, 255);
  return (r << 16) + (g << 8) + b;
}

function stickerGlyph(kind: CityWorldPin["kind"]): string {
  const glyphs: Record<CityWorldPin["kind"], string> = {
    home: "H",
    shop: "S",
    park: "P",
    favorite: "*",
    idea: "!",
    question: "?",
    note: "N",
  };
  return glyphs[kind];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
