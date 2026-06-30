import { useMemo, type KeyboardEvent } from "react";
import type {
  VoxelFlowStep,
  VoxelNote,
  VoxelPlace,
  VoxelPoint,
  VoxelScene,
  VoxelSticker,
  VoxelStickerKind,
  VoxelTile,
} from "@atlas/core/voxel";
import { PixiVoxelSceneView } from "./PixiVoxelSceneView";

export type VoxelSceneViewProps = {
  scene: VoxelScene;
  selectedNodeId: string;
  activeStepId?: VoxelFlowStep["id"] | undefined;
  contextTitle?: string | undefined;
  compact?: boolean | undefined;
  selectedDistrictId?: string | undefined;
  selectedPlaceId?: string | undefined;
  stickers?: VoxelSticker[] | undefined;
  notes?: VoxelNote[] | undefined;
  stickerMode?: VoxelStickerKind | undefined;
  noteDraft?: string | undefined;
  onSelectNode: (nodeId: string) => void;
  onSelectDistrict?: ((districtId: string) => void) | undefined;
  onSelectPlace?: ((placeId: string) => void) | undefined;
  onSelectStickerMode?: ((kind: VoxelStickerKind) => void) | undefined;
  onPlaceSticker?: ((placeId: string, kind: VoxelStickerKind) => void) | undefined;
  onNoteDraftChange?: ((value: string) => void) | undefined;
  onSaveNote?: ((placeId: string, body: string) => void) | undefined;
  onAskCampaign?: (() => void) | undefined;
};

type ProjectedPoint = {
  x: number;
  y: number;
};

const STICKER_KINDS: VoxelStickerKind[] = ["home", "shop", "park", "favorite", "idea", "question"];

