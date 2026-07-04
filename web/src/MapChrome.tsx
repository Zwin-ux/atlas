import type { RefObject } from "react";
import type { CityWorldScene } from "@atlas/core/voxel";
import type { CityWorldRendererHandle } from "./CityWorldRenderer";

/**
 * Shared map chrome: the zoom/center control cluster plus the URL-param
 * readers. Consumed by BOTH CityWorldView and CountyCoverageView so the two
 * surfaces cannot drift — markup and data-qa output are byte-identical.
 */

export type MapChromeProps = {
  rendererRef: RefObject<CityWorldRendererHandle>;
};

export function MapChrome({ rendererRef }: MapChromeProps) {
  return (
    <div className="city-world-zoom" aria-label="Map zoom controls" data-qa="map-zoom-controls">
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
  if (typeof window === "undefined") return undefined;
  const requested = new URLSearchParams(window.location.search).get("atlasCamera");
  return scene.cameraPresets.some((preset) => preset.id === requested) ? (requested as CityWorldScene["cameraPresets"][number]["id"]) : undefined;
}

export function readRequestedDebugMode(): "engine" | undefined {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get("atlasDebug") === "engine" ? "engine" : undefined;
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
