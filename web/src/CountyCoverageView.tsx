import { useRef, type ReactNode } from "react";
import type { CityWorldScene } from "@atlas/core/voxel";
import { sendUserMessage, useOpenAiDisplayMode } from "./bridge";
import { CityWorldRenderer, type CityWorldRendererHandle } from "./CityWorldRenderer";
import { MapChrome, readRequestedCameraPreset, readRequestedDebugMode } from "./MapChrome";
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
  const statusLabel = isShell ? "Preview available" : coverage.coverageLabel;
  const stateLabel = isShell ? "Map preview" : "Unavailable";
  const sourceLabel = coverage.sourceNotes[0]?.label ?? "Atlas county list";
  const cameraPresetId = shellScene ? readRequestedCameraPreset(shellScene) : undefined;
  const debugMode = readRequestedDebugMode();
  const displayMode = useOpenAiDisplayMode();
  const boundaryCopy = isShell
    ? "Session-only free map planner. Stays in this chat."
    : "Unavailable in this free map planner. Stays in this chat.";
  const recoveryText = "Open Riverside/Eastvale";

  const openPlayableSlice = () => {
    void sendUserMessage("Open Riverside/Eastvale in Atlas.");
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
      data-qa-display-mode={displayMode}
      data-display-mode={displayMode}
    >
      <span className="city-world-sr-only" data-qa="display-mode" data-display-mode={displayMode}>
        {displayMode}
      </span>
      {shellScene ? (
        <CityWorldRenderer ref={rendererRef} scene={shellScene} cameraPresetId={cameraPresetId} debugMode={debugMode} onSelectPlace={() => undefined} />
      ) : (
        <div className="city-world-coverage-map-fallback" aria-hidden="true" />
      )}

      <div className="city-world-left-rail">
        <div className="city-world-location" aria-label="Current county status" data-qa="current-county-coverage">
          <span>{countyLabel}</span>
          <strong>{statusLabel}</strong>
        </div>
        {countySwitcher}
      </div>

      {shellScene ? <MapChrome rendererRef={rendererRef} /> : null}

      <section
        className="city-world-tray city-world-coverage-tray"
        aria-label="County status"
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
          <span className="city-world-place-pulse">{coverage.supported ? "Preview" : "Unavailable"}</span>
        </div>

        <div className="city-world-tray-meta" aria-label="Map facts">
          <span data-qa="coverage-playable-districts">
            <b>{coverage.playableDistrictCount}</b> full-map areas
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
          Source: {sourceLabel}. Full map: Riverside/Eastvale.
        </div>
      </section>
    </main>
  );
}

