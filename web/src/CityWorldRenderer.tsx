import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Application, Container, Filter, GlProgram, Graphics, Sprite, Text } from "pixi.js";
import {
  CITY_WORLD_TILE_BASIS,
  cityWorldDiamondPoints,
  cityWorldBuildingDepthKey,
  cityWorldExpandViewportFrame,
  cityWorldFrameContainsFrame,
  cityWorldPropDepthKey,
  compareCityWorldDepthInterleaveItems,
  cityWorldScreenCenterForCamera,
  cityWorldViewportFrameForPreset,
  createCityWorldSceneWindowCompiler,
  projectCityWorldPoint,
} from "@atlas/core/voxel";
import type {
  CityWorldActor,
  CityWorldBounds,
  CityWorldBuilding,
  CityWorldGroundTone,
  CityWorldLodBand,
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
  /** Re-fit opening camera preset (full county / default view). */
  center: () => void;
  /** Pan/zoom so a world point (e.g. Census town) is framed — geo board scale UX. */
  focusPoint: (point: CityWorldPoint, zoom?: number) => void;
};

type CityWorldRendererProps = {
  scene: CityWorldScene;
  selectedPlaceId?: string | undefined;
  cameraPresetId?: CityWorldCameraPresetId | undefined;
  debugMode?: CityWorldDebugMode | undefined;
  suppressPlaceLabels?: boolean;
  onSelectPlace: (placeId: string) => void;
  /** 0.78-R: zoom-change notifications for the band controller (geo board). */
  onCameraZoom?: ((zoom: number) => void) | undefined;
  /** 0.78-R: committed band + pinned epoch threaded into windowFor. */
  bandOptions?: { committedBand?: CityWorldLodBand; chunkEpoch?: { schemaVersion: string; packHash: string } } | undefined;
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
  kind: "car" | "walker" | "water" | "cloud" | "pulse";
  path: CityWorldPoint[];
  speed: number;
  phase: number;
  baseAlpha: number;
  origin: ProjectedPoint;
};

type GeneratedSignageState = {
  count: number;
  max: number;
};

type GeneratedTreeSpecies = "round_canopy" | "conifer" | "palm";

type LayerMap = Record<
  "terrainLayer" | "roadLayer" | "lotLayer" | "padLayer" | "shadowLayer" | "buildingPropDepthLayer" | "buildingLayer" | "propLayer" | "actorLayer" | "focusLayer" | "labelLayer" | "markerLayer" | "hudBridgeLayer",
  Container
>;

type QaVisibilityProxyLayer = Container & {
  atlasProxyVisible: boolean;
  atlasVisibilityTargets: Container[];
};

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
// Max one streaming window rebuild per this interval while a finger is down
// (see requestWindowRefreshIfNeeded) — prevents pan-time rebuild storms on
// budget-clipped windows without letting the view outrun the window.
const GESTURE_WINDOW_REFRESH_INTERVAL_MS = 250;
const MATERIAL_TEXTURE_DETAIL_ZOOM = 1.55;

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
// The surround is the "table" the diorama sits on and must adopt the host
// theme (NS-3 crop test: a dark ChatGPT thread must not frame a bright
// board). The diorama itself stays the only colorful thing in both themes.
const BACKGROUND_COLOR_LIGHT = 0xa6b87c;
const BACKGROUND_COLOR_DARK = 0x22251f; // warm near-black, faint green bias

