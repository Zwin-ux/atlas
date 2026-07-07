import assert from "node:assert/strict";
import test from "node:test";
import { HOSTED_CLAWD_READ_SCOPE, HOSTED_CLAWD_WRITE_SCOPE, type HostedClawdAuthContext } from "../src/hostedClawd/auth.js";
import {
  createHostedClawdRepositoryPersistence,
  createInMemoryHostedClawdRepository,
  type HostedClawdRepository,
  type HostedClawdStripeSubscriptionStatus,
} from "../src/hostedClawd/repository.js";
import { HostedClawdService } from "../src/hostedClawd/service.js";

const writeAuth: HostedClawdAuthContext = {
  subject: "oidc|saved-owner",
  email: "saved-owner@atlas.test",
  scopes: [HOSTED_CLAWD_READ_SCOPE, HOSTED_CLAWD_WRITE_SCOPE],
};

const readAuth: HostedClawdAuthContext = {
  subject: "oidc|saved-owner",
  email: "saved-owner@atlas.test",
  scopes: [HOSTED_CLAWD_READ_SCOPE],
};

const otherReadAuth: HostedClawdAuthContext = {
  subject: "oidc|other-owner",
  email: "other-owner@atlas.test",
  scopes: [HOSTED_CLAWD_READ_SCOPE],
};

function makeSavedReadFixture() {
  const repository = createInMemoryHostedClawdRepository();
  const service = new HostedClawdService({
    flags: { persistenceEnabled: true, moneyEnabled: true, publicClaimEnabled: false },
    persistence: createHostedClawdRepositoryPersistence(repository),
  });
  return { repository, service };
}

async function setSubscription(
  repository: HostedClawdRepository,
  status: HostedClawdStripeSubscriptionStatus,
): Promise<void> {
  const user = await repository.upsertUserByOidcSubject(writeAuth.subject, writeAuth.email);
  await repository.attachStripeCustomerToUser(user.id, "cus_saved_owner");
  await repository.upsertSubscription({
    ownerUserId: user.id,
    stripeCustomerId: "cus_saved_owner",
    stripeSubscriptionId: "sub_saved_owner",
    stripePriceId: "price_hosted_clawd_monthly",
    stripeProductId: "prod_hosted_clawd",
    status,
    cancelAtPeriodEnd: false,
    updatedFromEventId: `evt_saved_${status}`,
  });
}

async function seedSavedCampaign(
  service: HostedClawdService,
  repository: HostedClawdRepository,
  subscriptionStatus: HostedClawdStripeSubscriptionStatus = "active",
) {
  await service.createOrAttachClawd({ businessName: "Eastvale Detail Lab", clientRequestId: "create-saved" }, writeAuth);
  await setSubscription(repository, subscriptionStatus);
  await service.promoteSession(
    {
      businessName: "Eastvale Detail Lab",
      businessType: "mobile detailing",
      countySlug: "riverside-ca",
      countyLabel: "Riverside County",
      placeLabel: "Eastvale",
      scoutPreviewId: "scout-saved-1",
      clientRequestId: "promote-saved",
    },
    writeAuth,
  );
  await service.saveCampaignArtifact(
    {
      campaignPreviewId: "campaign-saved-1",
      scoutPreviewId: "scout-saved-1",
      campaignSummary: "7-day Eastvale detailing campaign",
      clientRequestId: "campaign-saved",
    },
    writeAuth,
  );
}

test("saved read requires a linked account", async () => {
  const { service } = makeSavedReadFixture();
  const response = await service.readSavedState();
  assert.equal(response.status, "blocked");
  assert.equal(response.reason, "auth_required");
  assert.equal(response.operation, "read_saved_state");
});

test("empty saved read does not create owner rows", async () => {
  const { service, repository } = makeSavedReadFixture();
  const response = await service.readSavedState({}, readAuth);
  assert.equal(response.status, "accepted");
  assert.equal(response.savedState?.readOnlyReason, "no_saved_clawd");
  assert.equal(response.savedState?.scoutDrops.length, 0);
  assert.equal(response.savedState?.campaignDrafts.length, 0);
  assert.equal(await repository.findUserByOidcSubject(readAuth.subject), null);
});

test("read scope can load saved state without write scope", async () => {
  const { service, repository } = makeSavedReadFixture();
  await seedSavedCampaign(service, repository);

  const response = await service.readSavedState({}, readAuth);

  assert.equal(response.status, "accepted");
  assert.equal(response.savedState?.subscriptionStatus, "active");
  assert.equal(response.savedState?.paidWrites, "enabled");
  assert.equal(response.savedState?.businessProfile?.name, "Eastvale Detail Lab");
  assert.equal(response.savedState?.scoutDrops[0]?.scoutPreviewId, "scout-saved-1");
  assert.equal(response.savedState?.campaignDrafts[0]?.campaignPreviewId, "campaign-saved-1");
  assert.equal(response.context.savedState?.campaignDrafts[0]?.summary, "7-day Eastvale detailing campaign");
});

test("owner scoped read does not expose another owner saved state", async () => {
  const { service, repository } = makeSavedReadFixture();
  await seedSavedCampaign(service, repository);

  const response = await service.readSavedState({}, otherReadAuth);

  assert.equal(response.status, "accepted");
  assert.equal(response.savedState?.clawd, undefined);
  assert.equal(response.savedState?.businessProfile, undefined);
  assert.equal(response.savedState?.scoutDrops.length, 0);
  assert.equal(response.savedState?.campaignDrafts.length, 0);
});

test("payment failure keeps saved history readable but paid writes read-only", async () => {
  const { service, repository } = makeSavedReadFixture();
  await seedSavedCampaign(service, repository, "active");
  await setSubscription(repository, "past_due");

  const response = await service.readSavedState({}, readAuth);

  assert.equal(response.status, "accepted");
  assert.equal(response.screenState, "inactive_payment_failed");
  assert.equal(response.savedState?.subscriptionStatus, "payment_failed");
  assert.equal(response.savedState?.paidWrites, "read_only");
  assert.equal(response.savedState?.readOnlyReason, "billing_attention");
  assert.equal(response.savedState?.campaignDrafts.length, 1);
});
