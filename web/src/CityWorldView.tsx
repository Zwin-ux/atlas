import { lazy, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import type { CampaignPreviewState, ScoutPreviewState } from "@atlas/core/scout";
import {
  CITY_WORLD_TILE_BASIS,
  compileCityWorldScene,
  cityWorldDiamondPoints,
  projectCityWorldPoint,
  type CityWorldScene,
  type VoxelNote,
  type VoxelScene,
  type VoxelSticker,
  type VoxelStickerKind,
} from "@atlas/core/voxel";
import type { CityWorldRendererHandle } from "./CityWorldRenderer";
import { HostedClawdTray } from "./HostedClawdTray";
import { MapChrome, readRequestedCameraPreset, readRequestedDebugMode } from "./MapChrome";
import { PreviewPanel } from "./PreviewPanel";
import type { HostedClawdContext } from "./types";

const CityWorldRenderer = lazy(async () => {
  const module = await import("./CityWorldRenderer");
  return { default: module.CityWorldRenderer };
});

export type CityWorldViewProps = {
  scene: VoxelScene;
  generatedScene?: CityWorldScene | null;
  selectedDistrictId?: string | undefined;
  selectedPlaceId?: string | undefined;
  stickers?: VoxelSticker[];
  notes?: VoxelNote[];
  stickerMode?: VoxelStickerKind;
  noteDraft?: string;
  scoutPreview?: ScoutPreviewState | null;
  campaignPreview?: CampaignPreviewState | null;
  hostedClawdContext?: HostedClawdContext | null;
  hostedClawdOpen?: boolean;
  hostedClawdActionMessage?: string | undefined;
  onAdvancePreview?: () => void;
  onOpenHostedClawd?: () => void;
  onCloseHostedClawd?: () => void;
  onHostedClawdPrimaryAction?: () => void;
  onExitGeneratedPreview?: () => void;
  countySwitcher?: ReactNode;
  onSelectPlace: (placeId: string) => void;
  onSelectStickerMode: (kind: VoxelStickerKind) => void;
  onPlaceSticker: (placeId: string, kind: VoxelStickerKind) => void;
  onNoteDraftChange: (value: string) => void;
  onSaveNote: (placeId: string, body: string) => void;
};

const STICKER_ORDER: VoxelStickerKind[] = ["favorite", "home", "shop", "park", "idea", "question"];

export function CityWorldView({
  scene,
  generatedScene = null,
  selectedDistrictId,
  selectedPlaceId,
  stickers = [],
  notes = [],
  stickerMode = "favorite",
  noteDraft = "",
  scoutPreview = null,
  campaignPreview = null,
  hostedClawdContext = null,
  hostedClawdOpen = false,
  hostedClawdActionMessage,
  onAdvancePreview,
  onOpenHostedClawd,
  onCloseHostedClawd,
  onHostedClawdPrimaryAction,
  onExitGeneratedPreview,
  countySwitcher,
  onSelectPlace,
  onSelectStickerMode,
  onPlaceSticker,
  onNoteDraftChange,
  onSaveNote,
}: CityWorldViewProps) {
  const isGeneratedMode = Boolean(generatedScene);
  const hasPreview = !isGeneratedMode && Boolean(scoutPreview || campaignPreview);
  const hasHostedClawdTray = !isGeneratedMode && hostedClawdOpen && Boolean(hostedClawdContext);
  const rendererRef = useRef<CityWorldRendererHandle | null>(null);
  const cityScene = useMemo<CityWorldScene>(
    () => {
      if (generatedScene) return generatedScene;
      return compileCityWorldScene(scene, {
        selectedDistrictId,
        selectedPlaceId,
        stickers,
        notes,
      });
    },
    [generatedScene, notes, scene, selectedDistrictId, selectedPlaceId, stickers],
  );
  // 0.57E parity — resolve selection against places that exist in THIS scene:
  // in generated mode the widget-state place id belongs to the county scene,
  // and falling through to places[0] selected a many-building home_area that
  // ringed every house on first paint. The authored HUD default (the landmark)
  // is the scene's own first-paint choice.
  const requestedPlace = cityScene.places.find((place) => place.id === selectedPlaceId);
  const hudDefaultPlace = cityScene.places.find((place) => place.id === cityScene.hudDefaults.selectedPlaceId);
  const activePlace = requestedPlace ?? hudDefaultPlace ?? cityScene.places[0];
  const placePins = activePlace ? cityScene.pins.filter((pin) => pin.placeId === activePlace.id) : [];
  const worldStickers = scene.world?.stickers ?? [];
  const worldNotes = scene.world?.notes ?? [];
  const stickerCount = stickers.length + worldStickers.length;
  const noteCount = notes.length + worldNotes.length;
  const placeNotes = activePlace ? [...worldNotes, ...notes].filter((note) => note.placeId === activePlace.id) : [];
  const latestPlaceNote = placeNotes[placeNotes.length - 1];
  const activePlacePulse = activePlace ? `${Math.round(activePlace.activity * 100)}% active` : "Pick a place";
  const latestNoteBody = latestPlaceNote?.body ?? "";
  const cameraPresetId = readRequestedCameraPreset(cityScene);
  const debugMode = readRequestedDebugMode();

  useEffect(() => {
    const openaiWindow = window as Window & {
      openai?: { requestDisplayMode?: (payload: { mode: "inline" | "pip" | "fullscreen" }) => Promise<unknown> };
    };
    void openaiWindow.openai?.requestDisplayMode?.({ mode: "fullscreen" }).catch(() => undefined);
  }, []);

  const saveNote = () => {
    if (!activePlace || !noteDraft.trim()) return;
    onSaveNote(activePlace.id, noteDraft);
  };

  const dropSticker = () => {
    if (!activePlace) return;
    onSelectStickerMode(stickerMode);
    onPlaceSticker(activePlace.id, stickerMode);
  };

  return (
    <main
      className={hasPreview ? "city-world-shell has-preview" : hasHostedClawdTray ? "city-world-shell has-save-sheet" : "city-world-shell"}
      data-qa="alpha-city-world"
      data-qa-selected-place={activePlace?.id ?? ""}
      data-qa-pin-count={stickerCount}
      data-qa-note-count={noteCount}
      data-qa-latest-note={latestNoteBody}
      data-qa-session-boundary="session-only"
      data-qa-camera-preset={cameraPresetId ?? ""}
      data-qa-generated={isGeneratedMode ? "true" : undefined}
    >
      <Suspense fallback={<CityWorldSceneFallback scene={cityScene} selectedPlaceId={activePlace?.id} />}>
        <CityWorldRenderer
          ref={rendererRef}
          scene={cityScene}
          selectedPlaceId={activePlace?.id}
          cameraPresetId={cameraPresetId}
          debugMode={debugMode}
          suppressPlaceLabels={isGeneratedMode}
          onSelectPlace={isGeneratedMode ? () => undefined : onSelectPlace}
        />
      </Suspense>

      {isGeneratedMode ? (
        <div className="city-world-generated-boundary" data-qa="generated-boundary">
          <div>
            <span>GENERATED PREVIEW</span>
            <strong>Generated district. Not real coverage. Nothing is saved.</strong>
          </div>
          <button type="button" data-qa="exit-generated" onClick={onExitGeneratedPreview}>
            Exit preview
          </button>
        </div>
      ) : (
        <div className="city-world-left-rail">
          <div className="city-world-location" aria-label="Current city map" data-qa="current-city-map">
            <span>{cityScene.region.county}</span>
            <strong>{cityScene.region.district.replace(" City Slice", "")}</strong>
          </div>
          {countySwitcher}
        </div>
      )}

      <MapChrome rendererRef={rendererRef} />

      {!hasPreview && !hasHostedClawdTray && !isGeneratedMode ? (
      <div className="city-world-stickers" aria-label="Sticker tools" data-qa="sticker-tools" data-qa-sticker-mode={stickerMode}>
        {STICKER_ORDER.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-label={`Use ${stickerLabel(kind)} sticker`}
            aria-pressed={kind === stickerMode}
            data-qa={`sticker-mode-${kind}`}
            className={kind === stickerMode ? "is-active" : ""}
            onClick={() => onSelectStickerMode(kind)}
          >
            <span aria-hidden="true">
              <StickerGlyph kind={kind} />
            </span>
          </button>
        ))}
        <button
          type="button"
          aria-label="Drop sticker on selected place"
          className="city-world-drop"
          data-qa="drop-sticker-button"
          disabled={!activePlace}
          onClick={dropSticker}
        >
          <PinIcon />
          <span>Pin</span>
        </button>
      </div>
      ) : null}

      {hasHostedClawdTray && hostedClawdContext && onCloseHostedClawd && onHostedClawdPrimaryAction ? (
        <HostedClawdTray
          context={hostedClawdContext}
          actionMessage={hostedClawdActionMessage}
          onClose={onCloseHostedClawd}
          onPrimaryAction={onHostedClawdPrimaryAction}
        />
      ) : hasPreview ? (
        <PreviewPanel scoutPreview={scoutPreview} campaignPreview={campaignPreview} {...(onAdvancePreview ? { onAdvance: onAdvancePreview } : {})} />
      ) : !isGeneratedMode ? (
      <section
        className="city-world-tray"
        aria-label="Selected place"
        data-qa="selected-place-tray"
        data-qa-selected-place={activePlace?.id ?? ""}
        data-qa-selected-place-label={activePlace?.label ?? ""}
        data-qa-pin-count={stickerCount}
        data-qa-note-count={noteCount}
        data-qa-latest-note={latestNoteBody}
      >
        <div className="city-world-tray-head">
          <div className="city-world-place-copy">
            <span className="city-world-place-type">{activePlace ? placeKindLabel(activePlace.kind) : "Place"}</span>
            <strong data-qa="selected-place-label">{activePlace?.label ?? "Pick a place"}</strong>
            <p>{activePlace?.description ?? "Drag around the map and click a place."}</p>
          </div>
          <span className="city-world-place-pulse">{activePlacePulse}</span>
        </div>
        <div className="city-world-tray-meta" aria-label="Map collection">
          <span data-qa="pin-count">
            <b>{stickerCount}</b> pins
          </span>
          <span data-qa="note-count">
            <b>{noteCount}</b> notes
          </span>
          <span data-qa="selected-place-pin-count">
            <b>{placePins.length}</b> here
          </span>
        </div>
        <div className="city-world-session-boundary" data-qa="session-only-boundary">
          Pins and notes stay in this chat.
        </div>
        {hostedClawdContext && onOpenHostedClawd ? (
          <button type="button" className="city-world-hosted-clawd-open" data-qa="hosted-clawd-open" onClick={onOpenHostedClawd}>
            Save with ChatGPT
            <span>{hostedClawdContext.sessionBoundary}</span>
          </button>
        ) : null}
        {latestPlaceNote ? (
          <div className="city-world-latest-note" data-qa="latest-note">
            {latestPlaceNote.body}
          </div>
        ) : null}
        <div className="city-world-note">
          <input
            value={noteDraft}
            maxLength={160}
            disabled={!activePlace}
            data-qa="note-input"
            onChange={(event) => onNoteDraftChange(event.currentTarget.value)}
            placeholder={activePlace ? `Add note for ${activePlace.label}` : "Select a place"}
          />
          <button type="button" aria-label="Save note" data-qa="save-note-button" disabled={!activePlace || !noteDraft.trim()} onClick={saveNote}>
            Save
          </button>
        </div>
        {placePins.length > 0 ? (
          <div className="city-world-pin-row" aria-label="Pins on selected place" data-qa="selected-place-pins">
            {placePins.slice(-4).map((pin) => (
              <span key={pin.id}>{pin.kind === "note" ? "N" : <StickerGlyph kind={pin.kind} />}</span>
            ))}
          </div>
        ) : null}
      </section>
      ) : null}
    </main>
  );
}

