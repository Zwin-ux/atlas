import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Application, Container, Graphics, Text } from "pixi.js";
import type { AtlasNode, VoxelPlace, VoxelPoint, VoxelScene, VoxelSticker, VoxelStickerKind, VoxelTile } from "@atlas/core/voxel";
import type { VoxelSceneViewProps } from "./VoxelSceneView";

type PixiVoxelSceneViewProps = VoxelSceneViewProps & {
  fallback: ReactNode;
};

type ProjectedPoint = {
  x: number;
  y: number;
};

type AnimatedTarget = {
  target: Container | Graphics;
  mode: "pulse" | "route";
  baseAlpha: number;
};

const TILE_COLORS = {
  open: { top: 0xdfe8c3, left: 0xadc08a, right: 0x94a874 },
  residential: { top: 0xd8efcf, left: 0xa8c99d, right: 0x8fb681 },
  commercial: { top: 0xd8e9ff, left: 0x9fbfe6, right: 0x87a9d4 },
  route: { top: 0xbec3bd, left: 0x8f9892, right: 0x78837e },
  risk: { top: 0xffd7c5, left: 0xd99a7d, right: 0xc48267 },
  scouted: { top: 0xd6f0ed, left: 0x9fc9c5, right: 0x83b4af },
} satisfies Record<VoxelTile["kind"], { top: number; left: number; right: number }>;

const NODE_COLORS: Record<AtlasNode["kind"], number> = {
  city: 0x0d8f8a,
  residential_cluster: 0x2f9c63,
  commercial_plaza: 0x3478b8,
  apartment_cluster: 0xe36f2c,
  regional_center: 0x3478b8,
};

