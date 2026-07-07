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

const auth: HostedClawdAuthContext = {
  subject: "oidc|protected-owner",
  email: "protected-owner@atlas.test",
  scopes: [HOSTED_CLAWD_READ_SCOPE, HOSTED_CLAWD_WRITE_SCOPE],
};

function makeProtectedGateFixture() {
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
  const user = await repository.upsertUserByOidcSubject(auth.subject, auth.email);
  await repository.attachStripeCustomerToUser(user.id, "cus_protected_owner");
  await repository.upsertSubscription({
    ownerUserId: user.id,
    stripeCustomerId: "cus_protected_owner",
    stripeSubscriptionId: "sub_protected_owner",
    stripePriceId: "price_hosted_clawd_monthly",
    stripeProductId: "prod_hosted_clawd",
    status,
    cancelAtPeriodEnd: false,
    updatedFromEventId: `evt_${status}`,
  });
}

test("create-or-attach stays open before subscription so checkout can start", async () => {
  const { service } = makeProtectedGateFixture();
  const response = await service.createOrAttachClawd({ businessName: "Test Gym" }, auth);
  assert.equal(response.status, "accepted");
  assert.equal(response.reason, "ready");
  assert.equal(response.context.screenState, "checkout_pending");
  assert.equal(response.context.canUsePaidWrites, false);
});

test("client-supplied active status does not unlock protected Scout writes", async () => {
  const { service, repository } = makeProtectedGateFixture();
  await service.createOrAttachClawd({ businessName: "Test Gym" }, auth);

  const response = await service.promoteSession(
    {
      businessName: "Test Gym",
      countySlug: "riverside-ca",
      scoutPreviewId: "scout-preview-1",
      subscriptionStatus: "active",
    },
    auth,
  );

  assert.equal(response.status, "blocked");
  assert.equal(response.reason, "billing_subscription_not_active");
  assert.equal(response.screenState, "checkout_pending");
  assert.equal(response.nextAction, "continue_to_stripe");
  assert.equal(response.context.canUsePaidWrites, false);

  const user = await repository.upsertUserByOidcSubject(auth.subject, auth.email);
  const clawd = await repository.findClawdForOwner(user.id);
  assert.ok(clawd);
  assert.equal(await repository.findBusinessProfile(user.id, clawd.id), null);
});

test("checkout return or incomplete subscription keeps paid writes read-only", async () => {
  const { service, repository } = makeProtectedGateFixture();
  await service.createOrAttachClawd({ businessName: "Test Gym" }, auth);
  await setSubscription(repository, "incomplete");

  const response = await service.promoteSession(
    { businessName: "Test Gym", countySlug: "riverside-ca", scoutPreviewId: "scout-preview-1" },
    auth,
  );

  assert.equal(response.status, "blocked");
  assert.equal(response.reason, "billing_subscription_not_active");
  assert.equal(response.screenState, "activating");
  assert.equal(response.nextAction, "refresh_status");
  assert.match(response.message, /New saves need confirmed billing/);
});

test("webhook-confirmed active subscription opens protected Scout and Campaign writes", async () => {
  const { service, repository } = makeProtectedGateFixture();
  await service.createOrAttachClawd({ businessName: "Test Gym" }, auth);
  await setSubscription(repository, "active");

  const promoted = await service.promoteSession(
    {
      businessName: "Test Gym",
      countySlug: "riverside-ca",
      scoutPreviewId: "scout-preview-1",
      clientRequestId: "promote-active",
    },
    auth,
  );
  assert.equal(promoted.status, "accepted");
  assert.equal(promoted.screenState, "active");
  assert.equal(promoted.context.canUsePaidWrites, true);
  assert.ok(promoted.saved?.some((record) => record.kind === "business_profile"));
  assert.ok(promoted.saved?.some((record) => record.kind === "scout_drop"));

  const savedCampaign = await service.saveCampaignArtifact(
    {
      campaignPreviewId: "campaign-preview-1",
      scoutPreviewId: "scout-preview-1",
      campaignSummary: "7-day local campaign draft",
      clientRequestId: "campaign-active",
    },
    auth,
  );
  assert.equal(savedCampaign.status, "accepted");
  assert.equal(savedCampaign.screenState, "active");
  assert.equal(savedCampaign.context.canUsePaidWrites, true);
  assert.equal(savedCampaign.saved?.[0]?.kind, "campaign_draft");
});

test("payment failure pauses new protected paid writes but keeps owner portal path", async () => {
  const { service, repository } = makeProtectedGateFixture();
  await service.createOrAttachClawd({ businessName: "Test Gym" }, auth);
  await setSubscription(repository, "past_due");

  const response = await service.saveCampaignArtifact(
    { campaignPreviewId: "campaign-preview-1", campaignSummary: "draft" },
    auth,
  );

  assert.equal(response.status, "blocked");
  assert.equal(response.reason, "billing_subscription_not_active");
  assert.equal(response.screenState, "inactive_payment_failed");
  assert.equal(response.nextAction, "open_billing_portal");
  assert.equal(response.context.billing.paidWrites, "read_only");
});
