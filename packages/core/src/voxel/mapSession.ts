import type { VoxelNote, VoxelScene, VoxelSticker, VoxelStickerKind, VoxelWorld } from "./types.js";

export type VoxelMapSession = {
  sceneId: string;
  selectedPlaceId?: string;
  stickers: VoxelSticker[];
  notes: VoxelNote[];
};

export type CreateVoxelStickerInput = {
  placeId: string;
  kind: VoxelStickerKind;
  label?: string;
};

export type CreateVoxelNoteInput = {
  placeId: string;
  body: string;
  stickerId?: string;
};

export function validateVoxelWorld(scene: VoxelScene): VoxelWorld {
  const world = scene.world;
  if (!world) {
    throw new Error(`VoxelScene ${scene.id} is missing world metadata.`);
  }

  const worldNodeIds = new Set(world.nodes.map((node) => node.id));
  const districtIds = new Set(world.districts.map((district) => district.id));
  const sceneNodeIds = new Set(scene.nodes.map((node) => node.id));

  if (!worldNodeIds.has("us")) {
    throw new Error("Voxel world must include the architectural USA root node.");
  }

  if (!districtIds.has(world.selectedDistrictId)) {
    throw new Error(`Selected district ${world.selectedDistrictId} does not exist.`);
  }

  for (const district of world.districts) {
    if (!worldNodeIds.has(district.worldNodeId)) {
      throw new Error(`District ${district.id} references missing world node ${district.worldNodeId}.`);
    }
    for (const nodeId of district.focusNodeIds) {
      if (!sceneNodeIds.has(nodeId)) {
        throw new Error(`District ${district.id} references missing scene node ${nodeId}.`);
      }
    }
  }

  for (const place of world.places) {
    if (!districtIds.has(place.districtId)) {
      throw new Error(`Place ${place.id} references missing district ${place.districtId}.`);
    }
    if (!sceneNodeIds.has(place.nodeId)) {
      throw new Error(`Place ${place.id} references missing scene node ${place.nodeId}.`);
    }
  }

  return world;
}

export function createVoxelSticker(scene: VoxelScene, input: CreateVoxelStickerInput): VoxelSticker {
  getKnownPlace(scene, input.placeId);
  const label = input.label?.trim() || stickerLabel(input.kind);
  return {
    id: `sticker-${input.placeId}-${slugify(input.kind)}-${slugify(label)}`,
    placeId: input.placeId,
    kind: input.kind,
    label,
  };
}

export function createVoxelNote(scene: VoxelScene, input: CreateVoxelNoteInput): VoxelNote {
  getKnownPlace(scene, input.placeId);
  const body = input.body.trim();
  if (!body) {
    throw new Error("Voxel note body cannot be empty.");
  }

  return {
    id: `note-${input.placeId}-${slugify(body).slice(0, 32)}`,
    placeId: input.placeId,
    body,
    ...(input.stickerId ? { stickerId: input.stickerId } : {}),
  };
}

export function serializeVoxelMapSession(scene: VoxelScene, session: Omit<VoxelMapSession, "sceneId">): string {
  const world = validateVoxelWorld(scene);
  const placeIds = new Set(world.places.map((place) => place.id));
  const stickerIds = new Set(session.stickers.map((sticker) => sticker.id));

  for (const sticker of session.stickers) {
    if (!placeIds.has(sticker.placeId)) {
      throw new Error(`Sticker ${sticker.id} references missing place ${sticker.placeId}.`);
    }
  }

  for (const note of session.notes) {
    if (!placeIds.has(note.placeId)) {
      throw new Error(`Note ${note.id} references missing place ${note.placeId}.`);
    }
    if (note.stickerId && !stickerIds.has(note.stickerId)) {
      throw new Error(`Note ${note.id} references missing sticker ${note.stickerId}.`);
    }
  }

  return JSON.stringify({
    scope: "session",
    sceneId: scene.id,
    selectedDistrictId: world.selectedDistrictId,
    selectedPlaceId: session.selectedPlaceId,
    stickers: session.stickers,
    notes: session.notes,
  });
}

function getKnownPlace(scene: VoxelScene, placeId: string) {
  const world = validateVoxelWorld(scene);
  const place = world.places.find((item) => item.id === placeId);
  if (!place) {
    throw new Error(`Unknown voxel place ${placeId}.`);
  }
  return place;
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
