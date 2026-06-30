import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createVoxelNote,
  createVoxelSticker,
  riversideDemoVoxelScene,
  type VoxelNote,
  type VoxelSticker,
  type VoxelStickerKind,
} from "@atlas/core/voxel";
import { CityWorldView } from "./CityWorldView";
import "./styles.css";

function WidgetShell() {
  const [selectedDistrictId, setSelectedDistrictId] = useState(riversideDemoVoxelScene.world?.selectedDistrictId);
  const [selectedPlaceId, setSelectedPlaceId] = useState(riversideDemoVoxelScene.world?.places[0]?.id);
  const [selectedNodeId, setSelectedNodeId] = useState(riversideDemoVoxelScene.world?.places[0]?.nodeId ?? riversideDemoVoxelScene.selectedNodeId);
  const [stickerMode, setStickerMode] = useState<VoxelStickerKind>("favorite");
  const [stickers, setStickers] = useState<VoxelSticker[]>([]);
  const [notes, setNotes] = useState<VoxelNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const selectedPlace = useMemo(() => {
    return riversideDemoVoxelScene.world?.places.find((place) => place.id === selectedPlaceId);
  }, [selectedPlaceId]);

  const selectDistrict = (districtId: string) => {
    const firstPlace = riversideDemoVoxelScene.world?.places.find((place) => place.districtId === districtId);
    setSelectedDistrictId(districtId);
    setSelectedPlaceId(firstPlace?.id);
    setSelectedNodeId(firstPlace?.nodeId ?? selectedNodeId);
    setNoteDraft("");
  };

  const selectPlace = (placeId: string) => {
    const place = riversideDemoVoxelScene.world?.places.find((item) => item.id === placeId);
    setSelectedPlaceId(placeId);
    setSelectedDistrictId(place?.districtId ?? selectedDistrictId);
    setSelectedNodeId(place?.nodeId ?? selectedNodeId);
    setNoteDraft("");
  };

  const placeSticker = (placeId: string, kind: VoxelStickerKind) => {
    setStickerMode(kind);
    setStickers((current) => [
      ...current,
      uniqueSticker(createVoxelSticker(riversideDemoVoxelScene, { placeId, kind, label: stickerLabel(kind) }), current.length + 1),
    ]);
  };

  const saveNote = (placeId: string, body: string) => {
    setNotes((current) => [...current, uniqueNote(createVoxelNote(riversideDemoVoxelScene, { placeId, body }), current.length + 1)]);
    setNoteDraft("");
  };

  return (
    <CityWorldView
      scene={riversideDemoVoxelScene}
      selectedDistrictId={selectedDistrictId}
      selectedPlaceId={selectedPlaceId}
      stickers={stickers}
      notes={notes}
      stickerMode={stickerMode}
      noteDraft={noteDraft}
      onSelectPlace={selectPlace}
      onSelectStickerMode={setStickerMode}
      onPlaceSticker={placeSticker}
      onNoteDraftChange={setNoteDraft}
      onSaveNote={saveNote}
    />
  );
}

function uniqueSticker(sticker: VoxelSticker, count: number): VoxelSticker {
  return { ...sticker, id: `${sticker.id}-${count}` };
}

function uniqueNote(note: VoxelNote, count: number): VoxelNote {
  return { ...note, id: `${note.id}-${count}` };
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

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element.");
}

createRoot(root).render(<WidgetShell />);