function isDarkTheme(): boolean {
  const stamped = document.documentElement.getAttribute("data-theme");
  if (stamped === "dark") return true;
  if (stamped === "light") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

// Scene-driven backdrop override (census county board): the active scene may
// carry `boardBackdrop` so its silhouette separates from the off-board void.
// Null for every scene that doesn't set it — the host-theme constants win.
let activeBoardBackdrop: { light: string; dark: string } | null = null;

function parseHexColor(hex: string | undefined): number | null {
  if (!hex) return null;
  const digits = /^#([0-9a-fA-F]{6})$/.exec(hex.trim())?.[1];
  return digits ? Number.parseInt(digits, 16) : null;
}

function resolveBackgroundColor(): number {
  const override = parseHexColor(isDarkTheme() ? activeBoardBackdrop?.dark : activeBoardBackdrop?.light);
  return override ?? (isDarkTheme() ? BACKGROUND_COLOR_DARK : BACKGROUND_COLOR_LIGHT);
}

function isFullscreenDisplayMode(): boolean {
  const openai = window.openai as ({ displayMode?: unknown } & typeof window.openai) | undefined;
  return openai?.displayMode === "fullscreen";
}

const TERRAIN_COLORS = {
  grass: 0xa3b877,
  park: 0x83aa64,
  plaza: 0xd6c49a,
  water: 0x176a9f,
  sidewalk: 0xc2c7a0,
} satisfies Record<CityWorldTerrainTile["kind"], number>;

const DRAFT_TERRAIN_COLORS = {
  grass: 0xa9b981,
  park: 0x8cab6e,
  plaza: 0xd8c599,
  water: 0x237aa4,
  sidewalk: 0xc6bd92,
} satisfies Record<CityWorldTerrainTile["kind"], number>;

const SHELL_TERRAIN_COLORS = {
  grass: 0xaeb699,
  park: 0x9dac86,
  plaza: 0xc9c2a8,
  water: 0x5b91a6,
  sidewalk: 0xbfc1ad,
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

const SHELL_LOT_COLORS = {
  home: 0xb8bea4,
  shop: 0xcac1a4,
  park: 0x9fad86,
  gym: 0xb8c1bf,
  apartments: 0xc3bba7,
  civic: 0xc8c0aa,
  waterfront: 0x9dbdc2,
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
  public: { seamAlpha: 0.3, lipAlpha: 0.2, strandAlpha: 0.56, wetAlpha: 0.42 },
  draft: { seamAlpha: 0.14, lipAlpha: 0.09, strandAlpha: 0.28, wetAlpha: 0.22 },
  shell: { seamAlpha: 0.18, lipAlpha: 0.09, strandAlpha: 0.16, wetAlpha: 0.12 },
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

    // 0.54E — highlight rolloff. Sunlit stucco and lit roofs ride near-white
    // luma and used to blow out into one paper tone; compressing the top of
    // the range keeps their form (rims, material fields, tint spreads)
    // legible while the scene still reads sunlit. This is the single biggest
    // wash fix and applies to every scene the engine serves.
    float luma = dot(c, vec3(0.299, 0.587, 0.114));
    c *= mix(1.0, 0.93, smoothstep(0.76, 1.0, luma));

    // Gentler saturation trim: calm SoCal palette, but material identity
    // (clay vs metal vs glass, per-home tint spread) survives the grade.
    luma = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(luma), c, 1.06);

    // Golden-hour split tone: warm sunlit highlights, cool shadows.
    vec3 warm = vec3(1.07, 1.015, 0.895);
    vec3 cool = vec3(0.905, 0.968, 1.09);
    c *= mix(cool, warm, smoothstep(0.12, 0.88, luma));

    // Soft vignette pulls focus to the district.
    vec2 p = vFrameCoord - 0.5;
    float radius = dot(p, p);
    float vignette = mix(0.86, 1.0, smoothstep(0.62, 0.12, radius));
    c *= vignette;

    // Light atmospheric haze toward a warm sky tone at the frame edges — kept
    // to the outer corners only so it frames without flattening the district.
    float haze = smoothstep(0.34, 0.66, radius);
    c = mix(c, vec3(0.965, 0.935, 0.79), haze * 0.045);

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
  { scene, selectedPlaceId, cameraPresetId, debugMode, suppressPlaceLabels = false, onSelectPlace, onCameraZoom, bandOptions },
  ref,
) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onCameraZoomRef = useRef(onCameraZoom);
  onCameraZoomRef.current = onCameraZoom;
  const lastZoomNotifiedRef = useRef<number | null>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const sceneRef = useRef(scene);
  const cameraRef = useRef<CameraState>({ x: 0, y: 0, zoom: 1, minZoom: 0.6, maxZoom: 1.8 });
  const animatedRef = useRef<AnimatedTarget[]>([]);
  const movedRef = useRef(false);
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  // Touch-feel pass: cumulative tap-slop origin, flick velocity samples, the
  // live inertia animation, and the deferred material-texture rebuild flag
  // (crossing the 1.55 texture gate mid-gesture must not hitch the gesture).
  const gestureOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const velocitySamplesRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const inertiaFrameRef = useRef<number | null>(null);
  const pendingMaterialRefreshRef = useRef(false);
  // Budget-clipped windows (heaviest generated mobile scenes) can leave near-
  // zero streaming margin, so an un-throttled pan rebuilds the window several
  // times per gesture. While fingers are down, allow at most one streaming
  // rebuild per interval and flush the rest on release.
  const pendingGestureWindowRefreshRef = useRef(false);
  const lastGestureWindowRefreshRef = useRef(0);
  const wheelZoomArmedRef = useRef(false);
  const themeCleanupRef = useRef<(() => void) | null>(null);
  const backdropRepaintRef = useRef<(() => void) | null>(null);
  const selectPlaceRef = useRef(onSelectPlace);
  const activeWindowFrameRef = useRef<CityWorldViewportFrame | null>(null);
  const pendingWindowRefreshRef = useRef(false);
  // 0.67H interaction hardening (ported through the 0.75R merge): camera
  // applies coalesce to one rAF per frame, and the rebuild counter is exposed
  // for the mobile-interaction browser proof.
  const cameraFrameRef = useRef<number | null>(null);
  const rebuildCountRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [hoverPlaceId, setHoverPlaceId] = useState<string | undefined>();
  const [atlasTextures, setAtlasTextures] = useState<CityWorldTextureMap>({});
  const [windowRefreshKey, setWindowRefreshKey] = useState(0);
  // Perf counters surfaced on __ATLAS_QA__.perf so browser verifiers can gate
  // "hover must not rebuild the scene" and "idle must not render".
  const perfRef = useRef({ sceneRebuilds: 0, lastRebuildMs: 0, overlayRedraws: 0, renderedFrames: 0, streamingRefreshFired: 0, streamingRefreshDeferred: 0 });
  // Focus-overlay animations (selection pulse) live apart from scene ambient
  // animations so the overlay can clear its own targets without touching the
  // scene's, and vice versa.
  const focusAnimatedRef = useRef<AnimatedTarget[]>([]);
  // Render-on-demand state: the loop runs only while a repaint is pending or
  // animated targets exist, then parks at 0 fps. Ambient animation is capped
  // at ~30fps (wall-clock driven, so speed is unchanged — only sample rate).
  const renderLoopRef = useRef({ active: false, needsRender: true, lastAnimTick: 0 });
  const focusIndexRef = useRef<FocusIndex | null>(null);
  const focusLayerRef = useRef<Container | null>(null);
  const focusPulseTimeoutRef = useRef<number | undefined>(undefined);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const visibilityCleanupRef = useRef<(() => void) | null>(null);
  const [focusEpoch, setFocusEpoch] = useState(0);

  function invalidateRender() {
    renderLoopRef.current.needsRender = true;
    ensureRenderLoop();
  }

  function ensureRenderLoop() {
    const loop = renderLoopRef.current;
    if (loop.active) return;
    loop.active = true;
    requestAnimationFrame(renderFrame);
  }

  function renderFrame() {
    const loop = renderLoopRef.current;
    const app = appRef.current;
    if (!app || !app.renderer) {
      loop.active = false;
      return;
    }
    const animating = !reducedMotionRef.current && animatedRef.current.length + focusAnimatedRef.current.length > 0 && !document.hidden;
    // Wall-clock cap: rAF timestamps are virtualized in headless/BeginFrame
    // environments, so the ambient 30fps gate keys off performance.now().
    const now = performance.now();
    const animDue = animating && now - loop.lastAnimTick >= 33;
    if (loop.needsRender || animDue) {
      if (animating) {
        animateTargets(animatedRef.current, 2);
        animateTargets(focusAnimatedRef.current, 2);
        loop.lastAnimTick = now;
      }
      app.render();
      loop.needsRender = false;
      perfRef.current.renderedFrames += 1;
    }
    if (animating || loop.needsRender) requestAnimationFrame(renderFrame);
    else loop.active = false;
  }

  useImperativeHandle(ref, () => ({
    zoomIn: () => zoomBy(1.12),
    zoomOut: () => zoomBy(0.88),
    center: () => resetCamera(sceneRef.current),
    focusPoint: (point, zoom) => focusWorldPoint(point, zoom),
  }));

  useEffect(() => {
    selectPlaceRef.current = onSelectPlace;
  }, [onSelectPlace]);

  useEffect(() => {
    sceneRef.current = scene;
    // Adopt (or clear) the scene's backdrop before the world rebuild reads
    // the background, then repaint the surround if Pixi is already mounted.
    activeBoardBackdrop = scene?.boardBackdrop ?? null;
    backdropRepaintRef.current?.();
  }, [scene]);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const applyReducedMotionPreference = (matches: boolean) => {
      const changed = reducedMotionRef.current !== matches;
      reducedMotionRef.current = matches;
      if (matches) {
        if (inertiaFrameRef.current !== null) {
          window.cancelAnimationFrame(inertiaFrameRef.current);
          inertiaFrameRef.current = null;
        }
        settleAnimatedTargets(animatedRef.current);
        settleFocusPulseTargets();
      }
      if (changed) {
        setFocusEpoch((epoch) => epoch + 1);
        invalidateRender();
      }
    };
    applyReducedMotionPreference(reducedMotionQuery?.matches ?? false);
    if (!reducedMotionQuery) return;
    const handleReducedMotionChange = (event: MediaQueryListEvent) => applyReducedMotionPreference(event.matches);
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    return () => reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
  }, []);

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
    // The renderer owns touch pan/pinch after a pointer starts; keeping this
    // on the canvas mount avoids browser gesture negotiation mid-drag.
    mountElement.style.touchAction = "none";

    const app = new Application();
    appRef.current = app;
    let cancelled = false;
    let initComplete = false;
    let destroyed = false;
    const destroyApp = () => {
      if (destroyed) return;
      destroyed = true;
      themeCleanupRef.current?.();
      themeCleanupRef.current = null;
      app.destroy({ removeView: true }, { children: true });
    };

    async function initPixi() {
      await app.init({
        autoDensity: true,
        antialias: true,
        background: resolveBackgroundColor(),
        preference: "webgl",
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        resizeTo: mountElement,
      });
      initComplete = true;

      if (cancelled) {
        destroyApp();
        return;
      }

      app.canvas.className = "city-world-canvas";
      app.canvas.style.touchAction = "none";
      mountElement.appendChild(app.canvas);
      // Backdrop lives inside the stage so the post grade (vignette/haze)
      // covers the open ground beyond the streamed tile window too.
      const backdrop = new Graphics();
      const paintBackdrop = () => {
        backdrop.clear().rect(0, 0, app.screen.width + 2, app.screen.height + 2).fill({ color: resolveBackgroundColor() });
      };
      paintBackdrop();
      app.renderer.on("resize", paintBackdrop);
      app.stage.addChild(backdrop);
      // Live theme changes (host pushes openai:set_globals; OS toggles flip
      // prefers-color-scheme) repaint the surround without a scene rebuild.
      const onThemeChange = () => {
        paintBackdrop();
        invalidateRender();
      };
      // Scene swaps repaint through the same path (a scene may carry its own
      // boardBackdrop — the census county board does).
      backdropRepaintRef.current = onThemeChange;
      window.addEventListener("openai:set_globals", onThemeChange, { passive: true });
      const darkQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
      darkQuery?.addEventListener?.("change", onThemeChange);
      themeCleanupRef.current = () => {
        backdropRepaintRef.current = null;
        window.removeEventListener("openai:set_globals", onThemeChange);
        darkQuery?.removeEventListener?.("change", onThemeChange);
      };
      const world = new Container();
      world.sortableChildren = true;
      worldRef.current = world;
      app.stage.addChild(world);
      // QA hook: verifiers and browser QA sessions bisect draw layers through
      // this handle (e.g. hide propLayer to attribute a visual artifact) and
      // gate perf behavior through the counters.
      const countGraphics = (container: Container): number =>
        container.children.reduce((sum, child) => sum + 1 + (child instanceof Container ? countGraphics(child) : 0), 0);
      (window as unknown as Record<string, unknown>).__ATLAS_QA__ = {
        app,
        world,
        perf: {
          get sceneRebuilds() { return perfRef.current.sceneRebuilds; },
          get lastRebuildMs() { return perfRef.current.lastRebuildMs; },
          get overlayRedraws() { return perfRef.current.overlayRedraws; },
          get renderedFrames() { return perfRef.current.renderedFrames; },
          animatedTargetCount: () => animatedRef.current.length + focusAnimatedRef.current.length,
          loopParked: () => !renderLoopRef.current.active,
          graphicsCount: () => countGraphics(world),
          get streamingRefreshFired() { return perfRef.current.streamingRefreshFired; },
          get streamingRefreshDeferred() { return perfRef.current.streamingRefreshDeferred; },
        },
      };
      try {
        app.stage.filters = [createAtlasGradeFilter()];
        app.stage.filterArea = app.screen;
      } catch (error) {
        console.warn("Atlas golden-hour grade filter unavailable. Continuing without post grade.", error);
      }
      // Render on demand: stop Pixi's always-on ticker render; the component-
      // owned rAF loop repaints only when dirty or animating, then parks.
      app.stop();
      const resizeObserver = new ResizeObserver(() => {
        app.resize();
        invalidateRender();
      });
      resizeObserver.observe(mountElement);
      resizeObserverRef.current = resizeObserver;
      const handleVisibility = () => {
        if (!document.hidden) invalidateRender();
      };
      document.addEventListener("visibilitychange", handleVisibility);
      visibilityCleanupRef.current = () => document.removeEventListener("visibilitychange", handleVisibility);
      invalidateRender();
      setReady(true);
    }

    void initPixi().catch((error) => {
      console.warn("CityWorldRenderer failed to initialize Pixi.", error);
    });

    return () => {
      cancelled = true;
      setReady(false);
      animatedRef.current = [];
      focusAnimatedRef.current = [];
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      visibilityCleanupRef.current?.();
      visibilityCleanupRef.current = null;
      worldRef.current = null;
      appRef.current = null;
      if (cameraFrameRef.current !== null) {
        window.cancelAnimationFrame(cameraFrameRef.current);
        cameraFrameRef.current = null;
      }
      // Destroying before app.init() settles crashes Pixi's resize plugin
      // (_cancelResize is not installed yet). When init is still in flight,
      // the cancelled branch inside initPixi destroys after init resolves.
      if (initComplete) destroyApp();
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    activeWindowFrameRef.current = null;
    pendingWindowRefreshRef.current = false;

    // Touch-feel constants: cumulative tap slop (a slightly wobbly finger tap
    // must stay a tap), flick velocity floor, and inertia decay per 16.7ms.
    const TAP_SLOP_PX = 8;
    const FLICK_MIN_SPEED = 0.25; // px/ms
    const FLICK_SAMPLE_WINDOW_MS = 100;
    const INERTIA_DECAY = 0.94;
    const INERTIA_STOP_SPEED = 0.02;

    const cancelInertia = () => {
      if (inertiaFrameRef.current !== null) {
        window.cancelAnimationFrame(inertiaFrameRef.current);
        inertiaFrameRef.current = null;
      }
    };
    const startInertia = (vx: number, vy: number) => {
      cancelInertia();
      let lastT = performance.now();
      let velocityX = vx;
      let velocityY = vy;
      const step = (now: number) => {
        // Keep inertiaFrameRef non-null for the whole coast — applyCameraNow's
        // streaming-refresh throttle reads isGestureActive() mid-step, and
        // nulling here would bypass it every frame (rebuild storm).
        const dt = Math.min(48, now - lastT);
        lastT = now;
        const decay = Math.pow(INERTIA_DECAY, dt / 16.7);
        velocityX *= decay;
        velocityY *= decay;
        if (Math.hypot(velocityX, velocityY) < INERTIA_STOP_SPEED) {
          inertiaFrameRef.current = null;
          flushPendingMaterialRefresh();
          return;
        }
        cameraRef.current.x += velocityX * dt;
        cameraRef.current.y += velocityY * dt;
        applyCameraNow();
        inertiaFrameRef.current = window.requestAnimationFrame(step);
      };
      inertiaFrameRef.current = window.requestAnimationFrame(step);
    };
    const pinchMidpoint = () => {
      const [first, second] = [...activePointersRef.current.values()];
      if (!first || !second) return null;
      return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    };
    const trackVelocity = (x: number, y: number) => {
      const now = performance.now();
      const samples = velocitySamplesRef.current;
      samples.push({ x, y, t: now });
      while (samples.length > 6 || (samples.length > 1 && now - (samples[0]?.t ?? now) > FLICK_SAMPLE_WINDOW_MS)) samples.shift();
    };
    const releaseVelocity = (): { vx: number; vy: number } | null => {
      if (reducedMotionRef.current) return null;
      const samples = velocitySamplesRef.current;
      const last = samples[samples.length - 1];
      const first = samples[0];
      if (!first || !last || first === last) return null;
      // A real flick is many move events over real time. Two samples over a
      // few ms (synthetic pans, twitchy releases) produce garbage velocities
      // that turn a nudge into a runaway coast.
      if (samples.length < 3) return null;
      const dt = last.t - first.t;
      if (dt < 30 || performance.now() - last.t > 80) return null;
      const vx = (last.x - first.x) / dt;
      const vy = (last.y - first.y) / dt;
      const speed = Math.hypot(vx, vy);
      if (speed < FLICK_MIN_SPEED) return null;
      // Cap the coast: beyond ~1.5px/ms the decay tail crosses several window
      // margins and streams rebuilds for no user-visible benefit.
      const scale = Math.min(1, 1.5 / speed);
      return { vx: vx * scale, vy: vy * scale };
    };

    const handleWheel = (event: WheelEvent) => {
      if (!wheelZoomArmedRef.current && !isFullscreenDisplayMode()) return;
      event.preventDefault();
      // Anchor to the cursor so wheel zoom dives toward what's pointed at.
      setCameraZoomAnchored(cameraRef.current.zoom * (event.deltaY > 0 ? 0.92 : 1.08), event.clientX, event.clientY);
    };
    const handleWidgetEngagement = () => {
      wheelZoomArmedRef.current = true;
    };
    const handlePointerDown = (event: PointerEvent) => {
      handleWidgetEngagement();
      cancelInertia();
      activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      dragRef.current = { active: true, x: event.clientX, y: event.clientY };
      gestureOriginRef.current = { x: event.clientX, y: event.clientY };
      velocitySamplesRef.current = [{ x: event.clientX, y: event.clientY, t: performance.now() }];
      movedRef.current = false;
      try {
        mount.setPointerCapture?.(event.pointerId);
      } catch {
        // Synthetic browser-proof events may not register as active pointers.
      }
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
        // Anchor the zoom at the finger midpoint, not the preset center.
        const midpoint = pinchMidpoint();
        const nextZoom = pinchRef.current.zoom * (distance / pinchRef.current.distance);
        if (midpoint) setCameraZoomAnchored(nextZoom, midpoint.x, midpoint.y);
        else setCameraZoom(nextZoom);
        return;
      }

      if (!dragRef.current.active) {
        // Hover is a mouse concept; touch move outside a drag is noise.
        if (event.pointerType === "touch") return;
        setHoverPlaceId((current) => {
          const next = findHitPlace(event.clientX, event.clientY);
          return current === next ? current : next;
        });
        return;
      }

      const dx = event.clientX - dragRef.current.x;
      const dy = event.clientY - dragRef.current.y;
      // Cumulative slop from the gesture origin — per-event jitter must not
      // turn a tap into a pan.
      if (Math.hypot(event.clientX - gestureOriginRef.current.x, event.clientY - gestureOriginRef.current.y) > TAP_SLOP_PX) {
        movedRef.current = true;
      }
      dragRef.current = { active: true, x: event.clientX, y: event.clientY };
      if (movedRef.current) {
        cameraRef.current.x += dx;
        cameraRef.current.y += dy;
        trackVelocity(event.clientX, event.clientY);
        scheduleCameraApply();
      }
    };
    const handlePointerUp = (event: PointerEvent) => {
      const wasPinching = pinchRef.current !== null;
      if (!movedRef.current) {
        const placeId = findHitPlace(event.clientX, event.clientY);
        if (placeId) selectPlaceRef.current(placeId);
      }
      activePointersRef.current.delete(event.pointerId);
      if (activePointersRef.current.size < 2) pinchRef.current = null;
      const survivor = [...activePointersRef.current.values()][0];
      if (survivor) {
        // A pinch finger lifted while another stays down: re-anchor the drag
        // to the surviving pointer so the map does not jump on the next move.
        dragRef.current = { active: true, x: survivor.x, y: survivor.y };
        gestureOriginRef.current = { x: survivor.x, y: survivor.y };
        velocitySamplesRef.current = [];
      } else {
        dragRef.current.active = false;
        if (movedRef.current && !wasPinching) {
          const flick = releaseVelocity();
          if (flick) startInertia(flick.vx, flick.vy);
        }
        velocitySamplesRef.current = [];
        flushPendingMaterialRefresh();
      }
      try {
        mount.releasePointerCapture?.(event.pointerId);
      } catch {
        // Ignore release calls for synthetic or already-released pointers.
      }
    };
    const handlePointerCancel = (event: PointerEvent) => {
      activePointersRef.current.delete(event.pointerId);
      if (activePointersRef.current.size < 2) pinchRef.current = null;
      dragRef.current.active = false;
      velocitySamplesRef.current = [];
      flushPendingMaterialRefresh();
      try {
        mount.releasePointerCapture?.(event.pointerId);
      } catch {
        // Ignore release calls for synthetic or already-released pointers.
      }
    };

    window.addEventListener("pointerdown", handleWidgetEngagement, { capture: true, passive: true });
    window.addEventListener("focusin", handleWidgetEngagement, true);
    mount.addEventListener("wheel", handleWheel, { passive: false });
    mount.addEventListener("pointerdown", handlePointerDown);
    mount.addEventListener("pointermove", handlePointerMove);
    mount.addEventListener("pointerup", handlePointerUp);
    mount.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      cancelInertia();
      window.removeEventListener("pointerdown", handleWidgetEngagement, true);
      window.removeEventListener("focusin", handleWidgetEngagement, true);
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
    const rebuildStart = performance.now();
    // Band controller notification: every zoom path (wheel, pinch, buttons)
    // funnels through this rebuild effect, so a value-compare here is the
    // single notify point. Only on CHANGE — repeat notifies would hold the
    // controller's gesture open and starve the wheel-idle settle.
    if (onCameraZoomRef.current && cameraRef.current.zoom !== lastZoomNotifiedRef.current) {
      lastZoomNotifiedRef.current = cameraRef.current.zoom;
      onCameraZoomRef.current(cameraRef.current.zoom);
    }
    const drawn = drawScene(world, scene, activeCameraPresetId, viewportFrame, cameraRef.current.zoom, atlasTextures, debugMode, suppressPlaceLabels, (placeId) => {
      if (!movedRef.current) selectPlaceRef.current(placeId);
    }, setHoverPlaceId, animatedRef.current, bandOptions);
    if (reducedMotionRef.current) settleAnimatedTargets(animatedRef.current);
    perfRef.current.sceneRebuilds += 1;
    perfRef.current.lastRebuildMs = Math.round((performance.now() - rebuildStart) * 10) / 10;
    const qaHandle = (window as unknown as Record<string, unknown>).__ATLAS_QA__ as Record<string, unknown> | undefined;
    if (qaHandle) qaHandle.scene = scene;
    activeWindowFrameRef.current = drawn.frame;
    focusIndexRef.current = drawn.focus;
    focusLayerRef.current = (world.children.find((child) => child.label === "focusLayer") as Container | undefined) ?? null;
    setFocusEpoch((epoch) => epoch + 1);
    // 0.67H — expose the rebuild count for the mobile-interaction browser proof.
    const nextRebuildCount = rebuildCountRef.current + 1;
    rebuildCountRef.current = nextRebuildCount;
    mount.dataset.qaCityWorldRebuildCount = String(nextRebuildCount);
    (window as Window & { __atlasCityWorldRebuildCount?: number }).__atlasCityWorldRebuildCount = nextRebuildCount;
    applyCameraNow();
    invalidateRender();
    // Hover/selection deliberately absent: focus changes redraw ONLY the
    // focus overlay effect below, never this full scene rebuild.
  }, [atlasTextures, bandOptions, cameraPresetId, debugMode, ready, scene, suppressPlaceLabels, windowRefreshKey]);

  useEffect(() => {
    if (!ready) return;
    const layer = focusLayerRef.current;
    if (!layer) return;
    for (const child of layer.removeChildren()) child.destroy({ children: true });
    focusAnimatedRef.current.length = 0;
    const focus = focusIndexRef.current;
    if (!focus) return;
    const labelLayer = worldRef.current?.children.find((child) => child.label === "labelLayer") as Container | undefined;
    if (labelLayer) for (const child of labelLayer.children) child.visible = true;
    const effectiveSelected = selectedPlaceId ?? sceneRef.current.hudDefaults.selectedPlaceId;
    const focusTargets: Array<{ placeId: string | undefined; mode: FocusMode }> = [
      { placeId: effectiveSelected, mode: "selected" },
    ];
    if (hoverPlaceId && hoverPlaceId !== effectiveSelected) focusTargets.push({ placeId: hoverPlaceId, mode: "hovered" });
    for (const { placeId, mode } of focusTargets) {
      if (!placeId || !focus.drawnPlaceIds.has(placeId)) continue;
      const place = focus.placesById.get(placeId);
      if (!place) continue;
      // The emphasized focus label replaces the neutral base label.
      if (labelLayer) {
        const baseLabel = labelLayer.children.find((child) => child.label === `place-label-${placeId}`);
        if (baseLabel) baseLabel.visible = false;
      }
      drawFocusOverlay(layer, place, focus, mode, focusAnimatedRef.current);
    }
    perfRef.current.overlayRedraws += 1;
    // The focus pulse runs briefly, then freezes so the render loop can park:
    // a permanent default selection must not pin the widget at 30fps forever.
    if (focusPulseTimeoutRef.current !== undefined) {
      window.clearTimeout(focusPulseTimeoutRef.current);
      focusPulseTimeoutRef.current = undefined;
    }
    if (reducedMotionRef.current) {
      settleFocusPulseTargets();
      invalidateRender();
      return;
    }
    if (focusAnimatedRef.current.length > 0) {
      focusPulseTimeoutRef.current = window.setTimeout(() => {
        settleFocusPulseTargets();
        invalidateRender();
      }, 4000);
    }
    invalidateRender();
  }, [hoverPlaceId, selectedPlaceId, ready, focusEpoch]);

  function zoomBy(multiplier: number) {
    const camera = cameraRef.current;
    setCameraZoom(camera.zoom * multiplier);
  }

  function isGestureActive(): boolean {
    // Inertia counts: the coast is machine-driven gesture motion, and its
    // streaming refreshes must obey the same throttle as finger motion.
    return dragRef.current.active || pinchRef.current !== null || inertiaFrameRef.current !== null;
  }

  function handleMaterialTextureCrossing(previousZoom: number) {
    if (shouldDrawMaterialTexture(previousZoom) === shouldDrawMaterialTexture(cameraRef.current.zoom)) return;
    // Deferred while a finger is still down: the full window rebuild the
    // texture gate requires would hitch the live gesture. Flushed on release.
    if (isGestureActive()) {
      pendingMaterialRefreshRef.current = true;
      return;
    }
    setWindowRefreshKey((value) => value + 1);
  }

  function flushPendingMaterialRefresh() {
    if (isGestureActive()) return;
    if (!pendingMaterialRefreshRef.current && !pendingGestureWindowRefreshRef.current) return;
    pendingMaterialRefreshRef.current = false;
    pendingGestureWindowRefreshRef.current = false;
    setWindowRefreshKey((value) => value + 1);
  }

  function setCameraZoom(nextZoom: number) {
    const camera = cameraRef.current;
    const previousZoom = camera.zoom;
    camera.zoom = clamp(nextZoom, camera.minZoom, camera.maxZoom);
    scheduleCameraApply();
    handleMaterialTextureCrossing(previousZoom);
  }

  /** Frame a world-space point (Census town anchor) for board scale UX. */
  function focusWorldPoint(point: CityWorldPoint, preferredZoom?: number) {
    const mount = mountRef.current;
    if (!mount) return;
    if (inertiaFrameRef.current !== null) {
      window.cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
    const camera = cameraRef.current;
    const previousZoom = camera.zoom;
    // Town detail: pull in from county fit, but never past maxZoom.
    const townZoom = preferredZoom ?? Math.min(camera.maxZoom, Math.max(1.45, camera.zoom * 1.35, 1.45));
    const nextZoom = clamp(townZoom, camera.minZoom, camera.maxZoom);
    const focus = project(point);
    camera.zoom = nextZoom;
    camera.x = mount.clientWidth / 2 - focus.x * nextZoom;
    camera.y = mount.clientHeight / 2 - focus.y * nextZoom - 18;
    scheduleCameraApply();
    handleMaterialTextureCrossing(previousZoom);
    if (onCameraZoomRef.current && nextZoom !== lastZoomNotifiedRef.current) {
      lastZoomNotifiedRef.current = nextZoom;
      onCameraZoomRef.current(nextZoom);
    }
  }

  // Zoom keeping the world point under the given client position fixed —
  // pinch stays anchored to the fingers, wheel to the cursor (screen-center
  // zoom on a phone reads as the map sliding out from under the gesture).
  function setCameraZoomAnchored(nextZoom: number, clientX: number, clientY: number) {
    const mount = mountRef.current;
    if (!mount) {
      setCameraZoom(nextZoom);
      return;
    }
    const camera = cameraRef.current;
    const previousZoom = camera.zoom;
    const clamped = clamp(nextZoom, camera.minZoom, camera.maxZoom);
    if (clamped === previousZoom) return;
    const rect = mount.getBoundingClientRect();
    const anchorX = clientX - rect.left;
    const anchorY = clientY - rect.top;
    const worldX = (anchorX - camera.x) / previousZoom;
    const worldY = (anchorY - camera.y) / previousZoom;
    camera.zoom = clamped;
    camera.x = anchorX - worldX * clamped;
    camera.y = anchorY - worldY * clamped;
    scheduleCameraApply();
    handleMaterialTextureCrossing(previousZoom);
  }

  function resetCamera(nextScene: CityWorldScene) {
    const mount = mountRef.current;
    const world = worldRef.current;
    if (!mount || !world) return;
    // A scene/preset switch owns the camera — stop any in-flight flick.
    if (inertiaFrameRef.current !== null) {
      window.cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
    if (reducedMotionRef.current && cameraFrameRef.current !== null) {
      window.cancelAnimationFrame(cameraFrameRef.current);
      cameraFrameRef.current = null;
    }
    pendingMaterialRefreshRef.current = false;
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
    applyCameraNow();
  }

  // 0.67H — pointer-driven camera changes coalesce to one apply per animation
  // frame so a burst of pointermove events cannot stack synchronous work.
  function scheduleCameraApply() {
    if (cameraFrameRef.current !== null) return;
    cameraFrameRef.current = window.requestAnimationFrame(() => {
      cameraFrameRef.current = null;
      applyCameraNow();
    });
  }

  function applyCameraNow() {
    const world = worldRef.current;
    if (!world) return;
    const camera = cameraRef.current;
    world.scale.set(camera.zoom);
    world.position.set(camera.x, camera.y);
    requestWindowRefreshIfNeeded();
    invalidateRender();
  }

  function settleAnimatedTargets(targets: AnimatedTarget[]) {
    for (const item of targets) {
      item.target.position.set(0, 0);
      item.target.alpha = item.baseAlpha;
    }
  }

  function settleFocusPulseTargets() {
    if (focusPulseTimeoutRef.current !== undefined) {
      window.clearTimeout(focusPulseTimeoutRef.current);
      focusPulseTimeoutRef.current = undefined;
    }
    settleAnimatedTargets(focusAnimatedRef.current);
    focusAnimatedRef.current.length = 0;
  }

  function requestWindowRefreshIfNeeded() {
    const mount = mountRef.current;
    const activeFrame = activeWindowFrameRef.current;
    if (!mount || !activeFrame || pendingWindowRefreshRef.current) return;
    const activeCameraPresetId = resolveCameraPresetId(sceneRef.current, cameraPresetId, mount.clientWidth);
    const neededFrame = rendererViewportFrame(mount, cameraRef.current, activeCameraPresetId, STREAMING_REFRESH_MARGIN_TILES);
    if (cityWorldFrameContainsFrame(activeFrame, neededFrame)) return;
    // Gesture throttle: budget-clipped windows can demand a refresh on nearly
    // every pan step. While a finger is down, honor at most one streaming
    // rebuild per interval; the rest coalesce into one flush on release.
    if (isGestureActive()) {
      const now = performance.now();
      if (now - lastGestureWindowRefreshRef.current < GESTURE_WINDOW_REFRESH_INTERVAL_MS) {
        pendingGestureWindowRefreshRef.current = true;
        perfRef.current.streamingRefreshDeferred += 1;
        return;
      }
      lastGestureWindowRefreshRef.current = now;
    }
    perfRef.current.streamingRefreshFired += 1;
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

  return (
    <div
      ref={mountRef}
      className="city-world-renderer"
      aria-label={cityWorldRendererLabel(scene)}
      data-qa-place-labels={suppressPlaceLabels ? "suppressed" : "visible"}
    />
  );
});

function cityWorldRendererLabel(scene: CityWorldScene): string {
  const mapLabel = scene.coverage && !scene.coverage.playable ? `${scene.region.county} county preview` : scene.region.district;
  return `${mapLabel} voxel city map`;
}

function pointerDistance(pointers: Map<number, { x: number; y: number }>): number | undefined {
  if (pointers.size < 2) return undefined;
  const pair = Array.from(pointers.values()).slice(0, 2);
  const first = pair[0];
  const second = pair[1];
  if (!first || !second) return undefined;
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function squaredDistance(first: ProjectedPoint, second: ProjectedPoint): number {
  const dx = first.x - second.x;
  const dy = first.y - second.y;
  return dx * dx + dy * dy;
}

// Everything the incremental focus overlay needs to redraw hover/selection
// without touching the base scene: visible places, their anchored buildings,
// and the label crown lifts, captured at scene-rebuild time.
type FocusIndex = {
  placesById: Map<string, CityWorldPlace>;
  buildingsByPlaceId: Map<string, CityWorldBuilding[]>;
  crownLift: Map<string, number>;
  drawnPlaceIds: Set<string>;
};

// Frame-independent scene-window artifacts are memoized per scene object +
// option set: createCityWorldSceneWindowCompiler wraps the same compile as
// compileCityWorldSceneWindow but only re-runs the frame filter on streaming
// pan refreshes.
const sceneWindowCompilerCache = new WeakMap<CityWorldScene, Map<string, ReturnType<typeof createCityWorldSceneWindowCompiler>>>();

function sceneWindowCompilerFor(scene: CityWorldScene, includeLabels: boolean, includeDebug: boolean) {
  let byOptions = sceneWindowCompilerCache.get(scene);
  if (!byOptions) {
    byOptions = new Map();
    sceneWindowCompilerCache.set(scene, byOptions);
  }
  const key = `${includeLabels}:${includeDebug}`;
  let compiler = byOptions.get(key);
  if (!compiler) {
    compiler = createCityWorldSceneWindowCompiler(scene, { includeLabels, includeDebug });
    byOptions.set(key, compiler);
  }
  return compiler;
}

function drawScene(
  world: Container,
  scene: CityWorldScene,
  cameraPresetId: CityWorldCameraPresetId,
  viewportFrame: CityWorldViewportFrame,
  cameraZoom: number,
  atlasTextures: CityWorldTextureMap,
  debugMode: CityWorldDebugMode | undefined,
  suppressPlaceLabels: boolean,
  onSelectPlace: (placeId: string) => void,
  onHoverPlace: (placeId: string | undefined) => void,
  animated: AnimatedTarget[],
  bandOptions?: { committedBand?: CityWorldLodBand; chunkEpoch?: { schemaVersion: string; packHash: string } },
): { frame: CityWorldViewportFrame; focus: FocusIndex } {
  const previousChildren = world.removeChildren();
  for (const child of previousChildren) {
    child.destroy({ children: true });
  }
  animated.length = 0;

  const layers = createLayers();
  Object.values(layers).forEach((layer) => world.addChild(layer));
  const atlas = createCityWorldAtlasResolver(scene, atlasTextures);
  const includeLabels = !suppressPlaceLabels && !shouldHideCityWorldLabels();
  const compiler = sceneWindowCompilerFor(scene, includeLabels, debugMode === "engine");
  const sceneWindow = compiler.windowFor(cameraPresetId, viewportFrame, bandOptions);
  const itemIndex = compiler.itemIndex;
  const renderCommands = sceneWindow.visibleCommands;

  // Ground layers merge into a few depth-band Graphics (band = floor((x+y)/4)):
  // bands partition painter depth, so adding bands in ascending order with
  // in-band call order preserved is exactly order-safe — and drops thousands
  // of per-tile/per-lot Graphics to ~dozens.
  drawBoardEdgeFade(layers.terrainLayer, scene.bounds);
  drawBanded(layers.terrainLayer, orderedSceneItems(renderCommands, "terrain_tile", itemIndex.terrainTiles), (g, tile) => drawTerrainTile(g, tile, atlas));
  drawRoadNetwork(layers.roadLayer, orderedSceneItems(renderCommands, "road_segment", itemIndex.roadSegments));
  drawBanded(layers.lotLayer, orderedSceneItems(renderCommands, "lot", itemIndex.lots), (g, lot) => drawLot(g, lot));

  const buildings = orderedSceneItems(renderCommands, "building", itemIndex.buildings);
  // 0.67H focal calm — props inside the focal anchor's ring dim toward
  // ambience so the hero building's face separation stays the loudest read.
  // The base scene is focus-agnostic (0.74F), so the focal anchor keys off
  // the scene's default selection, not live hover state. Threaded through
  // the 0.75C depth-interleaved draw so calm and correct occlusion compose.
  const focalAnchor = focalPlaceAnchor(scene, scene.hudDefaults.selectedPlaceId);
  const props = orderedSceneItems(renderCommands, "prop", itemIndex.props);
  drawDepthInterleavedBuildingsAndProps(layers, buildings, props, animated, atlas, shouldDrawMaterialTexture(cameraZoom), (prop) =>
    focalCalm(prop.position, focalAnchor),
  );
  const actors = orderedSceneItems(renderCommands, "actor", itemIndex.actors);
  for (const actor of actors) drawActor(layers.actorLayer, actor, animated, atlas, focalCalm(actor.position, focalAnchor));
  // Note badge counts: one aggregated note pin per place (compiler/session).
  const noteCountByPlaceId = new Map<string, number>();
  for (const pin of scene.pins) {
    if (pin.kind !== "note") continue;
    const match = /^(\d+)\s+notes?$/i.exec(pin.label.trim());
    noteCountByPlaceId.set(pin.placeId, match ? Number(match[1]) : 1);
  }
  const visiblePlaces = orderedSceneItems(renderCommands, "place_marker", itemIndex.places);
  for (const place of visiblePlaces) {
    drawPlaceMarker(layers, place, onSelectPlace, onHoverPlace, cameraZoom, noteCountByPlaceId.get(place.id) ?? 0);
  }
  for (const pin of orderedSceneItems(renderCommands, "pin", itemIndex.pins)) drawPin(layers.markerLayer, pin, atlas);
  // 0.56E — labels clear the architecture: each place's label lifts above
  // the tallest structure anchored to it (plus crown allowance), instead of
  // sitting at a fixed ground offset that erased landmark crowns.
  const crownLift = placeCrownLiftMap(scene.buildings);
  if (includeLabels) {
    // 0.67H label demotion — ambient labels are a hard cap (none on mobile,
    // two on desktop); selected/hover labels render from the focus overlay.
    const ambientLabelIds = ambientLabelAllowance(scene, cameraPresetId);
    for (const place of orderedSceneItems(renderCommands, "place_label", itemIndex.places)) drawPlaceLabel(layers.labelLayer, place, ambientLabelIds, crownLift.get(place.id));
  }
  if (debugMode === "engine") drawEngineDebugOverlay(layers.hudBridgeLayer, scene);

  const focus: FocusIndex = {
    placesById: new Map(visiblePlaces.map((place) => [place.id, place])),
    buildingsByPlaceId: new Map(),
    crownLift,
    drawnPlaceIds: new Set(visiblePlaces.map((place) => place.id)),
  };
  for (const building of buildings) {
    if (!building.placeId) continue;
    const anchored = focus.buildingsByPlaceId.get(building.placeId);
    if (anchored) anchored.push(building);
    else focus.buildingsByPlaceId.set(building.placeId, [building]);
  }
  return { frame: sceneWindow.frame, focus };
}

const GROUND_BAND_TILES = 4;

function drawBanded<T extends { position: CityWorldPoint }>(
  layer: Container,
  items: T[],
  draw: (g: Graphics, item: T) => void,
) {
  const bands = new Map<number, Graphics>();
  for (const item of items) {
    const band = Math.floor((item.position.x + item.position.y) / GROUND_BAND_TILES);
    let g = bands.get(band);
    if (!g) {
      g = new Graphics();
      bands.set(band, g);
    }
    draw(g, item);
  }
  for (const band of [...bands.keys()].sort((a, b) => a - b)) {
    const g = bands.get(band);
    if (g) layer.addChild(g);
  }
}

function shouldHideCityWorldLabels(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("atlasNoLabels") === "1";
}

// 0.67H label demotion — the ambient (non-focused) label budget is a hard
// cap, not a priority threshold: mobile gets none, desktop gets the two
// highest-priority anchors. Focus-overlay labels render on top of this
// allowance, so a desktop frame tops out at three label cards.
function ambientLabelAllowance(scene: CityWorldScene, cameraPresetId: CityWorldCameraPresetId): Set<string> {
  if (cameraPresetId === "mobile") return new Set();
  return new Set(
    scene.places
      .filter((place) => place.labelPriority >= 9)
      .sort((a, b) => b.labelPriority - a.labelPriority)
      .slice(0, 2)
      .map((place) => place.id),
  );
}

// 0.67H focal calm — the default-selected place (or the first landmark as a
// fallback) defines the focal ring where decoration must yield to architecture.
function focalPlaceAnchor(scene: CityWorldScene, selectedPlaceId: string): CityWorldPoint | undefined {
  const focal = scene.places.find((place) => place.id === selectedPlaceId) ?? scene.places.find((place) => place.kind === "landmark");
  return focal?.anchor;
}

function focalCalm(position: CityWorldPoint, focalAnchor: CityWorldPoint | undefined): number {
  if (!focalAnchor) return 1;
  const distance = Math.hypot(position.x - focalAnchor.x, position.y - focalAnchor.y);
  if (distance < 2.2) return 0.55;
  if (distance < 3.6) return 0.78;
  return 1;
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

function shouldDrawMaterialTexture(cameraZoom: number): boolean {
  return cameraZoom >= MATERIAL_TEXTURE_DETAIL_ZOOM;
}

function orderedSceneItems<T extends { id: string }>(
  commands: readonly CityWorldRenderCommand[],
  kind: CityWorldRenderCommandKind,
  itemById: ReadonlyMap<string, T>,
): T[] {
  // Single pass over the visible commands resolving through the scene's
  // shared id index — the old per-call Map rebuild scanned every item array
  // nine times per scene rebuild.
  const items: T[] = [];
  for (const command of commands) {
    if (command.kind !== kind) continue;
    const item = itemById.get(command.sourceId);
    if (item) items.push(item);
  }
  return items;
}

function drawDepthInterleavedBuildingsAndProps(
  layers: LayerMap,
  buildings: CityWorldBuilding[],
  props: CityWorldProp[],
  animated: AnimatedTarget[],
  atlas: CityWorldAtlasResolver,
  materialTextureEnabled: boolean,
  propCalm: (prop: CityWorldProp) => number = () => 1,
) {
  const buildingProxy = layers.buildingLayer as QaVisibilityProxyLayer;
  const propProxy = layers.propLayer as QaVisibilityProxyLayer;
  const generatedSignage: GeneratedSignageState = { count: 0, max: 8 };
  buildingProxy.atlasVisibilityTargets.length = 0;
  propProxy.atlasVisibilityTargets.length = 0;
  layers.buildingPropDepthLayer.sortableChildren = true;

  const items = [
    ...buildings.map((building, sourceIndex) => ({
      id: building.id,
      kind: "building" as const,
      depthKey: cityWorldBuildingDepthKey(building),
      sourceIndex,
      building,
    })),
    ...props.map((prop, sourceIndex) => ({
      id: prop.id,
      kind: "prop" as const,
      depthKey: cityWorldPropDepthKey(prop),
      sourceIndex,
      prop,
    })),
  ].sort(compareCityWorldDepthInterleaveItems);

  for (const item of items) {
    const group = new Container();
    group.label = `${item.kind}-${item.id}`;
    group.zIndex = item.depthKey;
    if (item.kind === "building") {
      drawBuilding(layers, group, item.building, atlas, materialTextureEnabled, generatedSignage);
      group.visible = buildingProxy.visible;
      buildingProxy.atlasVisibilityTargets.push(group);
    } else {
      drawProp(group, item.prop, animated, atlas, propCalm(item.prop));
      group.visible = propProxy.visible;
      propProxy.atlasVisibilityTargets.push(group);
    }
    layers.buildingPropDepthLayer.addChild(group);
  }
  layers.buildingPropDepthLayer.sortChildren();
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
    // Lots under roads: both are ground material, but a road corridor crossing
    // a lot (park loop, generated overlaps) must read as embedded asphalt
    // cutting the lot, never as a lot sheet laid over the road.
    lotLayer: namedLayer("lotLayer"),
    roadLayer: namedLayer("roadLayer"),
    padLayer: namedLayer("padLayer"),
    shadowLayer: namedLayer("shadowLayer"),
    buildingPropDepthLayer: namedLayer("buildingPropDepthLayer"),
    buildingLayer: namedVisibilityProxyLayer("buildingLayer"),
    propLayer: namedVisibilityProxyLayer("propLayer"),
    actorLayer: namedLayer("actorLayer"),
    // Hover/selection emphasis draws here alone — over the buildings it
    // traces, under labels and hit targets — so focus changes never rebuild
    // the base scene.
    focusLayer: namedLayer("focusLayer"),
    labelLayer: namedLayer("labelLayer"),
    markerLayer: namedLayer("markerLayer"),
    hudBridgeLayer: namedLayer("hudBridgeLayer"),
  };
}

function drawBoardEdgeFade(layer: Container, bounds: CityWorldBounds) {
  const nw = project({ x: bounds.minX, y: bounds.minY, z: 0 });
  const ne = project({ x: bounds.maxX, y: bounds.minY, z: 0 });
  const se = project({ x: bounds.maxX, y: bounds.maxY, z: 0 });
  const sw = project({ x: bounds.minX, y: bounds.maxY, z: 0 });
  const corners = [nw, ne, se, sw] as const;
  const center = {
    x: (nw.x + ne.x + se.x + sw.x) / 4,
    y: (nw.y + ne.y + se.y + sw.y) / 4,
  };
  const background = resolveBackgroundColor();
  const rimBase = isDarkTheme() ? 0x46513f : 0x91a766;
  const near = mixColor(background, rimBase, isDarkTheme() ? 0.52 : 0.68);
  const far = mixColor(background, rimBase, isDarkTheme() ? 0.22 : 0.34);
  const edge = new Graphics();

  drawBoardEdgeBand(edge, corners, center, 18, near, 0.62);
  drawBoardEdgeBand(edge, corners, center, 34, far, 0.34);
  layer.addChild(edge);
}

function drawBoardEdgeBand(
  g: Graphics,
  corners: readonly [ProjectedPoint, ProjectedPoint, ProjectedPoint, ProjectedPoint],
  center: ProjectedPoint,
  distance: number,
  color: number,
  alpha: number,
) {
  for (let index = 0; index < corners.length; index += 1) {
    const from = corners[index]!;
    const to = corners[(index + 1) % corners.length]!;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    let nx = -dy / length;
    let ny = dx / length;
    const midpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    const currentDistance = squaredDistance(midpoint, center);
    const candidateDistance = squaredDistance({ x: midpoint.x + nx * distance, y: midpoint.y + ny * distance }, center);
    if (candidateDistance < currentDistance) {
      nx *= -1;
      ny *= -1;
    }
    g
      .poly([from.x, from.y, to.x, to.y, to.x + nx * distance, to.y + ny * distance, from.x + nx * distance, from.y + ny * distance], true)
      .fill({ color, alpha });
  }
}

function namedLayer(label: keyof LayerMap): Container {
  const layer = new Container();
  layer.label = label;
  return layer;
}

function namedVisibilityProxyLayer(label: "buildingLayer" | "propLayer"): QaVisibilityProxyLayer {
  const layer = namedLayer(label) as QaVisibilityProxyLayer;
  layer.atlasProxyVisible = true;
  layer.atlasVisibilityTargets = [];
  Object.defineProperty(layer, "visible", {
    configurable: true,
    get() {
      return this.atlasProxyVisible;
    },
    set(value: boolean) {
      this.atlasProxyVisible = value;
      for (const target of this.atlasVisibilityTargets) target.visible = value;
    },
  });
  return layer;
}

function drawTerrainTile(g: Graphics, tile: CityWorldTerrainTile, atlas: CityWorldAtlasResolver) {
  const point = project(tile.position);
  const contact = resolveTerrainContact(tile);
  const draftTile = contact.tone === "draft";
  const shellTile = contact.tone === "shell";
  const regionalTerrain = tile.paletteKey?.startsWith("terrain.region.") ? atlas.resolvePalette(tile.paletteKey, "terrain").colors : undefined;
  const baseColor = shellTile ? SHELL_TERRAIN_COLORS[tile.kind] : draftTile ? DRAFT_TERRAIN_COLORS[tile.kind] : regionalTerrain ? colorToNumber(regionalTerrain.base) : TERRAIN_COLORS[tile.kind];
  // Deterministic tonal variation: two low-frequency waves plus a whisper of
  // per-tile hash so the ground reads as planted terrain, not a flat board —
  // and not a checkerboard. Calm range only.
  const lowFrequencyTone =
    Math.sin(tile.position.x * 0.16 + tile.position.y * 0.23) * 3.4 +
    Math.sin(tile.position.x * 0.055 - tile.position.y * 0.083) * 3.0;
  const toneHash = ((tile.position.x * 73856093) ^ (tile.position.y * 19349663) ^ (tile.variant * 83492791)) >>> 0;
  const hashTone = ((toneHash % 5) - 2) * 0.8;
  const toneScale = tile.kind === "water" ? 0.9 : tile.kind === "grass" ? 1.25 : 0.6;
  const variation = (tile.variant - 2) * (tile.kind === "water" ? 3.1 : tile.kind === "grass" ? 1.2 : 1.8) + (lowFrequencyTone + hashTone) * toneScale;
  // Ground sits a half-step below the sunlit rooftops so built forms read
  // bright against the terrain instead of blending into it.
  const color = shellTile
    ? mixColor(scaleColor(shadeColor(baseColor, variation * 0.35), 0.96), 0xe0dec4, 0.16)
    : tile.kind === "water"
      ? mixColor(scaleColor(shadeColor(baseColor, variation), 0.96), 0x082f57, 0.18)
      : mixColor(scaleColor(shadeColor(baseColor, variation), 0.98), SUN_WARM_TINT, 0.07);
  // Clay table ground: slightly higher matte alpha, softer seams.
  const alpha = shellTile ? (tile.kind === "grass" ? 0.9 : 0.92) : draftTile ? (tile.kind === "grass" ? 0.88 : 0.94) : tile.kind === "water" ? 0.97 : tile.kind === "grass" ? 0.95 : 0.96;
  const strokeAlpha = shellTile ? (tile.kind === "grass" ? 0.08 : 0.11) : draftTile ? (tile.kind === "grass" ? 0.03 : 0.08) : tile.kind === "grass" ? 0.04 : tile.kind === "water" ? 0.22 : 0.09;
  const strokeColor = tile.kind === "water" ? 0x0b4f79 : shellTile ? 0x747965 : draftTile ? 0x7a8a58 : regionalTerrain ? colorToNumber(regionalTerrain.shade) : 0x6d824f;
  // Massing/elevation extrusions first, then the tile face: within a shared
  // Graphics, path order is z order (old per-object add order preserved).
  drawTerrainChunkMassing(g, tile, point, color);
  drawTerrainElevationEdges(g, tile, point, color);
  drawTerrainCliffCourses(g, tile, point, color);
  const graphic = appendPolygon(g, diamondPoints(point, TILE_WIDTH + 1, TILE_HEIGHT + 1), color, alpha, strokeColor, strokeAlpha);

  if (tile.kind === "water") {
    // Depth gradient + sheen: bright sun edge, deep blue falloff below.
    graphic
      .poly([point.x - TILE_WIDTH * 0.5, point.y, point.x, point.y - TILE_HEIGHT * 0.5, point.x + TILE_WIDTH * 0.16, point.y - TILE_HEIGHT * 0.34, point.x - TILE_WIDTH * 0.28, point.y + TILE_HEIGHT * 0.1], true)
      .fill({ color: 0x75c9ee, alpha: 0.22 })
      .poly([point.x + TILE_WIDTH * 0.5, point.y, point.x, point.y + TILE_HEIGHT * 0.5, point.x - TILE_WIDTH * 0.14, point.y + TILE_HEIGHT * 0.36, point.x + TILE_WIDTH * 0.26, point.y - TILE_HEIGHT * 0.08], true)
      .fill({ color: 0x052f5a, alpha: 0.28 })
      .poly([point.x - TILE_WIDTH * 0.22, point.y - TILE_HEIGHT * 0.04, point.x + TILE_WIDTH * 0.1, point.y - TILE_HEIGHT * 0.2, point.x + TILE_WIDTH * 0.34, point.y - TILE_HEIGHT * 0.02, point.x + TILE_WIDTH * 0.02, point.y + TILE_HEIGHT * 0.16], true)
      .fill({ color: 0x0e5f98, alpha: 0.18 });
    if (tile.variant % 2 === 0) {
      graphic
        .moveTo(point.x - 11, point.y - 1)
        .lineTo(point.x + 13, point.y - 1)
        .stroke({ color: 0xd7f8ff, alpha: 0.28, width: 1.15, cap: "round" });
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
  if (shellTile) drawShellTerrainFacet(graphic, tile, point);
}

// 0.74F terrain relief: raised tiles extrude stacked voxel cliff courses on
// every side that drops to a lower neighbor. South/east faces are the
// sun-consistent visible cliff walls; north/west bands read as shadowed cuts
// AND cover the projection gap a raised tile leaves over its back neighbors.
// Authored by the generator as visualGrammar.elevation — no neighbor scans here.
function drawTerrainCliffCourses(g: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint, color: number) {
  const elevation = tile.visualGrammar?.elevation;
  if (!elevation || elevation.dropDepth <= 0 || elevation.dropSides.length === 0) return;

  const width = TILE_WIDTH + 1;
  const height = TILE_HEIGHT + 1;
  const courseZ = 0.5;
  const courseCount = Math.max(1, Math.round(elevation.dropDepth / courseZ));
  const coursePx = (elevation.dropDepth * TILE_DEPTH) / courseCount;
  const cliffBase = shadeColor(color, -10);

  for (const side of elevation.dropSides) {
    const edge = tileEdgeSegment(point, width, height, side);
    const frontFace = side === "south" || side === "east";
    for (let course = 0; course < courseCount; course += 1) {
      const topDrop = course * coursePx;
      const bottomDrop = (course + 1) * coursePx + (course === courseCount - 1 ? 1.5 : 0);
      const faceColor = frontFace
        ? sunlitColor(shadeColor(cliffBase, -course * 9), side === "south" ? "sun" : "shade")
        : shadeColor(cliffBase, -30 - course * 8);
      g
        .poly(
          [
            edge.from.x, edge.from.y + topDrop,
            edge.to.x, edge.to.y + topDrop,
            edge.to.x, edge.to.y + bottomDrop,
            edge.from.x, edge.from.y + bottomDrop,
          ],
          true,
        )
        .fill({ color: faceColor, alpha: frontFace ? 0.98 : 0.92 });
      if (frontFace) {
        // Sunlit lip along the top of each course — the stacked-block read.
        g
          .moveTo(edge.from.x, edge.from.y + topDrop)
          .lineTo(edge.to.x, edge.to.y + topDrop)
          .stroke({ color: shadeColor(color, 30), alpha: course === 0 ? 0.58 : 0.36, width: 1.15, cap: "butt" });
      }
      g
        .moveTo(edge.from.x, edge.from.y + bottomDrop - 0.9)
        .lineTo(edge.to.x, edge.to.y + bottomDrop - 0.9)
        .stroke({ color: frontFace ? shadeColor(color, 12) : shadeColor(color, -46), alpha: frontFace ? 0.24 : 0.18, width: 0.9, cap: "butt" });
    }
  }
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
    // Beach strand on the land side: a filled sand wedge between the tile
    // edge and the dry line, then a pale dry line above a darker wet line —
    // the shore reads as a beach, not a painted boundary.
    for (const side of waterEdgeSides) {
      const edge = tileEdgeSegment(point, width, height, side);
      const inner = insetEdgeSegment(point, edge, 0.34);
      graphic
        .poly([edge.from.x, edge.from.y, edge.to.x, edge.to.y, inner.to.x, inner.to.y, inner.from.x, inner.from.y], true)
        .fill({ color: 0xead7a6, alpha: style.strandAlpha * 0.68 });
    }
    for (const side of waterEdgeSides) {
      const strand = insetEdgeSegment(point, tileEdgeSegment(point, width, height, side), 0.1);
      graphic.moveTo(strand.from.x, strand.from.y).lineTo(strand.to.x, strand.to.y);
    }
    graphic.stroke({ color: 0xf1dfae, alpha: style.strandAlpha, width: 1.65, cap: "round", join: "round" });
    for (const side of waterEdgeSides) {
      const wet = insetEdgeSegment(point, tileEdgeSegment(point, width, height, side), 0.22);
      graphic.moveTo(wet.from.x, wet.from.y).lineTo(wet.to.x, wet.to.y);
    }
    graphic.stroke({ color: 0x185f85, alpha: style.wetAlpha, width: 1.25, cap: "round", join: "round" });
  }
}

function drawTerrainChunkMassing(g: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint, color: number) {
  const massing = tile.visualGrammar?.terrainChunkMassing ?? "none";
  if (massing === "none") return;

  const chunkEdge = tile.visualGrammar?.chunkEdge ?? "none";
  const config = terrainChunkMassingStyle(massing, color, chunkEdge);
  const width = TILE_WIDTH * config.widthScale;
  const height = TILE_HEIGHT * config.heightScale;
  const depth = config.depth;
  appendPolygon(
    g,
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
  g
    .moveTo(point.x - width * 0.5, point.y)
    .lineTo(point.x, point.y + height * 0.5)
    .lineTo(point.x, point.y + height * 0.5 + depth)
    .lineTo(point.x - width * 0.5, point.y + depth)
    .closePath()
    .fill({ color: massLit, alpha: massAlpha * 0.82 });
  g
    .moveTo(point.x, point.y + height * 0.5)
    .lineTo(point.x + width * 0.5, point.y)
    .lineTo(point.x + width * 0.5, point.y + depth)
    .lineTo(point.x, point.y + height * 0.5 + depth)
    .closePath()
    .fill({ color: massShade, alpha: massAlpha });
  g
    .moveTo(point.x - width * 0.5, point.y + depth)
    .lineTo(point.x, point.y + height * 0.5 + depth)
    .lineTo(point.x + width * 0.5, point.y + depth)
    .stroke({ color: config.rimColor, alpha: config.rimAlpha, width: config.rimWidth, cap: "round", join: "round" });

  if (config.strataAlpha > 0) {
    g
      .moveTo(point.x - width * 0.38, point.y + depth * 0.52)
      .lineTo(point.x - width * 0.08, point.y + height * 0.18 + depth * 0.58)
      .lineTo(point.x + width * 0.28, point.y + depth * 0.5)
      .moveTo(point.x - width * 0.26, point.y + depth * 0.86)
      .lineTo(point.x, point.y + height * 0.28 + depth * 0.92)
      .lineTo(point.x + width * 0.24, point.y + depth * 0.84)
      .stroke({ color: config.strataColor, alpha: config.strataAlpha, width: 1.05, cap: "round", join: "round" });
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
      depth: structuralEdge ? 14 : 10,
      widthScale: structuralEdge ? 1.18 : 1.1,
      heightScale: structuralEdge ? 1.12 : 1.06,
      leftColor: 0x1f6d8e,
      rightColor: 0x2f86a4,
      faceAlpha: structuralEdge ? 0.34 : 0.22,
      shadowAlpha: structuralEdge ? 0.11 : 0.065,
      rimColor: 0xdaf8ff,
      rimAlpha: structuralEdge ? 0.34 : 0.2,
      rimWidth: structuralEdge ? 1.8 : 1.2,
      strataColor: 0x9ed8df,
      strataAlpha: structuralEdge ? 0.2 : 0.1,
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

function drawTerrainElevationEdges(g: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint, color: number) {
  const elevation = tile.visualGrammar?.terrainElevation;
  if (!elevation || elevation === "flat_field" || elevation === "shell_flat") return;

  const hash = (tile.position.x * 29 + tile.position.y * 31 + tile.variant * 5) % 17;
  const raised = elevation === "raised_parcel_shelf" || elevation === "civic_plinth_shelf" || elevation === "hidden_draft_shelf";
  const cut = elevation === "water_edge_cut";
  const basin = elevation === "park_basin_shelf";
  const depth = elevation === "civic_plinth_shelf" ? 7 : cut ? 8 : basin ? 4 : 5;
  const sideColor = cut ? sunlitColor(0x155c80, "shade") : sunlitColor(shadeColor(color, basin ? -8 : -12), "shade");
  const faceAlpha = cut ? 0.48 : elevation === "civic_plinth_shelf" ? 0.42 : 0.3;

  if (raised || cut || (basin && hash % 2 === 0)) {
    g
      .moveTo(point.x - TILE_WIDTH * 0.5, point.y)
      .lineTo(point.x, point.y + TILE_HEIGHT * 0.5)
      .lineTo(point.x + TILE_WIDTH * 0.5, point.y)
      .lineTo(point.x + TILE_WIDTH * 0.5, point.y + depth)
      .lineTo(point.x, point.y + TILE_HEIGHT * 0.5 + depth)
      .lineTo(point.x - TILE_WIDTH * 0.5, point.y + depth)
      .closePath()
      .fill({ color: sideColor, alpha: faceAlpha });
  }

  if ((elevation === "civic_plinth_shelf" || cut || hash === 3 || hash === 11) && elevation !== "park_basin_shelf") {
    g
      .moveTo(point.x - TILE_WIDTH * 0.36, point.y + TILE_HEIGHT * 0.12 + depth * 0.55)
      .lineTo(point.x - TILE_WIDTH * 0.08, point.y + TILE_HEIGHT * 0.28 + depth * 0.55)
      .lineTo(point.x + TILE_WIDTH * 0.28, point.y + TILE_HEIGHT * 0.1 + depth * 0.55)
      .stroke({ color: cut ? 0xcdf5ff : 0xf3dfb2, alpha: cut ? 0.22 : 0.12, width: 1, cap: "round", join: "round" });
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
          .stroke({ color: 0xd7f8ff, alpha: 0.26, width: 1.45, cap: "round", join: "round" });
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
        ? 0.58
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
        ? 0xd7f8ff
        : chunkEdge === "park_basin_edge"
          ? 0xe7dca9
          : chunkEdge === "hidden_draft_boundary"
            ? 0xd9c28b
            : 0xf2e5bd;
    const edgeAlpha = chunkEdge === "waterfront_bank_edge" ? 0.24 : chunkEdge === "world_edge" ? 0.1 : chunkEdge === "parcel_cluster_edge" ? 0.13 : 0.18;
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
  if (elevation === "water_edge_cut") return 7.4;
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

function drawShellTerrainFacet(graphic: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint) {
  const hash = Math.abs((tile.position.x * 19 + tile.position.y * 29 + tile.variant * 7) % 17);

  if (hash % 3 === 0) {
    graphic
      .moveTo(point.x - TILE_WIDTH * 0.28, point.y - TILE_HEIGHT * 0.04)
      .lineTo(point.x, point.y + TILE_HEIGHT * 0.12)
      .lineTo(point.x + TILE_WIDTH * 0.28, point.y - TILE_HEIGHT * 0.04)
      .stroke({ color: 0xf1ead2, alpha: 0.15, width: 1, cap: "round", join: "round" });
  }

  if (tile.kind === "grass" && hash === 4) {
    graphic
      .poly([point.x - 12, point.y, point.x - 2, point.y - 5, point.x + 12, point.y, point.x + 2, point.y + 5], true)
      .fill({ color: 0xd5dcc1, alpha: 0.11 });
  }
}

// The road network renders as ~11 PASS Graphics instead of ~10 Graphics per
// segment: every segment strokes into shared per-pass Graphics, added in pass
// order. Cross-segment layering becomes seamless by construction — segment
// N's shadow can no longer smear over segment N-1's finished surface, because
// ALL shadows draw under ALL surfaces.
type RoadPassSet = {
  shadow: Graphics;
  sideFace: Graphics;
  curb: Graphics;
  bed: Graphics;
  surface: Graphics;
  bevels: Graphics;
  seams: Graphics;
  material: Graphics;
  dashes: Graphics;
  joints: Graphics;
  crosswalks: Graphics;
};

type GeneratedRoadPaintProfile = {
  sideFace: number;
  curb: number;
  bed: number;
  surface: number;
  dash: number;
  sideFaceAlpha: number;
  curbAlpha: number;
  bedAlpha: number;
  surfaceAlpha: number;
  dashAlpha: number;
  sidewalk: number;
  sidewalkAlpha: number;
  sidewalkWidth: number;
};

function generatedRoadPaintProfile(road: CityWorldRoadSegment, contact: CityWorldRoadContactGrammar): GeneratedRoadPaintProfile | undefined {
  if (!road.id.startsWith("gen-road-") || contact.profile === "painted") return undefined;
  const sidewalkWidth = generatedRoadHasSidewalk(road) ? (road.kind === "avenue" ? 4.4 : 3) : 0;
  const base = {
    sideFaceAlpha: contact.profile === "apron" ? 0.3 : 0.42,
    curbAlpha: contact.profile === "apron" ? 0.44 : 0.64,
    bedAlpha: contact.profile === "apron" ? 0.7 : 0.88,
    surfaceAlpha: contact.profile === "apron" ? 0.56 : 0.7,
    dashAlpha: road.kind === "avenue" ? 0.25 : 0.18,
    sidewalk: 0xd8d2b4,
    sidewalkAlpha: road.kind === "avenue" ? 0.5 : 0.34,
    sidewalkWidth,
  };
  const id = road.id;
  if (id.includes("metro")) {
    return { ...base, sideFace: 0x59625d, curb: 0xd8cda7, bed: 0x6c7770, surface: 0x7d877f, dash: 0xf0dfae, dashAlpha: road.kind === "avenue" ? 0.3 : 0.22 };
  }
  if (id.includes("coastal")) {
    return { ...base, sideFace: 0x7f8777, curb: 0xe1d7b7, bed: 0x8a9484, surface: 0x9aa38e, dash: 0xf2e6be, sidewalk: 0xded9bf };
  }
  if (id.includes("desert")) {
    return { ...base, sideFace: 0x8b8068, curb: 0xe3d1a2, bed: 0x9b9278, surface: 0xada487, dash: 0xf0dfb1, dashAlpha: 0.16, sidewalk: 0xdac89b };
  }
  if (id.includes("mountain")) {
    return { ...base, sideFace: 0x737869, curb: 0xd8d0ad, bed: 0x858b7d, surface: 0x989d89, dash: 0xebddb5, dashAlpha: 0.18, sidewalk: 0xd1cdb1 };
  }
  if (id.includes("prairie")) {
    return { ...base, sideFace: 0x8f876c, curb: 0xe2d09f, bed: 0x9f987c, surface: 0xb0aa8b, dash: 0xf0dfad, dashAlpha: 0.15, sidewalk: 0xd8ca9e };
  }
  return { ...base, sideFace: 0x7e8674, curb: 0xdfd3ac, bed: 0x8d9581, surface: 0x9da78d, dash: 0xefe1b5, sidewalk: 0xdad3b5 };
}

function generatedRoadHasSidewalk(road: CityWorldRoadSegment): boolean {
  if (road.kind === "avenue") return true;
  return /main|core|frontage|shoreline|dock|service|water-edge/.test(road.id);
}

function drawRoadNetwork(layer: Container, roads: CityWorldRoadSegment[]) {
  const passes: RoadPassSet = {
    shadow: new Graphics(),
    sideFace: new Graphics(),
    curb: new Graphics(),
    bed: new Graphics(),
    surface: new Graphics(),
    bevels: new Graphics(),
    seams: new Graphics(),
    material: new Graphics(),
    dashes: new Graphics(),
    joints: new Graphics(),
    crosswalks: new Graphics(),
  };
  // 0.78-R county-board roads (lodBand-tagged) get their own flat ribbon
  // pass: no curbs, no joint modules, no end caps, no casings — the
  // neighborhood road art reads as road soup at county lattice scale.
  // Hierarchy carries through width + value (a11y: never color alone).
  const bandRoads = roads.filter((road) => road.lodBand !== undefined);
  const overlayRibbons = new Graphics();
  for (const road of bandRoads) drawCountyRoadRibbon(overlayRibbons, road);
  layer.addChild(overlayRibbons);

  const streetRoads = roads.filter((road) => road.lodBand === undefined);
  const physicalRoads = streetRoads.filter((road) => resolveRoadContact(road).profile !== "painted");
  for (const road of physicalRoads) drawRoadSegmentModule(passes, road);

  const joints = collectRoadJoints(physicalRoads);
  for (const joint of joints.sort((a, b) => a.point.x + a.point.y - (b.point.x + b.point.y))) {
    if (joint.roads.length > 1 || joint.roads.some((road) => resolveRoadContact(road).profile === "apron")) {
      drawRoadJointModule(passes.joints, joint);
    } else if (joint.roads.length === 1 && resolveRoadContact(joint.roads[0] as CityWorldRoadSegment).profile === "embedded") {
      drawRoadEndCap(passes.joints, joint);
    }
  }

  for (const road of streetRoads.filter((road) => resolveRoadContact(road).profile === "painted")) drawCrosswalkRoad(passes.crosswalks, road);

  layer.addChild(
    passes.shadow,
    passes.sideFace,
    passes.curb,
    passes.bed,
    passes.surface,
    passes.bevels,
    passes.seams,
    passes.material,
    passes.dashes,
    passes.joints,
    passes.crosswalks,
  );
}

// County-board road ribbon: one grounding underlay + one class-toned surface
// stroke, butt caps, round joins. Primary avenues run darker and wider than
// locals; service roads thinner and lighter still (value + width hierarchy).
function drawCountyRoadRibbon(g: Graphics, road: CityWorldRoadSegment) {
  const start = project(road.from);
  const end = project(road.to);
  const width = Math.max(1.4, road.width * 15.2);
  const primary = road.kind === "avenue";
  const surface = primary ? 0x474f52 : road.kind === "driveway" ? 0x6a716c : 0x5a625f;
  const alpha = primary ? 0.94 : road.kind === "driveway" ? 0.55 : 0.78;
  g.moveTo(start.x, start.y + 1)
    .lineTo(end.x, end.y + 1)
    .stroke({ color: 0x1f2724, alpha: 0.16, width: width + 2, cap: "butt", join: "round" });
  g.moveTo(start.x, start.y)
    .lineTo(end.x, end.y)
    .stroke({ color: surface, alpha, width, cap: "butt", join: "round" });
}

// Dead-end streets stop looking sheared: a rounded curb stub + surface disk
// caps the open end.
function drawRoadEndCap(g: Graphics, joint: RoadJoint) {
  const road = joint.roads[0];
  if (!road) return;
  const point = project(joint.point);
  const radius = road.width * 8.2;
  g.ellipse(point.x, point.y + 1, radius, radius * 0.52).fill({ color: 0xd6c996, alpha: 0.72 });
  g.ellipse(point.x, point.y, radius * 0.78, radius * 0.4).fill({ color: 0x58635f, alpha: 0.95 });
  g.ellipse(point.x, point.y - 1, radius * 0.6, radius * 0.3).fill({ color: 0x68736d, alpha: 0.7 });
}

function drawRoadSegmentModule(passes: RoadPassSet, road: CityWorldRoadSegment) {
  const start = project(road.from);
  const end = project(road.to);
  const baseWidth = road.width * 15.2;
  const contact = resolveRoadContact(road);
  const draftRoad = contact.tone === "draft";
  const shellRoad = contact.tone === "shell";
  const apron = contact.profile === "apron";
  const cap = apron ? "round" : "butt";
  const generatedPaint = generatedRoadPaintProfile(road, contact);
  passes.shadow
    .moveTo(start.x, start.y + 7)
    .lineTo(end.x, end.y + 7)
    .stroke({ color: 0x263a34, alpha: shellRoad ? 0.18 : draftRoad ? 0.2 : 0.16, width: baseWidth + (draftRoad || shellRoad ? 15 : 13), cap, join: "round" });
  passes.sideFace
    .moveTo(start.x, start.y + 4)
    .lineTo(end.x, end.y + 4)
    .stroke({
      color: generatedPaint ? generatedPaint.sideFace : shellRoad ? (apron ? 0x8d8c7d : 0x59615d) : draftRoad ? (apron ? 0x8b846d : 0x4d554d) : apron ? 0x7c806f : 0x46514c,
      alpha: generatedPaint ? generatedPaint.sideFaceAlpha : shellRoad ? (apron ? 0.48 : 0.62) : draftRoad ? (apron ? 0.44 : 0.56) : apron ? 0.34 : 0.48,
      width: baseWidth + 8,
      cap,
      join: "round",
    });

  passes.curb
    .moveTo(start.x, start.y)
    .lineTo(end.x, end.y)
    .stroke({
      color: generatedPaint ? generatedPaint.curb : shellRoad ? (apron ? 0xc9c0a4 : 0xd4ceb2) : draftRoad ? (apron ? 0xc4b182 : 0xd8c28b) : apron ? 0xc1ae88 : 0xd6c996,
      alpha: generatedPaint ? generatedPaint.curbAlpha : shellRoad ? (apron ? 0.58 : 0.76) : draftRoad ? (apron ? 0.58 : 0.82) : apron ? 0.48 : 0.78,
      width: baseWidth + 7,
      cap,
      join: "round",
    });
  if (generatedPaint && generatedPaint.sidewalkWidth > 0) drawGeneratedRoadSidewalkStrips(passes.curb, start, end, baseWidth, generatedPaint);
  passes.bed
    .moveTo(start.x, start.y + 1)
    .lineTo(end.x, end.y + 1)
    .stroke({
      color: generatedPaint ? generatedPaint.bed : shellRoad ? (apron ? 0x8f9185 : 0x646c67) : draftRoad ? (apron ? 0x8e8c7d : 0x555e58) : apron ? 0x858b7e : 0x58635f,
      alpha: generatedPaint ? generatedPaint.bedAlpha : shellRoad ? (apron ? 0.76 : 0.88) : apron ? 0.82 : 0.98,
      width: baseWidth + 1,
      cap,
      join: "round",
    });
  passes.surface
    .moveTo(start.x, start.y - 1)
    .lineTo(end.x, end.y - 1)
    .stroke({
      color: generatedPaint ? generatedPaint.surface : shellRoad ? (apron ? 0xaaa58e : 0x7c8278) : draftRoad ? (apron ? 0xa09c87 : 0x697069) : apron ? 0x969b8b : 0x68736d,
      alpha: generatedPaint ? generatedPaint.surfaceAlpha : shellRoad ? (apron ? 0.62 : 0.76) : draftRoad ? (apron ? 0.62 : 0.82) : apron ? 0.58 : 0.78,
      width: Math.max(4, baseWidth - 6),
      cap,
      join: "round",
    });
  drawRoadEdgeBevels(passes.bevels, start, end, baseWidth, apron);
  drawRoadModuleSeams(passes.seams, start, end, baseWidth, apron);
  if (draftRoad) drawDraftRoadMaterial(passes.material, start, end, baseWidth, contact);
  else if (shellRoad) drawShellRoadMaterial(passes.material, start, end, baseWidth, contact);
  else if (generatedPaint) drawGeneratedRoadMaterial(passes.material, start, end, baseWidth, contact, generatedPaint);
  else drawPublicRoadMaterial(passes.material, start, end, baseWidth, contact);

  if (contact.laneMarking === "avenue_dash") {
    drawDashedLine(passes.dashes, start, end, 9, 12, generatedPaint ? generatedPaint.dash : shellRoad ? 0xded8bb : draftRoad ? 0xe9d59c : 0xf3e3a4, 1.45, generatedPaint ? generatedPaint.dashAlpha : shellRoad ? 0.24 : draftRoad ? 0.28 : 0.38);
  } else if (contact.laneMarking === "street_dash") {
    drawDashedLine(passes.dashes, start, end, 6, 10, generatedPaint ? generatedPaint.dash : shellRoad ? 0xded8bb : draftRoad ? 0xe9d59c : 0xf3e3a4, 1.1, generatedPaint ? generatedPaint.dashAlpha : shellRoad ? 0.24 : draftRoad ? 0.28 : 0.38);
  } else if (contact.laneMarking === "apron_dash") {
    drawDashedLine(passes.dashes, start, end, 4, 12, 0xe8dfbd, 0.9, 0.18);
  }
}

function drawGeneratedRoadSidewalkStrips(g: Graphics, start: ProjectedPoint, end: ProjectedPoint, roadWidth: number, paint: GeneratedRoadPaintProfile) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0) return;
  const nx = -dy / length;
  const ny = dx / length;
  const offset = roadWidth * 0.55 + paint.sidewalkWidth * 0.42;
  g
    .moveTo(start.x + nx * offset, start.y + ny * offset - 0.5)
    .lineTo(end.x + nx * offset, end.y + ny * offset - 0.5)
    .moveTo(start.x - nx * offset, start.y - ny * offset + 1.5)
    .lineTo(end.x - nx * offset, end.y - ny * offset + 1.5)
    .stroke({ color: paint.sidewalk, alpha: paint.sidewalkAlpha, width: paint.sidewalkWidth, cap: "butt" });
}

function drawGeneratedRoadMaterial(g: Graphics, start: ProjectedPoint, end: ProjectedPoint, roadWidth: number, contact: CityWorldRoadContactGrammar, paint: GeneratedRoadPaintProfile) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0 || contact.profile === "painted") return;

  const apron = contact.profile === "apron";
  const ux = dx / length;
  const uy = dy / length;
  const nx = -dy / length;
  const ny = dx / length;
  const edgeInset = roadWidth * (apron ? 0.42 : 0.46);
  g
    .moveTo(start.x + nx * edgeInset, start.y + ny * edgeInset - 1.2)
    .lineTo(end.x + nx * edgeInset, end.y + ny * edgeInset - 1.2)
    .moveTo(start.x - nx * edgeInset, start.y - ny * edgeInset + 2.2)
    .lineTo(end.x - nx * edgeInset, end.y - ny * edgeInset + 2.2)
    .stroke({ color: mixColor(paint.curb, 0xffffff, 0.18), alpha: apron ? 0.1 : 0.14, width: 1.1, cap: "butt" });

  const step = apron ? 44 : 58;
  let wearCount = 0;
  for (let cursor = step * 0.75; cursor < length - step * 0.45; cursor += step) {
    const side = Math.floor(cursor / step) % 2 === 0 ? -1 : 1;
    const centerX = start.x + ux * cursor + nx * roadWidth * 0.13 * side;
    const centerY = start.y + uy * cursor + ny * roadWidth * 0.13 * side;
    g
      .moveTo(centerX - ux * 6, centerY - uy * 6)
      .lineTo(centerX + ux * 8, centerY + uy * 8);
    wearCount += 1;
  }
  if (wearCount > 0) g.stroke({ color: shadeColor(paint.surface, -42), alpha: apron ? 0.04 : 0.055, width: 1, cap: "round" });
}

function drawShellRoadMaterial(g: Graphics, start: ProjectedPoint, end: ProjectedPoint, roadWidth: number, contact: CityWorldRoadContactGrammar) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0 || contact.profile === "painted") return;

  const ux = dx / length;
  const uy = dy / length;
  const nx = -dy / length;
  const ny = dx / length;
  const edgeInset = roadWidth * 0.45;
  g
    .moveTo(start.x + nx * edgeInset, start.y + ny * edgeInset - 1)
    .lineTo(end.x + nx * edgeInset, end.y + ny * edgeInset - 1)
    .moveTo(start.x - nx * edgeInset, start.y - ny * edgeInset + 2)
    .lineTo(end.x - nx * edgeInset, end.y - ny * edgeInset + 2)
    .stroke({ color: 0xf1ead2, alpha: 0.16, width: 1.2, cap: "butt" });

  const step = contact.profile === "apron" ? 34 : 44;
  let ribCount = 0;
  for (let cursor = step * 0.65; cursor < length - step * 0.35; cursor += step) {
    const centerX = start.x + ux * cursor;
    const centerY = start.y + uy * cursor;
    g
      .moveTo(centerX - nx * roadWidth * 0.22 - ux * 3, centerY - ny * roadWidth * 0.22 - uy * 3)
      .lineTo(centerX + nx * roadWidth * 0.22 + ux * 3, centerY + ny * roadWidth * 0.22 + uy * 3);
    ribCount += 1;
  }
  if (ribCount > 0) g.stroke({ color: 0x3f4945, alpha: 0.1, width: 1, cap: "round" });
}

function drawDraftRoadMaterial(g: Graphics, start: ProjectedPoint, end: ProjectedPoint, roadWidth: number, contact: CityWorldRoadContactGrammar) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0 || contact.profile === "painted") return;

  const apron = contact.profile === "apron";
  const ux = dx / length;
  const uy = dy / length;
  const nx = -dy / length;
  const ny = dx / length;
  const step = apron ? 34 : 42;
  let gritCount = 0;
  for (let cursor = step * 0.45; cursor < length - step * 0.2; cursor += step) {
    const side = Math.floor(cursor / step) % 2 === 0 ? 1 : -1;
    const centerX = start.x + ux * cursor + nx * roadWidth * 0.18 * side;
    const centerY = start.y + uy * cursor + ny * roadWidth * 0.18 * side;
    g
      .moveTo(centerX - ux * 7, centerY - uy * 7)
      .lineTo(centerX + ux * 8, centerY + uy * 8);
    gritCount += 1;
  }
  if (gritCount > 0) g.stroke({ color: 0x3e4944, alpha: apron ? 0.08 : 0.12, width: 1.1, cap: "round" });

  g
    .moveTo(start.x + nx * roadWidth * 0.48, start.y + ny * roadWidth * 0.48)
    .lineTo(end.x + nx * roadWidth * 0.48, end.y + ny * roadWidth * 0.48)
    .moveTo(start.x - nx * roadWidth * 0.48, start.y - ny * roadWidth * 0.48 + 2)
    .lineTo(end.x - nx * roadWidth * 0.48, end.y - ny * roadWidth * 0.48 + 2)
    .stroke({ color: 0xf1ddad, alpha: 0.18, width: 1.3, cap: "butt" });
}