export function PixiVoxelSceneView({
  scene,
  selectedNodeId,
  selectedDistrictId,
  selectedPlaceId,
  stickers = [],
  activeStepId,
  onSelectNode,
  onSelectPlace,
  fallback,
}: PixiVoxelSceneViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const animatedRef = useRef<AnimatedTarget[]>([]);
  const selectNodeRef = useRef(onSelectNode);
  const selectPlaceRef = useRef(onSelectPlace);
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(scene.camera?.initialZoom ?? 1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [hoverPlaceId, setHoverPlaceId] = useState<string | undefined>();

  const renderable = useMemo(() => isRenderableScene(scene), [scene]);

  useEffect(() => {
    selectNodeRef.current = onSelectNode;
    selectPlaceRef.current = onSelectPlace;
  }, [onSelectNode, onSelectPlace]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? -0.08 : 0.08;
      setZoom((value) => clamp(value + direction, scene.camera?.minZoom ?? 0.8, scene.camera?.maxZoom ?? 1.45));
    };
    const handlePointerDown = (event: PointerEvent) => {
      dragRef.current = { active: true, x: event.clientX, y: event.clientY };
      mount.setPointerCapture?.(event.pointerId);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragRef.current.active) return;
      const dx = event.clientX - dragRef.current.x;
      const dy = event.clientY - dragRef.current.y;
      dragRef.current = { active: true, x: event.clientX, y: event.clientY };
      setPan((value) => ({ x: clamp(value.x + dx, -180, 180), y: clamp(value.y + dy, -120, 120) }));
    };
    const handlePointerUp = (event: PointerEvent) => {
      dragRef.current.active = false;
      mount.releasePointerCapture?.(event.pointerId);
    };

    mount.addEventListener("wheel", handleWheel, { passive: false });
    mount.addEventListener("pointerdown", handlePointerDown);
    mount.addEventListener("pointermove", handlePointerMove);
    mount.addEventListener("pointerup", handlePointerUp);
    mount.addEventListener("pointercancel", handlePointerUp);
    return () => {
      mount.removeEventListener("wheel", handleWheel);
      mount.removeEventListener("pointerdown", handlePointerDown);
      mount.removeEventListener("pointermove", handlePointerMove);
      mount.removeEventListener("pointerup", handlePointerUp);
      mount.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [scene.camera?.maxZoom, scene.camera?.minZoom]);

  useEffect(() => {
    if (!renderable) return;
    const mount = mountRef.current;
    if (!mount || appRef.current) return;

    const mountElement = mount;
    let cancelled = false;
    const app = new Application();
    appRef.current = app;

    async function initPixi() {
      try {
        await app.init({
          autoDensity: true,
          antialias: true,
          backgroundAlpha: 0,
          preference: "webgl",
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          resizeTo: mountElement,
        });

        if (cancelled) {
          app.destroy({ removeView: true }, { children: true });
          return;
        }

        app.canvas.className = "pixi-map-canvas";
        mountElement.appendChild(app.canvas);
        const world = new Container();
        worldRef.current = world;
        app.stage.addChild(world);
        app.ticker.add(() => animateTargets(animatedRef.current));
        setReady(true);
      } catch (error) {
        console.warn("Pixi renderer failed; falling back to SVG.", error);
        setFailed(true);
      }
    }

    void initPixi();

    return () => {
      cancelled = true;
      setReady(false);
      animatedRef.current = [];
      worldRef.current = null;
      appRef.current = null;
      app.destroy({ removeView: true }, { children: true });
    };
  }, [renderable]);

  useEffect(() => {
    const app = appRef.current;
    const world = worldRef.current;
    const mount = mountRef.current;
    if (!ready || !app || !world || !mount || !renderable) return;

    drawScene({
      app,
      world,
      mount,
      scene,
      selectedNodeId,
      selectedDistrictId,
      selectedPlaceId,
      stickers,
      hoverPlaceId,
      activeStepId,
      zoom,
      pan,
      labelsVisible,
      animated: animatedRef.current,
      onSelectNode: (nodeId) => selectNodeRef.current(nodeId),
      onSelectPlace: (placeId) => selectPlaceRef.current?.(placeId),
      onHoverPlace: setHoverPlaceId,
    });
  }, [activeStepId, hoverPlaceId, labelsVisible, pan, ready, renderable, scene, selectedDistrictId, selectedNodeId, selectedPlaceId, stickers, zoom]);

  if (!renderable || failed) return <>{fallback}</>;

  return (
    <div className="pixi-map-shell">
      <div ref={mountRef} className="pixi-map-host" aria-label={`${scene.county.name} cozy voxel city map`} />
      <div className="pixi-map-controls" aria-label="Map controls">
        <button type="button" onClick={() => setZoom((value) => clamp(value - 0.1, scene.camera?.minZoom ?? 0.8, scene.camera?.maxZoom ?? 1.35))}>
          -
        </button>
        <button
          type="button"
          onClick={() => {
            setPan({ x: 0, y: 0 });
            setZoom(scene.camera?.initialZoom ?? 1);
          }}
        >
          Center
        </button>
        <button type="button" onClick={() => setZoom((value) => clamp(value + 0.1, scene.camera?.minZoom ?? 0.8, scene.camera?.maxZoom ?? 1.35))}>
          +
        </button>
        <button type="button" aria-pressed={labelsVisible} onClick={() => setLabelsVisible((value) => !value)}>
          Labels
        </button>
      </div>
      <div className="pixi-map-legend" aria-label="Map legend">
        <span><i className="legend-home" />Homes</span>
        <span><i className="legend-shop" />Shops</span>
        <span><i className="legend-park" />Parks</span>
        <span><i className="legend-sticker" />Stickers</span>
      </div>
    </div>
  );
}