export function VoxelSceneView({
  scene,
  selectedNodeId,
  activeStepId,
  compact = false,
  selectedDistrictId,
  selectedPlaceId,
  stickers = [],
  notes = [],
  stickerMode = "favorite",
  noteDraft = "",
  onSelectNode,
  onSelectDistrict,
  onSelectPlace,
  onSelectStickerMode,
  onPlaceSticker,
  onNoteDraftChange,
  onSaveNote,
}: VoxelSceneViewProps) {
  const nodeById = useMemo(() => new Map(scene.nodes.map((node) => [node.id, node])), [scene.nodes]);
  const world = scene.world;
  const worldStickers = world?.stickers ?? [];
  const worldNotes = world?.notes ?? [];
  const sessionStickers = [...worldStickers, ...stickers];
  const sessionNotes = [...worldNotes, ...notes];
  const activeDistrictId = selectedDistrictId ?? world?.selectedDistrictId;
  const activeDistrict = world?.districts.find((district) => district.id === activeDistrictId) ?? world?.districts[0];
  const places = activeDistrict ? world?.places.filter((place) => place.districtId === activeDistrict.id) ?? [] : world?.places ?? [];
  const selectedPlace =
    places.find((place) => place.id === selectedPlaceId) ??
    world?.places.find((place) => place.nodeId === selectedNodeId) ??
    places[0] ??
    world?.places[0];
  const selectedNode = selectedPlace ? nodeById.get(selectedPlace.nodeId) : nodeById.get(selectedNodeId) ?? scene.nodes[0];
  const placeStickers = selectedPlace ? sessionStickers.filter((sticker) => sticker.placeId === selectedPlace.id) : [];
  const placeNotes = selectedPlace ? sessionNotes.filter((note) => note.placeId === selectedPlace.id) : [];
  const collectedPlaceIds = new Set(sessionStickers.map((sticker) => sticker.placeId));
  const collectedCount = collectedPlaceIds.size;
  const ambient = world?.ambient;

  const handlePlaceKeyDown = (event: KeyboardEvent<SVGGElement>, place: VoxelPlace) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectPlace?.(place.id);
      onSelectNode(place.nodeId);
    }
  };

  const saveNote = () => {
    if (!selectedPlace || !noteDraft.trim()) return;
    onSaveNote?.(selectedPlace.id, noteDraft);
  };

  return (
    <main className={compact ? "voxel-shell voxel-shell-map-only is-compact" : "voxel-shell voxel-shell-map-only"}>
      <section className="voxel-map-only-stage" aria-label={`${scene.county.name} voxel city map`}>
        <PixiVoxelSceneView
          scene={scene}
          selectedNodeId={selectedNode?.id ?? selectedNodeId}
          {...(activeStepId ? { activeStepId } : {})}
          compact={compact}
          selectedDistrictId={activeDistrict?.id}
          selectedPlaceId={selectedPlace?.id}
          stickers={sessionStickers}
          notes={sessionNotes}
          stickerMode={stickerMode}
          onSelectNode={onSelectNode}
          onSelectPlace={onSelectPlace}
          fallback={
            <svg
              className="voxel-map"
              viewBox={`0 0 ${scene.viewport.width} ${scene.viewport.height}`}
              role="img"
              aria-label={`${scene.county.name} cozy voxel district map`}
            >
              <rect className="voxel-map-bg" width={scene.viewport.width} height={scene.viewport.height} rx="0" />
              <g className="voxel-tiles">
                {scene.tiles.map((tile) => (
                  <TileShape key={tile.id} scene={scene} tile={tile} />
                ))}
              </g>
              <g className="voxel-places">
                {places.map((place) => {
                  const point = project(scene, place.position);
                  const selected = place.id === selectedPlace?.id;
                  return (
                    <g
                      key={place.id}
                      role="button"
                      tabIndex={0}
                      className={selected ? "voxel-place is-selected" : "voxel-place"}
                      transform={`translate(${point.x} ${point.y})`}
                      onClick={() => {
                        onSelectPlace?.(place.id);
                        onSelectNode(place.nodeId);
                      }}
                      onKeyDown={(event) => handlePlaceKeyDown(event, place)}
                    >
                      <circle className={`voxel-place-dot voxel-place-${place.kind}`} r={selected ? 15 : 11} />
                      <text y="31" textAnchor="middle">{place.label}</text>
                    </g>
                  );
                })}
              </g>
              <g className="voxel-stickers">
                {sessionStickers.map((sticker) => {
                  const place = world?.places.find((item) => item.id === sticker.placeId);
                  if (!place) return null;
                  const point = project(scene, place.position);
                  return (
                    <g key={sticker.id} className={`voxel-sticker voxel-sticker-${sticker.kind}`} transform={`translate(${point.x + 18} ${point.y - 28})`}>
                      <circle r="12" />
                      <text y="4" textAnchor="middle">{stickerGlyph(sticker.kind)}</text>
                    </g>
                  );
                })}
              </g>
            </svg>
          }
        />

        <div className="voxel-map-location-hud" aria-label="Current map">
          <strong>{scene.county.name}</strong>
          <span>{activeDistrict?.label ?? scene.county.state}</span>
        </div>

        {world ? (
          <div className="voxel-map-district-dots" aria-label="Districts">
            {world.districts.map((district) => (
              <button
                key={district.id}
                type="button"
                className={district.id === activeDistrict?.id ? "is-active" : ""}
                onClick={() => onSelectDistrict?.(district.id)}
              >
                <span>{district.playable ? "Open" : "Soon"}</span>
                {district.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="voxel-map-sticker-strip" aria-label="Sticker shelf">
          {STICKER_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              title={stickerLabel(kind)}
              className={kind === stickerMode ? "is-active" : ""}
              disabled={!selectedPlace}
              onClick={() => {
                onSelectStickerMode?.(kind);
                if (selectedPlace) onPlaceSticker?.(selectedPlace.id, kind);
              }}
            >
              <span>{stickerGlyph(kind)}</span>
            </button>
          ))}
        </div>

        <div className="voxel-map-place-tray" aria-label="Selected place">
          <div className="voxel-place-tray-copy">
            <span>{selectedPlace ? placeKindLabel(selectedPlace.kind) : "City map"} / {ambient ? ambient.timeOfDay : scene.county.state}</span>
            <strong>{selectedPlace?.label ?? "Pick a place"}</strong>
            <p>{selectedPlace?.description ?? activeDistrict?.summary ?? "Drag around the city and click a place."}</p>
          </div>
          <div className="voxel-place-tray-stats" aria-label="Map collection">
            <span>{collectedCount} stickers</span>
            <span>{sessionNotes.length} notes</span>
            <span>{selectedPlace ? `${Math.round(selectedPlace.activity * 100)}% active` : "city live"}</span>
          </div>
          <div className="voxel-map-note-row">
            <input
              value={noteDraft}
              maxLength={160}
              disabled={!selectedPlace}
              onChange={(event) => onNoteDraftChange?.(event.currentTarget.value)}
              placeholder={selectedPlace ? `Note for ${selectedPlace.label}` : "Select a place"}
            />
            <button type="button" disabled={!selectedPlace || !noteDraft.trim()} onClick={saveNote}>
              Save
            </button>
          </div>
          {placeStickers.length || placeNotes.length ? (
            <div className="voxel-place-tray-history">
              {placeStickers.map((sticker) => (
                <span key={sticker.id}>{stickerGlyph(sticker.kind)} {sticker.label}</span>
              ))}
              {placeNotes.slice(-1).map((note) => (
                <span key={note.id}>{note.body}</span>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function resolveFlow(flow: VoxelFlowStep[], activeStepId: VoxelFlowStep["id"] | undefined): VoxelFlowStep[] {
  const mapFlow: VoxelFlowStep[] = [
    { id: "county", label: "County hub", status: "active" },
    { id: "district", label: "District", status: "next" },
    { id: "place", label: "Place", status: "next" },
    { id: "collect", label: "Collect", status: "next" },
  ];
  const active =
    activeStepId === "drop" ? "district" : activeStepId === "report" ? "place" : activeStepId === "campaign" ? "collect" : activeStepId;
  if (!active) return mapFlow;

  const activeIndex = mapFlow.findIndex((step) => step.id === active);
  if (activeIndex < 0) return mapFlow;

  return mapFlow.map((step, index) => ({
    ...step,
    status: index < activeIndex ? "done" : index === activeIndex ? "active" : "next",
  }));
}

function TileShape({ scene, tile }: { scene: VoxelScene; tile: VoxelTile }) {
  const point = project(scene, tile.position);
  const top = diamondPoints(point, scene.viewport.tileWidth, scene.viewport.tileHeight);
  const left = sidePoints(point, scene.viewport.tileWidth, scene.viewport.tileHeight, scene.viewport.tileDepth + tile.elevation * 2, "left");
  const right = sidePoints(point, scene.viewport.tileWidth, scene.viewport.tileHeight, scene.viewport.tileDepth + tile.elevation * 2, "right");

  return (
    <g className={`voxel-tile voxel-tile-${tile.kind}`}>
      <polygon className="voxel-tile-side voxel-tile-left" points={left} />
      <polygon className="voxel-tile-side voxel-tile-right" points={right} />
      <polygon className="voxel-tile-top" points={top} />
    </g>
  );
}

function project(scene: VoxelScene, point: VoxelPoint): ProjectedPoint {
  return {
    x: scene.viewport.originX + (point.x - point.y) * (scene.viewport.tileWidth / 2),
    y: scene.viewport.originY + (point.x + point.y) * (scene.viewport.tileHeight / 2) - point.z * scene.viewport.tileDepth,
  };
}

function diamondPoints(center: ProjectedPoint, width: number, height: number): string {
  return [
    `${center.x},${center.y - height / 2}`,
    `${center.x + width / 2},${center.y}`,
    `${center.x},${center.y + height / 2}`,
    `${center.x - width / 2},${center.y}`,
  ].join(" ");
}

function sidePoints(center: ProjectedPoint, width: number, height: number, depth: number, side: "left" | "right"): string {
  if (side === "left") {
    return [
      `${center.x - width / 2},${center.y}`,
      `${center.x},${center.y + height / 2}`,
      `${center.x},${center.y + height / 2 + depth}`,
      `${center.x - width / 2},${center.y + depth}`,
    ].join(" ");
  }

  return [
    `${center.x + width / 2},${center.y}`,
    `${center.x},${center.y + height / 2}`,
    `${center.x},${center.y + height / 2 + depth}`,
    `${center.x + width / 2},${center.y + depth}`,
  ].join(" ");
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
    favorite: "Fav",
    idea: "Idea",
    question: "Ask",
  };
  return labels[kind];
}

function placeKindLabel(kind: VoxelPlace["kind"]): string {
  const labels: Record<VoxelPlace["kind"], string> = {
    home_area: "Home area",
    shop: "Shop",
    plaza: "Plaza",
    park: "Park",
    road: "Road",
    landmark: "Landmark",
  };
  return labels[kind];
}

function mapStepLabel(label: string): string {
  return label.replace(/drop/i, "District").replace(/report/i, "Place").replace(/campaign/i, "Collect");
}
