import { randomUUID } from "node:crypto";
import type {
  AtlasCommonsNoteRecord,
  AtlasCommonsNoteStatus,
  AtlasCommonsSort,
} from "./types.js";

export type AtlasCommonsUserRecord = {
  id: string;
  oidcSubject: string;
  email?: string;
};

export type AtlasCommonsListCursor = {
  asOf: string;
  score?: number;
  timestamp: string;
  id: string;
};

export type AtlasCommonsListQuery = {
  mode: "all" | "mine";
  sort: AtlasCommonsSort;
  countySlug?: string;
  placeId?: string;
  ownerUserId?: string;
  viewerUserId?: string;
  limit: number;
  cursor?: AtlasCommonsListCursor;
};

export type AtlasCommonsCreateNoteInput = {
  ownerUserId: string;
  authorHandle: string;
  countySlug: string;
  placeId: string;
  placeLabel: string;
  body: string;
  clientRequestId: string;
};

export type AtlasCommonsRepository = {
  health(): Promise<boolean>;
  upsertUserByOidcSubject(oidcSubject: string, email?: string): Promise<AtlasCommonsUserRecord>;
  findUserByOidcSubject(oidcSubject: string): Promise<AtlasCommonsUserRecord | null>;
  countRecentActions(ownerUserId: string, since: string): Promise<number>;
  createNote(input: AtlasCommonsCreateNoteInput): Promise<{ note: AtlasCommonsNoteRecord; reused: boolean }>;
  listNotes(input: AtlasCommonsListQuery): Promise<AtlasCommonsNoteRecord[]>;
  getNoteForViewer(noteId: string, viewerUserId?: string): Promise<AtlasCommonsNoteRecord | null>;
  setReaction(noteId: string, ownerUserId: string, active: boolean): Promise<{ note: AtlasCommonsNoteRecord; changed: boolean }>;
  reportNote(
    noteId: string,
    reporterUserId: string,
    reason: string,
    threshold: number,
  ): Promise<{ note: AtlasCommonsNoteRecord; changed: boolean; thresholdReached: boolean }>;
  moderateNote(
    noteId: string,
    status: Extract<AtlasCommonsNoteStatus, "visible" | "removed">,
    operatorLabel: string,
  ): Promise<{ note: AtlasCommonsNoteRecord; previousStatus: AtlasCommonsNoteStatus }>;
};

type MemoryNote = AtlasCommonsNoteRecord;