function drawPublicRoadMaterial(g: Graphics, start: ProjectedPoint, end: ProjectedPoint, roadWidth: number, contact: CityWorldRoadContactGrammar) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0 || contact.profile === "painted") return;

  const apron = contact.profile === "apron";
  const ux = dx / length;
  const uy = dy / length;
  const nx = -dy / length;
  const ny = dx / length;
  const step = apron ? 38 : 50;
  const edgeInset = roadWidth * (apron ? 0.44 : 0.48);

  // Old child order preserved: bed face under curb lift under slab wear.
  g
    .moveTo(start.x - nx * roadWidth * 0.34, start.y - ny * roadWidth * 0.34 + 4)
    .lineTo(end.x - nx * roadWidth * 0.34, end.y - ny * roadWidth * 0.34 + 4)
    .stroke({ color: 0x253b35, alpha: apron ? 0.08 : 0.12, width: Math.max(2, roadWidth * 0.08), cap: "butt" });

  g
    .moveTo(start.x + nx * edgeInset, start.y + ny * edgeInset - 1.5)
    .lineTo(end.x + nx * edgeInset, end.y + ny * edgeInset - 1.5)
    .moveTo(start.x - nx * edgeInset, start.y - ny * edgeInset + 2.5)
    .lineTo(end.x - nx * edgeInset, end.y - ny * edgeInset + 2.5)
    .stroke({ color: apron ? 0xf1ddb2 : 0xe8d49f, alpha: apron ? 0.12 : 0.16, width: 1.2, cap: "butt" });

  let wearCount = 0;
  for (let cursor = step * 0.7; cursor < length - step * 0.45; cursor += step) {
    const side = Math.floor(cursor / step) % 2 === 0 ? -1 : 1;
    const centerX = start.x + ux * cursor + nx * roadWidth * 0.16 * side;
    const centerY = start.y + uy * cursor + ny * roadWidth * 0.16 * side;
    g
      .moveTo(centerX - ux * 8, centerY - uy * 8)
      .lineTo(centerX + ux * 11, centerY + uy * 11);
    wearCount += 1;
  }
  if (wearCount > 0) g.stroke({ color: 0x3f4d47, alpha: apron ? 0.055 : 0.075, width: 1.05, cap: "round" });
}

