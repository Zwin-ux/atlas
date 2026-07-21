import { createHmac, timingSafeEqual } from "node:crypto";
import type { AtlasCommonsListCursor, AtlasCommonsRepository } from "./repository.js";
import {
  ATLAS_COMMONS_READ_SCOPE,
  ATLAS_COMMONS_WRITE_SCOPE,
  AtlasCommonsError,
  type AtlasCommonsAnchor,
  type AtlasCommonsAuthContext,
  type AtlasCommonsConfig,
  type AtlasCommonsListInput,
  type AtlasCommonsListResult,
  type AtlasCommonsModerationResult,
  type AtlasCommonsModerationQueueItem,
  type AtlasCommonsModerationQueueResult,
  type AtlasCommonsModerationQueueStatus,
  type AtlasCommonsNoteRecord,
  type AtlasCommonsPostInput,
  type AtlasCommonsPublicMeta,
  type AtlasCommonsWriteResult,
  type AtlasPublicNote,
} from "./types.js";

export type AtlasCommonsServiceOptions = {
  config: AtlasCommonsConfig;
  repository?: AtlasCommonsRepository;
  resolveAnchor: (countySlug: string, placeId: string) => AtlasCommonsAnchor | undefined;
  authConfigured?: boolean;
  now?: () => Date;
};

const URL_PATTERN = /(?:https?:\/\/|www\.)\S+/i;
const VALID_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,127}$/;
const REPORT_REASONS = new Set(["spam", "harassment", "privacy", "misleading", "other"]);

export class AtlasCommonsService {
  readonly config: AtlasCommonsConfig;
  private readonly repository?: AtlasCommonsRepository;
  private readonly resolveAnchor: AtlasCommonsServiceOptions["resolveAnchor"];
  private readonly authConfigured: boolean;
  private readonly now: () => Date;

  constructor(options: AtlasCommonsServiceOptions) {
    this.config = options.config;
    this.repository = options.repository;
    this.resolveAnchor = options.resolveAnchor;
    this.authConfigured = options.authConfigured === true;
    this.now = options.now ?? (() => new Date());
  }

  publicMeta(): AtlasCommonsPublicMeta {
    const available = Boolean(
      this.config.enabled &&
      this.repository &&
      this.config.pseudonymSecret &&
      this.config.operatorToken &&
      this.authConfigured,
    );
    return {
      enabled: this.config.enabled,
      available,
      requiresIdentityForPosting: true,
      publicPostingIsExplicit: true,
      privateNotesStayPrivate: true,
      moderation: "pre_publication",
      modes: ["all", "nearby", "mine"],
      statusLabel: available
        ? "Public notes are ready. New posts wait for review."
        : this.config.enabled
          ? "Public notes are temporarily unavailable. Private notes still work."
          : "Public notes are not enabled on this Atlas server.",
    };
  }

  async health(): Promise<boolean> {
    if (!this.config.enabled || !this.repository || !this.config.pseudonymSecret || !this.config.operatorToken || !this.authConfigured) return false;
    return this.repository.health();
  }

  async listModerationQueue(
    status: AtlasCommonsModerationQueueStatus = "pending",
    limit = 50,
  ): Promise<AtlasCommonsModerationQueueResult> {
    const repository = this.requireAvailable();
    const boundedLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const notes = await repository.listModerationQueue(status, boundedLimit);
    return {
      type: "atlasPublicNoteModerationQueue",
      status,
      notes: notes.map(operatorNote),
    };
  }