function drawScene({
  app,
  world,
  mount,
  scene,
  selectedNodeId,
  selectedDistrictId,
  selectedPlaceId,
  stickers,
  hoverPlaceId,
  activeStepId,
  zoom,
  pan,
  labelsVisible,
  animated,
  onSelectNode,
  onSelectPlace,
  onHoverPlace,
}: {
  app: Application;
  world: Container;
  mount: HTMLDivElement;
  scene: VoxelScene;
  selectedNodeId: string;
  selectedDistrictId: string | undefined;
  selectedPlaceId: string | undefined;
  stickers: VoxelSticker[];
  hoverPlaceId: string | undefined;
  activeStepId: string | undefined;
  zoom: number;
  pan: { x: number; y: number };
  labelsVisible: boolean;
  animated: AnimatedTarget[];
  onSelectNode: (nodeId: string) => void;
  onSelectPlace: (placeId: string) => void;
  onHoverPlace: (placeId: string | undefined) => void;
}) {
  const width = Math.max(320, mount.clientWidth || scene.viewport.width);
  const height = Math.max(260, mount.clientHeight || Math.round((width * scene.viewport.height) / scene.viewport.width));
  app.renderer.resize(width, height);
  world.removeChildren();
  animated.length = 0;

  const sceneScale = Math.min(width / scene.viewport.width, height / scene.viewport.height) * zoom;
  const compactMap = width < 620;
  const basePosition = {
    x: (width - scene.viewport.width * sceneScale) / 2,
    y: (height - scene.viewport.height * sceneScale) / 2,
  };
  const focusOffset = scene.world ? getMapFocusOffset(scene, selectedDistrictId, selectedPlaceId, sceneScale, width, height, basePosition, compactMap) : { x: 0, y: 0 };
  world.scale.set(sceneScale);
  world.position.set(basePosition.x + focusOffset.x + pan.x, basePosition.y + focusOffset.y + pan.y);

  world.addChild(new Graphics().rect(0, 0, scene.viewport.width, scene.viewport.height).fill({ color: 0xf7efd8 }));
  drawGrid(world, scene);

  for (const tile of scene.tiles) {
    drawTile(world, scene, tile);
  }

  drawEdges(world, scene);
  if (!scene.world) {
    drawRoute(world, scene, animated);
  }
  drawObjects(world, scene, !scene.world && labelsVisible && width >= 900, animated);
  drawAmbientLife(world, scene, animated);
  drawPlaces(world, scene, selectedDistrictId, selectedPlaceId, hoverPlaceId, labelsVisible, onSelectNode, onSelectPlace, onHoverPlace, animated);
  drawStickers(world, scene, stickers);
  if (!scene.world) {
    drawNodes(world, scene, selectedNodeId, labelsVisible, compactMap, onSelectNode);
    drawPhaseStamp(world, scene, activeStepId);
  }
}

function getMapFocusOffset(
  scene: VoxelScene,
  selectedDistrictId: string | undefined,
  selectedPlaceId: string | undefined,
  sceneScale: number,
  width: number,
  height: number,
  basePosition: ProjectedPoint,
  compactMap: boolean,
): ProjectedPoint {
  const focusPoint = getFocusPoint(scene, selectedDistrictId, selectedPlaceId);
  if (!focusPoint) return { x: 0, y: 0 };

  const desired = { x: width * (compactMap ? 0.5 : 0.55), y: height * (compactMap ? 0.43 : 0.48) };
  const maxX = compactMap ? 170 : 280;
  const maxY = compactMap ? 120 : 180;
  return {
    x: clamp(desired.x - (basePosition.x + focusPoint.x * sceneScale), -maxX, maxX),
    y: clamp(desired.y - (basePosition.y + focusPoint.y * sceneScale), -maxY, maxY),
  };
}

function getFocusPoint(scene: VoxelScene, selectedDistrictId: string | undefined, selectedPlaceId: string | undefined): ProjectedPoint | undefined {
  const selectedPlace = scene.world?.places.find((place) => place.id === selectedPlaceId);
  if (selectedPlace) return project(scene, selectedPlace.position);

  const districtPlaces = scene.world?.places.filter((place) => !selectedDistrictId || place.districtId === selectedDistrictId) ?? [];
  if (districtPlaces.length > 0) {
    const points = districtPlaces.map((place) => project(scene, place.position));
    return {
      x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
      y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    };
  }

  const selectedNode = scene.nodes.find((node) => node.id === scene.selectedNodeId);
  return selectedNode ? project(scene, selectedNode.position) : undefined;
}

function drawGrid(world: Container, scene: VoxelScene) {
  const grid = new Graphics();
  for (let x = 0; x <= scene.viewport.width; x += 58) {
    grid.moveTo(x, 0).lineTo(x, scene.viewport.height);
  }
  for (let y = 0; y <= scene.viewport.height; y += 30) {
    grid.moveTo(0, y).lineTo(scene.viewport.width, y);
  }
  grid.stroke({ color: 0x15130f, alpha: 0.04, width: 1 });
  world.addChild(grid);
}

function drawTile(world: Container, scene: VoxelScene, tile: VoxelTile) {
  const point = project(scene, tile.position);
  const depth = scene.viewport.tileDepth + tile.elevation * 2;
  const colors = TILE_COLORS[tile.kind];
  world.addChild(
    polygon(sidePoints(point, scene.viewport.tileWidth, scene.viewport.tileHeight, depth, "left"), colors.left, 0.95),
    polygon(sidePoints(point, scene.viewport.tileWidth, scene.viewport.tileHeight, depth, "right"), colors.right, 0.95),
    polygon(diamondPoints(point, scene.viewport.tileWidth, scene.viewport.tileHeight), colors.top, 1, 0x242017),
  );
  drawTileDetail(world, tile, point);
}