function drawCrosswalkRoad(g: Graphics, road: CityWorldRoadSegment) {
  const start = project(road.from);
  const end = project(road.to);
  const baseWidth = road.width * 15.2;
  const draftRoad = resolveRoadContact(road).tone === "draft";
  g
    .moveTo(start.x, start.y + 5)
    .lineTo(end.x, end.y + 5)
    .stroke({ color: 0x263a34, alpha: draftRoad ? 0.16 : 0.12, width: baseWidth + 8, cap: "butt", join: "round" });
  g
    .moveTo(start.x, start.y + 1)
    .lineTo(end.x, end.y + 1)
    .stroke({ color: draftRoad ? 0xe3d2ad : 0xeadfc7, alpha: draftRoad ? 0.78 : 0.86, width: baseWidth + 4, cap: "butt", join: "round" });
  g
    .moveTo(start.x, start.y)
    .lineTo(end.x, end.y)
    .stroke({ color: draftRoad ? 0xf0e4c6 : 0xf8f0df, alpha: draftRoad ? 0.72 : 0.84, width: Math.max(3, baseWidth - 1), cap: "butt", join: "round" });
  drawCrosswalkStripes(g, start, end, baseWidth);
}

function drawCrosswalkStripes(g: Graphics, start: ProjectedPoint, end: ProjectedPoint, roadWidth: number) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const stepCount = Math.max(3, Math.floor(length / 9));
  const nx = -dy / length;
  const ny = dx / length;
  const ux = dx / length;
  const uy = dy / length;

  for (let index = 0; index <= stepCount; index += 1) {
    const centerX = start.x + ux * ((length / stepCount) * index);
    const centerY = start.y + uy * ((length / stepCount) * index);
    g
      .moveTo(centerX - nx * roadWidth * 0.42, centerY - ny * roadWidth * 0.42)
      .lineTo(centerX + nx * roadWidth * 0.42, centerY + ny * roadWidth * 0.42);
  }

  g.stroke({ color: 0xffffff, alpha: 0.62, width: 2.2, cap: "butt" });
}

function drawRoadEdgeBevels(g: Graphics, start: ProjectedPoint, end: ProjectedPoint, roadWidth: number, driveway: boolean) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0) return;

  const nx = -dy / length;
  const ny = dx / length;
  const inset = roadWidth * 0.42;
  g
    .moveTo(start.x + nx * inset, start.y + ny * inset - 1)
    .lineTo(end.x + nx * inset, end.y + ny * inset - 1)
    .moveTo(start.x - nx * inset, start.y - ny * inset + 2)
    .lineTo(end.x - nx * inset, end.y - ny * inset + 2)
    .stroke({ color: driveway ? 0xd9d0ae : 0x87928a, alpha: driveway ? 0.2 : 0.24, width: 1.1, cap: "butt" });
}

function drawRoadModuleSeams(g: Graphics, start: ProjectedPoint, end: ProjectedPoint, roadWidth: number, driveway: boolean) {
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
  let seamCount = 0;

  for (let cursor = step; cursor < length - step * 0.55; cursor += step) {
    const centerX = start.x + ux * cursor;
    const centerY = start.y + uy * cursor;
    g
      .moveTo(centerX - nx * seamHalf, centerY - ny * seamHalf + 1)
      .lineTo(centerX + nx * seamHalf, centerY + ny * seamHalf + 1);
    seamCount += 1;
  }

  if (seamCount > 0) g.stroke({ color: driveway ? 0xd9d0ae : 0x9aa49b, alpha: driveway ? 0.08 : 0.1, width: 1, cap: "butt" });
}

