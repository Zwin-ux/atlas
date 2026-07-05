import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Application, Container, Filter, GlProgram, Graphics, Sprite, Text } from "pixi.js";
import {
  CITY_WORLD_TILE_BASIS,
  cityWorldDiamondPoints,
  cityWorldExpandViewportFrame,
  cityWorldFrameContainsFrame,
  cityWorldScreenCenterForCamera,
  cityWorldViewportFrameForPreset,
  compileCityWorldSceneWindow,
  projectCityWorldPoint,
} from "@atlas/core/voxel";
import type {
  CityWorldActor,
  CityWorldBuilding,
  CityWorldGroundTone,
  CityWorldLot,
  CityWorldLotContactGrammar,
  CityWorldPin,
  CityWorldPlace,
  CityWorldPoint,
  CityWorldProp,
  CityWorldRenderCommand,
  CityWorldRenderCommandKind,
  CityWorldRoadContactGrammar,
  CityWorldRoadSegment,
  CityWorldScene,
  CityWorldTerrainContactGrammar,
  CityWorldTerrainTile,
  CityWorldTileEdge,
  CityWorldViewportFrame,
} from "@atlas/core/voxel";
import { createCityWorldAtlasResolver, loadCityWorldAtlasTextures, type CityWorldAtlasResolver, type CityWorldTextureMap, type ResolvedCityWorldAsset } from "./cityWorldAtlasResolver";

type CityWorldCameraPresetId = CityWorldScene["cameraPresets"][number]["id"];
type CityWorldDebugMode = "engine";

export type CityWorldRendererHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  center: () => void;
};

type CityWorldRendererProps = {
  scene: CityWorldScene;
  selectedPlaceId?: string | undefined;
  cameraPresetId?: CityWorldCameraPresetId | undefined;
  debugMode?: CityWorldDebugMode | undefined;
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
  "terrainLayer" | "roadLayer" | "lotLayer" | "padLayer" | "shadowLayer" | "buildingLayer" | "propLayer" | "actorLayer" | "labelLayer" | "markerLayer" | "hudBridgeLayer",
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
  asset: ResolvedCityWorldAsset;
};

type RoadJoint = {
  point: CityWorldPoint;
  roads: CityWorldRoadSegment[];
};

const TILE_WIDTH = CITY_WORLD_TILE_BASIS.tileWidth;
const TILE_HEIGHT = CITY_WORLD_TILE_BASIS.tileHeight;
const TILE_DEPTH = CITY_WORLD_TILE_BASIS.tileDepth;
const STREAMING_WINDOW_MARGIN_TILES = 3;
const STREAMING_REFRESH_MARGIN_TILES = 0.75;

// ---- Unified sun model ----------------------------------------------------
// One fixed key light for the whole scene: sun sits to the screen upper-left
// at roughly 40 degrees elevation. Every face in the world shades from the
// same source: tops are brightest (warm), lower-left faces catch the sun,
// lower-right faces fall into cool shade, and cast shadows skew to the
// lower-right along the sun->ground vector.
const SUN_WARM_TINT = 0xffe2ae;
const SUN_COOL_TINT = 0x46658a;
const CAST_SHADOW_COLOR = 0x27404b;
const CAST_SHADOW_ALPHA = 0.5;
// Screen-space ground offset of a cast shadow per pixel of object height.
const CAST_SHADOW_VECTOR = { x: 0.92, y: 0.21 };
const BACKGROUND_COLOR = 0xa6b87c;

const TERRAIN_COLORS = {
  grass: 0xa3b877,
  park: 0x83aa64,
  plaza: 0xd6c49a,
  water: 0x5fadc4,
  sidewalk: 0xc2c7a0,
} satisfies Record<CityWorldTerrainTile["kind"], number>;

const DRAFT_TERRAIN_COLORS = {
  grass: 0xa9b981,
  park: 0x8cab6e,
  plaza: 0xd8c599,
  water: 0x67aabc,
  sidewalk: 0xc6bd92,
} satisfies Record<CityWorldTerrainTile["kind"], number>;

const LOT_COLORS = {
  home: 0xbdcd90,
  shop: 0xe0cba2,
  park: 0x84ad68,
  gym: 0xb4cbd4,
  apartments: 0xd4c1a4,
  civic: 0xdfd0ae,
  waterfront: 0x93ccd4,
} satisfies Record<CityWorldLot["kind"], number>;

const DRAFT_LOT_COLORS = {
  home: 0xc6c791,
  shop: 0xdcc08e,
  park: 0x8bad6c,
  gym: 0xcccaae,
  apartments: 0xd2bd9d,
  civic: 0xdecca4,
  waterfront: 0x97c6ca,
} satisfies Record<CityWorldLot["kind"], number>;

const PARKED_CAR_COLORS = [0xc65a4e, 0x4a7ba4, 0x63a06e, 0xdcc57a, 0xa96687];

// ---- Ground contact grammar (0.52E Diorama Engine) --------------------------
// Contact treatment is authored by the compiler as typed metadata
// (visualGrammar.terrainContact / roadContact / lotContact). These resolvers
// are the ONLY place a legacy scene without metadata falls back to id-prefix
// or kind derivation — every draw function below consumes the resolved
// grammar and never re-derives contact treatment at draw time.

function groundToneFromId(id: string): CityWorldGroundTone {
  if (id.startsWith("draft-")) return "draft";
  if (id.startsWith("shell-")) return "shell";
  return "public";
}

function resolveTerrainContact(tile: CityWorldTerrainTile): CityWorldTerrainContactGrammar {
  return tile.visualGrammar?.terrainContact ?? { tone: groundToneFromId(tile.id), contactShadow: false };
}

function resolveRoadContact(road: CityWorldRoadSegment): CityWorldRoadContactGrammar {
  return (
    road.visualGrammar?.roadContact ?? {
      profile: road.kind === "crosswalk" ? "painted" : road.kind === "driveway" ? "apron" : "embedded",
      tone: groundToneFromId(road.id),
      laneMarking:
        road.kind === "avenue" ? "avenue_dash" : road.kind === "street" ? "street_dash" : road.kind === "driveway" ? "apron_dash" : "none",
    }
  );
}

function resolveLotContact(lot: CityWorldLot): CityWorldLotContactGrammar {
  return (
    lot.visualGrammar?.lotContact ?? {
      profile: lot.kind === "waterfront" ? "shore" : lot.kind === "park" ? "green" : lot.kind === "shop" || lot.kind === "gym" ? "apron" : "foundation",
      tone: groundToneFromId(lot.id),
    }
  );
}

// Tone tables keep shell counties honest (near-silent ground detail) and
// hidden drafts muted, while the public county carries the full treatment.
const TERRAIN_SEAM_TONE_STYLE: Record<CityWorldGroundTone, { seamAlpha: number; lipAlpha: number; strandAlpha: number; wetAlpha: number }> = {
  public: { seamAlpha: 0.3, lipAlpha: 0.2, strandAlpha: 0.42, wetAlpha: 0.3 },
  draft: { seamAlpha: 0.14, lipAlpha: 0.09, strandAlpha: 0.2, wetAlpha: 0.14 },
  shell: { seamAlpha: 0.05, lipAlpha: 0, strandAlpha: 0, wetAlpha: 0 },
};

const LOT_CURB_CUT_STYLE = {
  apron: 0xd9c89c,
  groove: 0x655742,
  walk: 0xefdcb0,
} as const;

// Diamond-edge geometry on the 2:1 iso grid. north = y-1 neighbor,
// east = x+1, south = y+1, west = x-1 (matches the compiler's edge authoring).
function tileEdgeSegment(point: ProjectedPoint, width: number, height: number, side: CityWorldTileEdge): { from: ProjectedPoint; to: ProjectedPoint } {
  const top = { x: point.x, y: point.y - height / 2 };
  const right = { x: point.x + width / 2, y: point.y };
  const bottom = { x: point.x, y: point.y + height / 2 };
  const left = { x: point.x - width / 2, y: point.y };

  if (side === "north") return { from: top, to: right };
  if (side === "east") return { from: right, to: bottom };
  if (side === "south") return { from: bottom, to: left };
  return { from: left, to: top };
}

function insetEdgeSegment(point: ProjectedPoint, segment: { from: ProjectedPoint; to: ProjectedPoint }, inset: number): { from: ProjectedPoint; to: ProjectedPoint } {
  return {
    from: { x: segment.from.x + (point.x - segment.from.x) * inset, y: segment.from.y + (point.y - segment.from.y) * inset },
    to: { x: segment.to.x + (point.x - segment.to.x) * inset, y: segment.to.y + (point.y - segment.to.y) * inset },
  };
}

function lotCurbPoint(point: ProjectedPoint, width: number, height: number, edge: CityWorldTileEdge): ProjectedPoint {
  const segment = tileEdgeSegment(point, width, height, edge);
  return {
    x: (segment.from.x + segment.to.x) / 2,
    y: (segment.from.y + segment.to.y) / 2,
  };
}

// ---- Whole-canvas golden-hour grade ---------------------------------------
// One post pass over the Pixi stage: gentle contrast S-curve, warm-highlight /
// cool-shadow split tone, soft vignette, warm atmospheric edge haze, and a
// 1-bit dither to kill gradient banding. Physically motivated (sunlight +
// atmosphere), not a glow effect.
const GRADE_VERTEX_SHADER = `
in vec2 aPosition;
out vec2 vTextureCoord;
out vec2 vFrameCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
    vFrameCoord = aPosition;
}
`;

const GRADE_FRAGMENT_SHADER = `
in vec2 vTextureCoord;
in vec2 vFrameCoord;
out vec4 finalColor;

uniform sampler2D uTexture;

void main(void)
{
    vec4 source = texture(uTexture, vTextureCoord);
    vec3 c = source.rgb;

    // S-curve for form contrast — firmer than before so directional wall
    // shading survives the grade instead of washing to a matte pastel.
    c = mix(c, c * c * (3.0 - 2.0 * c), 0.38);

    // Slight saturation trim keeps the palette calm.
    float luma = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(luma), c, 0.9);

    // Golden-hour split tone: warm sunlit highlights, cool shadows.
    vec3 warm = vec3(1.055, 1.005, 0.915);
    vec3 cool = vec3(0.925, 0.975, 1.065);
    c *= mix(cool, warm, smoothstep(0.16, 0.86, luma));

    // Soft vignette pulls focus to the district.
    vec2 p = vFrameCoord - 0.5;
    float radius = dot(p, p);
    float vignette = mix(0.86, 1.0, smoothstep(0.62, 0.12, radius));
    c *= vignette;

    // Light atmospheric haze toward a warm sky tone at the frame edges — kept
    // to the outer corners only so it frames without flattening the district.
    float haze = smoothstep(0.34, 0.66, radius);
    c = mix(c, vec3(0.955, 0.93, 0.83), haze * 0.07);

    // Fine dither hides banding in the large ground gradients.
    float noise = fract(sin(dot(vFrameCoord, vec2(12.9898, 78.233))) * 43758.5453);
    c += (noise - 0.5) * (1.6 / 255.0);

    finalColor = vec4(c, source.a);
}
`;

function createAtlasGradeFilter(): Filter {
  return new Filter({
    glProgram: GlProgram.from({
      vertex: GRADE_VERTEX_SHADER,
      fragment: GRADE_FRAGMENT_SHADER,
      name: "atlas-golden-hour-grade",
    }),
    resources: {},
  });
}

export const CityWorldRenderer = forwardRef<CityWorldRendererHandle, CityWorldRendererProps>(function CityWorldRenderer(
  { scene, selectedPlaceId, cameraPresetId, debugMode, onSelectPlace },
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
  const activeWindowFrameRef = useRef<CityWorldViewportFrame | null>(null);
  const pendingWindowRefreshRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [hoverPlaceId, setHoverPlaceId] = useState<string | undefined>();
  const [atlasTextures, setAtlasTextures] = useState<CityWorldTextureMap>({});
  const [windowRefreshKey, setWindowRefreshKey] = useState(0);

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
        background: BACKGROUND_COLOR,
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
      // Backdrop lives inside the stage so the post grade (vignette/haze)
      // covers the open ground beyond the streamed tile window too.
      const backdrop = new Graphics();
      const paintBackdrop = () => {
        backdrop.clear().rect(0, 0, app.screen.width + 2, app.screen.height + 2).fill({ color: BACKGROUND_COLOR });
      };
      paintBackdrop();
      app.renderer.on("resize", paintBackdrop);
      app.stage.addChild(backdrop);
      const world = new Container();
      world.sortableChildren = true;
      worldRef.current = world;
      app.stage.addChild(world);
      try {
        app.stage.filters = [createAtlasGradeFilter()];
        app.stage.filterArea = app.screen;
      } catch (error) {
        console.warn("Atlas golden-hour grade filter unavailable. Continuing without post grade.", error);
      }
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
    activeWindowFrameRef.current = null;
    pendingWindowRefreshRef.current = false;

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
  }, [cameraPresetId, ready, scene.id]);

  useEffect(() => {
    const app = appRef.current;
    const world = worldRef.current;
    const mount = mountRef.current;
    if (!ready || !app || !world || !mount) return;
    const activeCameraPresetId = resolveCameraPresetId(scene, cameraPresetId, mount.clientWidth);
    const viewportFrame = rendererViewportFrame(mount, cameraRef.current, activeCameraPresetId, STREAMING_WINDOW_MARGIN_TILES);
    const sceneWindowFrame = drawScene(world, scene, activeCameraPresetId, viewportFrame, selectedPlaceId ?? scene.hudDefaults.selectedPlaceId, hoverPlaceId, atlasTextures, debugMode, (placeId) => {
      if (!movedRef.current) selectPlaceRef.current(placeId);
    }, setHoverPlaceId, animatedRef.current);
    activeWindowFrameRef.current = sceneWindowFrame;
    applyCamera();
  }, [atlasTextures, cameraPresetId, debugMode, hoverPlaceId, ready, scene, selectedPlaceId, windowRefreshKey]);

  function zoomBy(multiplier: number) {
    const camera = cameraRef.current;
    camera.zoom = clamp(camera.zoom * multiplier, camera.minZoom, camera.maxZoom);
    applyCamera();
  }

  function resetCamera(nextScene: CityWorldScene) {
    const mount = mountRef.current;
    const world = worldRef.current;
    if (!mount || !world) return;
    const requestedPreset = cameraPresetId ? nextScene.cameraPresets.find((item) => item.id === cameraPresetId) : undefined;
    const preset =
      requestedPreset ??
      (mount.clientWidth < 720 ? nextScene.cameraPresets.find((item) => item.id === "mobile") : nextScene.cameraPresets.find((item) => item.id === "desktop"));
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
    requestWindowRefreshIfNeeded();
  }

  function requestWindowRefreshIfNeeded() {
    const mount = mountRef.current;
    const activeFrame = activeWindowFrameRef.current;
    if (!mount || !activeFrame || pendingWindowRefreshRef.current) return;
    const activeCameraPresetId = resolveCameraPresetId(sceneRef.current, cameraPresetId, mount.clientWidth);
    const neededFrame = rendererViewportFrame(mount, cameraRef.current, activeCameraPresetId, STREAMING_REFRESH_MARGIN_TILES);
    if (cityWorldFrameContainsFrame(activeFrame, neededFrame)) return;
    pendingWindowRefreshRef.current = true;
    window.requestAnimationFrame(() => {
      pendingWindowRefreshRef.current = false;
      setWindowRefreshKey((value) => value + 1);
    });
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
  cameraPresetId: CityWorldCameraPresetId,
  viewportFrame: CityWorldViewportFrame,
  selectedPlaceId: string,
  hoverPlaceId: string | undefined,
  atlasTextures: CityWorldTextureMap,
  debugMode: CityWorldDebugMode | undefined,
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
  const includeLabels = !shouldHideCityWorldLabels();
  const sceneWindow = compileCityWorldSceneWindow(scene, cameraPresetId, {
    includeLabels,
    includeDebug: debugMode === "engine",
    viewportFrame,
  });
  const renderCommands = sceneWindow.visibleCommands;

  for (const tile of orderedSceneItems(renderCommands, "terrain_tile", scene.terrainTiles)) drawTerrainTile(layers.terrainLayer, tile);
  drawRoadNetwork(layers.roadLayer, orderedSceneItems(renderCommands, "road_segment", scene.roadSegments));
  for (const lot of orderedSceneItems(renderCommands, "lot", scene.lots)) drawLot(layers.lotLayer, lot);

  const buildings = orderedSceneItems(renderCommands, "building", scene.buildings);
  for (const building of buildings) drawBuilding(layers, building, building.placeId === selectedPlaceId, building.placeId === hoverPlaceId, atlas);

  const props = orderedSceneItems(renderCommands, "prop", scene.props);
  for (const prop of props) drawProp(layers.propLayer, prop, animated, atlas);
  const actors = orderedSceneItems(renderCommands, "actor", scene.actors);
  for (const actor of actors) drawActor(layers.actorLayer, actor, animated, atlas);
  for (const place of orderedSceneItems(renderCommands, "place_marker", scene.places)) drawPlaceMarker(layers.markerLayer, place, selectedPlaceId, hoverPlaceId, onSelectPlace, onHoverPlace, animated);
  for (const pin of orderedSceneItems(renderCommands, "pin", scene.pins)) drawPin(layers.markerLayer, pin, atlas);
  if (includeLabels) {
    for (const place of orderedSceneItems(renderCommands, "place_label", scene.places)) drawPlaceLabel(layers.labelLayer, place, selectedPlaceId, hoverPlaceId);
  }
  if (debugMode === "engine") drawEngineDebugOverlay(layers.hudBridgeLayer, scene);
  return sceneWindow.frame;
}

function shouldHideCityWorldLabels(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("atlasNoLabels") === "1";
}

function resolveCameraPresetId(scene: CityWorldScene, requestedId: CityWorldCameraPresetId | undefined, width: number): CityWorldCameraPresetId {
  if (requestedId && scene.cameraPresets.some((item) => item.id === requestedId)) return requestedId;
  const responsiveId = width < 720 ? "mobile" : "desktop";
  if (scene.cameraPresets.some((item) => item.id === responsiveId)) return responsiveId;
  return scene.cameraPresets[0]?.id ?? "desktop";
}

function rendererViewportFrame(mount: HTMLDivElement, camera: CameraState, cameraPresetId: CityWorldCameraPresetId, marginTiles: number): CityWorldViewportFrame {
  const center = cityWorldScreenCenterForCamera({
    x: camera.x,
    y: camera.y,
    zoom: camera.zoom,
    viewportWidth: mount.clientWidth,
    viewportHeight: mount.clientHeight,
  });
  return cityWorldExpandViewportFrame(cityWorldViewportFrameForPreset(cameraPresetId, center, camera.zoom), marginTiles);
}

function orderedSceneItems<T extends { id: string }>(
  commands: readonly CityWorldRenderCommand[],
  kind: CityWorldRenderCommandKind,
  items: T[],
): T[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  return commands
    .filter((command) => command.kind === kind)
    .map((command) => itemById.get(command.sourceId))
    .filter(isDefined);
}

function isDefined<T>(item: T | undefined): item is T {
  return item !== undefined;
}

function drawEngineDebugOverlay(layer: Container, scene: CityWorldScene) {
  for (const tile of scene.terrainTiles) {
    const massing = tile.visualGrammar?.terrainChunkMassing ?? "none";
    if (massing === "none") continue;
    const point = project(tile.position);
    const color = debugColorForMassing(massing);
    const outline = new Graphics();
    outline.poly(diamondPoints(point, TILE_WIDTH * 1.18, TILE_HEIGHT * 1.12), true);
    outline.stroke({ color, alpha: 0.42, width: 1.4, cap: "round", join: "round" });
    layer.addChild(outline);
  }

  for (const road of scene.roadSegments) {
    const from = project(road.from);
    const to = project(road.to);
    const line = new Graphics()
      .moveTo(from.x, from.y)
      .lineTo(to.x, to.y);
    line.stroke({ color: 0x55d7ff, alpha: 0.36, width: Math.max(1.2, road.width), cap: "round", join: "round" });
    layer.addChild(line);
  }

  for (const lot of scene.lots) {
    const point = project(lot.position);
    const outline = new Graphics();
    outline.poly(diamondPoints(point, lot.width * TILE_WIDTH, lot.depth * TILE_HEIGHT), true);
    outline.stroke({ color: 0xffd166, alpha: 0.34, width: 1.2, cap: "round", join: "round" });
    layer.addChild(outline);
  }

  for (const building of scene.buildings) {
    const point = project(building.position);
    const family = building.visualGrammar?.objectFamily ?? "none";
    const color = debugColorForObjectFamily(family);
    const outline = new Graphics();
    outline.poly(diamondPoints(point, building.width * TILE_WIDTH, building.depth * TILE_HEIGHT), true);
    outline.stroke({ color, alpha: 0.58, width: building.visualGrammar?.clusterRole === "anchor" ? 2 : 1.2, cap: "round", join: "round" });
    if (building.visualGrammar?.noLabelPriority === "primary_anchor") {
      outline.circle(point.x, point.y - building.height * TILE_DEPTH - 14, 5).fill({ color, alpha: 0.72 });
    }
    layer.addChild(outline);
    if (building.visualGrammar?.clusterRole === "anchor" || building.visualGrammar?.noLabelPriority === "primary_anchor") {
      layer.addChild(debugText(familyShortLabel(family), point.x, point.y - building.height * TILE_DEPTH - 24, color));
    }
  }
}

function debugColorForMassing(massing: NonNullable<CityWorldTerrainTile["visualGrammar"]>["terrainChunkMassing"]) {
  if (massing === "outer_world_edge_mass") return 0x335cff;
  if (massing === "civic_plinth_mass") return 0xff9d00;
  if (massing === "residential_shelf_mass") return 0x48cc6c;
  if (massing === "commercial_slab_mass") return 0xffcf33;
  if (massing === "park_basin_cut_mass") return 0x2f9e44;
  if (massing === "waterfront_bank_cut_mass") return 0x22b8cf;
  if (massing === "shell_boundary_mass") return 0x8c8c8c;
  return 0xbd6cff;
}

function debugColorForObjectFamily(family: string) {
  if (family === "residential_kit") return 0xf28c52;
  if (family === "commerce_strip") return 0xf4d35e;
  if (family === "civic_landmark") return 0x80bfff;
  if (family === "lowrise_cluster") return 0xb197fc;
  if (family === "service_block") return 0x63e6be;
  if (family === "venue_anchor") return 0xff6b6b;
  if (family === "transit_anchor") return 0x4dabf7;
  return 0xffffff;
}

function familyShortLabel(family: string) {
  if (family === "residential_kit") return "RES";
  if (family === "commerce_strip") return "COM";
  if (family === "civic_landmark") return "CIV";
  if (family === "lowrise_cluster") return "LOW";
  if (family === "service_block") return "SVC";
  if (family === "venue_anchor") return "VEN";
  if (family === "transit_anchor") return "TRN";
  return "OBJ";
}

function debugText(text: string, x: number, y: number, color: number) {
  const label = new Text({
    text,
    style: {
      fill: color,
      fontFamily: "Arial",
      fontSize: 10,
      fontWeight: "900",
      stroke: { color: 0x10160f, width: 3 },
    },
  });
  label.anchor.set(0.5);
  label.position.set(x, y);
  return label;
}

