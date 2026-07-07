import { randomUUID } from "node:crypto";
import type { HostedClawdAuthContext } from "./auth.js";
import type {
  HostedClawdCampaignArtifactInput,
  HostedClawdCreateOrAttachInput,
  HostedClawdContextInput,
  HostedClawdPersistencePort,
  HostedClawdPersistResult,
  HostedClawdPromotionInput,
  HostedClawdSavedRecord,
  HostedClawdSavedStateSummary,
  HostedClawdSubscriptionAccessStatus,
} from "./types.js";

export type HostedClawdUserRecord = {
  id: string;
  oidcSubject: string;
  email?: string;
  stripeCustomerId?: string;
};

export type HostedClawdStripeSubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

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

export type HostedClawdSubscriptionRecord = {
  id: string;
  ownerUserId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId?: string;
  stripeProductId?: string;
  status: HostedClawdStripeSubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  lastInvoiceId?: string;
  lastPaymentStatus?: string;
  updatedFromEventId?: string;
};

export type HostedClawdUpsertSubscriptionInput = Omit<HostedClawdSubscriptionRecord, "id">;

export type HostedClawdWebhookEventStatus = "processing" | "processed" | "failed";

export type HostedClawdWebhookStartResult = {
  reused: boolean;
  status: HostedClawdWebhookEventStatus;
};

export type HostedClawdRepository = {
  upsertUserByOidcSubject(oidcSubject: string, email?: string): Promise<HostedClawdUserRecord>;
  findUserByOidcSubject(oidcSubject: string): Promise<HostedClawdUserRecord | null>;
  findUserById(ownerUserId: string): Promise<HostedClawdUserRecord | null>;
  findUserByStripeCustomerId(stripeCustomerId: string): Promise<HostedClawdUserRecord | null>;
  attachStripeCustomerToUser(ownerUserId: string, stripeCustomerId: string): Promise<HostedClawdUserRecord>;
  findClawdForOwner(ownerUserId: string): Promise<HostedClawdClawdRecord | null>;
  getOwnedClawd(ownerUserId: string, clawdId: string): Promise<HostedClawdClawdRecord | null>;
  createClawd(ownerUserId: string, name: string): Promise<HostedClawdClawdRecord>;
  saveBusinessProfile(
    input: HostedClawdSaveBusinessProfileInput,
  ): Promise<HostedClawdSavedRow<HostedClawdBusinessProfileRecord>>;
  findBusinessProfile(ownerUserId: string, clawdId: string): Promise<HostedClawdBusinessProfileRecord | null>;
  saveScoutDrop(input: HostedClawdSaveScoutDropInput): Promise<HostedClawdSavedRow<HostedClawdScoutDropRecord>>;
  listScoutDropsForClawd(ownerUserId: string, clawdId: string): Promise<HostedClawdScoutDropRecord[]>;
  findScoutDropByPreviewId(ownerUserId: string, scoutPreviewId: string): Promise<HostedClawdScoutDropRecord | null>;
  saveCampaignDraft(input: HostedClawdSaveCampaignInput): Promise<HostedClawdSavedRow<HostedClawdCampaignRecord>>;
  listCampaignDraftsForClawd(ownerUserId: string, clawdId: string): Promise<HostedClawdCampaignRecord[]>;
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
  findSubscriptionForOwner(ownerUserId: string): Promise<HostedClawdSubscriptionRecord | null>;
  findSubscriptionByStripeSubscriptionId(stripeSubscriptionId: string): Promise<HostedClawdSubscriptionRecord | null>;
  upsertSubscription(input: HostedClawdUpsertSubscriptionInput): Promise<HostedClawdSubscriptionRecord>;
  updateSubscriptionInvoice(input: {
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    status?: HostedClawdStripeSubscriptionStatus;
    lastInvoiceId?: string;
    lastPaymentStatus?: string;
    updatedFromEventId: string;
  }): Promise<HostedClawdSubscriptionRecord | null>;
  recordStripeWebhookEventStarted(
    stripeEventId: string,
    eventType: string,
    livemode: boolean,
  ): Promise<HostedClawdWebhookStartResult>;
  markStripeWebhookEventProcessed(stripeEventId: string): Promise<void>;
  markStripeWebhookEventFailed(stripeEventId: string, errorSummary: string): Promise<void>;
};