function drawDashedLine(
  g: Graphics,
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
  let cursor = gapLength * 0.5;
  let dashCount = 0;

  while (cursor < length) {
    const next = Math.min(cursor + dashLength, length);
    g
      .moveTo(start.x + ux * cursor, start.y + uy * cursor)
      .lineTo(start.x + ux * next, start.y + uy * next);
    cursor = next + gapLength;
    dashCount += 1;
  }

  if (dashCount > 0) g.stroke({ color, alpha, width, cap: "round" });
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

function drawRoadJointModule(g: Graphics, joint: RoadJoint) {
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
  appendPolygon(g, diamondPoints({ x: point.x, y: point.y + 5 }, width * 1.05, height * 1.08), 0x263a34, drivewayOnly ? 0.1 : draftJoint ? 0.18 : 0.15, 0x263a34, 0);
  appendPolygon(g, diamondPoints({ x: point.x, y: point.y + 2 }, width, height), drivewayOnly ? 0xc1ae88 : draftJoint ? 0xd5bf88 : 0xd6c996, drivewayOnly ? 0.62 : draftJoint ? 0.8 : 0.8, 0x6d684f, 0.18);
  appendPolygon(g, diamondPoints(point, width * 0.8, height * 0.7), drivewayOnly ? 0x858b7e : draftJoint ? 0x59635c : 0x5d6862, drivewayOnly ? 0.78 : 0.96, 0x3f4b46, 0.1);
  appendPolygon(g, diamondPoints({ x: point.x, y: point.y - 1 }, width * 0.58, height * 0.46), drivewayOnly ? 0x969b8b : draftJoint ? 0x71796f : 0x6b7670, drivewayOnly ? 0.34 : draftJoint ? 0.42 : 0.46, 0xffffff, 0);
  drawRoadJointBlockwork(g, point, width, height, drivewayOnly, draftJoint);
  drawDrivewayJoinThroats(g, joint, point, maxWidth);

  if (directions.size >= 3) {
    appendPolygon(g, diamondPoints({ x: point.x, y: point.y - 2 }, width * 0.34, height * 0.25), draftJoint ? 0x858b7f : 0x818b83, draftJoint ? 0.22 : 0.26, 0xffffff, 0);
  }
}

function drawRoadJointBlockwork(g: Graphics, point: ProjectedPoint, width: number, height: number, drivewayOnly: boolean, draftJoint: boolean) {
  const edgeAlpha = drivewayOnly ? 0.12 : draftJoint ? 0.18 : 0.15;
  const centerAlpha = drivewayOnly ? 0.08 : draftJoint ? 0.12 : 0.1;
  g
    .moveTo(point.x - width * 0.36, point.y + height * 0.08)
    .lineTo(point.x - width * 0.12, point.y + height * 0.22)
    .lineTo(point.x + width * 0.12, point.y + height * 0.1)
    .moveTo(point.x + width * 0.36, point.y + height * 0.08)
    .lineTo(point.x + width * 0.12, point.y + height * 0.22)
    .lineTo(point.x - width * 0.12, point.y + height * 0.1)
    .stroke({ color: 0xe6d09a, alpha: edgeAlpha, width: 1.15, cap: "round", join: "round" });

  g
    .moveTo(point.x - width * 0.14, point.y - height * 0.06)
    .lineTo(point.x + width * 0.12, point.y + height * 0.08)
    .moveTo(point.x + width * 0.15, point.y - height * 0.04)
    .lineTo(point.x - width * 0.1, point.y + height * 0.1)
    .stroke({ color: 0xf5e5bb, alpha: centerAlpha, width: 1, cap: "round", join: "round" });
}

function drawDrivewayJoinThroats(g: Graphics, joint: RoadJoint, point: ProjectedPoint, maxRoadWidth: number) {
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
    g
      .moveTo(point.x + ux * 2, point.y + uy * 2)
      .lineTo(point.x + ux * throatLength, point.y + uy * throatLength)
      .stroke({ color: 0xd8c79d, alpha: 0.28, width: 7, cap: "butt" });
    g
      .moveTo(point.x + ux * 5, point.y + uy * 5 + 1)
      .lineTo(point.x + ux * (throatLength - 2), point.y + uy * (throatLength - 2) + 1)
      .stroke({ color: 0x737c74, alpha: 0.34, width: 3.5, cap: "butt" });
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

function drawLot(g: Graphics, lot: CityWorldLot) {
  const point = project(lot.position);
  const width = lot.width * TILE_WIDTH;
  const height = lot.depth * TILE_HEIGHT;
  const lotContact = resolveLotContact(lot);
  const draftLot = lotContact.tone === "draft";
  const shellLot = lotContact.tone === "shell";
  const mutedLot = draftLot || shellLot;
  const quietPad = lotContact.profile === "foundation";
  const color = shellLot ? SHELL_LOT_COLORS[lot.kind] : draftLot ? DRAFT_LOT_COLORS[lot.kind] : LOT_COLORS[lot.kind];
  // Lots are ground material, not tinted film: near-opaque so aprons and
  // yards read as real surfaces instead of a translucent wash over grass.
  const lotAlpha = shellLot ? (quietPad ? 0.82 : 0.86) : draftLot ? (quietPad ? 0.84 : 0.86) : lotContact.profile === "shore" ? 0.55 : quietPad ? 0.94 : 0.96;
  const lotContactProfile = lot.visualGrammar?.contactProfile ?? "parcel_pad_shadow";
  const contactAlpha = shellLot
    ? lotContact.profile === "green"
      ? 0.12
      : 0.16
    : draftLot
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
  // Waterfront lots have real water terrain beneath them; a lot slab on top
  // reads as a glass sheet floating on the shore. Water carries the surface,
  // the lot contributes nothing.
  if (lotContact.profile === "shore") return;
  appendPolygon(g, diamondPoints({ x: point.x, y: point.y + 6 }, width * contactSpread, height * (contactSpread + 0.04)), 0x23342e, contactAlpha, 0x23342e, 0);
  if (!mutedLot && lotContactProfile === "landmark_base_shadow") {
    appendPolygon(g, diamondPoints({ x: point.x, y: point.y + 8 }, width * 0.86, height * 0.8), 0x1d2a24, 0.09, 0x1d2a24, 0);
  }
  appendPolygon(g, diamondPoints(point, width, height), color, lotAlpha, shellLot ? 0x747965 : draftLot ? 0x7f6d4e : 0x28473f, shellLot ? 0.16 : draftLot ? 0.14 : quietPad ? 0.1 : 0.18);
  g
    .moveTo(point.x - width * 0.5, point.y)
    .lineTo(point.x, point.y + height * 0.5)
    .lineTo(point.x + width * 0.5, point.y)
    .lineTo(point.x + width * 0.5, point.y + 4)
    .lineTo(point.x, point.y + height * 0.5 + 6)
    .lineTo(point.x - width * 0.5, point.y + 4)
    .closePath()
    .fill({ color: shadeColor(color, -28), alpha: shellLot ? 0.24 : draftLot ? 0.3 : quietPad ? 0.18 : 0.24 });
  appendPolygon(g, diamondPoints(point, width * 0.88, height * 0.82), shadeColor(color, mutedLot ? 7 : 10), shellLot ? 0.14 : draftLot ? 0.13 : quietPad ? 0.09 : 0.12, 0xffffff, 0);
  drawParcelElevationShelf(g, point, width, height, lot, color, mutedLot);
  drawLotWorldComposition(g, point, width, height, lot, color, mutedLot);
  drawLotEdgeBlockwork(g, point, width, height, lotContact, mutedLot);
  drawParcelEdgeTicks(g, point, width, height, lotContact);
  drawParcelCompositionDetails(g, point, width, height, lot);
  drawLotCurbCut(g, lotContact, point, width, height);
  if (draftLot) drawDraftLotMaterial(g, point, width, height, lot.kind);
  if (shellLot) drawShellLotMaterial(g, point, width, height, lot.kind);

  if (shellLot) {
    return;
  }

  if (lot.kind === "park") {
    g
      .moveTo(point.x - width * 0.28, point.y - height * 0.08)
      .lineTo(point.x - width * 0.05, point.y + height * 0.12)
      .lineTo(point.x + width * 0.25, point.y - height * 0.02)
      .stroke({ color: 0xf1d9a5, alpha: 0.72, width: 5, cap: "round", join: "round" });
    appendPolygon(g, diamondPoints({ x: point.x + width * 0.14, y: point.y + height * 0.16 }, 34, 18), 0xc3d989, 0.72, 0x5b8b52, 0.28);
  } else if (lot.kind === "home") {
    drawHomeLotDetails(g, point, width, height, color);
  } else if (lot.kind === "shop" || lot.kind === "civic") {
    drawForecourtPad(g, point, width, height, color, lot.kind === "civic");
    if (lot.kind === "civic") drawCivicLotComposition(g, point, width, height, color);
    for (let i = -2; i <= 2; i += 1) {
      g
        .moveTo(point.x + i * 24 - width * 0.25, point.y + height * 0.16)
        .lineTo(point.x + i * 24 + width * 0.04, point.y - height * 0.08);
    }
    g.stroke({ color: 0xf4e8c7, alpha: 0.2, width: 1 });
  } else if (lot.kind === "gym" || lot.kind === "apartments") {
    drawForecourtPad(g, point, width, height, color, false);
  } else if (lot.kind === "waterfront") {
    g
      .moveTo(point.x - width * 0.38, point.y - height * 0.08)
      .lineTo(point.x - width * 0.02, point.y + height * 0.12)
      .lineTo(point.x + width * 0.34, point.y - height * 0.04)
      .stroke({ color: 0xe9fbff, alpha: 0.42, width: 3, cap: "round", join: "round" });
  }
}

function drawShellLotMaterial(g: Graphics, point: ProjectedPoint, width: number, height: number, kind: CityWorldLot["kind"]) {
  if (kind === "park" || kind === "waterfront") return;

  appendPolygon(
    g,
    diamondPoints({ x: point.x + width * 0.08, y: point.y - height * 0.08 }, width * 0.3, height * 0.18),
    0xd4d0b8,
    0.14,
    0xffffff,
    0,
  );
  g
    .moveTo(point.x - width * 0.4, point.y + height * 0.1)
    .lineTo(point.x - width * 0.16, point.y + height * 0.23)
    .lineTo(point.x + width * 0.08, point.y + height * 0.1)
    .moveTo(point.x + width * 0.4, point.y + height * 0.08)
    .lineTo(point.x + width * 0.16, point.y + height * 0.22)
    .lineTo(point.x - width * 0.06, point.y + height * 0.1)
    .stroke({ color: 0x6f7565, alpha: kind === "civic" ? 0.22 : 0.18, width: 1.15, cap: "round", join: "round" });
}

function drawLotWorldComposition(g: Graphics, point: ProjectedPoint, width: number, height: number, lot: CityWorldLot, color: number, draftLot: boolean) {
  if (draftLot || lot.kind === "park" || lot.kind === "waterfront") return;

  const profile = lot.visualGrammar?.lotProfile;

  if (profile === "residential_yard_grid") {
    const variant = objectVariant(lot.id, 4);
    const yardSide = variant % 2 === 0 ? -1 : 1;
    appendPolygon(
      g,
      diamondPoints({ x: point.x + yardSide * width * 0.18, y: point.y - height * 0.08 }, width * 0.22, height * 0.22),
      shadeColor(color, variant === 3 ? -8 : 12),
      0.12,
      0xffffff,
      0,
    );
    appendPolygon(
      g,
      diamondPoints({ x: point.x - yardSide * width * 0.16, y: point.y + height * 0.27 }, width * 0.34, height * 0.13),
      shadeColor(color, 18),
      0.15,
      0xffffff,
      0,
    );
    g
      .moveTo(point.x - width * 0.42, point.y - height * 0.08)
      .lineTo(point.x - width * 0.12, point.y + height * 0.08)
      .lineTo(point.x + width * 0.2, point.y - height * 0.06)
      .moveTo(point.x + width * 0.42, point.y + height * 0.06)
      .lineTo(point.x + width * 0.12, point.y + height * 0.22)
      .lineTo(point.x - width * 0.1, point.y + height * 0.1)
      .stroke({ color: 0x557a4e, alpha: 0.16, width: 1.1, cap: "round", join: "round" });
    g
      .moveTo(point.x - yardSide * width * 0.02, point.y + height * 0.08)
      .lineTo(point.x - yardSide * width * 0.2, point.y + height * 0.42)
      .stroke({ color: 0xf1ddad, alpha: 0.26, width: Math.max(1.6, width * 0.026), cap: "round" });
    return;
  }

  if (profile === "landmark_civic_ground") {
    appendPolygon(
      g,
      diamondPoints({ x: point.x, y: point.y + height * 0.34 }, width * 0.38, height * 0.16),
      0xf2ddb3,
      0.28,
      0x7f6d4e,
      0.08,
    );
    g
      .moveTo(point.x - width * 0.46, point.y + height * 0.1)
      .lineTo(point.x - width * 0.2, point.y + height * 0.24)
      .lineTo(point.x + width * 0.08, point.y + height * 0.12)
      .moveTo(point.x + width * 0.46, point.y + height * 0.08)
      .lineTo(point.x + width * 0.2, point.y + height * 0.23)
      .lineTo(point.x - width * 0.08, point.y + height * 0.11)
      .moveTo(point.x - width * 0.22, point.y - height * 0.18)
      .lineTo(point.x + width * 0.18, point.y + height * 0.02)
      .stroke({ color: 0xf8eac7, alpha: 0.24, width: 1.45, cap: "round", join: "round" });
    return;
  }

  if (profile === "commercial_forecourt" || profile === "apartment_court") {
    appendPolygon(
      g,
      diamondPoints({ x: point.x, y: point.y + height * 0.36 }, width * 0.72, height * 0.16),
      profile === "apartment_court" ? 0xdac7a1 : 0xe8cf9f,
      0.18,
      0x7f6d4e,
      0.06,
    );
    const count = profile === "apartment_court" ? 3 : 5;
    for (let index = 0; index < count; index += 1) {
      const offset = (index / Math.max(1, count - 1) - 0.5) * width * 0.54;
      g
        .moveTo(point.x + offset - width * 0.04, point.y + height * 0.24)
        .lineTo(point.x + offset + width * 0.06, point.y + height * 0.31);
    }
    g.stroke({ color: 0xf6e8c8, alpha: 0.16, width: 1, cap: "round" });
  }
}

function drawParcelElevationShelf(g: Graphics, point: ProjectedPoint, width: number, height: number, lot: CityWorldLot, color: number, draftLot: boolean) {
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
  g
    .moveTo(point.x - width * 0.5, point.y)
    .lineTo(point.x, point.y + height * 0.5)
    .lineTo(point.x, point.y + height * 0.5 + depth)
    .lineTo(point.x - width * 0.5, point.y + depth)
    .closePath()
    .fill({ color: sunlitColor(shadeColor(color, -8), "sun"), alpha: alpha * 0.8 });
  g
    .moveTo(point.x, point.y + height * 0.5)
    .lineTo(point.x + width * 0.5, point.y)
    .lineTo(point.x + width * 0.5, point.y + depth)
    .lineTo(point.x, point.y + height * 0.5 + depth)
    .closePath()
    .fill({ color: sunlitColor(color, "shade"), alpha });
  g
    .moveTo(point.x - width * 0.5, point.y + depth * 0.55)
    .lineTo(point.x, point.y + height * 0.5 + depth * 0.75)
    .lineTo(point.x + width * 0.5, point.y + depth * 0.55)
    .stroke({ color: elevation === "waterfront_bank_cut" ? 0xe9fbff : 0xf1dfb7, alpha: elevation === "waterfront_bank_cut" ? 0.2 : 0.14, width: 1.2, cap: "round", join: "round" });

  if (elevation === "civic_plinth_stack") {
    g
      .moveTo(point.x - width * 0.34, point.y + height * 0.2)
      .lineTo(point.x, point.y + height * 0.38)
      .lineTo(point.x + width * 0.34, point.y + height * 0.2)
      .moveTo(point.x - width * 0.24, point.y + height * 0.28)
      .lineTo(point.x, point.y + height * 0.42)
      .lineTo(point.x + width * 0.24, point.y + height * 0.28)
      .stroke({ color: 0x8b7954, alpha: 0.22, width: 1.15, cap: "round", join: "round" });
  }
}

function drawLotEdgeBlockwork(g: Graphics, point: ProjectedPoint, width: number, height: number, lotContact: CityWorldLotContactGrammar, draftLot: boolean) {
  if (lotContact.profile === "shore" || lotContact.profile === "green") return;

  const quiet = lotContact.profile === "foundation";
  const alpha = draftLot ? 0.16 : quiet ? 0.1 : 0.14;
  const edgeColor = quiet ? 0xe9ddb4 : 0xf0dfb7;
  g
    .moveTo(point.x - width * 0.46, point.y + height * 0.02)
    .lineTo(point.x - width * 0.18, point.y + height * 0.18)
    .lineTo(point.x + width * 0.08, point.y + height * 0.05)
    .moveTo(point.x + width * 0.46, point.y + height * 0.02)
    .lineTo(point.x + width * 0.18, point.y + height * 0.18)
    .lineTo(point.x - width * 0.08, point.y + height * 0.05)
    .stroke({ color: edgeColor, alpha, width: quiet ? 1 : 1.2, cap: "round", join: "round" });

  const blockCount = quiet ? 3 : 5;
  for (let block = 0; block < blockCount; block += 1) {
    const t = block / (blockCount - 1);
    const x = point.x - width * 0.28 + t * width * 0.56;
    g
      .moveTo(x - width * 0.035, point.y + height * 0.26)
      .lineTo(x + width * 0.025, point.y + height * 0.3);
  }
  g.stroke({ color: 0x7f6d4e, alpha: draftLot ? 0.14 : quiet ? 0.08 : 0.12, width: 0.9, cap: "round" });
}

// Curb-cut / walk join toward the serving road, authored by the compiler as
// lotContact.curbCutEdge. This is the driveway-mouth read that makes a parcel
// look served by its street instead of floating beside it.
function drawLotCurbCut(g: Graphics, lotContact: CityWorldLotContactGrammar, point: ProjectedPoint, width: number, height: number) {
  if (!lotContact.curbCutEdge || lotContact.profile === "shore") return;

  const draft = lotContact.tone === "draft";
  const green = lotContact.profile === "green";
  const quiet = lotContact.profile === "foundation";
  const edgePoint = lotCurbPoint(point, width, height, lotContact.curbCutEdge);
  const apronWidth = Math.max(quiet ? 12 : 20, width * (quiet ? 0.18 : 0.26));
  const apronHeight = Math.max(quiet ? 5 : 8, height * (quiet ? 0.08 : 0.12));
  appendPolygon(
    g,
    diamondPoints(edgePoint, apronWidth, apronHeight),
    LOT_CURB_CUT_STYLE.apron,
    draft ? 0.16 : green ? 0.22 : quiet ? 0.3 : 0.4,
    LOT_CURB_CUT_STYLE.groove,
    draft ? 0.08 : 0.16,
  );

  if (!green) {
    g
      .moveTo(point.x, point.y + height * 0.06)
      .lineTo(edgePoint.x, edgePoint.y)
      .stroke({ color: LOT_CURB_CUT_STYLE.walk, alpha: draft ? 0.14 : quiet ? 0.28 : 0.34, width: quiet ? 1.8 : 2.6, cap: "round" });
  }
}

function drawDraftLotMaterial(g: Graphics, point: ProjectedPoint, width: number, height: number, kind: CityWorldLot["kind"]) {
  if (kind === "park" || kind === "waterfront") return;

  appendPolygon(
    g,
    diamondPoints({ x: point.x + width * 0.12, y: point.y - height * 0.08 }, width * 0.32, height * 0.2),
    kind === "civic" ? 0xeadab8 : 0xe6d2a6,
    0.16,
    0xffffff,
    0,
  );
  g
    .moveTo(point.x - width * 0.44, point.y + height * 0.08)
    .lineTo(point.x - width * 0.18, point.y + height * 0.23)
    .lineTo(point.x + width * 0.06, point.y + height * 0.12)
    .moveTo(point.x + width * 0.44, point.y + height * 0.06)
    .lineTo(point.x + width * 0.18, point.y + height * 0.22)
    .lineTo(point.x - width * 0.04, point.y + height * 0.1)
    .stroke({ color: 0x8b7954, alpha: kind === "civic" ? 0.26 : 0.2, width: 1.25, cap: "round", join: "round" });
}

function drawParcelEdgeTicks(g: Graphics, point: ProjectedPoint, width: number, height: number, lotContact: CityWorldLotContactGrammar) {
  if (lotContact.profile === "shore" || lotContact.profile === "green") return;

  const alpha = lotContact.profile === "foundation" ? 0.18 : 0.22;
  const color = lotContact.profile === "foundation" ? 0xf2e4b8 : 0xf4e8c7;
  const leftX = point.x - width * 0.5;
  const rightX = point.x + width * 0.5;
  const topY = point.y - height * 0.5;
  const bottomY = point.y + height * 0.5;

  g
    .moveTo(leftX + width * 0.16, point.y + height * 0.16)
    .lineTo(leftX + width * 0.28, point.y + height * 0.28)
    .moveTo(rightX - width * 0.16, point.y + height * 0.16)
    .lineTo(rightX - width * 0.28, point.y + height * 0.28)
    .moveTo(point.x - width * 0.16, topY + height * 0.16)
    .lineTo(point.x - width * 0.28, topY + height * 0.28)
    .moveTo(point.x + width * 0.16, bottomY - height * 0.16)
    .lineTo(point.x + width * 0.28, bottomY - height * 0.28)
    .stroke({ color, alpha, width: 1, cap: "round" });
}

function drawParcelCompositionDetails(g: Graphics, point: ProjectedPoint, width: number, height: number, lot: CityWorldLot) {
  const composition = lot.visualGrammar?.parcelComposition;
  if (!composition) return;

  if (composition === "home_yard_grid") {
    g
      .moveTo(point.x - width * 0.42, point.y - height * 0.03)
      .lineTo(point.x - width * 0.13, point.y + height * 0.13)
      .lineTo(point.x + width * 0.12, point.y + height * 0.02)
      .moveTo(point.x + width * 0.42, point.y - height * 0.02)
      .lineTo(point.x + width * 0.13, point.y + height * 0.13)
      .lineTo(point.x - width * 0.12, point.y + height * 0.02)
      .moveTo(point.x - width * 0.18, point.y - height * 0.22)
      .lineTo(point.x + width * 0.14, point.y - height * 0.04)
      .stroke({ color: 0xdbe8ab, alpha: 0.12, width: 1.1, cap: "round", join: "round" });
    return;
  }

  if (composition === "commercial_apron") {
    for (let lane = -2; lane <= 2; lane += 1) {
      g
        .moveTo(point.x + lane * width * 0.08 - width * 0.18, point.y + height * 0.22)
        .lineTo(point.x + lane * width * 0.08 + width * 0.1, point.y + height * 0.06);
    }
    g
      .moveTo(point.x - width * 0.36, point.y + height * 0.3)
      .lineTo(point.x, point.y + height * 0.46)
      .lineTo(point.x + width * 0.36, point.y + height * 0.3)
      .stroke({ color: 0xffe9bf, alpha: 0.18, width: 1.15, cap: "round", join: "round" });
    return;
  }

  if (composition === "civic_landmark_plinth") {
    appendPolygon(g, diamondPoints({ x: point.x, y: point.y + height * 0.26 }, width * 0.72, height * 0.2), 0xe7d4aa, 0.18, 0x8b7954, 0.08);
    g
      .moveTo(point.x - width * 0.28, point.y + height * 0.16)
      .lineTo(point.x, point.y + height * 0.32)
      .lineTo(point.x + width * 0.28, point.y + height * 0.16)
      .moveTo(point.x - width * 0.16, point.y + height * 0.24)
      .lineTo(point.x, point.y + height * 0.34)
      .lineTo(point.x + width * 0.16, point.y + height * 0.24)
      .stroke({ color: 0x8b7954, alpha: 0.18, width: 1.2, cap: "round", join: "round" });
    return;
  }

  if (composition === "apartment_court_grid") {
    appendPolygon(g, diamondPoints({ x: point.x - width * 0.08, y: point.y + height * 0.03 }, width * 0.46, height * 0.28), 0xd7c59d, 0.14, 0xffffff, 0);
    g
      .moveTo(point.x - width * 0.34, point.y + height * 0.1)
      .lineTo(point.x - width * 0.05, point.y + height * 0.25)
      .lineTo(point.x + width * 0.26, point.y + height * 0.1)
      .moveTo(point.x - width * 0.2, point.y - height * 0.08)
      .lineTo(point.x + width * 0.18, point.y + height * 0.1)
      .stroke({ color: 0xf4e7c3, alpha: 0.18, width: 1, cap: "round", join: "round" });
    return;
  }

  if (composition === "park_path_basin") {
    g
      .moveTo(point.x - width * 0.32, point.y - height * 0.1)
      .lineTo(point.x - width * 0.08, point.y + height * 0.08)
      .lineTo(point.x + width * 0.28, point.y - height * 0.04)
      .stroke({ color: 0xf1d9a5, alpha: 0.2, width: 2.2, cap: "round", join: "round" });
    return;
  }

  if (composition === "waterfront_bank" || composition === "hidden_draft_anchor_pad") {
    const strataColor = composition === "hidden_draft_anchor_pad" ? 0x8b7954 : 0xe9fbff;
    g
      .moveTo(point.x - width * 0.42, point.y + height * 0.04)
      .lineTo(point.x - width * 0.12, point.y + height * 0.2)
      .lineTo(point.x + width * 0.2, point.y + height * 0.06)
      .moveTo(point.x + width * 0.42, point.y + height * 0.02)
      .lineTo(point.x + width * 0.14, point.y + height * 0.2)
      .lineTo(point.x - width * 0.14, point.y + height * 0.08)
      .stroke({ color: strataColor, alpha: composition === "hidden_draft_anchor_pad" ? 0.18 : 0.22, width: 1.25, cap: "round", join: "round" });
  }
}

function drawHomeLotDetails(g: Graphics, point: ProjectedPoint, width: number, height: number, color: number) {
  const variation = Math.abs(Math.round(point.x * 0.17 + point.y * 0.11)) % 3;
  const padOffset = variation === 0 ? -0.1 : variation === 1 ? 0 : 0.08;
  appendPolygon(g, diamondPoints({ x: point.x + width * padOffset, y: point.y - height * 0.06 }, width * 0.56, height * 0.42), shadeColor(color, 18), 0.17, 0xffffff, 0);
  appendPolygon(g, diamondPoints({ x: point.x - width * (variation === 2 ? 0.02 : 0.13), y: point.y + height * 0.06 }, width * 0.34, height * 0.22), shadeColor(color, -10), 0.12, 0x28473f, 0);
  appendPolygon(g, diamondPoints({ x: point.x + width * 0.19, y: point.y - height * 0.02 }, width * 0.18, height * 0.2), shadeColor(color, 6), 0.1, 0xffffff, 0);
  appendPolygon(
    g,
    diamondPoints({ x: point.x + width * (variation === 0 ? -0.18 : 0.18), y: point.y + height * 0.23 }, width * 0.24, height * 0.12),
    shadeColor(color, 10),
    0.12,
    0xffffff,
    0,
  );
  g
    .moveTo(point.x + width * padOffset * 0.6, point.y + height * 0.02)
    .lineTo(point.x + (variation === 1 ? width * 0.14 : 0), point.y + height * 0.38)
    .stroke({ color: 0xf1ddad, alpha: 0.3, width: Math.max(2, width * 0.035), cap: "round" });
  g
    .moveTo(point.x - width * 0.36, point.y - height * 0.02)
    .lineTo(point.x - width * 0.04, point.y + height * 0.16)
    .moveTo(point.x + width * 0.36, point.y - height * 0.02)
    .lineTo(point.x + width * 0.08, point.y + height * 0.16)
    .stroke({ color: 0xf2e4b8, alpha: 0.12, width: 1, cap: "round" });
  g
    .moveTo(point.x - width * 0.43, point.y + height * 0.08)
    .lineTo(point.x - width * 0.2, point.y + height * 0.22)
    .lineTo(point.x - width * 0.02, point.y + height * 0.14)
    .moveTo(point.x + width * 0.43, point.y + height * 0.07)
    .lineTo(point.x + width * 0.2, point.y + height * 0.22)
    .lineTo(point.x + width * 0.02, point.y + height * 0.13)
    .stroke({ color: 0x6f8a59, alpha: 0.14, width: 1.1, cap: "round", join: "round" });
}

function drawForecourtPad(g: Graphics, point: ProjectedPoint, width: number, height: number, color: number, civic: boolean) {
  appendPolygon(
    g,
    diamondPoints({ x: point.x + width * 0.04, y: point.y + height * 0.14 }, width * (civic ? 0.72 : 0.62), height * 0.3),
    shadeColor(color, civic ? 12 : 8),
    civic ? 0.18 : 0.16,
    0xffffff,
    0,
  );
  g
    .moveTo(point.x - width * 0.27, point.y + height * 0.28)
    .lineTo(point.x, point.y + height * 0.42)
    .lineTo(point.x + width * 0.28, point.y + height * 0.28)
    .stroke({ color: 0xf6e8c8, alpha: civic ? 0.24 : 0.2, width: 1.1, cap: "round", join: "round" });

  if (civic) {
    appendPolygon(g, diamondPoints({ x: point.x, y: point.y + height * 0.1 }, width * 0.32, height * 0.16), 0xf3dfbd, 0.24, 0x7f6d4e, 0.08);
    g
      .moveTo(point.x - width * 0.16, point.y + height * 0.04)
      .lineTo(point.x, point.y + height * 0.18)
      .lineTo(point.x + width * 0.16, point.y + height * 0.04)
      .moveTo(point.x, point.y + height * 0.18)
      .lineTo(point.x, point.y + height * 0.43)
      .stroke({ color: 0xffefd1, alpha: 0.28, width: 3.2, cap: "round", join: "round" });
    g
      .moveTo(point.x - width * 0.42, point.y + height * 0.04)
      .lineTo(point.x - width * 0.23, point.y + height * 0.15)
      .lineTo(point.x - width * 0.06, point.y + height * 0.06)
      .moveTo(point.x + width * 0.42, point.y + height * 0.04)
      .lineTo(point.x + width * 0.23, point.y + height * 0.15)
      .lineTo(point.x + width * 0.06, point.y + height * 0.06)
      .stroke({ color: 0xf6e8c8, alpha: 0.2, width: 1.4, cap: "round", join: "round" });
  }
}

function drawCivicLotComposition(g: Graphics, point: ProjectedPoint, width: number, height: number, color: number) {
  // Order preserved from the old child order: plinth shadow under the green/
  // court fields, then the stroke systems.
  appendPolygon(
    g,
    diamondPoints({ x: point.x, y: point.y + height * 0.24 }, width * 0.78, height * 0.18),
    0x263a34,
    0.12,
    0x263a34,
    0,
  );
  appendPolygon(
    g,
    diamondPoints({ x: point.x - width * 0.18, y: point.y - height * 0.12 }, width * 0.32, height * 0.2),
    0xaed08a,
    0.18,
    0x5d7a4f,
    0.08,
  );
  appendPolygon(
    g,
    diamondPoints({ x: point.x + width * 0.18, y: point.y - height * 0.1 }, width * 0.34, height * 0.22),
    shadeColor(color, 18),
    0.24,
    0x8b7954,
    0.1,
  );

  for (let lane = -2; lane <= 2; lane += 1) {
    g
      .moveTo(point.x + lane * width * 0.08 - width * 0.16, point.y + height * 0.02)
      .lineTo(point.x + lane * width * 0.08 + width * 0.06, point.y + height * 0.14)
      .moveTo(point.x + lane * width * 0.08 - width * 0.06, point.y + height * 0.24)
      .lineTo(point.x + lane * width * 0.08 + width * 0.16, point.y + height * 0.12);
  }
  g.stroke({ color: 0xfff0cf, alpha: 0.18, width: 1, cap: "round", join: "round" });

  g
    .moveTo(point.x - width * 0.3, point.y + height * 0.18)
    .lineTo(point.x, point.y + height * 0.34)
    .lineTo(point.x + width * 0.3, point.y + height * 0.18)
    .moveTo(point.x - width * 0.22, point.y + height * 0.24)
    .lineTo(point.x, point.y + height * 0.36)
    .lineTo(point.x + width * 0.22, point.y + height * 0.24)
    .moveTo(point.x - width * 0.13, point.y + height * 0.3)
    .lineTo(point.x, point.y + height * 0.38)
    .lineTo(point.x + width * 0.13, point.y + height * 0.3)
    .stroke({ color: 0x8b7954, alpha: 0.24, width: 1.2, cap: "round", join: "round" });

  g
    .moveTo(point.x - width * 0.48, point.y + height * 0.03)
    .lineTo(point.x - width * 0.32, point.y + height * 0.14)
    .lineTo(point.x - width * 0.16, point.y + height * 0.06)
    .moveTo(point.x + width * 0.48, point.y + height * 0.02)
    .lineTo(point.x + width * 0.32, point.y + height * 0.14)
    .lineTo(point.x + width * 0.16, point.y + height * 0.06)
    .stroke({ color: 0x7f6d4e, alpha: 0.18, width: 1.2, cap: "round", join: "round" });
}

function drawBuilding(
  layers: LayerMap,
  layer: Container,
  building: CityWorldBuilding,
  atlas: CityWorldAtlasResolver,
  materialTextureEnabled: boolean,
  generatedSignage: GeneratedSignageState,
) {
  // The base scene is focus-agnostic: hover/selection emphasis draws in the
  // focusLayer overlay so focus changes never rebuild these Graphics.
  const geometry = createBuildingGeometry(building, atlas);
  // W4.1 attachments (porches/awnings/chimneys/AC/dormers) are authored as
  // tiny sub-buildings. Draw them MINIMALLY: one Graphics of walls+roof —
  // no pad, no cast shadow, no facade/material machinery. A full building
  // draw per attachment blew the Graphics ceiling (1621/1600 measured).
  if (building.visualGrammar?.buildingAttachment) {
    drawAttachmentBlock(layer, geometry, building);
    return;
  }
  // Foundation pads are ground decals: they live in a shared layer below every
  // cast shadow so shadows land ON pads instead of being washed out by them.
  drawBuildingFootprint(layers.padLayer, geometry, building);
  drawBuildingCastShadow(layers.shadowLayer, building);

  if (geometry.asset.mode === "sprite") {
    drawSpriteBuilding(layer, geometry, building);
    drawGeneratedStorefrontSignage(layer, geometry, building, generatedSignage);
    return;
  }

  // One facade system draws every vector building: opaque walls, a roof, and
  // a wall-plane window/storefront grid. The legacy per-kind + per-family
  // "authorship" overlay stack (15 functions of translucent screen-space
  // decals) is retired — misregistered decals were the ghost-facade defect.
  drawBuildingShell(layer, geometry, building, materialTextureEnabled);
  drawGeneratedStorefrontSignage(layer, geometry, building, generatedSignage);
}

function drawGeneratedStorefrontSignage(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, state: GeneratedSignageState) {
  if (!isGeneratedStorefrontSignCandidate(building) || state.count >= state.max) return;
  const { top, footprintWidth, footprintDepth, height, roofColor, accentColor, highlightColor, trimColor } = geometry;
  const variant = objectVariant(building.id, 613);
  const signWidth = Math.max(22, Math.min(footprintWidth * (building.kind === "gym" ? 0.62 : 0.72), 68));
  const signHeight = building.kind === "gym" ? 9 : 8;
  const x = top.x + ((variant % 3) - 1) * footprintWidth * 0.06;
  const y = top.y + footprintDepth * 0.5 + Math.min(height * 0.34, building.kind === "gym" ? 15 : 12);
  const boardColor = variant % 3 === 0 ? accentColor : variant % 3 === 1 ? shadeColor(roofColor, 18) : mixColor(accentColor, highlightColor, 0.35);
  const sign = new Graphics()
    .roundRect(x - signWidth / 2, y, signWidth, signHeight, 1.5)
    .fill({ color: boardColor, alpha: 0.94 })
    .stroke({ color: shadeColor(trimColor, -32), alpha: 0.58, width: 1 });

  drawGeneratedSignGlyphBlocks(sign, x - signWidth * 0.4, y + 1.7, signWidth * 0.8, signHeight - 3.2, variant, highlightColor);
  layer.addChild(sign);
  state.count += 1;
}

function isGeneratedStorefrontSignCandidate(building: CityWorldBuilding): boolean {
  if (!building.id.startsWith("gen-building-") && !building.id.startsWith("gen-landmark-")) return false;
  if (building.visualGrammar?.buildingAttachment) return false;
  return building.kind === "shop" || building.kind === "gym" || building.facadeStyle === "strip_store" || building.facadeStyle === "storefront";
}

function drawGeneratedSignGlyphBlocks(g: Graphics, left: number, top: number, width: number, height: number, variant: number, color: number) {
  const glyphCount = variant % 2 === 0 ? 4 : 5;
  const gap = Math.max(1.2, width * 0.025);
  const cellWidth = (width - gap * (glyphCount - 1)) / glyphCount;
  for (let glyph = 0; glyph < glyphCount; glyph += 1) {
    drawAbstractBlockGlyph(g, left + glyph * (cellWidth + gap), top, cellWidth, height, (glyph + variant) % 6, color);
  }
}

function drawAbstractBlockGlyph(g: Graphics, x: number, y: number, width: number, height: number, variant: number, color: number) {
  const bar = Math.max(1.2, width * 0.22);
  const alpha = 0.88;
  if (variant === 0) {
    g.rect(x, y, bar, height).rect(x, y, width, bar).rect(x, y + height - bar, width * 0.78, bar);
  } else if (variant === 1) {
    g.rect(x, y, width, bar).rect(x + width - bar, y, bar, height).rect(x, y + height * 0.45, width, bar);
  } else if (variant === 2) {
    g.rect(x, y, bar, height).rect(x + width - bar, y, bar, height).rect(x, y + height * 0.42, width, bar);
  } else if (variant === 3) {
    g.rect(x, y, width, bar).rect(x + width * 0.38, y, bar, height).rect(x, y + height - bar, width, bar);
  } else if (variant === 4) {
    g.rect(x, y, bar, height).rect(x, y, width, bar).rect(x + width - bar, y + height * 0.36, bar, height * 0.64);
  } else {
    g.rect(x, y, width, bar).rect(x, y + height * 0.42, width, bar).rect(x, y + height - bar, width, bar);
  }
  g.fill({ color, alpha });
}

function createBuildingGeometry(building: CityWorldBuilding, atlas: CityWorldAtlasResolver): BuildingGeometry {
  const bottom = project(building.position);
  const top = project({ x: building.position.x, y: building.position.y, z: (building.position.z ?? 0) + building.height });
  const asset = atlas.resolveAsset(building.spriteKey, building.paletteKey, "building");
  const useAuthoredDraftColors = isDraftBuilding(building);
  const useShellColors = isShellBuilding(building);
  return {
    bottom,
    top,
    footprintWidth: building.width * TILE_WIDTH,
    footprintDepth: building.depth * TILE_HEIGHT,
    height: building.height * TILE_DEPTH,
    bodyColor: useShellColors ? 0xb9bca2 : useAuthoredDraftColors ? colorToNumber(building.bodyColor ?? asset.palette.colors.base) : paletteColor(asset.palette.colors.base, building.bodyColor),
    roofColor: useShellColors ? 0x9ca58d : useAuthoredDraftColors ? colorToNumber(building.roofColor ?? asset.palette.colors.roof ?? "#8c9b75") : paletteColor(asset.palette.colors.roof, building.roofColor),
    highlightColor: useShellColors ? 0xe4dec6 : useAuthoredDraftColors ? 0xf8e8ca : paletteColor(asset.palette.colors.highlight, "#fff4d8"),
    accentColor: useShellColors ? 0x80928c : useAuthoredDraftColors ? 0x5f8f8a : paletteColor(asset.palette.colors.accent, asset.palette.colors.roof ?? "#ffcf56"),
    trimColor: useShellColors ? 0x5f665b : useAuthoredDraftColors ? 0x5f5547 : paletteColor(asset.palette.colors.trim, "#26332c"),
    outline: 0x26332c,
    activeStrokeAlpha: 0.38,
    asset,
  };
}

function isDraftBuilding(building: CityWorldBuilding) {
  return building.id.startsWith("draft-building-");
}

function isShellBuilding(building: CityWorldBuilding) {
  return building.id.startsWith("shell-building-");
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

function drawSpriteBuilding(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { bottom, footprintDepth, asset } = geometry;
  if (asset.mode !== "sprite") return;

  drawSpriteBuildingFitDetails(layer, geometry, building);

  const sprite = new Sprite(asset.texture);
  sprite.anchor.set(asset.anchor.x, asset.anchor.y);
  // 0.53E Hero Silhouette (item A) — deterministic per-home variety kills the
  // clone read without new art: hash-based horizontal mirror + gentle scale
  // jitter break the "one model repeated" row, all keyed on the building id so
  // it is stable across frames. Homes only; commerce sprites stay uniform.
  const home = building.kind === "home";
  const variant = objectVariant(building.id, 97);
  const flip = home && variant % 2 === 0 ? -1 : 1;
  const jitter = home ? 0.95 + (variant % 11) / 100 : 1; // 0.95–1.05
  // 0.57E generated-district parity — sprites must FIT the building footprint
  // they stand on. Curated Riverside footprints match the authored art
  // (ratio ~1, unchanged); parametric districts author arbitrary widths, and
  // a fixed-scale sprite there read as a toy box floating on its apron. The
  // fit is clamped so damaged ratios can never balloon or vanish a sprite.
  const displayWidth = asset.texture.width * asset.scale;
  const footprintFit = displayWidth > 0 ? clamp(geometry.footprintWidth / displayWidth, 0.72, 1.45) : 1;
  sprite.scale.set(asset.scale * footprintFit * jitter * flip, asset.scale * footprintFit * jitter);
  sprite.position.set(Math.round(bottom.x), Math.round(bottom.y + footprintDepth * 0.5));
  // Honor the building's assigned palette-variant ramp on screen: gently wash
  // the textured sprite toward its resolved body color so sprite-mode buildings
  // (rowhomes, strip stores) read the same variant identity the diagnostics key
  // on. Kept subtle (mixed toward white) so authored SVG art is preserved.
  // For homes, spread the wash factor + a whisper of warm/cool per house so no
  // two neighbours read identical — still the resolved palette, never raw color.
  let homeTint = geometry.bodyColor;
  if (home) {
    const warmCool = (variant % 3) - 1;
    if (warmCool > 0) homeTint = mixColor(homeTint, SUN_WARM_TINT, 0.07);
    else if (warmCool < 0) homeTint = mixColor(homeTint, SUN_COOL_TINT, 0.06);
  }
  // 0.68H sprite tint wash — homes keep just enough wash to hold their
  // palette-variant identity; commerce sprites drop to a whisper so the
  // authored art carries its own crisp material read.
  sprite.tint = mixColor(0xffffff, homeTint, home ? 0.14 + (variant % 7) * 0.018 : 0.12);
  sprite.label = `sprite-${building.id}`;
  layer.addChild(sprite);

  if (home) {
    drawHomeStoop(layer, geometry, building, flip);
    drawHomeRoofAccent(layer, geometry, building, flip, variant);
  }

}

function drawSpriteBuildingFitDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, trimColor } = geometry;
  const style = building.facadeStyle ?? building.kind;
  // Ground contact for sprite buildings comes from the shared foundation pad
  // + contact shadow in drawBuildingFootprint. The extra per-sprite contact
  // diamond, base-shadow stroke, apron, and awning strokes stacked into the
  // translucent smear ring around every sprite — removed.
  if (style === "rowhome") {
    const stoops = new Graphics();
    for (let bay = 0; bay < 3; bay += 1) {
      const offset = (bay / 2 - 0.5) * footprintWidth * 0.56;
      const yLift = bay === 1 ? -2 : 0;
      stoops
        .roundRect(top.x + offset - footprintWidth * 0.035, bottom.y + footprintDepth * 0.22 + yLift, footprintWidth * 0.07, 5.5, 1.5)
        .fill({ color: 0xf2d8a6, alpha: 0.9 })
        .roundRect(top.x + offset - footprintWidth * 0.04, bottom.y + footprintDepth * 0.15 + yLift, footprintWidth * 0.08, 9, 1.5)
        .stroke({ color: trimColor, alpha: 0.3, width: 0.9 });
    }
    layer.addChild(stoops);
  }
}

// 0.53E Hero Silhouette (item A finish) — tiny deterministic roof accents so
// pitched homes stop reading as one repeated model: every gable/hip home gets a
// ridge shadow line, and by hash a third get a chimney fleck, a third a front
// dormer, a third stay quiet. Whisper-small on purpose — at overview zoom they
// read as variety, not detail. Follows the same per-home mirror as the sprite.
function drawHomeRoofAccent(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, flip: number, variant: number) {
  const roofShape = building.roofShape ?? "flat";
  if (roofShape !== "gable" && roofShape !== "hip") return;
  const { top, footprintWidth, footprintDepth, roofColor, bodyColor } = geometry;

  const ridge = new Graphics()
    .moveTo(top.x - flip * footprintWidth * 0.22, top.y - footprintDepth * 0.08)
    .lineTo(top.x + flip * footprintWidth * 0.18, top.y + footprintDepth * 0.08);
  ridge.stroke({ color: shadeColor(roofColor, -34), alpha: 0.3, width: 1.1, cap: "round" });
  layer.addChild(ridge);

  if (variant % 3 === 0) {
    const cx = top.x + flip * footprintWidth * 0.16;
    const cy = top.y + footprintDepth * 0.04;
    const chimney = new Graphics()
      .rect(cx - 1.2, cy - 5, 2.4, 5)
      .fill({ color: sunlitColor(shadeColor(bodyColor, -18), "sun"), alpha: 0.88 })
      .rect(cx - 1.6, cy - 6, 3.2, 1.2)
      .fill({ color: mixColor(shadeColor(roofColor, 34), SUN_WARM_TINT, 0.25), alpha: 0.88 });
    layer.addChild(chimney);
  } else if (variant % 3 === 1 && building.facadeStyle !== "cottage") {
    // cottages already carry an authored dormer — no double-stamping
    const dx = top.x - flip * footprintWidth * 0.09;
    const dy = top.y + footprintDepth * 0.2;
    const dormer = new Graphics()
      .rect(dx - 2.1, dy - 2.4, 4.2, 3.2)
      .fill({ color: sunlitColor(bodyColor, "sun"), alpha: 0.82 })
      .poly([dx - 2.7, dy - 2.4, dx, dy - 4.2, dx + 2.7, dy - 2.4], true)
      .fill({ color: buildingFaceColor(roofColor, "top"), alpha: 0.88 }); // 0.68H — pigmented top curve
    layer.addChild(dormer);
  }
}

// 0.53E Hero Silhouette (item A finish) — a front entry stoop: a small warm pad
// at the facade base plus a short walk stub toward the street, mirrored with
// the house. Grounds each home with an authored entrance; rowhomes keep their
// existing per-bay stoops so this skips them.
function drawHomeStoop(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, flip: number) {
  if (building.facadeStyle === "rowhome") return;
  const { bottom, footprintWidth, footprintDepth, trimColor } = geometry;
  const px = bottom.x + flip * footprintWidth * 0.12;
  const py = bottom.y + footprintDepth * 0.3;
  const pad = new Graphics()
    .roundRect(px - footprintWidth * 0.05, py - 1.6, footprintWidth * 0.1, 3.4, 1.2)
    .fill({ color: 0xf2d8a6, alpha: 0.58 })
    .stroke({ color: trimColor, alpha: 0.16, width: 0.8 });
  const walk = new Graphics()
    .moveTo(px, py + 1.4)
    .lineTo(px + flip * footprintWidth * 0.04, py + footprintDepth * 0.15);
  walk.stroke({ color: 0xe8d0a3, alpha: 0.46, width: 2, cap: "round" });
  layer.addChild(pad, walk);
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
  if (family === "civic_landmark") drawAuthoredCivicLandmarkMass(layer, geometry, building);
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
  drawPublicCivicLandmarkSilhouette(layer, geometry, building);
  drawCivicLandmarkBaseHierarchy(layer, geometry);
  drawCivicLandmarkRoofHierarchy(layer, geometry, building);
  drawCivicLandmarkFacadeHierarchy(layer, geometry);
  if (building.id === "building-civic") drawEastvaleCorePublicCivicSignature(layer, geometry);
}

// 0.55E decal discipline — the object-kit read owns the entry canopy and
// facade rhythm for this exact population (both run only on civic_landmark
// kit buildings), so this generation's duplicate canopy + pilaster bars and
// plinth-edge strokes (stairCuts in the base hierarchy do that job) are
// retired. The silhouette fn keeps the non-hero roof crown.
function drawPublicCivicLandmarkSilhouette(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
  const roofCrown = polygon(
    diamondPoints({ x: top.x - footprintWidth * 0.02, y: top.y - footprintDepth * 0.42 }, footprintWidth * 0.5, footprintDepth * 0.17),
    shadeColor(roofColor, 22),
    0.34,
    trimColor,
    0.12,
  );
  if (!hasHeroTieredCrown(building)) layer.addChild(roofCrown);
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

function drawCivicLandmarkRoofHierarchy(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  // 0.55E — the hero's tiered crown owns its roof; this generation's floating
  // cap + inset + shoulder strokes only draw for non-hero kit landmarks.
  if (hasHeroTieredCrown(building)) return;
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

// 0.55E — wingRhythm retired: the object-kit read's entry bays own the facade
// bar rhythm. The center glass column (unique atrium read) and the warm entry
// axis stroke stay.
function drawCivicLandmarkFacadeHierarchy(layer: Container, geometry: BuildingGeometry) {
  const { top, bottom, footprintWidth, footprintDepth, trimColor } = geometry;
  const centerGlass = new Graphics()
    .roundRect(top.x - footprintWidth * 0.08, bottom.y - footprintDepth * 0.34, footprintWidth * 0.16, 26, 3)
    .fill({ color: 0xb7dceb, alpha: 0.38 })
    .stroke({ color: trimColor, alpha: 0.12, width: 0.9 });
  const entryAxis = new Graphics()
    .moveTo(top.x - footprintWidth * 0.18, bottom.y - footprintDepth * 0.08)
    .lineTo(top.x, bottom.y + footprintDepth * 0.02)
    .lineTo(top.x + footprintWidth * 0.2, bottom.y - footprintDepth * 0.08);
  entryAxis.stroke({ color: 0xfff1cc, alpha: 0.42, width: 2, cap: "round", join: "round" });
  layer.addChild(centerGlass, entryAxis);
}

function drawEastvaleCorePublicCivicSignature(layer: Container, geometry: BuildingGeometry) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
  // (item C) the floating eastvaleCap decal is retired — the tiered crown in
  // drawTieredMassing is the hero's roof signature now.
  const civicAxis = new Graphics()
    .moveTo(top.x, top.y - footprintDepth * 0.48)
    .lineTo(top.x, bottom.y + footprintDepth * 0.34)
    .moveTo(top.x - footprintWidth * 0.3, bottom.y + footprintDepth * 0.12)
    .lineTo(top.x, bottom.y + footprintDepth * 0.28)
    .lineTo(top.x + footprintWidth * 0.32, bottom.y + footprintDepth * 0.1);
  civicAxis.stroke({ color: 0xe9f8ff, alpha: 0.28, width: 1.8, cap: "round", join: "round" });
  layer.addChild(civicAxis);
}

function drawPublicResidentialSilhouette(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, trimColor } = geometry;
  const style = building.facadeStyle ?? "suburban";
  const sideWingX = style === "ranch" ? bottom.x + footprintWidth * 0.22 : bottom.x - footprintWidth * 0.22;
  const sideWing = polygon(
    diamondPoints({ x: sideWingX, y: bottom.y - footprintDepth * 0.04 }, footprintWidth * (style === "rowhome" ? 0.12 : 0.18), footprintDepth * 0.16),
    shadeColor(bodyColor, style === "ranch" ? -8 : -14),
    style === "rowhome" ? 0.1 : 0.16,
    trimColor,
    0.05,
  );
  // 0.55E decal discipline — porch pad retired (drawHomeDetails porches +
  // drawHomeStoop own entries) and the white windowRhythm bars retired
  // (material-band sills + style windows own the window read). The fn keeps
  // its unique jobs: the side-wing massing and the dark roof-break stroke.
  const roofBreak = new Graphics()
    .moveTo(top.x - footprintWidth * 0.36, top.y - footprintDepth * 0.08)
    .lineTo(top.x - footprintWidth * 0.05, top.y + footprintDepth * 0.09)
    .lineTo(top.x + footprintWidth * 0.28, top.y - footprintDepth * 0.06);
  roofBreak.stroke({ color: shadeColor(roofColor, -34), alpha: style === "rowhome" ? 0.18 : 0.32, width: style === "ranch" ? 2.5 : 2, cap: "round", join: "round" });
  layer.addChild(sideWing, roofBreak);
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
  // 0.57E parity — the zigzag's outer peaks sit where the roof diamond has
  // almost no depth left; clamp each vertex under its local eave line so the
  // profile never bleeds past the roof edge on generated footprints.
  const sawHalfW = footprintWidth / 2;
  const sawHalfD = footprintDepth / 2;
  const sawEave = (dx: number, want: number) =>
    Math.min(footprintDepth * want, sawHalfD * Math.max(0, 1 - Math.abs(dx) / sawHalfW) * 0.85);
  const sawtooth = new Graphics()
    .moveTo(top.x - footprintWidth * 0.38, top.y - sawEave(-footprintWidth * 0.38, 0.16))
    .lineTo(top.x - footprintWidth * 0.18, top.y - sawEave(-footprintWidth * 0.18, 0.02))
    .lineTo(top.x, top.y - sawEave(0, 0.16))
    .lineTo(top.x + footprintWidth * 0.2, top.y - sawEave(footprintWidth * 0.2, 0.02))
    .lineTo(top.x + footprintWidth * 0.4, top.y - sawEave(footprintWidth * 0.4, 0.16));
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

// 0.55E decal discipline — this generation's threshold pad (drawHomeDetails
// porches + drawHomeStoop own entries), side block (the public silhouette's
// sideWing owns the side mass), and white wall-rib bar fills (material-band
// sills + style windows own the window rhythm) are retired. The fn keeps its
// unique jobs: the dark eave stroke and the vertical parcel rib lines.
function drawAuthoredResidentialKitRhythm(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor } = geometry;
  const style = building.facadeStyle ?? "suburban";
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
      .moveTo(top.x + offset + footprintWidth * 0.055, top.y + footprintDepth * 0.13)
      .lineTo(top.x + offset + footprintWidth * 0.055, bottom.y + footprintDepth * 0.06);
  }
  wallRibs.stroke({ color: shadeColor(bodyColor, -32), alpha: 0.17, width: 0.9 });
  layer.addChild(roofEave, wallRibs);
}