function createLayers(): LayerMap {
  return {
    terrainLayer: namedLayer("terrainLayer"),
    roadLayer: namedLayer("roadLayer"),
    lotLayer: namedLayer("lotLayer"),
    padLayer: namedLayer("padLayer"),
    shadowLayer: namedLayer("shadowLayer"),
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
  const contact = resolveTerrainContact(tile);
  const draftTile = contact.tone === "draft";
  const baseColor = draftTile ? DRAFT_TERRAIN_COLORS[tile.kind] : TERRAIN_COLORS[tile.kind];
  // Deterministic tonal variation: two low-frequency waves plus a whisper of
  // per-tile hash so the ground reads as planted terrain, not a flat board —
  // and not a checkerboard. Calm range only.
  const lowFrequencyTone =
    Math.sin(tile.position.x * 0.16 + tile.position.y * 0.23) * 3.4 +
    Math.sin(tile.position.x * 0.055 - tile.position.y * 0.083) * 3.0;
  const toneHash = ((tile.position.x * 73856093) ^ (tile.position.y * 19349663) ^ (tile.variant * 83492791)) >>> 0;
  const hashTone = ((toneHash % 5) - 2) * 0.8;
  const toneScale = tile.kind === "water" ? 0.7 : tile.kind === "grass" ? 1.25 : 0.6;
  const variation = (tile.variant - 2) * (tile.kind === "water" ? 2.4 : tile.kind === "grass" ? 1.2 : 1.8) + (lowFrequencyTone + hashTone) * toneScale;
  // Ground sits a half-step below the sunlit rooftops so built forms read
  // bright against the terrain instead of blending into it.
  const color = mixColor(scaleColor(shadeColor(baseColor, variation), 0.98), SUN_WARM_TINT, 0.07);
  const alpha = draftTile ? (tile.kind === "grass" ? 0.84 : 0.92) : tile.kind === "water" ? 0.97 : tile.kind === "grass" ? 0.92 : 0.94;
  const strokeAlpha = draftTile ? (tile.kind === "grass" ? 0.018 : 0.1) : tile.kind === "grass" ? 0.026 : tile.kind === "water" ? 0.18 : 0.12;
  const graphic = polygon(diamondPoints(point, TILE_WIDTH + 1, TILE_HEIGHT + 1), color, alpha, tile.kind === "water" ? 0x3a8ea1 : draftTile ? 0x7a8a58 : 0x6d824f, strokeAlpha);
  drawTerrainChunkMassing(layer, tile, point, color);
  drawTerrainElevationEdges(layer, tile, point, color);

  if (tile.kind === "water") {
    // Gentle depth gradient + sheen: lighter toward the sun edge, darker below.
    graphic
      .poly([point.x - TILE_WIDTH * 0.5, point.y, point.x, point.y - TILE_HEIGHT * 0.5, point.x + TILE_WIDTH * 0.16, point.y - TILE_HEIGHT * 0.34, point.x - TILE_WIDTH * 0.28, point.y + TILE_HEIGHT * 0.1], true)
      .fill({ color: 0xa9dcE6, alpha: 0.16 })
      .poly([point.x + TILE_WIDTH * 0.5, point.y, point.x, point.y + TILE_HEIGHT * 0.5, point.x - TILE_WIDTH * 0.14, point.y + TILE_HEIGHT * 0.36, point.x + TILE_WIDTH * 0.26, point.y - TILE_HEIGHT * 0.08], true)
      .fill({ color: 0x2a6d84, alpha: 0.14 });
    if (tile.variant % 2 === 0) {
      graphic
        .moveTo(point.x - 11, point.y - 1)
        .lineTo(point.x + 13, point.y - 1)
        .stroke({ color: 0xe9fbff, alpha: 0.2, width: 1.1, cap: "round" });
    }
  } else if (tile.kind === "park" && tile.variant % 3 === 0) {
    graphic.circle(point.x - 5, point.y - 1, 1.8).fill({ color: 0xd8f0b2, alpha: 0.32 });
  } else if (tile.kind === "plaza" && tile.variant % 2 === 0) {
    graphic
      .moveTo(point.x - TILE_WIDTH * 0.22, point.y)
      .lineTo(point.x + TILE_WIDTH * 0.22, point.y)
      .stroke({ color: 0xf5e7c1, alpha: 0.26, width: 1 });
  } else if (tile.kind === "grass" && tile.variant === 4) {
    graphic.circle(point.x + 7, point.y + 1, 1.1).fill({ color: 0xe0efb4, alpha: 0.08 });
  }

  if (tile.kind === "grass") drawGrassFacet(graphic, tile, point);
  drawTerrainElevationChunkFace(graphic, tile, point, color);
  drawTerrainParcelComposition(graphic, tile, point);
  drawTerrainContactSeams(graphic, tile, point, contact, color);
  if (draftTile) drawDraftTerrainFacet(graphic, tile, point);
  layer.addChild(graphic);
}

// Material seams + water bank strands, authored by the compiler as
// terrainContact metadata. Seams are inset inside the owning tile so they
// survive the painter's draw order regardless of which neighbor drew last.
function drawTerrainContactSeams(graphic: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint, contact: CityWorldTerrainContactGrammar, color: number) {
  const style = TERRAIN_SEAM_TONE_STYLE[contact.tone];
  const edgeSides = contact.edgeSides ?? [];
  const waterEdgeSides = contact.waterEdgeSides ?? [];
  if (edgeSides.length === 0 && waterEdgeSides.length === 0) return;

  const width = TILE_WIDTH + 1;
  const height = TILE_HEIGHT + 1;

  if (edgeSides.length > 0 && style.seamAlpha > 0) {
    // Dark groove where the slab material meets the softer neighbor...
    for (const side of edgeSides) {
      const seam = insetEdgeSegment(point, tileEdgeSegment(point, width, height, side), 0.08);
      graphic.moveTo(seam.from.x, seam.from.y).lineTo(seam.to.x, seam.to.y);
    }
    graphic.stroke({ color: shadeColor(color, -52), alpha: style.seamAlpha, width: 1.15, cap: "round", join: "round" });

    if (contact.contactShadow && style.lipAlpha > 0) {
      // ...with a sunlit lip just inside it, so the slab reads as a physical
      // step instead of a painted boundary.
      for (const side of edgeSides) {
        const lip = insetEdgeSegment(point, tileEdgeSegment(point, width, height, side), 0.2);
        graphic.moveTo(lip.from.x, lip.from.y).lineTo(lip.to.x, lip.to.y);
      }
      graphic.stroke({ color: shadeColor(color, 34), alpha: style.lipAlpha, width: 1, cap: "round", join: "round" });
    }
  }

  if (waterEdgeSides.length > 0 && style.strandAlpha > 0) {
    // Bank strand on the land side: a pale dry line above a darker wet line.
    for (const side of waterEdgeSides) {
      const strand = insetEdgeSegment(point, tileEdgeSegment(point, width, height, side), 0.1);
      graphic.moveTo(strand.from.x, strand.from.y).lineTo(strand.to.x, strand.to.y);
    }
    graphic.stroke({ color: 0xeadfb4, alpha: style.strandAlpha, width: 1.4, cap: "round", join: "round" });
    for (const side of waterEdgeSides) {
      const wet = insetEdgeSegment(point, tileEdgeSegment(point, width, height, side), 0.22);
      graphic.moveTo(wet.from.x, wet.from.y).lineTo(wet.to.x, wet.to.y);
    }
    graphic.stroke({ color: 0x3f7d8c, alpha: style.wetAlpha, width: 1.1, cap: "round", join: "round" });
  }
}

function drawTerrainChunkMassing(layer: Container, tile: CityWorldTerrainTile, point: ProjectedPoint, color: number) {
  const massing = tile.visualGrammar?.terrainChunkMassing ?? "none";
  if (massing === "none") return;

  const chunkEdge = tile.visualGrammar?.chunkEdge ?? "none";
  const config = terrainChunkMassingStyle(massing, color, chunkEdge);
  const width = TILE_WIDTH * config.widthScale;
  const height = TILE_HEIGHT * config.heightScale;
  const depth = config.depth;
  const shadow = polygon(
    diamondPoints({ x: point.x, y: point.y + depth + 3 }, width * 1.04, height * 1.02),
    0x1d2a22,
    config.shadowAlpha,
    0x1d2a22,
    0,
  );
  // Sun-consistent massing faces: lower-left face lit, lower-right in shade.
  const massLit = sunlitColor(config.rightColor, "sun");
  const massShade = sunlitColor(config.leftColor, "shade");
  const massAlpha = Math.min(config.faceAlpha * 1.9, 0.5);
  const leftFace = new Graphics()
    .moveTo(point.x - width * 0.5, point.y)
    .lineTo(point.x, point.y + height * 0.5)
    .lineTo(point.x, point.y + height * 0.5 + depth)
    .lineTo(point.x - width * 0.5, point.y + depth)
    .closePath()
    .fill({ color: massLit, alpha: massAlpha * 0.82 });
  const rightFace = new Graphics()
    .moveTo(point.x, point.y + height * 0.5)
    .lineTo(point.x + width * 0.5, point.y)
    .lineTo(point.x + width * 0.5, point.y + depth)
    .lineTo(point.x, point.y + height * 0.5 + depth)
    .closePath()
    .fill({ color: massShade, alpha: massAlpha });
  const underside = new Graphics()
    .moveTo(point.x - width * 0.5, point.y + depth)
    .lineTo(point.x, point.y + height * 0.5 + depth)
    .lineTo(point.x + width * 0.5, point.y + depth);
  underside.stroke({ color: config.rimColor, alpha: config.rimAlpha, width: config.rimWidth, cap: "round", join: "round" });
  layer.addChild(shadow, leftFace, rightFace, underside);

  if (config.strataAlpha > 0) {
    const strata = new Graphics()
      .moveTo(point.x - width * 0.38, point.y + depth * 0.52)
      .lineTo(point.x - width * 0.08, point.y + height * 0.18 + depth * 0.58)
      .lineTo(point.x + width * 0.28, point.y + depth * 0.5)
      .moveTo(point.x - width * 0.26, point.y + depth * 0.86)
      .lineTo(point.x, point.y + height * 0.28 + depth * 0.92)
      .lineTo(point.x + width * 0.24, point.y + depth * 0.84);
    strata.stroke({ color: config.strataColor, alpha: config.strataAlpha, width: 1.05, cap: "round", join: "round" });
    layer.addChild(strata);
  }
}

function terrainChunkMassingStyle(
  massing: NonNullable<CityWorldTerrainTile["visualGrammar"]>["terrainChunkMassing"],
  color: number,
  chunkEdge: NonNullable<CityWorldTerrainTile["visualGrammar"]>["chunkEdge"],
) {
  const structuralEdge = chunkEdge !== "none";
  if (massing === "outer_world_edge_mass") {
    return {
      depth: structuralEdge ? 14 : 9,
      widthScale: structuralEdge ? 1.26 : 1.16,
      heightScale: structuralEdge ? 1.13 : 1.07,
      leftColor: 0x637f55,
      rightColor: 0x779969,
      faceAlpha: structuralEdge ? 0.2 : 0.11,
      shadowAlpha: structuralEdge ? 0.065 : 0.035,
      rimColor: 0xf1e5bb,
      rimAlpha: structuralEdge ? 0.21 : 0.105,
      rimWidth: structuralEdge ? 1.65 : 1.05,
      strataColor: 0xf4dfb1,
      strataAlpha: structuralEdge ? 0.105 : 0.035,
    };
  }
  if (massing === "civic_plinth_mass") {
    return {
      depth: structuralEdge ? 15 : 11,
      widthScale: structuralEdge ? 1.22 : 1.13,
      heightScale: structuralEdge ? 1.14 : 1.08,
      leftColor: 0x8c8061,
      rightColor: 0xa99870,
      faceAlpha: structuralEdge ? 0.3 : 0.21,
      shadowAlpha: structuralEdge ? 0.1 : 0.065,
      rimColor: 0xf8e6bc,
      rimAlpha: structuralEdge ? 0.31 : 0.205,
      rimWidth: structuralEdge ? 1.9 : 1.35,
      strataColor: 0x8f805f,
      strataAlpha: structuralEdge ? 0.2 : 0.125,
    };
  }
  if (massing === "residential_shelf_mass") {
    return {
      depth: structuralEdge ? 10.5 : 6.4,
      widthScale: structuralEdge ? 1.16 : 1.06,
      heightScale: structuralEdge ? 1.09 : 1.02,
      leftColor: shadeColor(color, -42),
      rightColor: shadeColor(color, -30),
      faceAlpha: structuralEdge ? 0.18 : 0.095,
      shadowAlpha: structuralEdge ? 0.055 : 0.026,
      rimColor: 0xf0e2b7,
      rimAlpha: structuralEdge ? 0.18 : 0.085,
      rimWidth: structuralEdge ? 1.45 : 0.9,
      strataColor: 0xe7d6a4,
      strataAlpha: structuralEdge ? 0.095 : 0.025,
    };
  }
  if (massing === "commercial_slab_mass") {
    return {
      depth: structuralEdge ? 11 : 7.2,
      widthScale: structuralEdge ? 1.18 : 1.08,
      heightScale: structuralEdge ? 1.1 : 1.03,
      leftColor: 0x9a875f,
      rightColor: 0xb59d6d,
      faceAlpha: structuralEdge ? 0.22 : 0.125,
      shadowAlpha: structuralEdge ? 0.07 : 0.034,
      rimColor: 0xf6e6c2,
      rimAlpha: structuralEdge ? 0.245 : 0.125,
      rimWidth: structuralEdge ? 1.55 : 0.9,
      strataColor: 0x8c7855,
      strataAlpha: structuralEdge ? 0.14 : 0.05,
    };
  }
  if (massing === "park_basin_cut_mass") {
    return {
      depth: structuralEdge ? 10 : 5.8,
      widthScale: structuralEdge ? 1.15 : 1.04,
      heightScale: structuralEdge ? 1.08 : 1.02,
      leftColor: 0x6f8e58,
      rightColor: 0x83aa67,
      faceAlpha: structuralEdge ? 0.17 : 0.09,
      shadowAlpha: structuralEdge ? 0.052 : 0.022,
      rimColor: 0xe9dba8,
      rimAlpha: structuralEdge ? 0.18 : 0.075,
      rimWidth: structuralEdge ? 1.45 : 0.85,
      strataColor: 0x5f774a,
      strataAlpha: structuralEdge ? 0.09 : 0.018,
    };
  }
  if (massing === "waterfront_bank_cut_mass") {
    return {
      depth: structuralEdge ? 13 : 9,
      widthScale: structuralEdge ? 1.18 : 1.1,
      heightScale: structuralEdge ? 1.12 : 1.06,
      leftColor: 0x5f8d96,
      rightColor: 0x75aab2,
      faceAlpha: structuralEdge ? 0.28 : 0.18,
      shadowAlpha: structuralEdge ? 0.085 : 0.05,
      rimColor: 0xe9fbff,
      rimAlpha: structuralEdge ? 0.28 : 0.16,
      rimWidth: structuralEdge ? 1.8 : 1.2,
      strataColor: 0xd7f4f7,
      strataAlpha: structuralEdge ? 0.16 : 0.07,
    };
  }
  if (massing === "shell_boundary_mass") {
    return {
      depth: 6,
      widthScale: 1.05,
      heightScale: 1.02,
      leftColor: shadeColor(color, -30),
      rightColor: shadeColor(color, -22),
      faceAlpha: 0.12,
      shadowAlpha: 0.035,
      rimColor: 0xe8e0b3,
      rimAlpha: 0.09,
      rimWidth: 1,
      strataColor: 0xe8e0b3,
      strataAlpha: 0,
    };
  }
  return {
    depth: 8,
    widthScale: 1.08,
    heightScale: 1.04,
    leftColor: 0x8e7c57,
    rightColor: 0xa28d63,
    faceAlpha: 0.16,
    shadowAlpha: 0.045,
    rimColor: 0xe8d5a4,
    rimAlpha: 0.14,
    rimWidth: 1.1,
    strataColor: 0xd5bd87,
    strataAlpha: 0.08,
  };
}

function drawTerrainElevationEdges(layer: Container, tile: CityWorldTerrainTile, point: ProjectedPoint, color: number) {
  const elevation = tile.visualGrammar?.terrainElevation;
  if (!elevation || elevation === "flat_field" || elevation === "shell_flat") return;

  const hash = (tile.position.x * 29 + tile.position.y * 31 + tile.variant * 5) % 17;
  const raised = elevation === "raised_parcel_shelf" || elevation === "civic_plinth_shelf" || elevation === "hidden_draft_shelf";
  const cut = elevation === "water_edge_cut";
  const basin = elevation === "park_basin_shelf";
  const depth = elevation === "civic_plinth_shelf" ? 7 : cut ? 8 : basin ? 4 : 5;
  const sideColor = cut ? sunlitColor(0x6297a1, "shade") : sunlitColor(shadeColor(color, basin ? -8 : -12), "shade");
  const faceAlpha = cut ? 0.4 : elevation === "civic_plinth_shelf" ? 0.42 : 0.3;

  if (raised || cut || (basin && hash % 2 === 0)) {
    const frontFace = new Graphics()
      .moveTo(point.x - TILE_WIDTH * 0.5, point.y)
      .lineTo(point.x, point.y + TILE_HEIGHT * 0.5)
      .lineTo(point.x + TILE_WIDTH * 0.5, point.y)
      .lineTo(point.x + TILE_WIDTH * 0.5, point.y + depth)
      .lineTo(point.x, point.y + TILE_HEIGHT * 0.5 + depth)
      .lineTo(point.x - TILE_WIDTH * 0.5, point.y + depth)
      .closePath()
      .fill({ color: sideColor, alpha: faceAlpha });
    layer.addChild(frontFace);
  }

  if ((elevation === "civic_plinth_shelf" || cut || hash === 3 || hash === 11) && elevation !== "park_basin_shelf") {
    const strata = new Graphics()
      .moveTo(point.x - TILE_WIDTH * 0.36, point.y + TILE_HEIGHT * 0.12 + depth * 0.55)
      .lineTo(point.x - TILE_WIDTH * 0.08, point.y + TILE_HEIGHT * 0.28 + depth * 0.55)
      .lineTo(point.x + TILE_WIDTH * 0.28, point.y + TILE_HEIGHT * 0.1 + depth * 0.55);
    strata.stroke({ color: cut ? 0xe9fbff : 0xf3dfb2, alpha: cut ? 0.16 : 0.12, width: 1, cap: "round", join: "round" });
    layer.addChild(strata);
  }
}

function drawGrassFacet(graphic: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint) {
  const hash = (tile.position.x * 19 + tile.position.y * 23 + tile.variant * 11) % 29;

  if (hash === 0 || hash === 9 || hash === 21) {
    const patch = hash === 0 ? shadeColor(TERRAIN_COLORS.grass, 14) : hash === 9 ? shadeColor(TERRAIN_COLORS.grass, -12) : mixColor(TERRAIN_COLORS.grass, 0xcabf7e, 0.5);
    graphic
      .poly([point.x - 12, point.y - 2, point.x - 2, point.y - 7, point.x + 10, point.y - 1, point.x, point.y + 5], true)
      .fill({ color: patch, alpha: 0.1 });
  }

  if (hash === 3 || hash === 17) {
    graphic
      .moveTo(point.x - 13, point.y + 1)
      .lineTo(point.x - 2, point.y + 6)
      .lineTo(point.x + 12, point.y)
      .stroke({ color: 0xd9edaf, alpha: 0.09, width: 1, cap: "round", join: "round" });
  }

  if (hash === 6 || hash === 25) {
    graphic
      .poly([point.x + 4, point.y - 4, point.x + 13, point.y - 1, point.x + 6, point.y + 3, point.x - 1, point.y], true)
      .fill({ color: shadeColor(TERRAIN_COLORS.grass, -18), alpha: 0.08 });
  }
}

function drawTerrainParcelComposition(graphic: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint) {
  const composition = tile.visualGrammar?.terrainComposition;
  const profile = tile.visualGrammar?.terrainProfile;
  if (!composition || composition === "shell_boundary") return;

  const hash = (tile.position.x * 37 + tile.position.y * 41 + tile.variant * 7) % 31;
  const civic = composition === "civic_focus_field" || profile === "landmark_civic_ground";
  const commercial = composition === "commercial_apron_field";
  const waterfront = composition === "waterfront_edge_strata";
  const park = composition === "park_basin";
  const draft = composition === "hidden_draft_field";
  const quiet = composition === "quiet_field";
  const parcelColor = civic ? 0xe5d7ad : commercial ? 0xddc798 : park ? 0xbfdc91 : draft ? 0xd2cf98 : 0xc9dea0;
  const seamColor = civic || commercial ? 0xf5e9c9 : park ? 0xeaf1bb : draft ? 0xf2dfb4 : 0xe6efbd;
  const shadowColor = civic || commercial ? 0x7c765f : 0x587f4d;

  // Quiet outer fields still need a whisper of mowed-field weave so the map
  // edge reads as tended ground instead of an empty board — one facet per
  // ~4 tiles, at half the alpha of the fabric fields.
  if (quiet && hash % 4 !== 0) return;
  const quietScale = quiet ? 0.55 : 1;

  if (hash % 3 === 0) {
    graphic
      .poly(
        [
          point.x - TILE_WIDTH * 0.36,
          point.y - TILE_HEIGHT * 0.02,
          point.x - TILE_WIDTH * 0.08,
          point.y - TILE_HEIGHT * 0.18,
          point.x + TILE_WIDTH * 0.28,
          point.y - TILE_HEIGHT * 0.02,
          point.x,
          point.y + TILE_HEIGHT * 0.14,
        ],
        true,
      )
      .fill({ color: parcelColor, alpha: (civic ? 0.105 : commercial ? 0.09 : draft ? 0.07 : 0.075) * quietScale });
  }

  if (hash === 5 || hash === 13 || hash === 22 || (quiet && hash % 8 === 4)) {
    graphic
      .moveTo(point.x - TILE_WIDTH * 0.42, point.y + TILE_HEIGHT * 0.04)
      .lineTo(point.x - TILE_WIDTH * 0.1, point.y + TILE_HEIGHT * 0.2)
      .lineTo(point.x + TILE_WIDTH * 0.24, point.y + TILE_HEIGHT * 0.04)
      .stroke({ color: seamColor, alpha: (civic || commercial ? 0.18 : 0.12) * quietScale, width: 1, cap: "round", join: "round" });
  }

  if ((civic || commercial) && (hash === 2 || hash === 18)) {
    graphic
      .moveTo(point.x - TILE_WIDTH * 0.26, point.y - TILE_HEIGHT * 0.12)
      .lineTo(point.x + TILE_WIDTH * 0.24, point.y + TILE_HEIGHT * 0.12)
      .stroke({ color: shadowColor, alpha: 0.08, width: 1.2, cap: "round" });
  }

  if (park && (hash === 1 || hash === 15)) {
    graphic
      .moveTo(point.x - TILE_WIDTH * 0.28, point.y - TILE_HEIGHT * 0.08)
      .lineTo(point.x - TILE_WIDTH * 0.02, point.y + TILE_HEIGHT * 0.08)
      .lineTo(point.x + TILE_WIDTH * 0.24, point.y - TILE_HEIGHT * 0.06)
      .stroke({ color: 0xf0dba8, alpha: 0.16, width: 1.6, cap: "round", join: "round" });
  }

  if (waterfront && hash % 4 === 0) {
    graphic
      .moveTo(point.x - TILE_WIDTH * 0.34, point.y + TILE_HEIGHT * 0.02)
      .lineTo(point.x - TILE_WIDTH * 0.04, point.y + TILE_HEIGHT * 0.18)
      .lineTo(point.x + TILE_WIDTH * 0.3, point.y + TILE_HEIGHT * 0.02)
      .stroke({ color: 0xe9fbff, alpha: 0.2, width: 1.4, cap: "round", join: "round" });
  }
}

function drawTerrainElevationChunkFace(graphic: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint, color: number) {
  const elevation = tile.visualGrammar?.terrainElevation;
  const chunkEdge = tile.visualGrammar?.chunkEdge ?? "none";
  if (!elevation || (elevation === "flat_field" && chunkEdge === "none") || elevation === "shell_flat") return;

  const depth = terrainElevationDepth(elevation, chunkEdge);
  // Elevation risers obey the scene sun: the lower-left face is lit, the
  // lower-right face is in shade, so terrain steps read as real height.
  const leftShade = sunlitColor(shadeColor(color, elevation === "water_edge_cut" ? -16 : -8), "sun");
  const rightShade = sunlitColor(color, "shade");
  const faceAlpha =
    elevation === "hidden_draft_shelf"
      ? 0.3
      : elevation === "water_edge_cut"
        ? 0.5
        : elevation === "civic_plinth_shelf"
          ? 0.46
          : 0.38;

  if (depth > 0) {
    graphic
      .poly(
        [
          point.x - TILE_WIDTH * 0.5,
          point.y,
          point.x,
          point.y + TILE_HEIGHT * 0.5,
          point.x,
          point.y + TILE_HEIGHT * 0.5 + depth,
          point.x - TILE_WIDTH * 0.5,
          point.y + depth,
        ],
        true,
      )
      .fill({ color: leftShade, alpha: faceAlpha * 0.8 });
    graphic
      .poly(
        [
          point.x,
          point.y + TILE_HEIGHT * 0.5,
          point.x + TILE_WIDTH * 0.5,
          point.y,
          point.x + TILE_WIDTH * 0.5,
          point.y + depth,
          point.x,
          point.y + TILE_HEIGHT * 0.5 + depth,
        ],
        true,
      )
      .fill({ color: rightShade, alpha: faceAlpha });
  }

  if (chunkEdge !== "none") {
    const edgeColor =
      chunkEdge === "waterfront_bank_edge"
        ? 0xe9fbff
        : chunkEdge === "park_basin_edge"
          ? 0xe7dca9
          : chunkEdge === "hidden_draft_boundary"
            ? 0xd9c28b
            : 0xf2e5bd;
    const edgeAlpha = chunkEdge === "world_edge" ? 0.1 : chunkEdge === "parcel_cluster_edge" ? 0.13 : 0.18;
    graphic
      .moveTo(point.x - TILE_WIDTH * 0.5, point.y + depth * 0.45)
      .lineTo(point.x, point.y + TILE_HEIGHT * 0.5 + depth * 0.65)
      .lineTo(point.x + TILE_WIDTH * 0.5, point.y + depth * 0.45)
      .stroke({ color: edgeColor, alpha: edgeAlpha, width: chunkEdge === "waterfront_bank_edge" ? 1.4 : 1, cap: "round", join: "round" });
  }
}

function terrainElevationDepth(elevation: NonNullable<CityWorldTerrainTile["visualGrammar"]>["terrainElevation"], chunkEdge: NonNullable<CityWorldTerrainTile["visualGrammar"]>["chunkEdge"]) {
  if (elevation === "civic_plinth_shelf") return 5.5;
  if (elevation === "raised_parcel_shelf") return 4.2;
  if (elevation === "commercial_slab_field") return 4.8;
  if (elevation === "park_basin_shelf") return 3.2;
  if (elevation === "water_edge_cut") return 6.5;
  if (elevation === "hidden_draft_shelf") return 4;
  return chunkEdge && chunkEdge !== "none" ? 2.4 : 0;
}

function drawDraftTerrainFacet(graphic: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint) {
  const hash = (tile.position.x * 31 + tile.position.y * 17 + tile.variant * 13) % 23;

  if (tile.kind === "grass" && (hash === 2 || hash === 11 || hash === 19)) {
    graphic
      .poly([point.x - 14, point.y - 1, point.x - 5, point.y - 6, point.x + 8, point.y - 1, point.x - 1, point.y + 5], true)
      .fill({ color: 0xc7cf8d, alpha: 0.06 });
  }

  if (tile.kind === "plaza" && hash % 4 === 0) {
    graphic
      .moveTo(point.x - TILE_WIDTH * 0.34, point.y - TILE_HEIGHT * 0.02)
      .lineTo(point.x - TILE_WIDTH * 0.02, point.y + TILE_HEIGHT * 0.16)
      .lineTo(point.x + TILE_WIDTH * 0.32, point.y - TILE_HEIGHT * 0.01)
      .moveTo(point.x - TILE_WIDTH * 0.2, point.y - TILE_HEIGHT * 0.18)
      .lineTo(point.x + TILE_WIDTH * 0.18, point.y + TILE_HEIGHT * 0.02)
      .stroke({ color: 0xf2dfb4, alpha: 0.18, width: 1, cap: "round", join: "round" });
  }

  if (tile.kind === "park" && hash % 5 === 0) {
    graphic.circle(point.x + 4, point.y - 1, 1.6).fill({ color: 0xdde6aa, alpha: 0.16 });
  }
}

function drawRoadNetwork(layer: Container, roads: CityWorldRoadSegment[]) {
  const physicalRoads = roads.filter((road) => resolveRoadContact(road).profile !== "painted");
  for (const road of physicalRoads) drawRoadSegmentModule(layer, road);

  const joints = collectRoadJoints(physicalRoads);
  for (const joint of joints.sort((a, b) => a.point.x + a.point.y - (b.point.x + b.point.y))) {
    if (joint.roads.length > 1 || joint.roads.some((road) => resolveRoadContact(road).profile === "apron")) {
      drawRoadJointModule(layer, joint);
    }
  }

  for (const road of roads.filter((road) => resolveRoadContact(road).profile === "painted")) drawCrosswalkRoad(layer, road);
}

function drawRoadSegmentModule(layer: Container, road: CityWorldRoadSegment) {
  const start = project(road.from);
  const end = project(road.to);
  const baseWidth = road.width * 15.2;
  const contact = resolveRoadContact(road);
  const draftRoad = contact.tone === "draft";
  const apron = contact.profile === "apron";
  const cap = apron ? "round" : "butt";
  const shadow = new Graphics().moveTo(start.x, start.y + 7).lineTo(end.x, end.y + 7);
  shadow.stroke({ color: 0x263a34, alpha: draftRoad ? 0.2 : 0.16, width: baseWidth + (draftRoad ? 15 : 13), cap, join: "round" });
  const sideFace = new Graphics().moveTo(start.x, start.y + 4).lineTo(end.x, end.y + 4);
  sideFace.stroke({
    color: draftRoad ? (apron ? 0x8b846d : 0x4d554d) : apron ? 0x7c806f : 0x46514c,
    alpha: draftRoad ? (apron ? 0.44 : 0.56) : apron ? 0.34 : 0.48,
    width: baseWidth + 8,
    cap,
    join: "round",
  });

  const curb = new Graphics().moveTo(start.x, start.y).lineTo(end.x, end.y);
  curb.stroke({
    color: draftRoad ? (apron ? 0xc4b182 : 0xd8c28b) : apron ? 0xc1ae88 : 0xd6c996,
    alpha: draftRoad ? (apron ? 0.58 : 0.82) : apron ? 0.48 : 0.78,
    width: baseWidth + 7,
    cap,
    join: "round",
  });
  const bed = new Graphics().moveTo(start.x, start.y + 1).lineTo(end.x, end.y + 1);
  bed.stroke({
    color: draftRoad ? (apron ? 0x8e8c7d : 0x555e58) : apron ? 0x858b7e : 0x58635f,
    alpha: apron ? 0.82 : 0.98,
    width: baseWidth + 1,
    cap,
    join: "round",
  });
  const surface = new Graphics().moveTo(start.x, start.y - 1).lineTo(end.x, end.y - 1);
  surface.stroke({
    color: draftRoad ? (apron ? 0xa09c87 : 0x697069) : apron ? 0x969b8b : 0x68736d,
    alpha: draftRoad ? (apron ? 0.62 : 0.82) : apron ? 0.58 : 0.78,
    width: Math.max(4, baseWidth - 6),
    cap,
    join: "round",
  });
  layer.addChild(shadow, sideFace, curb, bed, surface);
  drawRoadEdgeBevels(layer, start, end, baseWidth, apron);
  drawRoadModuleSeams(layer, start, end, baseWidth, apron);
  if (draftRoad) drawDraftRoadMaterial(layer, start, end, baseWidth, contact);
  else drawPublicRoadMaterial(layer, start, end, baseWidth, contact);

  if (contact.laneMarking === "avenue_dash") {
    drawDashedLine(layer, start, end, 9, 12, draftRoad ? 0xe9d59c : 0xf3e3a4, 1.45, draftRoad ? 0.28 : 0.38);
  } else if (contact.laneMarking === "street_dash") {
    drawDashedLine(layer, start, end, 6, 10, draftRoad ? 0xe9d59c : 0xf3e3a4, 1.1, draftRoad ? 0.28 : 0.38);
  } else if (contact.laneMarking === "apron_dash") {
    drawDashedLine(layer, start, end, 4, 12, 0xe8dfbd, 0.9, 0.18);
  }
}

function drawDraftRoadMaterial(layer: Container, start: ProjectedPoint, end: ProjectedPoint, roadWidth: number, contact: CityWorldRoadContactGrammar) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0 || contact.profile === "painted") return;

  const apron = contact.profile === "apron";
  const ux = dx / length;
  const uy = dy / length;
  const nx = -dy / length;
  const ny = dx / length;
  const grit = new Graphics();
  const step = apron ? 34 : 42;
  for (let cursor = step * 0.45; cursor < length - step * 0.2; cursor += step) {
    const side = Math.floor(cursor / step) % 2 === 0 ? 1 : -1;
    const centerX = start.x + ux * cursor + nx * roadWidth * 0.18 * side;
    const centerY = start.y + uy * cursor + ny * roadWidth * 0.18 * side;
    grit
      .moveTo(centerX - ux * 7, centerY - uy * 7)
      .lineTo(centerX + ux * 8, centerY + uy * 8);
  }
  grit.stroke({ color: 0x3e4944, alpha: apron ? 0.08 : 0.12, width: 1.1, cap: "round" });

  const curbWear = new Graphics()
    .moveTo(start.x + nx * roadWidth * 0.48, start.y + ny * roadWidth * 0.48)
    .lineTo(end.x + nx * roadWidth * 0.48, end.y + ny * roadWidth * 0.48)
    .moveTo(start.x - nx * roadWidth * 0.48, start.y - ny * roadWidth * 0.48 + 2)
    .lineTo(end.x - nx * roadWidth * 0.48, end.y - ny * roadWidth * 0.48 + 2);
  curbWear.stroke({ color: 0xf1ddad, alpha: 0.18, width: 1.3, cap: "butt" });
  layer.addChild(grit, curbWear);
}

function drawPublicRoadMaterial(layer: Container, start: ProjectedPoint, end: ProjectedPoint, roadWidth: number, contact: CityWorldRoadContactGrammar) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0 || contact.profile === "painted") return;

  const apron = contact.profile === "apron";
  const ux = dx / length;
  const uy = dy / length;
  const nx = -dy / length;
  const ny = dx / length;
  const curbLift = new Graphics();
  const slabWear = new Graphics();
  const step = apron ? 38 : 50;
  const edgeInset = roadWidth * (apron ? 0.44 : 0.48);

  curbLift
    .moveTo(start.x + nx * edgeInset, start.y + ny * edgeInset - 1.5)
    .lineTo(end.x + nx * edgeInset, end.y + ny * edgeInset - 1.5)
    .moveTo(start.x - nx * edgeInset, start.y - ny * edgeInset + 2.5)
    .lineTo(end.x - nx * edgeInset, end.y - ny * edgeInset + 2.5);
  curbLift.stroke({ color: apron ? 0xf1ddb2 : 0xe8d49f, alpha: apron ? 0.12 : 0.16, width: 1.2, cap: "butt" });

  for (let cursor = step * 0.7; cursor < length - step * 0.45; cursor += step) {
    const side = Math.floor(cursor / step) % 2 === 0 ? -1 : 1;
    const centerX = start.x + ux * cursor + nx * roadWidth * 0.16 * side;
    const centerY = start.y + uy * cursor + ny * roadWidth * 0.16 * side;
    slabWear
      .moveTo(centerX - ux * 8, centerY - uy * 8)
      .lineTo(centerX + ux * 11, centerY + uy * 11);
  }
  slabWear.stroke({ color: 0x3f4d47, alpha: apron ? 0.055 : 0.075, width: 1.05, cap: "round" });

  const roadBedFace = new Graphics()
    .moveTo(start.x - nx * roadWidth * 0.34, start.y - ny * roadWidth * 0.34 + 4)
    .lineTo(end.x - nx * roadWidth * 0.34, end.y - ny * roadWidth * 0.34 + 4);
  roadBedFace.stroke({ color: 0x253b35, alpha: apron ? 0.08 : 0.12, width: Math.max(2, roadWidth * 0.08), cap: "butt" });

  layer.addChild(roadBedFace, curbLift, slabWear);
}

function drawCrosswalkRoad(layer: Container, road: CityWorldRoadSegment) {
  const start = project(road.from);
  const end = project(road.to);
  const baseWidth = road.width * 15.2;
  const draftRoad = resolveRoadContact(road).tone === "draft";
  const shadow = new Graphics().moveTo(start.x, start.y + 5).lineTo(end.x, end.y + 5);
  shadow.stroke({ color: 0x263a34, alpha: draftRoad ? 0.16 : 0.12, width: baseWidth + 8, cap: "butt", join: "round" });
  const curb = new Graphics().moveTo(start.x, start.y + 1).lineTo(end.x, end.y + 1);
  curb.stroke({ color: draftRoad ? 0xe3d2ad : 0xeadfc7, alpha: draftRoad ? 0.78 : 0.86, width: baseWidth + 4, cap: "butt", join: "round" });
  const paver = new Graphics().moveTo(start.x, start.y).lineTo(end.x, end.y);
  paver.stroke({ color: draftRoad ? 0xf0e4c6 : 0xf8f0df, alpha: draftRoad ? 0.72 : 0.84, width: Math.max(3, baseWidth - 1), cap: "butt", join: "round" });
  layer.addChild(shadow, curb, paver);
  drawCrosswalkStripes(layer, start, end, baseWidth);
}

function drawCrosswalkStripes(layer: Container, start: ProjectedPoint, end: ProjectedPoint, roadWidth: number) {
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

  stripes.stroke({ color: 0xffffff, alpha: 0.62, width: 2.2, cap: "butt" });
  layer.addChild(stripes);
}

function drawRoadEdgeBevels(layer: Container, start: ProjectedPoint, end: ProjectedPoint, roadWidth: number, driveway: boolean) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0) return;

  const nx = -dy / length;
  const ny = dx / length;
  const inset = roadWidth * 0.42;
  const edges = new Graphics();
  edges
    .moveTo(start.x + nx * inset, start.y + ny * inset - 1)
    .lineTo(end.x + nx * inset, end.y + ny * inset - 1)
    .moveTo(start.x - nx * inset, start.y - ny * inset + 2)
    .lineTo(end.x - nx * inset, end.y - ny * inset + 2);
  edges.stroke({ color: driveway ? 0xd9d0ae : 0x87928a, alpha: driveway ? 0.2 : 0.24, width: 1.1, cap: "butt" });
  layer.addChild(edges);
}

function drawRoadModuleSeams(layer: Container, start: ProjectedPoint, end: ProjectedPoint, roadWidth: number, driveway: boolean) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= 72) return;

  const ux = dx / length;
  const uy = dy / length;
  const nx = -dy / length;
  const ny = dx / length;
  const step = driveway ? 42 : 54;
  const seamHalf = roadWidth * (driveway ? 0.24 : 0.34);
  const seams = new Graphics();

  for (let cursor = step; cursor < length - step * 0.55; cursor += step) {
    const centerX = start.x + ux * cursor;
    const centerY = start.y + uy * cursor;
    seams
      .moveTo(centerX - nx * seamHalf, centerY - ny * seamHalf + 1)
      .lineTo(centerX + nx * seamHalf, centerY + ny * seamHalf + 1);
  }

  seams.stroke({ color: driveway ? 0xd9d0ae : 0x9aa49b, alpha: driveway ? 0.08 : 0.1, width: 1, cap: "butt" });
  layer.addChild(seams);
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

function collectRoadJoints(roads: CityWorldRoadSegment[]): RoadJoint[] {
  const joints = new Map<string, RoadJoint>();
  const addJoint = (point: CityWorldPoint, road: CityWorldRoadSegment) => {
    const key = roadJointKey(point);
    const existing = joints.get(key);
    if (existing) {
      if (!existing.roads.includes(road)) existing.roads.push(road);
      return;
    }
    joints.set(key, { point: { x: point.x, y: point.y, z: point.z }, roads: [road] });
  };

  for (const road of roads) {
    addJoint(road.from, road);
    addJoint(road.to, road);
  }

  for (let outer = 0; outer < roads.length; outer += 1) {
    for (let inner = outer + 1; inner < roads.length; inner += 1) {
      const first = roads[outer];
      const second = roads[inner];
      if (!first || !second) continue;
      const point = axisAlignedRoadIntersection(first, second);
      if (!point) continue;
      addJoint(point, first);
      addJoint(point, second);
    }
  }

  return Array.from(joints.values());
}

function drawRoadJointModule(layer: Container, joint: RoadJoint) {
  const point = project(joint.point);
  const maxWidth = Math.max(...joint.roads.map((road) => road.width));
  const directions = roadDirectionsAtJoint(joint);
  const contacts = joint.roads.map(resolveRoadContact);
  const major = joint.roads.some((road) => road.kind === "avenue");
  const drivewayOnly = contacts.every((contact) => contact.profile === "apron");
  const draftJoint = contacts.some((contact) => contact.tone === "draft");
  const radius = maxWidth * (major ? 15 : 13.5) + (directions.size >= 3 ? 7 : 4);
  const width = drivewayOnly ? radius * 1.6 : radius * 1.9;
  const height = drivewayOnly ? radius * 0.88 : radius * 1.02;
  const shadow = polygon(diamondPoints({ x: point.x, y: point.y + 5 }, width * 1.05, height * 1.08), 0x263a34, drivewayOnly ? 0.1 : draftJoint ? 0.18 : 0.15, 0x263a34, 0);
  const curb = polygon(diamondPoints({ x: point.x, y: point.y + 2 }, width, height), drivewayOnly ? 0xc1ae88 : draftJoint ? 0xd5bf88 : 0xd6c996, drivewayOnly ? 0.62 : draftJoint ? 0.8 : 0.8, 0x6d684f, 0.18);
  const bed = polygon(diamondPoints(point, width * 0.8, height * 0.7), drivewayOnly ? 0x858b7e : draftJoint ? 0x59635c : 0x5d6862, drivewayOnly ? 0.78 : 0.96, 0x3f4b46, 0.1);
  const surface = polygon(diamondPoints({ x: point.x, y: point.y - 1 }, width * 0.58, height * 0.46), drivewayOnly ? 0x969b8b : draftJoint ? 0x71796f : 0x6b7670, drivewayOnly ? 0.34 : draftJoint ? 0.42 : 0.46, 0xffffff, 0);
  layer.addChild(shadow, curb, bed, surface);
  drawRoadJointBlockwork(layer, point, width, height, drivewayOnly, draftJoint);
  drawDrivewayJoinThroats(layer, joint, point, maxWidth);

  if (directions.size >= 3) {
    const center = polygon(diamondPoints({ x: point.x, y: point.y - 2 }, width * 0.34, height * 0.25), draftJoint ? 0x858b7f : 0x818b83, draftJoint ? 0.22 : 0.26, 0xffffff, 0);
    layer.addChild(center);
  }
}

function drawRoadJointBlockwork(layer: Container, point: ProjectedPoint, width: number, height: number, drivewayOnly: boolean, draftJoint: boolean) {
  const edgeAlpha = drivewayOnly ? 0.12 : draftJoint ? 0.18 : 0.15;
  const centerAlpha = drivewayOnly ? 0.08 : draftJoint ? 0.12 : 0.1;
  const edge = new Graphics()
    .moveTo(point.x - width * 0.36, point.y + height * 0.08)
    .lineTo(point.x - width * 0.12, point.y + height * 0.22)
    .lineTo(point.x + width * 0.12, point.y + height * 0.1)
    .moveTo(point.x + width * 0.36, point.y + height * 0.08)
    .lineTo(point.x + width * 0.12, point.y + height * 0.22)
    .lineTo(point.x - width * 0.12, point.y + height * 0.1);
  edge.stroke({ color: 0xe6d09a, alpha: edgeAlpha, width: 1.15, cap: "round", join: "round" });

  const plate = new Graphics()
    .moveTo(point.x - width * 0.14, point.y - height * 0.06)
    .lineTo(point.x + width * 0.12, point.y + height * 0.08)
    .moveTo(point.x + width * 0.15, point.y - height * 0.04)
    .lineTo(point.x - width * 0.1, point.y + height * 0.1);
  plate.stroke({ color: 0xf5e5bb, alpha: centerAlpha, width: 1, cap: "round", join: "round" });
  layer.addChild(edge, plate);
}

function drawDrivewayJoinThroats(layer: Container, joint: RoadJoint, point: ProjectedPoint, maxRoadWidth: number) {
  const hasMainRoad = joint.roads.some((road) => resolveRoadContact(road).profile === "embedded");
  if (!hasMainRoad) return;

  const driveways = joint.roads.filter((road) => resolveRoadContact(road).profile === "apron");
  for (const driveway of driveways) {
    const opposite = sameCityPoint(joint.point, driveway.from) ? driveway.to : driveway.from;
    const target = project(opposite);
    const dx = target.x - point.x;
    const dy = target.y - point.y;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    const throatLength = Math.max(18, maxRoadWidth * 13);
    const throat = new Graphics()
      .moveTo(point.x + ux * 2, point.y + uy * 2)
      .lineTo(point.x + ux * throatLength, point.y + uy * throatLength);
    throat.stroke({ color: 0xd8c79d, alpha: 0.28, width: 7, cap: "butt" });
    const asphaltCut = new Graphics()
      .moveTo(point.x + ux * 5, point.y + uy * 5 + 1)
      .lineTo(point.x + ux * (throatLength - 2), point.y + uy * (throatLength - 2) + 1);
    asphaltCut.stroke({ color: 0x737c74, alpha: 0.34, width: 3.5, cap: "butt" });
    layer.addChild(throat, asphaltCut);
  }
}

function roadDirectionsAtJoint(joint: RoadJoint): Set<string> {
  const directions = new Set<string>();
  for (const road of joint.roads) {
    if (sameCoordinate(road.from.y, road.to.y)) {
      if (road.from.x < joint.point.x - 0.001 || road.to.x < joint.point.x - 0.001) directions.add("west");
      if (road.from.x > joint.point.x + 0.001 || road.to.x > joint.point.x + 0.001) directions.add("east");
    } else if (sameCoordinate(road.from.x, road.to.x)) {
      if (road.from.y < joint.point.y - 0.001 || road.to.y < joint.point.y - 0.001) directions.add("north");
      if (road.from.y > joint.point.y + 0.001 || road.to.y > joint.point.y + 0.001) directions.add("south");
    } else {
      directions.add(`${Math.sign(road.from.x - joint.point.x)},${Math.sign(road.from.y - joint.point.y)}`);
      directions.add(`${Math.sign(road.to.x - joint.point.x)},${Math.sign(road.to.y - joint.point.y)}`);
    }
  }
  return directions;
}

function sameCityPoint(first: CityWorldPoint, second: CityWorldPoint): boolean {
  return sameCoordinate(first.x, second.x) && sameCoordinate(first.y, second.y) && sameCoordinate(first.z ?? 0, second.z ?? 0);
}

function axisAlignedRoadIntersection(first: CityWorldRoadSegment, second: CityWorldRoadSegment): CityWorldPoint | undefined {
  const firstHorizontal = sameCoordinate(first.from.y, first.to.y);
  const firstVertical = sameCoordinate(first.from.x, first.to.x);
  const secondHorizontal = sameCoordinate(second.from.y, second.to.y);
  const secondVertical = sameCoordinate(second.from.x, second.to.x);

  if (firstHorizontal && secondVertical) {
    const point = { x: second.from.x, y: first.from.y, z: 0 };
    if (pointInsideRoad(point, first) && pointInsideRoad(point, second)) return point;
  }
  if (firstVertical && secondHorizontal) {
    const point = { x: first.from.x, y: second.from.y, z: 0 };
    if (pointInsideRoad(point, first) && pointInsideRoad(point, second)) return point;
  }
  return undefined;
}