export function hostedClawdSubscriptionAccessStatus(
  subscription: HostedClawdSubscriptionRecord | null | undefined,
): HostedClawdSubscriptionAccessStatus {
  if (!subscription) return "none";
  if (subscription.status === "active" || subscription.status === "trialing") return "active";
  if (subscription.status === "incomplete") return "activating";
  if (subscription.status === "past_due" || subscription.status === "unpaid") return "payment_failed";
  return "inactive";
}

// Session preview ids from the free Alpha loop must never resolve as persisted
// Clawds; only server-generated ids are owned rows.
export function isSessionOnlyId(id: string): boolean {
  return /^(session|sess|temp|preview|demo)[-_]/i.test(id.trim());
}

export function createInMemoryHostedClawdRepository(): HostedClawdRepository {
  const usersBySubject = new Map<string, HostedClawdUserRecord>();
  const usersById = new Map<string, HostedClawdUserRecord>();
  const usersByStripeCustomerId = new Map<string, HostedClawdUserRecord>();
  const clawds = new Map<string, HostedClawdClawdRecord>();
  const businessProfiles = new Map<string, HostedClawdBusinessProfileRecord>();
  const scoutDrops = new Map<string, HostedClawdScoutDropRecord>();
  const campaigns = new Map<string, HostedClawdCampaignRecord>();
  const usageEvents: Array<{ ownerUserId: string; eventType: string; detail?: string }> = [];
  const idempotencyKeys = new Map<string, HostedClawdSavedRecord[]>();
  const subscriptionsByOwner = new Map<string, HostedClawdSubscriptionRecord>();
  const subscriptionsByStripeId = new Map<string, HostedClawdSubscriptionRecord>();
  const webhookEvents = new Map<
    string,
    { stripeEventId: string; eventType: string; livemode: boolean; status: HostedClawdWebhookEventStatus; errorSummary?: string }
  >();

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
      usersById.set(user.id, user);
      return user;
    },
    async findUserByOidcSubject(oidcSubject) {
      return usersBySubject.get(oidcSubject) ?? null;
    },
    async findUserById(ownerUserId) {
      return usersById.get(ownerUserId) ?? null;
    },
    async findUserByStripeCustomerId(stripeCustomerId) {
      return usersByStripeCustomerId.get(stripeCustomerId) ?? null;
    },
    async attachStripeCustomerToUser(ownerUserId, stripeCustomerId) {
      const user = usersById.get(ownerUserId);
      if (!user) throw new Error("Cannot attach Stripe customer to a missing Hosted Clawd user.");
      if (user.stripeCustomerId) usersByStripeCustomerId.delete(user.stripeCustomerId);
      user.stripeCustomerId = stripeCustomerId;
      usersByStripeCustomerId.set(stripeCustomerId, user);
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
    async listScoutDropsForClawd(ownerUserId, clawdId) {
      return [...scoutDrops.values()]
        .filter((drop) => drop.ownerUserId === ownerUserId && drop.clawdId === clawdId)
        .sort((a, b) => a.scoutPreviewId.localeCompare(b.scoutPreviewId));
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
    async listCampaignDraftsForClawd(ownerUserId, clawdId) {
      return [...campaigns.values()]
        .filter((campaign) => campaign.ownerUserId === ownerUserId && campaign.clawdId === clawdId)
        .sort((a, b) => a.campaignPreviewId.localeCompare(b.campaignPreviewId));
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
    async findSubscriptionForOwner(ownerUserId) {
      return subscriptionsByOwner.get(ownerUserId) ?? null;
    },
    async findSubscriptionByStripeSubscriptionId(stripeSubscriptionId) {
      return subscriptionsByStripeId.get(stripeSubscriptionId) ?? null;
    },
    async upsertSubscription(input) {
      const existing = subscriptionsByStripeId.get(input.stripeSubscriptionId) ?? subscriptionsByOwner.get(input.ownerUserId);
      const record: HostedClawdSubscriptionRecord = {
        id: existing?.id ?? randomUUID(),
        ...existing,
        ...input,
      };
      subscriptionsByOwner.set(record.ownerUserId, record);
      subscriptionsByStripeId.set(record.stripeSubscriptionId, record);
      return record;
    },
    async updateSubscriptionInvoice(input) {
      const existing = subscriptionsByStripeId.get(input.stripeSubscriptionId);
      if (!existing || existing.stripeCustomerId !== input.stripeCustomerId) return null;
      if (input.status) existing.status = input.status;
      if (input.lastInvoiceId) existing.lastInvoiceId = input.lastInvoiceId;
      if (input.lastPaymentStatus) existing.lastPaymentStatus = input.lastPaymentStatus;
      existing.updatedFromEventId = input.updatedFromEventId;
      return existing;
    },
    async recordStripeWebhookEventStarted(stripeEventId, eventType, livemode) {
      const existing = webhookEvents.get(stripeEventId);
      if (existing) return { reused: true, status: existing.status };
      webhookEvents.set(stripeEventId, { stripeEventId, eventType, livemode, status: "processing" });
      return { reused: false, status: "processing" };
    },
    async markStripeWebhookEventProcessed(stripeEventId) {
      const existing = webhookEvents.get(stripeEventId);
      if (existing) existing.status = "processed";
    },
    async markStripeWebhookEventFailed(stripeEventId, errorSummary) {
      const existing = webhookEvents.get(stripeEventId);
      if (existing) {
        existing.status = "failed";
        existing.errorSummary = errorSummary;
      }
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
    async getSubscriptionStatus(auth) {
      const user = await repository.upsertUserByOidcSubject(auth.subject, auth.email);
      const subscription = await repository.findSubscriptionForOwner(user.id);
      return hostedClawdSubscriptionAccessStatus(subscription);
    },

    async readSavedState(auth) {
      const user = await repository.findUserByOidcSubject(auth.subject);
      if (!user) return emptySavedState("none", "no_saved_clawd");

      const subscription = await repository.findSubscriptionForOwner(user.id);
      const subscriptionStatus = hostedClawdSubscriptionAccessStatus(subscription);
      const clawd = await repository.findClawdForOwner(user.id);
      if (!clawd) return emptySavedState(subscriptionStatus, "no_saved_clawd");

      const [businessProfile, scoutDrops, campaignDrafts] = await Promise.all([
        repository.findBusinessProfile(user.id, clawd.id),
        repository.listScoutDropsForClawd(user.id, clawd.id),
        repository.listCampaignDraftsForClawd(user.id, clawd.id),
      ]);

      return {
        type: "hostedClawdSavedState",
        clawd: {
          id: clawd.id,
          name: clawd.name,
          status: clawd.status,
        },
        ...(businessProfile
          ? {
              businessProfile: {
                id: businessProfile.id,
                name: businessProfile.businessName,
                businessType: businessProfile.businessType,
                countySlug: businessProfile.countySlug,
                countyLabel: businessProfile.countyLabel,
                placeLabel: businessProfile.placeLabel,
              },
            }
          : {}),
        scoutDrops: scoutDrops.map((drop) => ({
          id: drop.id,
          scoutPreviewId: drop.scoutPreviewId,
          countySlug: drop.countySlug,
        })),
        campaignDrafts: campaignDrafts.map((campaign) => ({
          id: campaign.id,
          campaignPreviewId: campaign.campaignPreviewId,
          summary: campaign.summary,
          status: campaign.status,
        })),
        subscriptionStatus,
        paidWrites: subscriptionStatus === "active" ? "enabled" : "read_only",
        readOnlyReason: readOnlyReasonForSavedState(subscriptionStatus),
      };
    },

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

function emptySavedState(
  subscriptionStatus: HostedClawdSubscriptionAccessStatus,
  readOnlyReason: HostedClawdSavedStateSummary["readOnlyReason"],
): HostedClawdSavedStateSummary {
  return {
    type: "hostedClawdSavedState",
    scoutDrops: [],
    campaignDrafts: [],
    subscriptionStatus,
    paidWrites: subscriptionStatus === "active" ? "enabled" : "read_only",
    readOnlyReason,
  };
}

function readOnlyReasonForSavedState(
  subscriptionStatus: HostedClawdSubscriptionAccessStatus,
): HostedClawdSavedStateSummary["readOnlyReason"] {
  switch (subscriptionStatus) {
    case "active":
      return "none";
    case "payment_failed":
      return "billing_attention";
    case "none":
    case "activating":
    case "inactive":
    default:
      return "subscription_inactive";
  }
}
