import { randomUUID } from "node:crypto";
import type { HostedClawdAuthContext } from "./auth.js";
import type {
  HostedClawdCampaignArtifactInput,
  HostedClawdCreateOrAttachInput,
  HostedClawdPersistencePort,
  HostedClawdPersistResult,
  HostedClawdPromotionInput,
  HostedClawdSavedRecord,
} from "./types.js";

export type HostedClawdUserRecord = {
  id: string;
  oidcSubject: string;
  email?: string;
};

export type HostedClawdClawdRecord = {
  id: string;
  ownerUserId: string;
  name: string;
  status: "active";
};

export type HostedClawdBusinessProfileRecord = {
  id: string;
  ownerUserId: string;
  clawdId: string;
  businessName: string;
  businessType?: string;
  serviceArea?: string;
  primaryGoal?: string;
  offerNotes?: string;
  countySlug: string;
  countyLabel?: string;
  placeLabel?: string;
};

export type HostedClawdScoutDropRecord = {
  id: string;
  ownerUserId: string;
  clawdId: string;
  businessProfileId?: string;
  scoutPreviewId: string;
  countySlug: string;
  sourceNote: string;
};

export type HostedClawdCampaignRecord = {
  id: string;
  ownerUserId: string;
  clawdId: string;
  businessProfileId: string;
  scoutDropId?: string;
  campaignPreviewId: string;
  summary?: string;
  status: "draft";
};

export type HostedClawdSavedRow<T> = {
  record: T;
  reused: boolean;
};

export type HostedClawdSaveBusinessProfileInput = Omit<HostedClawdBusinessProfileRecord, "id">;
export type HostedClawdSaveScoutDropInput = Omit<HostedClawdScoutDropRecord, "id">;
export type HostedClawdSaveCampaignInput = Omit<HostedClawdCampaignRecord, "id" | "status">;

export type HostedClawdRepository = {
  upsertUserByOidcSubject(oidcSubject: string, email?: string): Promise<HostedClawdUserRecord>;
  findClawdForOwner(ownerUserId: string): Promise<HostedClawdClawdRecord | null>;
  getOwnedClawd(ownerUserId: string, clawdId: string): Promise<HostedClawdClawdRecord | null>;
  createClawd(ownerUserId: string, name: string): Promise<HostedClawdClawdRecord>;
  saveBusinessProfile(
    input: HostedClawdSaveBusinessProfileInput,
  ): Promise<HostedClawdSavedRow<HostedClawdBusinessProfileRecord>>;
  findBusinessProfile(ownerUserId: string, clawdId: string): Promise<HostedClawdBusinessProfileRecord | null>;
  saveScoutDrop(input: HostedClawdSaveScoutDropInput): Promise<HostedClawdSavedRow<HostedClawdScoutDropRecord>>;
  findScoutDropByPreviewId(ownerUserId: string, scoutPreviewId: string): Promise<HostedClawdScoutDropRecord | null>;
  saveCampaignDraft(input: HostedClawdSaveCampaignInput): Promise<HostedClawdSavedRow<HostedClawdCampaignRecord>>;
  recordUsageEvent(ownerUserId: string, eventType: string, detail?: string): Promise<void>;
  findIdempotentRecords(
    ownerUserId: string,
    operation: string,
    clientRequestId: string,
  ): Promise<HostedClawdSavedRecord[] | null>;
  saveIdempotentRecords(
    ownerUserId: string,
    operation: string,
    clientRequestId: string,
    records: HostedClawdSavedRecord[],
  ): Promise<void>;
};

// Session preview ids from the free Alpha loop must never resolve as persisted
// Clawds; only server-generated ids are owned rows.
export function isSessionOnlyId(id: string): boolean {
  return /^(session|sess|temp|preview|demo)[-_]/i.test(id.trim());
}