function pointInsideRoad(point: CityWorldPoint, road: CityWorldRoadSegment) {
  return betweenInclusive(point.x, road.from.x, road.to.x) && betweenInclusive(point.y, road.from.y, road.to.y);
}

function betweenInclusive(value: number, first: number, second: number) {
  return value >= Math.min(first, second) - 0.001 && value <= Math.max(first, second) + 0.001;
}

function sameCoordinate(first: number, second: number) {
  return Math.abs(first - second) < 0.001;
}

function roadJointKey(point: CityWorldPoint) {
  return `${point.x.toFixed(2)}:${point.y.toFixed(2)}:${(point.z ?? 0).toFixed(2)}`;
}

function drawLot(layer: Container, lot: CityWorldLot) {
  const point = project(lot.position);
  const width = lot.width * TILE_WIDTH;
  const height = lot.depth * TILE_HEIGHT;
  const lotContact = resolveLotContact(lot);
  const draftLot = lotContact.tone === "draft";
  const quietPad = lotContact.profile === "foundation";
  const color = draftLot ? DRAFT_LOT_COLORS[lot.kind] : LOT_COLORS[lot.kind];
  const lotAlpha = draftLot ? (quietPad ? 0.58 : 0.6) : lotContact.profile === "shore" ? 0.34 : quietPad ? 0.5 : 0.52;
  const lotContactProfile = lot.visualGrammar?.contactProfile ?? "parcel_pad_shadow";
  const contactAlpha = draftLot
    ? lotContact.profile === "green"
      ? 0.1
      : 0.18
    : lotContactProfile === "landmark_base_shadow"
      ? 0.17
      : lotContactProfile === "soft_ground_shadow"
        ? 0.09
        : quietPad
          ? 0.14
          : 0.13;
  const contactSpread = lotContactProfile === "landmark_base_shadow" ? 1.1 : lotContactProfile === "soft_ground_shadow" ? 1.12 : 1.04;
  const contact = polygon(diamondPoints({ x: point.x, y: point.y + 6 }, width * contactSpread, height * (contactSpread + 0.04)), 0x23342e, contactAlpha, 0x23342e, 0);
  if (!draftLot && lotContactProfile === "landmark_base_shadow") {
    layer.addChild(polygon(diamondPoints({ x: point.x, y: point.y + 8 }, width * 0.86, height * 0.8), 0x1d2a24, 0.09, 0x1d2a24, 0));
  }
  const lotGraphic = polygon(diamondPoints(point, width, height), color, lotAlpha, draftLot ? 0x7f6d4e : 0x28473f, draftLot ? 0.14 : quietPad ? 0.1 : 0.18);
  const lowerLip = new Graphics()
    .moveTo(point.x - width * 0.5, point.y)
    .lineTo(point.x, point.y + height * 0.5)
    .lineTo(point.x + width * 0.5, point.y)
    .lineTo(point.x + width * 0.5, point.y + 4)
    .lineTo(point.x, point.y + height * 0.5 + 6)
    .lineTo(point.x - width * 0.5, point.y + 4)
    .closePath()
    .fill({ color: shadeColor(color, -28), alpha: draftLot ? 0.3 : quietPad ? 0.18 : 0.24 });
  const innerBevel = polygon(diamondPoints(point, width * 0.88, height * 0.82), shadeColor(color, draftLot ? 7 : 10), draftLot ? 0.13 : quietPad ? 0.09 : 0.12, 0xffffff, 0);
  layer.addChild(contact, lotGraphic, lowerLip, innerBevel);
  drawParcelElevationShelf(layer, point, width, height, lot, color, draftLot);
  drawLotWorldComposition(layer, point, width, height, lot, color, draftLot);
  drawLotEdgeBlockwork(layer, point, width, height, lotContact, draftLot);
  drawParcelEdgeTicks(layer, point, width, height, lotContact);
  drawParcelCompositionDetails(layer, point, width, height, lot);
  drawLotCurbCut(layer, lotContact, point, width, height);
  if (draftLot) drawDraftLotMaterial(layer, point, width, height, lot.kind);

  if (lot.kind === "park") {
    const path = new Graphics()
      .moveTo(point.x - width * 0.28, point.y - height * 0.08)
      .lineTo(point.x - width * 0.05, point.y + height * 0.12)
      .lineTo(point.x + width * 0.25, point.y - height * 0.02);
    path.stroke({ color: 0xf1d9a5, alpha: 0.72, width: 5, cap: "round", join: "round" });
    const court = polygon(diamondPoints({ x: point.x + width * 0.14, y: point.y + height * 0.16 }, 34, 18), 0xc3d989, 0.72, 0x5b8b52, 0.28);
    layer.addChild(path, court);
  } else if (lot.kind === "home") {
    drawHomeLotDetails(layer, point, width, height, color);
  } else if (lot.kind === "shop" || lot.kind === "civic") {
    drawForecourtPad(layer, point, width, height, color, lot.kind === "civic");
    if (lot.kind === "civic") drawCivicLotComposition(layer, point, width, height, color);
    const lines = new Graphics();
    for (let i = -2; i <= 2; i += 1) {
      lines
        .moveTo(point.x + i * 24 - width * 0.25, point.y + height * 0.16)
        .lineTo(point.x + i * 24 + width * 0.04, point.y - height * 0.08);
    }
    lines.stroke({ color: 0xf4e8c7, alpha: 0.2, width: 1 });
    layer.addChild(lines);
  } else if (lot.kind === "gym" || lot.kind === "apartments") {
    drawForecourtPad(layer, point, width, height, color, false);
  } else if (lot.kind === "waterfront") {
    const edge = new Graphics()
      .moveTo(point.x - width * 0.38, point.y - height * 0.08)
      .lineTo(point.x - width * 0.02, point.y + height * 0.12)
      .lineTo(point.x + width * 0.34, point.y - height * 0.04);
    edge.stroke({ color: 0xe9fbff, alpha: 0.42, width: 3, cap: "round", join: "round" });
    layer.addChild(edge);
  }
}

function drawLotWorldComposition(layer: Container, point: ProjectedPoint, width: number, height: number, lot: CityWorldLot, color: number, draftLot: boolean) {
  if (draftLot || lot.kind === "park" || lot.kind === "waterfront") return;

  const profile = lot.visualGrammar?.lotProfile;

  if (profile === "residential_yard_grid") {
    const variant = objectVariant(lot.id, 4);
    const yardSide = variant % 2 === 0 ? -1 : 1;
    const sideYard = polygon(
      diamondPoints({ x: point.x + yardSide * width * 0.18, y: point.y - height * 0.08 }, width * 0.22, height * 0.22),
      shadeColor(color, variant === 3 ? -8 : 12),
      0.12,
      0xffffff,
      0,
    );
    const frontSetback = polygon(
      diamondPoints({ x: point.x - yardSide * width * 0.16, y: point.y + height * 0.27 }, width * 0.34, height * 0.13),
      shadeColor(color, 18),
      0.15,
      0xffffff,
      0,
    );
    const parcelEdge = new Graphics()
      .moveTo(point.x - width * 0.42, point.y - height * 0.08)
      .lineTo(point.x - width * 0.12, point.y + height * 0.08)
      .lineTo(point.x + width * 0.2, point.y - height * 0.06)
      .moveTo(point.x + width * 0.42, point.y + height * 0.06)
      .lineTo(point.x + width * 0.12, point.y + height * 0.22)
      .lineTo(point.x - width * 0.1, point.y + height * 0.1);
    parcelEdge.stroke({ color: 0x557a4e, alpha: 0.16, width: 1.1, cap: "round", join: "round" });
    const walkJoin = new Graphics()
      .moveTo(point.x - yardSide * width * 0.02, point.y + height * 0.08)
      .lineTo(point.x - yardSide * width * 0.2, point.y + height * 0.42);
    walkJoin.stroke({ color: 0xf1ddad, alpha: 0.26, width: Math.max(1.6, width * 0.026), cap: "round" });
    layer.addChild(sideYard, frontSetback, parcelEdge, walkJoin);
    return;
  }

  if (profile === "landmark_civic_ground") {
    const civicAxis = polygon(
      diamondPoints({ x: point.x, y: point.y + height * 0.34 }, width * 0.38, height * 0.16),
      0xf2ddb3,
      0.28,
      0x7f6d4e,
      0.08,
    );
    const terraceBands = new Graphics()
      .moveTo(point.x - width * 0.46, point.y + height * 0.1)
      .lineTo(point.x - width * 0.2, point.y + height * 0.24)
      .lineTo(point.x + width * 0.08, point.y + height * 0.12)
      .moveTo(point.x + width * 0.46, point.y + height * 0.08)
      .lineTo(point.x + width * 0.2, point.y + height * 0.23)
      .lineTo(point.x - width * 0.08, point.y + height * 0.11)
      .moveTo(point.x - width * 0.22, point.y - height * 0.18)
      .lineTo(point.x + width * 0.18, point.y + height * 0.02);
    terraceBands.stroke({ color: 0xf8eac7, alpha: 0.24, width: 1.45, cap: "round", join: "round" });
    layer.addChild(civicAxis, terraceBands);
    return;
  }

  if (profile === "commercial_forecourt" || profile === "apartment_court") {
    const apron = polygon(
      diamondPoints({ x: point.x, y: point.y + height * 0.36 }, width * 0.72, height * 0.16),
      profile === "apartment_court" ? 0xdac7a1 : 0xe8cf9f,
      0.18,
      0x7f6d4e,
      0.06,
    );
    const baySeams = new Graphics();
    const count = profile === "apartment_court" ? 3 : 5;
    for (let index = 0; index < count; index += 1) {
      const offset = (index / Math.max(1, count - 1) - 0.5) * width * 0.54;
      baySeams
        .moveTo(point.x + offset - width * 0.04, point.y + height * 0.24)
        .lineTo(point.x + offset + width * 0.06, point.y + height * 0.31);
    }
    baySeams.stroke({ color: 0xf6e8c8, alpha: 0.16, width: 1, cap: "round" });
    layer.addChild(apron, baySeams);
  }
}

function drawParcelElevationShelf(layer: Container, point: ProjectedPoint, width: number, height: number, lot: CityWorldLot, color: number, draftLot: boolean) {
  const elevation = lot.visualGrammar?.parcelElevation;
  if (!elevation || elevation === "thin_pad_lip") return;

  const depth =
    elevation === "civic_plinth_stack"
      ? 8
      : elevation === "commercial_slab_lip"
        ? 5.5
        : elevation === "apartment_court_lip"
          ? 5
          : elevation === "waterfront_bank_cut"
            ? 7
            : elevation === "hidden_anchor_shelf"
              ? 5.5
              : elevation === "park_basin_lip"
                ? 3
                : 4.5;
  const alpha = draftLot ? 0.34 : elevation === "civic_plinth_stack" ? 0.42 : 0.32;
  const leftFace = new Graphics()
    .moveTo(point.x - width * 0.5, point.y)
    .lineTo(point.x, point.y + height * 0.5)
    .lineTo(point.x, point.y + height * 0.5 + depth)
    .lineTo(point.x - width * 0.5, point.y + depth)
    .closePath()
    .fill({ color: sunlitColor(shadeColor(color, -8), "sun"), alpha: alpha * 0.8 });
  const rightFace = new Graphics()
    .moveTo(point.x, point.y + height * 0.5)
    .lineTo(point.x + width * 0.5, point.y)
    .lineTo(point.x + width * 0.5, point.y + depth)
    .lineTo(point.x, point.y + height * 0.5 + depth)
    .closePath()
    .fill({ color: sunlitColor(color, "shade"), alpha });
  const shelfRim = new Graphics()
    .moveTo(point.x - width * 0.5, point.y + depth * 0.55)
    .lineTo(point.x, point.y + height * 0.5 + depth * 0.75)
    .lineTo(point.x + width * 0.5, point.y + depth * 0.55);
  shelfRim.stroke({ color: elevation === "waterfront_bank_cut" ? 0xe9fbff : 0xf1dfb7, alpha: elevation === "waterfront_bank_cut" ? 0.2 : 0.14, width: 1.2, cap: "round", join: "round" });
  layer.addChild(leftFace, rightFace, shelfRim);

  if (elevation === "civic_plinth_stack") {
    const step = new Graphics()
      .moveTo(point.x - width * 0.34, point.y + height * 0.2)
      .lineTo(point.x, point.y + height * 0.38)
      .lineTo(point.x + width * 0.34, point.y + height * 0.2)
      .moveTo(point.x - width * 0.24, point.y + height * 0.28)
      .lineTo(point.x, point.y + height * 0.42)
      .lineTo(point.x + width * 0.24, point.y + height * 0.28);
    step.stroke({ color: 0x8b7954, alpha: 0.22, width: 1.15, cap: "round", join: "round" });
    layer.addChild(step);
  }
}

function drawLotEdgeBlockwork(layer: Container, point: ProjectedPoint, width: number, height: number, lotContact: CityWorldLotContactGrammar, draftLot: boolean) {
  if (lotContact.profile === "shore" || lotContact.profile === "green") return;

  const quiet = lotContact.profile === "foundation";
  const alpha = draftLot ? 0.16 : quiet ? 0.1 : 0.14;
  const edgeColor = quiet ? 0xe9ddb4 : 0xf0dfb7;
  const curbFace = new Graphics()
    .moveTo(point.x - width * 0.46, point.y + height * 0.02)
    .lineTo(point.x - width * 0.18, point.y + height * 0.18)
    .lineTo(point.x + width * 0.08, point.y + height * 0.05)
    .moveTo(point.x + width * 0.46, point.y + height * 0.02)
    .lineTo(point.x + width * 0.18, point.y + height * 0.18)
    .lineTo(point.x - width * 0.08, point.y + height * 0.05);
  curbFace.stroke({ color: edgeColor, alpha, width: quiet ? 1 : 1.2, cap: "round", join: "round" });

  const frontBlocks = new Graphics();
  const blockCount = quiet ? 3 : 5;
  for (let block = 0; block < blockCount; block += 1) {
    const t = block / (blockCount - 1);
    const x = point.x - width * 0.28 + t * width * 0.56;
    frontBlocks
      .moveTo(x - width * 0.035, point.y + height * 0.26)
      .lineTo(x + width * 0.025, point.y + height * 0.3);
  }
  frontBlocks.stroke({ color: 0x7f6d4e, alpha: draftLot ? 0.14 : quiet ? 0.08 : 0.12, width: 0.9, cap: "round" });
  layer.addChild(curbFace, frontBlocks);
}

// Curb-cut / walk join toward the serving road, authored by the compiler as
// lotContact.curbCutEdge. This is the driveway-mouth read that makes a parcel
// look served by its street instead of floating beside it.
function drawLotCurbCut(layer: Container, lotContact: CityWorldLotContactGrammar, point: ProjectedPoint, width: number, height: number) {
  if (!lotContact.curbCutEdge || lotContact.profile === "shore") return;

  const draft = lotContact.tone === "draft";
  const green = lotContact.profile === "green";
  const quiet = lotContact.profile === "foundation";
  const edgePoint = lotCurbPoint(point, width, height, lotContact.curbCutEdge);
  const apronWidth = Math.max(quiet ? 12 : 20, width * (quiet ? 0.18 : 0.26));
  const apronHeight = Math.max(quiet ? 5 : 8, height * (quiet ? 0.08 : 0.12));
  const apron = polygon(
    diamondPoints(edgePoint, apronWidth, apronHeight),
    LOT_CURB_CUT_STYLE.apron,
    draft ? 0.16 : green ? 0.22 : quiet ? 0.3 : 0.4,
    LOT_CURB_CUT_STYLE.groove,
    draft ? 0.08 : 0.16,
  );
  layer.addChild(apron);

  if (!green) {
    const walk = new Graphics()
      .moveTo(point.x, point.y + height * 0.06)
      .lineTo(edgePoint.x, edgePoint.y);
    walk.stroke({ color: LOT_CURB_CUT_STYLE.walk, alpha: draft ? 0.14 : quiet ? 0.28 : 0.34, width: quiet ? 1.8 : 2.6, cap: "round" });
    layer.addChild(walk);
  }
}

function drawDraftLotMaterial(layer: Container, point: ProjectedPoint, width: number, height: number, kind: CityWorldLot["kind"]) {
  if (kind === "park" || kind === "waterfront") return;

  const edge = new Graphics()
    .moveTo(point.x - width * 0.44, point.y + height * 0.08)
    .lineTo(point.x - width * 0.18, point.y + height * 0.23)
    .lineTo(point.x + width * 0.06, point.y + height * 0.12)
    .moveTo(point.x + width * 0.44, point.y + height * 0.06)
    .lineTo(point.x + width * 0.18, point.y + height * 0.22)
    .lineTo(point.x - width * 0.04, point.y + height * 0.1);
  edge.stroke({ color: 0x8b7954, alpha: kind === "civic" ? 0.26 : 0.2, width: 1.25, cap: "round", join: "round" });

  const warmFacet = polygon(
    diamondPoints({ x: point.x + width * 0.12, y: point.y - height * 0.08 }, width * 0.32, height * 0.2),
    kind === "civic" ? 0xeadab8 : 0xe6d2a6,
    0.16,
    0xffffff,
    0,
  );
  layer.addChild(warmFacet, edge);
}

function drawParcelEdgeTicks(layer: Container, point: ProjectedPoint, width: number, height: number, lotContact: CityWorldLotContactGrammar) {
  if (lotContact.profile === "shore" || lotContact.profile === "green") return;

  const tick = new Graphics();
  const alpha = lotContact.profile === "foundation" ? 0.18 : 0.22;
  const color = lotContact.profile === "foundation" ? 0xf2e4b8 : 0xf4e8c7;
  const leftX = point.x - width * 0.5;
  const rightX = point.x + width * 0.5;
  const topY = point.y - height * 0.5;
  const bottomY = point.y + height * 0.5;

  tick
    .moveTo(leftX + width * 0.16, point.y + height * 0.16)
    .lineTo(leftX + width * 0.28, point.y + height * 0.28)
    .moveTo(rightX - width * 0.16, point.y + height * 0.16)
    .lineTo(rightX - width * 0.28, point.y + height * 0.28)
    .moveTo(point.x - width * 0.16, topY + height * 0.16)
    .lineTo(point.x - width * 0.28, topY + height * 0.28)
    .moveTo(point.x + width * 0.16, bottomY - height * 0.16)
    .lineTo(point.x + width * 0.28, bottomY - height * 0.28);
  tick.stroke({ color, alpha, width: 1, cap: "round" });
  layer.addChild(tick);
}

function drawParcelCompositionDetails(layer: Container, point: ProjectedPoint, width: number, height: number, lot: CityWorldLot) {
  const composition = lot.visualGrammar?.parcelComposition;
  if (!composition) return;

  if (composition === "home_yard_grid") {
    const yardGrid = new Graphics()
      .moveTo(point.x - width * 0.42, point.y - height * 0.03)
      .lineTo(point.x - width * 0.13, point.y + height * 0.13)
      .lineTo(point.x + width * 0.12, point.y + height * 0.02)
      .moveTo(point.x + width * 0.42, point.y - height * 0.02)
      .lineTo(point.x + width * 0.13, point.y + height * 0.13)
      .lineTo(point.x - width * 0.12, point.y + height * 0.02)
      .moveTo(point.x - width * 0.18, point.y - height * 0.22)
      .lineTo(point.x + width * 0.14, point.y - height * 0.04);
    yardGrid.stroke({ color: 0xdbe8ab, alpha: 0.12, width: 1.1, cap: "round", join: "round" });
    layer.addChild(yardGrid);
    return;
  }

  if (composition === "commercial_apron") {
    const apron = new Graphics();
    for (let lane = -2; lane <= 2; lane += 1) {
      apron
        .moveTo(point.x + lane * width * 0.08 - width * 0.18, point.y + height * 0.22)
        .lineTo(point.x + lane * width * 0.08 + width * 0.1, point.y + height * 0.06);
    }
    apron
      .moveTo(point.x - width * 0.36, point.y + height * 0.3)
      .lineTo(point.x, point.y + height * 0.46)
      .lineTo(point.x + width * 0.36, point.y + height * 0.3);
    apron.stroke({ color: 0xffe9bf, alpha: 0.18, width: 1.15, cap: "round", join: "round" });
    layer.addChild(apron);
    return;
  }

  if (composition === "civic_landmark_plinth") {
    const plinth = polygon(diamondPoints({ x: point.x, y: point.y + height * 0.26 }, width * 0.72, height * 0.2), 0xe7d4aa, 0.18, 0x8b7954, 0.08);
    const axis = new Graphics()
      .moveTo(point.x - width * 0.28, point.y + height * 0.16)
      .lineTo(point.x, point.y + height * 0.32)
      .lineTo(point.x + width * 0.28, point.y + height * 0.16)
      .moveTo(point.x - width * 0.16, point.y + height * 0.24)
      .lineTo(point.x, point.y + height * 0.34)
      .lineTo(point.x + width * 0.16, point.y + height * 0.24);
    axis.stroke({ color: 0x8b7954, alpha: 0.18, width: 1.2, cap: "round", join: "round" });
    layer.addChild(plinth, axis);
    return;
  }

  if (composition === "apartment_court_grid") {
    const court = polygon(diamondPoints({ x: point.x - width * 0.08, y: point.y + height * 0.03 }, width * 0.46, height * 0.28), 0xd7c59d, 0.14, 0xffffff, 0);
    const bands = new Graphics()
      .moveTo(point.x - width * 0.34, point.y + height * 0.1)
      .lineTo(point.x - width * 0.05, point.y + height * 0.25)
      .lineTo(point.x + width * 0.26, point.y + height * 0.1)
      .moveTo(point.x - width * 0.2, point.y - height * 0.08)
      .lineTo(point.x + width * 0.18, point.y + height * 0.1);
    bands.stroke({ color: 0xf4e7c3, alpha: 0.18, width: 1, cap: "round", join: "round" });
    layer.addChild(court, bands);
    return;
  }

  if (composition === "park_path_basin") {
    const basin = new Graphics()
      .moveTo(point.x - width * 0.32, point.y - height * 0.1)
      .lineTo(point.x - width * 0.08, point.y + height * 0.08)
      .lineTo(point.x + width * 0.28, point.y - height * 0.04);
    basin.stroke({ color: 0xf1d9a5, alpha: 0.2, width: 2.2, cap: "round", join: "round" });
    layer.addChild(basin);
    return;
  }

  if (composition === "waterfront_bank" || composition === "hidden_draft_anchor_pad") {
    const strataColor = composition === "hidden_draft_anchor_pad" ? 0x8b7954 : 0xe9fbff;
    const strata = new Graphics()
      .moveTo(point.x - width * 0.42, point.y + height * 0.04)
      .lineTo(point.x - width * 0.12, point.y + height * 0.2)
      .lineTo(point.x + width * 0.2, point.y + height * 0.06)
      .moveTo(point.x + width * 0.42, point.y + height * 0.02)
      .lineTo(point.x + width * 0.14, point.y + height * 0.2)
      .lineTo(point.x - width * 0.14, point.y + height * 0.08);
    strata.stroke({ color: strataColor, alpha: composition === "hidden_draft_anchor_pad" ? 0.18 : 0.22, width: 1.25, cap: "round", join: "round" });
    layer.addChild(strata);
  }
}

function drawHomeLotDetails(layer: Container, point: ProjectedPoint, width: number, height: number, color: number) {
  const variation = Math.abs(Math.round(point.x * 0.17 + point.y * 0.11)) % 3;
  const padOffset = variation === 0 ? -0.1 : variation === 1 ? 0 : 0.08;
  const pad = polygon(diamondPoints({ x: point.x + width * padOffset, y: point.y - height * 0.06 }, width * 0.56, height * 0.42), shadeColor(color, 18), 0.17, 0xffffff, 0);
  const yardFacet = polygon(diamondPoints({ x: point.x - width * (variation === 2 ? 0.02 : 0.13), y: point.y + height * 0.06 }, width * 0.34, height * 0.22), shadeColor(color, -10), 0.12, 0x28473f, 0);
  const sideFacet = polygon(diamondPoints({ x: point.x + width * 0.19, y: point.y - height * 0.02 }, width * 0.18, height * 0.2), shadeColor(color, 6), 0.1, 0xffffff, 0);
  const walk = new Graphics()
    .moveTo(point.x + width * padOffset * 0.6, point.y + height * 0.02)
    .lineTo(point.x + (variation === 1 ? width * 0.14 : 0), point.y + height * 0.38);
  walk.stroke({ color: 0xf1ddad, alpha: 0.3, width: Math.max(2, width * 0.035), cap: "round" });
  const lotSeam = new Graphics()
    .moveTo(point.x - width * 0.36, point.y - height * 0.02)
    .lineTo(point.x - width * 0.04, point.y + height * 0.16)
    .moveTo(point.x + width * 0.36, point.y - height * 0.02)
    .lineTo(point.x + width * 0.08, point.y + height * 0.16);
  lotSeam.stroke({ color: 0xf2e4b8, alpha: 0.12, width: 1, cap: "round" });
  const parcelRibs = new Graphics()
    .moveTo(point.x - width * 0.43, point.y + height * 0.08)
    .lineTo(point.x - width * 0.2, point.y + height * 0.22)
    .lineTo(point.x - width * 0.02, point.y + height * 0.14)
    .moveTo(point.x + width * 0.43, point.y + height * 0.07)
    .lineTo(point.x + width * 0.2, point.y + height * 0.22)
    .lineTo(point.x + width * 0.02, point.y + height * 0.13);
  parcelRibs.stroke({ color: 0x6f8a59, alpha: 0.14, width: 1.1, cap: "round", join: "round" });
  const frontSetback = polygon(
    diamondPoints({ x: point.x + width * (variation === 0 ? -0.18 : 0.18), y: point.y + height * 0.23 }, width * 0.24, height * 0.12),
    shadeColor(color, 10),
    0.12,
    0xffffff,
    0,
  );
  layer.addChild(pad, yardFacet, sideFacet, frontSetback, walk, lotSeam, parcelRibs);
}

function drawForecourtPad(layer: Container, point: ProjectedPoint, width: number, height: number, color: number, civic: boolean) {
  const pad = polygon(
    diamondPoints({ x: point.x + width * 0.04, y: point.y + height * 0.14 }, width * (civic ? 0.72 : 0.62), height * 0.3),
    shadeColor(color, civic ? 12 : 8),
    civic ? 0.18 : 0.16,
    0xffffff,
    0,
  );
  const frontEdge = new Graphics()
    .moveTo(point.x - width * 0.27, point.y + height * 0.28)
    .lineTo(point.x, point.y + height * 0.42)
    .lineTo(point.x + width * 0.28, point.y + height * 0.28);
  frontEdge.stroke({ color: 0xf6e8c8, alpha: civic ? 0.24 : 0.2, width: 1.1, cap: "round", join: "round" });
  layer.addChild(pad, frontEdge);

  if (civic) {
    const civicAxis = new Graphics()
      .moveTo(point.x - width * 0.16, point.y + height * 0.04)
      .lineTo(point.x, point.y + height * 0.18)
      .lineTo(point.x + width * 0.16, point.y + height * 0.04)
      .moveTo(point.x, point.y + height * 0.18)
      .lineTo(point.x, point.y + height * 0.43);
    civicAxis.stroke({ color: 0xffefd1, alpha: 0.28, width: 3.2, cap: "round", join: "round" });
    const landing = polygon(diamondPoints({ x: point.x, y: point.y + height * 0.1 }, width * 0.32, height * 0.16), 0xf3dfbd, 0.24, 0x7f6d4e, 0.08);
    const sideTerraces = new Graphics()
      .moveTo(point.x - width * 0.42, point.y + height * 0.04)
      .lineTo(point.x - width * 0.23, point.y + height * 0.15)
      .lineTo(point.x - width * 0.06, point.y + height * 0.06)
      .moveTo(point.x + width * 0.42, point.y + height * 0.04)
      .lineTo(point.x + width * 0.23, point.y + height * 0.15)
      .lineTo(point.x + width * 0.06, point.y + height * 0.06);
    sideTerraces.stroke({ color: 0xf6e8c8, alpha: 0.2, width: 1.4, cap: "round", join: "round" });
    layer.addChild(landing, civicAxis, sideTerraces);
  }
}

function drawCivicLotComposition(layer: Container, point: ProjectedPoint, width: number, height: number, color: number) {
  const civicGreen = polygon(
    diamondPoints({ x: point.x - width * 0.18, y: point.y - height * 0.12 }, width * 0.32, height * 0.2),
    0xaed08a,
    0.18,
    0x5d7a4f,
    0.08,
  );
  const civicCourt = polygon(
    diamondPoints({ x: point.x + width * 0.18, y: point.y - height * 0.1 }, width * 0.34, height * 0.22),
    shadeColor(color, 18),
    0.24,
    0x8b7954,
    0.1,
  );
  const plinthShadow = polygon(
    diamondPoints({ x: point.x, y: point.y + height * 0.24 }, width * 0.78, height * 0.18),
    0x263a34,
    0.12,
    0x263a34,
    0,
  );

  const paverGrid = new Graphics();
  for (let lane = -2; lane <= 2; lane += 1) {
    paverGrid
      .moveTo(point.x + lane * width * 0.08 - width * 0.16, point.y + height * 0.02)
      .lineTo(point.x + lane * width * 0.08 + width * 0.06, point.y + height * 0.14)
      .moveTo(point.x + lane * width * 0.08 - width * 0.06, point.y + height * 0.24)
      .lineTo(point.x + lane * width * 0.08 + width * 0.16, point.y + height * 0.12);
  }
  paverGrid.stroke({ color: 0xfff0cf, alpha: 0.18, width: 1, cap: "round", join: "round" });

  const civicSteps = new Graphics()
    .moveTo(point.x - width * 0.3, point.y + height * 0.18)
    .lineTo(point.x, point.y + height * 0.34)
    .lineTo(point.x + width * 0.3, point.y + height * 0.18)
    .moveTo(point.x - width * 0.22, point.y + height * 0.24)
    .lineTo(point.x, point.y + height * 0.36)
    .lineTo(point.x + width * 0.22, point.y + height * 0.24)
    .moveTo(point.x - width * 0.13, point.y + height * 0.3)
    .lineTo(point.x, point.y + height * 0.38)
    .lineTo(point.x + width * 0.13, point.y + height * 0.3);
  civicSteps.stroke({ color: 0x8b7954, alpha: 0.24, width: 1.2, cap: "round", join: "round" });

  const sideBlockwork = new Graphics()
    .moveTo(point.x - width * 0.48, point.y + height * 0.03)
    .lineTo(point.x - width * 0.32, point.y + height * 0.14)
    .lineTo(point.x - width * 0.16, point.y + height * 0.06)
    .moveTo(point.x + width * 0.48, point.y + height * 0.02)
    .lineTo(point.x + width * 0.32, point.y + height * 0.14)
    .lineTo(point.x + width * 0.16, point.y + height * 0.06);
  sideBlockwork.stroke({ color: 0x7f6d4e, alpha: 0.18, width: 1.2, cap: "round", join: "round" });

  layer.addChild(plinthShadow, civicGreen, civicCourt, paverGrid, civicSteps, sideBlockwork);
}

function drawBuilding(layers: LayerMap, building: CityWorldBuilding, selected: boolean, hovered: boolean, atlas: CityWorldAtlasResolver) {
  const layer = layers.buildingLayer;
  const geometry = createBuildingGeometry(building, selected, hovered, atlas);
  // Foundation pads are ground decals: they live in a shared layer below every
  // cast shadow so shadows land ON pads instead of being washed out by them.
  drawBuildingFootprint(layers.padLayer, geometry, building, selected, hovered);
  drawBuildingCastShadow(layers.shadowLayer, building);

  if (geometry.asset.mode === "sprite") {
    drawSpriteObjectAuthorshipBase(layer, geometry, building);
    if (isObjectKitCommerceStrip(building)) drawObjectKitCommerceStripRead(layer, geometry, building);
    if (isObjectKitCivicLandmark(building)) drawObjectKitCivicLandmarkRead(layer, geometry, building);
    if (isObjectKitServiceGym(building)) drawObjectKitServiceGymRead(layer, geometry, building);
    drawSpriteBuilding(layer, geometry, building, selected, hovered);
    return;
  }

  drawBuildingShell(layer, geometry, building, selected, hovered);

  if (building.kind === "home") drawHomeDetails(layer, geometry, building);
  if (building.kind === "shop") drawShopDetails(layer, geometry, building);
  if (building.kind === "gym") drawGymDetails(layer, geometry, building);
  if (building.kind === "apartment") drawApartmentDetails(layer, geometry);
  if (building.kind === "civic") drawCivicDetails(layer, geometry, building);
  drawObjectAuthorshipDetails(layer, geometry, building);
  if (isObjectKitCommerceStrip(building)) drawObjectKitCommerceStripRead(layer, geometry, building);
  if (isObjectKitCivicLandmark(building)) drawObjectKitCivicLandmarkRead(layer, geometry, building);
  if (isObjectKitServiceGym(building)) drawObjectKitServiceGymRead(layer, geometry, building);
  if (building.id.startsWith("draft-building-")) drawDraftAnchorDetails(layer, geometry, building);
}

function createBuildingGeometry(building: CityWorldBuilding, selected: boolean, hovered: boolean, atlas: CityWorldAtlasResolver): BuildingGeometry {
  const bottom = project(building.position);
  const top = project({ x: building.position.x, y: building.position.y, z: building.height });
  const asset = atlas.resolveAsset(building.spriteKey, building.paletteKey, "building");
  const useAuthoredDraftColors = isDraftBuilding(building);
  return {
    bottom,
    top,
    footprintWidth: building.width * TILE_WIDTH,
    footprintDepth: building.depth * TILE_HEIGHT,
    height: building.height * TILE_DEPTH,
    bodyColor: useAuthoredDraftColors ? colorToNumber(building.bodyColor ?? asset.palette.colors.base) : paletteColor(asset.palette.colors.base, building.bodyColor),
    roofColor: useAuthoredDraftColors ? colorToNumber(building.roofColor ?? asset.palette.colors.roof ?? "#8c9b75") : paletteColor(asset.palette.colors.roof, building.roofColor),
    highlightColor: useAuthoredDraftColors ? 0xf8e8ca : paletteColor(asset.palette.colors.highlight, "#fff4d8"),
    accentColor: useAuthoredDraftColors ? 0x5f8f8a : paletteColor(asset.palette.colors.accent, asset.palette.colors.roof ?? "#ffcf56"),
    trimColor: useAuthoredDraftColors ? 0x5f5547 : paletteColor(asset.palette.colors.trim, "#26332c"),
    outline: selected ? 0xffffff : hovered ? 0xffee88 : 0x26332c,
    activeStrokeAlpha: hovered || selected ? 0.82 : 0.38,
    asset,
  };
}

function isDraftBuilding(building: CityWorldBuilding) {
  return building.id.startsWith("draft-building-");
}

function isObjectKitCommerceStrip(building: CityWorldBuilding) {
  return building.objectKit?.prefabFamily === "commerce_strip";
}

function isObjectKitCivicLandmark(building: CityWorldBuilding) {
  return building.objectKit?.prefabFamily === "civic_landmark";
}

function isObjectKitServiceGym(building: CityWorldBuilding) {
  return building.objectKit?.prefabFamily === "service_gym";
}

function objectVariant(id: string, modulo: number) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return hash % modulo;
}

