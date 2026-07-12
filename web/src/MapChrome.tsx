import type { RefObject } from "react";
import type { CityWorldScene } from "@atlas/core/voxel";
import { useOpenAiDisplayMode, type OpenAiDisplayMode } from "./bridge";
import type { CityWorldRendererHandle } from "./CityWorldRenderer";

/**
 * Shared map chrome: the zoom/center control cluster plus the URL-param
 * readers. Consumed by BOTH CityWorldView and CountyCoverageView so the two
 * surfaces cannot drift — markup and data-qa output are byte-identical.
 */

export type MapChromeProps = {
  rendererRef: RefObject<CityWorldRendererHandle>;
};

function requestHostDisplayMode(mode: OpenAiDisplayMode): void {
  const openai = window.openai as ({ requestDisplayMode?: (payload: { mode: OpenAiDisplayMode }) => unknown } & typeof window.openai) | undefined;
  try {
    void Promise.resolve(openai?.requestDisplayMode?.({ mode })).catch(() => undefined);
  } catch {
    // Real-host display mode is optional. Inline remains the safe baseline.
  }
}

export function MapChrome({ rendererRef }: MapChromeProps) {
  const displayMode = useOpenAiDisplayMode();
  const fullscreen = displayMode === "fullscreen";
  const handleDisplayModeToggle = () => requestHostDisplayMode(fullscreen ? "inline" : "fullscreen");

  return (
    <div className="city-world-zoom" aria-label="Map zoom controls" data-qa="map-zoom-controls">
      <button
        type="button"
        aria-label={fullscreen ? "Collapse map" : "Expand map"}
        aria-pressed={fullscreen}
        data-qa="expand-map-button"
        onClick={handleDisplayModeToggle}
      >
        {fullscreen ? <CollapseIcon /> : <ExpandIcon />}
      </button>
      <button type="button" aria-label="Zoom in" data-qa="zoom-in-button" onClick={() => rendererRef.current?.zoomIn()}>
        <ZoomInIcon />
      </button>
      <button type="button" aria-label="Center map" data-qa="center-map-button" onClick={() => rendererRef.current?.center()}>
        <CenterIcon />
      </button>
      <button type="button" aria-label="Zoom out" data-qa="zoom-out-button" onClick={() => rendererRef.current?.zoomOut()}>
        <ZoomOutIcon />
      </button>
    </div>
  );
}

export function readRequestedCameraPreset(scene: CityWorldScene): CityWorldScene["cameraPresets"][number]["id"] | undefined {
  const sceneRequested = scene.cameraPresets.find((preset) => preset.id === "focus")?.id;
  if (sceneRequested) return sceneRequested;
  if (typeof window === "undefined") return undefined;
  const requested = new URLSearchParams(window.location.search).get("atlasCamera");
  return scene.cameraPresets.some((preset) => preset.id === requested) ? (requested as CityWorldScene["cameraPresets"][number]["id"]) : undefined;
}

export function readRequestedDebugMode(): "engine" | undefined {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get("atlasDebug") === "engine" ? "engine" : undefined;
}

// The Riverside/Orange/Unknown coverage-tier switcher is a QA affordance for
// proving the honest-shell/unsupported-county contract (verify-county-
// switcher.mjs) — real users never asked to see "Unknown · Unavailable" as
// primary navigation. Opt-in only, same pattern as atlasDebug.
export function readRequestedCountySwitcherVisible(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("atlasCountySwitcher") === "1";
}

function ZoomInIcon() {
  return (
    <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h12" />
    </svg>
  );
}

function CenterIcon() {
  return (
    <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3v3M10 14v3M3 10h3M14 10h3" />
      <circle cx="10" cy="10" r="3.5" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M7.2 4.5H4.5v2.7M12.8 4.5h2.7v2.7M7.2 15.5H4.5v-2.7M12.8 15.5h2.7v-2.7" />
      <path d="M4.8 4.8 8 8M15.2 4.8 12 8M4.8 15.2 8 12M15.2 15.2 12 12" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M8 4.8v3.1H4.9M12 4.8v3.1h3.1M8 15.2v-3.1H4.9M12 15.2v-3.1h3.1" />
      <path d="M8 7.9 4.8 4.7M12 7.9l3.2-3.2M8 12.1l-3.2 3.2M12 12.1l3.2 3.2" />
    </svg>
  );
}
