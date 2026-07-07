import Stripe from "stripe";
import type { HostedClawdAuthContext } from "./auth.js";
import {
  hostedClawdSubscriptionAccessStatus,
  type HostedClawdRepository,
  type HostedClawdStripeSubscriptionStatus,
  type HostedClawdSubscriptionRecord,
} from "./repository.js";
import type { HostedClawdBillingActionResult, HostedClawdContextInput } from "./types.js";

const DEFAULT_STRIPE_API_VERSION = "2026-02-25.clover";

export type HostedClawdBillingConfig = {
  secretKey: string;
  webhookSecret: string;
  priceId: string;
  appBaseUrl: string;
  apiVersion: string;
};

export type HostedClawdStripeClient = Pick<Stripe, "checkout" | "billingPortal" | "customers" | "subscriptions" | "webhooks">;

export function readHostedClawdBillingConfig(env: NodeJS.ProcessEnv): HostedClawdBillingConfig | undefined {
  const secretKey = env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim();
  const priceId = env.STRIPE_HOSTED_CLAWD_PRICE_ID?.trim();
  const appBaseUrl = (env.APP_BASE_URL?.trim() || `http://localhost:${env.PORT?.trim() || "8787"}`).replace(/\/+$/, "");
  const apiVersion = env.STRIPE_API_VERSION?.trim() || DEFAULT_STRIPE_API_VERSION;

  if (!secretKey || !webhookSecret || !priceId) return undefined;
  if (secretKey.startsWith("sk_live_")) {
    throw new Error("Hosted Clawd 0.62H accepts only Stripe test-mode secret keys.");
  }
  return { secretKey, webhookSecret, priceId, appBaseUrl, apiVersion };
}

export function createStripeHostedClawdClient(config: HostedClawdBillingConfig): Stripe {
  return new Stripe(config.secretKey, {
    apiVersion: config.apiVersion as never,
    appInfo: {
      name: "Atlas Hosted Clawd",
      version: "0.62H",
    },
  });
}