function drawSpriteBuilding(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, selected: boolean, hovered: boolean) {
  const { bottom, footprintDepth, asset } = geometry;
  if (asset.mode !== "sprite") return;

  drawSpriteBuildingFitDetails(layer, geometry, building);

  const sprite = new Sprite(asset.texture);
  sprite.anchor.set(asset.anchor.x, asset.anchor.y);
  sprite.scale.set(asset.scale);
  sprite.position.set(Math.round(bottom.x), Math.round(bottom.y + footprintDepth * 0.5));
  // Honor the building's assigned palette-variant ramp on screen: gently wash
  // the textured sprite toward its resolved body color so sprite-mode buildings
  // (rowhomes, strip stores) read the same variant identity the diagnostics key
  // on. Kept subtle (mixed toward white) so authored SVG art is preserved.
  sprite.tint = mixColor(0xffffff, geometry.bodyColor, 0.3);
  sprite.label = `sprite-${building.id}`;
  layer.addChild(sprite);

  if (selected || hovered) {
    const ring = new Graphics()
      .ellipse(bottom.x, bottom.y + footprintDepth * 0.34, geometry.footprintWidth * 0.52, footprintDepth * 0.62)
      .stroke({ color: selected ? 0xffffff : 0xffee88, alpha: selected ? 0.8 : 0.58, width: selected ? 2.2 : 1.6 });
    layer.addChild(ring);
  }
}

function drawSpriteBuildingFitDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, bodyColor, highlightColor, trimColor } = geometry;
  const style = building.facadeStyle ?? building.kind;
  const contactProfile = building.visualGrammar?.contactProfile ?? "parcel_pad_shadow";

  const contact = polygon(
    diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.38 }, footprintWidth * 0.78, footprintDepth * 0.18),
    0xd8bd8f,
    style === "strip_store" ? 0.42 : 0.34,
    0x7f6d4e,
    0.12,
  );
  const baseShadow = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.38, bottom.y + footprintDepth * 0.32)
    .lineTo(bottom.x - footprintWidth * 0.06, bottom.y + footprintDepth * 0.47)
    .lineTo(bottom.x + footprintWidth * 0.38, bottom.y + footprintDepth * 0.28)
    .stroke({
      color: 0x2d423b,
      alpha: contactProfile === "landmark_base_shadow" ? 0.28 : contactProfile === "soft_ground_shadow" ? 0.13 : 0.2,
      width: contactProfile === "landmark_base_shadow" ? 3.6 : 3,
      cap: "round",
      join: "round",
    });
  layer.addChild(baseShadow, contact);

  if (style === "rowhome") {
    const stoops = new Graphics();
    for (let bay = 0; bay < 3; bay += 1) {
      const offset = (bay / 2 - 0.5) * footprintWidth * 0.56;
      const yLift = bay === 1 ? -2 : 0;
      stoops
        .roundRect(top.x + offset - footprintWidth * 0.035, bottom.y + footprintDepth * 0.22 + yLift, footprintWidth * 0.07, 5.5, 1.5)
        .fill({ color: 0xf2d8a6, alpha: 0.66 })
        .roundRect(top.x + offset - footprintWidth * 0.04, bottom.y + footprintDepth * 0.15 + yLift, footprintWidth * 0.08, 9, 1.5)
        .stroke({ color: trimColor, alpha: 0.22, width: 0.9 });
    }
    const parapetRhythm = new Graphics()
      .moveTo(top.x - footprintWidth * 0.32, top.y - footprintDepth * 0.36)
      .lineTo(top.x - footprintWidth * 0.12, top.y - footprintDepth * 0.44)
      .lineTo(top.x + footprintWidth * 0.06, top.y - footprintDepth * 0.36)
      .lineTo(top.x + footprintWidth * 0.3, top.y - footprintDepth * 0.43);
    parapetRhythm.stroke({ color: shadeColor(roofColor, -30), alpha: 0.28, width: 1.7, cap: "round", join: "round" });
    layer.addChild(stoops, parapetRhythm);
    return;
  }

  if (style === "strip_store" || building.kind === "shop") {
    const apron = polygon(
      diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.43 }, footprintWidth * 0.88, footprintDepth * 0.18),
      0xe8d0a3,
      0.44,
      0x7f6d4e,
      0.14,
    );
    const bayGrounding = new Graphics();
    for (let bay = -1; bay <= 1; bay += 1) {
      bayGrounding
        .roundRect(top.x + bay * (footprintWidth * 0.2) - footprintWidth * 0.06, bottom.y + footprintDepth * 0.18, footprintWidth * 0.12, 5, 1.4)
        .fill({ color: bay === 0 ? highlightColor : shadeColor(bodyColor, 12), alpha: bay === 0 ? 0.52 : 0.32 });
    }
    const awningUnderside = new Graphics()
      .moveTo(top.x - footprintWidth * 0.38, bottom.y - footprintDepth * 0.2)
      .lineTo(top.x - footprintWidth * 0.1, bottom.y - footprintDepth * 0.06)
      .lineTo(top.x + footprintWidth * 0.17, bottom.y - footprintDepth * 0.18)
      .lineTo(top.x + footprintWidth * 0.4, bottom.y - footprintDepth * 0.05);
    awningUnderside.stroke({ color: shadeColor(roofColor, -38), alpha: 0.34, width: 2.2, cap: "round", join: "round" });
    layer.addChild(apron, bayGrounding, awningUnderside);
  }
}

function drawSpriteObjectAuthorshipBase(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const family = building.visualGrammar?.objectFamily;
  if (!family) return;
  const { bottom, footprintWidth, footprintDepth, trimColor, roofColor } = geometry;
  const strongBase = family === "commerce_strip" || family === "residential_kit" || family === "lowrise_cluster";
  if (!strongBase) return;

  const base = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.42, bottom.y + footprintDepth * 0.3)
    .lineTo(bottom.x - footprintWidth * 0.14, bottom.y + footprintDepth * 0.43)
    .lineTo(bottom.x + footprintWidth * 0.16, bottom.y + footprintDepth * 0.31)
    .moveTo(bottom.x + footprintWidth * 0.42, bottom.y + footprintDepth * 0.29)
    .lineTo(bottom.x + footprintWidth * 0.14, bottom.y + footprintDepth * 0.44)
    .lineTo(bottom.x - footprintWidth * 0.12, bottom.y + footprintDepth * 0.32);
  base.stroke({ color: shadeColor(trimColor, family === "commerce_strip" ? 12 : -6), alpha: 0.34, width: 1.9, cap: "round", join: "round" });

  const baseStrata = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.36, bottom.y + footprintDepth * 0.39)
    .lineTo(bottom.x - footprintWidth * 0.08, bottom.y + footprintDepth * 0.51)
    .lineTo(bottom.x + footprintWidth * 0.18, bottom.y + footprintDepth * 0.39)
    .moveTo(bottom.x + footprintWidth * 0.36, bottom.y + footprintDepth * 0.37)
    .lineTo(bottom.x + footprintWidth * 0.08, bottom.y + footprintDepth * 0.51)
    .lineTo(bottom.x - footprintWidth * 0.16, bottom.y + footprintDepth * 0.39);
  baseStrata.stroke({ color: shadeColor(trimColor, -28), alpha: 0.22, width: 1.2, cap: "round", join: "round" });

  const entryPads = new Graphics();
  const bayCount = family === "commerce_strip" ? 4 : family === "residential_kit" ? 3 : 2;
  for (let bay = 0; bay < bayCount; bay += 1) {
    const offset = (bay / Math.max(1, bayCount - 1) - 0.5) * footprintWidth * 0.64;
    entryPads
      .roundRect(bottom.x + offset - footprintWidth * 0.04, bottom.y + footprintDepth * 0.22, footprintWidth * 0.08, 4.5, 1.5)
      .fill({ color: shadeColor(roofColor, 28), alpha: family === "commerce_strip" ? 0.34 : 0.22 });
  }
  layer.addChild(base, baseStrata, entryPads);
}

function drawObjectAuthorshipDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const family = building.visualGrammar?.objectFamily;
  if (!family) return;
  if (family === "residential_kit") drawAuthoredResidentialKitRhythm(layer, geometry, building);
  if (family === "commerce_strip") drawAuthoredCommerceStripRhythm(layer, geometry, building);
  if (family === "civic_landmark") drawAuthoredCivicLandmarkMass(layer, geometry);
  if (family === "lowrise_cluster") drawAuthoredLowriseClusterRhythm(layer, geometry);
  if (family === "service_block") drawAuthoredServiceBlockRhythm(layer, geometry);
  if (!isDraftBuilding(building)) drawPublicRiversideObjectAuthorshipPass(layer, geometry, building, family);
  if (family === "venue_anchor" || family === "transit_anchor") drawHiddenDraftAnchorAuthorship(layer, geometry, building);
}

function drawPublicRiversideObjectAuthorshipPass(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, family: string) {
  if (family === "civic_landmark") drawPublicCivicLandmarkObjectKit(layer, geometry, building);
  if (family === "residential_kit") drawPublicResidentialSilhouette(layer, geometry, building);
  if (family === "commerce_strip") drawPublicCommerceSilhouette(layer, geometry, building);
  if (family === "lowrise_cluster") drawPublicLowriseSilhouette(layer, geometry);
  if (family === "service_block") drawPublicServiceSilhouette(layer, geometry);
}

function drawPublicCivicLandmarkObjectKit(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  drawPublicCivicLandmarkSilhouette(layer, geometry);
  drawCivicLandmarkBaseHierarchy(layer, geometry);
  drawCivicLandmarkRoofHierarchy(layer, geometry);
  drawCivicLandmarkFacadeHierarchy(layer, geometry);
  if (building.id === "building-civic") drawEastvaleCorePublicCivicSignature(layer, geometry);
}

function drawPublicCivicLandmarkSilhouette(layer: Container, geometry: BuildingGeometry) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, trimColor } = geometry;
  const plinthEdge = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.46, bottom.y + footprintDepth * 0.42)
    .lineTo(bottom.x - footprintWidth * 0.12, bottom.y + footprintDepth * 0.58)
    .lineTo(bottom.x + footprintWidth * 0.24, bottom.y + footprintDepth * 0.42)
    .moveTo(bottom.x + footprintWidth * 0.46, bottom.y + footprintDepth * 0.4)
    .lineTo(bottom.x + footprintWidth * 0.12, bottom.y + footprintDepth * 0.58)
    .lineTo(bottom.x - footprintWidth * 0.22, bottom.y + footprintDepth * 0.42);
  plinthEdge.stroke({ color: 0x7f6d4e, alpha: 0.26, width: 1.6, cap: "round", join: "round" });

  const entryCanopy = polygon(
    diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.06 }, footprintWidth * 0.32, footprintDepth * 0.13),
    0xb7dceb,
    0.34,
    trimColor,
    0.1,
  );
  const roofCrown = polygon(
    diamondPoints({ x: top.x - footprintWidth * 0.02, y: top.y - footprintDepth * 0.42 }, footprintWidth * 0.5, footprintDepth * 0.17),
    shadeColor(roofColor, 22),
    0.34,
    trimColor,
    0.12,
  );
  const civicPilasters = new Graphics();
  for (let bay = -2; bay <= 2; bay += 1) {
    civicPilasters
      .roundRect(top.x + bay * (footprintWidth * 0.12) - 2.5, bottom.y - footprintDepth * 0.42, 5, 23, 1.5)
      .fill({ color: bay === 0 ? 0xd7f0f3 : highlightColor, alpha: bay === 0 ? 0.56 : 0.34 });
  }
  civicPilasters.stroke({ color: trimColor, alpha: 0.1, width: 0.8 });
  layer.addChild(plinthEdge, entryCanopy, roofCrown, civicPilasters);
}

function drawCivicLandmarkBaseHierarchy(layer: Container, geometry: BuildingGeometry) {
  const { bottom, footprintWidth, footprintDepth, trimColor } = geometry;
  const baseShadow = polygon(
    diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.42 }, footprintWidth * 0.94, footprintDepth * 0.26),
    0x2d423b,
    0.12,
    0x2d423b,
    0,
  );
  const forecourt = polygon(
    diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.34 }, footprintWidth * 0.68, footprintDepth * 0.22),
    0xe6c58f,
    0.28,
    0x7f6d4e,
    0.12,
  );
  const stairCuts = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.24, bottom.y + footprintDepth * 0.32)
    .lineTo(bottom.x, bottom.y + footprintDepth * 0.43)
    .lineTo(bottom.x + footprintWidth * 0.25, bottom.y + footprintDepth * 0.31)
    .moveTo(bottom.x - footprintWidth * 0.18, bottom.y + footprintDepth * 0.4)
    .lineTo(bottom.x, bottom.y + footprintDepth * 0.49)
    .lineTo(bottom.x + footprintWidth * 0.2, bottom.y + footprintDepth * 0.39);
  stairCuts.stroke({ color: shadeColor(trimColor, -20), alpha: 0.28, width: 1.5, cap: "round", join: "round" });
  layer.addChild(baseShadow, forecourt, stairCuts);
}

function drawCivicLandmarkRoofHierarchy(layer: Container, geometry: BuildingGeometry) {
  const { top, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
  const civicCap = polygon(
    diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.36 }, footprintWidth * 0.42, footprintDepth * 0.22),
    shadeColor(roofColor, 30),
    0.42,
    trimColor,
    0.14,
  );
  const capInset = polygon(
    diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.38 }, footprintWidth * 0.24, footprintDepth * 0.12),
    shadeColor(roofColor, -12),
    0.2,
    trimColor,
    0.08,
  );
  const shoulderLines = new Graphics()
    .moveTo(top.x - footprintWidth * 0.42, top.y - footprintDepth * 0.08)
    .lineTo(top.x - footprintWidth * 0.16, top.y - footprintDepth * 0.2)
    .lineTo(top.x + footprintWidth * 0.08, top.y - footprintDepth * 0.08)
    .lineTo(top.x + footprintWidth * 0.36, top.y - footprintDepth * 0.18)
    .moveTo(top.x - footprintWidth * 0.34, top.y + footprintDepth * 0.05)
    .lineTo(top.x - footprintWidth * 0.04, top.y + footprintDepth * 0.16)
    .lineTo(top.x + footprintWidth * 0.28, top.y + footprintDepth * 0.02);
  shoulderLines.stroke({ color: shadeColor(roofColor, -42), alpha: 0.26, width: 1.5, cap: "round", join: "round" });
  layer.addChild(civicCap, capInset, shoulderLines);
}

function drawCivicLandmarkFacadeHierarchy(layer: Container, geometry: BuildingGeometry) {
  const { top, bottom, footprintWidth, footprintDepth, highlightColor, trimColor } = geometry;
  const centerGlass = new Graphics()
    .roundRect(top.x - footprintWidth * 0.08, bottom.y - footprintDepth * 0.34, footprintWidth * 0.16, 26, 3)
    .fill({ color: 0xb7dceb, alpha: 0.38 })
    .stroke({ color: trimColor, alpha: 0.12, width: 0.9 });
  const wingRhythm = new Graphics();
  for (let bay = -3; bay <= 3; bay += 1) {
    if (bay === 0) continue;
    const bayAlpha = Math.abs(bay) === 1 ? 0.36 : 0.24;
    wingRhythm
      .roundRect(top.x + bay * (footprintWidth * 0.1) - 3, bottom.y - footprintDepth * 0.22, 6, 17, 1.4)
      .fill({ color: highlightColor, alpha: bayAlpha });
  }
  wingRhythm.stroke({ color: trimColor, alpha: 0.1, width: 0.8 });
  const entryAxis = new Graphics()
    .moveTo(top.x - footprintWidth * 0.18, bottom.y - footprintDepth * 0.08)
    .lineTo(top.x, bottom.y + footprintDepth * 0.02)
    .lineTo(top.x + footprintWidth * 0.2, bottom.y - footprintDepth * 0.08);
  entryAxis.stroke({ color: 0xfff1cc, alpha: 0.42, width: 2, cap: "round", join: "round" });
  layer.addChild(centerGlass, wingRhythm, entryAxis);
}

function drawEastvaleCorePublicCivicSignature(layer: Container, geometry: BuildingGeometry) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
  const eastvaleCap = polygon(
    diamondPoints({ x: top.x + footprintWidth * 0.02, y: top.y - footprintDepth * 0.56 }, footprintWidth * 0.2, footprintDepth * 0.15),
    shadeColor(roofColor, 42),
    0.5,
    trimColor,
    0.18,
  );
  const civicAxis = new Graphics()
    .moveTo(top.x, top.y - footprintDepth * 0.48)
    .lineTo(top.x, bottom.y + footprintDepth * 0.34)
    .moveTo(top.x - footprintWidth * 0.3, bottom.y + footprintDepth * 0.12)
    .lineTo(top.x, bottom.y + footprintDepth * 0.28)
    .lineTo(top.x + footprintWidth * 0.32, bottom.y + footprintDepth * 0.1);
  civicAxis.stroke({ color: 0xe9f8ff, alpha: 0.28, width: 1.8, cap: "round", join: "round" });
  layer.addChild(eastvaleCap, civicAxis);
}

function drawPublicResidentialSilhouette(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, highlightColor, trimColor } = geometry;
  const style = building.facadeStyle ?? "suburban";
  const sideWingX = style === "ranch" ? bottom.x + footprintWidth * 0.22 : bottom.x - footprintWidth * 0.22;
  const sideWing = polygon(
    diamondPoints({ x: sideWingX, y: bottom.y - footprintDepth * 0.04 }, footprintWidth * (style === "rowhome" ? 0.12 : 0.18), footprintDepth * 0.16),
    shadeColor(bodyColor, style === "ranch" ? -8 : -14),
    style === "rowhome" ? 0.1 : 0.16,
    trimColor,
    0.05,
  );
  const porch = polygon(
    diamondPoints({ x: style === "ranch" ? bottom.x + footprintWidth * 0.1 : bottom.x - footprintWidth * 0.12, y: bottom.y + footprintDepth * 0.28 }, footprintWidth * 0.16, footprintDepth * 0.1),
    0xe6c48f,
    0.26,
    0x7f6d4e,
    0.12,
  );
  const roofBreak = new Graphics()
    .moveTo(top.x - footprintWidth * 0.36, top.y - footprintDepth * 0.08)
    .lineTo(top.x - footprintWidth * 0.05, top.y + footprintDepth * 0.09)
    .lineTo(top.x + footprintWidth * 0.28, top.y - footprintDepth * 0.06);
  roofBreak.stroke({ color: shadeColor(roofColor, -34), alpha: style === "rowhome" ? 0.18 : 0.32, width: style === "ranch" ? 2.5 : 2, cap: "round", join: "round" });

  const windowRhythm = new Graphics();
  const windowCount = style === "ranch" ? 4 : 3;
  for (let index = 0; index < windowCount; index += 1) {
    const offset = (index / Math.max(1, windowCount - 1) - 0.5) * footprintWidth * 0.56;
    windowRhythm
      .roundRect(top.x + offset - 3.5, bottom.y - footprintDepth * 0.05 + (index % 2) * 2, 7, 6, 1.4)
      .fill({ color: highlightColor, alpha: 0.42 });
  }
  windowRhythm.stroke({ color: trimColor, alpha: 0.12, width: 0.7 });
  layer.addChild(sideWing, porch, roofBreak, windowRhythm);
}

function drawPublicCommerceSilhouette(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, accentColor, trimColor } = geometry;
  const bayCount = building.facadeStyle === "strip_store" ? 4 : 3;
  const awningUnderside = new Graphics()
    .moveTo(top.x - footprintWidth * 0.42, bottom.y - footprintDepth * 0.1)
    .lineTo(top.x - footprintWidth * 0.14, bottom.y + footprintDepth * 0.02)
    .lineTo(top.x + footprintWidth * 0.14, bottom.y - footprintDepth * 0.1)
    .lineTo(top.x + footprintWidth * 0.42, bottom.y + footprintDepth * 0.02);
  awningUnderside.stroke({ color: shadeColor(roofColor, -46), alpha: 0.32, width: 2.2, cap: "round", join: "round" });

  const bayCaps = new Graphics();
  for (let bay = 0; bay < bayCount; bay += 1) {
    const offset = (bay / Math.max(1, bayCount - 1) - 0.5) * footprintWidth * 0.66;
    bayCaps
      .roundRect(top.x + offset - footprintWidth * 0.045, top.y + footprintDepth * 0.12, footprintWidth * 0.09, 5, 1.3)
      .fill({ color: bay % 2 === 0 ? accentColor : shadeColor(roofColor, 24), alpha: 0.34 });
  }
  bayCaps.stroke({ color: trimColor, alpha: 0.1, width: 0.7 });
  layer.addChild(awningUnderside, bayCaps);
}

function drawPublicLowriseSilhouette(layer: Container, geometry: BuildingGeometry) {
  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, highlightColor, trimColor } = geometry;
  const sideCore = polygon(
    diamondPoints({ x: bottom.x + footprintWidth * 0.28, y: bottom.y - footprintDepth * 0.08 }, footprintWidth * 0.16, footprintDepth * 0.18),
    shadeColor(bodyColor, -18),
    0.18,
    trimColor,
    0.06,
  );
  const roofInset = polygon(
    diamondPoints({ x: top.x - footprintWidth * 0.1, y: top.y - footprintDepth * 0.08 }, footprintWidth * 0.28, footprintDepth * 0.16),
    shadeColor(roofColor, 20),
    0.22,
    trimColor,
    0.07,
  );
  const stackedWindows = new Graphics();
  for (let column = -2; column <= 2; column += 1) {
    stackedWindows
      .roundRect(top.x + column * (footprintWidth * 0.1) - 3, bottom.y - footprintDepth * 0.34, 6, 5, 1.2)
      .fill({ color: highlightColor, alpha: 0.36 })
      .roundRect(top.x + column * (footprintWidth * 0.1) - 3, bottom.y - footprintDepth * 0.17, 6, 5, 1.2)
      .fill({ color: shadeColor(highlightColor, -8), alpha: 0.3 });
  }
  layer.addChild(sideCore, roofInset, stackedWindows);
}

function drawPublicServiceSilhouette(layer: Container, geometry: BuildingGeometry) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, trimColor } = geometry;
  const serviceEntry = polygon(
    diamondPoints({ x: bottom.x - footprintWidth * 0.18, y: bottom.y + footprintDepth * 0.22 }, footprintWidth * 0.2, footprintDepth * 0.1),
    0xe0c392,
    0.28,
    0x7f6d4e,
    0.1,
  );
  const sawtooth = new Graphics()
    .moveTo(top.x - footprintWidth * 0.38, top.y - footprintDepth * 0.16)
    .lineTo(top.x - footprintWidth * 0.18, top.y - footprintDepth * 0.02)
    .lineTo(top.x, top.y - footprintDepth * 0.16)
    .lineTo(top.x + footprintWidth * 0.2, top.y - footprintDepth * 0.02)
    .lineTo(top.x + footprintWidth * 0.4, top.y - footprintDepth * 0.16);
  sawtooth.stroke({ color: shadeColor(roofColor, -42), alpha: 0.34, width: 2, cap: "round", join: "round" });
  const serviceWindows = new Graphics();
  for (let bay = -1; bay <= 1; bay += 1) {
    serviceWindows
      .roundRect(top.x + bay * (footprintWidth * 0.18) - 4, bottom.y - footprintDepth * 0.24, 8, 6, 1.4)
      .fill({ color: highlightColor, alpha: bay === 0 ? 0.38 : 0.26 });
  }
  serviceWindows.stroke({ color: trimColor, alpha: 0.12, width: 0.7 });
  layer.addChild(serviceEntry, sawtooth, serviceWindows);
}

function drawAuthoredResidentialKitRhythm(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, highlightColor, trimColor } = geometry;
  const style = building.facadeStyle ?? "suburban";
  const entryX = style === "ranch" ? bottom.x + footprintWidth * 0.12 : style === "rowhome" ? bottom.x : bottom.x - footprintWidth * 0.14;
  const threshold = polygon(
    diamondPoints({ x: entryX, y: bottom.y + footprintDepth * 0.3 }, footprintWidth * (style === "rowhome" ? 0.26 : 0.18), footprintDepth * 0.12),
    0xe7c895,
    style === "rowhome" ? 0.36 : 0.28,
    0x7f6d4e,
    0.14,
  );
  const roofEave = new Graphics()
    .moveTo(top.x - footprintWidth * 0.48, top.y + footprintDepth * 0.07)
    .lineTo(top.x, top.y + footprintDepth * 0.34)
    .lineTo(top.x + footprintWidth * 0.48, top.y + footprintDepth * 0.07);
  roofEave.stroke({ color: shadeColor(roofColor, -42), alpha: style === "rowhome" ? 0.18 : 0.28, width: 2.4, cap: "round", join: "round" });

  const wallRibs = new Graphics();
  const bayCount = style === "ranch" ? 4 : style === "rowhome" ? 5 : 3;
  for (let bay = 0; bay < bayCount; bay += 1) {
    const offset = (bay / Math.max(1, bayCount - 1) - 0.5) * footprintWidth * 0.68;
    wallRibs
      .roundRect(top.x + offset - footprintWidth * 0.035, bottom.y - footprintDepth * 0.22 + (bay % 2) * 2, footprintWidth * 0.07, 6, 1.5)
      .fill({ color: highlightColor, alpha: style === "rowhome" ? 0.52 : 0.4 })
      .moveTo(top.x + offset + footprintWidth * 0.055, top.y + footprintDepth * 0.13)
      .lineTo(top.x + offset + footprintWidth * 0.055, bottom.y + footprintDepth * 0.06);
  }
  wallRibs.stroke({ color: shadeColor(bodyColor, -32), alpha: 0.17, width: 0.9 });

  const sideBlock = polygon(
    diamondPoints({ x: bottom.x + footprintWidth * 0.27, y: bottom.y - footprintDepth * 0.02 }, footprintWidth * 0.14, footprintDepth * 0.14),
    shadeColor(bodyColor, -18),
    0.14,
    trimColor,
    0.06,
  );
  layer.addChild(threshold, sideBlock, roofEave, wallRibs);
}

function drawAuthoredCommerceStripRhythm(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, trimColor, accentColor } = geometry;
  const bayCount = building.facadeStyle === "strip_store" ? 5 : 3;
  const parapet = new Graphics()
    .moveTo(top.x - footprintWidth * 0.46, top.y - footprintDepth * 0.18)
    .lineTo(top.x - footprintWidth * 0.18, top.y - footprintDepth * 0.08)
    .lineTo(top.x + footprintWidth * 0.08, top.y - footprintDepth * 0.18)
    .lineTo(top.x + footprintWidth * 0.42, top.y - footprintDepth * 0.06);
  parapet.stroke({ color: shadeColor(roofColor, -38), alpha: 0.36, width: 2.4, cap: "round", join: "round" });

  const bays = new Graphics();
  for (let bay = 0; bay < bayCount; bay += 1) {
    const offset = (bay / Math.max(1, bayCount - 1) - 0.5) * footprintWidth * 0.72;
    bays
      .roundRect(top.x + offset - footprintWidth * 0.045, bottom.y - footprintDepth * 0.2, footprintWidth * 0.09, 10, 2)
      .fill({ color: bay % 2 === 0 ? highlightColor : 0xc7ecf1, alpha: 0.54 })
      .roundRect(top.x + offset - footprintWidth * 0.055, top.y + footprintDepth * 0.25, footprintWidth * 0.11, 5, 1.5)
      .fill({ color: bay % 2 === 0 ? accentColor : shadeColor(roofColor, 20), alpha: 0.46 });
  }
  bays.stroke({ color: trimColor, alpha: 0.16, width: 0.8 });

  const apronJoint = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.4, bottom.y + footprintDepth * 0.25)
    .lineTo(bottom.x - footprintWidth * 0.12, bottom.y + footprintDepth * 0.37)
    .lineTo(bottom.x + footprintWidth * 0.16, bottom.y + footprintDepth * 0.25)
    .moveTo(bottom.x + footprintWidth * 0.4, bottom.y + footprintDepth * 0.25)
    .lineTo(bottom.x + footprintWidth * 0.12, bottom.y + footprintDepth * 0.38)
    .lineTo(bottom.x - footprintWidth * 0.12, bottom.y + footprintDepth * 0.27);
  apronJoint.stroke({ color: 0x8f7a54, alpha: 0.24, width: 1.4, cap: "round", join: "round" });
  layer.addChild(parapet, bays, apronJoint);
}

function drawObjectKitCommerceStripRead(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  if (!isObjectKitCommerceStrip(building)) return;
  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, highlightColor, trimColor, accentColor } = geometry;
  const commerceGeometry = building.objectKit?.commerceGeometry;
  const bayCount = commerceGeometry?.bayCount ?? (building.objectKit?.signatureTags.includes("storefront-bay-rhythm") ? 5 : 4);
  const apronDepth = commerceGeometry?.apronDepth ?? 0.24;
  const glassRecessDepth = commerceGeometry?.glassRecessDepth ?? 0.24;
  const parapetWeight = commerceGeometry?.parapetWeight ?? 0.72;
  const signMountCount = Math.min(commerceGeometry?.signMountCount ?? bayCount, bayCount);
  const isPlazaRowFocus = commerceGeometry?.focusTarget === "plaza_row";

  const sharedStorefrontApron = polygon(
    diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * (0.45 + apronDepth * 0.08) }, footprintWidth * 1.02, footprintDepth * apronDepth),
    0xe2c796,
    isPlazaRowFocus ? 0.52 : 0.42,
    0x756947,
    isPlazaRowFocus ? 0.22 : 0.16,
  );
  const foundationShadow = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.46, bottom.y + footprintDepth * 0.35)
    .lineTo(bottom.x - footprintWidth * 0.1, bottom.y + footprintDepth * 0.52)
    .lineTo(bottom.x + footprintWidth * 0.46, bottom.y + footprintDepth * 0.31)
    .moveTo(bottom.x + footprintWidth * 0.46, bottom.y + footprintDepth * 0.35)
    .lineTo(bottom.x + footprintWidth * 0.1, bottom.y + footprintDepth * 0.53)
    .lineTo(bottom.x - footprintWidth * 0.44, bottom.y + footprintDepth * 0.31);
  foundationShadow.stroke({ color: 0x24352f, alpha: isPlazaRowFocus ? 0.3 : 0.24, width: isPlazaRowFocus ? 3.6 : 2.8, cap: "round", join: "round" });

  const parapetCap = new Graphics()
    .moveTo(top.x - footprintWidth * 0.48, top.y - footprintDepth * 0.2)
    .lineTo(top.x - footprintWidth * 0.18, top.y - footprintDepth * 0.09)
    .lineTo(top.x + footprintWidth * 0.12, top.y - footprintDepth * 0.2)
    .lineTo(top.x + footprintWidth * 0.46, top.y - footprintDepth * 0.07);
  parapetCap.stroke({ color: shadeColor(roofColor, -44), alpha: 0.44 + parapetWeight * 0.1, width: 2.4 + parapetWeight * 1.4, cap: "round", join: "round" });

  const glassRecesses = new Graphics();
  const signMounts = new Graphics();
  const awningLip = new Graphics();
  const bayPilasters = new Graphics();
  const storefrontThresholds = new Graphics();
  for (let bay = 0; bay < bayCount; bay += 1) {
    const offset = (bay / Math.max(1, bayCount - 1) - 0.5) * footprintWidth * 0.76;
    const bayWidth = footprintWidth * (isPlazaRowFocus ? 0.082 : 0.095);
    const doorHeight = bay === Math.floor(bayCount / 2) ? 14 + glassRecessDepth * 5 : 10 + glassRecessDepth * 4;
    glassRecesses
      .roundRect(top.x + offset - bayWidth * 0.5, bottom.y - footprintDepth * 0.23, bayWidth, doorHeight, 2)
      .fill({ color: bay === Math.floor(bayCount / 2) ? 0xb9dfe7 : highlightColor, alpha: 0.6 })
      .roundRect(top.x + offset - bayWidth * 0.54, bottom.y - footprintDepth * 0.24, bayWidth * 1.08, doorHeight + 1.5, 2)
      .stroke({ color: shadeColor(bodyColor, -34), alpha: 0.18, width: 0.9 });

    if (bay < signMountCount) {
      signMounts
        .roundRect(top.x + offset - bayWidth * 0.62, top.y + footprintDepth * 0.23, bayWidth * 1.24, isPlazaRowFocus ? 5.8 : 4.8, 1.2)
        .fill({ color: bay % 2 === 0 ? accentColor : shadeColor(roofColor, 18), alpha: isPlazaRowFocus ? 0.56 : 0.46 });
    }

    awningLip
      .moveTo(top.x + offset - bayWidth * 0.68, bottom.y - footprintDepth * 0.08)
      .lineTo(top.x + offset + bayWidth * 0.58, bottom.y - footprintDepth * 0.02);

    bayPilasters
      .moveTo(top.x + offset - bayWidth * 0.7, bottom.y - footprintDepth * 0.26)
      .lineTo(top.x + offset - bayWidth * 0.7, bottom.y - footprintDepth * 0.02)
      .moveTo(top.x + offset + bayWidth * 0.7, bottom.y - footprintDepth * 0.25)
      .lineTo(top.x + offset + bayWidth * 0.7, bottom.y - footprintDepth * 0.02);

    storefrontThresholds
      .roundRect(top.x + offset - bayWidth * 0.64, bottom.y - footprintDepth * 0.025, bayWidth * 1.28, isPlazaRowFocus ? 3.8 : 2.8, 1.1)
      .fill({ color: 0xc9a46f, alpha: isPlazaRowFocus ? 0.38 : 0.24 });
  }
  awningLip.stroke({ color: shadeColor(roofColor, -46), alpha: 0.32, width: 2.1, cap: "round", join: "round" });
  bayPilasters.stroke({ color: shadeColor(trimColor, -18), alpha: isPlazaRowFocus ? 0.28 : 0.18, width: isPlazaRowFocus ? 1.4 : 0.9, cap: "round", join: "round" });

  const sideFaceRibs = new Graphics()
    .moveTo(top.x - footprintWidth * 0.47, top.y + footprintDepth * 0.1)
    .lineTo(bottom.x - footprintWidth * 0.45, bottom.y + footprintDepth * 0.14)
    .lineTo(bottom.x - footprintWidth * 0.31, bottom.y + footprintDepth * 0.21)
    .moveTo(top.x + footprintWidth * 0.47, top.y + footprintDepth * 0.1)
    .lineTo(bottom.x + footprintWidth * 0.45, bottom.y + footprintDepth * 0.14)
    .lineTo(bottom.x + footprintWidth * 0.31, bottom.y + footprintDepth * 0.21);
  sideFaceRibs.stroke({ color: shadeColor(trimColor, -20), alpha: 0.2, width: 1.2, cap: "round", join: "round" });

  const plazaRowFrontageDepth = isPlazaRowFocus
    ? polygon(
      diamondPoints({ x: bottom.x + footprintWidth * 0.04, y: bottom.y + footprintDepth * 0.28 }, footprintWidth * 0.82, footprintDepth * 0.16),
      0xd9b983,
      0.26,
      0x756947,
      0.1,
    )
    : null;

  layer.addChild(
    sharedStorefrontApron,
    foundationShadow,
    ...(plazaRowFrontageDepth ? [plazaRowFrontageDepth] : []),
    parapetCap,
    glassRecesses,
    signMounts,
    awningLip,
    bayPilasters,
    storefrontThresholds,
    sideFaceRibs,
  );
}