function PinIcon() {
  return (
    <svg className="city-world-pin-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3.5c-2.7 0-4.8 2-4.8 4.6 0 3.4 4.8 8.4 4.8 8.4s4.8-5 4.8-8.4c0-2.6-2.1-4.6-4.8-4.6Z" />
      <circle cx="10" cy="8.1" r="1.6" />
    </svg>
  );
}

function CityWorldSceneFallback({ scene, selectedPlaceId }: { scene: CityWorldScene; selectedPlaceId?: string | undefined }) {
  const terrainTiles = scene.terrainTiles.slice(0, 260);
  const lots = scene.lots.slice(0, 80);
  const projected = [
    ...terrainTiles.map((tile) => projectCityWorldPoint(tile.position)),
    ...lots.map((lot) => projectCityWorldPoint(lot.position)),
    ...scene.places.map((place) => projectCityWorldPoint(place.anchor)),
  ];
  const bounds = projected.reduce(
    (box, point) => ({
      minX: Math.min(box.minX, point.x),
      minY: Math.min(box.minY, point.y),
      maxX: Math.max(box.maxX, point.x),
      maxY: Math.max(box.maxY, point.y),
    }),
    { minX: 0, minY: 0, maxX: 1, maxY: 1 },
  );
  const pad = 96;
  const viewBox = `${bounds.minX - pad} ${bounds.minY - pad} ${Math.max(320, bounds.maxX - bounds.minX + pad * 2)} ${Math.max(260, bounds.maxY - bounds.minY + pad * 2)}`;

  return (
    <svg
      className="city-world-renderer city-world-renderer-fallback"
      viewBox={viewBox}
      role="img"
      aria-label={`${scene.region.district} voxel city map loading`}
      data-qa="city-world-renderer-fallback"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect className="city-world-renderer-fallback-bg" x={bounds.minX - pad} y={bounds.minY - pad} width={bounds.maxX - bounds.minX + pad * 2} height={bounds.maxY - bounds.minY + pad * 2} />
      <g>
        {terrainTiles.map((tile) => {
          const point = projectCityWorldPoint(tile.position);
          return (
            <polygon
              key={tile.id}
              className={`city-world-renderer-fallback-tile terrain-${tile.kind}`}
              points={cityWorldDiamondPoints(point, tile.width * CITY_WORLD_TILE_BASIS.tileWidth, tile.depth * CITY_WORLD_TILE_BASIS.tileHeight).join(" ")}
            />
          );
        })}
      </g>
      <g>
        {lots.map((lot) => {
          const point = projectCityWorldPoint(lot.position);
          return (
            <polygon
              key={lot.id}
              className={`city-world-renderer-fallback-lot lot-${lot.kind}`}
              points={cityWorldDiamondPoints(point, lot.width * CITY_WORLD_TILE_BASIS.tileWidth, lot.depth * CITY_WORLD_TILE_BASIS.tileHeight).join(" ")}
            />
          );
        })}
      </g>
      <g>
        {scene.places.map((place) => {
          const point = projectCityWorldPoint(place.anchor);
          const selected = place.id === selectedPlaceId;
          return <circle key={place.id} className={selected ? "city-world-renderer-fallback-place is-selected" : "city-world-renderer-fallback-place"} cx={point.x} cy={point.y} r={selected ? 13 : 9} />;
        })}
      </g>
    </svg>
  );
}

