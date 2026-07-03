import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  compileCityWorldScene,
  type CityWorldScene,
  type VoxelNote,
  type VoxelScene,
  type VoxelSticker,
  type VoxelStickerKind,
} from "@atlas/core/voxel";
import { CityWorldRenderer, type CityWorldRendererHandle } from "./CityWorldRenderer";

export type CityWorldViewProps = {
  scene: VoxelScene;
  selectedDistrictId?: string | undefined;
  selectedPlaceId?: string | undefined;
  stickers?: VoxelSticker[];
  notes?: VoxelNote[];
  stickerMode?: VoxelStickerKind;
  noteDraft?: string;
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
  selectedDistrictId,
  selectedPlaceId,
  stickers = [],
  notes = [],
  stickerMode = "favorite",
  noteDraft = "",
  countySwitcher,
  onSelectPlace,
  onSelectStickerMode,
  onPlaceSticker,
  onNoteDraftChange,
  onSaveNote,
}: CityWorldViewProps) {
  const rendererRef = useRef<CityWorldRendererHandle | null>(null);
  const cityScene = useMemo<CityWorldScene>(
    () =>
      compileCityWorldScene(scene, {
        selectedDistrictId,
        selectedPlaceId,
        stickers,
        notes,
      }),
    [notes, scene, selectedDistrictId, selectedPlaceId, stickers],
  );
  const activePlaceId = selectedPlaceId ?? cityScene.hudDefaults.selectedPlaceId;
  const activePlace = cityScene.places.find((place) => place.id === activePlaceId) ?? cityScene.places[0];
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
      className="city-world-shell"
      data-qa="alpha-city-world"
      data-qa-selected-place={activePlace?.id ?? ""}
      data-qa-pin-count={stickerCount}
      data-qa-note-count={noteCount}
      data-qa-latest-note={latestNoteBody}
      data-qa-session-boundary="session-only"
      data-qa-camera-preset={cameraPresetId ?? ""}
    >
      <CityWorldRenderer ref={rendererRef} scene={cityScene} selectedPlaceId={activePlace?.id} cameraPresetId={cameraPresetId} debugMode={debugMode} onSelectPlace={onSelectPlace} />

      <div className="city-world-location" aria-label="Current city map" data-qa="current-city-map">
        <span>{cityScene.region.county}</span>
        <strong>{cityScene.region.district.replace(" City Slice", "")}</strong>
      </div>

      {countySwitcher}

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
            <span aria-hidden="true">{stickerGlyph(kind)}</span>
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
              <span key={pin.id}>{pin.kind === "note" ? "N" : stickerGlyph(pin.kind)}</span>
            ))}
          </div>
        ) : null}
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

function PinIcon() {
  return (
    <svg className="city-world-pin-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3.5c-2.7 0-4.8 2-4.8 4.6 0 3.4 4.8 8.4 4.8 8.4s4.8-5 4.8-8.4c0-2.6-2.1-4.6-4.8-4.6Z" />
      <circle cx="10" cy="8.1" r="1.6" />
    </svg>
  );
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