function drawObjectKitCivicLandmarkRead(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  if (!isObjectKitCivicLandmark(building)) return;
  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, trimColor } = geometry;
  const civicGeometry = building.objectKit?.civicGeometry;
  const plinthTierCount = civicGeometry?.plinthTierCount ?? 2;
  const entryBayCount = civicGeometry?.entryBayCount ?? 4;
  const facadePierCount = civicGeometry?.facadePierCount ?? 5;
  const glassBandCount = civicGeometry?.glassBandCount ?? 2;
  const roofCapWeight = civicGeometry?.roofCapWeight ?? 0.84;
  const canopyDepth = civicGeometry?.civicCanopyDepth ?? 0.24;
  const isEastvaleCore = civicGeometry?.focusTarget === "eastvale_core";

  const plinthTiers = new Graphics();
  for (let tier = 0; tier < plinthTierCount; tier += 1) {
    const tierScale = 0.9 - tier * 0.11;
    const tierY = bottom.y + footprintDepth * (0.43 + tier * 0.06);
    plinthTiers
      .poly(diamondPoints({ x: bottom.x, y: tierY }, footprintWidth * tierScale, footprintDepth * (0.2 - tier * 0.025)), true)
      .fill({ color: tier === 0 ? 0xd6bb86 : 0xead0a1, alpha: isEastvaleCore ? 0.22 + tier * 0.06 : 0.16 + tier * 0.04 })
      .stroke({ color: 0x756947, alpha: isEastvaleCore ? 0.14 : 0.09, width: 0.9 });
  }

  const civicEntryBays = new Graphics();
  for (let bay = 0; bay < entryBayCount; bay += 1) {
    const offset = (bay / Math.max(1, entryBayCount - 1) - 0.5) * footprintWidth * 0.66;
    const isCenter = bay === Math.floor(entryBayCount / 2);
    civicEntryBays
      .roundRect(top.x + offset - footprintWidth * 0.034, bottom.y - footprintDepth * 0.3, footprintWidth * 0.068, isCenter ? 24 : 17, 1.8)
      .fill({ color: isCenter ? 0xd4eff3 : highlightColor, alpha: isCenter ? 0.52 : 0.34 })
      .roundRect(top.x + offset - footprintWidth * 0.04, bottom.y - footprintDepth * 0.31, footprintWidth * 0.08, isCenter ? 25.5 : 18.5, 1.8)
      .stroke({ color: trimColor, alpha: isCenter ? 0.16 : 0.09, width: 0.8 });
  }

  const facadePiers = new Graphics();
  for (let pier = 0; pier < facadePierCount; pier += 1) {
    const offset = (pier / Math.max(1, facadePierCount - 1) - 0.5) * footprintWidth * 0.76;
    facadePiers
      .moveTo(top.x + offset, bottom.y - footprintDepth * 0.42)
      .lineTo(top.x + offset + footprintWidth * 0.025, bottom.y + footprintDepth * 0.02);
  }
  facadePiers.stroke({ color: shadeColor(trimColor, -18), alpha: isEastvaleCore ? 0.24 : 0.14, width: isEastvaleCore ? 1.2 : 0.9, cap: "round", join: "round" });

  const glassBands = new Graphics();
  for (let band = 0; band < glassBandCount; band += 1) {
    const y = bottom.y - footprintDepth * (0.16 + band * 0.11);
    glassBands
      .moveTo(top.x - footprintWidth * 0.34, y)
      .lineTo(top.x - footprintWidth * 0.08, y + footprintDepth * 0.07)
      .lineTo(top.x + footprintWidth * 0.16, y)
      .lineTo(top.x + footprintWidth * 0.36, y + footprintDepth * 0.07);
  }
  glassBands.stroke({ color: 0xc9edf2, alpha: isEastvaleCore ? 0.34 : 0.22, width: 1.6, cap: "round", join: "round" });

  const canopy = polygon(
    diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.08 }, footprintWidth * 0.34, footprintDepth * canopyDepth),
    0xc4e4e9,
    isEastvaleCore ? 0.38 : 0.26,
    trimColor,
    0.1,
  );
  const roofCap = polygon(
    diamondPoints({ x: top.x + footprintWidth * 0.01, y: top.y - footprintDepth * (0.45 + roofCapWeight * 0.04) }, footprintWidth * (0.38 + roofCapWeight * 0.08), footprintDepth * 0.16),
    shadeColor(roofColor, 38),
    isEastvaleCore ? 0.46 : 0.32,
    trimColor,
    0.13,
  );

  layer.addChild(plinthTiers, civicEntryBays, facadePiers, glassBands, canopy, roofCap);
}

function drawObjectKitServiceGymRead(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  if (!isObjectKitServiceGym(building)) return;
  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, highlightColor, trimColor } = geometry;
  const serviceGeometry = building.objectKit?.serviceGeometry;
  const serviceBayCount = serviceGeometry?.serviceBayCount ?? 3;
  const sawtoothCount = serviceGeometry?.sawtoothCount ?? 3;
  const entryRecessDepth = serviceGeometry?.entryRecessDepth ?? 0.22;
  const utilityApronDepth = serviceGeometry?.utilityApronDepth ?? 0.26;
  const roofMonitorWeight = serviceGeometry?.roofMonitorWeight ?? 0.82;
  const isEastvaleGym = serviceGeometry?.focusTarget === "eastvale_gym";

  const serviceApron = polygon(
    diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * (0.4 + utilityApronDepth * 0.06) }, footprintWidth * 0.86, footprintDepth * utilityApronDepth),
    0xd8bf90,
    isEastvaleGym ? 0.4 : 0.28,
    0x756947,
    isEastvaleGym ? 0.18 : 0.1,
  );
  const foundationLine = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.42, bottom.y + footprintDepth * 0.31)
    .lineTo(bottom.x - footprintWidth * 0.08, bottom.y + footprintDepth * 0.48)
    .lineTo(bottom.x + footprintWidth * 0.42, bottom.y + footprintDepth * 0.28)
    .moveTo(bottom.x + footprintWidth * 0.42, bottom.y + footprintDepth * 0.31)
    .lineTo(bottom.x + footprintWidth * 0.08, bottom.y + footprintDepth * 0.49)
    .lineTo(bottom.x - footprintWidth * 0.4, bottom.y + footprintDepth * 0.29);
  foundationLine.stroke({ color: 0x24352f, alpha: isEastvaleGym ? 0.28 : 0.18, width: isEastvaleGym ? 3 : 2.2, cap: "round", join: "round" });

  const roofMonitors = new Graphics();
  for (let tooth = 0; tooth < sawtoothCount; tooth += 1) {
    const offset = (tooth / Math.max(1, sawtoothCount - 1) - 0.5) * footprintWidth * 0.74;
    roofMonitors
      .moveTo(top.x + offset - footprintWidth * 0.045, top.y - footprintDepth * 0.23)
      .lineTo(top.x + offset + footprintWidth * 0.045, top.y - footprintDepth * 0.1)
      .lineTo(top.x + offset + footprintWidth * 0.12, top.y - footprintDepth * 0.2);
  }
  roofMonitors.stroke({ color: shadeColor(roofColor, -46), alpha: 0.38 + roofMonitorWeight * 0.08, width: 1.7 + roofMonitorWeight * 0.65, cap: "round", join: "round" });

  const serviceBays = new Graphics();
  const bayWidth = footprintWidth * 0.09;
  for (let bay = 0; bay < serviceBayCount; bay += 1) {
    const offset = (bay / Math.max(1, serviceBayCount - 1) - 0.5) * footprintWidth * 0.62;
    const isEntry = bay === 0;
    serviceBays
      .roundRect(top.x + offset - bayWidth * 0.5, bottom.y - footprintDepth * 0.22, bayWidth, isEntry ? 15 : 10, 1.8)
      .fill({ color: isEntry ? highlightColor : shadeColor(bodyColor, -16), alpha: isEntry ? 0.5 : 0.27 })
      .roundRect(top.x + offset - bayWidth * 0.56, bottom.y - footprintDepth * (0.23 + entryRecessDepth * 0.03), bayWidth * 1.12, isEntry ? 16.5 : 11.5, 1.8)
      .stroke({ color: trimColor, alpha: isEntry ? 0.18 : 0.09, width: 0.8 });
  }

  const utilitySideRibs = new Graphics()
    .moveTo(top.x - footprintWidth * 0.46, top.y + footprintDepth * 0.04)
    .lineTo(bottom.x - footprintWidth * 0.42, bottom.y + footprintDepth * 0.1)
    .lineTo(bottom.x - footprintWidth * 0.24, bottom.y + footprintDepth * 0.18)
    .moveTo(top.x + footprintWidth * 0.46, top.y + footprintDepth * 0.04)
    .lineTo(bottom.x + footprintWidth * 0.42, bottom.y + footprintDepth * 0.1)
    .lineTo(bottom.x + footprintWidth * 0.24, bottom.y + footprintDepth * 0.18);
  utilitySideRibs.stroke({ color: shadeColor(trimColor, -22), alpha: isEastvaleGym ? 0.22 : 0.14, width: 1.15, cap: "round", join: "round" });

  layer.addChild(serviceApron, foundationLine, roofMonitors, serviceBays, utilitySideRibs);
}

function drawAuthoredCivicLandmarkMass(layer: Container, geometry: BuildingGeometry) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, trimColor } = geometry;
  const baseTerrace = polygon(
    diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.32 }, footprintWidth * 0.84, footprintDepth * 0.22),
    0xddc18f,
    0.32,
    0x7f6d4e,
    0.12,
  );
  const upperCap = polygon(
    diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.3 }, footprintWidth * 0.34, footprintDepth * 0.26),
    shadeColor(roofColor, 30),
    0.5,
    trimColor,
    0.18,
  );
  const facadeBeats = new Graphics();
  for (let bay = -3; bay <= 3; bay += 1) {
    facadeBeats
      .roundRect(top.x + bay * (footprintWidth * 0.09) - 3, bottom.y - footprintDepth * 0.27, 6, 15, 1.5)
      .fill({ color: bay === 0 ? 0xb7dceb : highlightColor, alpha: bay === 0 ? 0.62 : 0.42 });
  }
  facadeBeats.stroke({ color: trimColor, alpha: 0.12, width: 0.8 });
  layer.addChild(baseTerrace, upperCap, facadeBeats);
}

function drawAuthoredLowriseClusterRhythm(layer: Container, geometry: BuildingGeometry) {
  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, highlightColor, trimColor } = geometry;
  const podium = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.32 }, footprintWidth * 0.72, footprintDepth * 0.2), 0xe0c89a, 0.28, 0x7f6d4e, 0.12);
  const roofCourtyard = polygon(diamondPoints({ x: top.x + footprintWidth * 0.14, y: top.y - footprintDepth * 0.02 }, footprintWidth * 0.24, footprintDepth * 0.2), shadeColor(roofColor, 26), 0.28, trimColor, 0.08);
  const stacked = new Graphics();
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const x = top.x - footprintWidth * 0.3 + col * footprintWidth * 0.18;
      const y = bottom.y - footprintDepth * 0.26 + row * 10;
      stacked
        .roundRect(x, y, 7, 5, 1.4)
        .fill({ color: row % 2 === 0 ? highlightColor : shadeColor(bodyColor, 24), alpha: 0.48 });
    }
  }
  stacked.stroke({ color: trimColor, alpha: 0.14, width: 0.7 });
  layer.addChild(podium, roofCourtyard, stacked);
}

function drawAuthoredServiceBlockRhythm(layer: Container, geometry: BuildingGeometry) {
  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, highlightColor, trimColor } = geometry;
  const serviceApron = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.34 }, footprintWidth * 0.66, footprintDepth * 0.18), 0xdcc398, 0.3, 0x7f6d4e, 0.12);
  const roofRake = new Graphics()
    .moveTo(top.x - footprintWidth * 0.36, top.y - footprintDepth * 0.08)
    .lineTo(top.x + footprintWidth * 0.34, top.y + footprintDepth * 0.22)
    .moveTo(top.x - footprintWidth * 0.2, top.y - footprintDepth * 0.15)
    .lineTo(top.x + footprintWidth * 0.48, top.y + footprintDepth * 0.14);
  roofRake.stroke({ color: shadeColor(roofColor, -38), alpha: 0.35, width: 2, cap: "round" });
  const serviceBays = new Graphics();
  for (let bay = -2; bay <= 2; bay += 1) {
    serviceBays
      .roundRect(top.x + bay * (footprintWidth * 0.12) - 4, bottom.y - footprintDepth * 0.18, 8, 12, 1.6)
      .fill({ color: bay === 0 ? highlightColor : shadeColor(bodyColor, -18), alpha: bay === 0 ? 0.46 : 0.22 });
  }
  serviceBays.stroke({ color: trimColor, alpha: 0.14, width: 0.8 });
  layer.addChild(serviceApron, roofRake, serviceBays);
}

function drawHiddenDraftAnchorAuthorship(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  if (building.visualGrammar?.noLabelPriority !== "primary_anchor") return;
  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, trimColor } = geometry;
  const anchorHalo = polygon(
    diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.52 }, footprintWidth * 0.88, footprintDepth * 0.22),
    building.visualGrammar.objectFamily === "transit_anchor" ? 0x9fb3af : 0xd9c091,
    0.18,
    0x6d5e43,
    0.08,
  );
  const silhouetteRibs = new Graphics();
  const ribCount = building.visualGrammar.objectFamily === "transit_anchor" ? 8 : 6;
  for (let rib = 0; rib < ribCount; rib += 1) {
    const offset = (rib / Math.max(1, ribCount - 1) - 0.5) * footprintWidth * 0.78;
    silhouetteRibs
      .moveTo(top.x + offset - footprintWidth * 0.04, top.y - footprintDepth * 0.22)
      .lineTo(top.x + offset + footprintWidth * 0.08, top.y + footprintDepth * 0.22)
      .roundRect(top.x + offset - 3, bottom.y - footprintDepth * 0.24, 6, 8, 1.4)
      .fill({ color: highlightColor, alpha: 0.22 });
  }
  silhouetteRibs.stroke({ color: shadeColor(roofColor, -44), alpha: 0.28, width: 1.2, cap: "round", join: "round" });
  const roofRead = polygon(
    diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.14 }, footprintWidth * 0.56, footprintDepth * 0.28),
    shadeColor(roofColor, 28),
    0.22,
    trimColor,
    0.08,
  );
  layer.addChild(anchorHalo, roofRead, silhouetteRibs);
}

// Directional cast shadow: the building silhouette swept along the sun->ground
// vector (sun upper-left, so shadows skew to the lower-right). Drawn in a
// dedicated layer under all buildings so shadows land on ground and lots.
function drawBuildingCastShadow(layer: Container, building: CityWorldBuilding) {
  const bottom = project(building.position);
  const heightPx = Math.min(building.height * TILE_DEPTH, 96) + 16;
  if (heightPx <= 18) return;
  const width = building.width * TILE_WIDTH * 0.96;
  const depth = building.depth * TILE_HEIGHT * 0.92;
  // Anchor a touch toward the shadow side so the sweep emerges past the
  // building's foundation pad instead of hiding underneath it.
  const anchorX = bottom.x + 5;
  const anchorY = bottom.y + depth * 0.08;
  const left = { x: anchorX - width * 0.5, y: anchorY };
  const top = { x: anchorX, y: anchorY - depth * 0.5 };
  const right = { x: anchorX + width * 0.5, y: anchorY };
  const base = { x: anchorX, y: anchorY + depth * 0.5 };

  const sweep = (reach: number, alpha: number) => {
    const vx = CAST_SHADOW_VECTOR.x * heightPx * reach;
    const vy = CAST_SHADOW_VECTOR.y * heightPx * reach;
    return new Graphics()
      .poly(
        [top.x, top.y, left.x, left.y, base.x, base.y, base.x + vx, base.y + vy, right.x + vx, right.y + vy, top.x + vx, top.y + vy],
        true,
      )
      .fill({ color: CAST_SHADOW_COLOR, alpha });
  };

  layer.addChild(sweep(1, CAST_SHADOW_ALPHA), sweep(0.5, 0.12));
}

function drawBuildingFootprint(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, selected: boolean, hovered: boolean) {
  const { bottom, footprintWidth, footprintDepth, bodyColor, roofColor, trimColor } = geometry;
  const spriteBacked = geometry.asset.mode === "sprite";
  const style = building.facadeStyle ?? building.kind;
  const draftBuilding = isDraftBuilding(building);
  const padWidth = footprintWidth * (spriteBacked ? 0.94 : style === "rowhome" || style === "strip_store" ? 1.02 : 0.92);
  const padDepth = footprintDepth * (spriteBacked ? 0.72 : style === "rowhome" || style === "strip_store" ? 0.86 : 0.76);
  const padCenter = { x: bottom.x, y: bottom.y + footprintDepth * (spriteBacked ? 0.24 : 0.2) };
  const padColor = draftBuilding ? (building.kind === "civic" ? 0xe6cf9f : 0xe7c999) : style === "strip_store" || building.kind === "shop" || building.kind === "civic" ? 0xe7d0a2 : shadeColor(bodyColor, 18);
  const edgeColor = style === "rowhome" || style === "strip_store" ? shadeColor(trimColor, -14) : shadeColor(roofColor, -48);

  const contactGraphics = buildingContactShadow(geometry, building, selected, hovered, padWidth, padDepth, draftBuilding);
  const pad = polygon(diamondPoints(padCenter, padWidth, padDepth), padColor, draftBuilding ? 0.58 : spriteBacked ? 0.46 : 0.48, 0x6f7f55, selected || hovered ? 0.34 : draftBuilding ? 0.2 : 0.16);
  const lowerLip = new Graphics()
    .moveTo(padCenter.x - padWidth * 0.5, padCenter.y)
    .lineTo(padCenter.x, padCenter.y + padDepth * 0.5)
    .lineTo(padCenter.x + padWidth * 0.5, padCenter.y)
    .lineTo(padCenter.x + padWidth * 0.5, padCenter.y + 5)
    .lineTo(padCenter.x, padCenter.y + padDepth * 0.5 + 7)
    .lineTo(padCenter.x - padWidth * 0.5, padCenter.y + 5)
    .closePath()
    .fill({ color: shadeColor(padColor, draftBuilding ? -38 : -34), alpha: draftBuilding ? 0.42 : spriteBacked ? 0.42 : 0.32 })
    .stroke({ color: edgeColor, alpha: 0.16, width: 1 });

  layer.addChild(...contactGraphics, pad, lowerLip);
  if (draftBuilding) drawDraftFoundationMaterial(layer, padCenter, padWidth, padDepth, padColor);
}

function buildingContactShadow(
  geometry: BuildingGeometry,
  building: CityWorldBuilding,
  selected: boolean,
  hovered: boolean,
  padWidth: number,
  padDepth: number,
  draftBuilding: boolean,
): Graphics[] {
  const { bottom, footprintDepth } = geometry;
  const profile = building.visualGrammar?.contactProfile ?? "parcel_pad_shadow";
  const activeBoost = selected ? 0.09 : hovered ? 0.05 : 0;
  const draftBoost = draftBuilding ? 0.04 : 0;
  const centerY = bottom.y + footprintDepth * 0.38;

  if (profile === "landmark_base_shadow") {
    const penumbra = new Graphics()
      .ellipse(bottom.x, centerY + 2, padWidth * 0.64, padDepth * 0.68)
      .fill({ color: 0x1d2a24, alpha: 0.07 + activeBoost * 0.4 + draftBoost * 0.5 });
    const core = new Graphics()
      .ellipse(bottom.x, centerY, padWidth * 0.44, padDepth * 0.5)
      .fill({ color: 0x23342e, alpha: 0.18 + activeBoost + draftBoost });
    const plinthSeam = new Graphics()
      .moveTo(bottom.x - padWidth * 0.46, centerY + padDepth * 0.08)
      .lineTo(bottom.x, centerY + padDepth * 0.4)
      .lineTo(bottom.x + padWidth * 0.46, centerY + padDepth * 0.08);
    plinthSeam.stroke({ color: 0x1d2a24, alpha: 0.2, width: 1.7, cap: "round", join: "round" });
    return [penumbra, core, plinthSeam];
  }

  if (profile === "soft_ground_shadow") {
    const soft = new Graphics()
      .ellipse(bottom.x, centerY + 1, padWidth * 0.6, padDepth * 0.66)
      .fill({ color: 0x23342e, alpha: 0.11 + activeBoost + draftBoost });
    return [soft];
  }

  if (profile === "curb_shadow") {
    const curb = new Graphics()
      .ellipse(bottom.x, centerY + 2, padWidth * 0.52, padDepth * 0.42)
      .fill({ color: 0x23342e, alpha: 0.2 + activeBoost + draftBoost });
    return [curb];
  }

  const padSkirt = polygon(
    diamondPoints({ x: bottom.x, y: centerY + 1.5 }, padWidth * 1.06, padDepth * 0.92),
    0x23342e,
    0.05 + activeBoost * 0.3 + draftBoost * 0.5,
    0x23342e,
    0,
  );
  const core = new Graphics()
    .ellipse(bottom.x, centerY, padWidth * 0.44, padDepth * 0.5)
    .fill({ color: 0x23342e, alpha: 0.13 + activeBoost + draftBoost });
  return [padSkirt, core];
}

function drawDraftFoundationMaterial(layer: Container, center: ProjectedPoint, width: number, height: number, color: number) {
  const stratum = new Graphics()
    .moveTo(center.x - width * 0.42, center.y + height * 0.18)
    .lineTo(center.x - width * 0.14, center.y + height * 0.33)
    .lineTo(center.x + width * 0.16, center.y + height * 0.18)
    .moveTo(center.x + width * 0.42, center.y + height * 0.18)
    .lineTo(center.x + width * 0.14, center.y + height * 0.33)
    .lineTo(center.x - width * 0.12, center.y + height * 0.2);
  stratum.stroke({ color: shadeColor(color, -48), alpha: 0.2, width: 1.1, cap: "round", join: "round" });
  const contactTile = polygon(diamondPoints({ x: center.x, y: center.y + height * 0.18 }, width * 0.54, height * 0.18), shadeColor(color, 14), 0.14, 0xffffff, 0);
  layer.addChild(contactTile, stratum);
}

function drawBuildingShell(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, selected: boolean, hovered: boolean) {
  const { bottom, top, footprintWidth, footprintDepth, bodyColor, outline, activeStrokeAlpha } = geometry;
  // Unified sun: lower-left wall faces the sun, lower-right wall falls into
  // cool shade. Same factors for every building in the scene.
  const sideLeft = sunlitColor(bodyColor, "sun");
  const sideRight = sunlitColor(bodyColor, "shade");
  const topLeft = { x: top.x - footprintWidth / 2, y: top.y };
  const topRight = { x: top.x + footprintWidth / 2, y: top.y };
  const topFront = { x: top.x, y: top.y + footprintDepth / 2 };
  const bottomLeft = { x: bottom.x - footprintWidth / 2, y: bottom.y };
  const bottomRight = { x: bottom.x + footprintWidth / 2, y: bottom.y };
  const bottomFront = { x: bottom.x, y: bottom.y + footprintDepth / 2 };
  const leftSide = [topLeft.x, topLeft.y, topFront.x, topFront.y, bottomFront.x, bottomFront.y, bottomLeft.x, bottomLeft.y];
  const rightSide = [topRight.x, topRight.y, topFront.x, topFront.y, bottomFront.x, bottomFront.y, bottomRight.x, bottomRight.y];

  const left = polygon(leftSide, sideLeft, 0.99, outline, activeStrokeAlpha);
  const right = polygon(rightSide, sideRight, 0.99, outline, activeStrokeAlpha);
  layer.addChild(left, right);
  drawBuildingShellLighting(layer, geometry);
  drawWallDepthLines(layer, geometry, building);
  drawAuthoredWallMaterial(layer, geometry, building);

  drawRoof(layer, geometry, building, selected, hovered);
}

// Ambient occlusion + rim light for the box shell: dark gradient bands where
// the walls meet the ground, a darkened seam on the front corner, and a warm
// rim on the sun-facing top edge.
function drawBuildingShellLighting(layer: Container, geometry: BuildingGeometry) {
  const { bottom, top, footprintWidth, footprintDepth, height } = geometry;
  const halfW = footprintWidth / 2;
  const halfD = footprintDepth / 2;
  const topFront = { x: top.x, y: top.y + halfD };
  const bottomLeft = { x: bottom.x - halfW, y: bottom.y };
  const bottomRight = { x: bottom.x + halfW, y: bottom.y };
  const bottomFront = { x: bottom.x, y: bottom.y + halfD };

  const aoBand = (lift: number, alpha: number) =>
    new Graphics()
      .poly(
        [
          bottomLeft.x, bottomLeft.y - lift,
          bottomFront.x, bottomFront.y - lift,
          bottomRight.x, bottomRight.y - lift,
          bottomRight.x, bottomRight.y,
          bottomFront.x, bottomFront.y,
          bottomLeft.x, bottomLeft.y,
        ],
        true,
      )
      .fill({ color: 0x18262e, alpha });
  const aoTall = Math.max(4, Math.min(height * 0.22, 12));
  layer.addChild(aoBand(aoTall, 0.13), aoBand(aoTall * 0.5, 0.15));

  const cornerSeam = new Graphics().moveTo(topFront.x, topFront.y).lineTo(bottomFront.x, bottomFront.y);
  cornerSeam.stroke({ color: 0x18262e, alpha: 0.2, width: 1.2, cap: "round" });

  const rim = new Graphics().moveTo(top.x - halfW, top.y).lineTo(topFront.x, topFront.y);
  rim.stroke({ color: 0xfff4d6, alpha: 0.7, width: 1.7, cap: "round" });
  const shadeEdge = new Graphics().moveTo(topFront.x, topFront.y).lineTo(top.x + halfW, top.y);
  shadeEdge.stroke({ color: 0x1a2c37, alpha: 0.38, width: 1.5, cap: "round" });
  layer.addChild(cornerSeam, rim, shadeEdge);
}

function drawAuthoredWallMaterial(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const profile = building.visualGrammar?.materialProfile;
  if (!profile) return;
  const { top, bottom, footprintWidth, footprintDepth, bodyColor } = geometry;
  const halfWidth = footprintWidth / 2;
  const wallY = (t: number) => top.y + (bottom.y - top.y) * t;

  const wallBand = (t: number, color: number, alpha: number, width: number, reach = 1): Graphics => {
    const band = new Graphics()
      .moveTo(top.x - halfWidth * reach, wallY(t) + (footprintDepth / 2) * (1 - reach))
      .lineTo(top.x, wallY(t) + footprintDepth / 2)
      .lineTo(top.x + halfWidth * reach, wallY(t) + (footprintDepth / 2) * (1 - reach));
    band.stroke({ color, alpha, width, cap: "round", join: "round" });
    return band;
  };

  if (profile === "socal_stucco_warm") {
    layer.addChild(wallBand(0.88, shadeColor(bodyColor, -30), 0.22, 1.5), wallBand(0.28, shadeColor(bodyColor, 26), 0.13, 1));
    return;
  }

  if (profile === "socal_stucco_light") {
    layer.addChild(wallBand(0.6, shadeColor(bodyColor, 30), 0.15, 1), wallBand(0.88, shadeColor(bodyColor, -24), 0.17, 1.3));
    return;
  }

  if (profile === "socal_cool_stucco") {
    const rightWash = new Graphics()
      .poly(
        [
          top.x,
          wallY(0.16) + footprintDepth / 2,
          top.x + halfWidth,
          wallY(0.16),
          top.x + halfWidth,
          wallY(0.94),
          top.x,
          wallY(0.94) + footprintDepth / 2,
        ],
        true,
      )
      .fill({ color: 0x5f7d86, alpha: 0.08 });
    layer.addChild(rightWash, wallBand(0.88, shadeColor(bodyColor, -32), 0.19, 1.4));
    return;
  }

  if (profile === "socal_storefront") {
    layer.addChild(
      wallBand(0.52, 0xbfe2ea, 0.36, 4.2, 0.86),
      wallBand(0.9, shadeColor(bodyColor, -44), 0.28, 2.1),
    );
    return;
  }

  if (profile === "socal_lowrise") {
    layer.addChild(
      wallBand(0.34, shadeColor(bodyColor, -26), 0.15, 1),
      wallBand(0.6, shadeColor(bodyColor, -26), 0.15, 1),
      wallBand(0.9, shadeColor(bodyColor, -34), 0.19, 1.3),
    );
    return;
  }

  if (profile === "civic_glass_stucco") {
    const fins = new Graphics();
    for (let fin = -1; fin <= 1; fin += 1) {
      const u = fin * 0.34;
      const x = top.x + u * halfWidth;
      const lift = (1 - Math.abs(u)) * (footprintDepth / 2);
      fins.moveTo(x, wallY(0.2) + lift).lineTo(x, wallY(0.92) + lift);
    }
    fins.stroke({ color: 0xcfeaf2, alpha: 0.26, width: 1.5, cap: "round" });
    layer.addChild(fins, wallBand(0.92, shadeColor(bodyColor, -38), 0.24, 1.8));
  }
}

function drawRoof(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, selected: boolean, hovered: boolean) {
  const { top, footprintWidth, footprintDepth, roofColor, outline, activeStrokeAlpha } = geometry;
  const roofShape = building.roofShape ?? "flat";
  // Roofs are the brightest surfaces in the scene: lit from above by the sun.
  const roof = polygon(diamondPoints(top, footprintWidth, footprintDepth), sunlitColor(roofColor, "top"), 0.99, outline, hovered || selected ? 0.92 : activeStrokeAlpha);
  layer.addChild(roof);

  // Sun-facing upper-left roof edge catches a warm rim; the lower-right edge
  // falls away into shade — consistent with the wall shading below.
  const halfW = footprintWidth / 2;
  const halfD = footprintDepth / 2;
  const roofRim = new Graphics()
    .moveTo(top.x - halfW, top.y)
    .lineTo(top.x, top.y - halfD);
  roofRim.stroke({ color: 0xfff3d2, alpha: 0.55, width: 1.5, cap: "round", join: "round" });
  const roofFall = new Graphics()
    .moveTo(top.x, top.y - halfD)
    .lineTo(top.x + halfW, top.y);
  roofFall.stroke({ color: shadeColor(roofColor, -52), alpha: 0.4, width: 1.3, cap: "round", join: "round" });
  layer.addChild(roofRim, roofFall);

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
  lines.stroke({ color: shadeColor(roofColor, -44), alpha: 0.38, width: 1.5, cap: "round", join: "round" });
  layer.addChild(lines);
  drawRoofMaterial(layer, geometry, building);
  drawAuthoredRoofProfile(layer, geometry, building);
}

function drawAuthoredRoofProfile(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const profile = building.visualGrammar?.roofProfile;
  if (!profile) return;
  const { top, footprintWidth, footprintDepth, roofColor } = geometry;

  if (profile === "terracotta_barrel_tile" || profile === "cool_clay_tile" || profile === "sage_tile") {
    const tileTint = profile === "terracotta_barrel_tile" ? 0xc4764e : profile === "cool_clay_tile" ? 0x7f9aa8 : 0x8ba372;
    const tint = polygon(diamondPoints(top, footprintWidth * 0.94, footprintDepth * 0.86), tileTint, profile === "sage_tile" ? 0.12 : 0.1, tileTint, 0);
    const ridgeStart = { x: top.x - footprintWidth * 0.24, y: top.y - footprintDepth * 0.13 };
    const ridgeEnd = { x: top.x + footprintWidth * 0.24, y: top.y + footprintDepth * 0.13 };
    const barrelCaps = new Graphics();
    const capCount = profile === "terracotta_barrel_tile" ? 5 : 4;
    for (let cap = 0; cap < capCount; cap += 1) {
      const t = capCount > 1 ? cap / (capCount - 1) : 0.5;
      const x = ridgeStart.x + (ridgeEnd.x - ridgeStart.x) * t;
      const y = ridgeStart.y + (ridgeEnd.y - ridgeStart.y) * t;
      barrelCaps.moveTo(x, y - 1.8).lineTo(x, y + 1.8);
    }
    barrelCaps.stroke({
      color: shadeColor(roofColor, profile === "cool_clay_tile" ? 34 : 28),
      alpha: profile === "terracotta_barrel_tile" ? 0.42 : 0.32,
      width: profile === "terracotta_barrel_tile" ? 1.7 : 1.3,
      cap: "round",
    });
    layer.addChild(tint, barrelCaps);
    return;
  }

  if (profile === "flat_parapet_cap") {
    const capRing = new Graphics()
      .poly(diamondPoints(top, footprintWidth * 0.92, footprintDepth * 0.84), true)
      .stroke({ color: shadeColor(roofColor, 34), alpha: 0.4, width: 2, cap: "round", join: "round" });
    const gravelFlecks = new Graphics()
      .circle(top.x - footprintWidth * 0.16, top.y + footprintDepth * 0.04, 1.1)
      .circle(top.x + footprintWidth * 0.06, top.y - footprintDepth * 0.1, 1)
      .circle(top.x + footprintWidth * 0.2, top.y + footprintDepth * 0.08, 1.1)
      .fill({ color: shadeColor(roofColor, 22), alpha: 0.3 });
    layer.addChild(capRing, gravelFlecks);
    return;
  }

  if (profile === "blue_metal_utility") {
    const seams = new Graphics();
    for (let seam = -2; seam <= 2; seam += 1) {
      const offset = seam * footprintWidth * 0.13;
      seams
        .moveTo(top.x + offset - footprintWidth * 0.09, top.y - footprintDepth * 0.2)
        .lineTo(top.x + offset + footprintWidth * 0.09, top.y + footprintDepth * 0.2);
    }
    seams.stroke({ color: shadeColor(roofColor, -30), alpha: 0.3, width: 1.1, cap: "round" });
    const sheen = new Graphics()
      .moveTo(top.x - footprintWidth * 0.3, top.y - footprintDepth * 0.06)
      .lineTo(top.x + footprintWidth * 0.24, top.y + footprintDepth * 0.14);
    sheen.stroke({ color: shadeColor(roofColor, 42), alpha: 0.26, width: 1.7, cap: "round" });
    layer.addChild(seams, sheen);
    return;
  }

  if (profile === "civic_glass_cap") {
    const glassField = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.06 }, footprintWidth * 0.5, footprintDepth * 0.34), 0xbfe4ee, 0.22, 0x4e8298, 0.14);
    const specular = new Graphics()
      .moveTo(top.x - footprintWidth * 0.16, top.y - footprintDepth * 0.14)
      .lineTo(top.x + footprintWidth * 0.1, top.y + footprintDepth * 0.02);
    specular.stroke({ color: 0xeafaff, alpha: 0.4, width: 1.5, cap: "round" });
    layer.addChild(glassField, specular);
  }
}

function drawRoofMaterial(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, footprintWidth, footprintDepth, roofColor } = geometry;
  const roofShape = building.roofShape ?? "flat";
  const detail = new Graphics();
  const dark = shadeColor(roofColor, -38);
  const light = shadeColor(roofColor, 24);

  detail
    .moveTo(top.x - footprintWidth * 0.5, top.y)
    .lineTo(top.x, top.y + footprintDepth * 0.5)
    .lineTo(top.x + footprintWidth * 0.5, top.y)
    .stroke({ color: dark, alpha: 0.22, width: 2.2, cap: "round", join: "round" });

  if (roofShape === "gable") {
    detail
      .moveTo(top.x - footprintWidth * 0.36, top.y - footprintDepth * 0.02)
      .lineTo(top.x - footprintWidth * 0.12, top.y + footprintDepth * 0.1)
      .moveTo(top.x + footprintWidth * 0.1, top.y - footprintDepth * 0.08)
      .lineTo(top.x + footprintWidth * 0.34, top.y + footprintDepth * 0.04)
      .stroke({ color: light, alpha: 0.18, width: 1.2, cap: "round" });
  } else if (roofShape === "hip") {
    detail
      .poly(diamondPoints(top, footprintWidth * 0.72, footprintDepth * 0.66), true)
      .stroke({ color: dark, alpha: 0.16, width: 1.2 })
      .poly(diamondPoints(top, footprintWidth * 0.42, footprintDepth * 0.36), true)
      .stroke({ color: light, alpha: 0.16, width: 1.1 });
  } else if (roofShape === "flat") {
    detail
      .poly(diamondPoints(top, footprintWidth * 0.82, footprintDepth * 0.72), true)
      .stroke({ color: dark, alpha: 0.24, width: 1.4 })
      .poly(diamondPoints({ x: top.x + footprintWidth * 0.13, y: top.y - footprintDepth * 0.04 }, footprintWidth * 0.18, footprintDepth * 0.16), true)
      .fill({ color: light, alpha: 0.14 })
      .stroke({ color: dark, alpha: 0.14, width: 1 });
  }
  layer.addChild(detail);
  if (!isDraftBuilding(building)) drawSoCalRoofCourses(layer, geometry, building);
}