/**
 * Six stroke-SVG sticker glyphs in the city-world-icon language:
 * house, heart, tag, tree, bolt, question.
 */
function StickerGlyph({ kind }: { kind: VoxelStickerKind }) {
  switch (kind) {
    case "home":
      return (
        <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 9.5 10 4.5l6 5" />
          <path d="M5.8 8.4v7.1h8.4V8.4" />
        </svg>
      );
    case "favorite":
      return (
        <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 15.6S4.6 12 4.6 8.5C4.6 6.6 6 5.1 7.8 5.1c.9 0 1.7.4 2.2 1.1.5-.7 1.3-1.1 2.2-1.1 1.8 0 3.2 1.5 3.2 3.4 0 3.5-5.4 7.1-5.4 7.1Z" />
        </svg>
      );
    case "shop":
      return (
        <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4.5 4.5h5.2l5.8 5.8-5.2 5.2-5.8-5.8V4.5Z" />
          <circle cx="7.7" cy="7.7" r="1.1" />
        </svg>
      );
    case "park":
      return (
        <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 3.8 5.6 9.8h1.9L4.8 13.4h10.4L12.5 9.8h1.9L10 3.8Z" />
          <path d="M10 13.4v2.8" />
        </svg>
      );
    case "idea":
      return (
        <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M11.2 3.6 5.6 11h3.6l-1 5.4L13.9 9h-3.5l.8-5.4Z" />
        </svg>
      );
    case "question":
      return (
        <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M7.3 7.3c.2-1.6 1.3-2.7 2.8-2.7 1.6 0 2.8 1.1 2.8 2.6 0 2-2.7 2.2-2.7 4.2" />
          <path d="M10.2 14.5v.3" />
        </svg>
      );
  }
}

function stickerLabel(kind: VoxelStickerKind): string {
  const labels: Record<VoxelStickerKind, string> = {
    home: "Home",
    shop: "Shop",
    park: "Park",
    favorite: "Favorite",
    idea: "Idea",
    question: "Question",
  };
  return labels[kind];
}

function placeKindLabel(kind: CityWorldScene["places"][number]["kind"]): string {
  const labels: Record<CityWorldScene["places"][number]["kind"], string> = {
    home_area: "Home area",
    shop: "Shop",
    plaza: "Plaza",
    park: "Park",
    road: "Road",
    landmark: "Landmark",
  };
  return labels[kind];
}
