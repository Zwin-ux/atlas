import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Application, Container, Graphics, Text } from "pixi.js";
import type { AtlasNode, VoxelPoint, VoxelScene, VoxelTile } from "@atlas/core/voxel";
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
  open: { top: 0xefe3c8, left: 0xd5c7a8, right: 0xc6b893 },
  residential: { top: 0xd8efcf, left: 0xa8c99d, right: 0x8fb681 },
  commercial: { top: 0xd8e9ff, left: 0x9fbfe6, right: 0x87a9d4 },
  route: { top: 0xfff5c4, left: 0xd9c878, right: 0xc3b266 },
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
  activeStepId,
  onSelectNode,
  fallback,
}: PixiVoxelSceneViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const animatedRef = useRef<AnimatedTarget[]>([]);
  const selectNodeRef = useRef(onSelectNode);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(scene.camera?.initialZoom ?? 1);
  const [labelsVisible, setLabelsVisible] = useState(true);

  const renderable = useMemo(() => isRenderableScene(scene), [scene]);

  useEffect(() => {
    selectNodeRef.current = onSelectNode;
  }, [onSelectNode]);

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
      activeStepId,
      zoom,
      labelsVisible,
      animated: animatedRef.current,
      onSelectNode: (nodeId) => selectNodeRef.current(nodeId),
    });
  }, [activeStepId, labelsVisible, ready, renderable, scene, selectedNodeId, zoom]);

  if (!renderable || failed) return <>{fallback}</>;

  return (
    <div className="pixi-map-shell">
      <div ref={mountRef} className="pixi-map-host" aria-label={`${scene.county.name} tactical voxel board`} />
      <div className="pixi-map-controls" aria-label="Map controls">
        <button type="button" onClick={() => setZoom((value) => clamp(value - 0.1, scene.camera?.minZoom ?? 0.8, scene.camera?.maxZoom ?? 1.35))}>
          -
        </button>
        <button type="button" onClick={() => setZoom(scene.camera?.initialZoom ?? 1)}>
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
        <span><i className="legend-drop" />Drop</span>
        <span><i className="legend-route" />Route</span>
        <span><i className="legend-signal" />Signal</span>
        <span><i className="legend-risk" />Risk</span>
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
  activeStepId,
  zoom,
  labelsVisible,
  animated,
  onSelectNode,
}: {
  app: Application;
  world: Container;
  mount: HTMLDivElement;
  scene: VoxelScene;
  selectedNodeId: string;
  activeStepId: string | undefined;
  zoom: number;
  labelsVisible: boolean;
  animated: AnimatedTarget[];
  onSelectNode: (nodeId: string) => void;
}) {
  const width = Math.max(320, mount.clientWidth || scene.viewport.width);
  const height = Math.max(260, mount.clientHeight || Math.round((width * scene.viewport.height) / scene.viewport.width));
  app.renderer.resize(width, height);
  world.removeChildren();
  animated.length = 0;

  const sceneScale = Math.min(width / scene.viewport.width, height / scene.viewport.height) * zoom;
  const compactMap = width < 620;
  world.scale.set(sceneScale);
  world.position.set((width - scene.viewport.width * sceneScale) / 2, (height - scene.viewport.height * sceneScale) / 2);

  world.addChild(new Graphics().rect(0, 0, scene.viewport.width, scene.viewport.height).fill({ color: 0xf7efd8 }));
  drawGrid(world, scene);

  for (const tile of scene.tiles) {
    drawTile(world, scene, tile);
  }

  drawEdges(world, scene);
  drawRoute(world, scene, animated);
  drawObjects(world, scene, labelsVisible && width >= 900, animated);
  drawMarkers(world, scene, animated);
  drawNodes(world, scene, selectedNodeId, labelsVisible, compactMap, onSelectNode);
  drawClawd(world, scene, animated);
  drawPhaseStamp(world, scene, activeStepId);
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

function drawClawd(world: Container, scene: VoxelScene, animated: AnimatedTarget[]) {
  const node = scene.nodes.find((item) => item.id === scene.clawd.nodeId) ?? scene.nodes.find((item) => item.id === scene.selectedNodeId);
  if (!node) return;
  const point = project(scene, node.position);
  const clawd = new Container();
  const body = new Graphics()
    .roundRect(point.x - 24, point.y - 64, 48, 34, 7)
    .fill({ color: 0xfff8e9 })
    .stroke({ color: 0x242017, width: 2 })
    .circle(point.x - 10, point.y - 50, 2.8)
    .fill({ color: 0x242017 })
    .circle(point.x + 10, point.y - 50, 2.8)
    .fill({ color: 0x242017 });
  const mouth = new Graphics().moveTo(point.x - 8, point.y - 42).lineTo(point.x, point.y - 37).lineTo(point.x + 8, point.y - 42).stroke({ color: 0x242017, width: 2 });
  const ring = new Graphics().circle(point.x, point.y - 47, 32).stroke({ color: 0x0d8f8a, alpha: 0.55, width: 3 });
  clawd.addChild(ring, body, mouth, makeLabel(scene.clawd.label, point.x, point.y - 73, 10));
  if (scene.clawd.pulse) animated.push({ target: ring, mode: "pulse", baseAlpha: 0.7 });
  world.addChild(clawd);
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
