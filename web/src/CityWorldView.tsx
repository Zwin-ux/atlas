import { useEffect, useMemo, useRef } from "react";
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
    <main className="city-world-shell">
      <CityWorldRenderer ref={rendererRef} scene={cityScene} selectedPlaceId={activePlace?.id} onSelectPlace={onSelectPlace} />

      <div className="city-world-location" aria-label="Current city map">
        <span>{cityScene.region.county}</span>
        <strong>{cityScene.region.district.replace(" City Slice", "")}</strong>
      </div>

      <div className="city-world-zoom" aria-label="Map zoom controls">
        <button type="button" aria-label="Zoom in" onClick={() => rendererRef.current?.zoomIn()}>
          +
        </button>
        <button type="button" aria-label="Center map" onClick={() => rendererRef.current?.center()}>
          O
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => rendererRef.current?.zoomOut()}>
          -
        </button>
      </div>

      <div className="city-world-stickers" aria-label="Sticker tools">
        {STICKER_ORDER.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-label={`Use ${stickerLabel(kind)} sticker`}
            aria-pressed={kind === stickerMode}
            className={kind === stickerMode ? "is-active" : ""}
            onClick={() => onSelectStickerMode(kind)}
          >
            {stickerGlyph(kind)}
          </button>
        ))}
        <button type="button" aria-label="Drop sticker on selected place" className="city-world-drop" disabled={!activePlace} onClick={dropSticker}>
          PIN
        </button>
      </div>

      <section className="city-world-tray" aria-label="Selected place">
        <div>
          <span>{activePlace ? placeKindLabel(activePlace.kind) : "Place"}</span>
          <strong>{activePlace?.label ?? "Pick a place"}</strong>
          <p>{activePlace?.description ?? "Drag around the map and click a place."}</p>
        </div>
        <div className="city-world-tray-meta" aria-label="Map collection">
          <span>{stickerCount} stickers</span>
          <span>{noteCount} notes</span>
          <span>{activePlace ? `${Math.round(activePlace.activity * 100)}% active` : "live"}</span>
        </div>
        <div className="city-world-note">
          <input
            value={noteDraft}
            maxLength={160}
            disabled={!activePlace}
            onChange={(event) => onNoteDraftChange(event.currentTarget.value)}
            placeholder={activePlace ? `Note for ${activePlace.label}` : "Select a place"}
          />
          <button type="button" aria-label="Save note" disabled={!activePlace || !noteDraft.trim()} onClick={saveNote}>
            OK
          </button>
        </div>
        {placePins.length > 0 ? (
          <div className="city-world-pin-row">
            {placePins.slice(-4).map((pin) => (
              <span key={pin.id}>{pin.kind === "note" ? "N" : stickerGlyph(pin.kind)}</span>
            ))}
          </div>
        ) : null}
        {latestPlaceNote ? <div className="city-world-latest-note">{latestPlaceNote.body}</div> : null}
      </section>
    </main>
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