export function createInMemoryHostedClawdRepository(): HostedClawdRepository {
  const usersBySubject = new Map<string, HostedClawdUserRecord>();
  const clawds = new Map<string, HostedClawdClawdRecord>();
  const businessProfiles = new Map<string, HostedClawdBusinessProfileRecord>();
  const scoutDrops = new Map<string, HostedClawdScoutDropRecord>();
  const campaigns = new Map<string, HostedClawdCampaignRecord>();
  const usageEvents: Array<{ ownerUserId: string; eventType: string; detail?: string }> = [];
  const idempotencyKeys = new Map<string, HostedClawdSavedRecord[]>();

  const idempotencyKey = (ownerUserId: string, operation: string, clientRequestId: string) =>
    `${ownerUserId}::${operation}::${clientRequestId}`;

  return {
    async upsertUserByOidcSubject(oidcSubject, email) {
      const existing = usersBySubject.get(oidcSubject);
      if (existing) {
        if (email && existing.email !== email) existing.email = email;
        return existing;
      }
      const user: HostedClawdUserRecord = { id: randomUUID(), oidcSubject, email };
      usersBySubject.set(oidcSubject, user);
      return user;
    },
    async findClawdForOwner(ownerUserId) {
      for (const clawd of clawds.values()) {
        if (clawd.ownerUserId === ownerUserId) return clawd;
      }
      return null;
    },
    async getOwnedClawd(ownerUserId, clawdId) {
      if (isSessionOnlyId(clawdId)) return null;
      const clawd = clawds.get(clawdId);
      return clawd && clawd.ownerUserId === ownerUserId ? clawd : null;
    },
    async createClawd(ownerUserId, name) {
      const clawd: HostedClawdClawdRecord = { id: randomUUID(), ownerUserId, name, status: "active" };
      clawds.set(clawd.id, clawd);
      return clawd;
    },
    async saveBusinessProfile(input) {
      for (const profile of businessProfiles.values()) {
        if (profile.ownerUserId === input.ownerUserId && profile.clawdId === input.clawdId) {
          Object.assign(profile, input);
          return { record: profile, reused: true };
        }
      }
      const record: HostedClawdBusinessProfileRecord = { id: randomUUID(), ...input };
      businessProfiles.set(record.id, record);
      return { record, reused: false };
    },
    async findBusinessProfile(ownerUserId, clawdId) {
      for (const profile of businessProfiles.values()) {
        if (profile.ownerUserId === ownerUserId && profile.clawdId === clawdId) return profile;
      }
      return null;
    },
    async saveScoutDrop(input) {
      for (const drop of scoutDrops.values()) {
        if (drop.ownerUserId === input.ownerUserId && drop.scoutPreviewId === input.scoutPreviewId) {
          return { record: drop, reused: true };
        }
      }
      const record: HostedClawdScoutDropRecord = { id: randomUUID(), ...input };
      scoutDrops.set(record.id, record);
      return { record, reused: false };
    },
    async findScoutDropByPreviewId(ownerUserId, scoutPreviewId) {
      for (const drop of scoutDrops.values()) {
        if (drop.ownerUserId === ownerUserId && drop.scoutPreviewId === scoutPreviewId) return drop;
      }
      return null;
    },
    async saveCampaignDraft(input) {
      for (const campaign of campaigns.values()) {
        if (campaign.ownerUserId === input.ownerUserId && campaign.campaignPreviewId === input.campaignPreviewId) {
          return { record: campaign, reused: true };
        }
      }
      const record: HostedClawdCampaignRecord = { id: randomUUID(), status: "draft", ...input };
      campaigns.set(record.id, record);
      return { record, reused: false };
    },
    async recordUsageEvent(ownerUserId, eventType, detail) {
      usageEvents.push({ ownerUserId, eventType, detail });
    },
    async findIdempotentRecords(ownerUserId, operation, clientRequestId) {
      return idempotencyKeys.get(idempotencyKey(ownerUserId, operation, clientRequestId)) ?? null;
    },
    async saveIdempotentRecords(ownerUserId, operation, clientRequestId, records) {
      idempotencyKeys.set(idempotencyKey(ownerUserId, operation, clientRequestId), records);
    },
  };
}

const DEFAULT_COUNTY_SLUG = "riverside-ca";
const SAVED_SOURCE_NOTE = "atlas-curated-county-pack";