function drawSoCalRoofCourses(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
  const roofShape = building.roofShape ?? "flat";
  const style = building.facadeStyle ?? building.kind;
  const dark = shadeColor(roofColor, -36);
  const light = shadeColor(roofColor, 26);

  if (building.kind === "home" && (roofShape === "gable" || roofShape === "hip")) {
    const courses = new Graphics();
    const courseCount = style === "ranch" ? 4 : 3;
    for (let course = 1; course <= courseCount; course += 1) {
      const yOffset = -footprintDepth * 0.22 + course * (footprintDepth * 0.12);
      courses
        .moveTo(top.x - footprintWidth * 0.38, top.y + yOffset)
        .lineTo(top.x - footprintWidth * 0.04, top.y + yOffset + footprintDepth * 0.16)
        .lineTo(top.x + footprintWidth * 0.36, top.y + yOffset - footprintDepth * 0.02);
    }
    courses.stroke({ color: dark, alpha: style === "ranch" ? 0.17 : 0.14, width: 0.9, cap: "round", join: "round" });

    const eaveLip = new Graphics()
      .moveTo(top.x - footprintWidth * 0.5, top.y + footprintDepth * 0.02)
      .lineTo(top.x, top.y + footprintDepth * 0.31)
      .lineTo(top.x + footprintWidth * 0.5, top.y + footprintDepth * 0.02);
    eaveLip.stroke({ color: shadeColor(roofColor, -50), alpha: style === "ranch" ? 0.26 : 0.22, width: style === "ranch" ? 2.2 : 1.8, cap: "round", join: "round" });
    layer.addChild(courses, eaveLip);
    return;
  }

  if (roofShape === "flat" || style === "rowhome" || style === "strip_store") {
    const parapet = new Graphics()
      .moveTo(top.x - footprintWidth * 0.46, top.y - footprintDepth * 0.03)
      .lineTo(top.x - footprintWidth * 0.13, top.y + footprintDepth * 0.12)
      .lineTo(top.x + footprintWidth * 0.16, top.y - footprintDepth * 0.01)
      .lineTo(top.x + footprintWidth * 0.46, top.y + footprintDepth * 0.13);
    parapet.stroke({ color: dark, alpha: building.kind === "shop" ? 0.22 : 0.18, width: building.kind === "shop" ? 1.8 : 1.4, cap: "round", join: "round" });

    const roofPads = new Graphics();
    const padCount = building.kind === "apartment" ? 3 : building.kind === "shop" ? 4 : 2;
    for (let pad = 0; pad < padCount; pad += 1) {
      const position = pad / (padCount - 1);
      const x = top.x - footprintWidth * 0.28 + position * footprintWidth * 0.56;
      const y = top.y - footprintDepth * 0.12 + (pad % 2) * footprintDepth * 0.1;
      roofPads
        .poly(diamondPoints({ x, y }, footprintWidth * 0.08, footprintDepth * 0.07), true)
        .fill({ color: pad % 2 === 0 ? light : dark, alpha: pad % 2 === 0 ? 0.11 : 0.08 });
    }
    roofPads.stroke({ color: trimColor, alpha: 0.05, width: 0.8 });
    layer.addChild(parapet, roofPads);
  }
}

function drawWallDepthLines(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  if (building.kind !== "home" && building.kind !== "shop" && building.kind !== "civic") return;
  const { top, bottom, footprintWidth, footprintDepth, trimColor } = geometry;
  const lineAlpha = building.kind === "civic" ? 0.18 : 0.14;
  const ribs = new Graphics();
  const count = building.facadeStyle === "rowhome" || building.facadeStyle === "strip_store" ? 4 : 2;
  for (let index = 1; index <= count; index += 1) {
    const offset = (index / (count + 1) - 0.5) * footprintWidth * 0.72;
    ribs
      .moveTo(top.x + offset, top.y + footprintDepth * 0.12)
      .lineTo(bottom.x + offset * 0.7, bottom.y - footprintDepth * 0.08);
  }
  ribs.stroke({ color: trimColor, alpha: lineAlpha, width: 1, cap: "round" });
  layer.addChild(ribs);
}

function drawHomeDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, bodyColor, highlightColor, trimColor, accentColor } = geometry;
  const style = building.facadeStyle ?? "cottage";
  const foundation = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.34, bottom.y + footprintDepth * 0.16)
    .lineTo(bottom.x, bottom.y + footprintDepth * 0.32)
    .lineTo(bottom.x + footprintWidth * 0.34, bottom.y + footprintDepth * 0.16)
    .lineTo(bottom.x + footprintWidth * 0.26, bottom.y + footprintDepth * 0.24)
    .lineTo(bottom.x, bottom.y + footprintDepth * 0.38)
    .lineTo(bottom.x - footprintWidth * 0.26, bottom.y + footprintDepth * 0.24)
    .closePath()
    .fill({ color: 0xe7d0a2, alpha: style === "rowhome" ? 0.46 : 0.34 })
    .stroke({ color: 0x7f6d4e, alpha: 0.18, width: 1 });
  layer.addChild(foundation);
  drawResidentialMaterialBands(layer, geometry, style);
  drawResidentialAuthorshipVariation(layer, geometry, building, style);

  if (style === "cottage") {
    const roofLip = new Graphics()
      .moveTo(top.x - footprintWidth * 0.5, top.y + footprintDepth * 0.01)
      .lineTo(top.x, top.y + footprintDepth * 0.31)
      .lineTo(top.x + footprintWidth * 0.5, top.y + footprintDepth * 0.01)
      .lineTo(top.x + footprintWidth * 0.45, top.y + footprintDepth * 0.08)
      .lineTo(top.x, top.y + footprintDepth * 0.37)
      .lineTo(top.x - footprintWidth * 0.45, top.y + footprintDepth * 0.08)
      .closePath()
      .fill({ color: shadeColor(roofColor, -30), alpha: 0.18 });
    const gableFace = polygon(
      [
        top.x - footprintWidth * 0.22,
        top.y + footprintDepth * 0.07,
        top.x,
        top.y + footprintDepth * 0.27,
        top.x + footprintWidth * 0.22,
        top.y + footprintDepth * 0.07,
        top.x,
        top.y + footprintDepth * 0.02,
      ],
      shadeColor(bodyColor, 10),
      0.62,
      shadeColor(roofColor, -42),
      0.22,
    );
    const porchShadow = new Graphics()
      .ellipse(bottom.x - footprintWidth * 0.12, bottom.y + footprintDepth * 0.32, footprintWidth * 0.16, 5)
      .fill({ color: 0x2d423b, alpha: 0.16 });
    const porch = polygon(diamondPoints({ x: bottom.x - footprintWidth * 0.12, y: bottom.y + footprintDepth * 0.27 }, footprintWidth * 0.28, 11), 0xf6e6bd, 0.88, 0x7f6d4e, 0.28);
    const porchLip = new Graphics()
      .moveTo(bottom.x - footprintWidth * 0.26, bottom.y + footprintDepth * 0.27)
      .lineTo(bottom.x - footprintWidth * 0.12, bottom.y + footprintDepth * 0.33)
      .lineTo(bottom.x + footprintWidth * 0.02, bottom.y + footprintDepth * 0.27)
      .stroke({ color: 0x8b7954, alpha: 0.32, width: 1.2, cap: "round", join: "round" });
    const eave = new Graphics()
      .moveTo(top.x - footprintWidth * 0.46, top.y + footprintDepth * 0.04)
      .lineTo(top.x, top.y + footprintDepth * 0.34)
      .lineTo(top.x + footprintWidth * 0.46, top.y + footprintDepth * 0.04)
      .moveTo(top.x - footprintWidth * 0.15, top.y - footprintDepth * 0.08)
      .lineTo(top.x + footprintWidth * 0.16, top.y + footprintDepth * 0.09)
      .stroke({ color: shadeColor(roofColor, -34), alpha: 0.34, width: 2, cap: "round", join: "round" });
    const trim = new Graphics()
      .roundRect(top.x - footprintWidth * 0.17, bottom.y - footprintDepth * 0.052, footprintWidth * 0.13, 12, 2)
      .fill({ color: trimColor, alpha: 0.9 })
      .roundRect(top.x - footprintWidth * 0.185, bottom.y - footprintDepth * 0.062, footprintWidth * 0.16, 3, 1.5)
      .fill({ color: shadeColor(trimColor, 26), alpha: 0.66 })
      .roundRect(top.x + footprintWidth * 0.06, bottom.y - footprintDepth * 0.12, footprintWidth * 0.13, 7, 2)
      .fill({ color: highlightColor, alpha: 0.86 })
      .roundRect(top.x + footprintWidth * 0.053, bottom.y - footprintDepth * 0.128, footprintWidth * 0.145, 9, 2)
      .stroke({ color: trimColor, alpha: 0.22, width: 1 })
      .roundRect(top.x - footprintWidth * 0.36, bottom.y - footprintDepth * 0.14, footprintWidth * 0.12, 7, 2)
      .fill({ color: highlightColor, alpha: 0.76 })
      .roundRect(top.x - footprintWidth * 0.367, bottom.y - footprintDepth * 0.148, footprintWidth * 0.135, 9, 2)
      .stroke({ color: trimColor, alpha: 0.2, width: 1 })
      .rect(top.x + footprintWidth * 0.24, top.y - footprintDepth * 0.17, 5, 10)
      .fill({ color: shadeColor(roofColor, -48), alpha: 0.88 })
      .stroke({ color: 0x26332c, alpha: 0.26, width: 1 });
    const sideRecess = new Graphics()
      .roundRect(top.x + footprintWidth * 0.27, bottom.y - footprintDepth * 0.02, footprintWidth * 0.1, 5, 1.4)
      .fill({ color: shadeColor(bodyColor, -18), alpha: 0.28 });
    layer.addChild(roofLip, gableFace, porchShadow, porch, porchLip, eave, trim, sideRecess);
  } else if (style === "ranch") {
    const hipInset = polygon(diamondPoints({ x: top.x, y: top.y + footprintDepth * 0.01 }, footprintWidth * 0.72, footprintDepth * 0.48), shadeColor(roofColor, 18), 0.22, shadeColor(roofColor, -36), 0.16);
    const lowEave = new Graphics()
      .moveTo(top.x - footprintWidth * 0.48, top.y + footprintDepth * 0.08)
      .lineTo(top.x, top.y + footprintDepth * 0.34)
      .lineTo(top.x + footprintWidth * 0.48, top.y + footprintDepth * 0.08)
      .moveTo(top.x - footprintWidth * 0.32, top.y - footprintDepth * 0.03)
      .lineTo(top.x + footprintWidth * 0.32, top.y + footprintDepth * 0.24)
      .stroke({ color: shadeColor(roofColor, -38), alpha: 0.36, width: 2.4, cap: "round", join: "round" });
    const longWindows = new Graphics()
      .roundRect(top.x - footprintWidth * 0.41, bottom.y - footprintDepth * 0.09, footprintWidth * 0.2, 6, 1.5)
      .roundRect(top.x - footprintWidth * 0.12, bottom.y - footprintDepth * 0.1, footprintWidth * 0.18, 6, 1.5)
      .roundRect(top.x + footprintWidth * 0.18, bottom.y - footprintDepth * 0.1, footprintWidth * 0.2, 6, 1.5)
      .fill({ color: highlightColor, alpha: 0.72 })
      .stroke({ color: trimColor, alpha: 0.28, width: 1 });
    const sideWing = polygon(
      diamondPoints({ x: bottom.x + footprintWidth * 0.2, y: bottom.y + footprintDepth * 0.15 }, footprintWidth * 0.34, footprintDepth * 0.18),
      shadeColor(bodyColor, -8),
      0.34,
      trimColor,
      0.12,
    );
    const wingFace = new Graphics()
      .roundRect(bottom.x + footprintWidth * 0.18, bottom.y + footprintDepth * 0.09, footprintWidth * 0.17, 7, 1.2)
      .fill({ color: shadeColor(bodyColor, -24), alpha: 0.3 });
    const stoop = polygon(diamondPoints({ x: bottom.x + footprintWidth * 0.05, y: bottom.y + footprintDepth * 0.28 }, footprintWidth * 0.22, 8), 0xe9d3a5, 0.64, 0x7f6d4e, 0.2);
    const step = polygon(diamondPoints({ x: bottom.x + footprintWidth * 0.05, y: bottom.y + footprintDepth * 0.34 }, footprintWidth * 0.16, 6), 0xd7bd8a, 0.5, 0x7f6d4e, 0.16);
    const door = new Graphics()
      .roundRect(top.x - footprintWidth * 0.02, bottom.y - footprintDepth * 0.035, footprintWidth * 0.08, 10, 1.5)
      .fill({ color: trimColor, alpha: 0.82 })
      .roundRect(top.x + footprintWidth * 0.07, bottom.y - footprintDepth * 0.18, footprintWidth * 0.14, 5, 1.2)
      .fill({ color: highlightColor, alpha: 0.62 })
      .stroke({ color: 0x26332c, alpha: 0.2, width: 1 });
    layer.addChild(hipInset, sideWing, wingFace, lowEave, longWindows, stoop, step, door);
  } else if (style === "rowhome") {
    const parapet = new Graphics();
    for (let unit = -1; unit <= 1; unit += 1) {
      const centerX = top.x + unit * footprintWidth * 0.22;
      parapet
        .roundRect(centerX - footprintWidth * 0.1, top.y - footprintDepth * 0.16 + (unit === 0 ? -2 : 0), footprintWidth * 0.18, 7, 1.5)
        .fill({ color: shadeColor(roofColor, unit === 0 ? 16 : 4), alpha: 0.5 });
    }
    const units = new Graphics();
    for (let unit = -1; unit <= 1; unit += 1) {
      const centerX = top.x + unit * footprintWidth * 0.22;
      units
        .roundRect(centerX - footprintWidth * 0.075, bottom.y + footprintDepth * 0.08, footprintWidth * 0.13, 5, 1.2)
        .fill({ color: 0xe7d0a2, alpha: 0.64 })
        .roundRect(centerX - footprintWidth * 0.045, bottom.y - footprintDepth * 0.03, footprintWidth * 0.08, 11, 1.5)
        .fill({ color: accentColor, alpha: 0.62 })
        .roundRect(centerX - footprintWidth * 0.06, bottom.y - footprintDepth * 0.17, footprintWidth * 0.11, 6, 1.5)
        .fill({ color: highlightColor, alpha: 0.72 })
        .roundRect(centerX - footprintWidth * 0.055, bottom.y - footprintDepth * 0.25, footprintWidth * 0.1, 5, 1.5)
        .fill({ color: highlightColor, alpha: 0.5 })
        .moveTo(centerX + footprintWidth * 0.09, top.y + footprintDepth * 0.13)
        .lineTo(centerX + footprintWidth * 0.09, bottom.y + footprintDepth * 0.05);
    }
    units.stroke({ color: trimColor, alpha: 0.24, width: 1 });
    layer.addChild(parapet, units);
  }
}

function drawResidentialAuthorshipVariation(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, style: CityWorldBuilding["facadeStyle"]) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, bodyColor, highlightColor, trimColor } = geometry;
  const variant = objectVariant(building.id, 4);
  const accentShift = variant % 2 === 0 ? shadeColor(bodyColor, 22) : shadeColor(roofColor, 18);

  if (style === "cottage") {
    const gableOffset = variant === 1 ? -footprintWidth * 0.18 : variant === 2 ? footprintWidth * 0.16 : 0;
    const dormer = polygon(
      diamondPoints({ x: top.x + gableOffset, y: top.y - footprintDepth * 0.09 }, footprintWidth * 0.18, footprintDepth * 0.13),
      shadeColor(roofColor, variant === 3 ? 18 : 8),
      0.42,
      trimColor,
      0.14,
    );
    const dormerFace = new Graphics()
      .roundRect(top.x + gableOffset - footprintWidth * 0.035, top.y - footprintDepth * 0.08, footprintWidth * 0.07, 7, 1.5)
      .fill({ color: highlightColor, alpha: 0.56 })
      .stroke({ color: trimColor, alpha: 0.18, width: 0.8 });
    layer.addChild(dormer, dormerFace);
    return;
  }

  if (style === "ranch") {
    const porchSide = variant < 2 ? -1 : 1;
    const sideEntry = polygon(
      diamondPoints({ x: bottom.x + porchSide * footprintWidth * 0.25, y: bottom.y + footprintDepth * 0.26 }, footprintWidth * 0.24, footprintDepth * 0.1),
      0xe9d3a5,
      0.42,
      0x7f6d4e,
      0.16,
    );
    const garageFace = new Graphics()
      .roundRect(top.x - porchSide * footprintWidth * 0.34, bottom.y - footprintDepth * 0.06, footprintWidth * 0.18, 9, 1.5)
      .fill({ color: accentShift, alpha: 0.26 })
      .moveTo(top.x - porchSide * footprintWidth * 0.33, bottom.y - footprintDepth * 0.02)
      .lineTo(top.x - porchSide * footprintWidth * 0.18, bottom.y - footprintDepth * 0.02);
    garageFace.stroke({ color: trimColor, alpha: 0.18, width: 1, cap: "round" });
    layer.addChild(sideEntry, garageFace);
  }
}

function drawResidentialMaterialBands(layer: Container, geometry: BuildingGeometry, style: CityWorldBuilding["facadeStyle"]) {
  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, highlightColor, trimColor } = geometry;
  const materialAlpha = style === "ranch" ? 0.3 : style === "rowhome" ? 0.22 : 0.26;
  const lowerShadow = new Graphics()
    .moveTo(top.x - footprintWidth * 0.44, bottom.y - footprintDepth * 0.01)
    .lineTo(top.x - footprintWidth * 0.17, bottom.y + footprintDepth * 0.11)
    .lineTo(top.x + footprintWidth * 0.12, bottom.y + footprintDepth * 0.01)
    .moveTo(top.x + footprintWidth * 0.44, bottom.y - footprintDepth * 0.02)
    .lineTo(top.x + footprintWidth * 0.16, bottom.y + footprintDepth * 0.11)
    .lineTo(top.x - footprintWidth * 0.1, bottom.y + footprintDepth * 0.02);
  lowerShadow.stroke({ color: shadeColor(bodyColor, -28), alpha: materialAlpha, width: 1.3, cap: "round", join: "round" });

  const trimBand = new Graphics()
    .moveTo(top.x - footprintWidth * 0.38, bottom.y - footprintDepth * 0.21)
    .lineTo(top.x - footprintWidth * 0.08, bottom.y - footprintDepth * 0.08)
    .moveTo(top.x + footprintWidth * 0.38, bottom.y - footprintDepth * 0.2)
    .lineTo(top.x + footprintWidth * 0.08, bottom.y - footprintDepth * 0.08);
  trimBand.stroke({ color: shadeColor(bodyColor, 26), alpha: style === "ranch" ? 0.24 : 0.2, width: 1.2, cap: "round", join: "round" });

  const sillColor = shadeColor(trimColor, 16);
  const sills = new Graphics();
  const windowCount = style === "ranch" ? 4 : style === "rowhome" ? 3 : 2;
  for (let index = 0; index < windowCount; index += 1) {
    const position = index / (windowCount - 1);
    const x = top.x - footprintWidth * 0.32 + position * footprintWidth * 0.64;
    const y = bottom.y - footprintDepth * (style === "ranch" ? 0.17 : 0.2) + (index % 2) * 2;
    sills
      .roundRect(x - footprintWidth * 0.035, y + 6, footprintWidth * 0.08, 3.2, 1.5)
      .fill({ color: sillColor, alpha: 0.34 })
      .roundRect(x - footprintWidth * 0.032, y - 1, footprintWidth * 0.074, 6, 1.5)
      .stroke({ color: shadeColor(bodyColor, -34), alpha: 0.14, width: 1 });
  }

  const eaveShadow = new Graphics()
    .moveTo(top.x - footprintWidth * 0.46, top.y + footprintDepth * 0.05)
    .lineTo(top.x, top.y + footprintDepth * 0.3)
    .lineTo(top.x + footprintWidth * 0.46, top.y + footprintDepth * 0.05);
  eaveShadow.stroke({ color: shadeColor(roofColor, -48), alpha: style === "rowhome" ? 0.14 : 0.24, width: 1.8, cap: "round", join: "round" });

  const sideFacet = polygon(
    diamondPoints({ x: bottom.x + footprintWidth * 0.22, y: bottom.y - footprintDepth * 0.08 }, footprintWidth * 0.16, footprintDepth * 0.14),
    shadeColor(bodyColor, -14),
    style === "ranch" ? 0.16 : 0.12,
    0xffffff,
    0,
  );
  layer.addChild(sideFacet, lowerShadow, trimBand, sills, eaveShadow);
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
  const { top, bottom, footprintWidth, footprintDepth, roofColor, bodyColor, highlightColor, trimColor } = geometry;
  const baseApron = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.26 }, footprintWidth * 0.66, footprintDepth * 0.22), 0xe6d4b0, 0.36, 0x7f6d4e, 0.12);
  const roofInset = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.02 }, footprintWidth * 0.74, footprintDepth * 0.48), shadeColor(roofColor, 18), 0.24, trimColor, 0.14);
  const sidePanels = new Graphics();
  for (let panel = -2; panel <= 2; panel += 1) {
    sidePanels
      .roundRect(top.x + panel * (footprintWidth * 0.13) - 5, bottom.y - footprintDepth * 0.06, 10, 17, 2)
      .fill({ color: shadeColor(bodyColor, panel % 2 === 0 ? -18 : -8), alpha: 0.24 });
  }
  layer.addChild(baseApron, roofInset, sidePanels);

  const details = new Graphics()
    .roundRect(top.x - footprintWidth * 0.3, top.y + footprintDepth * 0.22, footprintWidth * 0.6, 10, 3)
    .fill({ color: highlightColor, alpha: 0.88 })
    .stroke({ color: roofColor, alpha: 0.78, width: 2 })
    .roundRect(top.x - footprintWidth * 0.28, bottom.y - footprintDepth * 0.18, footprintWidth * 0.2, 15, 2)
    .fill({ color: 0xa9d7e6, alpha: 0.76 })
    .roundRect(top.x + footprintWidth * 0.08, bottom.y - footprintDepth * 0.16, footprintWidth * 0.22, 12, 2)
    .fill({ color: 0xa9d7e6, alpha: 0.72 });
  layer.addChild(details);

  const signBand = new Graphics()
    .roundRect(top.x - footprintWidth * 0.2, top.y + footprintDepth * 0.25, footprintWidth * 0.4, 7, 2)
    .fill({ color: roofColor, alpha: 0.62 })
    .roundRect(top.x - footprintWidth * 0.1, bottom.y - footprintDepth * 0.29, footprintWidth * 0.2, 7, 2)
    .fill({ color: shadeColor(roofColor, 22), alpha: 0.42 })
    .stroke({ color: 0x26332c, alpha: 0.24, width: 1 });
  layer.addChild(signBand);

  const stripe = new Graphics()
    .moveTo(top.x - footprintWidth * 0.36, top.y - footprintDepth * 0.04)
    .lineTo(top.x + footprintWidth * 0.36, top.y + footprintDepth * 0.26);
  stripe.stroke({ color: 0xffffff, alpha: 0.32, width: 2, cap: "round" });
  layer.addChild(stripe);

  const entryPad = new Graphics()
    .moveTo(top.x - footprintWidth * 0.24, bottom.y + footprintDepth * 0.04)
    .lineTo(top.x, bottom.y + footprintDepth * 0.17)
    .lineTo(top.x + footprintWidth * 0.24, bottom.y + footprintDepth * 0.04)
    .lineTo(top.x + footprintWidth * 0.18, bottom.y + footprintDepth * 0.1)
    .lineTo(top.x, bottom.y + footprintDepth * 0.21)
    .lineTo(top.x - footprintWidth * 0.18, bottom.y + footprintDepth * 0.1)
    .closePath()
    .fill({ color: 0xdcc396, alpha: 0.46 })
    .stroke({ color: 0x7f6d4e, alpha: 0.18, width: 1 });
  layer.addChild(entryPad);

  const serviceWing = polygon(
    diamondPoints({ x: bottom.x + footprintWidth * 0.28, y: bottom.y + footprintDepth * 0.16 }, footprintWidth * 0.26, footprintDepth * 0.18),
    shadeColor(bodyColor, -12),
    0.3,
    trimColor,
    0.12,
  );
  const roofSaw = new Graphics();
  for (let tooth = -2; tooth <= 2; tooth += 1) {
    roofSaw
      .moveTo(top.x + tooth * (footprintWidth * 0.12) - footprintWidth * 0.04, top.y - footprintDepth * 0.18)
      .lineTo(top.x + tooth * (footprintWidth * 0.12) + footprintWidth * 0.05, top.y - footprintDepth * 0.08)
      .lineTo(top.x + tooth * (footprintWidth * 0.12) + footprintWidth * 0.13, top.y - footprintDepth * 0.16);
  }
  roofSaw.stroke({ color: shadeColor(roofColor, -36), alpha: 0.3, width: 1.8, cap: "round", join: "round" });
  const rollupBay = new Graphics()
    .roundRect(top.x + footprintWidth * 0.22, bottom.y - footprintDepth * 0.04, footprintWidth * 0.16, 14, 2)
    .fill({ color: shadeColor(bodyColor, -28), alpha: 0.26 })
    .roundRect(top.x + footprintWidth * 0.235, bottom.y - footprintDepth * 0.0, footprintWidth * 0.13, 3, 1.2)
    .fill({ color: highlightColor, alpha: 0.34 });
  layer.addChild(serviceWing, roofSaw, rollupBay);
}

function drawApartmentDetails(layer: Container, geometry: BuildingGeometry) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, bodyColor, highlightColor, trimColor } = geometry;
  const roofCap = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.06 }, footprintWidth * 0.68, footprintDepth * 0.46), shadeColor(roofColor, 16), 0.48, trimColor, 0.16);
  const stairCore = polygon(
    diamondPoints({ x: top.x - footprintWidth * 0.27, y: top.y + footprintDepth * 0.12 }, footprintWidth * 0.22, footprintDepth * 0.22),
    shadeColor(bodyColor, -10),
    0.42,
    trimColor,
    0.14,
  );
  layer.addChild(roofCap, stairCore);

  const steppedWing = polygon(
    diamondPoints({ x: top.x + footprintWidth * 0.25, y: top.y + footprintDepth * 0.15 }, footprintWidth * 0.24, footprintDepth * 0.28),
    shadeColor(bodyColor, -8),
    0.34,
    trimColor,
    0.12,
  );
  const wingCap = polygon(
    diamondPoints({ x: top.x + footprintWidth * 0.25, y: top.y + footprintDepth * 0.08 }, footprintWidth * 0.2, footprintDepth * 0.18),
    shadeColor(roofColor, 18),
    0.38,
    trimColor,
    0.12,
  );
  layer.addChild(steppedWing, wingCap);

  const windows = new Graphics();
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const x = top.x - footprintWidth * 0.28 + col * (footprintWidth * 0.19);
      const y = top.y + footprintDepth * 0.22 + row * 9;
      windows
        .roundRect(x - 1, y - 1, 9, 7, 1.5)
        .fill({ color: shadeColor(bodyColor, -34), alpha: 0.22 })
        .roundRect(x, y, 7, 5, 1.5)
        .fill({ color: row % 2 === 0 ? 0xfff4bd : 0xdaf2ff, alpha: 0.82 });
    }
  }
  windows.stroke({ color: 0x26332c, alpha: 0.2, width: 0.8 });
  layer.addChild(windows);

  const balconies = new Graphics();
  for (let row = 1; row <= 2; row += 1) {
    balconies
      .moveTo(top.x - footprintWidth * 0.34, top.y + footprintDepth * 0.25 + row * 12)
      .lineTo(top.x + footprintWidth * 0.24, top.y + footprintDepth * 0.25 + row * 12);
  }
  balconies.stroke({ color: trimColor, alpha: 0.2, width: 2, cap: "round" });
  layer.addChild(balconies);

  const entry = new Graphics()
    .roundRect(top.x - footprintWidth * 0.08, bottom.y - footprintDepth * 0.05, footprintWidth * 0.16, 15, 2)
    .fill({ color: shadeColor(roofColor, -24), alpha: 0.5 })
    .roundRect(top.x - footprintWidth * 0.16, bottom.y - footprintDepth * 0.1, footprintWidth * 0.32, 5, 1.5)
    .fill({ color: shadeColor(roofColor, 18), alpha: 0.48 });
  layer.addChild(entry);

  const courtyard = polygon(diamondPoints({ x: bottom.x + footprintWidth * 0.12, y: bottom.y + footprintDepth * 0.38 }, footprintWidth * 0.34, 12), 0x7ec36d, 0.5, 0x477f43, 0.18);
  layer.addChild(courtyard);

  const verticalCores = new Graphics();
  for (let core = -1; core <= 1; core += 2) {
    verticalCores
      .roundRect(top.x + core * footprintWidth * 0.28 - 4, bottom.y - footprintDepth * 0.28, 8, 42, 2)
      .fill({ color: shadeColor(bodyColor, core < 0 ? -16 : 12), alpha: 0.2 })
      .moveTo(top.x + core * footprintWidth * 0.28, bottom.y - footprintDepth * 0.28)
      .lineTo(top.x + core * footprintWidth * 0.28, bottom.y + footprintDepth * 0.1);
  }
  verticalCores.stroke({ color: trimColor, alpha: 0.16, width: 1.1, cap: "round" });
  const roofTerraces = new Graphics()
    .poly(diamondPoints({ x: top.x - footprintWidth * 0.16, y: top.y - footprintDepth * 0.14 }, footprintWidth * 0.18, footprintDepth * 0.12), true)
    .fill({ color: shadeColor(roofColor, 28), alpha: 0.22 })
    .poly(diamondPoints({ x: top.x + footprintWidth * 0.18, y: top.y - footprintDepth * 0.02 }, footprintWidth * 0.2, footprintDepth * 0.13), true)
    .fill({ color: shadeColor(roofColor, -10), alpha: 0.16 });
  layer.addChild(verticalCores, roofTerraces);
}

function drawCivicDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, accentColor, trimColor } = geometry;
  const roofTier = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.04 }, footprintWidth * 0.72, footprintDepth * 0.58), shadeColor(roofColor, 16), 0.56, trimColor, 0.2);
  const roofCap = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.18 }, footprintWidth * 0.42, footprintDepth * 0.34), shadeColor(roofColor, 28), 0.78, trimColor, 0.24);
  const skylight = polygon(diamondPoints({ x: top.x + footprintWidth * 0.12, y: top.y - footprintDepth * 0.16 }, footprintWidth * 0.16, footprintDepth * 0.12), 0xdaf2ff, 0.5, trimColor, 0.12);
  const roofShadow = polygon(diamondPoints({ x: top.x, y: top.y + footprintDepth * 0.06 }, footprintWidth * 0.78, footprintDepth * 0.48), shadeColor(roofColor, -18), 0.2, trimColor, 0);
  const roofFacetLeft = polygon(diamondPoints({ x: top.x - footprintWidth * 0.22, y: top.y - footprintDepth * 0.04 }, footprintWidth * 0.22, footprintDepth * 0.18), shadeColor(roofColor, 30), 0.28, trimColor, 0.08);
  const roofFacetRight = polygon(diamondPoints({ x: top.x + footprintWidth * 0.22, y: top.y + footprintDepth * 0.02 }, footprintWidth * 0.22, footprintDepth * 0.18), shadeColor(roofColor, -8), 0.22, trimColor, 0.08);
  const roofRidge = new Graphics()
    .moveTo(top.x - footprintWidth * 0.25, top.y - footprintDepth * 0.19)
    .lineTo(top.x, top.y - footprintDepth * 0.29)
    .lineTo(top.x + footprintWidth * 0.25, top.y - footprintDepth * 0.19);
  roofRidge.stroke({ color: 0xe7f4f0, alpha: 0.3, width: 1.4, cap: "round", join: "round" });
  layer.addChild(roofShadow, roofTier, roofFacetLeft, roofFacetRight, roofCap, skylight, roofRidge);

  const plinth = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.16 }, footprintWidth * 0.72, footprintDepth * 0.24), 0xe6cf9f, 0.36, 0x7f6d4e, 0.12);
  const sideTerraceLeft = polygon(diamondPoints({ x: bottom.x - footprintWidth * 0.31, y: bottom.y + footprintDepth * 0.22 }, footprintWidth * 0.22, footprintDepth * 0.15), 0xd8c08d, 0.4, 0x7f6d4e, 0.14);
  const sideTerraceRight = polygon(diamondPoints({ x: bottom.x + footprintWidth * 0.31, y: bottom.y + footprintDepth * 0.2 }, footprintWidth * 0.22, footprintDepth * 0.15), 0xd8c08d, 0.36, 0x7f6d4e, 0.12);
  const frontSteps = new Graphics()
    .moveTo(top.x - footprintWidth * 0.28, bottom.y + footprintDepth * 0.08)
    .lineTo(top.x, bottom.y + footprintDepth * 0.22)
    .lineTo(top.x + footprintWidth * 0.28, bottom.y + footprintDepth * 0.08)
    .lineTo(top.x + footprintWidth * 0.2, bottom.y + footprintDepth * 0.16)
    .lineTo(top.x, bottom.y + footprintDepth * 0.28)
    .lineTo(top.x - footprintWidth * 0.2, bottom.y + footprintDepth * 0.16)
    .closePath()
    .fill({ color: 0xe7d0a2, alpha: 0.76 })
    .stroke({ color: 0x7f6d4e, alpha: 0.24, width: 1.2 });
  const entryBlock = new Graphics()
    .roundRect(top.x - footprintWidth * 0.18, bottom.y - footprintDepth * 0.31, footprintWidth * 0.36, 22, 3)
    .fill({ color: 0xf8e8ca, alpha: 0.84 })
    .roundRect(top.x - footprintWidth * 0.08, bottom.y - footprintDepth * 0.2, footprintWidth * 0.16, 15, 3)
    .fill({ color: 0x5d8fa8, alpha: 0.78 })
    .stroke({ color: trimColor, alpha: 0.28, width: 1.1 });
  const entryCanopy = polygon(diamondPoints({ x: top.x, y: bottom.y - footprintDepth * 0.34 }, footprintWidth * 0.46, footprintDepth * 0.16), shadeColor(roofColor, 20), 0.64, trimColor, 0.2);
  const columns = new Graphics();
  for (let col = -2; col <= 2; col += 1) {
    columns
      .roundRect(top.x + col * (footprintWidth * 0.115) - 2.4, bottom.y - footprintDepth * 0.34, 4.8, 23, 1.5)
      .fill({ color: highlightColor, alpha: 0.95 });
  }
  columns
    .roundRect(top.x - footprintWidth * 0.3, bottom.y - footprintDepth * 0.41, footprintWidth * 0.6, 7, 2)
    .fill({ color: highlightColor, alpha: 0.94 })
    .circle(top.x, top.y - 20, 7)
    .fill({ color: roofColor, alpha: 0.96 })
    .stroke({ color: 0x26332c, alpha: 0.32, width: 1 });
  const sideWindows = new Graphics();
  for (let col = -1; col <= 1; col += 1) {
    sideWindows
      .roundRect(top.x - footprintWidth * 0.36 + col * (footprintWidth * 0.11), bottom.y - footprintDepth * 0.08, 7, 7, 1.5)
      .roundRect(top.x + footprintWidth * 0.23 + col * (footprintWidth * 0.08), bottom.y - footprintDepth * 0.13, 6, 7, 1.5);
  }
  sideWindows.fill({ color: 0xfff4bd, alpha: 0.68 }).stroke({ color: trimColor, alpha: 0.18, width: 0.8 });
  const facadeRhythm = new Graphics()
    .moveTo(top.x - footprintWidth * 0.42, bottom.y - footprintDepth * 0.22)
    .lineTo(top.x - footprintWidth * 0.3, bottom.y - footprintDepth * 0.13)
    .moveTo(top.x + footprintWidth * 0.42, bottom.y - footprintDepth * 0.22)
    .lineTo(top.x + footprintWidth * 0.3, bottom.y - footprintDepth * 0.13)
    .moveTo(top.x - footprintWidth * 0.34, bottom.y + footprintDepth * 0.02)
    .lineTo(top.x - footprintWidth * 0.12, bottom.y + footprintDepth * 0.14)
    .moveTo(top.x + footprintWidth * 0.34, bottom.y + footprintDepth * 0.02)
    .lineTo(top.x + footprintWidth * 0.12, bottom.y + footprintDepth * 0.14);
  facadeRhythm.stroke({ color: trimColor, alpha: 0.16, width: 1.1, cap: "round", join: "round" });
  const baseRibs = new Graphics()
    .moveTo(top.x - footprintWidth * 0.48, bottom.y - footprintDepth * 0.02)
    .lineTo(top.x - footprintWidth * 0.31, bottom.y + footprintDepth * 0.08)
    .moveTo(top.x + footprintWidth * 0.48, bottom.y - footprintDepth * 0.02)
    .lineTo(top.x + footprintWidth * 0.31, bottom.y + footprintDepth * 0.08);
  baseRibs.stroke({ color: trimColor, alpha: 0.14, width: 1.2, cap: "round", join: "round" });
  layer.addChild(sideTerraceLeft, sideTerraceRight, plinth, frontSteps, entryBlock, entryCanopy, columns, sideWindows, facadeRhythm, baseRibs);

  const flag = new Graphics()
    .rect(top.x + footprintWidth * 0.08, top.y - 34, 2, 17)
    .fill({ color: 0x46564f, alpha: 0.86 })
    .poly([top.x + footprintWidth * 0.1, top.y - 34, top.x + footprintWidth * 0.28, top.y - 29, top.x + footprintWidth * 0.1, top.y - 25], true)
    .fill({ color: accentColor, alpha: 0.92 });
  layer.addChild(flag);

  if (building.id === "building-civic") drawEastvaleCoreLandmarkDetails(layer, geometry);
}