function drawTileDetail(world: Container, tile: VoxelTile, point: ProjectedPoint) {
  const seed = Math.abs(Math.round(tile.position.x * 37 + tile.position.y * 19));

  if (tile.kind === "residential") {
    drawTinyHouse(world, point, seed % 2 === 0 ? 0x6dbb8f : 0x78a7d8);
    return;
  }

  if (tile.kind === "commercial") {
    drawTinyShop(world, point, seed % 2 === 0 ? 0x6aa7d8 : 0xd8a15e);
    return;
  }

  if (tile.kind === "route") {
    const road = new Graphics()
      .roundRect(point.x - 25, point.y - 5, 50, 10, 5)
      .fill({ color: 0x666b68, alpha: 0.86 })
      .rect(point.x - 16, point.y - 1, 8, 2)
      .fill({ color: 0xfff8e9, alpha: 0.9 })
      .rect(point.x + 5, point.y - 1, 8, 2)
      .fill({ color: 0xfff8e9, alpha: 0.9 });
    world.addChild(road);
    return;
  }

  if (tile.kind === "open" && seed % 7 === 0) {
    drawTinyTree(world, point);
  }
}

function drawTinyHouse(world: Container, point: ProjectedPoint, roofColor: number) {
  const house = new Graphics()
    .rect(point.x - 10, point.y - 22, 20, 16)
    .fill({ color: 0xfff0ce, alpha: 0.92 })
    .stroke({ color: 0x242017, alpha: 0.72, width: 1.2 })
    .poly([point.x - 13, point.y - 22, point.x, point.y - 34, point.x + 13, point.y - 22], true)
    .fill({ color: roofColor, alpha: 0.9 })
    .stroke({ color: 0x242017, alpha: 0.72, width: 1.2 });
  world.addChild(house);
}

function drawTinyShop(world: Container, point: ProjectedPoint, color: number) {
  const shop = new Graphics()
    .roundRect(point.x - 15, point.y - 25, 30, 20, 3)
    .fill({ color: 0xfff8e9, alpha: 0.94 })
    .stroke({ color: 0x242017, alpha: 0.76, width: 1.3 })
    .rect(point.x - 15, point.y - 25, 30, 7)
    .fill({ color, alpha: 0.88 })
    .rect(point.x - 5, point.y - 14, 10, 9)
    .fill({ color: 0x8ec7d5, alpha: 0.82 });
  world.addChild(shop);
}

function drawTinyTree(world: Container, point: ProjectedPoint) {
  const tree = new Graphics()
    .rect(point.x - 2, point.y - 15, 4, 10)
    .fill({ color: 0x8b6f42, alpha: 0.9 })
    .circle(point.x, point.y - 20, 9)
    .fill({ color: 0x5da25f, alpha: 0.88 })
    .stroke({ color: 0x242017, alpha: 0.35, width: 1 });
  world.addChild(tree);
}

function drawEdges(world: Container, scene: VoxelScene) {
  const nodeById = new Map(scene.nodes.map((node) => [node.id, node]));
  const edges = new Graphics();
  for (const edge of scene.edges) {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to) continue;
    const start = project(scene, from.position);
    const end = project(scene, to.position);
    edges.moveTo(start.x, start.y).lineTo(end.x, end.y);
  }
  edges.stroke({ color: 0x15130f, alpha: 0.18, width: 3 });
  world.addChild(edges);
}

function drawRoute(world: Container, scene: VoxelScene, animated: AnimatedTarget[]) {
  const nodeById = new Map(scene.nodes.map((node) => [node.id, node]));
  const points = scene.clawd.routeNodeIds
    .map((nodeId) => nodeById.get(nodeId))
    .filter((node): node is AtlasNode => Boolean(node))
    .map((node) => project(scene, node.position));
  if (points.length < 2) return;

  const shadow = new Graphics();
  const route = new Graphics();
  const pulse = new Graphics();
  drawPolyline(shadow, points);
  shadow.stroke({ color: 0x15130f, alpha: 0.35, width: 9, cap: "round", join: "round" });
  drawPolyline(route, points);
  route.stroke({ color: 0xffffff, alpha: 0.96, width: 5, cap: "round", join: "round" });

  points.forEach((point, index) => {
    pulse.circle(point.x, point.y, index === 0 ? 7 : 5).fill({ color: index === 0 ? 0xe0b84b : 0xffffff, alpha: 0.9 });
  });
  animated.push({ target: pulse, mode: "route", baseAlpha: 0.72 });
  world.addChild(shadow, route, pulse);
}