// Maps the low-level repository onto the service-facing persistence port. Every
// write path starts from the verified OIDC subject; no session identity leaks in.
export function createHostedClawdRepositoryPersistence(
  repository: HostedClawdRepository,
): HostedClawdPersistencePort {
  async function ensureOwnedClawd(
    auth: HostedClawdAuthContext,
    input: HostedClawdCreateOrAttachInput,
  ): Promise<{ user: HostedClawdUserRecord; clawd: HostedClawdClawdRecord; reused: boolean }> {
    const user = await repository.upsertUserByOidcSubject(auth.subject, auth.email);
    const existing = await repository.findClawdForOwner(user.id);
    if (existing) return { user, clawd: existing, reused: true };
    const name = input.businessName?.trim() || input.businessType?.trim() || "Hosted Clawd";
    const clawd = await repository.createClawd(user.id, name);
    return { user, clawd, reused: false };
  }

  async function withIdempotency(
    ownerUserId: string,
    operation: string,
    clientRequestId: string | undefined,
    run: () => Promise<HostedClawdSavedRecord[]>,
  ): Promise<HostedClawdPersistResult> {
    if (clientRequestId) {
      const existing = await repository.findIdempotentRecords(ownerUserId, operation, clientRequestId);
      if (existing) {
        return { records: existing.map((record) => ({ ...record, reused: true })), reusedRequest: true };
      }
    }
    const records = await run();
    if (clientRequestId) {
      await repository.saveIdempotentRecords(ownerUserId, operation, clientRequestId, records);
    }
    return { records, reusedRequest: false };
  }

  return {
    async createOrAttachClawd(auth, input) {
      const { user, clawd, reused } = await ensureOwnedClawd(auth, input);
      const result = await withIdempotency(user.id, "create_or_attach_clawd", input.clientRequestId, async () => [
        { kind: "clawd", id: clawd.id, reused },
      ]);
      await repository.recordUsageEvent(user.id, "hosted_clawd.create_or_attach", clawd.id);
      return result;
    },

    async promoteSession(auth, input: HostedClawdPromotionInput) {
      const { user, clawd, reused } = await ensureOwnedClawd(auth, input);
      const result = await withIdempotency(user.id, "promote_session", input.clientRequestId, async () => {
        const records: HostedClawdSavedRecord[] = [{ kind: "clawd", id: clawd.id, reused }];
        const businessName = input.businessName?.trim() || input.businessType?.trim();
        if (!businessName) {
          throw new Error("Confirm the business name or type before promoting this session.");
        }
        const profile = await repository.saveBusinessProfile({
          ownerUserId: user.id,
          clawdId: clawd.id,
          businessName,
          businessType: input.businessType,
          serviceArea: input.serviceArea,
          primaryGoal: input.primaryGoal,
          offerNotes: input.offerNotes,
          countySlug: input.countySlug?.trim() || DEFAULT_COUNTY_SLUG,
          countyLabel: input.countyLabel,
          placeLabel: input.placeLabel,
        });
        records.push({ kind: "business_profile", id: profile.record.id, reused: profile.reused });
        if (input.scoutPreviewId?.trim()) {
          const drop = await repository.saveScoutDrop({
            ownerUserId: user.id,
            clawdId: clawd.id,
            businessProfileId: profile.record.id,
            scoutPreviewId: input.scoutPreviewId.trim(),
            countySlug: input.countySlug?.trim() || DEFAULT_COUNTY_SLUG,
            sourceNote: SAVED_SOURCE_NOTE,
          });
          records.push({ kind: "scout_drop", id: drop.record.id, reused: drop.reused });
        }
        return records;
      });
      await repository.recordUsageEvent(user.id, "hosted_clawd.promote_session", clawd.id);
      return result;
    },

    async saveCampaignArtifact(auth, input: HostedClawdCampaignArtifactInput) {
      const user = await repository.upsertUserByOidcSubject(auth.subject, auth.email);
      const clawd = await repository.findClawdForOwner(user.id);
      if (!clawd) {
        throw new Error("Create or attach a Hosted Clawd before saving a campaign draft.");
      }
      const profile = await repository.findBusinessProfile(user.id, clawd.id);
      if (!profile) {
        throw new Error("Save the business profile before saving a campaign draft.");
      }
      const campaignPreviewId = input.campaignPreviewId?.trim();
      if (!campaignPreviewId) {
        throw new Error("A campaign preview id is required to save a campaign draft.");
      }
      const result = await withIdempotency(user.id, "save_campaign_artifact", input.clientRequestId, async () => {
        const scoutDrop = input.scoutPreviewId
          ? await repository.findScoutDropByPreviewId(user.id, input.scoutPreviewId)
          : null;
        const campaign = await repository.saveCampaignDraft({
          ownerUserId: user.id,
          clawdId: clawd.id,
          businessProfileId: profile.id,
          scoutDropId: scoutDrop?.id,
          campaignPreviewId,
          summary: input.campaignSummary,
        });
        return [{ kind: "campaign_draft", id: campaign.record.id, reused: campaign.reused }];
      });
      await repository.recordUsageEvent(user.id, "hosted_clawd.save_campaign_artifact", clawd.id);
      return result;
    },
  };
}