  async list(input: AtlasCommonsListInput, auth?: AtlasCommonsAuthContext): Promise<AtlasCommonsListResult> {
    const repository = this.requireAvailable();
    const mode = input.mode ?? "all";
    const sort = mode === "mine" ? "new" : input.sort ?? "hot";
    const countySlug = optionalSlug(input.countySlug, "countySlug");
    const placeId = optionalId(input.placeId, "placeId");
    if (placeId && !countySlug) throw new AtlasCommonsError("INVALID_NOTE", "A place filter requires a county.");
    const limit = Math.min(100, Math.max(1, Math.floor(input.limit ?? 30)));
    const cursorScope = [mode, sort, countySlug ?? "*", placeId ?? "*"].join(":");
    const cursor = decodeCursor(input.cursor, sort, cursorScope, this.config.pseudonymSecret!);
    const asOf = cursor?.asOf ?? this.now().toISOString();

    let ownerUserId: string | undefined;
    let viewerUserId: string | undefined;
    if (mode === "mine") {
      const verified = requireScope(auth, ATLAS_COMMONS_READ_SCOPE);
      const user = await repository.findUserByOidcSubject(verified.subject);
      if (!user) {
        return { type: "atlasPublicNoteList", notes: [], scope: { mode, sort, ...(countySlug ? { countySlug } : {}), ...(placeId ? { placeId } : {}) } };
      }
      ownerUserId = user.id;
      viewerUserId = user.id;
    } else if (auth) {
      const user = await repository.findUserByOidcSubject(auth.subject);
      viewerUserId = user?.id;
    }

    const rows = await repository.listNotes({
      mode,
      sort,
      asOf,
      ...(countySlug ? { countySlug } : {}),
      ...(placeId ? { placeId } : {}),
      ...(ownerUserId ? { ownerUserId } : {}),
      ...(viewerUserId ? { viewerUserId } : {}),
      limit: limit + 1,
      ...(cursor ? { cursor } : {}),
    });
    const page = rows.slice(0, limit);
    const nextCursor = rows.length > limit && page.length > 0
      ? encodeCursor(page[page.length - 1]!, mode, sort, asOf, cursorScope, this.config.pseudonymSecret!)
      : undefined;
    return {
      type: "atlasPublicNoteList",
      notes: page.map((note) => publicNote(note, viewerUserId, mode === "mine")),
      ...(nextCursor ? { nextCursor } : {}),
      scope: { mode, sort, ...(countySlug ? { countySlug } : {}), ...(placeId ? { placeId } : {}) },
    };
  }

  async post(input: AtlasCommonsPostInput, auth?: AtlasCommonsAuthContext): Promise<AtlasCommonsWriteResult> {
    const repository = this.requireAvailable();
    const verified = requireScope(auth, ATLAS_COMMONS_WRITE_SCOPE);
    const body = validateBody(input.body);
    const clientRequestId = requiredId(input.clientRequestId, "clientRequestId");
    const countySlug = requiredSlug(input.countySlug, "countySlug");
    const placeId = requiredId(input.placeId, "placeId");
    const anchor = this.resolveAnchor(countySlug, placeId);
    if (!anchor) throw new AtlasCommonsError("UNKNOWN_ANCHOR", "Choose a place that is currently mapped by Atlas.");

    const user = await repository.upsertUserByOidcSubject(verified.subject, verified.email);
    const existing = await repository.findNoteByRequest(user.id, clientRequestId);
    if (existing) {
      return {
        type: "atlasPublicNoteWrite",
        operation: "post",
        status: "unchanged",
        note: publicNote(existing, user.id, true),
        message: "This public post was already received.",
      };
    }
    let note: AtlasCommonsNoteRecord;
    let reused: boolean;
    try {
      ({ note, reused } = await repository.createNote({
        ownerUserId: user.id,
        authorHandle: this.authorHandle(verified.subject),
        ...anchor,
        body,
        clientRequestId,
      }, this.writeQuota()));
    } catch (error) {
      const limited = rateLimitError(error);
      if (limited) throw limited;
      throw new AtlasCommonsError("COMMONS_UNAVAILABLE", "Public posting is temporarily unavailable. Your private notes still work.");
    }
    return {
      type: "atlasPublicNoteWrite",
      operation: "post",
      status: reused ? "unchanged" : "accepted",
      note: publicNote(note, user.id, true),
      message: reused ? "This public post was already received." : "Posted for review. It is visible only to you until approved.",
    };
  }

  async react(noteId: string, active: boolean, auth?: AtlasCommonsAuthContext): Promise<AtlasCommonsWriteResult> {
    const repository = this.requireAvailable();
    const verified = requireScope(auth, ATLAS_COMMONS_WRITE_SCOPE);
    const user = await repository.upsertUserByOidcSubject(verified.subject, verified.email);
    try {
      const { note, changed } = await repository.setReaction(requiredId(noteId, "noteId"), user.id, active, this.writeQuota());
      return {
        type: "atlasPublicNoteWrite",
        operation: "react",
        status: changed ? "accepted" : "unchanged",
        note: publicNote(note, user.id, false),
        message: active ? "Marked useful." : "Useful mark removed.",
      };
    } catch (error) {
      throw noteNotFound(error);
    }
  }