function drawObjects(world: Container, scene: VoxelScene, labelsVisible: boolean, animated: AnimatedTarget[]) {
  for (const object of scene.objects ?? []) {
    const point = project(scene, object.position);
    const intensity = object.intensity ?? 0.7;
    if (object.kind === "home") {
      drawMiniBuilding(world, point, 0x2f9c63, intensity);
    } else if (object.kind === "plaza") {
      drawMiniBuilding(world, point, 0x3478b8, intensity, 18);
    } else if (object.kind === "park") {
      const park = new Graphics()
        .circle(point.x, point.y - 10, 18)
        .fill({ color: 0x8fcf81, alpha: 0.86 })
        .stroke({ color: 0x242017, alpha: 0.65, width: 1.5 })
        .circle(point.x - 7, point.y - 17, 5)
        .fill({ color: 0x2f9c63, alpha: 0.9 })
        .circle(point.x + 8, point.y - 15, 4)
        .fill({ color: 0x2f9c63, alpha: 0.82 });
      animated.push({ target: park, mode: "pulse", baseAlpha: 0.82 });
      world.addChild(park);
    } else if (object.kind === "landmark") {
      const landmark = new Graphics()
        .roundRect(point.x - 13, point.y - 34, 26, 28, 4)
        .fill({ color: 0xfff8e9, alpha: 0.92 })
        .stroke({ color: 0x242017, width: 1.7 })
        .poly([point.x - 16, point.y - 34, point.x, point.y - 48, point.x + 16, point.y - 34], true)
        .fill({ color: 0xe0b84b, alpha: 0.9 })
        .stroke({ color: 0x242017, width: 1.7 });
      world.addChild(landmark);
    } else if (object.kind === "qr_surface") {
      const qr = new Graphics().roundRect(point.x - 10, point.y - 24, 20, 14, 2).fill({ color: 0xffffff }).stroke({ color: 0x242017, width: 2 });
      qr.rect(point.x - 6, point.y - 20, 4, 4).fill({ color: 0x242017 });
      qr.rect(point.x + 2, point.y - 20, 4, 4).fill({ color: 0x242017 });
      qr.rect(point.x - 1, point.y - 15, 5, 4).fill({ color: 0x242017 });
      world.addChild(qr);
    } else if (object.kind === "risk_gate") {
      const gate = new Graphics()
        .rect(point.x - 14, point.y - 24, 28, 8)
        .fill({ color: 0xe36f2c, alpha: 0.95 })
        .rect(point.x - 13, point.y - 14, 5, 16)
        .fill({ color: 0x242017 })
        .rect(point.x + 8, point.y - 14, 5, 16)
        .fill({ color: 0x242017 });
      animated.push({ target: gate, mode: "pulse", baseAlpha: 0.82 });
      world.addChild(gate);
    } else if (object.kind === "drop_zone") {
      const drop = new Graphics().circle(point.x, point.y, 30).fill({ color: 0xe0b84b, alpha: 0.14 }).stroke({ color: 0xe0b84b, alpha: 0.76, width: 3 });
      animated.push({ target: drop, mode: "pulse", baseAlpha: 0.8 });
      world.addChild(drop);
    } else if (object.kind === "road" || object.kind === "freeway") {
      const road = new Graphics().roundRect(point.x - 28, point.y - 7, 56, 14, 7).fill({ color: object.kind === "freeway" ? 0x3478b8 : 0xe0b84b, alpha: 0.32 });
      world.addChild(road);
    } else if (object.kind === "scout_marker") {
      const marker = new Graphics().circle(point.x, point.y - 16, 8).fill({ color: 0x3478b8 }).stroke({ color: 0x242017, width: 2 });
      world.addChild(marker);
    }

    if (labelsVisible && object.kind !== "home" && object.kind !== "road" && object.kind !== "freeway") {
      world.addChild(makeLabel(object.label, point.x, point.y - 34, 10));
    }
  }
}

