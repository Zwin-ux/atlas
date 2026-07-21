import { createHmac } from "node:crypto";
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
  now?: () => Date;
};

const URL_PATTERN = /(?:https?:\/\/|www\.)\S+/i;
const VALID_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,127}$/;
const REPORT_REASONS = new Set(["spam", "harassment", "privacy", "misleading", "other"]);

export class AtlasCommonsService {
  readonly config: AtlasCommonsConfig;
  private readonly repository?: AtlasCommonsRepository;
  private readonly resolveAnchor: AtlasCommonsServiceOptions["resolveAnchor"];
  private readonly now: () => Date;

  constructor(options: AtlasCommonsServiceOptions) {
    this.config = options.config;
    this.repository = options.repository;
    this.resolveAnchor = options.resolveAnchor;
    this.now = options.now ?? (() => new Date());
  }

  publicMeta(): AtlasCommonsPublicMeta {
    const available = Boolean(this.config.enabled && this.repository && this.config.pseudonymSecret);
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
    if (!this.config.enabled || !this.repository || !this.config.pseudonymSecret) return false;
    return this.repository.health();
  }

  async list(input: AtlasCommonsListInput, auth?: AtlasCommonsAuthContext): Promise<AtlasCommonsListResult> {
    const repository = this.requireAvailable();
    const mode = input.mode ?? "all";
    const sort = mode === "mine" ? "new" : input.sort ?? "hot";
    const countySlug = optionalSlug(input.countySlug, "countySlug");
    const placeId = optionalId(input.placeId, "placeId");
    if (placeId && !countySlug) throw new AtlasCommonsError("INVALID_NOTE", "A place filter requires a county.");
    const limit = Math.min(100, Math.max(1, Math.floor(input.limit ?? 30)));
    const cursor = decodeCursor(input.cursor, sort);

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
      ...(countySlug ? { countySlug } : {}),
      ...(placeId ? { placeId } : {}),
      ...(ownerUserId ? { ownerUserId } : {}),
      ...(viewerUserId ? { viewerUserId } : {}),
      limit: limit + 1,
      ...(cursor ? { cursor } : {}),
    });
    const page = rows.slice(0, limit);
    const nextCursor = rows.length > limit && page.length > 0 ? encodeCursor(page[page.length - 1]!, sort, cursor?.asOf ?? this.now().toISOString()) : undefined;
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
    await this.enforceRateLimit(repository, user.id);
    const { note, reused } = await repository.createNote({
      ownerUserId: user.id,
      authorHandle: this.authorHandle(verified.subject),
      ...anchor,
      body,
      clientRequestId,
    });
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
    await this.enforceRateLimit(repository, user.id);
    try {
      const { note, changed } = await repository.setReaction(requiredId(noteId, "noteId"), user.id, active);
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
    await this.enforceRateLimit(repository, user.id);
    try {
      const { note, changed, thresholdReached } = await repository.reportNote(
        requiredId(noteId, "noteId"),
        user.id,
        normalizedReason,
        this.config.reportThreshold,
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
      throw noteNotFound(error);
    }
  }

  private requireAvailable(): AtlasCommonsRepository {
    if (!this.config.enabled) throw new AtlasCommonsError("COMMONS_DISABLED", "Public notes are not enabled on this Atlas server.");
    if (!this.repository || !this.config.pseudonymSecret) {
      throw new AtlasCommonsError("COMMONS_UNAVAILABLE", "Public notes are temporarily unavailable. Private notes still work.");
    }
    return this.repository;
  }

  private authorHandle(subject: string): string {
    const suffix = createHmac("sha256", this.config.pseudonymSecret!).update(subject).digest("hex").slice(0, 10).toUpperCase();
    return `Atlas-${suffix}`;
  }

  private async enforceRateLimit(repository: AtlasCommonsRepository, ownerUserId: string): Promise<void> {
    const since = new Date(this.now().getTime() - 3_600_000).toISOString();
    if ((await repository.countRecentActions(ownerUserId, since)) >= this.config.writeLimitPerHour) {
      throw new AtlasCommonsError("RATE_LIMITED", "Too many public-note actions. Try again later.");
    }
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

function encodeCursor(note: AtlasCommonsNoteRecord, sort: "hot" | "new", asOf: string): string {
  const timestamp = note.publishedAt ?? note.createdAt;
  const ageHours = Math.max(0, new Date(asOf).getTime() - new Date(timestamp).getTime()) / 3_600_000;
  const cursor: AtlasCommonsListCursor & { v: 1; sort: "hot" | "new" } = {
    v: 1,
    sort,
    asOf,
    ...(sort === "hot" ? { score: note.reactionCount * 4 - note.reportCount * 8 - ageHours / 12 } : {}),
    timestamp,
    id: note.id,
  };
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(value: string | undefined, sort: "hot" | "new"): AtlasCommonsListCursor | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
    if (
      parsed.v !== 1 ||
      parsed.sort !== sort ||
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
  return new AtlasCommonsError("NOTE_NOT_FOUND", "That public note is not available.");
}