  async report(noteId: string, reason: string, auth?: AtlasCommonsAuthContext): Promise<AtlasCommonsWriteResult> {
    const repository = this.requireAvailable();
    const verified = requireScope(auth, ATLAS_COMMONS_WRITE_SCOPE);
    const normalizedReason = reason.trim().toLowerCase();
    if (!REPORT_REASONS.has(normalizedReason)) throw new AtlasCommonsError("INVALID_NOTE", "Choose a valid report reason.");
    const user = await repository.upsertUserByOidcSubject(verified.subject, verified.email);
    try {
      const { note, changed, thresholdReached } = await repository.reportNote(
        requiredId(noteId, "noteId"),
        user.id,
        normalizedReason,
        this.config.reportThreshold,
        this.writeQuota(),
      );
      return {
        type: "atlasPublicNoteWrite",
        operation: "report",
        status: changed ? "accepted" : "unchanged",
        note: publicNote(note, user.id, thresholdReached),
        message: thresholdReached ? "Reported. This note is hidden while it is reviewed." : "Report received for review.",
      };
    } catch (error) {
      throw noteNotFound(error);
    }
  }

  async moderate(noteId: string, action: "approve" | "remove", operatorLabel: string): Promise<AtlasCommonsModerationResult> {
    const repository = this.requireAvailable();
    try {
      const { note, previousStatus } = await repository.moderateNote(
        requiredId(noteId, "noteId"),
        action === "approve" ? "visible" : "removed",
        operatorLabel.slice(0, 80),
      );
      return { type: "atlasPublicNoteModeration", noteId: note.id, previousStatus, status: note.status };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("INVALID_TRANSITION")) {
        throw new AtlasCommonsError("INVALID_TRANSITION", "That moderation transition is not allowed.");
      }
      throw noteNotFound(error);
    }
  }

  private requireAvailable(): AtlasCommonsRepository {
    if (!this.config.enabled) throw new AtlasCommonsError("COMMONS_DISABLED", "Public notes are not enabled on this Atlas server.");
    if (!this.repository || !this.config.pseudonymSecret || !this.config.operatorToken || !this.authConfigured) {
      throw new AtlasCommonsError("COMMONS_UNAVAILABLE", "Public notes are temporarily unavailable. Private notes still work.");
    }
    return this.repository;
  }

  private authorHandle(subject: string): string {
    const suffix = createHmac("sha256", this.config.pseudonymSecret!).update(subject).digest("hex").slice(0, 16).toUpperCase();
    return `Atlas-${suffix}`;
  }

  private writeQuota() {
    return {
      since: new Date(this.now().getTime() - 3_600_000).toISOString(),
      limit: this.config.writeLimitPerHour,
    };
  }
}

export function readAtlasCommonsConfig(env: NodeJS.ProcessEnv): AtlasCommonsConfig {
  return {
    enabled: /^true$/i.test(env.ATLAS_COMMONS_ENABLED?.trim() ?? ""),
    pseudonymSecret: env.ATLAS_COMMONS_PSEUDONYM_SECRET?.trim() || undefined,
    operatorToken: env.ATLAS_COMMONS_OPS_TOKEN?.trim() || undefined,
    reportThreshold: boundedInteger(env.ATLAS_COMMONS_REPORT_THRESHOLD, 3, 2, 20),
    writeLimitPerHour: boundedInteger(env.ATLAS_COMMONS_WRITE_LIMIT_PER_HOUR, 30, 5, 500),
  };
}

function publicNote(note: AtlasCommonsNoteRecord, viewerUserId: string | undefined, includeStatus: boolean): AtlasPublicNote {
  return {
    id: note.id,
    countySlug: note.countySlug,
    placeId: note.placeId,
    placeLabel: note.placeLabel,
    body: note.body,
    authorHandle: note.authorHandle,
    ...(includeStatus ? { status: note.status } : {}),
    reactionCount: note.reactionCount,
    createdAt: note.createdAt,
    ...(note.publishedAt ? { publishedAt: note.publishedAt } : {}),
    ...(viewerUserId !== undefined && note.viewerHasReacted !== undefined ? { viewerHasReacted: note.viewerHasReacted } : {}),
    viewerCanReport: note.status === "visible" && note.ownerUserId !== viewerUserId,
  };
}

function operatorNote(note: AtlasCommonsNoteRecord): AtlasCommonsModerationQueueItem {
  if (note.status !== "pending" && note.status !== "removed") {
    throw new AtlasCommonsError("INVALID_TRANSITION", "Only pending or removed notes belong in the moderation queue.");
  }
  return {
    id: note.id,
    countySlug: note.countySlug,
    placeId: note.placeId,
    placeLabel: note.placeLabel,
    body: note.body,
    authorHandle: note.authorHandle,
    status: note.status,
    reactionCount: note.reactionCount,
    reportCount: note.reportCount,
    createdAt: note.createdAt,
    ...(note.publishedAt ? { publishedAt: note.publishedAt } : {}),
    ...(note.removedAt ? { removedAt: note.removedAt } : {}),
  };
}