function drawAuthoredCommerceStripRhythm(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, bottom, footprintWidth, footprintDepth, roofColor } = geometry;
  void building;
  const parapet = new Graphics()
    .moveTo(top.x - footprintWidth * 0.46, top.y - footprintDepth * 0.18)
    .lineTo(top.x - footprintWidth * 0.18, top.y - footprintDepth * 0.08)
    .lineTo(top.x + footprintWidth * 0.08, top.y - footprintDepth * 0.18)
    .lineTo(top.x + footprintWidth * 0.42, top.y - footprintDepth * 0.06);
  parapet.stroke({ color: shadeColor(roofColor, -38), alpha: 0.36, width: 2.4, cap: "round", join: "round" });

  // 0.55E decal discipline — the white/cyan bay bars are retired: the
  // object-kit commerce read (same family population) owns the storefront bay
  // rhythm. The dark parapet stroke and apron joint strokes stay — they are
  // contrast, not wash.
  const apronJoint = new Graphics()
    .moveTo(bottom.x - footprintWidth * 0.4, bottom.y + footprintDepth * 0.25)
    .lineTo(bottom.x - footprintWidth * 0.12, bottom.y + footprintDepth * 0.37)
    .lineTo(bottom.x + footprintWidth * 0.16, bottom.y + footprintDepth * 0.25)
    .moveTo(bottom.x + footprintWidth * 0.4, bottom.y + footprintDepth * 0.25)
    .lineTo(bottom.x + footprintWidth * 0.12, bottom.y + footprintDepth * 0.38)
    .lineTo(bottom.x - footprintWidth * 0.12, bottom.y + footprintDepth * 0.27);
  apronJoint.stroke({ color: 0x8f7a54, alpha: 0.24, width: 1.4, cap: "round", join: "round" });
  layer.addChild(parapet, apronJoint);
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

  // 0.53E item C — the hero landmark's entry reads as a real portal: a wider
  // plinth apron below the tiers, a lit canopy slab over the center bay with a
  // shadow line under its lip, and two slim posts grounding it. Typed off the
  // same civicGeometry focus the other hero reads key on — not a per-id hack.
  if (isEastvaleCore) {
    const apron = polygon(
      diamondPoints({ x: bottom.x, y: bottom.y + footprintDepth * 0.52 }, footprintWidth * 1.02, footprintDepth * 0.22),
      0xd6bb86,
      0.3,
      0x756947,
      0.16,
    );
    const canopySlab = polygon(
      diamondPoints({ x: bottom.x, y: bottom.y - footprintDepth * 0.06 }, footprintWidth * 0.3, footprintDepth * 0.14),
      sunlitColor(0xd8ecef, "top"),
      0.85,
      trimColor,
      0.3,
    );
    const canopyShadow = new Graphics()
      .moveTo(bottom.x - footprintWidth * 0.14, bottom.y - footprintDepth * 0.05)
      .lineTo(bottom.x, bottom.y + footprintDepth * 0.02)
      .lineTo(bottom.x + footprintWidth * 0.14, bottom.y - footprintDepth * 0.05);
    canopyShadow.stroke({ color: 0x1a2c37, alpha: 0.3, width: 2, cap: "round", join: "round" });
    const posts = new Graphics()
      .moveTo(bottom.x - footprintWidth * 0.11, bottom.y - footprintDepth * 0.05)
      .lineTo(bottom.x - footprintWidth * 0.11, bottom.y + footprintDepth * 0.16)
      .moveTo(bottom.x + footprintWidth * 0.11, bottom.y - footprintDepth * 0.05)
      .lineTo(bottom.x + footprintWidth * 0.11, bottom.y + footprintDepth * 0.16);
    posts.stroke({ color: shadeColor(trimColor, -8), alpha: 0.5, width: 1.4, cap: "round" });
    layer.addChild(apron, canopySlab, canopyShadow, posts);
  }
  // 0.53E item C — the hero landmark's crown is the TIERED MASSING (drawn in
  // the shell pass); the old floating roof-cap decal painted a pale diamond
  // right over that crown and flattened it back into a lid. Hero skips the
  // decal; ordinary civic landmarks keep it.
  const roofCap = isEastvaleCore
    ? null
    : polygon(
        diamondPoints({ x: top.x + footprintWidth * 0.01, y: top.y - footprintDepth * (0.45 + roofCapWeight * 0.04) }, footprintWidth * (0.38 + roofCapWeight * 0.08), footprintDepth * 0.16),
        shadeColor(roofColor, 38),
        0.32,
        trimColor,
        0.13,
      );

  layer.addChild(plinthTiers, civicEntryBays, facadePiers, glassBands, canopy);
  if (roofCap) layer.addChild(roofCap);
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

  // 0.57E parity — monitors stay inside the roof diamond: the outer teeth sat
  // at offsets where the eave allows far less rise than the fixed 0.23 depth,
  // so the monitor strokes bled past the eaves on generated footprints.
  const roofMonitors = new Graphics();
  const monitorHalfW = footprintWidth / 2;
  const monitorHalfD = footprintDepth / 2;
  const monitorRise = (dx: number, want: number) =>
    Math.min(footprintDepth * want, monitorHalfD * Math.max(0, 1 - Math.abs(dx) / monitorHalfW) * 0.85);
  for (let tooth = 0; tooth < sawtoothCount; tooth += 1) {
    const offset = (tooth / Math.max(1, sawtoothCount - 1) - 0.5) * footprintWidth * 0.62;
    const x0 = offset - footprintWidth * 0.045;
    const x1 = offset + footprintWidth * 0.045;
    const x2 = offset + footprintWidth * 0.12;
    roofMonitors
      .moveTo(top.x + x0, top.y - monitorRise(x0, 0.23))
      .lineTo(top.x + x1, top.y - monitorRise(x1, 0.1))
      .lineTo(top.x + x2, top.y - monitorRise(x2, 0.2));
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

// 0.55E decal discipline — this generation's baseTerrace (duplicate of the
// object-kit plinth tiers) and facadeBeats (duplicate facade bar rhythm) are
// retired; the fn keeps the non-hero upper roof cap it uniquely owns.
function drawAuthoredCivicLandmarkMass(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
  const upperCap = polygon(
    diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.3 }, footprintWidth * 0.34, footprintDepth * 0.26),
    shadeColor(roofColor, 30),
    0.5,
    trimColor,
    0.18,
  );
  if (!hasHeroTieredCrown(building)) layer.addChild(upperCap);
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

  // Short, quiet sweep + a faint penumbra in ONE Graphics. The old 0.5-alpha
  // full-height sweep painted half-black sheets across roads and pads.
  const shadow = sweep(0.5, 0.14);
  const vx = CAST_SHADOW_VECTOR.x * heightPx * 0.78;
  const vy = CAST_SHADOW_VECTOR.y * heightPx * 0.78;
  shadow
    .poly(
      [top.x, top.y, left.x, left.y, base.x, base.y, base.x + vx, base.y + vy, right.x + vx, right.y + vy, top.x + vx, top.y + vy],
      true,
    )
    .fill({ color: CAST_SHADOW_COLOR, alpha: 0.05 });
  layer.addChild(shadow);
}