export function createInMemoryAtlasCommonsRepository(now: () => Date = () => new Date()): AtlasCommonsRepository {
  const usersBySubject = new Map<string, AtlasCommonsUserRecord>();
  const usersById = new Map<string, AtlasCommonsUserRecord>();
  const notes = new Map<string, MemoryNote>();
  const noteIdByRequest = new Map<string, string>();
  const reactions = new Set<string>();
  const reports = new Map<string, string>();
  const actionTimes = new Map<string, number[]>();

  const reactionKey = (noteId: string, ownerUserId: string) => `${noteId}::${ownerUserId}`;
  const reportKey = reactionKey;
  const requestKey = (ownerUserId: string, clientRequestId: string) => `${ownerUserId}::${clientRequestId}`;

  const recordAction = (ownerUserId: string) => {
    const list = actionTimes.get(ownerUserId) ?? [];
    list.push(now().getTime());
    actionTimes.set(ownerUserId, list);
  };

  const decorate = (note: MemoryNote, viewerUserId?: string): AtlasCommonsNoteRecord => ({
    ...note,
    reactionCount: [...reactions].filter((key) => key.startsWith(`${note.id}::`)).length,
    reportCount: [...reports.keys()].filter((key) => key.startsWith(`${note.id}::`)).length,
    ...(viewerUserId ? { viewerHasReacted: reactions.has(reactionKey(note.id, viewerUserId)) } : {}),
  });

  return {
    async health() {
      return true;
    },
    async upsertUserByOidcSubject(oidcSubject, email) {
      const existing = usersBySubject.get(oidcSubject);
      if (existing) {
        if (email) existing.email = email;
        return { ...existing };
      }
      const user: AtlasCommonsUserRecord = { id: randomUUID(), oidcSubject, ...(email ? { email } : {}) };
      usersBySubject.set(oidcSubject, user);
      usersById.set(user.id, user);
      return { ...user };
    },
    async findUserByOidcSubject(oidcSubject) {
      const user = usersBySubject.get(oidcSubject);
      return user ? { ...user } : null;
    },
    async countRecentActions(ownerUserId, since) {
      const boundary = new Date(since).getTime();
      return (actionTimes.get(ownerUserId) ?? []).filter((value) => value >= boundary).length;
    },
    async createNote(input) {
      const key = requestKey(input.ownerUserId, input.clientRequestId);
      const existingId = noteIdByRequest.get(key);
      if (existingId) return { note: decorate(notes.get(existingId)!, input.ownerUserId), reused: true };
      const createdAt = now().toISOString();
      const note: MemoryNote = {
        id: randomUUID(),
        ...input,
        status: "pending",
        reactionCount: 0,
        reportCount: 0,
        createdAt,
      };
      notes.set(note.id, note);
      noteIdByRequest.set(key, note.id);
      recordAction(input.ownerUserId);
      return { note: decorate(note, input.ownerUserId), reused: false };
    },
    async listNotes(input) {
      const asOfMs = new Date(input.cursor?.asOf ?? now().toISOString()).getTime();
      const visible = [...notes.values()].filter((note) => {
        if (input.countySlug && note.countySlug !== input.countySlug) return false;
        if (input.placeId && note.placeId !== input.placeId) return false;
        if (input.mode === "mine") return note.ownerUserId === input.ownerUserId && note.status !== "removed";
        return note.status === "visible";
      });
      const scored = visible.map((note) => {
        const decorated = decorate(note, input.viewerUserId);
        const timestamp = note.publishedAt ?? note.createdAt;
        const ageHours = Math.max(0, asOfMs - new Date(timestamp).getTime()) / 3_600_000;
        return { note: decorated, timestamp, score: decorated.reactionCount * 4 - decorated.reportCount * 8 - ageHours / 12 };
      });
      scored.sort((a, b) => {
        if (input.mode === "all" && input.sort === "hot" && b.score !== a.score) return b.score - a.score;
        const timeDelta = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        return timeDelta || b.note.id.localeCompare(a.note.id);
      });
      const after = input.cursor
        ? scored.filter((entry) => {
            if (input.mode === "all" && input.sort === "hot") {
              if (entry.score !== input.cursor!.score) return entry.score < (input.cursor!.score ?? Number.POSITIVE_INFINITY);
            }
            const entryTime = new Date(entry.timestamp).getTime();
            const cursorTime = new Date(input.cursor!.timestamp).getTime();
            return entryTime < cursorTime || (entryTime === cursorTime && entry.note.id < input.cursor!.id);
          })
        : scored;
      return after.slice(0, input.limit).map((entry) => entry.note);
    },
    async getNoteForViewer(noteId, viewerUserId) {
      const note = notes.get(noteId);
      if (!note || (note.status !== "visible" && note.ownerUserId !== viewerUserId)) return null;
      return decorate(note, viewerUserId);
    },
    async setReaction(noteId, ownerUserId, active) {
      const note = notes.get(noteId);
      if (!note || note.status !== "visible") throw new Error("NOTE_NOT_FOUND");
      const key = reactionKey(noteId, ownerUserId);
      const had = reactions.has(key);
      if (active) reactions.add(key);
      else reactions.delete(key);
      const changed = had !== active;
      if (changed) recordAction(ownerUserId);
      return { note: decorate(note, ownerUserId), changed };
    },
    async reportNote(noteId, reporterUserId, reason, threshold) {
      const note = notes.get(noteId);
      if (!note || note.status !== "visible" || note.ownerUserId === reporterUserId) throw new Error("NOTE_NOT_FOUND");
      const key = reportKey(noteId, reporterUserId);
      const changed = !reports.has(key);
      if (changed) {
        reports.set(key, reason);
        recordAction(reporterUserId);
      }
      const count = [...reports.keys()].filter((candidate) => candidate.startsWith(`${noteId}::`)).length;
      const thresholdReached = count >= threshold;
      if (thresholdReached) {
        note.status = "removed";
        note.removedAt = now().toISOString();
      }
      return { note: decorate(note, reporterUserId), changed, thresholdReached };
    },
    async moderateNote(noteId, status) {
      const note = notes.get(noteId);
      if (!note) throw new Error("NOTE_NOT_FOUND");
      const previousStatus = note.status;
      note.status = status;
      if (status === "visible" && !note.publishedAt) note.publishedAt = now().toISOString();
      if (status === "removed") note.removedAt = now().toISOString();
      return { note: decorate(note), previousStatus };
    },
  };
}

