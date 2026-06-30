import type { VoxelNote, VoxelSticker, VoxelStickerKind } from "@atlas/core/voxel";

export type ToolResult<T> = {
  structuredContent?: T;
  content?: unknown[];
  _meta?: Record<string, unknown>;
} | null;

export type WidgetState = {
  selectedNodeId: string;
  compact: boolean;
  activeSceneId?: string | undefined;
  scoutPreviewId?: string | undefined;
  activeStepId?: "county" | "district" | "place" | "collect" | "drop" | "report" | "campaign" | undefined;
  selectedDistrictId?: string | undefined;
  selectedPlaceId?: string | undefined;
  stickerMode?: VoxelStickerKind | undefined;
  stickers?: VoxelSticker[] | undefined;
  notes?: VoxelNote[] | undefined;
  noteDraft?: string | undefined;
};

declare global {
  interface Window {
    openai?: {
      widgetState?: unknown;
      setWidgetState?: (state: unknown) => void;
      requestDisplayMode?: (payload: { mode: "inline" | "pip" | "fullscreen" }) => Promise<unknown>;
    };
  }
}