function drawAmbientLife(world: Container, scene: VoxelScene, animated: AnimatedTarget[]) {
  const ambient = scene.world?.ambient;
  if (!ambient) return;

  const residentCount = Math.max(3, Math.round(ambient.residents * 7));
  for (let index = 0; index < residentCount; index += 1) {
    const place = scene.world?.places[index % scene.world.places.length];
    if (!place) continue;
    const point = project(scene, {
      x: place.position.x + ((index % 3) - 1) * 0.55,
      y: place.position.y + ((index % 2) - 0.5) * 0.75,
      z: place.position.z + 0.2,
    });
    const dot = new Graphics().circle(point.x, point.y - 7, 3.6).fill({ color: 0x242017, alpha: 0.56 });
    animated.push({ target: dot, mode: "route", baseAlpha: 0.42 + place.activity * 0.28 });
    world.addChild(dot);
  }

  const trafficCount = Math.max(2, Math.round(ambient.traffic * 5));
  for (let index = 0; index < trafficCount; index += 1) {
    const edge = scene.edges[index % scene.edges.length];
    const from = scene.nodes.find((node) => node.id === edge?.from);
    const to = scene.nodes.find((node) => node.id === edge?.to);
    if (!from || !to) continue;
    const start = project(scene, from.position);
    const end = project(scene, to.position);
    const ratio = (index + 1) / (trafficCount + 1);
    const x = start.x + (end.x - start.x) * ratio;
    const y = start.y + (end.y - start.y) * ratio;
    const car = new Graphics().roundRect(x - 7, y - 5, 14, 8, 3).fill({ color: 0xfff8e9, alpha: 0.82 }).stroke({ color: 0x242017, width: 1 });
    animated.push({ target: car, mode: "route", baseAlpha: 0.54 });
    world.addChild(car);
  }
}

function drawPlaces(
  world: Container,
  scene: VoxelScene,
  selectedDistrictId: string | undefined,
  selectedPlaceId: string | undefined,
  hoverPlaceId: string | undefined,
  labelsVisible: boolean,
  onSelectNode: (nodeId: string) => void,
  onSelectPlace: (placeId: string) => void,
  onHoverPlace: (placeId: string | undefined) => void,
  animated: AnimatedTarget[],
) {
  const places = scene.world?.places.filter((place) => !selectedDistrictId || place.districtId === selectedDistrictId) ?? [];
  for (const place of places) {
    const point = project(scene, place.position);
    const selected = place.id === selectedPlaceId;
    const hovered = place.id === hoverPlaceId;
    const container = new Container();
    container.eventMode = "static";
    container.cursor = "pointer";
    container.on("pointertap", () => {
      onSelectPlace(place.id);
      onSelectNode(place.nodeId);
    });
    container.on("pointerover", () => onHoverPlace(place.id));
    container.on("pointerout", () => onHoverPlace(undefined));

    const color = placeColor(place);
    const halo = new Graphics()
      .circle(point.x, point.y, selected ? 31 : hovered ? 27 : 23)
      .fill({ color: 0xffffff, alpha: selected ? 0.52 : hovered ? 0.42 : 0.24 })
      .stroke({ color: selected ? 0x242017 : color, alpha: selected ? 0.95 : 0.55, width: selected ? 3 : 2 });
    const dot = new Graphics()
      .circle(point.x, point.y, selected ? 14 : 11)
      .fill({ color, alpha: 0.98 })
      .stroke({ color: 0x242017, width: 2 });
    const activity = new Graphics().circle(point.x, point.y, 18 + place.activity * 9).stroke({ color, alpha: 0.22 + place.activity * 0.24, width: 2 });
    animated.push({ target: activity, mode: "pulse", baseAlpha: 0.48 });
    container.addChild(activity, halo, dot);

    if (labelsVisible || selected || hovered) {
      container.addChild(makeLabel(place.label, point.x, point.y + 30, 10));
    }

    world.addChild(container);
  }
}

function drawStickers(world: Container, scene: VoxelScene, stickers: VoxelSticker[]) {
  for (const sticker of stickers) {
    const place = scene.world?.places.find((item) => item.id === sticker.placeId);
    if (!place) continue;
    const point = project(scene, place.position);
    const color = stickerColor(sticker.kind);
    const badge = new Graphics()
      .circle(point.x + 19, point.y - 29, 13)
      .fill({ color, alpha: 0.96 })
      .stroke({ color: 0x242017, width: 2 });
    const label = new Text({
      text: stickerGlyph(sticker.kind),
      style: {
        fill: 0x242017,
        fontFamily: "Arial",
        fontSize: 12,
        fontWeight: "900",
      },
    });
    label.anchor.set(0.5);
    label.x = point.x + 19;
    label.y = point.y - 29;
    world.addChild(badge, label);
  }
}

