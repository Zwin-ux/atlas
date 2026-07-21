export const ATLAS_COMMONS_READ_SCOPE = "atlas:commons.read" as const;
export const ATLAS_COMMONS_WRITE_SCOPE = "atlas:commons.write" as const;

export type AtlasCommonsMode = "all" | "mine";
export type AtlasCommonsSort = "hot" | "new";
export type AtlasCommonsNoteStatus = "pending" | "visible" | "removed";
export type AtlasCommonsModerationQueueStatus = Extract<AtlasCommonsNoteStatus, "pending" | "removed">;

export type AtlasCommonsAuthContext = {
  subject: string;
  email?: string;
  scopes: string[];
};

export type AtlasCommonsAnchor = {
  countySlug: string;
  placeId: string;
  placeLabel: string;
};

export type AtlasCommonsNoteRecord = AtlasCommonsAnchor & {
  id: string;
  ownerUserId: string;
  authorHandle: string;
  body: string;
  status: AtlasCommonsNoteStatus;
  clientRequestId: string;
  reactionCount: number;
  reportCount: number;
  createdAt: string;
  publishedAt?: string;
  removedAt?: string;
  viewerHasReacted?: boolean;
};

export type AtlasPublicNote = AtlasCommonsAnchor & {
  id: string;
  body: string;
  authorHandle: string;
  status?: AtlasCommonsNoteStatus;
  reactionCount: number;
  createdAt: string;
  publishedAt?: string;
  viewerHasReacted?: boolean;
  viewerCanReport: boolean;
};

export type AtlasCommonsListInput = {
  mode?: AtlasCommonsMode;
  countySlug?: string;
  placeId?: string;
  sort?: AtlasCommonsSort;
  limit?: number;
  cursor?: string;
};

export type AtlasCommonsListResult = {
  type: "atlasPublicNoteList";
  notes: AtlasPublicNote[];
  nextCursor?: string;
  scope: {
    mode: AtlasCommonsMode;
    sort: AtlasCommonsSort;
    countySlug?: string;
    placeId?: string;
  };
};

export type AtlasCommonsPostInput = AtlasCommonsAnchor & {
  body: string;
  clientRequestId: string;
};

export type AtlasCommonsWriteResult = {
  type: "atlasPublicNoteWrite";
  operation: "post" | "react" | "report";
  status: "accepted" | "unchanged";
  note: AtlasPublicNote;
  message: string;
};

export type AtlasCommonsModerationResult = {
  type: "atlasPublicNoteModeration";
  noteId: string;
  previousStatus: AtlasCommonsNoteStatus;
  status: AtlasCommonsNoteStatus;
};

export type AtlasCommonsModerationQueueItem = AtlasCommonsAnchor & {
  id: string;
  body: string;
  authorHandle: string;
  status: AtlasCommonsModerationQueueStatus;
  reactionCount: number;
  reportCount: number;
  createdAt: string;
  publishedAt?: string;
  removedAt?: string;
};

export type AtlasCommonsModerationQueueResult = {
  type: "atlasPublicNoteModerationQueue";
  status: AtlasCommonsModerationQueueStatus;
  notes: AtlasCommonsModerationQueueItem[];
};

export type AtlasCommonsPublicMeta = {
  enabled: boolean;
  available: boolean;
  requiresIdentityForPosting: true;
  publicPostingIsExplicit: true;
  privateNotesStayPrivate: true;
  moderation: "pre_publication";
  modes: readonly ["all", "nearby", "mine"];
  statusLabel: string;
};

export type AtlasCommonsConfig = {
  enabled: boolean;
  pseudonymSecret?: string;
  operatorToken?: string;
  reportThreshold: number;
  writeLimitPerHour: number;
};

export type AtlasCommonsErrorCode =
  | "COMMONS_DISABLED"
  | "COMMONS_UNAVAILABLE"
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "INVALID_NOTE"
  | "LINKS_NOT_ALLOWED"
  | "UNKNOWN_ANCHOR"
  | "NOTE_NOT_FOUND"
  | "INVALID_TRANSITION"
  | "RATE_LIMITED";

export class AtlasCommonsError extends Error {
  readonly code: AtlasCommonsErrorCode;

  constructor(code: AtlasCommonsErrorCode, message: string) {
    super(message);
    this.name = "AtlasCommonsError";
    this.code = code;
  }
}