export function createStripeHostedClawdBillingPort({
  stripe,
  repository,
  config,
}: {
  stripe: HostedClawdStripeClient;
  repository: HostedClawdRepository;
  config: HostedClawdBillingConfig;
}) {
  return {
    async startCheckout(auth: HostedClawdAuthContext, input: HostedClawdContextInput): Promise<HostedClawdBillingActionResult> {
      const user = await repository.upsertUserByOidcSubject(auth.subject, auth.email);
      const clawd = await repository.findClawdForOwner(user.id);
      if (!clawd) {
        return billingBlocked(
          "account_setup_required",
          "Create and save this Hosted Clawd before opening test Checkout.",
          "create_hosted_clawd",
          "none",
        );
      }

      const existing = await repository.findSubscriptionForOwner(user.id);
      const subscriptionStatus = hostedClawdSubscriptionAccessStatus(existing);
      if (subscriptionStatus === "active") {
        return {
          status: "blocked",
          reason: "billing_subscription_not_active",
          message: "Billing is already confirmed for this Clawd. Use the billing portal for changes.",
          nextAction: "open_billing_portal",
          subscriptionStatus,
          billing: billingActionMeta({ subscriptionStatus, confirmationSource: "webhook" }),
        };
      }

      const stripeCustomerId = await ensureStripeCustomerId({ stripe, repository, user, auth, input });
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: stripeCustomerId,
        client_reference_id: user.id,
        line_items: [{ price: config.priceId, quantity: 1 }],
        success_url: `${config.appBaseUrl}/preview?hosted_clawd=checkout_return&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.appBaseUrl}/preview?hosted_clawd=checkout_cancel`,
        metadata: {
          atlas_owner_user_id: user.id,
          atlas_clawd_id: clawd.id,
          atlas_county_slug: input.countySlug ?? "riverside-ca",
          hosted_clawd: "true",
        },
        subscription_data: {
          metadata: {
            atlas_owner_user_id: user.id,
            atlas_clawd_id: clawd.id,
            hosted_clawd: "true",
          },
        },
      });

      return {
        status: "accepted",
        reason: "ready",
        message: "Opening Stripe test Checkout. Atlas will check billing before saving turns on.",
        nextAction: "refresh_status",
        subscriptionStatus: "activating",
        redirectUrl: checkoutSession.url ?? undefined,
        billing: billingActionMeta({
          checkoutSessionId: checkoutSession.id,
          subscriptionStatus: "activating",
          confirmationSource: "none",
        }),
      };
    },

    async openBillingPortal(auth: HostedClawdAuthContext, input: HostedClawdContextInput): Promise<HostedClawdBillingActionResult> {
      const user = await repository.upsertUserByOidcSubject(auth.subject, auth.email);
      if (!user.stripeCustomerId) {
        return billingBlocked(
          "billing_customer_not_found",
          "No Stripe customer is attached to this Clawd yet.",
          "continue_to_stripe",
          "none",
        );
      }

      const subscription = await repository.findSubscriptionForOwner(user.id);
      const subscriptionStatus = hostedClawdSubscriptionAccessStatus(subscription);
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${config.appBaseUrl}/preview?hosted_clawd=portal_return`,
      });

      return {
        status: "accepted",
        reason: "ready",
        message: "Opening Stripe Customer Portal. Atlas checks the signed-in account first.",
        nextAction: input.subscriptionStatus === "payment_failed" ? "open_billing_portal" : "refresh_status",
        subscriptionStatus,
        redirectUrl: portalSession.url,
        billing: billingActionMeta({
          portalSessionId: portalSession.id,
          subscriptionStatus,
          confirmationSource: subscriptionStatus === "active" ? "webhook" : "none",
        }),
      };
    },
  };
}

export type HostedClawdStripeWebhookResult = {
  ok: true;
  stripeEventId: string;
  eventType: string;
  reused: boolean;
  subscriptionStatus?: NonNullable<HostedClawdContextInput["subscriptionStatus"]>;
};

export function constructHostedClawdStripeEvent({
  stripe,
  rawBody,
  signature,
  webhookSecret,
}: {
  stripe: HostedClawdStripeClient;
  rawBody: Buffer;
  signature: string | undefined;
  webhookSecret: string;
}): Stripe.Event {
  if (!signature) {
    throw new Error("Missing Stripe-Signature header.");
  }
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

export async function handleHostedClawdStripeWebhook(
  repository: HostedClawdRepository,
  event: Stripe.Event,
): Promise<HostedClawdStripeWebhookResult> {
  const started = await repository.recordStripeWebhookEventStarted(event.id, event.type, event.livemode);
  if (started.reused) {
    return { ok: true, stripeEventId: event.id, eventType: event.type, reused: true };
  }

  try {
    const subscriptionStatus = await applyStripeEvent(repository, event);
    await repository.markStripeWebhookEventProcessed(event.id);
    return {
      ok: true,
      stripeEventId: event.id,
      eventType: event.type,
      reused: false,
      subscriptionStatus,
    };
  } catch (error) {
    await repository.markStripeWebhookEventFailed(event.id, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function ensureStripeCustomerId({
  stripe,
  repository,
  user,
  auth,
  input,
}: {
  stripe: HostedClawdStripeClient;
  repository: HostedClawdRepository;
  user: { id: string; email?: string; stripeCustomerId?: string };
  auth: HostedClawdAuthContext;
  input: HostedClawdContextInput;
}): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe.customers.create({
    email: auth.email,
    name: input.businessName ?? input.businessType ?? undefined,
    metadata: {
      atlas_owner_user_id: user.id,
      hosted_clawd: "true",
    },
  });
  await repository.attachStripeCustomerToUser(user.id, customer.id);
  return customer.id;
}

async function applyStripeEvent(
  repository: HostedClawdRepository,
  event: Stripe.Event,
): Promise<NonNullable<HostedClawdContextInput["subscriptionStatus"]> | undefined> {
  switch (event.type) {
    case "checkout.session.completed":
      return applyCheckoutSessionCompleted(repository, event);
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return applySubscriptionEvent(repository, event);
    case "invoice.paid":
      return applyInvoiceEvent(repository, event, "paid");
    case "invoice.payment_failed":
      return applyInvoiceEvent(repository, event, "payment_failed");
    default:
      return undefined;
  }
}

async function applyCheckoutSessionCompleted(
  repository: HostedClawdRepository,
  event: Stripe.Event,
): Promise<NonNullable<HostedClawdContextInput["subscriptionStatus"]> | undefined> {
  const session = event.data.object as Stripe.Checkout.Session;
  const customerId = stripeObjectId(session.customer);
  if (!customerId) return undefined;

  const ownerUserId = session.client_reference_id ?? session.metadata?.atlas_owner_user_id;
  if (ownerUserId) {
    await repository.attachStripeCustomerToUser(ownerUserId, customerId);
  }

  const subscriptionId = stripeObjectId(session.subscription);
  if (!subscriptionId || !ownerUserId) return "activating";
  const user = await repository.findUserById(ownerUserId);
  if (!user) return "activating";
  const subscription = await repository.upsertSubscription({
    ownerUserId: user.id,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    status: "incomplete",
    cancelAtPeriodEnd: false,
    updatedFromEventId: event.id,
  });
  return hostedClawdSubscriptionAccessStatus(subscription);
}

async function applySubscriptionEvent(
  repository: HostedClawdRepository,
  event: Stripe.Event,
): Promise<NonNullable<HostedClawdContextInput["subscriptionStatus"]> | undefined> {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = stripeObjectId(subscription.customer);
  if (!customerId) return undefined;
  const user = await repository.findUserByStripeCustomerId(customerId);
  if (!user) return undefined;
  const row = await repository.upsertSubscription(subscriptionInputFromStripe(user.id, subscription, event.id));
  return hostedClawdSubscriptionAccessStatus(row);
}

async function applyInvoiceEvent(
  repository: HostedClawdRepository,
  event: Stripe.Event,
  paymentStatus: "paid" | "payment_failed",
): Promise<NonNullable<HostedClawdContextInput["subscriptionStatus"]> | undefined> {
  const invoice = event.data.object as Stripe.Invoice;
  const customerId = stripeObjectId(invoice.customer);
  const subscriptionId = stripeObjectId(invoiceSubscription(invoice));
  if (!customerId || !subscriptionId) return undefined;
  const subscription = await repository.updateSubscriptionInvoice({
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    status: paymentStatus === "payment_failed" ? "past_due" : undefined,
    lastInvoiceId: invoice.id,
    lastPaymentStatus: paymentStatus,
    updatedFromEventId: event.id,
  });
  return hostedClawdSubscriptionAccessStatus(subscription);
}

function subscriptionInputFromStripe(
  ownerUserId: string,
  subscription: Stripe.Subscription,
  updatedFromEventId: string,
): Omit<HostedClawdSubscriptionRecord, "id"> {
  const firstItem = subscription.items.data[0];
  const price = firstItem?.price;
  return {
    ownerUserId,
    stripeCustomerId: requireStripeObjectId(subscription.customer, "subscription.customer"),
    stripeSubscriptionId: subscription.id,
    stripePriceId: price?.id,
    stripeProductId: stripeObjectId(price?.product),
    status: stripeSubscriptionStatus(subscription.status),
    currentPeriodStart: secondsToIso(firstItem?.current_period_start),
    currentPeriodEnd: secondsToIso(firstItem?.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: secondsToIso(subscription.trial_end),
    lastInvoiceId: stripeObjectId(subscription.latest_invoice),
    updatedFromEventId,
  };
}

function billingBlocked(
  reason: HostedClawdBillingActionResult["reason"],
  message: string,
  nextAction: HostedClawdBillingActionResult["nextAction"],
  subscriptionStatus: NonNullable<HostedClawdContextInput["subscriptionStatus"]>,
): HostedClawdBillingActionResult {
  return {
    status: "blocked",
    reason,
    message,
    nextAction,
    subscriptionStatus,
    billing: billingActionMeta({ subscriptionStatus, confirmationSource: "none" }),
  };
}

function billingActionMeta(input: {
  checkoutSessionId?: string;
  portalSessionId?: string;
  subscriptionStatus: NonNullable<HostedClawdContextInput["subscriptionStatus"]>;
  confirmationSource: "none" | "webhook";
}): HostedClawdBillingActionResult["billing"] {
  return {
    ...input,
    returnUrlGrantsAccess: false,
  };
}

function stripeSubscriptionStatus(value: Stripe.Subscription.Status): HostedClawdStripeSubscriptionStatus {
  switch (value) {
    case "active":
    case "trialing":
    case "incomplete":
    case "incomplete_expired":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "paused":
      return value;
    default:
      return "incomplete";
  }
}

function stripeObjectId(value: string | { id: string } | null | undefined): string | undefined {
  if (typeof value === "string") return value;
  return value?.id;
}

function requireStripeObjectId(value: string | { id: string } | null | undefined, label: string): string {
  const id = stripeObjectId(value);
  if (!id) throw new Error(`Stripe ${label} did not contain an id.`);
  return id;
}

function invoiceSubscription(invoice: Stripe.Invoice): string | { id: string } | null | undefined {
  const invoiceWithSubscription = invoice as Stripe.Invoice & { subscription?: string | { id: string } | null };
  return invoiceWithSubscription.subscription;
}

function secondsToIso(value: number | null | undefined): string | undefined {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : undefined;
}
