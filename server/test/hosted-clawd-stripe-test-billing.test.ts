import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import { HOSTED_CLAWD_READ_SCOPE, HOSTED_CLAWD_WRITE_SCOPE, type HostedClawdAuthContext } from "../src/hostedClawd/auth.js";
import {
  constructHostedClawdStripeEvent,
  createStripeHostedClawdBillingPort,
  handleHostedClawdStripeWebhook,
  readHostedClawdBillingConfig,
  type HostedClawdStripeClient,
} from "../src/hostedClawd/billing.js";
import {
  createHostedClawdRepositoryPersistence,
  createInMemoryHostedClawdRepository,
  hostedClawdSubscriptionAccessStatus,
} from "../src/hostedClawd/repository.js";
import { HostedClawdService } from "../src/hostedClawd/service.js";

const auth: HostedClawdAuthContext = {
  subject: "oidc|billing-owner",
  email: "billing-owner@atlas.test",
  scopes: [HOSTED_CLAWD_READ_SCOPE, HOSTED_CLAWD_WRITE_SCOPE],
};

const billingConfig = {
  secretKey: "sk_test_atlas",
  webhookSecret: "whsec_atlas",
  priceId: "price_hosted_clawd_monthly",
  appBaseUrl: "http://localhost:8787",
  apiVersion: "2026-02-25.clover",
};

function makeFakeStripe() {
  const calls: Record<string, unknown[]> = {
    customersCreate: [],
    checkoutCreate: [],
    portalCreate: [],
  };
  const stripe = {
    customers: {
      async create(params: unknown) {
        calls.customersCreate.push(params);
        return { id: "cus_test_owner" };
      },
    },
    checkout: {
      sessions: {
        async create(params: unknown) {
          calls.checkoutCreate.push(params);
          return { id: "cs_test_owner", url: "https://checkout.stripe.test/cs_test_owner" };
        },
      },
    },
    billingPortal: {
      sessions: {
        async create(params: unknown) {
          calls.portalCreate.push(params);
          return { id: "bps_test_owner", url: "https://billing.stripe.test/bps_test_owner" };
        },
      },
    },
    subscriptions: {},
    webhooks: {
      constructEvent() {
        throw new Error("unused fake webhook");
      },
    },
  } as unknown as HostedClawdStripeClient;
  return { stripe, calls };
}

function makeBillingFixture() {
  const repository = createInMemoryHostedClawdRepository();
  const { stripe, calls } = makeFakeStripe();
  const billing = createStripeHostedClawdBillingPort({ stripe, repository, config: billingConfig });
  const service = new HostedClawdService({
    flags: { persistenceEnabled: true, moneyEnabled: true, publicClaimEnabled: false },
    persistence: createHostedClawdRepositoryPersistence(repository),
    billing,
  });
  return { repository, service, calls };
}

test("money-off checkout remains closed", async () => {
  const service = new HostedClawdService({
    flags: { persistenceEnabled: true, moneyEnabled: false, publicClaimEnabled: false },
  });
  const response = await service.startCheckout({ businessName: "Test Gym" }, auth);
  assert.equal(response.status, "waitlist");
  assert.equal(response.reason, "money_not_enabled");
});

test("checkout requires authenticated owner when billing is configured", async () => {
  const { service } = makeBillingFixture();
  const response = await service.startCheckout({ businessName: "Test Gym" });
  assert.equal(response.status, "blocked");
  assert.equal(response.reason, "auth_required");
});

test("checkout requires an owned Hosted Clawd before creating a Stripe session", async () => {
  const { service, calls } = makeBillingFixture();
  const response = await service.startCheckout({ businessName: "Test Gym" }, auth);
  assert.equal(response.status, "blocked");
  assert.equal(response.reason, "account_setup_required");
  assert.equal(calls.checkoutCreate.length, 0);
});

test("checkout creates subscription session with server-owned price and no access grant", async () => {
  const { service, calls } = makeBillingFixture();
  await service.createOrAttachClawd({ businessName: "Test Gym" }, auth);
  const response = await service.startCheckout({ businessName: "Test Gym", countySlug: "riverside-ca" }, auth);
  assert.equal(response.status, "accepted");
  assert.equal(response.reason, "ready");
  assert.equal(response.screenState, "activating");
  assert.equal(response.redirectUrl, "https://checkout.stripe.test/cs_test_owner");
  assert.equal(response.billing?.returnUrlGrantsAccess, false);
  assert.equal(response.context.canUsePaidWrites, false);

  const checkout = calls.checkoutCreate[0] as {
    mode: string;
    line_items: Array<{ price: string; quantity: number }>;
    success_url: string;
    client_reference_id: string;
    metadata: Record<string, string>;
  };
  assert.equal(checkout.mode, "subscription");
  assert.equal(checkout.line_items[0]?.price, billingConfig.priceId);
  assert.match(checkout.success_url, /session_id=\{CHECKOUT_SESSION_ID\}/);
  assert.equal(checkout.metadata.hosted_clawd, "true");
  assert.ok(checkout.client_reference_id);
});