function requireScope(auth: AtlasCommonsAuthContext | undefined, scope: string): AtlasCommonsAuthContext {
  if (!auth) throw new AtlasCommonsError("AUTH_REQUIRED", "Connect your Atlas identity to continue.");
  if (!auth.scopes.includes(scope) && !(scope === ATLAS_COMMONS_READ_SCOPE && auth.scopes.includes(ATLAS_COMMONS_WRITE_SCOPE))) {
    throw new AtlasCommonsError("FORBIDDEN", "Your Atlas identity does not have access to this action.");
  }
  return auth;
}

function validateBody(value: string): string {
  const body = value.trim();
  if (!body || body.length > 240) throw new AtlasCommonsError("INVALID_NOTE", "Public notes must be 1-240 characters.");
  if (URL_PATTERN.test(body)) throw new AtlasCommonsError("LINKS_NOT_ALLOWED", "Links are not allowed in public notes yet.");
  return body;
}

function requiredSlug(value: string, field: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized) || normalized.length > 80) {
    throw new AtlasCommonsError("INVALID_NOTE", `${field} is not a valid Atlas slug.`);
  }
  return normalized;
}

function optionalSlug(value: string | undefined, field: string): string | undefined {
  return value === undefined ? undefined : requiredSlug(value, field);
}

function requiredId(value: string, field: string): string {
  const normalized = value.trim();
  if (!VALID_ID_PATTERN.test(normalized)) throw new AtlasCommonsError("INVALID_NOTE", `${field} is not a valid Atlas id.`);
  return normalized;
}

function optionalId(value: string | undefined, field: string): string | undefined {
  return value === undefined ? undefined : requiredId(value, field);
}

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function encodeCursor(
  note: AtlasCommonsNoteRecord,
  mode: "all" | "mine",
  sort: "hot" | "new",
  asOf: string,
  scope: string,
  secret: string,
): string {
  const timestamp = mode === "mine" ? note.createdAt : note.publishedAt ?? note.createdAt;
  const score = hotCursorScore(note, asOf, timestamp);
  const cursor: AtlasCommonsListCursor & { v: 1; sort: "hot" | "new"; scope: string } = {
    v: 1,
    sort,
    scope,
    asOf,
    ...(sort === "hot" ? { score } : {}),
    timestamp,
    id: note.id,
  };
  const payload = Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function hotCursorScore(note: AtlasCommonsNoteRecord, asOf: string, timestamp: string): number {
  const ageMs = Math.max(0, new Date(asOf).getTime() - new Date(timestamp).getTime());
  return Math.round((note.reactionCount * 4 - note.reportCount * 8 - ageMs / 43_200_000) * 1_000_000_000) / 1_000_000_000;
}

function decodeCursor(value: string | undefined, sort: "hot" | "new", scope: string, secret: string): AtlasCommonsListCursor | undefined {
  if (!value) return undefined;
  try {
    const parts = value.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error("invalid");
    const [payload, signature] = parts;
    const expected = createHmac("sha256", secret).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("invalid");
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
    if (
      parsed.v !== 1 ||
      parsed.sort !== sort ||
      parsed.scope !== scope ||
      typeof parsed.asOf !== "string" ||
      typeof parsed.timestamp !== "string" ||
      typeof parsed.id !== "string" ||
      (sort === "hot" && typeof parsed.score !== "number") ||
      !Number.isFinite(new Date(parsed.asOf).getTime()) ||
      !Number.isFinite(new Date(parsed.timestamp).getTime())
    ) throw new Error("invalid");
    return {
      asOf: parsed.asOf,
      timestamp: parsed.timestamp,
      id: parsed.id,
      ...(typeof parsed.score === "number" ? { score: parsed.score } : {}),
    };
  } catch {
    throw new AtlasCommonsError("INVALID_NOTE", "The public-note cursor is invalid or expired.");
  }
}

function noteNotFound(error: unknown): AtlasCommonsError {
  if (error instanceof AtlasCommonsError) return error;
  const limited = rateLimitError(error);
  if (limited) return limited;
  return new AtlasCommonsError("NOTE_NOT_FOUND", "That public note is not available.");
}

function rateLimitError(error: unknown): AtlasCommonsError | undefined {
  return error instanceof Error && error.message.startsWith("RATE_LIMITED")
    ? new AtlasCommonsError("RATE_LIMITED", "Too many public-note actions. Try again later.")
    : undefined;
}