function drawMarkers(world: Container, scene: VoxelScene, animated: AnimatedTarget[]) {
  const nodeById = new Map(scene.nodes.map((node) => [node.id, node]));
  for (const marker of scene.markers) {
    const node = nodeById.get(marker.nodeId);
    if (!node) continue;
    const point = project(scene, node.position);
    const color = marker.kind === "risk" ? 0xe36f2c : marker.kind === "scouted" ? 0x3478b8 : marker.kind === "drop" ? 0xe0b84b : 0x2f9c63;
    const pin = new Graphics()
      .poly([point.x, point.y - 40, point.x + 12, point.y - 24, point.x, point.y - 8, point.x - 12, point.y - 24], true)
      .fill({ color })
      .stroke({ color: 0x242017, width: 2 })
      .circle(point.x, point.y - 24, 4)
      .fill({ color: 0x242017 });
    if (marker.kind === "drop") animated.push({ target: pin, mode: "pulse", baseAlpha: 1 });
    world.addChild(pin);
  }
}

function drawNodes(
  world: Container,
  scene: VoxelScene,
  selectedNodeId: string,
  labelsVisible: boolean,
  compactMap: boolean,
  onSelectNode: (nodeId: string) => void,
) {
  for (const node of scene.nodes) {
    const point = project(scene, node.position);
    const selected = node.id === selectedNodeId;
    const shouldLabel = labelsVisible && (!compactMap || selected);
    const container = new Container();
    container.eventMode = "static";
    container.cursor = "pointer";
    container.on("pointertap", () => onSelectNode(node.id));

    const halo = new Graphics()
      .circle(point.x, point.y, selected ? 26 : 18)
      .fill({ color: 0xffffff, alpha: selected ? 0.78 : 0.34 })
      .stroke({ color: selected ? 0x242017 : 0x15130f, alpha: selected ? 0.9 : 0.25, width: 2 });
    const dot = new Graphics().circle(point.x, point.y, selected ? 12 : 9).fill({ color: NODE_COLORS[node.kind] }).stroke({ color: 0x242017, width: 3 });
    container.addChild(halo, dot);

    if (shouldLabel) {
      container.addChild(makeLabel(node.label, point.x, point.y + 29, 11));
    }

    world.addChild(container);
  }
}

function drawPhaseStamp(world: Container, scene: VoxelScene, activeStepId: string | undefined) {
  const active = scene.flow.find((step) => step.id === activeStepId) ?? scene.flow.find((step) => step.status === "active");
  if (!active) return;
  const stamp = new Text({
    text: active.label.toUpperCase(),
    style: {
      fill: 0x15130f,
      fontFamily: "Arial",
      fontSize: 12,
      fontWeight: "900",
    },
  });
  stamp.x = 18;
  stamp.y = scene.viewport.height - 34;
  world.addChild(stamp);
}

function drawMiniBuilding(world: Container, point: ProjectedPoint, color: number, alpha: number, width = 14) {
  const building = new Graphics()
    .rect(point.x - width / 2, point.y - 20, width, 16)
    .fill({ color, alpha })
    .stroke({ color: 0x242017, alpha: 0.8, width: 1.5 })
    .poly([point.x - width / 2, point.y - 20, point.x, point.y - 30, point.x + width / 2, point.y - 20], true)
    .fill({ color: 0xfff8e9, alpha: 0.88 })
    .stroke({ color: 0x242017, alpha: 0.8, width: 1.5 });
  world.addChild(building);
}

function makeLabel(text: string, x: number, y: number, fontSize: number) {
  const label = new Container();
  const safeWidth = Math.max(58, Math.min(140, text.length * (fontSize * 0.58) + 16));
  const bg = new Graphics().roundRect(-safeWidth / 2, -10, safeWidth, 20, 3).fill({ color: 0x17191f }).stroke({ color: 0x242017, width: 1.5 });
  const copy = new Text({
    text: text.toUpperCase(),
    style: {
      fill: 0xfff8e9,
      fontFamily: "Arial",
      fontSize,
      fontWeight: "900",
      align: "center",
      wordWrap: true,
      wordWrapWidth: safeWidth - 8,
    },
  });
  copy.anchor.set(0.5);
  copy.y = 0;
  label.x = x;
  label.y = y;
  label.addChild(bg, copy);
  return label;
}

