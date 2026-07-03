import { useEffect, useRef, type ReactNode } from "react";
import type { CityWorldScene } from "@atlas/core/voxel";
import { sendUserMessage } from "./bridge";
import { CityWorldRenderer, type CityWorldRendererHandle } from "./CityWorldRenderer";
import type { CountyCoverageStructuredContent } from "./App";

type CountyCoverageViewProps = {
  coverage: CountyCoverageStructuredContent;
  shellScene: CityWorldScene | null;
  countySwitcher?: ReactNode;
};

export function CountyCoverageView({ coverage, shellScene, countySwitcher }: CountyCoverageViewProps) {
  const rendererRef = useRef<CityWorldRendererHandle | null>(null);
  const isShell = coverage.coverageTier === "L1_COUNTY_SHELL";
  const countyLabel = coverage.countyLabel ?? coverage.countySlug;
  const statusLabel = isShell ? "Indexed shell" : coverage.coverageLabel;
  const stateLabel = isShell ? "Shell state" : "Not indexed";
  const sourceLabel = coverage.sourceNotes[0]?.label ?? "Atlas coverage index";
  const cameraPresetId = shellScene ? readRequestedCameraPreset(shellScene) : undefined;
  const debugMode = readRequestedDebugMode();
  const boundaryCopy = isShell
    ? "Indexed only. No saves, XP, evidence, or automation."
    : "Not indexed yet. No saves, XP, evidence, or automation.";
  const recoveryText = "Open Riverside/Eastvale playable Alpha";

  useEffect(() => {
    const openaiWindow = window as Window & {
      openai?: { requestDisplayMode?: (payload: { mode: "inline" | "pip" | "fullscreen" }) => Promise<unknown> };
    };
    void openaiWindow.openai?.requestDisplayMode?.({ mode: "fullscreen" }).catch(() => undefined);
  }, []);

  const openPlayableSlice = () => {
    void sendUserMessage("Open Riverside/Eastvale playable Alpha in Atlas.");
  };

  return (
    <main
      className="city-world-shell city-world-coverage-shell"
      data-qa="county-coverage-shell"
      data-qa-county-slug={coverage.countySlug}
      data-qa-supported={String(coverage.supported)}
      data-qa-coverage-tier={coverage.coverageTier}
      data-qa-playable-district-count={coverage.playableDistrictCount}
      data-qa-place-count={coverage.placeCount}
      data-qa-session-boundary="session-only"
      data-qa-camera-preset={cameraPresetId ?? ""}
    >
      {shellScene ? (
        <CityWorldRenderer ref={rendererRef} scene={shellScene} cameraPresetId={cameraPresetId} debugMode={debugMode} onSelectPlace={() => undefined} />
      ) : (
        <div className="city-world-coverage-map-fallback" aria-hidden="true" />
      )}

      <div className="city-world-location" aria-label="Current county coverage" data-qa="current-county-coverage">
        <span>{countyLabel}</span>
        <strong>{statusLabel}</strong>
      </div>

      {countySwitcher}

      {shellScene ? (
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
      ) : null}

      <section
        className="city-world-tray city-world-coverage-tray"
        aria-label="County coverage status"
        data-qa="coverage-status-tray"
        data-qa-county-label={countyLabel}
        data-qa-coverage-message={coverage.message}
      >
        <div className="city-world-tray-head">
          <div className="city-world-place-copy">
            <span className="city-world-place-type">{stateLabel}</span>
            <strong data-qa="coverage-status-label">{coverage.coverageLabel}</strong>
            <p>{coverage.message}</p>
          </div>
          <span className="city-world-place-pulse">{coverage.supported ? "Indexed" : "Unsupported"}</span>
        </div>

        <div className="city-world-tray-meta" aria-label="Coverage facts">
          <span data-qa="coverage-playable-districts">
            <b>{coverage.playableDistrictCount}</b> playable districts
          </span>
          <span data-qa="coverage-place-count">
            <b>{coverage.placeCount}</b> places
          </span>
          {coverage.geoid ? (
            <span data-qa="coverage-geoid">
              <b>{coverage.geoid}</b> Census ID
            </span>
          ) : null}
        </div>

        <div className="city-world-session-boundary" data-qa="coverage-boundary">
          {boundaryCopy}
        </div>

        <button type="button" className="city-world-recovery-action" data-qa="coverage-recovery-action" onClick={openPlayableSlice}>
          {recoveryText}
        </button>

        <div className="city-world-latest-note city-world-coverage-source" data-qa="coverage-source-note">
          Source: {sourceLabel}. Playable: Riverside/Eastvale.
        </div>
      </section>
    </main>
  );
}

function readRequestedCameraPreset(scene: CityWorldScene): CityWorldScene["cameraPresets"][number]["id"] | undefined {
  if (typeof window === "undefined") return undefined;
  const requested = new URLSearchParams(window.location.search).get("atlasCamera");
  return scene.cameraPresets.some((preset) => preset.id === requested) ? (requested as CityWorldScene["cameraPresets"][number]["id"]) : undefined;
}

function readRequestedDebugMode(): "engine" | undefined {
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