function drawEastvaleCoreLandmarkDetails(layer: Container, geometry: BuildingGeometry) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, trimColor } = geometry;
  const entryGlass = new Graphics()
    .roundRect(top.x - footprintWidth * 0.16, bottom.y - footprintDepth * 0.28, footprintWidth * 0.32, 24, 4)
    .fill({ color: 0xb7dceb, alpha: 0.74 })
    .roundRect(top.x - footprintWidth * 0.13, bottom.y - footprintDepth * 0.25, footprintWidth * 0.1, 18, 2)
    .fill({ color: 0xe7f6f4, alpha: 0.44 })
    .roundRect(top.x + footprintWidth * 0.03, bottom.y - footprintDepth * 0.25, footprintWidth * 0.1, 18, 2)
    .fill({ color: 0xe7f6f4, alpha: 0.34 })
    .stroke({ color: trimColor, alpha: 0.28, width: 1.1 });

  const entryFrame = new Graphics()
    .moveTo(top.x - footprintWidth * 0.24, bottom.y - footprintDepth * 0.31)
    .lineTo(top.x, bottom.y - footprintDepth * 0.43)
    .lineTo(top.x + footprintWidth * 0.24, bottom.y - footprintDepth * 0.31)
    .lineTo(top.x + footprintWidth * 0.18, bottom.y - footprintDepth * 0.25)
    .lineTo(top.x, bottom.y - footprintDepth * 0.35)
    .lineTo(top.x - footprintWidth * 0.18, bottom.y - footprintDepth * 0.25)
    .closePath()
    .fill({ color: shadeColor(roofColor, 28), alpha: 0.66 })
    .stroke({ color: trimColor, alpha: 0.22, width: 1.2 });

  const roofLantern = polygon(
    diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.3 }, footprintWidth * 0.22, footprintDepth * 0.18),
    shadeColor(roofColor, 34),
    0.76,
    trimColor,
    0.22,
  );
  const lanternGlass = new Graphics()
    .roundRect(top.x - footprintWidth * 0.055, top.y - footprintDepth * 0.36, footprintWidth * 0.11, 10, 2)
    .fill({ color: 0xdaf2ff, alpha: 0.62 })
    .stroke({ color: trimColor, alpha: 0.2, width: 1 });

  const wingBays = new Graphics();
  for (let bay = -2; bay <= 2; bay += 1) {
    if (bay === 0) continue;
    wingBays
      .roundRect(top.x + bay * (footprintWidth * 0.15) - 4.5, bottom.y - footprintDepth * 0.16, 9, 9, 2)
      .fill({ color: highlightColor, alpha: 0.76 })
      .roundRect(top.x + bay * (footprintWidth * 0.15) - 5.8, bottom.y - footprintDepth * 0.17, 11.6, 11, 2)
      .stroke({ color: trimColor, alpha: 0.18, width: 0.9 });
  }

  const civicNameplateGeometry = new Graphics()
    .moveTo(top.x - footprintWidth * 0.32, bottom.y - footprintDepth * 0.04)
    .lineTo(top.x - footprintWidth * 0.1, bottom.y + footprintDepth * 0.06)
    .lineTo(top.x + footprintWidth * 0.12, bottom.y - footprintDepth * 0.02)
    .lineTo(top.x + footprintWidth * 0.34, bottom.y + footprintDepth * 0.08);
  civicNameplateGeometry.stroke({ color: 0xfff1cc, alpha: 0.32, width: 2.4, cap: "round", join: "round" });

  const civicPlinthStack = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.44, bottom.y + footprintDepth * 0.18)
    .lineTo(bottom.x - footprintWidth * 0.12, bottom.y + footprintDepth * 0.34)
    .lineTo(bottom.x + footprintWidth * 0.2, bottom.y + footprintDepth * 0.18)
    .moveTo(bottom.x - footprintWidth * 0.35, bottom.y + footprintDepth * 0.27)
    .lineTo(bottom.x - footprintWidth * 0.08, bottom.y + footprintDepth * 0.4)
    .lineTo(bottom.x + footprintWidth * 0.28, bottom.y + footprintDepth * 0.22);
  civicPlinthStack.stroke({ color: 0x8b7954, alpha: 0.3, width: 1.7, cap: "round", join: "round" });

  const roofShoulders = new Graphics()
    .poly(diamondPoints({ x: top.x - footprintWidth * 0.28, y: top.y - footprintDepth * 0.08 }, footprintWidth * 0.22, footprintDepth * 0.16), true)
    .fill({ color: shadeColor(roofColor, 18), alpha: 0.34 })
    .poly(diamondPoints({ x: top.x + footprintWidth * 0.28, y: top.y + footprintDepth * 0.02 }, footprintWidth * 0.22, footprintDepth * 0.16), true)
    .fill({ color: shadeColor(roofColor, -10), alpha: 0.28 })
    .stroke({ color: trimColor, alpha: 0.1, width: 0.9 });

  const entryAxis = polygon(
    diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.36 }, footprintWidth * 0.32, footprintDepth * 0.14),
    0xf0d8a8,
    0.42,
    0x7f6d4e,
    0.16,
  );

  layer.addChild(civicPlinthStack, roofShoulders, entryAxis, entryFrame, entryGlass, roofLantern, lanternGlass, wingBays, civicNameplateGeometry);
}

function drawDraftAnchorDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, bodyColor, highlightColor, trimColor, accentColor } = geometry;
  const id = building.id;
  const material = new Graphics();
  material
    .poly(diamondPoints({ x: top.x + footprintWidth * 0.08, y: top.y - footprintDepth * 0.03 }, footprintWidth * 0.22, footprintDepth * 0.15), true)
    .fill({ color: shadeColor(roofColor, 22), alpha: 0.18 })
    .poly(diamondPoints({ x: top.x - footprintWidth * 0.18, y: top.y + footprintDepth * 0.07 }, footprintWidth * 0.18, footprintDepth * 0.12), true)
    .fill({ color: shadeColor(roofColor, -28), alpha: 0.14 });
  const facade = new Graphics();
  for (let bay = -2; bay <= 2; bay += 1) {
    facade
      .roundRect(top.x + bay * (footprintWidth * 0.12) - 3.5, bottom.y - footprintDepth * 0.16, 7, 8, 1.5)
      .fill({ color: id.includes("artic") ? 0xc9e5e8 : 0xf7e8c0, alpha: id.includes("stadium") ? 0.42 : 0.58 });
  }
  facade.stroke({ color: trimColor, alpha: 0.14, width: 0.8 });
  layer.addChild(material, facade);
  drawDraftSoCalFacadeMaterial(layer, geometry, building);
  drawDraftVoxelGrammarSystem(layer, geometry, building);

  if (id.includes("anaheim-convention-center-exhibit")) {
    const hallShadow = polygon(
      diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.16 }, footprintWidth * 0.96, footprintDepth * 0.34),
      0x6b5a44,
      0.16,
      0x6b5a44,
      0.04,
    );
    const hallBase = polygon(
      diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.06 }, footprintWidth * 0.88, footprintDepth * 0.28),
      0xd4b884,
      0.36,
      0x8b744f,
      0.14,
    );
    const hallSideFace = new Graphics()
      .moveTo(top.x - footprintWidth * 0.45, top.y + footprintDepth * 0.18)
      .lineTo(top.x - footprintWidth * 0.02, top.y + footprintDepth * 0.34)
      .lineTo(top.x + footprintWidth * 0.45, top.y + footprintDepth * 0.12)
      .lineTo(top.x + footprintWidth * 0.45, top.y + footprintDepth * 0.25)
      .lineTo(top.x, top.y + footprintDepth * 0.48)
      .lineTo(top.x - footprintWidth * 0.45, top.y + footprintDepth * 0.3)
      .closePath()
      .fill({ color: shadeColor(bodyColor, -18), alpha: 0.3 })
      .stroke({ color: 0x8b744f, alpha: 0.1, width: 1 });
    const campusSlab = new Graphics()
      .moveTo(top.x - footprintWidth * 0.5, top.y + footprintDepth * 0.08)
      .lineTo(top.x - footprintWidth * 0.08, top.y - footprintDepth * 0.16)
      .lineTo(top.x + footprintWidth * 0.5, top.y + footprintDepth * 0.06)
      .lineTo(top.x + footprintWidth * 0.1, top.y + footprintDepth * 0.31)
      .closePath()
      .fill({ color: shadeColor(roofColor, 24), alpha: 0.2 })
      .stroke({ color: 0xf9f0d2, alpha: 0.1, width: 1 });
    const roofField = polygon(
      diamondPoints({ x: top.x, y: top.y + footprintDepth * 0.02 }, footprintWidth * 0.9, footprintDepth * 0.42),
      shadeColor(roofColor, 16),
      0.36,
      trimColor,
      0.12,
    );
    const westRoofStep = polygon(
      diamondPoints({ x: top.x - footprintWidth * 0.22, y: top.y - footprintDepth * 0.08 }, footprintWidth * 0.34, footprintDepth * 0.2),
      shadeColor(roofColor, 34),
      0.3,
      trimColor,
      0.08,
    );
    const eastRoofStep = polygon(
      diamondPoints({ x: top.x + footprintWidth * 0.22, y: top.y + footprintDepth * 0.12 }, footprintWidth * 0.36, footprintDepth * 0.2),
      shadeColor(roofColor, -8),
      0.24,
      trimColor,
      0.08,
    );
    const exhibitRoof = new Graphics()
      .moveTo(top.x - footprintWidth * 0.38, top.y - footprintDepth * 0.1)
      .lineTo(top.x + footprintWidth * 0.38, top.y + footprintDepth * 0.12)
      .moveTo(top.x - footprintWidth * 0.34, top.y + footprintDepth * 0.05)
      .lineTo(top.x + footprintWidth * 0.3, top.y + footprintDepth * 0.24)
      .moveTo(top.x - footprintWidth * 0.08, top.y - footprintDepth * 0.22)
      .lineTo(top.x + footprintWidth * 0.22, top.y - footprintDepth * 0.08);
    for (let rib = -2; rib <= 2; rib += 1) {
      exhibitRoof
        .moveTo(top.x + rib * (footprintWidth * 0.12) - footprintWidth * 0.18, top.y - footprintDepth * 0.18)
        .lineTo(top.x + rib * (footprintWidth * 0.12) + footprintWidth * 0.2, top.y + footprintDepth * 0.2);
    }
    exhibitRoof.stroke({ color: shadeColor(roofColor, -42), alpha: 0.42, width: 2.2, cap: "round", join: "round" });
    const roofSkylights = new Graphics();
    for (let strip = -1; strip <= 1; strip += 1) {
      roofSkylights
        .moveTo(top.x - footprintWidth * 0.3 + strip * (footprintWidth * 0.15), top.y - footprintDepth * 0.06 + strip * (footprintDepth * 0.02))
        .lineTo(top.x + footprintWidth * 0.26 + strip * (footprintWidth * 0.12), top.y + footprintDepth * 0.11 + strip * (footprintDepth * 0.02));
    }
    roofSkylights.stroke({ color: 0xe9fbfb, alpha: 0.32, width: 3, cap: "round", join: "round" });
    const roofHallBreaks = new Graphics()
      .moveTo(top.x - footprintWidth * 0.42, top.y - footprintDepth * 0.02)
      .lineTo(top.x - footprintWidth * 0.18, top.y - footprintDepth * 0.15)
      .lineTo(top.x + footprintWidth * 0.08, top.y - footprintDepth * 0.05)
      .lineTo(top.x + footprintWidth * 0.34, top.y - footprintDepth * 0.17)
      .moveTo(top.x - footprintWidth * 0.35, top.y + footprintDepth * 0.12)
      .lineTo(top.x - footprintWidth * 0.08, top.y + footprintDepth * 0.26)
      .lineTo(top.x + footprintWidth * 0.22, top.y + footprintDepth * 0.12)
      .lineTo(top.x + footprintWidth * 0.43, top.y + footprintDepth * 0.24);
    roofHallBreaks.stroke({ color: 0xfbf1cf, alpha: 0.28, width: 2.2, cap: "round", join: "round" });
    const glassArcade = new Graphics();
    glassArcade
      .roundRect(top.x - footprintWidth * 0.46, bottom.y - footprintDepth * 0.31, footprintWidth * 0.92, 16, 3)
      .fill({ color: 0xc7ecf1, alpha: 0.34 });
    for (let bay = -5; bay <= 5; bay += 1) {
      glassArcade
        .roundRect(top.x + bay * (footprintWidth * 0.07) - 3.2, bottom.y - footprintDepth * 0.29, 6.4, 13, 1.6)
        .fill({ color: bay % 2 === 0 ? 0xdaf4f4 : 0xaed6df, alpha: 0.54 })
        .roundRect(top.x + bay * (footprintWidth * 0.07) - 3, bottom.y - footprintDepth * 0.1, 6, 7, 1.4)
        .fill({ color: 0xf8e8ca, alpha: 0.26 });
    }
    glassArcade.stroke({ color: trimColor, alpha: 0.12, width: 0.8 });
    const curtainMullions = new Graphics();
    for (let bay = -5; bay <= 5; bay += 1) {
      curtainMullions
        .moveTo(top.x + bay * (footprintWidth * 0.07), bottom.y - footprintDepth * 0.32)
        .lineTo(top.x + bay * (footprintWidth * 0.07), bottom.y - footprintDepth * 0.16);
    }
    curtainMullions.stroke({ color: 0xf8ffff, alpha: 0.3, width: 0.9, cap: "round" });
    const hallApron = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.4 }, footprintWidth * 0.76, footprintDepth * 0.22), 0xe8d3aa, 0.44, 0x7f6d4e, 0.14);
    const hallApronRibs = new Graphics()
      .moveTo(bottom.x - footprintWidth * 0.34, bottom.y + footprintDepth * 0.35)
      .lineTo(bottom.x, bottom.y + footprintDepth * 0.5)
      .lineTo(bottom.x + footprintWidth * 0.34, bottom.y + footprintDepth * 0.35)
      .moveTo(bottom.x - footprintWidth * 0.18, bottom.y + footprintDepth * 0.44)
      .lineTo(bottom.x + footprintWidth * 0.18, bottom.y + footprintDepth * 0.44);
    hallApronRibs.stroke({ color: 0xf8e8c0, alpha: 0.28, width: 1.6, cap: "round", join: "round" });
    const curtainWall = new Graphics()
      .roundRect(top.x - footprintWidth * 0.44, bottom.y - footprintDepth * 0.36, footprintWidth * 0.88, 10, 3)
      .fill({ color: 0xc7ecf1, alpha: 0.42 })
      .stroke({ color: 0x4e8298, alpha: 0.16, width: 1 });
    const waveCornice = new Graphics()
      .moveTo(top.x - footprintWidth * 0.42, top.y - footprintDepth * 0.16)
      .lineTo(top.x - footprintWidth * 0.24, top.y - footprintDepth * 0.21)
      .lineTo(top.x - footprintWidth * 0.04, top.y - footprintDepth * 0.11)
      .lineTo(top.x + footprintWidth * 0.16, top.y - footprintDepth * 0.16)
      .lineTo(top.x + footprintWidth * 0.38, top.y + footprintDepth * 0.02);
    waveCornice.stroke({ color: 0xf9f0d2, alpha: 0.34, width: 2.4, cap: "round", join: "round" });
    layer.addChild(hallShadow, hallBase, hallSideFace, campusSlab, hallApron, hallApronRibs, roofField, westRoofStep, eastRoofStep, exhibitRoof, roofSkylights, roofHallBreaks, glassArcade, curtainMullions, curtainWall, waveCornice);
  }

  if (id.includes("anaheim-convention-center-entry-spine")) {
    const plazaPlane = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.38 }, footprintWidth * 0.96, footprintDepth * 0.26), 0xe5c99c, 0.4, 0x7f6d4e, 0.12);
    const canopy = polygon(diamondPoints({ x: bottom.x, y: bottom.y - footprintDepth * 0.12 }, footprintWidth * 0.82, footprintDepth * 0.22), shadeColor(roofColor, 28), 0.76, trimColor, 0.18);
    const glassRun = new Graphics()
      .roundRect(top.x - footprintWidth * 0.42, bottom.y - footprintDepth * 0.24, footprintWidth * 0.84, 15, 3)
      .fill({ color: 0xc7ecf1, alpha: 0.74 })
      .stroke({ color: trimColor, alpha: 0.18, width: 1 });
    const entryPiers = new Graphics();
    for (let pier = -4; pier <= 4; pier += 1) {
      entryPiers.roundRect(top.x + pier * (footprintWidth * 0.085) - 2, bottom.y - footprintDepth * 0.1, 4, 20, 1.5);
    }
    entryPiers.fill({ color: 0xf6dcb1, alpha: 0.58 }).stroke({ color: trimColor, alpha: 0.14, width: 0.8 });
    const frontageBays = new Graphics();
    for (let bay = -5; bay <= 5; bay += 1) {
      frontageBays
        .roundRect(top.x + bay * (footprintWidth * 0.07) - 3.2, bottom.y - footprintDepth * 0.3, 6.4, 8, 1.5)
        .fill({ color: bay % 2 === 0 ? 0xd8f3f3 : 0xb9dce4, alpha: 0.44 });
    }
    frontageBays.stroke({ color: 0x4e8298, alpha: 0.12, width: 0.8 });
    const roofBands = new Graphics()
      .moveTo(top.x - footprintWidth * 0.4, top.y - footprintDepth * 0.16)
      .lineTo(top.x - footprintWidth * 0.16, top.y - footprintDepth * 0.22)
      .lineTo(top.x + footprintWidth * 0.08, top.y - footprintDepth * 0.13)
      .lineTo(top.x + footprintWidth * 0.36, top.y - footprintDepth * 0.18)
      .moveTo(top.x - footprintWidth * 0.32, top.y + footprintDepth * 0.02)
      .lineTo(top.x - footprintWidth * 0.06, top.y - footprintDepth * 0.04)
      .lineTo(top.x + footprintWidth * 0.22, top.y + footprintDepth * 0.06);
    roofBands.stroke({ color: 0xfaf1d4, alpha: 0.3, width: 2, cap: "round", join: "round" });
    const serpentineFront = new Graphics()
      .moveTo(top.x - footprintWidth * 0.44, bottom.y - footprintDepth * 0.3)
      .lineTo(top.x - footprintWidth * 0.24, bottom.y - footprintDepth * 0.35)
      .lineTo(top.x - footprintWidth * 0.04, bottom.y - footprintDepth * 0.28)
      .lineTo(top.x + footprintWidth * 0.18, bottom.y - footprintDepth * 0.34)
      .lineTo(top.x + footprintWidth * 0.42, bottom.y - footprintDepth * 0.27);
    serpentineFront.stroke({ color: 0xf9f2da, alpha: 0.42, width: 2.2, cap: "round", join: "round" });
    const forecourtAxis = new Graphics()
      .moveTo(bottom.x - footprintWidth * 0.33, bottom.y + footprintDepth * 0.17)
      .lineTo(bottom.x, bottom.y + footprintDepth * 0.3)
      .lineTo(bottom.x + footprintWidth * 0.33, bottom.y + footprintDepth * 0.17)
      .moveTo(bottom.x, bottom.y + footprintDepth * 0.3)
      .lineTo(bottom.x, bottom.y + footprintDepth * 0.47);
    forecourtAxis.stroke({ color: 0xf7e8c0, alpha: 0.28, width: 2, cap: "round", join: "round" });
    layer.addChild(plazaPlane, canopy, glassRun, frontageBays, entryPiers, roofBands, serpentineFront, forecourtAxis);
  }

  if (id.includes("artic-transit-center-terminal-shed")) {
    const platform = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.42 }, footprintWidth * 1.06, footprintDepth * 0.22), 0xdac89f, 0.46, 0x7f6d4e, 0.16);
    const trackBed = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.62 }, footprintWidth * 0.98, footprintDepth * 0.13), 0x697b78, 0.3, 0x394845, 0.16);
    const vaultShadow = polygon(
      diamondPoints({ x: top.x, y: top.y + footprintDepth * 0.08 }, footprintWidth * 0.92, footprintDepth * 0.48),
      0x66878b,
      0.24,
      0x45636a,
      0.08,
    );
    const vault = new Graphics()
      .ellipse(top.x, top.y - footprintDepth * 0.04, footprintWidth * 0.5, footprintDepth * 0.34)
      .fill({ color: 0xbdd9dc, alpha: 0.5 })
      .stroke({ color: 0xf4fbfb, alpha: 0.48, width: 2.1 });
    const shellTop = polygon(
      diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.14 }, footprintWidth * 0.82, footprintDepth * 0.34),
      0xd9eeee,
      0.34,
      0xffffff,
      0.16,
    );
    const roofRibs = new Graphics();
    for (let rib = -4; rib <= 4; rib += 1) {
      roofRibs
        .moveTo(top.x + rib * (footprintWidth * 0.075) - footprintWidth * 0.11, top.y - footprintDepth * 0.34)
        .lineTo(top.x + rib * (footprintWidth * 0.075) + footprintWidth * 0.1, top.y + footprintDepth * 0.32);
    }
    for (let rib = -3; rib <= 3; rib += 1) {
      roofRibs
        .moveTo(top.x + rib * (footprintWidth * 0.085) + footprintWidth * 0.13, top.y - footprintDepth * 0.31)
        .lineTo(top.x + rib * (footprintWidth * 0.085) - footprintWidth * 0.13, top.y + footprintDepth * 0.31);
    }
    roofRibs.stroke({ color: 0xf4fbfb, alpha: 0.58, width: 1.9, cap: "round", join: "round" });
    const shellRim = new Graphics()
      .ellipse(top.x, top.y - footprintDepth * 0.04, footprintWidth * 0.54, footprintDepth * 0.37)
      .stroke({ color: 0xf9ffff, alpha: 0.5, width: 3 });
    const platformLines = new Graphics()
      .moveTo(bottom.x - footprintWidth * 0.42, bottom.y + footprintDepth * 0.34)
      .lineTo(bottom.x + footprintWidth * 0.42, bottom.y + footprintDepth * 0.34)
      .moveTo(bottom.x - footprintWidth * 0.34, bottom.y + footprintDepth * 0.42)
      .lineTo(bottom.x + footprintWidth * 0.34, bottom.y + footprintDepth * 0.42)
      .moveTo(bottom.x - footprintWidth * 0.43, bottom.y + footprintDepth * 0.59)
      .lineTo(bottom.x + footprintWidth * 0.43, bottom.y + footprintDepth * 0.59)
      .moveTo(bottom.x - footprintWidth * 0.38, bottom.y + footprintDepth * 0.67)
      .lineTo(bottom.x + footprintWidth * 0.38, bottom.y + footprintDepth * 0.67);
    platformLines.stroke({ color: trimColor, alpha: 0.26, width: 1.6, cap: "round" });
    const glassEnds = new Graphics()
      .roundRect(top.x - footprintWidth * 0.47, bottom.y - footprintDepth * 0.18, footprintWidth * 0.2, 15, 4)
      .roundRect(top.x + footprintWidth * 0.27, bottom.y - footprintDepth * 0.2, footprintWidth * 0.2, 15, 4)
      .fill({ color: 0xd9f2f0, alpha: 0.5 })
      .stroke({ color: trimColor, alpha: 0.16, width: 0.9 });
    const endPortalArcs = new Graphics()
      .moveTo(top.x - footprintWidth * 0.48, bottom.y - footprintDepth * 0.02)
      .lineTo(top.x - footprintWidth * 0.38, bottom.y - footprintDepth * 0.23)
      .lineTo(top.x - footprintWidth * 0.28, bottom.y - footprintDepth * 0.02)
      .moveTo(top.x + footprintWidth * 0.28, bottom.y - footprintDepth * 0.04)
      .lineTo(top.x + footprintWidth * 0.38, bottom.y - footprintDepth * 0.25)
      .lineTo(top.x + footprintWidth * 0.48, bottom.y - footprintDepth * 0.04);
    endPortalArcs.stroke({ color: 0xf4fbfb, alpha: 0.5, width: 1.8, cap: "round", join: "round" });
    const transitSpine = new Graphics()
      .moveTo(top.x - footprintWidth * 0.5, top.y + footprintDepth * 0.36)
      .lineTo(top.x + footprintWidth * 0.5, top.y + footprintDepth * 0.36)
      .moveTo(top.x - footprintWidth * 0.44, top.y + footprintDepth * 0.44)
      .lineTo(top.x + footprintWidth * 0.44, top.y + footprintDepth * 0.44);
    transitSpine.stroke({ color: 0xf8ffff, alpha: 0.32, width: 2.2, cap: "round" });
    layer.addChild(trackBed, platform, vaultShadow, vault, shellTop, shellRim, roofRibs, platformLines, glassEnds, endPortalArcs, transitSpine);
  }

  if (id.includes("artic-transit-center-clock-tower")) {
    const towerCap = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.32 }, footprintWidth * 0.58, footprintDepth * 0.36), shadeColor(roofColor, 32), 0.86, trimColor, 0.22);
    const clockFace = new Graphics()
      .circle(top.x, bottom.y - footprintDepth * 0.34, Math.max(5, footprintWidth * 0.04))
      .fill({ color: 0xf9f1d0, alpha: 0.88 })
      .stroke({ color: trimColor, alpha: 0.28, width: 1 });
    const verticalRibs = new Graphics()
      .moveTo(top.x - footprintWidth * 0.12, bottom.y - footprintDepth * 0.08)
      .lineTo(top.x - footprintWidth * 0.08, top.y - footprintDepth * 0.24)
      .moveTo(top.x + footprintWidth * 0.12, bottom.y - footprintDepth * 0.08)
      .lineTo(top.x + footprintWidth * 0.08, top.y - footprintDepth * 0.24)
      .moveTo(top.x, bottom.y - footprintDepth * 0.02)
      .lineTo(top.x, top.y - footprintDepth * 0.3);
    verticalRibs.stroke({ color: 0xf4fbfb, alpha: 0.34, width: 1.2, cap: "round" });
    layer.addChild(towerCap, verticalRibs, clockFace);
  }

  if (id.includes("angel-stadium-venue-bowl")) {
    const bowl = new Graphics()
      .ellipse(top.x, top.y + footprintDepth * 0.08, footprintWidth * 0.47, footprintDepth * 0.35)
      .fill({ color: shadeColor(roofColor, 12), alpha: 0.46 })
      .stroke({ color: shadeColor(roofColor, -38), alpha: 0.42, width: 2.8 })
      .ellipse(top.x + footprintWidth * 0.03, top.y + footprintDepth * 0.1, footprintWidth * 0.3, footprintDepth * 0.2)
      .fill({ color: 0xaebd7a, alpha: 0.42 })
      .stroke({ color: trimColor, alpha: 0.2, width: 1.3 });
    const fieldCut = polygon(
      diamondPoints({ x: top.x + footprintWidth * 0.03, y: top.y + footprintDepth * 0.12 }, footprintWidth * 0.26, footprintDepth * 0.15),
      0xb7c77d,
      0.34,
      0xf7e8c0,
      0.12,
    );
    const tierLines = new Graphics()
      .moveTo(top.x - footprintWidth * 0.34, top.y + footprintDepth * 0.0)
      .lineTo(top.x + footprintWidth * 0.34, top.y + footprintDepth * 0.19)
      .moveTo(top.x - footprintWidth * 0.29, top.y + footprintDepth * 0.12)
      .lineTo(top.x + footprintWidth * 0.29, top.y + footprintDepth * 0.3)
      .moveTo(top.x - footprintWidth * 0.32, top.y + footprintDepth * 0.23)
      .lineTo(top.x + footprintWidth * 0.22, top.y + footprintDepth * 0.38)
      .moveTo(top.x - footprintWidth * 0.16, top.y - footprintDepth * 0.08)
      .lineTo(top.x + footprintWidth * 0.38, top.y + footprintDepth * 0.1);
    tierLines.stroke({ color: 0xfff7d8, alpha: 0.34, width: 1.8, cap: "round" });
    const homePlateCue = polygon(
      diamondPoints({ x: top.x - footprintWidth * 0.08, y: top.y + footprintDepth * 0.22 }, footprintWidth * 0.14, footprintDepth * 0.1),
      0xd7b678,
      0.44,
      0xfaf0cf,
      0.12,
    );
    layer.addChild(bowl, fieldCut, homePlateCue, tierLines);
  }

  if (id.includes("platinum-triangle-area-rowhome")) {
    const shadeScreen = new Graphics();
    for (let bay = -2; bay <= 2; bay += 1) {
      shadeScreen
        .roundRect(top.x + bay * (footprintWidth * 0.1) - 4, bottom.y - footprintDepth * 0.22, 8, 11, 1.5)
        .fill({ color: shadeColor(bodyColor, -26), alpha: 0.28 })
        .roundRect(top.x + bay * (footprintWidth * 0.1) - 3, bottom.y - footprintDepth * 0.2, 6, 7, 1.2)
        .fill({ color: 0xf6e8c8, alpha: 0.44 });
    }
    const stoopLine = new Graphics()
      .moveTo(bottom.x - footprintWidth * 0.38, bottom.y + footprintDepth * 0.2)
      .lineTo(bottom.x + footprintWidth * 0.34, bottom.y + footprintDepth * 0.2);
    stoopLine.stroke({ color: 0x7f6d4e, alpha: 0.28, width: 1.4, cap: "round" });
    layer.addChild(shadeScreen, stoopLine);
  }

  if (id.includes("platinum-triangle-area-lowrise")) {
    const balcony = new Graphics()
      .moveTo(top.x - footprintWidth * 0.32, bottom.y - footprintDepth * 0.1)
      .lineTo(top.x + footprintWidth * 0.28, bottom.y - footprintDepth * 0.1)
      .moveTo(top.x - footprintWidth * 0.26, bottom.y + footprintDepth * 0.02)
      .lineTo(top.x + footprintWidth * 0.22, bottom.y + footprintDepth * 0.02);
    balcony.stroke({ color: shadeColor(trimColor, 28), alpha: 0.34, width: 1.5, cap: "round" });
    const courtyardMark = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.34 }, footprintWidth * 0.34, footprintDepth * 0.12), 0xc4c79a, 0.26, 0x6f7f55, 0.1);
    const roofTerraces = new Graphics()
      .roundRect(top.x - footprintWidth * 0.32, top.y - footprintDepth * 0.12, footprintWidth * 0.26, 8, 2)
      .roundRect(top.x + footprintWidth * 0.08, top.y + footprintDepth * 0.08, footprintWidth * 0.22, 7, 2)
      .fill({ color: shadeColor(roofColor, 26), alpha: 0.22 })
      .stroke({ color: trimColor, alpha: 0.1, width: 0.8 });
    layer.addChild(courtyardMark, balcony, roofTerraces);
  }

  if (id.includes("platinum-triangle-area-mixed-use")) {
    const podiumGlass = new Graphics();
    for (let bay = -2; bay <= 2; bay += 1) {
      podiumGlass
        .roundRect(top.x + bay * (footprintWidth * 0.12) - 5, bottom.y - footprintDepth * 0.18, 10, 9, 2)
        .fill({ color: 0xc7ecf1, alpha: 0.44 });
    }
    podiumGlass.stroke({ color: trimColor, alpha: 0.14, width: 0.8 });
    const podiumLip = new Graphics()
      .moveTo(bottom.x - footprintWidth * 0.42, bottom.y + footprintDepth * 0.12)
      .lineTo(bottom.x, bottom.y + footprintDepth * 0.28)
      .lineTo(bottom.x + footprintWidth * 0.42, bottom.y + footprintDepth * 0.12);
    podiumLip.stroke({ color: 0x7f6d4e, alpha: 0.3, width: 1.6, cap: "round", join: "round" });
    layer.addChild(podiumGlass, podiumLip);
  }

  if (id.includes("angel-stadium-homeplate-gate")) {
    const gate = new Graphics()
      .roundRect(top.x - footprintWidth * 0.22, bottom.y - footprintDepth * 0.28, footprintWidth * 0.44, 16, 3)
      .fill({ color: highlightColor, alpha: 0.82 })
      .roundRect(top.x - footprintWidth * 0.12, bottom.y - footprintDepth * 0.17, footprintWidth * 0.24, 12, 2)
      .fill({ color: accentColor, alpha: 0.54 })
      .stroke({ color: trimColor, alpha: 0.24, width: 1 });
    const forecourt = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.24 }, footprintWidth * 0.66, footprintDepth * 0.18), 0xe8d3aa, 0.44, 0x7f6d4e, 0.16);
    layer.addChild(forecourt, gate);
  }

  if (id.includes("downtown-anaheim-community-center-community-hall")) {
    const communitySteps = new Graphics()
      .moveTo(bottom.x - footprintWidth * 0.24, bottom.y + footprintDepth * 0.18)
      .lineTo(bottom.x, bottom.y + footprintDepth * 0.3)
      .lineTo(bottom.x + footprintWidth * 0.24, bottom.y + footprintDepth * 0.18)
      .moveTo(bottom.x - footprintWidth * 0.18, bottom.y + footprintDepth * 0.25)
      .lineTo(bottom.x, bottom.y + footprintDepth * 0.34)
      .lineTo(bottom.x + footprintWidth * 0.18, bottom.y + footprintDepth * 0.25);
    communitySteps.stroke({ color: 0x8f7a54, alpha: 0.32, width: 1.8, cap: "round", join: "round" });
    const roofPatch = polygon(diamondPoints({ x: top.x - footprintWidth * 0.12, y: top.y - footprintDepth * 0.02 }, footprintWidth * 0.26, footprintDepth * 0.18), shadeColor(roofColor, 30), 0.32, trimColor, 0.08);
    layer.addChild(roofPatch, communitySteps);
  }
}