function placeColor(place: VoxelPlace): number {
  const colors: Record<VoxelPlace["kind"], number> = {
    home_area: 0x2f9c63,
    shop: 0x3478b8,
    plaza: 0x3478b8,
    park: 0x78b957,
    road: 0xe0b84b,
    landmark: 0xe3a23a,
  };
  return colors[place.kind];
}

function stickerColor(kind: VoxelStickerKind): number {
  const colors: Record<VoxelStickerKind, number> = {
    home: 0xd8efcf,
    shop: 0xd8e9ff,
    park: 0xcce9b5,
    favorite: 0xfff3b0,
    idea: 0xffd7c5,
    question: 0xd6f0ed,
  };
  return colors[kind];
}

function stickerGlyph(kind: VoxelStickerKind): string {
  const glyphs: Record<VoxelStickerKind, string> = {
    home: "H",
    shop: "S",
    park: "P",
    favorite: "*",
    idea: "!",
    question: "?",
  };
  return glyphs[kind];
}

function animateTargets(targets: AnimatedTarget[]) {
  const elapsed = performance.now() / 1000;
  for (const item of targets) {
    if (item.mode === "pulse") {
      const pulse = (Math.sin(elapsed * 3) + 1) / 2;
      item.target.alpha = item.baseAlpha * (0.62 + pulse * 0.38);
      item.target.scale.set(1 + pulse * 0.05);
    } else {
      const pulse = (Math.sin(elapsed * 5) + 1) / 2;
      item.target.alpha = item.baseAlpha * (0.5 + pulse * 0.5);
    }
  }
}

function polygon(points: string, fill: number, alpha = 1, stroke = 0x242017) {
  const coordinates = points.split(" ").flatMap((point) => point.split(",").map(Number));
  return new Graphics().poly(coordinates, true).fill({ color: fill, alpha }).stroke({ color: stroke, width: 1.35 });
}

function drawPolyline(graphics: Graphics, points: ProjectedPoint[]) {
  points.forEach((point, index) => {
    if (index === 0) {
      graphics.moveTo(point.x, point.y);
      return;
    }
    graphics.lineTo(point.x, point.y);
  });
}

function isRenderableScene(scene: VoxelScene): boolean {
  return (
    scene.type === "voxelScene" &&
    Number.isFinite(scene.viewport.width) &&
    Number.isFinite(scene.viewport.height) &&
    Number.isFinite(scene.viewport.originX) &&
    Number.isFinite(scene.viewport.originY) &&
    scene.tiles.every((tile) => isPoint(tile.position)) &&
    scene.nodes.every((node) => isPoint(node.position)) &&
    scene.nodes.some((node) => node.id === scene.selectedNodeId) &&
    scene.nodes.some((node) => node.id === scene.clawd.nodeId)
  );
}

function isPoint(point: VoxelPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);
}

function project(scene: VoxelScene, point: VoxelPoint): ProjectedPoint {
  return {
    x: scene.viewport.originX + (point.x - point.y) * (scene.viewport.tileWidth / 2),
    y: scene.viewport.originY + (point.x + point.y) * (scene.viewport.tileHeight / 2) - point.z * scene.viewport.tileDepth,
  };
}

function diamondPoints(center: ProjectedPoint, width: number, height: number): string {
  return [
    `${center.x},${center.y - height / 2}`,
    `${center.x + width / 2},${center.y}`,
    `${center.x},${center.y + height / 2}`,
    `${center.x - width / 2},${center.y}`,
  ].join(" ");
}

function sidePoints(center: ProjectedPoint, width: number, height: number, depth: number, side: "left" | "right"): string {
  if (side === "left") {
    return [
      `${center.x - width / 2},${center.y}`,
      `${center.x},${center.y + height / 2}`,
      `${center.x},${center.y + height / 2 + depth}`,
      `${center.x - width / 2},${center.y + depth}`,
    ].join(" ");
  }

  return [
    `${center.x + width / 2},${center.y}`,
    `${center.x},${center.y + height / 2}`,
    `${center.x},${center.y + height / 2 + depth}`,
    `${center.x + width / 2},${center.y + depth}`,
  ].join(" ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number(value.toFixed(2))));
}