test("portal requires owner-attached Stripe customer and stays owner checked", async () => {
  const { service, repository, calls } = makeBillingFixture();
  await service.createOrAttachClawd({ businessName: "Test Gym" }, auth);
  const missing = await service.openBillingPortal({}, auth);
  assert.equal(missing.status, "blocked");
  assert.equal(missing.reason, "billing_customer_not_found");

  const user = await repository.upsertUserByOidcSubject(auth.subject, auth.email);
  await repository.attachStripeCustomerToUser(user.id, "cus_test_owner");
  const opened = await service.openBillingPortal({}, auth);
  assert.equal(opened.status, "accepted");
  assert.equal(opened.redirectUrl, "https://billing.stripe.test/bps_test_owner");
  assert.equal(calls.portalCreate.length, 1);
  assert.deepEqual(calls.portalCreate[0], {
    customer: "cus_test_owner",
    return_url: "http://localhost:8787/preview?hosted_clawd=portal_return",
  });
});

test("webhook replay is idempotent and subscription status gates paid writes", async () => {
  const repository = createInMemoryHostedClawdRepository();
  const user = await repository.upsertUserByOidcSubject(auth.subject, auth.email);
  await repository.attachStripeCustomerToUser(user.id, "cus_test_owner");

  const activeEvent = stripeEvent({
    id: "evt_sub_active",
    type: "customer.subscription.updated",
    object: stripeSubscription({ status: "active" }),
  });
  const first = await handleHostedClawdStripeWebhook(repository, activeEvent);
  const replay = await handleHostedClawdStripeWebhook(repository, activeEvent);
  assert.equal(first.reused, false);
  assert.equal(first.subscriptionStatus, "active");
  assert.equal(replay.reused, true);

  const subscription = await repository.findSubscriptionForOwner(user.id);
  assert.equal(hostedClawdSubscriptionAccessStatus(subscription), "active");

  const failed = await handleHostedClawdStripeWebhook(
    repository,
    stripeEvent({
      id: "evt_invoice_failed",
      type: "invoice.payment_failed",
      object: {
        id: "in_failed",
        object: "invoice",
        customer: "cus_test_owner",
        subscription: "sub_test_owner",
      },
    }),
  );
  assert.equal(failed.subscriptionStatus, "payment_failed");
  const afterFailure = await repository.findSubscriptionForOwner(user.id);
  assert.equal(hostedClawdSubscriptionAccessStatus(afterFailure), "payment_failed");
});

test("webhook signature uses raw body and rejects modified payloads", () => {
  const stripe = new Stripe("sk_test_signature", { apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion });
  const payload = JSON.stringify({
    id: "evt_signature",
    object: "event",
    livemode: false,
    type: "customer.subscription.updated",
    data: { object: { id: "sub_signature", object: "subscription" } },
  });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: billingConfig.webhookSecret });
  const event = constructHostedClawdStripeEvent({
    stripe,
    rawBody: Buffer.from(payload),
    signature,
    webhookSecret: billingConfig.webhookSecret,
  });
  assert.equal(event.id, "evt_signature");

  assert.throws(
    () =>
      constructHostedClawdStripeEvent({
        stripe,
        rawBody: Buffer.from(payload.replace("evt_signature", "evt_tampered")),
        signature,
        webhookSecret: billingConfig.webhookSecret,
      }),
    /signature/i,
  );
});

test("billing config rejects live secret keys for 0.62H test billing", () => {
  assert.throws(
    () =>
      readHostedClawdBillingConfig({
        STRIPE_SECRET_KEY: "sk_live_bad",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
        STRIPE_HOSTED_CLAWD_PRICE_ID: "price_test",
      } as NodeJS.ProcessEnv),
    /test-mode/,
  );
});

function stripeEvent(input: { id: string; type: string; object: unknown }): Stripe.Event {
  return {
    id: input.id,
    object: "event",
    api_version: "2026-02-25.clover",
    created: 1,
    data: { object: input.object },
    livemode: false,
    pending_webhooks: 0,
    request: null,
    type: input.type,
  } as Stripe.Event;
}

function stripeSubscription(input: { status: Stripe.Subscription.Status }) {
  return {
    id: "sub_test_owner",
    object: "subscription",
    customer: "cus_test_owner",
    status: input.status,
    cancel_at_period_end: false,
    items: {
      object: "list",
      data: [
        {
          id: "si_test_owner",
          object: "subscription_item",
          current_period_start: 1,
          current_period_end: 2,
          price: {
            id: billingConfig.priceId,
            object: "price",
            product: "prod_hosted_clawd",
          },
        },
      ],
    },
    latest_invoice: "in_test_owner",
    trial_end: null,
  };
}
