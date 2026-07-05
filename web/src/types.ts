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
  hostedClawdOpen?: boolean | undefined;
  hostedClawdActionMessage?: string | undefined;
};

export type HostedClawdScreenState =
  | "waitlist"
  | "confirm_save"
  | "checkout_pending"
  | "activating"
  | "active"
  | "inactive_payment_failed";

export type HostedClawdActionKind =
  | "join_waitlist"
  | "create_hosted_clawd"
  | "continue_to_stripe"
  | "refresh_status"
  | "open_saved_campaign"
  | "open_billing_portal";

export type HostedClawdContext = {
  type: "hostedClawdContext";
  mode: "alpha_free" | "beta_invite" | "beta_paid";
  screenState: HostedClawdScreenState;
  trigger: "map_tray" | "scout_drop" | "campaign_preview" | "upgrade_tool";
  statusLabel: string;
  contextLabel: string;
  primaryCopy: string;
  secondaryCopy: string;
  sessionBoundary: string;
  paymentCopy: string;
  primaryAction: {
    kind: HostedClawdActionKind;
    label: string;
    enabled: boolean;
  };
  savePreview: Array<{
    label: string;
    value: string;
    status: "ready" | "needs_confirmation" | "planned";
  }>;
  flags: {
    persistenceEnabled: boolean;
    moneyEnabled: boolean;
    publicClaimEnabled: boolean;
  };
  gates: Array<{
    gate: "HUMAN_APPROVAL_BEFORE_PERSISTENCE" | "HUMAN_APPROVAL_BEFORE_MONEY" | "HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM";
    flag: string;
    approved: boolean;
    requiredFor: string;
  }>;
  canPersist: boolean;
  canStartCheckout: boolean;
  canUsePaidWrites: boolean;
};

declare global {
  interface Window {
    openai?: {
      theme?: string;
      widgetState?: unknown;
      setWidgetState?: (state: unknown) => void;
      requestDisplayMode?: (payload: { mode: "inline" | "pip" | "fullscreen" }) => Promise<unknown>;
    };
  }
}