type DraftVoxelGrammarFamily =
  | "large_venue_hall"
  | "transit_hub"
  | "stadium_bowl"
  | "mixed_use_edge"
  | "commercial_edge"
  | "airport_logistics_edge"
  | "civic_core"
  | "residential_variety"
  | "generic_draft";

function draftVoxelGrammarFamily(id: string): DraftVoxelGrammarFamily {
  if (id.includes("anaheim-convention-center")) return "large_venue_hall";
  if (id.includes("artic-transit-center")) return "transit_hub";
  if (id.includes("angel-stadium")) return "stadium_bowl";
  if (id.includes("platinum-triangle")) return "mixed_use_edge";
  if (id.includes("ontario-international-airport")) return "airport_logistics_edge";
  if (id.includes("ontario-mills") || id.includes("downtown-service")) return "commercial_edge";
  if (id.includes("ontario-civic") || id.includes("downtown-anaheim-community")) return "civic_core";
  if (id.includes("ontario-inland-residential")) return "residential_variety";
  return "generic_draft";
}

function drawDraftVoxelGrammarSystem(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const family = draftVoxelGrammarFamily(building.id);
  if (family === "generic_draft") return;

  drawDraftContactGrammar(layer, geometry, family);

  if (family === "large_venue_hall") drawLargeVenueHallGrammar(layer, geometry, building);
  if (family === "transit_hub") drawTransitHubGrammar(layer, geometry, building);
  if (family === "stadium_bowl") drawStadiumBowlGrammar(layer, geometry, building);
  if (family === "mixed_use_edge") drawMixedUseEdgeGrammar(layer, geometry, building);
  if (family === "commercial_edge") drawCommercialEdgeGrammar(layer, geometry, building);
  if (family === "airport_logistics_edge") drawAirportLogisticsGrammar(layer, geometry, building);
  if (family === "civic_core") drawCivicCoreDraftGrammar(layer, geometry, building);
  if (family === "residential_variety") drawResidentialVarietyGrammar(layer, geometry, building);
}

function drawDraftContactGrammar(layer: Container, geometry: BuildingGeometry, family: DraftVoxelGrammarFamily) {
  const { bottom, footprintWidth, footprintDepth } = geometry;
  const padScale = family === "large_venue_hall" || family === "airport_logistics_edge" ? 1.12 : family === "stadium_bowl" ? 1.12 : family === "transit_hub" ? 1.0 : 0.92;
  const apronScale = family === "transit_hub" || family === "stadium_bowl" || family === "commercial_edge" ? 0.96 : 0.76;
  const contact = polygon(
    diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.46 }, footprintWidth * padScale, footprintDepth * 0.28),
    family === "transit_hub" ? 0x9fb3af : family === "stadium_bowl" ? 0xb9c184 : 0xdac49b,
    family === "stadium_bowl" ? 0.22 : 0.28,
    0x6d5e43,
    0.12,
  );
  const sideFace = new Graphics()
    .moveTo(bottom.x - footprintWidth * apronScale * 0.5, bottom.y + footprintDepth * 0.42)
    .lineTo(bottom.x, bottom.y + footprintDepth * 0.58)
    .lineTo(bottom.x + footprintWidth * apronScale * 0.5, bottom.y + footprintDepth * 0.42)
    .lineTo(bottom.x + footprintWidth * apronScale * 0.5, bottom.y + footprintDepth * 0.52)
    .lineTo(bottom.x, bottom.y + footprintDepth * 0.7)
    .lineTo(bottom.x - footprintWidth * apronScale * 0.5, bottom.y + footprintDepth * 0.52)
    .closePath()
    .fill({ color: 0x8e7a55, alpha: 0.14 })
    .stroke({ color: 0x5f553f, alpha: 0.12, width: 1 });
  layer.addChild(contact, sideFace);
}

function drawLargeVenueHallGrammar(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
  const isEntry = building.id.includes("entry-spine") || building.id.includes("frontage-wing");
  const roofWidth = footprintWidth * (isEntry ? 0.94 : 1.06);
  const roofDepth = footprintDepth * (isEntry ? 0.34 : 0.5);
  const longRoof = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.05 }, roofWidth, roofDepth), shadeColor(roofColor, 24), 0.32, trimColor, 0.1);
  const hallPlinth = polygon(
    diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.42 }, footprintWidth * (isEntry ? 0.9 : 1.12), footprintDepth * 0.22),
    0xe4caa0,
    isEntry ? 0.36 : 0.42,
    0x7f6d4e,
    0.16,
  );
  const glassBand = new Graphics()
    .roundRect(top.x - footprintWidth * 0.47, bottom.y - footprintDepth * 0.34, footprintWidth * 0.94, Math.max(9, footprintDepth * 0.12), 3)
    .fill({ color: 0xc7edf0, alpha: isEntry ? 0.72 : 0.5 })
    .stroke({ color: 0x558698, alpha: 0.14, width: 1 });
  const continuousCurtainWall = new Graphics()
    .roundRect(top.x - footprintWidth * 0.5, bottom.y - footprintDepth * 0.3, footprintWidth, Math.max(7, footprintDepth * 0.1), 3)
    .fill({ color: 0xd9f7f4, alpha: isEntry ? 0.48 : 0.34 })
    .stroke({ color: 0x4e8298, alpha: 0.16, width: 1 });
  const bayRhythm = new Graphics();
  const bayCount = isEntry ? 9 : 11;
  for (let bay = 0; bay < bayCount; bay += 1) {
    const offset = (bay / (bayCount - 1) - 0.5) * footprintWidth * 0.82;
    bayRhythm
      .moveTo(top.x + offset, bottom.y - footprintDepth * 0.36)
      .lineTo(top.x + offset, bottom.y - footprintDepth * 0.18)
      .moveTo(top.x + offset - footprintWidth * 0.025, top.y + footprintDepth * 0.04)
      .lineTo(top.x + offset + footprintWidth * 0.08, top.y + footprintDepth * 0.18);
  }
  bayRhythm.stroke({ color: 0xf8f0d0, alpha: 0.34, width: isEntry ? 1.6 : 1.3, cap: "round" });
  const layeredRoof = new Graphics()
    .moveTo(top.x - footprintWidth * 0.46, top.y - footprintDepth * 0.22)
    .lineTo(top.x - footprintWidth * 0.18, top.y - footprintDepth * 0.32)
    .lineTo(top.x + footprintWidth * 0.12, top.y - footprintDepth * 0.2)
    .lineTo(top.x + footprintWidth * 0.42, top.y - footprintDepth * 0.3)
    .moveTo(top.x - footprintWidth * 0.4, top.y + footprintDepth * 0.06)
    .lineTo(top.x - footprintWidth * 0.08, top.y + footprintDepth * 0.22)
    .lineTo(top.x + footprintWidth * 0.25, top.y + footprintDepth * 0.07);
  layeredRoof.stroke({ color: 0xfaf3d4, alpha: 0.34, width: 2.2, cap: "round", join: "round" });
  const waveEdge = new Graphics()
    .moveTo(top.x - footprintWidth * 0.48, top.y - footprintDepth * 0.2)
    .lineTo(top.x - footprintWidth * 0.28, top.y - footprintDepth * 0.28)
    .lineTo(top.x - footprintWidth * 0.06, top.y - footprintDepth * 0.16)
    .lineTo(top.x + footprintWidth * 0.18, top.y - footprintDepth * 0.24)
    .lineTo(top.x + footprintWidth * 0.45, top.y - footprintDepth * 0.08);
  waveEdge.stroke({ color: 0xfff5d8, alpha: isEntry ? 0.34 : 0.42, width: isEntry ? 2 : 2.6, cap: "round", join: "round" });
  const forecourtGrooves = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.36, bottom.y + footprintDepth * 0.34)
    .lineTo(bottom.x, bottom.y + footprintDepth * 0.5)
    .lineTo(bottom.x + footprintWidth * 0.36, bottom.y + footprintDepth * 0.34)
    .moveTo(bottom.x - footprintWidth * 0.22, bottom.y + footprintDepth * 0.45)
    .lineTo(bottom.x + footprintWidth * 0.22, bottom.y + footprintDepth * 0.45);
  forecourtGrooves.stroke({ color: 0xf8e8c0, alpha: 0.3, width: 1.7, cap: "round", join: "round" });
  layer.addChild(hallPlinth, longRoof, continuousCurtainWall, glassBand, bayRhythm, layeredRoof, waveEdge, forecourtGrooves);
}

function drawTransitHubGrammar(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
  const terminal = building.id.includes("terminal-shed");
  if (!terminal) {
    const platformJoin = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.34 }, footprintWidth * 0.84, footprintDepth * 0.18), 0xdac89f, 0.32, 0x7f6d4e, 0.12);
    layer.addChild(platformJoin);
    return;
  }

  const barrelShadow = new Graphics()
    .ellipse(top.x, top.y + footprintDepth * 0.04, footprintWidth * 0.54, footprintDepth * 0.4)
    .fill({ color: 0x5c7d82, alpha: 0.24 });
  const barrelShell = new Graphics()
    .ellipse(top.x, top.y - footprintDepth * 0.06, footprintWidth * 0.56, footprintDepth * 0.38)
    .fill({ color: 0xd8eeee, alpha: 0.58 })
    .stroke({ color: 0xf8ffff, alpha: 0.52, width: 3 });
  const highVault = new Graphics()
    .ellipse(top.x, top.y - footprintDepth * 0.16, footprintWidth * 0.5, footprintDepth * 0.3)
    .stroke({ color: 0xffffff, alpha: 0.42, width: 4 });
  const ribGrid = new Graphics();
  for (let rib = -5; rib <= 5; rib += 1) {
    ribGrid
      .moveTo(top.x + rib * (footprintWidth * 0.072) - footprintWidth * 0.1, top.y - footprintDepth * 0.38)
      .lineTo(top.x + rib * (footprintWidth * 0.072) + footprintWidth * 0.12, top.y + footprintDepth * 0.32)
      .moveTo(top.x + rib * (footprintWidth * 0.072) + footprintWidth * 0.14, top.y - footprintDepth * 0.35)
      .lineTo(top.x + rib * (footprintWidth * 0.072) - footprintWidth * 0.14, top.y + footprintDepth * 0.3);
  }
  ribGrid.stroke({ color: 0xf8ffff, alpha: 0.6, width: 1.75, cap: "round" });
  const trackBed = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.62 }, footprintWidth * 0.98, footprintDepth * 0.13), 0x697b78, 0.3, 0x394845, 0.16);
  const platformEdge = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.46, bottom.y + footprintDepth * 0.42)
    .lineTo(bottom.x + footprintWidth * 0.46, bottom.y + footprintDepth * 0.42)
    .moveTo(bottom.x - footprintWidth * 0.38, bottom.y + footprintDepth * 0.56)
    .lineTo(bottom.x + footprintWidth * 0.38, bottom.y + footprintDepth * 0.56)
    .moveTo(bottom.x - footprintWidth * 0.42, bottom.y + footprintDepth * 0.64)
    .lineTo(bottom.x + footprintWidth * 0.42, bottom.y + footprintDepth * 0.64);
  platformEdge.stroke({ color: shadeColor(roofColor, -36), alpha: 0.34, width: 2.3, cap: "round" });
  const portals = new Graphics()
    .roundRect(top.x - footprintWidth * 0.5, bottom.y - footprintDepth * 0.19, footprintWidth * 0.18, 18, 5)
    .roundRect(top.x + footprintWidth * 0.32, bottom.y - footprintDepth * 0.21, footprintWidth * 0.18, 18, 5)
    .fill({ color: 0xe4f6f3, alpha: 0.58 })
    .stroke({ color: trimColor, alpha: 0.16, width: 1 });
  const trackSplit = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.45, bottom.y + footprintDepth * 0.68)
    .lineTo(bottom.x + footprintWidth * 0.45, bottom.y + footprintDepth * 0.68)
    .moveTo(bottom.x - footprintWidth * 0.4, bottom.y + footprintDepth * 0.76)
    .lineTo(bottom.x + footprintWidth * 0.4, bottom.y + footprintDepth * 0.76);
  trackSplit.stroke({ color: 0x334543, alpha: 0.34, width: 1.8, cap: "round" });
  const shellNodes = new Graphics();
  for (let node = -3; node <= 3; node += 1) {
    shellNodes.circle(top.x + node * (footprintWidth * 0.11), top.y - footprintDepth * 0.08 + Math.abs(node) * footprintDepth * 0.025, 2.2);
  }
  shellNodes.fill({ color: 0xf8ffff, alpha: 0.42 });
  layer.addChild(trackBed, barrelShadow, barrelShell, highVault, ribGrid, platformEdge, portals, trackSplit, shellNodes);
}

function drawStadiumBowlGrammar(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
  const bowlCore = new Graphics()
    .ellipse(top.x, top.y + footprintDepth * 0.1, footprintWidth * 0.5, footprintDepth * 0.38)
    .fill({ color: shadeColor(roofColor, 10), alpha: 0.48 })
    .stroke({ color: shadeColor(roofColor, -34), alpha: 0.46, width: 3 })
    .ellipse(top.x + footprintWidth * 0.04, top.y + footprintDepth * 0.12, footprintWidth * 0.26, footprintDepth * 0.18)
      .fill({ color: 0xb7c77d, alpha: 0.46 });
  const infield = polygon(diamondPoints({ x: top.x + footprintWidth * 0.04, y: top.y + footprintDepth * 0.14 }, footprintWidth * 0.2, footprintDepth * 0.12), 0xd7b678, 0.38, 0xfaf0cf, 0.14);
  const outfieldWedge = new Graphics()
    .moveTo(top.x - footprintWidth * 0.04, top.y + footprintDepth * 0.06)
    .lineTo(top.x + footprintWidth * 0.28, top.y + footprintDepth * 0.02)
    .lineTo(top.x + footprintWidth * 0.18, top.y + footprintDepth * 0.25)
    .lineTo(top.x - footprintWidth * 0.08, top.y + footprintDepth * 0.2)
    .closePath()
    .fill({ color: 0xa7bd72, alpha: 0.28 })
    .stroke({ color: 0xfaf0cf, alpha: 0.12, width: 1 });
  const tierBands = new Graphics();
  for (let band = 0; band < 4; band += 1) {
    tierBands
      .moveTo(top.x - footprintWidth * (0.38 - band * 0.055), top.y + footprintDepth * (-0.01 + band * 0.07))
      .lineTo(top.x + footprintWidth * (0.36 - band * 0.045), top.y + footprintDepth * (0.18 + band * 0.065));
  }
  tierBands.stroke({ color: 0xfff5d6, alpha: 0.4, width: 1.7, cap: "round" });
  const gateApron = building.id.includes("homeplate") ? polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.28 }, footprintWidth * 0.72, footprintDepth * 0.2), 0xe8d3aa, 0.42, 0x7f6d4e, 0.16) : null;
  if (gateApron) layer.addChild(gateApron);
  layer.addChild(bowlCore, outfieldWedge, infield, tierBands);
}

function drawMixedUseEdgeGrammar(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, trimColor, highlightColor } = geometry;
  const podium = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.24 }, footprintWidth * 0.86, footprintDepth * 0.18), 0xe2c69a, 0.28, 0x7f6d4e, 0.12);
  const facadeRhythm = new Graphics();
  const count = building.facadeStyle === "lowrise" ? 6 : 5;
  for (let bay = 0; bay < count; bay += 1) {
    const offset = (bay / (count - 1) - 0.5) * footprintWidth * 0.72;
    facadeRhythm
      .roundRect(top.x + offset - 4, bottom.y - footprintDepth * 0.24, 8, 10, 1.5)
      .fill({ color: highlightColor, alpha: 0.46 })
      .moveTo(top.x + offset, bottom.y - footprintDepth * 0.28)
      .lineTo(top.x + offset, bottom.y - footprintDepth * 0.08);
  }
  facadeRhythm.stroke({ color: trimColor, alpha: 0.18, width: 0.9 });
  layer.addChild(podium, facadeRhythm);
}

function drawCommercialEdgeGrammar(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
  const retailApron = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.36 }, footprintWidth * 0.94, footprintDepth * 0.22), 0xe4c99b, 0.34, 0x7f6d4e, 0.13);
  const parapet = new Graphics()
    .moveTo(top.x - footprintWidth * 0.44, top.y - footprintDepth * 0.22)
    .lineTo(top.x - footprintWidth * 0.12, top.y - footprintDepth * 0.08)
    .lineTo(top.x + footprintWidth * 0.2, top.y - footprintDepth * 0.2)
    .lineTo(top.x + footprintWidth * 0.44, top.y - footprintDepth * 0.08);
  parapet.stroke({ color: shadeColor(roofColor, -32), alpha: 0.34, width: 2.1, cap: "round", join: "round" });
  const bayGlass = new Graphics();
  for (let bay = -3; bay <= 3; bay += 1) {
    bayGlass
      .roundRect(top.x + bay * (footprintWidth * 0.1) - 4.5, bottom.y - footprintDepth * 0.22, 9, 10, 2)
      .fill({ color: bay % 2 === 0 ? 0xc7ecf1 : 0xf8e8c0, alpha: 0.4 });
  }
  bayGlass.stroke({ color: trimColor, alpha: 0.14, width: 0.8 });
  layer.addChild(retailApron, parapet, bayGlass);
}

function drawAirportLogisticsGrammar(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
  const terminal = building.id.includes("terminal-hall");
  const apron = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.42 }, footprintWidth * 1.04, footprintDepth * 0.26), 0xc7c9b3, 0.3, 0x6e7565, 0.12);
  const longCanopy = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.12 }, footprintWidth * (terminal ? 0.96 : 0.76), footprintDepth * 0.28), shadeColor(roofColor, 20), 0.34, trimColor, 0.12);
  const terminalGlass = new Graphics();
  for (let bay = -4; bay <= 4; bay += 1) {
    terminalGlass
      .roundRect(top.x + bay * (footprintWidth * 0.08) - 3.2, bottom.y - footprintDepth * 0.24, 6.4, 11, 1.5)
      .fill({ color: 0xd9f2f0, alpha: terminal ? 0.5 : 0.32 });
  }
  terminalGlass.stroke({ color: trimColor, alpha: 0.13, width: 0.8 });
  const runwayEdge = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.46, bottom.y + footprintDepth * 0.52)
    .lineTo(bottom.x + footprintWidth * 0.46, bottom.y + footprintDepth * 0.52)
    .moveTo(bottom.x - footprintWidth * 0.32, bottom.y + footprintDepth * 0.6)
    .lineTo(bottom.x + footprintWidth * 0.32, bottom.y + footprintDepth * 0.6);
  runwayEdge.stroke({ color: 0x6e7565, alpha: 0.22, width: 1.8, cap: "round" });
  layer.addChild(apron, longCanopy, terminalGlass, runwayEdge);
}

function drawCivicCoreDraftGrammar(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
  const steps = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.26, bottom.y + footprintDepth * 0.2)
    .lineTo(bottom.x, bottom.y + footprintDepth * 0.34)
    .lineTo(bottom.x + footprintWidth * 0.26, bottom.y + footprintDepth * 0.2)
    .moveTo(bottom.x - footprintWidth * 0.18, bottom.y + footprintDepth * 0.28)
    .lineTo(bottom.x, bottom.y + footprintDepth * 0.38)
    .lineTo(bottom.x + footprintWidth * 0.18, bottom.y + footprintDepth * 0.28);
  steps.stroke({ color: 0x8f7a54, alpha: 0.3, width: 1.5, cap: "round", join: "round" });
  const civicRoof = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.12 }, footprintWidth * 0.54, footprintDepth * 0.3), shadeColor(roofColor, 24), 0.3, trimColor, 0.1);
  layer.addChild(civicRoof, steps);
}

function drawResidentialVarietyGrammar(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, trimColor, highlightColor } = geometry;
  const stoopPad = polygon(diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.3 }, footprintWidth * 0.42, footprintDepth * 0.14), 0xe2c69a, 0.26, 0x7f6d4e, 0.12);
  const windows = new Graphics();
  const count = building.facadeStyle === "rowhome" ? 5 : 3;
  for (let index = 0; index < count; index += 1) {
    const offset = (index / Math.max(1, count - 1) - 0.5) * footprintWidth * 0.68;
    windows
      .roundRect(top.x + offset - 3.5, bottom.y - footprintDepth * 0.2, 7, 8, 1.4)
      .fill({ color: highlightColor, alpha: 0.44 });
  }
  windows.stroke({ color: trimColor, alpha: 0.15, width: 0.8 });
  layer.addChild(stoopPad, windows);
}

function drawDraftSoCalFacadeMaterial(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, bodyColor, trimColor, highlightColor } = geometry;
  const id = building.id;
  const roofPanelAlpha = id.includes("platinum") ? 0.22 : id.includes("convention") ? 0.2 : 0.17;
  const roofPanels = new Graphics()
    .moveTo(top.x - footprintWidth * 0.34, top.y - footprintDepth * 0.08)
    .lineTo(top.x - footprintWidth * 0.04, top.y + footprintDepth * 0.08)
    .lineTo(top.x + footprintWidth * 0.28, top.y - footprintDepth * 0.06)
    .moveTo(top.x - footprintWidth * 0.22, top.y + footprintDepth * 0.12)
    .lineTo(top.x + footprintWidth * 0.08, top.y + footprintDepth * 0.28)
    .moveTo(top.x + footprintWidth * 0.12, top.y - footprintDepth * 0.2)
    .lineTo(top.x + footprintWidth * 0.34, top.y - footprintDepth * 0.08);
  roofPanels.stroke({ color: shadeColor(roofColor, -42), alpha: roofPanelAlpha, width: 1.25, cap: "round", join: "round" });

  const stuccoFacet = new Graphics()
    .roundRect(top.x - footprintWidth * 0.42, bottom.y - footprintDepth * 0.12, footprintWidth * 0.16, 10, 2)
    .fill({ color: shadeColor(bodyColor, -16), alpha: 0.12 })
    .roundRect(top.x + footprintWidth * 0.23, bottom.y - footprintDepth * 0.18, footprintWidth * 0.15, 9, 2)
    .fill({ color: shadeColor(bodyColor, 18), alpha: 0.12 });

  const baseCourse = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.42, bottom.y + footprintDepth * 0.08)
    .lineTo(bottom.x - footprintWidth * 0.12, bottom.y + footprintDepth * 0.22)
    .lineTo(bottom.x + footprintWidth * 0.16, bottom.y + footprintDepth * 0.08)
    .moveTo(bottom.x + footprintWidth * 0.42, bottom.y + footprintDepth * 0.08)
    .lineTo(bottom.x + footprintWidth * 0.12, bottom.y + footprintDepth * 0.22)
    .lineTo(bottom.x - footprintWidth * 0.08, bottom.y + footprintDepth * 0.12);
  baseCourse.stroke({ color: 0x8f7953, alpha: 0.22, width: 1.2, cap: "round", join: "round" });

  if (id.includes("mixed-use") || id.includes("rowhome") || id.includes("lowrise")) {
    const shadeBlocks = new Graphics();
    for (let bay = -2; bay <= 2; bay += 1) {
      shadeBlocks
        .roundRect(top.x + bay * (footprintWidth * 0.11) - 4, bottom.y - footprintDepth * 0.27, 8, 4, 1.5)
        .fill({ color: trimColor, alpha: 0.18 })
        .roundRect(top.x + bay * (footprintWidth * 0.11) - 3, bottom.y - footprintDepth * 0.21, 6, 7, 1.5)
        .fill({ color: highlightColor, alpha: 0.46 });
    }
    layer.addChild(shadeBlocks);
  }

  layer.addChild(roofPanels, stuccoFacet, baseCourse);
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
    // Directional cast shadow skewed along the scene sun vector (lower-right).
    const shadowReach = prop.kind === "bush" ? 9 : 17;
    const tree = new Graphics()
      .ellipse(point.x + shadowReach, point.y - 1 + shadowReach * 0.24, prop.kind === "bush" ? 11 : 16, prop.kind === "bush" ? 3.8 : 5)
      .fill({ color: CAST_SHADOW_COLOR, alpha: 0.34 })
      .ellipse(point.x + shadowReach * 0.4, point.y - 1.5, prop.kind === "bush" ? 7 : 10, 3.2)
      .fill({ color: CAST_SHADOW_COLOR, alpha: 0.18 });
    if (prop.kind === "tree") {
      tree
        .rect(point.x - 2.4, point.y - 16, 4.8, 14)
        .fill({ color: shade, alpha: 0.95 })
        .circle(point.x - 6, point.y - 20, 8)
        .circle(point.x + 5, point.y - 22, 9)
        .circle(point.x, point.y - 29, 10)
        .fill({ color: foliage, alpha: 0.96 })
        .circle(point.x + 6, point.y - 20, 6.5)
        .fill({ color: sunlitColor(foliage, "shade"), alpha: 0.4 })
        .circle(point.x - 4, point.y - 30, 4.4)
        .fill({ color: mixColor(highlight, SUN_WARM_TINT, 0.4), alpha: 0.44 });
    } else {
      tree
        .circle(point.x - 5, point.y - 10, 6)
        .circle(point.x + 2, point.y - 13, 8)
        .circle(point.x + 8, point.y - 9, 5)
        .fill({ color: foliage, alpha: 0.92 })
        .circle(point.x + 7, point.y - 9, 4)
        .fill({ color: sunlitColor(foliage, "shade"), alpha: 0.34 })
        .circle(point.x - 3, point.y - 14, 3)
        .fill({ color: mixColor(highlight, SUN_WARM_TINT, 0.4), alpha: 0.3 });
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
  const actorPoint = actor.kind === "clawd" && actor.placeId === "place-eastvale-core" ? { x: point.x - 6, y: point.y + 20 } : point;
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
    graphic = drawSmallCarGraphic(actorPoint, actorBase, Math.abs(second.x - first.x) >= Math.abs(second.y - first.y) ? "east-west" : "north-south", {
      windowColor: highlight,
      lightColor: accent,
      outlineColor: shade,
    });
  } else if (actor.kind === "walker") {
    graphic = new Graphics()
      .ellipse(actorPoint.x, actorPoint.y - 1, 5, 2)
      .fill({ color: 0x23342e, alpha: 0.18 })
      .circle(actorPoint.x, actorPoint.y - 15, 4.4)
      .fill({ color, alpha: 0.94 })
      .roundRect(actorPoint.x - 2.6, actorPoint.y - 12, 5.2, 9, 2)
      .fill({ color: shade, alpha: 0.66 })
      .moveTo(actorPoint.x - 1, actorPoint.y - 3)
      .lineTo(actorPoint.x - 4, actorPoint.y + 2)
      .moveTo(actorPoint.x + 1, actorPoint.y - 3)
      .lineTo(actorPoint.x + 4, actorPoint.y + 1)
      .stroke({ color: shade, alpha: 0.64, width: 1.5, cap: "round" });
  } else {
    graphic = new Graphics()
      .ellipse(actorPoint.x, actorPoint.y - 3, 12, 5)
      .fill({ color: 0x23342e, alpha: 0.2 })
      .circle(actorPoint.x, actorPoint.y - 22, 9)
      .fill({ color: highlight, alpha: 0.98 })
      .stroke({ color: shade, width: 2 })
      .circle(actorPoint.x - 3, actorPoint.y - 22, 1.4)
      .circle(actorPoint.x + 3, actorPoint.y - 22, 1.4)
      .fill({ color: shade })
      .roundRect(actorPoint.x - 6, actorPoint.y - 15, 12, 10, 4)
      .fill({ color: colorToNumber(asset.palette.colors.base), alpha: 0.92 })
      .circle(actorPoint.x - 7, actorPoint.y - 28, 3)
      .circle(actorPoint.x + 7, actorPoint.y - 28, 3)
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
  const landmarkFocus = selected && place.kind === "landmark";
  const markerPoint = landmarkFocus ? { x: point.x, y: point.y + 20 } : point;
  const radius = selected ? (landmarkFocus ? 24 : 30) : hovered ? 27 : 22;
  const ring = new Graphics()
    .ellipse(markerPoint.x, markerPoint.y - 4, radius, radius * 0.48)
    .fill({ color: selected ? 0xfff2a6 : 0xffffff, alpha: landmarkFocus ? 0.2 : selected ? 0.26 : hovered ? 0.2 : 0.04 })
    .stroke({ color: selected ? 0xffe16c : hovered ? 0xffffff : 0x1f362f, alpha: selected || hovered ? 0.8 : 0.12, width: landmarkFocus ? 2.2 : selected ? 3 : 2 });
  animated.push({ target: ring, kind: "pulse", path: [], speed: 0.02, phase: place.activity, baseAlpha: selected || hovered ? 0.72 : 0.22, origin: markerPoint });
  layer.addChild(ring);

  const hit = new Graphics().circle(markerPoint.x, markerPoint.y - 12, place.hitRadius * 13).fill({ color: 0xffffff, alpha: 0.001 });
  hit.eventMode = "static";
  hit.cursor = "pointer";
  hit.on("pointertap", () => onSelectPlace(place.id));
  hit.on("pointerover", () => onHoverPlace(place.id));
  hit.on("pointerout", () => onHoverPlace(undefined));
  layer.addChild(hit);
}

function drawPin(layer: Container, pin: CityWorldPin, atlas: CityWorldAtlasResolver) {
  const point = project(pin.anchor);
  const pinPoint = offsetPinPoint(point, pin);
  const asset = atlas.resolveAsset(pin.spriteKey, pin.paletteKey, "marker");
  if (asset.mode === "sprite") {
    const sprite = new Sprite(asset.texture);
    sprite.anchor.set(asset.anchor.x, asset.anchor.y);
    sprite.scale.set(asset.scale);
    sprite.position.set(pinPoint.x, pinPoint.y + 1);
    sprite.label = `sprite-${pin.id}`;
    layer.addChild(sprite);
    return;
  }
  const color = colorToNumber(asset.palette.colors.base);
  const shade = colorToNumber(asset.palette.colors.shade);
  const highlight = colorToNumber(asset.palette.colors.highlight);
  const badge = new Graphics()
    .poly([pinPoint.x, pinPoint.y - 2, pinPoint.x - 6, pinPoint.y - 10, pinPoint.x + 6, pinPoint.y - 10], true)
    .fill({ color: shade, alpha: 0.86 })
    .circle(pinPoint.x, pinPoint.y - 18, 11)
    .fill({ color, alpha: 0.98 })
    .circle(pinPoint.x - 3.5, pinPoint.y - 22, 2.4)
    .fill({ color: highlight, alpha: 0.34 })
    .stroke({ color: shade, alpha: 0.75, width: 1.8 });
  const label = new Text({
    text: pin.kind === "note" ? "N" : stickerGlyph(pin.kind),
    style: { fill: shade, fontFamily: "Arial", fontSize: 10, fontWeight: "900" },
  });
  label.anchor.set(0.5);
  label.position.set(pinPoint.x, pinPoint.y - 18);
  layer.addChild(badge, label);
}

function offsetPinPoint(point: ProjectedPoint, pin: CityWorldPin): ProjectedPoint {
  if (pin.placeId !== "place-eastvale-core") return point;

  if (pin.kind === "note") return { x: point.x + 28, y: point.y + 2 };
  if (pin.kind === "favorite") return { x: point.x - 24, y: point.y + 5 };
  return { x: point.x + 4, y: point.y + 22 };
}

function drawPlaceLabel(layer: Container, place: CityWorldPlace, selectedPlaceId: string, hoverPlaceId: string | undefined) {
  const selected = place.id === selectedPlaceId;
  const hovered = place.id === hoverPlaceId;
  if (!selected && !hovered && place.labelPriority < 7) return;

  const point = project(place.anchor);
  const landmarkFocus = selected && place.kind === "landmark";
  const text = new Text({
    text: place.label,
    style: {
      fill: 0x1f2d28,
      fontFamily: "Arial",
      fontSize: landmarkFocus ? 12 : selected || hovered ? 13 : 11,
      fontWeight: "900",
      stroke: { color: 0xfff8e7, width: 4 },
    },
  });
  text.anchor.set(0.5);
  text.position.set(point.x + (landmarkFocus ? -28 : 0), point.y - (landmarkFocus ? 70 : selected || hovered ? 55 : 44));
  const paddingX = landmarkFocus ? 8 : 7;
  const paddingY = landmarkFocus ? 3 : 4;
  const backing = new Graphics()
    .roundRect(
      text.position.x - text.width / 2 - paddingX,
      text.position.y - text.height / 2 - paddingY,
      text.width + paddingX * 2,
      text.height + paddingY * 2,
      4,
    )
    .fill({ color: 0xfff7df, alpha: selected || hovered ? 0.78 : 0.58 })
    .stroke({ color: 0x26332c, alpha: selected || hovered ? 0.24 : 0.14, width: 1 });
  layer.addChild(backing, text);
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
  return projectCityWorldPoint(point);
}

function diamondPoints(center: ProjectedPoint, width: number, height: number): number[] {
  return cityWorldDiamondPoints(center, width, height);
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

function scaleColor(color: number, factor: number): number {
  const r = clamp(Math.round(((color >> 16) & 255) * factor), 0, 255);
  const g = clamp(Math.round(((color >> 8) & 255) * factor), 0, 255);
  const b = clamp(Math.round((color & 255) * factor), 0, 255);
  return (r << 16) + (g << 8) + b;
}

function mixColor(colorA: number, colorB: number, t: number): number {
  const ratio = clamp(t, 0, 1);
  const r = Math.round(((colorA >> 16) & 255) * (1 - ratio) + ((colorB >> 16) & 255) * ratio);
  const g = Math.round(((colorA >> 8) & 255) * (1 - ratio) + ((colorB >> 8) & 255) * ratio);
  const b = Math.round((colorA & 255) * (1 - ratio) + (colorB & 255) * ratio);
  return (r << 16) + (g << 8) + b;
}

type SunFace = "top" | "sun" | "shade";

// Single source of truth for how any surface responds to the scene sun.
function sunlitColor(color: number, face: SunFace): number {
  // Real directional key light: the sun-facing wall must be brighter than the
  // flat body, not merely un-shaded (it used to sit at factor 1.0, which is why
  // lit walls read matte). Widening the top/sun/shade spread gives every box a
  // legible light-to-shade gradient without going cartoon.
  if (face === "top") return mixColor(scaleColor(color, 1.18), SUN_WARM_TINT, 0.13);
  if (face === "sun") return mixColor(scaleColor(color, 1.12), SUN_WARM_TINT, 0.12);
  return mixColor(scaleColor(color, 0.4), SUN_COOL_TINT, 0.32);
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