function drawBuildingFootprint(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { bottom, footprintWidth, footprintDepth, bodyColor, roofColor, trimColor } = geometry;
  const spriteBacked = geometry.asset.mode === "sprite";
  const style = building.facadeStyle ?? building.kind;
  const draftBuilding = isDraftBuilding(building);
  const padWidth = footprintWidth * (spriteBacked ? 0.94 : style === "rowhome" || style === "strip_store" ? 1.02 : 0.92);
  const padDepth = footprintDepth * (spriteBacked ? 0.72 : style === "rowhome" || style === "strip_store" ? 0.86 : 0.76);
  const padCenter = { x: bottom.x, y: bottom.y + footprintDepth * (spriteBacked ? 0.24 : 0.2) };
  const padColor = draftBuilding ? (building.kind === "civic" ? 0xe6cf9f : 0xe7c999) : style === "strip_store" || building.kind === "shop" || building.kind === "civic" ? 0xe7d0a2 : shadeColor(bodyColor, 18);
  const edgeColor = style === "rowhome" || style === "strip_store" ? shadeColor(trimColor, -14) : shadeColor(roofColor, -48);

  // Foundation pads are physical slabs: an opaque top, a thin solid south lip
  // for slab thickness, and one quiet contact shadow. Translucent cream pads
  // read as cards floating on the grass — the 0.72 "cream card" defect.
  const slabColor = mixColor(padColor, 0xffffff, 0.08);
  const lipDrop = 2.5;
  // One Graphics per pad: contact ellipse under slab top under lip.
  const pad = new Graphics()
    .ellipse(padCenter.x, padCenter.y + padDepth * 0.18, padWidth * 0.5, padDepth * 0.4)
    .fill({ color: 0x23342e, alpha: 0.1 });
  pad
    .poly(diamondPoints(padCenter, padWidth, padDepth), true)
    .fill({ color: slabColor })
    .stroke({ color: shadeColor(slabColor, -42), alpha: 0.3, width: 1 });
  pad
    .moveTo(padCenter.x - padWidth * 0.5, padCenter.y)
    .lineTo(padCenter.x, padCenter.y + padDepth * 0.5)
    .lineTo(padCenter.x + padWidth * 0.5, padCenter.y)
    .lineTo(padCenter.x + padWidth * 0.5, padCenter.y + lipDrop)
    .lineTo(padCenter.x, padCenter.y + padDepth * 0.5 + lipDrop)
    .lineTo(padCenter.x - padWidth * 0.5, padCenter.y + lipDrop)
    .closePath()
    .fill({ color: shadeColor(slabColor, -38) })
    .stroke({ color: edgeColor, alpha: 0.2, width: 1 });

  layer.addChild(pad);
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

// W4.1 attachments: ONE Graphics per attachment — two wall faces + roof top,
// same sun model as full buildings, none of the pad/shadow/facade machinery.
// Keeps 20+ visible attachments within the Graphics ceiling (a full building
// draw per attachment measured 1621/1600).
function drawAttachmentBlock(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { bottom, top, footprintWidth, footprintDepth, bodyColor, roofColor } = geometry;
  const topLeft = { x: top.x - footprintWidth / 2, y: top.y };
  const topRight = { x: top.x + footprintWidth / 2, y: top.y };
  const topFront = { x: top.x, y: top.y + footprintDepth / 2 };
  const topBack = { x: top.x, y: top.y - footprintDepth / 2 };
  const bottomLeft = { x: bottom.x - footprintWidth / 2, y: bottom.y };
  const bottomRight = { x: bottom.x + footprintWidth / 2, y: bottom.y };
  const bottomFront = { x: bottom.x, y: bottom.y + footprintDepth / 2 };
  const block = new Graphics();
  block
    .poly([topLeft.x, topLeft.y, topFront.x, topFront.y, bottomFront.x, bottomFront.y, bottomLeft.x, bottomLeft.y], true)
    .fill({ color: buildingFaceColor(bodyColor, "sun") })
    .poly([topRight.x, topRight.y, topFront.x, topFront.y, bottomFront.x, bottomFront.y, bottomRight.x, bottomRight.y], true)
    .fill({ color: buildingFaceColor(bodyColor, "shade") })
    .poly([topLeft.x, topLeft.y, topBack.x, topBack.y, topRight.x, topRight.y, topFront.x, topFront.y], true)
    .fill({ color: sunlitColor(roofColor, "top") });
  layer.addChild(block);
}

function drawBuildingShell(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, materialTextureEnabled: boolean) {
  const { bottom, top, footprintWidth, footprintDepth, bodyColor, outline, activeStrokeAlpha } = geometry;
  // Unified sun: lower-left wall faces the sun, lower-right wall falls into
  // cool shade. Same factors for every building in the scene.
  // 0.68H — walls use the building-face curve so the lit wall stays pigmented.
  // Claymation pass: matte clay bodies — soft face fill, round outline, no
  // hard plastic edges. Slightly warmer chalk blend for diorama read.
  const sideLeft = mixColor(buildingFaceColor(bodyColor, "sun"), 0xf2e4c4, 0.12);
  const sideRight = mixColor(buildingFaceColor(bodyColor, "shade"), 0xc8b49a, 0.14);
  const topLeft = { x: top.x - footprintWidth / 2, y: top.y };
  const topRight = { x: top.x + footprintWidth / 2, y: top.y };
  const topFront = { x: top.x, y: top.y + footprintDepth / 2 };
  const bottomLeft = { x: bottom.x - footprintWidth / 2, y: bottom.y };
  const bottomRight = { x: bottom.x + footprintWidth / 2, y: bottom.y };
  const bottomFront = { x: bottom.x, y: bottom.y + footprintDepth / 2 };
  const leftSide = [topLeft.x, topLeft.y, topFront.x, topFront.y, bottomFront.x, bottomFront.y, bottomLeft.x, bottomLeft.y];
  const rightSide = [topRight.x, topRight.y, topFront.x, topFront.y, bottomFront.x, bottomFront.y, bottomRight.x, bottomRight.y];
  const clayOutline = mixColor(outline, 0xdcc9a4, 0.42);
  const clayStrokeAlpha = Math.min(0.38, activeStrokeAlpha * 0.68 + 0.1);

  const left = polygon(leftSide, sideLeft, 1, clayOutline, clayStrokeAlpha);
  const right = polygon(rightSide, sideRight, 1, clayOutline, clayStrokeAlpha);
  layer.addChild(left, right);
  drawBuildingShellLighting(layer, geometry);
  if (materialTextureEnabled) drawWallMaterialTexture(layer, geometry, building);
  drawWallBlockCourses(layer, geometry, building);
  drawWallFacade(layer, geometry, building);

  drawRoof(layer, geometry, building, materialTextureEnabled);
  drawTieredMassing(layer, geometry, building);
}

// 0.74F chunky treatment — one horizontal course line per storey across each
// wall, in wall-plane coordinates: the box reads as stacked voxel courses
// instead of a single extrusion. Inset-only (lines live ON the wall quads).
function drawWallBlockCourses(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const floors = Math.max(1, Math.round(building.height));
  if (floors < 2 || geometry.height < 22) return;
  const courses = new Graphics();
  for (const side of ["sun", "shade"] as const) {
    const surface = wallSurface(geometry, side);
    for (let floor = 1; floor < floors; floor += 1) {
      const v = (surface.heightPx / floors) * floor;
      const from = wallPoint(surface, 0, v);
      const to = wallPoint(surface, 1, v);
      courses.moveTo(from.x, from.y).lineTo(to.x, to.y);
    }
  }
  // Soft clay course lines (matte, low contrast — not hard brick).
  courses.stroke({ color: shadeColor(geometry.bodyColor, -18), alpha: 0.1, width: 1.15, cap: "round" });
  layer.addChild(courses);
}

function drawWallMaterialTexture(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const material = new Graphics();
  let hasTexture = false;
  for (const side of ["sun", "shade"] as const) {
    const surface = wallSurface(geometry, side);
    if (surface.heightPx < 18 || surface.edgeLengthPx < 18) continue;
    const courseCount = Math.max(2, Math.min(7, Math.floor(surface.heightPx / 9)));
    const courseHeight = surface.heightPx / courseCount;
    const blockColumns = Math.max(2, Math.min(5, Math.floor(surface.edgeLengthPx / 18)));
    for (let course = 0; course < courseCount; course += 1) {
      const seed = materialTextureSeed(building.id, side, course);
      const v0 = course * courseHeight + 0.7;
      const v1 = Math.min(surface.heightPx - 0.7, (course + 1) * courseHeight - 0.7);
      if (v1 <= v0 + 2) continue;
      const delta = materialTextureDelta(seed);
      const bandAlpha = side === "sun" ? 0.08 : 0.1;
      material
        .poly(wallQuadPoints(surface, 0.04, v0, 0.96, v1), true)
        .fill({ color: shadeColor(geometry.bodyColor, delta), alpha: bandAlpha });
      hasTexture = true;

      if (seed % 4 !== 0) continue;
      const column = Math.floor(seed / 7) % blockColumns;
      const offset = course % 2 === 0 ? 0 : 0.5 / blockColumns;
      const u0 = 0.08 + ((column / blockColumns + offset) % 0.84);
      const u1 = Math.min(0.94, u0 + 0.52 / blockColumns);
      if (u1 <= u0 + 0.04) continue;
      material
        .poly(wallQuadPoints(surface, u0, v0 + courseHeight * 0.18, u1, v1 - courseHeight * 0.12), true)
        .fill({ color: shadeColor(geometry.bodyColor, delta > 0 ? 16 : -16), alpha: side === "sun" ? 0.1 : 0.12 });
    }
  }
  if (hasTexture) layer.addChild(material);
}

function materialTextureSeed(buildingId: string, face: string, courseIndex: number): number {
  const key = `${buildingId}:${face}:${courseIndex}`;
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

function materialTextureDelta(seed: number): number {
  const steps = [-16, -10, 10, 16] as const;
  return steps[seed % steps.length] ?? 10;
}

// ---- Wall-plane facade system ----------------------------------------------
// Every window, storefront, and door is authored in wall-plane coordinates:
// u ∈ [0,1] runs along the wall's ground edge from the outer corner to the
// shared front corner; v is height in screen pixels. Elements are projected
// through the same corner math as the wall quads, so they register exactly on
// the wall — they cannot float off the face or leak past the silhouette.

type WallSide = "sun" | "shade";

type WallSurface = {
  groundCorner: ProjectedPoint;
  groundFront: ProjectedPoint;
  heightPx: number;
  edgeLengthPx: number;
};

function wallSurface(geometry: BuildingGeometry, side: WallSide): WallSurface {
  const { bottom, top, footprintWidth, footprintDepth } = geometry;
  const halfW = footprintWidth / 2;
  const halfD = footprintDepth / 2;
  const groundCorner = side === "sun" ? { x: bottom.x - halfW, y: bottom.y } : { x: bottom.x + halfW, y: bottom.y };
  const groundFront = { x: bottom.x, y: bottom.y + halfD };
  const heightPx = Math.max(0, bottom.y - top.y);
  const edgeLengthPx = Math.hypot(groundFront.x - groundCorner.x, groundFront.y - groundCorner.y);
  return { groundCorner, groundFront, heightPx, edgeLengthPx };
}

function wallPoint(surface: WallSurface, u: number, v: number): ProjectedPoint {
  return {
    x: surface.groundCorner.x + (surface.groundFront.x - surface.groundCorner.x) * u,
    y: surface.groundCorner.y + (surface.groundFront.y - surface.groundCorner.y) * u - v,
  };
}

function wallQuadPoints(surface: WallSurface, u0: number, v0: number, u1: number, v1: number): number[] {
  const a = wallPoint(surface, u0, v0);
  const b = wallPoint(surface, u1, v0);
  const c = wallPoint(surface, u1, v1);
  const d = wallPoint(surface, u0, v1);
  return [a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y];
}

function isCommerceFacade(building: CityWorldBuilding): boolean {
  const family = building.visualGrammar?.objectFamily;
  return (
    building.kind === "shop" ||
    building.kind === "gym" ||
    building.kind === "civic" ||
    family === "commerce_strip" ||
    family === "civic_landmark" ||
    family === "service_block" ||
    family === "venue_anchor" ||
    family === "transit_anchor"
  );
}

function drawWallFacade(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const commerce = isCommerceFacade(building);
  const variant = objectVariant(building.id, 977);
  for (const side of ["sun", "shade"] as const) {
    const surface = wallSurface(geometry, side);
    if (surface.heightPx < 10 || surface.edgeLengthPx < 12) continue;
    const storefront = commerce && surface.heightPx >= 24;
    drawFacadeStorefront(layer, geometry, surface, side, storefront);
    drawFacadeWindows(layer, geometry, surface, side, building, variant, storefront);
  }
  if (!commerce) drawFacadeDoor(layer, geometry, building, variant);
}

// Recessed ground-storey glass band with mullions and a canopy lip. Opaque:
// the storefront is real material, not a wash over the wall.
function drawFacadeStorefront(layer: Container, geometry: BuildingGeometry, surface: WallSurface, side: WallSide, enabled: boolean) {
  if (!enabled) return;
  const { bodyColor, trimColor } = geometry;
  const bandTop = Math.min(16, surface.heightPx * 0.34);
  const recess = new Graphics()
    .poly(wallQuadPoints(surface, 0.06, 1, 0.94, bandTop), true)
    .fill({ color: sunlitColor(shadeColor(bodyColor, -34), side) });
  const glass = new Graphics()
    .poly(wallQuadPoints(surface, 0.09, 2.5, 0.91, bandTop - 3), true)
    .fill({ color: side === "sun" ? 0xbcd8de : 0x8fb0bd });
  const mullions = new Graphics();
  const bays = Math.max(2, Math.round(surface.edgeLengthPx / 18));
  for (let bay = 1; bay < bays; bay += 1) {
    const u = 0.09 + (0.82 * bay) / bays;
    const lower = wallPoint(surface, u, 2.5);
    const upper = wallPoint(surface, u, bandTop - 3);
    mullions.moveTo(lower.x, lower.y).lineTo(upper.x, upper.y);
  }
  mullions.stroke({ color: shadeColor(trimColor, -8), alpha: 0.85, width: 1 });
  const canopyA = wallPoint(surface, 0.04, bandTop + 1.5);
  const canopyB = wallPoint(surface, 0.96, bandTop + 1.5);
  const canopy = new Graphics().moveTo(canopyA.x, canopyA.y).lineTo(canopyB.x, canopyB.y);
  canopy.stroke({ color: sunlitColor(shadeColor(geometry.roofColor, -8), side), alpha: 0.95, width: 2.2, cap: "butt" });
  layer.addChild(recess, glass, mullions, canopy);
}

// Window grid: floors split the wall height, bays split the wall length.
// Each window is a parallelogram in the wall plane — an opaque frame quad
// with an opaque glass quad inside; a hashed minority of panes glow warm so
// facades read inhabited without pattern noise.
function drawFacadeWindows(
  layer: Container,
  geometry: BuildingGeometry,
  surface: WallSurface,
  side: WallSide,
  building: CityWorldBuilding,
  variant: number,
  storefront: boolean,
) {
  const { bodyColor, trimColor } = geometry;
  const baseV = storefront ? Math.min(16, surface.heightPx * 0.34) + 4 : 4;
  const usableHeight = surface.heightPx - baseV - 4;
  if (usableHeight < 7) return;
  const floors = Math.max(1, Math.min(5, Math.floor(usableHeight / 12)));
  const floorStep = usableHeight / floors;
  const bays = Math.max(1, Math.min(6, Math.floor(surface.edgeLengthPx / 16)));
  const bayStep = 0.84 / bays;
  const windowH = Math.min(7.5, floorStep * 0.58);
  const frames = new Graphics();
  const panes = new Graphics();
  const litPanes = new Graphics();
  const frameColor = sunlitColor(shadeColor(bodyColor, -38), side);
  const glassColor = side === "sun" ? 0xd7e9ea : 0x92aebc;
  const litColor = 0xf7e3ae;
  for (let floor = 0; floor < floors; floor += 1) {
    const v0 = baseV + floor * floorStep + (floorStep - windowH) * 0.55;
    for (let bay = 0; bay < bays; bay += 1) {
      const u0 = 0.08 + bay * bayStep + bayStep * 0.18;
      const u1 = 0.08 + (bay + 1) * bayStep - bayStep * 0.18;
      frames.poly(wallQuadPoints(surface, u0 - 0.012, v0 - 0.8, u1 + 0.012, v0 + windowH + 0.8), true);
      const lit = ((variant + floor * 7 + bay * 13 + (side === "sun" ? 3 : 0)) % 9) === 0;
      const paneTarget = lit ? litPanes : panes;
      paneTarget.poly(wallQuadPoints(surface, u0, v0, u1, v0 + windowH), true);
    }
  }
  frames.fill({ color: frameColor });
  panes.fill({ color: glassColor });
  litPanes.fill({ color: litColor });
  panes.stroke({ color: shadeColor(trimColor, -6), alpha: 0.4, width: 0.8 });
  layer.addChild(frames, panes, litPanes);
}

// Homes get a door instead of a storefront: a dark recessed leaf with a
// lintel shadow on the sun wall near the front corner.
function drawFacadeDoor(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, variant: number) {
  const surface = wallSurface(geometry, variant % 2 === 0 ? "sun" : "shade");
  if (surface.heightPx < 14) return;
  const doorH = Math.min(11, surface.heightPx * 0.5);
  const u0 = 0.6;
  const u1 = Math.min(0.78, u0 + 14 / Math.max(14, surface.edgeLengthPx));
  const leaf = new Graphics()
    .poly(wallQuadPoints(surface, u0, 0.5, u1, doorH), true)
    .fill({ color: shadeColor(geometry.trimColor, 14) });
  const lintelA = wallPoint(surface, u0 - 0.02, doorH + 1);
  const lintelB = wallPoint(surface, u1 + 0.02, doorH + 1);
  const lintel = new Graphics().moveTo(lintelA.x, lintelA.y).lineTo(lintelB.x, lintelB.y);
  lintel.stroke({ color: shadeColor(geometry.bodyColor, -44), alpha: 0.8, width: 1.4, cap: "butt" });
  layer.addChild(leaf, lintel);
}

// 0.53E Hero Silhouette — a setback upper tier for civic/venue/transit anchors,
// so the hero landmark reads as a stepped, tall structure instead of a single
// extruded box. A smaller box rises from the roof center with its own lit/shade
// walls, cap, and a warm sunlit crown edge — the "this is the important building"
// silhouette cue. Sun-consistent; only for tall anchors so it stays rare.
// 0.53E item C — when the hero landmark carries the tiered crown, the crown
// OWNS the roof: the five legacy civic functions that each float their own
// pale cap/lantern/crown decal over the same roof plane must stand down, or
// they average into a milky fog that erases the silhouette. Ground-level
// richness (plinth, entry, columns, glass) stays untouched.
function hasHeroTieredCrown(building: CityWorldBuilding): boolean {
  return building.objectKit?.civicGeometry?.focusTarget === "eastvale_core";
}

function drawTieredMassing(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const family = building.visualGrammar?.objectFamily;
  const isAnchor = family === "civic_landmark" || family === "venue_anchor" || family === "transit_anchor";
  // 0.74F chunky treatment — tall apartment slabs also get one restrained
  // setback tier, so towers read stepped instead of extruded.
  const tallLowrise = family === "lowrise_cluster" && building.height >= 2.4;
  if ((!isAnchor && !tallLowrise) || building.height < 1.9) return;

  const { top, footprintWidth, footprintDepth, bodyColor, roofColor } = geometry;
  // 0.53E item C — the hero landmark (typed via civicGeometry.focusTarget) gets
  // a taller, front-offset, TWO-step crown so the stepped silhouette clears the
  // place marker + label band that sit over the roof's back half. Ordinary
  // anchors keep the single restrained tier.
  const hero = hasHeroTieredCrown(building);
  const steps = hero ? 2 : 1;
  let tierW = footprintWidth * (hero ? 0.62 : 0.46);
  let tierD = footprintDepth * (hero ? 0.62 : 0.46);
  // Hero rise is tuned to the label band: the place label floats ~44px above
  // the ground anchor, so the crown caps must land in the open window between
  // the label's bottom edge and the roofline — taller just hides the crown
  // behind the label backing. Offset left so the marker pin column clears it.
  let rise = hero
    ? Math.max(18, Math.min(building.height * TILE_DEPTH * 0.52, 30))
    : Math.max(12, Math.min(building.height * TILE_DEPTH * 0.34, 30));
  let baseC = hero
    ? { x: top.x - footprintWidth * 0.18, y: top.y + footprintDepth * 0.1 }
    : { x: top.x, y: top.y - footprintDepth * 0.04 };

  for (let step = 0; step < steps; step += 1) {
    const halfW = tierW / 2;
    const halfD = tierD / 2;
    const apex = { x: baseC.x, y: baseC.y - rise };
    const bL = { x: baseC.x - halfW, y: baseC.y };
    const bF = { x: baseC.x, y: baseC.y + halfD };
    const bR = { x: baseC.x + halfW, y: baseC.y };
    const tL = { x: apex.x - halfW, y: apex.y };
    const tF = { x: apex.x, y: apex.y + halfD };
    const tR = { x: apex.x + halfW, y: apex.y };

    const litWall = new Graphics()
      .poly([tL.x, tL.y, tF.x, tF.y, bF.x, bF.y, bL.x, bL.y], true)
      .fill({ color: buildingFaceColor(bodyColor, "sun"), alpha: 0.98 });
    const shadeWall = new Graphics()
      .poly([tR.x, tR.y, tF.x, tF.y, bF.x, bF.y, bR.x, bR.y], true)
      .fill({ color: buildingFaceColor(bodyColor, "shade"), alpha: 0.98 });
    // Hero caps hold a deeper roof tone so they stay saturated instead of
    // blowing out toward white next to the sunlit cream walls.
    const capTone = hero ? buildingFaceColor(shadeColor(roofColor, -12), "top") : buildingFaceColor(roofColor, "top");
    const cap = polygon(diamondPoints(apex, tierW, tierD), capTone, 0.99, 0x26332c, hero ? 0.55 : 0.4);
    const crown = new Graphics().moveTo(tL.x, tL.y).lineTo(apex.x, apex.y - halfD).lineTo(tR.x, tR.y);
    crown.stroke({ color: mixColor(shadeColor(roofColor, 42), SUN_WARM_TINT, 0.2), alpha: 0.85, width: 1.5, cap: "round", join: "round" });
    const cornerSeam = new Graphics().moveTo(tF.x, tF.y).lineTo(bF.x, bF.y);
    cornerSeam.stroke({ color: 0x18262e, alpha: 0.22, width: 1.1, cap: "round" });
    layer.addChild(litWall, shadeWall, cap, crown, cornerSeam);

    // Next step rises from this cap, set back toward the sun-lit front corner.
    baseC = { x: apex.x - tierW * 0.06, y: apex.y - tierD * 0.02 };
    tierW *= 0.58;
    tierD *= 0.58;
    rise *= 0.6;
  }
}

// 0.53E Hero Silhouette — a recessed, glazed ground-floor band with a canopy lip
// across the two front walls of commerce/civic/service buildings. Reads as a
// real shopfront / entrance storey, so the box gains a base storey instead of
// being a single blank extrusion. Sun-consistent; skips homes and towers.
function drawStorefrontBase(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const family = building.visualGrammar?.objectFamily;
  const eligible = family === "commerce_strip" || family === "civic_landmark" || family === "service_block" || family === "venue_anchor" || family === "transit_anchor";
  if (!eligible) return;

  const { top, bottom, footprintWidth, footprintDepth, bodyColor } = geometry;
  const halfW = footprintWidth / 2;
  const halfD = footprintDepth / 2;
  const wallSpan = bottom.y - top.y;
  if (wallSpan < 16) return; // too short to carry a distinct storey
  const f = 0.66; // band starts ~two-thirds down the wall
  const bandY = (edgeTopY: number) => edgeTopY + wallSpan * f;
  const civic = family === "civic_landmark" || family === "venue_anchor" || family === "transit_anchor";
  const glassTone = civic ? 0xd6e4e0 : 0xbfe2ea;
  const recess = shadeColor(bodyColor, -30);

  // Left (sun) + right (shade) lower-wall quads.
  const leftBand = new Graphics()
    .poly([top.x - halfW, bandY(top.y), top.x, bandY(top.y + halfD), top.x, bottom.y + halfD, top.x - halfW, bottom.y], true)
    .fill({ color: sunlitColor(recess, "sun"), alpha: 0.55 });
  const rightBand = new Graphics()
    .poly([top.x + halfW, bandY(top.y), top.x, bandY(top.y + halfD), top.x, bottom.y + halfD, top.x + halfW, bottom.y], true)
    .fill({ color: sunlitColor(recess, "shade"), alpha: 0.6 });
  // Glazing sheen on the sun side + a canopy lip line where the band starts.
  const glazing = new Graphics()
    .poly([top.x - halfW * 0.9, bandY(top.y) + wallSpan * 0.06, top.x - halfW * 0.06, bandY(top.y + halfD * 0.9) + wallSpan * 0.06, top.x - halfW * 0.06, bottom.y + halfD * 0.86, top.x - halfW * 0.9, bottom.y - wallSpan * 0.02], true)
    .fill({ color: glassTone, alpha: civic ? 0.16 : 0.2 });
  const canopy = new Graphics()
    .moveTo(top.x - halfW, bandY(top.y))
    .lineTo(top.x, bandY(top.y + halfD))
    .lineTo(top.x + halfW, bandY(top.y));
  canopy.stroke({ color: mixColor(shadeColor(bodyColor, 30), SUN_WARM_TINT, 0.16), alpha: 0.7, width: 1.6, cap: "round", join: "round" });
  layer.addChild(leftBand, rightBand, glazing, canopy);
}

// Ambient occlusion + rim light for the box shell: dark gradient bands where
// the walls meet the ground, a darkened seam on the front corner, and a warm
// rim on the sun-facing top edge.
function drawBuildingShellLighting(layer: Container, geometry: BuildingGeometry) {
  const { bottom, top, footprintWidth, footprintDepth, height, bodyColor } = geometry;
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
  // 0.68H — firmer ground-contact bands.
  const aoTall = Math.max(4, Math.min(height * 0.22, 12));
  layer.addChild(aoBand(aoTall, 0.16), aoBand(aoTall * 0.5, 0.18));

  const cornerSeam = new Graphics().moveTo(topFront.x, topFront.y).lineTo(bottomFront.x, bottomFront.y);
  cornerSeam.stroke({ color: 0x18262e, alpha: 0.26, width: 1.2, cap: "round" });
  // Sun-corner pillar: a vertical highlight on the sun-facing outer edge —
  // the "lit block corner" cue that separates the box from its neighbors.
  cornerSeam
    .moveTo(bottom.x - halfW, bottom.y)
    .lineTo(top.x - halfW, top.y)
    .stroke({ color: 0xfff4d6, alpha: 0.32, width: 1.3, cap: "round" });

  // 0.68H — the sun rim derives from the wall pigment instead of near-white.
  const rim = new Graphics().moveTo(top.x - halfW, top.y).lineTo(topFront.x, topFront.y);
  rim.stroke({ color: mixColor(shadeColor(bodyColor, 52), SUN_WARM_TINT, 0.34), alpha: 0.6, width: 1.6, cap: "round" });
  const shadeEdge = new Graphics().moveTo(topFront.x, topFront.y).lineTo(top.x + halfW, top.y);
  shadeEdge.stroke({ color: 0x1a2c37, alpha: 0.46, width: 1.5, cap: "round" });
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

function drawRoof(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, materialTextureEnabled: boolean) {
  const { top, footprintWidth, footprintDepth, roofColor, outline, activeStrokeAlpha } = geometry;
  const roofShape = building.roofShape ?? "flat";
  // Roofs are the brightest surfaces in the scene: lit from above by the sun.
  // 0.68H — brightest but still pigmented: the building-face top curve keeps
  // roof color identity instead of riding the rolloff into paper white.
  const roof = polygon(diamondPoints(top, footprintWidth, footprintDepth), buildingFaceColor(roofColor, "top"), 0.99, outline, activeStrokeAlpha);
  layer.addChild(roof);

  // Sun-facing upper-left roof edge catches a warm rim; the lower-right edge
  // falls away into shade — consistent with the wall shading below.
  const halfW = footprintWidth / 2;
  const halfD = footprintDepth / 2;
  // 0.53E item D — a whisper directional split across the roof plane itself:
  // the sun-side half lifts warm, the fall-away half cools, so every roof
  // reads directional under the same key light as the walls. Deliberately
  // faint — this is the ROOF light finish, not the 0.54E whole-canvas grade.
  const roofLitHalf = new Graphics()
    .poly([top.x, top.y - halfD, top.x, top.y + halfD, top.x - halfW, top.y], true)
    .fill({ color: 0xfff3d2, alpha: 0.09 });
  const roofShadeHalf = new Graphics()
    .poly([top.x, top.y - halfD, top.x, top.y + halfD, top.x + halfW, top.y], true)
    .fill({ color: 0x2c4a5e, alpha: 0.13 });
  const roofRim = new Graphics()
    .moveTo(top.x - halfW, top.y)
    .lineTo(top.x, top.y - halfD);
  // 0.68H — the sun rim derives from roof pigment instead of near-white.
  roofRim.stroke({ color: mixColor(shadeColor(roofColor, 50), SUN_WARM_TINT, 0.3), alpha: 0.62, width: 1.7, cap: "round", join: "round" });
  const roofFall = new Graphics()
    .moveTo(top.x, top.y - halfD)
    .lineTo(top.x + halfW, top.y);
  roofFall.stroke({ color: shadeColor(roofColor, -52), alpha: 0.58, width: 1.5, cap: "round", join: "round" });
  layer.addChild(roofLitHalf, roofShadeHalf, roofRim, roofFall);

  const lines = new Graphics();
  const generatedBuilding = building.id.startsWith("gen-building-");
  if (roofShape === "gable") {
    const ridgeHalf = footprintWidth * 0.24;
    const ridgeY = top.y - footprintDepth * 0.035;
    if (generatedBuilding) {
      lines
        .moveTo(top.x - ridgeHalf, ridgeY)
        .lineTo(top.x + ridgeHalf, ridgeY)
        .moveTo(top.x - ridgeHalf, ridgeY)
        .lineTo(top.x - halfW, top.y)
        .moveTo(top.x + ridgeHalf, ridgeY)
        .lineTo(top.x + halfW, top.y);
    } else {
      lines
        .moveTo(top.x - ridgeHalf, ridgeY)
        .lineTo(top.x + ridgeHalf, ridgeY)
        .moveTo(top.x - ridgeHalf, ridgeY)
        .lineTo(top.x, top.y - halfD)
        .moveTo(top.x + ridgeHalf, ridgeY)
        .lineTo(top.x, top.y - halfD)
        .moveTo(top.x - ridgeHalf, ridgeY)
        .lineTo(top.x - halfW, top.y)
        .moveTo(top.x + ridgeHalf, ridgeY)
        .lineTo(top.x + halfW, top.y)
        .moveTo(top.x, top.y + halfD * 0.82)
        .lineTo(top.x - ridgeHalf * 0.9, ridgeY)
        .moveTo(top.x, top.y + halfD * 0.82)
        .lineTo(top.x + ridgeHalf * 0.9, ridgeY);
    }
  } else if (roofShape === "hip") {
    const inset = diamondPoints(top, footprintWidth * 0.44, footprintDepth * 0.38);
    lines.poly(inset, true);
    if (!generatedBuilding) {
      lines
        .moveTo(top.x, top.y - halfD)
        .lineTo(top.x, top.y - footprintDepth * 0.19)
        .moveTo(top.x + halfW, top.y)
        .lineTo(top.x + footprintWidth * 0.22, top.y)
        .moveTo(top.x, top.y + halfD)
        .lineTo(top.x, top.y + footprintDepth * 0.19)
        .moveTo(top.x - halfW, top.y)
        .lineTo(top.x - footprintWidth * 0.22, top.y);
    }
  } else if (roofShape === "sawtooth") {
    // Sawtooth reads as MATERIAL, not linework: alternating lit/shade tooth
    // strips filled inside the roof diamond (the old naked diagonal strokes
    // read as scribble). Strip extents follow the diamond edge so teeth can
    // never bleed past the eaves on generated footprints.
    const halfW = footprintWidth / 2;
    const halfD = footprintDepth / 2;
    const eaveRise = (dx: number) => halfD * Math.max(0, 1 - Math.abs(dx) / halfW) * 0.86;
    const teeth = new Graphics();
    const shadeTeeth = new Graphics();
    const stripCount = 6;
    for (let i = 0; i < stripCount; i += 1) {
      const xa = -halfW * 0.86 + (i * (halfW * 1.72)) / stripCount;
      const xb = xa + (halfW * 1.72) / stripCount;
      const target = i % 2 === 0 ? teeth : shadeTeeth;
      target.poly(
        [top.x + xa, top.y - eaveRise(xa), top.x + xb, top.y - eaveRise(xb), top.x + xb, top.y + eaveRise(xb), top.x + xa, top.y + eaveRise(xa)],
        true,
      );
    }
    teeth.fill({ color: shadeColor(roofColor, 16) });
    shadeTeeth.fill({ color: shadeColor(roofColor, -14) });
    layer.addChild(teeth, shadeTeeth);
  } else if (roofShape === "tower") {
    lines
      .poly(diamondPoints({ x: top.x, y: top.y - 12 }, footprintWidth * 0.36, footprintDepth * 0.34), true)
      .moveTo(top.x, top.y - 24)
      .lineTo(top.x, top.y - 3);
  } else {
    // 0.74F chunky treatment — flat roofs step: a darker inner well between
    // the roof rim and a RAISED inset cap deck. The lid reads as stacked
    // voxel slabs instead of a flush sticker. Inset-only (never past eaves).
    lines
      .poly(diamondPoints(top, footprintWidth * 0.86, footprintDepth * 0.82), true)
      .fill({ color: shadeColor(sunlitColor(roofColor, "top"), -16) });
    lines
      .poly(diamondPoints({ x: top.x, y: top.y - 2.5 }, footprintWidth * 0.7, footprintDepth * 0.64), true)
      .fill({ color: sunlitColor(shadeColor(roofColor, 8), "top") });
    lines.poly(diamondPoints(top, footprintWidth * 0.72, footprintDepth * 0.64), true);
  }
  lines.stroke({ color: shadeColor(roofColor, -44), alpha: 0.38, width: 1.5, cap: "round", join: "round" });
  layer.addChild(lines);
  if (materialTextureEnabled) drawRoofMaterialTexture(layer, geometry, building);
  drawParapetCap(layer, geometry, building, roofShape);
  drawRoofMaterial(layer, geometry, building);
  drawAuthoredRoofProfile(layer, geometry, building);
}

// 0.53E Hero Silhouette — a raised parapet wall around a flat roof edge. This is
// 0.75C-3 close-zoom material: coarse roof seams and cells stay clipped to the
// roof diamond and draw only behind parapets/authored roof profiles.
function drawRoofMaterialTexture(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const { top, footprintWidth, footprintDepth, roofColor } = geometry;
  if (footprintWidth < 28 || footprintDepth < 16) return;
  const roofShape = building.roofShape ?? "flat";
  const material = new Graphics();
  const courseCount = Math.max(3, Math.min(7, Math.floor(Math.min(footprintWidth, footprintDepth) / 9)));
  const seamColor = shadeColor(roofColor, -18);
  const capColor = shadeColor(roofColor, 18);

  for (let course = 1; course < courseCount; course += 1) {
    const seed = materialTextureSeed(building.id, `roof-${roofShape}`, course);
    const t = course / courseCount;
    const start = roofMaterialPoint(top, footprintWidth, footprintDepth, 0.12, t);
    const end = roofMaterialPoint(top, footprintWidth, footprintDepth, 0.88, t);
    material.moveTo(start.x, start.y).lineTo(end.x, end.y);

    if (seed % 3 !== 0) continue;
    const u0 = 0.18 + ((Math.floor(seed / 11) % 4) * 0.14);
    const u1 = Math.min(0.82, u0 + 0.16);
    const t0 = Math.max(0.08, t - 0.055);
    const t1 = Math.min(0.92, t + 0.055);
    material
      .poly(roofMaterialQuadPoints(top, footprintWidth, footprintDepth, u0, t0, u1, t1), true)
      .fill({ color: shadeColor(roofColor, materialTextureDelta(seed)), alpha: 0.12 });
  }
  material.stroke({ color: seamColor, alpha: roofShape === "flat" ? 0.2 : 0.16, width: 1, cap: "butt", join: "round" });

  if (roofShape === "gable" || roofShape === "hip") {
    const caps = 2 + (materialTextureSeed(building.id, "roof-ridge", 0) % 3);
    for (let cap = 0; cap < caps; cap += 1) {
      const seed = materialTextureSeed(building.id, "roof-ridge", cap);
      const u = 0.34 + (cap / Math.max(1, caps - 1)) * 0.32;
      const t = 0.42 + (seed % 3) * 0.035;
      const center = roofMaterialPoint(top, footprintWidth, footprintDepth, u, t);
      material
        .moveTo(center.x - 3.2, center.y - 1.2)
        .lineTo(center.x + 3.2, center.y + 1.2);
    }
    material.stroke({ color: capColor, alpha: 0.22, width: 1.4, cap: "butt", join: "round" });
  }

  layer.addChild(material);
}

function roofMaterialPoint(top: ProjectedPoint, width: number, depth: number, u: number, t: number): ProjectedPoint {
  const halfW = width / 2;
  const halfD = depth / 2;
  const clampedT = clamp(t, 0, 1);
  const span = halfW * (1 - Math.abs(clampedT * 2 - 1));
  return {
    x: top.x + (clamp(u, 0, 1) * 2 - 1) * span,
    y: top.y - halfD + depth * clampedT,
  };
}

function roofMaterialQuadPoints(top: ProjectedPoint, width: number, depth: number, u0: number, t0: number, u1: number, t1: number): number[] {
  const a = roofMaterialPoint(top, width, depth, u0, t0);
  const b = roofMaterialPoint(top, width, depth, u1, t0);
  const c = roofMaterialPoint(top, width, depth, u1, t1);
  const d = roofMaterialPoint(top, width, depth, u0, t1);
  return [a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y];
}

// 0.53E Hero Silhouette - a raised parapet wall around a flat roof edge. This is
// the single biggest "box -> building" cue: the roof stops reading as a flush
// lid and starts reading as a real rooftop bounded by a low wall.
function drawParapetCap(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, roofShape: CityWorldBuilding["roofShape"]) {
  if (roofShape !== "flat" && roofShape !== "sawtooth") return;
  const family = building.visualGrammar?.objectFamily;
  const eligible =
    family === "commerce_strip" || family === "civic_landmark" || family === "lowrise_cluster" ||
    family === "service_block" || family === "venue_anchor" || family === "transit_anchor";
  if (!eligible) return;

  const { top, footprintWidth, footprintDepth, roofColor } = geometry;
  const halfW = footprintWidth / 2;
  const halfD = footprintDepth / 2;
  const lift = Math.max(3.2, Math.min(footprintWidth * 0.05, 6.5));
  // Perimeter diamond corners of the roof top.
  const left = { x: top.x - halfW, y: top.y };
  const front = { x: top.x, y: top.y + halfD };
  const right = { x: top.x + halfW, y: top.y };

  // Two lit-vs-shade parapet wall faces standing up from the front edges.
  const litFace = new Graphics()
    .poly([left.x, left.y, front.x, front.y, front.x, front.y - lift, left.x, left.y - lift], true)
    .fill({ color: buildingFaceColor(shadeColor(roofColor, -6), "sun"), alpha: 0.9 });
  const shadeFace = new Graphics()
    .poly([front.x, front.y, right.x, right.y, right.x, right.y - lift, front.x, front.y - lift], true)
    .fill({ color: buildingFaceColor(shadeColor(roofColor, -6), "shade"), alpha: 0.92 });
  // Bright coping line along the top of the parapet + a warm sunlit front corner.
  const coping = new Graphics()
    .moveTo(left.x, left.y - lift)
    .lineTo(front.x, front.y - lift)
    .lineTo(right.x, right.y - lift);
  coping.stroke({ color: mixColor(shadeColor(roofColor, 40), SUN_WARM_TINT, 0.18), alpha: 0.85, width: 1.4, cap: "round", join: "round" });
  layer.addChild(litFace, shadeFace, coping);
}

function drawAuthoredRoofProfile(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
  const profile = building.visualGrammar?.roofProfile;
  if (!profile) return;
  const { top, footprintWidth, footprintDepth, roofColor } = geometry;

  if (profile === "terracotta_barrel_tile" || profile === "cool_clay_tile" || profile === "sage_tile") {
    // Clay depth pass: warmer tile pigment + soft eave-parallel courses +
    // thicker ridge barrel caps so roofs read as plasticine tile, not paint.
    const tileTint = profile === "terracotta_barrel_tile" ? 0xc4764e : profile === "cool_clay_tile" ? 0x7f9aa8 : 0x8ba372;
    const tint = polygon(
      diamondPoints(top, footprintWidth * 0.94, footprintDepth * 0.86),
      mixColor(tileTint, roofColor, 0.28),
      profile === "sage_tile" ? 0.26 : 0.24,
      mixColor(tileTint, 0xd8c7a8, 0.2),
      0.12,
    );
    // Soft courses parallel to the ridge (matte clay ridges, not hard lines).
    const courses = new Graphics();
    const courseCount = profile === "terracotta_barrel_tile" ? 4 : 3;
    for (let course = 1; course <= courseCount; course += 1) {
      const t = course / (courseCount + 1);
      const offset = (t - 0.5) * footprintDepth * 0.42;
      courses
        .moveTo(top.x - footprintWidth * 0.32, top.y + offset - footprintDepth * 0.08)
        .lineTo(top.x + footprintWidth * 0.32, top.y + offset + footprintDepth * 0.08);
    }
    courses.stroke({
      color: shadeColor(tileTint, profile === "cool_clay_tile" ? -10 : -16),
      alpha: 0.22,
      width: 1.35,
      cap: "round",
    });
    const ridgeStart = { x: top.x - footprintWidth * 0.24, y: top.y - footprintDepth * 0.13 };
    const ridgeEnd = { x: top.x + footprintWidth * 0.24, y: top.y + footprintDepth * 0.13 };
    const barrelCaps = new Graphics();
    const capCount = profile === "terracotta_barrel_tile" ? 6 : 5;
    for (let cap = 0; cap < capCount; cap += 1) {
      const t = capCount > 1 ? cap / (capCount - 1) : 0.5;
      const x = ridgeStart.x + (ridgeEnd.x - ridgeStart.x) * t;
      const y = ridgeStart.y + (ridgeEnd.y - ridgeStart.y) * t;
      barrelCaps.moveTo(x, y - 2.2).lineTo(x, y + 2.2);
    }
    barrelCaps.stroke({
      color: shadeColor(roofColor, profile === "cool_clay_tile" ? 34 : 28),
      alpha: profile === "terracotta_barrel_tile" ? 0.56 : 0.46,
      width: profile === "terracotta_barrel_tile" ? 2.1 : 1.65,
      cap: "round",
    });
    // Soft eave lip — ground contact of the clay roof mass.
    const eave = new Graphics()
      .moveTo(top.x - footprintWidth * 0.42, top.y + footprintDepth * 0.02)
      .lineTo(top.x, top.y + footprintDepth * 0.38)
      .lineTo(top.x + footprintWidth * 0.42, top.y + footprintDepth * 0.02);
    eave.stroke({ color: shadeColor(tileTint, -28), alpha: 0.28, width: 1.6, cap: "round", join: "round" });
    layer.addChild(tint, courses, barrelCaps, eave);
    return;
  }

  if (profile === "flat_parapet_cap") {
    // 0.53E item B — the parapet (drawParapetCap) and the roof deck must read
    // as ONE surface: a recessed membrane field sits inside the parapet line,
    // darker than the coping, with gravel flecks on the membrane. The old
    // bright cap ring competed with the parapet coping and made two decals.
    const membrane = polygon(diamondPoints(top, footprintWidth * 0.84, footprintDepth * 0.76), shadeColor(roofColor, -14), 0.32, shadeColor(roofColor, -30), 0.24);
    const gravelFlecks = new Graphics()
      .circle(top.x - footprintWidth * 0.16, top.y + footprintDepth * 0.04, 1.1)
      .circle(top.x + footprintWidth * 0.06, top.y - footprintDepth * 0.1, 1)
      .circle(top.x + footprintWidth * 0.2, top.y + footprintDepth * 0.08, 1.1)
      .fill({ color: shadeColor(roofColor, 22), alpha: 0.34 });
    layer.addChild(membrane, gravelFlecks);
    return;
  }

  if (profile === "blue_metal_utility") {
    // 0.53E item B — metal reads SMOOTH and COOL: a cool panel field under
    // crisper standing seams and a long specular streak. No courses, no warmth.
    const panelField = polygon(diamondPoints(top, footprintWidth * 0.9, footprintDepth * 0.82), mixColor(roofColor, SUN_COOL_TINT, 0.24), 0.16, roofColor, 0);
    const seams = new Graphics();
    for (let seam = -2; seam <= 2; seam += 1) {
      const offset = seam * footprintWidth * 0.13;
      seams
        .moveTo(top.x + offset - footprintWidth * 0.09, top.y - footprintDepth * 0.2)
        .lineTo(top.x + offset + footprintWidth * 0.09, top.y + footprintDepth * 0.2);
    }
    // Parallel seams only. The old counter-diagonal sheen streak crossed the
    // seams into an X-scribble at map zoom — metal identity is the cool panel
    // field + quiet seams.
    seams.stroke({ color: shadeColor(roofColor, -30), alpha: 0.22, width: 1, cap: "round" });
    layer.addChild(panelField, seams);
    return;
  }

  if (profile === "civic_glass_cap") {
    // 0.53E item B — civic glass reads GLAZED: a wider glass field with a
    // mullion cross and a bright specular so it is unmistakable next to clay
    // and metal, and catches the key light (item D pairs the roof rim).
    const glassField = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.04 }, footprintWidth * 0.62, footprintDepth * 0.44), 0xbfe4ee, 0.3, 0x4e8298, 0.2);
    const mullions = new Graphics()
      .moveTo(top.x - footprintWidth * 0.31, top.y - footprintDepth * 0.04)
      .lineTo(top.x + footprintWidth * 0.31, top.y - footprintDepth * 0.04)
      .moveTo(top.x, top.y - footprintDepth * 0.26)
      .lineTo(top.x, top.y + footprintDepth * 0.18);
    mullions.stroke({ color: 0x4e8298, alpha: 0.28, width: 1, cap: "round" });
    const specular = new Graphics()
      .moveTo(top.x - footprintWidth * 0.18, top.y - footprintDepth * 0.16)
      .lineTo(top.x + footprintWidth * 0.12, top.y + footprintDepth * 0.04);
    specular.stroke({ color: 0xeafaff, alpha: 0.55, width: 1.8, cap: "round" });
    layer.addChild(glassField, mullions, specular);
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
    .stroke({ color: dark, alpha: 0.38, width: 2.2, cap: "round", join: "round" });

  if (roofShape === "hip") {
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
  const { top, footprintWidth, footprintDepth, roofColor } = geometry;
  const roofShape = building.roofShape ?? "flat";
  // One eave shadow under pitched home roofs. The old wandering parapet
  // squiggles, shingle-course strokes, and translucent roof pads were the
  // scribble noise that made roofs read procedural.
  if (building.kind !== "home" || (roofShape !== "gable" && roofShape !== "hip")) return;
  const eaveLip = new Graphics()
    .moveTo(top.x - footprintWidth * 0.5, top.y + footprintDepth * 0.02)
    .lineTo(top.x, top.y + footprintDepth * 0.31)
    .lineTo(top.x + footprintWidth * 0.5, top.y + footprintDepth * 0.02);
  eaveLip.stroke({ color: shadeColor(roofColor, -50), alpha: 0.24, width: 1.8, cap: "round", join: "round" });
  layer.addChild(eaveLip);
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

  // 0.53E item A finish — the shell path is where most homes actually render
  // (only rowhomes have sprite art), so the hash-keyed roof accent + entry
  // stoop live here too. Same objectVariant key as the sprite path.
  const accentVariant = objectVariant(building.id, 97);
  const accentFlip = accentVariant % 2 === 0 ? -1 : 1;
  drawHomeStoop(layer, geometry, building, accentFlip);
  drawHomeRoofAccent(layer, geometry, building, accentFlip, accentVariant);
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

  // 0.57E parity — window columns LIVE on the front-left wall face: each
  // column starts under the eave line at its own horizontal offset (the face
  // slopes down toward center) and rows divide the actual wall height. The
  // old fixed-pixel grid floated columns off the face on generated widths.
  const windows = new Graphics();
  const wallHalfW = footprintWidth / 2;
  const wallHalfD = footprintDepth / 2;
  const wallHeight = Math.max(0, bottom.y - top.y);
  const windowRows = Math.min(4, Math.max(2, Math.floor((wallHeight - 8) / 9)));
  const rowStep = (wallHeight - 10) / windowRows;
  for (let col = 0; col < 3; col += 1) {
    const dx = -footprintWidth * (0.34 - col * 0.13);
    const eaveDrop = wallHalfD * (1 - Math.abs(dx) / wallHalfW);
    for (let row = 0; row < windowRows; row += 1) {
      const x = top.x + dx;
      const y = top.y + eaveDrop + 4 + row * rowStep;
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
  if (!hasHeroTieredCrown(building)) layer.addChild(roofShadow, roofTier, roofFacetLeft, roofFacetRight, roofCap, skylight, roofRidge);

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
  // 0.55E decal discipline — on object-kit civic landmarks the kit read owns
  // the plinth (plinthTiers), the entry canopy, and the facade bar rhythm, so
  // this generation's plinth pad, canopy, and near-white column bars (the
  // worst single wash: 5 bars + a wide band at alpha ~0.95) stand down there.
  // Non-kit civic buildings keep the full legacy read.
  if (isObjectKitCivicLandmark(building)) {
    layer.addChild(sideTerraceLeft, sideTerraceRight, frontSteps, entryBlock, sideWindows, facadeRhythm, baseRibs);
  } else {
    layer.addChild(sideTerraceLeft, sideTerraceRight, plinth, frontSteps, entryBlock, entryCanopy, columns, sideWindows, facadeRhythm, baseRibs);
  }

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

  // (item C) roofLantern + lanternGlass retired — the tiered crown owns the
  // hero roof; the ground-storey glass entry below keeps the lantern read.
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

  // (item C) roofShoulders retired with the other roof decals — crown owns it.
  // (0.55E) the entryAxis ground pad is retired too: the base hierarchy
  // forecourt + the kit plinth tiers already own the approach read.
  layer.addChild(civicPlinthStack, entryFrame, entryGlass, wingBays, civicNameplateGeometry);
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

function generatedTreeSpecies(prop: CityWorldProp): GeneratedTreeSpecies {
  if (!prop.id.startsWith("gen-")) return "round_canopy";
  if (prop.variant >= 40) return "palm";
  if (prop.variant >= 20) return "conifer";
  return "round_canopy";
}

function drawRoundCanopyTree(g: Graphics, point: ProjectedPoint, foliage: number, trunk: number, tall: boolean, variant: number) {
  const trunkHeight = tall ? 13 : 10;
  voxelBox(g, { x: point.x, y: point.y - 2 }, 5, 3, trunkHeight, trunk);
  voxelBox(g, { x: point.x, y: point.y - trunkHeight }, 19, 11, 9, shadeColor(foliage, -8));
  voxelBox(g, { x: point.x, y: point.y - trunkHeight - 8 }, 14, 8, 7, foliage);
  if (variant % 2 === 0) {
    voxelBox(g, { x: point.x, y: point.y - trunkHeight - 14 }, 9, 5, 5, shadeColor(foliage, 14));
  }
}

function drawConiferTree(g: Graphics, point: ProjectedPoint, foliage: number, trunk: number, tall: boolean) {
  const trunkHeight = tall ? 14 : 11;
  voxelBox(g, { x: point.x, y: point.y - 2 }, 4, 3, trunkHeight, shadeColor(trunk, -8));
  voxelBox(g, { x: point.x, y: point.y - trunkHeight + 4 }, tall ? 19 : 17, tall ? 11 : 10, 8, shadeColor(foliage, -18));
  voxelBox(g, { x: point.x, y: point.y - trunkHeight - 3 }, tall ? 15 : 13, tall ? 9 : 8, 7, shadeColor(foliage, -6));
  voxelBox(g, { x: point.x, y: point.y - trunkHeight - 9 }, tall ? 10 : 9, 6, 6, sunlitColor(foliage, "top"));
}

function drawPalmTree(g: Graphics, point: ProjectedPoint, foliage: number, trunk: number, tall: boolean) {
  const trunkHeight = tall ? 21 : 17;
  voxelBox(g, { x: point.x - 1, y: point.y - 2 }, 4, 3, trunkHeight * 0.54, shadeColor(trunk, 8));
  voxelBox(g, { x: point.x + 1, y: point.y - trunkHeight * 0.5 }, 4, 3, trunkHeight * 0.5, shadeColor(trunk, 18));
  const crownY = point.y - trunkHeight;
  voxelBox(g, { x: point.x - 8, y: crownY + 2 }, 15, 5, 5, shadeColor(foliage, -8));
  voxelBox(g, { x: point.x + 8, y: crownY + 3 }, 15, 5, 5, shadeColor(foliage, -4));
  voxelBox(g, { x: point.x, y: crownY - 2 }, 13, 9, 7, foliage);
  voxelBox(g, { x: point.x, y: crownY - 7 }, 8, 5, 5, shadeColor(foliage, 16));
}

function drawProp(layer: Container, prop: CityWorldProp, animated: AnimatedTarget[], atlas: CityWorldAtlasResolver, calm = 1) {
  const point = project(prop.position);
  const asset = atlas.resolveAsset(prop.spriteKey, prop.paletteKey, "prop");
  const baseColor = colorToNumber(asset.palette.colors.base);
  const shade = colorToNumber(asset.palette.colors.shade);
  const highlight = colorToNumber(asset.palette.colors.highlight);
  const accent = paletteColor(asset.palette.colors.accent, asset.palette.colors.highlight);

  if (prop.kind === "tree" || prop.kind === "bush") {
    // Blocky voxel foliage: trunk cube + 2-3 stacked, shrinking canopy boxes
    // (north-star stacked-cube grammar). Deterministic per-variant palette
    // shift + silhouette so groves read varied without noise.
    const foliage = prop.variant % 2 === 0 ? baseColor : shadeColor(baseColor, 12);
    const shadowReach = prop.kind === "bush" ? 8 : 14;
    const tree = new Graphics()
      .ellipse(point.x + shadowReach * 0.6, point.y - 1 + shadowReach * 0.18, prop.kind === "bush" ? 10 : 15, prop.kind === "bush" ? 3.6 : 4.6)
      .fill({ color: CAST_SHADOW_COLOR, alpha: 0.26 });
    if (prop.kind === "tree") {
      const tall = prop.variant % 3 === 0;
      const species = generatedTreeSpecies(prop);
      if (species === "conifer") drawConiferTree(tree, point, foliage, shade, tall);
      else if (species === "palm") drawPalmTree(tree, point, foliage, shade, tall);
      else drawRoundCanopyTree(tree, point, foliage, shade, tall, prop.variant);
    } else {
      voxelBox(tree, { x: point.x, y: point.y - 1 }, 13, 8, 6, shadeColor(foliage, -6));
      voxelBox(tree, { x: point.x, y: point.y - 6.5 }, 8, 5, 4, shadeColor(foliage, 10));
    }
    // Clay prop outline — soft warm edge, matches building clay stroke.
    tree.stroke({ color: mixColor(0x26332c, 0xd8c7a8, 0.35), alpha: 0.18, width: 1.15 });
    // Trees stay planted in the focal ring but yield opacity so they never
    // obscure the hero building's face separation.
    tree.alpha = Math.max(calm, 0.7);
    layer.addChild(tree);
    return;
  }

  if (prop.kind === "dock") {
    const dock = new Graphics()
      .ellipse(point.x + 4, point.y + 2, 16, 4)
      .fill({ color: 0x1d3a42, alpha: 0.2 });
    // Plank boxes marching toward the water (SE), on two pile cubes.
    voxelBox(dock, { x: point.x - 8, y: point.y - 1 }, 15, 9, 2.5, shade);
    voxelBox(dock, { x: point.x + 3, y: point.y + 4 }, 15, 9, 2.5, baseColor);
    voxelBox(dock, { x: point.x + 14, y: point.y + 9 }, 15, 9, 2.5, shadeColor(baseColor, -8));
    voxelBox(dock, { x: point.x + 20, y: point.y + 14 }, 3, 2.5, 5, shadeColor(shade, -14));
    voxelBox(dock, { x: point.x + 9, y: point.y + 12 }, 3, 2.5, 5, shadeColor(shade, -14));
    dock.stroke({ color: mixColor(0x26332c, 0xd8c7a8, 0.3), alpha: 0.2, width: 1.1 });
    dock.alpha = calm;
    layer.addChild(dock);
    return;
  }

  if (prop.kind === "boat") {
    const hullColor = prop.variant % 2 === 0 ? 0xd8dee2 : accent;
    const boat = new Graphics()
      .ellipse(point.x, point.y + 2, 15, 4.5)
      .fill({ color: 0x1d3a42, alpha: 0.24 });
    voxelBox(boat, { x: point.x, y: point.y }, 22, 9, 4, hullColor);
    voxelBox(boat, { x: point.x - 3, y: point.y - 4 }, 9, 6, 4.5, shadeColor(hullColor, 18));
    boat
      .moveTo(point.x + 6, point.y - 4)
      .lineTo(point.x + 6, point.y - 16)
      .stroke({ color: shade, alpha: 0.8, width: 1.4, cap: "round" });
    boat.stroke({ color: mixColor(0x26332c, 0xd8c7a8, 0.3), alpha: 0.2, width: 1.1 });
    boat.alpha = calm;
    layer.addChild(boat);
    return;
  }

  if (prop.kind === "water_tower") {
    const tower = new Graphics()
      .ellipse(point.x + 6, point.y + 1, 15, 4.5)
      .fill({ color: CAST_SHADOW_COLOR, alpha: 0.22 });
    // Four leg strokes, tank cylinder, cone cap — the skyline landmark.
    tower
      .moveTo(point.x - 8, point.y)
      .lineTo(point.x - 5, point.y - 22)
      .moveTo(point.x + 8, point.y)
      .lineTo(point.x + 5, point.y - 22)
      .moveTo(point.x - 4, point.y + 3)
      .lineTo(point.x - 2.5, point.y - 22)
      .moveTo(point.x + 4, point.y + 3)
      .lineTo(point.x + 2.5, point.y - 22)
      .stroke({ color: shade, alpha: 0.9, width: 1.6, cap: "round" });
    tower
      .moveTo(point.x - 6.5, point.y - 8)
      .lineTo(point.x + 6.5, point.y - 12)
      .stroke({ color: shade, alpha: 0.6, width: 1, cap: "round" });
    tower
      .rect(point.x - 9, point.y - 36, 18, 14)
      .fill({ color: sunlitColor(baseColor, "sun") })
      .rect(point.x + 1, point.y - 36, 8, 14)
      .fill({ color: sunlitColor(baseColor, "shade"), alpha: 0.6 })
      .ellipse(point.x, point.y - 22, 9, 3)
      .fill({ color: shadeColor(baseColor, -20) });
    tower
      .moveTo(point.x - 10, point.y - 35)
      .lineTo(point.x, point.y - 42)
      .lineTo(point.x + 10, point.y - 35)
      .closePath()
      .fill({ color: sunlitColor(accent, "top") });
    tower.stroke({ color: 0x26332c, alpha: 0.3, width: 1 });
    tower.alpha = calm;
    layer.addChild(tower);
    return;
  }

  if (prop.kind === "fountain") {
    const fountain = new Graphics()
      .ellipse(point.x, point.y - 7, 20, 11)
      .fill({ color: baseColor, alpha: 0.85 })
      .stroke({ color: shade, alpha: 0.8, width: 2 })
      .circle(point.x, point.y - 14, 4)
      .fill({ color: highlight, alpha: 0.9 });
    animated.push({ target: fountain, kind: "water", path: [], speed: 0.025, phase: prop.variant * 0.2, baseAlpha: 0.78 * calm, origin: point });
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
    animated.push({ target: shimmer, kind: "water", path: [], speed: 0.02, phase: prop.variant * 0.35, baseAlpha: 0.52 * calm, origin: point });
    layer.addChild(shimmer);
    return;
  }

  if (prop.kind === "streetlight") {
    const streetlight = new Graphics()
        .ellipse(point.x, point.y - 1, 6, 2.5)
        .fill({ color: 0x23342e, alpha: 0.16 })
        .rect(point.x - 1.2, point.y - 22, 2.4, 20)
        .fill({ color: baseColor, alpha: 0.9 })
        .rect(point.x - 1.2, point.y - 22, 11, 2)
        .fill({ color: baseColor, alpha: 0.9 })
        .circle(point.x + 2, point.y - 24, 4)
        .fill({ color: highlight, alpha: 0.92 })
        .circle(point.x + 2, point.y - 24, 9)
        .fill({ color: highlight, alpha: 0.08 });
    streetlight.alpha = calm;
    layer.addChild(streetlight);
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
    bench.alpha = calm;
    layer.addChild(bench);
    return;
  }

  if (prop.kind === "parked_car") {
    const parkedCar = drawSmallCarGraphic(point, PARKED_CAR_COLORS[prop.variant % PARKED_CAR_COLORS.length] ?? baseColor, prop.variant % 2 === 0 ? "east-west" : "north-south", {
      windowColor: highlight,
      lightColor: accent,
      outlineColor: shade,
    });
    parkedCar.alpha = calm;
    layer.addChild(parkedCar);
    return;
  }

  if (prop.kind === "sign") {
    const boardColor = prop.variant % 3 === 0 ? baseColor : prop.variant % 3 === 1 ? accent : highlight;
    const signBoard = new Graphics()
        .ellipse(point.x, point.y - 1, 8, 3)
        .fill({ color: 0x23342e, alpha: 0.16 })
        .rect(point.x - 1, point.y - 20, 2, 20)
        .fill({ color: shade })
        .roundRect(point.x - 14, point.y - 31, 28, 13, 3)
        .fill({ color: boardColor, alpha: 0.95 })
        .moveTo(point.x - 8, point.y - 25)
        .lineTo(point.x + 8, point.y - 25)
        .stroke({ color: 0x26332c, alpha: 0.65, width: 1.5 });
    signBoard.alpha = calm;
    layer.addChild(signBoard);
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

function drawActor(layer: Container, actor: CityWorldActor, animated: AnimatedTarget[], atlas: CityWorldAtlasResolver, calm = 1) {
  if (actor.kind === "clawd") return;

  const point = project(actor.position);
  const actorPoint = point;
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
  } else {
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
  }

  // 0.67H — actors are ambience, not focal objects.
  graphic.alpha = 0.8 * calm;

  animated.push({
    target: graphic,
    kind: actor.kind,
    path: actor.path,
    speed: actor.speed,
    phase: actor.phase,
    baseAlpha: 0.8 * calm,
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
  layers: LayerMap,
  place: CityWorldPlace,
  onSelectPlace: (placeId: string) => void,
  onHoverPlace: (placeId: string | undefined) => void,
  cameraZoom: number,
  noteCount = 0,
) {
  // Neutral, static marker only: emphasis rings + their pulse animation live
  // in the focus overlay, so hover/selection never rebuilds the base scene
  // and a scene with no focus has no perpetual marker animations.
  // 0.67H marker quieting — the ring is a ground-contact indicator, not a
  // glow: small, warm-neutral, held near the shadow floor.
  const point = project(place.anchor);
  const ring = new Graphics()
    .ellipse(point.x, point.y - 4, 16, 16 * 0.48)
    .fill({ color: 0xf3ecd8, alpha: 0.03 })
    .stroke({ color: 0x33443b, alpha: 0.08, width: 1.2 });
  // The ring is ground furniture: it lives under shadows and buildings so it
  // can never draw across a wall when the anchor sits inside a structure.
  layers.padLayer.addChild(ring);

  // Map note badge: sticky clay tab on places that have session notes.
  if (noteCount > 0) {
    drawPlaceNoteBadge(layers.markerLayer, point, noteCount);
  }

  // S4e (decision #26): the hit disc lives in WORLD space, so its on-screen
  // size shrinks with zoom — floor it at a 44px target (22px radius) in
  // SCREEN pixels regardless of visual marker size.
  const hitRadius = Math.max(place.hitRadius * 13, 22 / Math.max(cameraZoom, 0.01));
  const hit = new Graphics().circle(point.x, point.y - 12, hitRadius).fill({ color: 0xffffff, alpha: 0.001 });
  hit.eventMode = "static";
  hit.cursor = "pointer";
  hit.on("pointertap", () => onSelectPlace(place.id));
  hit.on("pointerover", () => onHoverPlace(place.id));
  hit.on("pointerout", () => onHoverPlace(undefined));
  layers.markerLayer.addChild(hit);
}

/** Compact clay sticky-note badge above a place anchor (count of session notes). */
function drawPlaceNoteBadge(layer: Container, point: ProjectedPoint, noteCount: number) {
  const bx = point.x + 14;
  const by = point.y - 28;
  const badge = new Graphics()
    .roundRect(bx - 8, by - 9, 16, 14, 3)
    .fill({ color: 0xf4e4a8, alpha: 0.96 })
    .stroke({ color: 0xc4a85a, alpha: 0.72, width: 1.2 })
    .poly([bx + 3, by - 9, bx + 8, by - 9, bx + 8, by - 4], true)
    .fill({ color: 0xe8d48a, alpha: 0.9 });
  badge.label = `place-note-badge`;
  const label = new Text({
    text: noteCount > 9 ? "9+" : String(noteCount),
    style: { fill: 0x5a4820, fontFamily: "Arial", fontSize: 9, fontWeight: "800" },
  });
  label.anchor.set(0.5);
  label.position.set(bx, by - 1);
  layer.addChild(badge, label);
}

type FocusMode = "selected" | "hovered";

// Redraws ONLY the focus overlay: emphasized ring (with the pulse animation),
// stroke-only silhouettes of the place's anchored buildings, and the
// emphasized label. A hover change costs ~4-10 Graphics instead of a full
// scene teardown.
function drawFocusOverlay(
  layer: Container,
  place: CityWorldPlace,
  focus: FocusIndex,
  mode: FocusMode,
  animated: AnimatedTarget[],
) {
  // 0.67H — selection is a warm contact accent, not a white debug glow: quiet
  // warm ring near the shadow floor, warm-toned silhouette strokes.
  const point = project(place.anchor);
  const selected = mode === "selected";
  const landmarkFocus = selected && place.kind === "landmark";
  const markerPoint = landmarkFocus ? { x: point.x, y: point.y + 20 } : point;
  const radius = selected ? (landmarkFocus ? 18 : 22) : 20;
  const ring = new Graphics()
    .ellipse(markerPoint.x, markerPoint.y - 4, radius, radius * 0.48)
    .fill({ color: selected ? 0xe9d9ac : 0xf3ecd8, alpha: selected ? 0.12 : 0.09 })
    .stroke({ color: selected ? 0xb99c5f : 0xcdbf9c, alpha: 0.44, width: selected ? 1.4 : 1.2 });
  animated.push({ target: ring, kind: "pulse", path: [], speed: 0.02, phase: place.activity, baseAlpha: 0.32, origin: markerPoint });
  layer.addChild(ring);

  const outlineColor = selected ? 0xc2a05e : 0xcdb98a;
  for (const building of focus.buildingsByPlaceId.get(place.id) ?? []) {
    const bottom = project(building.position);
    const top = project({ x: building.position.x, y: building.position.y, z: (building.position.z ?? 0) + building.height });
    const halfW = (building.width * TILE_WIDTH) / 2;
    const halfD = (building.depth * TILE_HEIGHT) / 2;
    const silhouette = new Graphics()
      .poly(
        [
          top.x - halfW, top.y,
          top.x, top.y - halfD,
          top.x + halfW, top.y,
          bottom.x + halfW, bottom.y,
          bottom.x, bottom.y + halfD,
          bottom.x - halfW, bottom.y,
        ],
        true,
      )
      .stroke({ color: outlineColor, alpha: selected ? 0.5 : 0.4, width: selected ? 1.6 : 1.3, join: "round" });
    const roofEdge = new Graphics()
      .poly(diamondPoints(top, building.width * TILE_WIDTH, building.depth * TILE_HEIGHT), true)
      .stroke({ color: outlineColor, alpha: selected ? 0.36 : 0.28, width: 1.1 });
    layer.addChild(silhouette, roofEdge);
  }

  drawFocusPlaceLabel(layer, place, mode, focus.crownLift.get(place.id));
}

function drawFocusPlaceLabel(layer: Container, place: CityWorldPlace, mode: FocusMode, crownLift?: number) {
  const point = project(place.anchor);
  const selected = mode === "selected";
  const landmarkFocus = selected && place.kind === "landmark";
  // 0.67H — focus labels are smaller and quieter; the selected landmark label
  // slides off the roof axis and clears the crown with a small margin.
  const text = new Text({
    text: place.label,
    style: {
      fill: 0x2c3a33,
      fontFamily: "Arial",
      fontSize: landmarkFocus ? 10 : 11,
      fontWeight: "700",
      stroke: { color: 0xfff8e7, width: 3 },
    },
  });
  text.anchor.set(0.5);
  const baseLift = landmarkFocus ? 70 : 52;
  text.position.set(point.x + (landmarkFocus ? -44 : 0), point.y - Math.max(baseLift, (crownLift ?? 0) + 6));
  const paddingX = landmarkFocus ? 6 : 5;
  const paddingY = landmarkFocus ? 2.5 : 3;
  const backing = new Graphics()
    .roundRect(
      text.position.x - text.width / 2 - paddingX,
      text.position.y - text.height / 2 - paddingY,
      text.width + paddingX * 2,
      text.height + paddingY * 2,
      4,
    )
    .fill({ color: 0xfff7df, alpha: 0.5 })
    .stroke({ color: 0x26332c, alpha: 0.12, width: 1 });
  layer.addChild(backing, text);
}

function drawPin(layer: Container, pin: CityWorldPin, atlas: CityWorldAtlasResolver) {
  const point = project(pin.anchor);
  const pinPoint = offsetPinPoint(point, pin);
  const asset = atlas.resolveAsset(pin.spriteKey, pin.paletteKey, "marker");
  // 0.67H — pins on the focal landmark shrink so the sticker never owns the
  // silhouette it annotates.
  const focalPin = pin.placeId === "place-eastvale-core";
  if (asset.mode === "sprite") {
    const sprite = new Sprite(asset.texture);
    sprite.anchor.set(asset.anchor.x, asset.anchor.y);
    sprite.scale.set(asset.scale * (focalPin ? 0.8 : 1));
    sprite.position.set(pinPoint.x, pinPoint.y + 1);
    sprite.label = `sprite-${pin.id}`;
    layer.addChild(sprite);
    return;
  }
  const color = colorToNumber(asset.palette.colors.base);
  const shade = colorToNumber(asset.palette.colors.shade);
  const highlight = colorToNumber(asset.palette.colors.highlight);
  // Clay sticky badge for notes; compact circle for sticker kinds.
  if (pin.kind === "note") {
    const countMatch = /^(\d+)\s+notes?$/i.exec(pin.label.trim());
    const glyph = countMatch ? (Number(countMatch[1]) > 9 ? "9+" : countMatch[1]!) : "N";
    const noteBadge = new Graphics()
      .roundRect(pinPoint.x - 9, pinPoint.y - 24, 18, 16, 3.5)
      .fill({ color: mixColor(color, 0xf4e4a8, 0.55), alpha: 0.97 })
      .stroke({ color: mixColor(shade, 0xc4a85a, 0.4), alpha: 0.75, width: 1.3 })
      .poly([pinPoint.x - 2, pinPoint.y - 8, pinPoint.x + 2, pinPoint.y - 8, pinPoint.x, pinPoint.y - 3], true)
      .fill({ color: mixColor(color, 0xf4e4a8, 0.55), alpha: 0.97 });
    const label = new Text({
      text: glyph,
      style: { fill: 0x5a4820, fontFamily: "Arial", fontSize: 9, fontWeight: "800" },
    });
    label.anchor.set(0.5);
    label.position.set(pinPoint.x, pinPoint.y - 15);
    layer.addChild(noteBadge, label);
    return;
  }
  const badge = new Graphics()
    .poly([pinPoint.x, pinPoint.y - 2, pinPoint.x - 5, pinPoint.y - 8, pinPoint.x + 5, pinPoint.y - 8], true)
    .fill({ color: shade, alpha: 0.86 })
    .circle(pinPoint.x, pinPoint.y - 15, 9)
    .fill({ color, alpha: 0.98 })
    .circle(pinPoint.x - 3, pinPoint.y - 18.5, 2)
    .fill({ color: highlight, alpha: 0.34 })
    .stroke({ color: shade, alpha: 0.7, width: 1.5 });
  const label = new Text({
    text: stickerGlyph(pin.kind),
    style: { fill: shade, fontFamily: "Arial", fontSize: 9, fontWeight: "900" },
  });
  label.anchor.set(0.5);
  label.position.set(pinPoint.x, pinPoint.y - 15);
  layer.addChild(badge, label);
}

function offsetPinPoint(point: ProjectedPoint, pin: CityWorldPin): ProjectedPoint {
  if (pin.placeId !== "place-eastvale-core") return point;

  // 0.67H — focal-landmark pins slide off the facade toward the plinth apron.
  if (pin.kind === "note") return { x: point.x + 30, y: point.y + 14 };
  if (pin.kind === "favorite") return { x: point.x - 30, y: point.y + 16 };
  return { x: point.x + 6, y: point.y + 26 };
}

// 0.56E — a place label must never erase the architecture it names: the lift
// is the max of the legacy ground offset and the tallest anchored structure's
// silhouette (roof + crown allowance), clamped so labels stay attached.
function placeCrownLiftMap(buildings: CityWorldBuilding[]): Map<string, number> {
  const lift = new Map<string, number>();
  for (const building of buildings) {
    if (!building.placeId) continue;
    const crownAllowance = hasHeroTieredCrown(building) ? 52 : building.roofShape === "tower" ? 30 : 14;
    const clearance = Math.min(building.height * TILE_DEPTH + crownAllowance, 104);
    if (clearance > (lift.get(building.placeId) ?? 0)) lift.set(building.placeId, clearance);
  }
  return lift;
}

function drawPlaceLabel(layer: Container, place: CityWorldPlace, ambientLabelIds: ReadonlySet<string>, crownLift?: number) {
  // Neutral base label only; the focus overlay draws the emphasized variant
  // and hides this one (matched by container label) while the place is focused.
  // 0.67H — ambient labels are a hard allowance, and every label is smaller
  // and quieter so building crowns own the frame.
  if (!ambientLabelIds.has(place.id)) return;

  const point = project(place.anchor);
  const text = new Text({
    text: place.label,
    style: {
      fill: 0x2c3a33,
      fontFamily: "Arial",
      fontSize: 10,
      fontWeight: "700",
      stroke: { color: 0xfff8e7, width: 3 },
    },
  });
  text.anchor.set(0.5);
  text.position.set(point.x, point.y - Math.max(44, (crownLift ?? 0) + 6));
  const backing = new Graphics()
    .roundRect(
      text.position.x - text.width / 2 - 5,
      text.position.y - text.height / 2 - 3,
      text.width + 10,
      text.height + 6,
      4,
    )
    .fill({ color: 0xfff7df, alpha: 0.34 })
    .stroke({ color: 0x26332c, alpha: 0.08, width: 1 });
  const group = new Container();
  group.label = `place-label-${place.id}`;
  group.addChild(backing, text);
  layer.addChild(group);
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
    } else if (item.kind === "walker") {
      item.target.y += Math.sin(elapsed * 4 + item.phase * 5) * 0.05;
    } else if (item.kind === "pulse") {
      item.target.alpha = item.baseAlpha + Math.sin(elapsed * 2 + item.phase * 4) * 0.05;
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

// Iso voxel cube: top diamond + lit/shade faces appended into a Graphics.
// The shared primitive behind the blocky prop kit and cliff courses — props
// read as stacked cubes (north-star voxel grammar), not vector lollipops.
function voxelBox(g: Graphics, base: ProjectedPoint, width: number, depth: number, height: number, color: number, alpha = 1): void {
  const halfW = width / 2;
  const halfD = depth / 2;
  const topY = base.y - height;
  g
    .moveTo(base.x - halfW, topY)
    .lineTo(base.x, topY + halfD)
    .lineTo(base.x, base.y + halfD)
    .lineTo(base.x - halfW, base.y)
    .closePath()
    .fill({ color: sunlitColor(color, "sun"), alpha });
  g
    .moveTo(base.x + halfW, topY)
    .lineTo(base.x, topY + halfD)
    .lineTo(base.x, base.y + halfD)
    .lineTo(base.x + halfW, base.y)
    .closePath()
    .fill({ color: sunlitColor(color, "shade"), alpha });
  g.poly(diamondPoints({ x: base.x, y: topY }, width, depth), true).fill({ color: sunlitColor(color, "top"), alpha });
}

// Append a filled/stroked polygon into a SHARED Graphics. Ground layers
// (terrain, lots, roads) merge thousands of per-item Graphics into a few
// depth-band / pass Graphics; within one Graphics, path order is z order, so
// append order must match the old per-object add order.
function appendPolygon(g: Graphics, points: number[], fill: number, alpha = 1, stroke = 0x26332c, strokeAlpha = 0.42): Graphics {
  g.poly(points, true).fill({ color: fill, alpha });
  if (strokeAlpha > 0) g.stroke({ color: stroke, alpha: strokeAlpha, width: 1 });
  return g;
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
  // 0.53E item D — the top face carries most of the frame; a slightly stronger
  // lift + warm tint makes roofs read lit instead of matte next to the walls.
  if (face === "top") return mixColor(scaleColor(color, 1.26), SUN_WARM_TINT, 0.17);
  if (face === "sun") return mixColor(scaleColor(color, 1.18), SUN_WARM_TINT, 0.15);
  return mixColor(mixColor(scaleColor(color, 0.36), SUN_COOL_TINT, 0.24), SUN_WARM_TINT, 0.06);
}

// 0.68H face/material read — building faces get their own light response,
// separate from terrain/props (sunlitColor). The global curve pushed lit walls
// and roofs to near-white luma, where the 0.54E highlight rolloff grades them
// into one milky paper tone — that is the "flat/milky planes" read. Building
// faces keep more of their own pigment: a bright-but-saturated top, a warm mid
// sun wall, and a firmly darker cool shade wall — three distinct values per
// box, separated by tone instead of outlines.
function buildingFaceColor(color: number, face: SunFace): number {
  if (face === "top") return mixColor(scaleColor(color, 1.17), SUN_WARM_TINT, 0.08);
  if (face === "sun") return mixColor(scaleColor(color, 1.11), SUN_WARM_TINT, 0.09);
  return mixColor(mixColor(scaleColor(color, 0.46), SUN_COOL_TINT, 0.16), SUN_WARM_TINT, 0.04);
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
