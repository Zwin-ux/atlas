import {
  HOSTED_CLAWD_MONEY_FLAG,
  HOSTED_CLAWD_PERSISTENCE_FLAG,
  HOSTED_CLAWD_PUBLIC_CLAIM_FLAG,
  HUMAN_APPROVAL_BEFORE_MONEY,
  HUMAN_APPROVAL_BEFORE_PERSISTENCE,
  HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM,
} from "./gates.js";
import { hasReadScope, hasWriteScope, type HostedClawdAuthContext } from "./auth.js";
import type {
  HostedClawdActionKind,
  HostedClawdActionOperation,
  HostedClawdActionResponse,
  HostedClawdBillingActionResult,
  HostedClawdBillingPort,
  HostedClawdBillingSummary,
  HostedClawdCampaignArtifactInput,
  HostedClawdContext,
  HostedClawdContextInput,
  HostedClawdCreateOrAttachInput,
  HostedClawdFeatureFlags,
  HostedClawdGateStatus,
  HostedClawdPersistencePort,
  HostedClawdPersistResult,
  HostedClawdPrimaryAction,
  HostedClawdPromotionInput,
  HostedClawdSavePreviewItem,
  HostedClawdSavedStateSummary,
  HostedClawdScreenState,
  HostedClawdSubscriptionAccessStatus,
  HostedClawdTrigger,
} from "./types.js";

export type HostedClawdServiceOptions = {
  flags?: HostedClawdFeatureFlags;
  persistence?: HostedClawdPersistencePort;
  billing?: HostedClawdBillingPort;
};

export class HostedClawdService {
  private readonly flags: HostedClawdFeatureFlags;
  private readonly persistence?: HostedClawdPersistencePort;
  private readonly billing?: HostedClawdBillingPort;

  constructor(options: HostedClawdServiceOptions = {}) {
    this.flags = options.flags ?? readHostedClawdFeatureFlags(process.env);
    this.persistence = options.persistence;
    this.billing = options.billing;
  }

  getContext(input: HostedClawdContextInput = {}): HostedClawdContext {
    const trigger = input.trigger ?? "map_tray";
    const screenState = this.screenState(input);
    const mode = screenState === "waitlist" ? "alpha_free" : this.flags.moneyEnabled ? "beta_paid" : "beta_invite";
    const primaryAction = this.primaryActionForState(screenState);

    return {
      type: "hostedClawdContext",
      mode,
      screenState,
      trigger,
      statusLabel: statusLabelForState(screenState),
      contextLabel: contextLabel(input),
      primaryCopy: primaryCopyForState(screenState),
      secondaryCopy: secondaryCopyForState(screenState),
      sessionBoundary: sessionBoundaryForState(screenState),
      paymentCopy: this.flags.moneyEnabled ? "Atlas checks billing before saving." : "Billing is off in Alpha.",
      billing: billingSummaryForState(screenState, this.flags.moneyEnabled),
      primaryAction,
      savePreview: savePreviewForInput(input),
      savedState: input.savedState,
      flags: this.flags,
      gates: gateStatuses(this.flags),
      canPersist: this.flags.persistenceEnabled && Boolean(this.persistence),
      canStartCheckout: this.flags.moneyEnabled && Boolean(this.billing),
      canUsePaidWrites: screenState === "active" && this.flags.persistenceEnabled && this.flags.moneyEnabled && Boolean(this.persistence),
    };
  }

  async createOrAttachClawd(
    input: HostedClawdCreateOrAttachInput = {},
    auth?: HostedClawdAuthContext,
  ): Promise<HostedClawdActionResponse> {
    if (!this.flags.persistenceEnabled) {
      return this.closedGateResponse("create_or_attach_clawd", input, "persistence_not_enabled", "join_waitlist");
    }

    if (!this.persistence) {
      return this.scaffoldResponse(
        "create_or_attach_clawd",
        input,
        "persistence_adapter_not_configured",
        "create_hosted_clawd",
        "Hosted Clawd persistence is gated and the database adapter is not wired in this scaffold.",
      );
    }

    const denied = this.writeAuthDenial("create_or_attach_clawd", input, auth);
    if (denied) return denied;

    const result = await this.persistence.createOrAttachClawd(auth as HostedClawdAuthContext, input);
    return this.acceptedResponse("create_or_attach_clawd", input, result);
  }

  async promoteSession(
    input: HostedClawdPromotionInput = {},
    auth?: HostedClawdAuthContext,
  ): Promise<HostedClawdActionResponse> {
    if (!this.flags.persistenceEnabled) {
      return this.closedGateResponse("promote_session", input, "persistence_not_enabled", "join_waitlist");
    }

    if (!this.persistence) {
      return this.scaffoldResponse(
        "promote_session",
        input,
        "persistence_adapter_not_configured",
        "create_hosted_clawd",
        "Session promotion is defined, but no auth or database adapter is active in this scaffold.",
      );
    }

    const denied = this.writeAuthDenial("promote_session", input, auth);
    if (denied) return denied;

    const paidWriteGate = await this.protectedPaidWriteGate("promote_session", input, auth as HostedClawdAuthContext);
    if (paidWriteGate.response) return paidWriteGate.response;

    const result = await this.persistence.promoteSession(auth as HostedClawdAuthContext, input);
    return this.acceptedResponse("promote_session", inputWithSubscription(input, paidWriteGate.subscriptionStatus), result);
  }

  async saveCampaignArtifact(
    input: HostedClawdCampaignArtifactInput = {},
    auth?: HostedClawdAuthContext,
  ): Promise<HostedClawdActionResponse> {
    if (!this.flags.persistenceEnabled) {
      return this.closedGateResponse("save_campaign_artifact", input, "persistence_not_enabled", "join_waitlist");
    }

    if (!this.persistence) {
      return this.scaffoldResponse(
        "save_campaign_artifact",
        input,
        "persistence_adapter_not_configured",
        "create_hosted_clawd",
        "Campaign save is defined, but saved writes remain disabled until auth, ownership, and storage are approved.",
      );
    }

    const denied = this.writeAuthDenial("save_campaign_artifact", input, auth);
    if (denied) return denied;

    const paidWriteGate = await this.protectedPaidWriteGate("save_campaign_artifact", input, auth as HostedClawdAuthContext);
    if (paidWriteGate.response) return paidWriteGate.response;

    const result = await this.persistence.saveCampaignArtifact(auth as HostedClawdAuthContext, input);
    return this.acceptedResponse("save_campaign_artifact", inputWithSubscription(input, paidWriteGate.subscriptionStatus), result);
  }

  async readSavedState(
    input: HostedClawdContextInput = {},
    auth?: HostedClawdAuthContext,
  ): Promise<HostedClawdActionResponse> {
    if (!this.flags.persistenceEnabled) {
      return this.closedGateResponse("read_saved_state", input, "persistence_not_enabled", "join_waitlist");
    }

    if (!this.persistence) {
      return this.scaffoldResponse(
        "read_saved_state",
        input,
        "persistence_adapter_not_configured",
        "create_hosted_clawd",
        "Saved-state reads are defined, but no auth or database adapter is active in this scaffold.",
      );
    }

    const denied = this.readAuthDenial("read_saved_state", input, auth);
    if (denied) return denied;

    const savedState = await this.persistence.readSavedState(auth as HostedClawdAuthContext);
    const context = this.getContext({ ...input, subscriptionStatus: savedState.subscriptionStatus, savedState });
    return {
      type: "hostedClawdAction",
      operation: "read_saved_state",
      status: "accepted",
      reason: "ready",
      screenState: context.screenState,
      message: savedStateMessage(savedState),
      nextAction: savedStateNextAction(savedState),
      savedState,
      context,
    };
  }

  async startCheckout(
    input: HostedClawdContextInput = {},
    auth?: HostedClawdAuthContext,
  ): Promise<HostedClawdActionResponse> {
    if (!this.flags.moneyEnabled) {
      return this.closedGateResponse("start_checkout", input, "money_not_enabled", "join_waitlist");
    }

    if (!this.billing) {
      return this.scaffoldResponse(
        "start_checkout",
        input,
        "billing_adapter_not_configured",
        "continue_to_stripe",
        "Stripe Checkout is scaffolded only. No checkout session is created.",
      );
    }

    const denied = this.writeAuthDenial("start_checkout", input, auth);
    if (denied) return denied;

    const result = await this.billing.startCheckout(auth as HostedClawdAuthContext, input);
    return this.billingActionResponse("start_checkout", input, result);
  }

  async openBillingPortal(
    input: HostedClawdContextInput = {},
    auth?: HostedClawdAuthContext,
  ): Promise<HostedClawdActionResponse> {
    if (!this.flags.moneyEnabled) {
      return this.closedGateResponse("open_billing_portal", input, "money_not_enabled", "join_waitlist");
    }

    if (!this.billing) {
      return this.scaffoldResponse(
        "open_billing_portal",
        input,
        "billing_adapter_not_configured",
        "open_billing_portal",
        "Billing Portal is scaffolded only. No Stripe session is created.",
      );
    }

    const denied = this.writeAuthDenial("open_billing_portal", input, auth);
    if (denied) return denied;

    const result = await this.billing.openBillingPortal(auth as HostedClawdAuthContext, input);
    return this.billingActionResponse("open_billing_portal", input, result);
  }

  private screenState(input: HostedClawdContextInput): HostedClawdScreenState {
    if (!this.flags.persistenceEnabled) return "waitlist";

    if (!this.flags.moneyEnabled) return "confirm_save";

    switch (input.subscriptionStatus) {
      case "active":
        return "active";
      case "activating":
        return "activating";
      case "inactive":
      case "payment_failed":
        return "inactive_payment_failed";
      case "none":
      default:
        return "checkout_pending";
    }
  }

  private primaryActionForState(screenState: HostedClawdScreenState): HostedClawdPrimaryAction {
    switch (screenState) {
      case "waitlist":
        return { kind: "join_waitlist", label: "Join waitlist", enabled: true };
      case "confirm_save":
        return { kind: "create_hosted_clawd", label: "Create Hosted Clawd", enabled: this.flags.persistenceEnabled };
      case "checkout_pending":
        return { kind: "continue_to_stripe", label: "Continue to Stripe", enabled: this.flags.moneyEnabled };
      case "activating":
        return { kind: "refresh_status", label: "Refresh status", enabled: true };
      case "active":
        return { kind: "open_saved_campaign", label: "Open saved state", enabled: true };
      case "inactive_payment_failed":
        return { kind: "open_billing_portal", label: "Open billing portal", enabled: this.flags.moneyEnabled };
    }
  }

  private writeAuthDenial(
    operation: HostedClawdActionOperation,
    input: HostedClawdContextInput,
    auth: HostedClawdAuthContext | undefined,
  ): HostedClawdActionResponse | undefined {
    if (!auth) {
      const context = this.getContext(input);
      return {
        type: "hostedClawdAction",
        operation,
        status: "blocked",
        reason: "auth_required",
        screenState: context.screenState,
        message:
          "Saving requires a linked account. Connect through OAuth/OIDC account linking; session previews stay temporary.",
        nextAction: "create_hosted_clawd",
        context,
      };
    }

    if (!hasWriteScope(auth)) {
      const context = this.getContext(input);
      return {
        type: "hostedClawdAction",
        operation,
        status: "blocked",
        reason: "write_scope_required",
        screenState: context.screenState,
        message: "This account is linked but its token is missing the Hosted Clawd write scope.",
        nextAction: "refresh_status",
        context,
      };
    }

    return undefined;
  }

  private readAuthDenial(
    operation: HostedClawdActionOperation,
    input: HostedClawdContextInput,
    auth: HostedClawdAuthContext | undefined,
  ): HostedClawdActionResponse | undefined {
    if (!auth) {
      const context = this.getContext(input);
      return {
        type: "hostedClawdAction",
        operation,
        status: "blocked",
        reason: "auth_required",
        screenState: context.screenState,
        message: "Connect ChatGPT to load saved items.",
        nextAction: "create_hosted_clawd",
        context,
      };
    }

    if (!hasReadScope(auth)) {
      const context = this.getContext(input);
      return {
        type: "hostedClawdAction",
        operation,
        status: "blocked",
        reason: "read_scope_required",
        screenState: context.screenState,
        message: "This account is linked, but Atlas still needs permission to read saved Clawd items.",
        nextAction: "refresh_status",
        context,
      };
    }

    return undefined;
  }

  private async protectedPaidWriteGate(
    operation: "promote_session" | "save_campaign_artifact",
    input: HostedClawdContextInput,
    auth: HostedClawdAuthContext,
  ): Promise<{ subscriptionStatus?: HostedClawdSubscriptionAccessStatus; response?: HostedClawdActionResponse }> {
    if (!this.flags.moneyEnabled) return {};
    if (!this.persistence) return {};

    const subscriptionStatus = await this.persistence.getSubscriptionStatus(auth);
    if (subscriptionStatus === "active") return { subscriptionStatus };

    const context = this.getContext({ ...input, subscriptionStatus });
    return {
      response: {
        type: "hostedClawdAction",
        operation,
        status: "blocked",
        reason: "billing_subscription_not_active",
        screenState: context.screenState,
        message: "New saves need confirmed billing. Returning from Checkout is not enough.",
        nextAction: nextActionForProtectedPaidWrite(subscriptionStatus),
        context,
      },
    };
  }

  private acceptedResponse(
    operation: HostedClawdActionOperation,
    input: HostedClawdContextInput,
    result: HostedClawdPersistResult,
  ): HostedClawdActionResponse {
    const context = this.getContext(input);
    const savedKinds = result.records.map((record) => record.kind.replace(/_/g, " ")).join(", ");
    return {
      type: "hostedClawdAction",
      operation,
      status: "accepted",
      reason: "ready",
      screenState: context.screenState,
      message: result.reusedRequest
        ? `Already saved. Returning the original saved ${savedKinds || "records"}.`
        : `Saved ${savedKinds || "records"} to your Hosted Clawd.`,
      nextAction: "refresh_status",
      saved: result.records,
      context,
    };
  }

  private billingActionResponse(
    operation: "start_checkout" | "open_billing_portal",
    input: HostedClawdContextInput,
    result: HostedClawdBillingActionResult,
  ): HostedClawdActionResponse {
    const context = this.getContext({ ...input, subscriptionStatus: result.subscriptionStatus });
    return {
      type: "hostedClawdAction",
      operation,
      status: result.status,
      reason: result.reason,
      screenState: context.screenState,
      message: result.message,
      nextAction: result.nextAction,
      redirectUrl: result.redirectUrl,
      billing: result.billing,
      context,
    };
  }

  private closedGateResponse(
    operation: HostedClawdActionOperation,
    input: HostedClawdContextInput,
    reason: "persistence_not_enabled" | "money_not_enabled",
    nextAction: HostedClawdActionKind,
  ): HostedClawdActionResponse {
    const context = this.getContext(input);
    return {
      type: "hostedClawdAction",
      operation,
      status: "waitlist",
      reason,
      screenState: context.screenState,
      message:
        reason === "money_not_enabled"
          ? "Payment is not live in Alpha. Keep this as a session preview or join the save waitlist."
          : "Saving is not live yet. Join the waitlist to save this business later.",
      nextAction,
      context,
    };
  }

  private scaffoldResponse(
    operation: HostedClawdActionOperation,
    input: HostedClawdContextInput,
    reason: "persistence_adapter_not_configured" | "billing_adapter_not_configured" | "auth_not_configured",
    nextAction: HostedClawdActionKind,
    message: string,
  ): HostedClawdActionResponse {
    const context = this.getContext(input);
    return {
      type: "hostedClawdAction",
      operation,
      status: "scaffold",
      reason,
      screenState: context.screenState,
      message,
      nextAction,
      context,
    };
  }
}

export function readHostedClawdFeatureFlags(env: NodeJS.ProcessEnv): HostedClawdFeatureFlags {
  return {
    persistenceEnabled: readBooleanFlag(env[HOSTED_CLAWD_PERSISTENCE_FLAG]),
    moneyEnabled: readBooleanFlag(env[HOSTED_CLAWD_MONEY_FLAG]),
    publicClaimEnabled: readBooleanFlag(env[HOSTED_CLAWD_PUBLIC_CLAIM_FLAG]),
  };
}

function readBooleanFlag(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function gateStatuses(flags: HostedClawdFeatureFlags): HostedClawdGateStatus[] {
  return [
    {
      gate: HUMAN_APPROVAL_BEFORE_PERSISTENCE,
      flag: HOSTED_CLAWD_PERSISTENCE_FLAG,
      approved: flags.persistenceEnabled,
      requiredFor: "accounts, business memory, Scout Drop saves, campaign saves, evidence, XP, reports, exports, and database migrations",
    },
    {
      gate: HUMAN_APPROVAL_BEFORE_MONEY,
      flag: HOSTED_CLAWD_MONEY_FLAG,
      approved: flags.moneyEnabled,
      requiredFor: "Stripe Checkout, Billing Portal, paid limits, and subscription-gated writes",
    },
    {
      gate: HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM,
      flag: HOSTED_CLAWD_PUBLIC_CLAIM_FLAG,
      approved: flags.publicClaimEnabled,
      requiredFor: "public pricing copy, saved-state launch claims, and external Beta promotion",
    },
  ];
}

function contextLabel(input: HostedClawdContextInput): string {
  const business = cleanText(input.businessName) ?? cleanText(input.businessType) ?? "this business";
  const place = cleanText(input.placeLabel) ?? cleanText(input.countyLabel) ?? cleanText(input.countySlug);
  return place ? `${business} at ${place}` : business;
}

function savePreviewForInput(input: HostedClawdContextInput): HostedClawdSavePreviewItem[] {
  const items: HostedClawdSavePreviewItem[] = [
    {
      label: "Business",
      value: cleanText(input.businessName) ?? cleanText(input.businessType) ?? "Confirm business profile",
      status: cleanText(input.businessName) || cleanText(input.businessType) ? "ready" : "needs_confirmation",
    },
    {
      label: "Location",
      value: cleanText(input.placeLabel) ?? cleanText(input.countyLabel) ?? cleanText(input.countySlug) ?? "Confirm map context",
      status: cleanText(input.placeLabel) || cleanText(input.countyLabel) || cleanText(input.countySlug) ? "ready" : "needs_confirmation",
    },
  ];

  if (input.scoutPreviewId) {
    items.push({ label: "Scout report", value: "Save this scout report", status: "ready" });
  } else {
    items.push({ label: "Scout report", value: "Run a Scout Drop before saving", status: "planned" });
  }

  if (input.campaignPreviewId) {
    items.push({ label: "Campaign draft", value: "Save campaign preview draft", status: "ready" });
  } else {
    items.push({ label: "Campaign draft", value: "Preview a campaign before saving", status: "planned" });
  }

  if (input.selectedNoteCount && input.selectedNoteCount > 0) {
    items.push({ label: "Notes", value: `${input.selectedNoteCount} selected note${input.selectedNoteCount === 1 ? "" : "s"}`, status: "needs_confirmation" });
  }

  return items;
}

function primaryCopyForState(screenState: HostedClawdScreenState): string {
  switch (screenState) {
    case "waitlist":
      return "Join the waitlist to save this setup later.";
    case "confirm_save":
      return "Save this business, scout report, and campaign draft.";
    case "checkout_pending":
      return "Test Checkout can open after setup is confirmed.";
    case "activating":
      return "Return received. Checking billing.";
    case "active":
      return "Saved state is active.";
    case "inactive_payment_failed":
      return "Billing needs attention. Saved items stay readable.";
  }
}

function secondaryCopyForState(screenState: HostedClawdScreenState): string {
  switch (screenState) {
    case "waitlist":
      return "This map, pins, notes, Scout Drop, and campaign preview remain temporary.";
    case "confirm_save":
      return "Stickers and notes stay temporary until you choose what to save.";
    case "checkout_pending":
      return "A browser return does not turn on saving.";
    case "activating":
      return "Keep working in the map while Atlas checks the server event.";
    case "active":
      return "Saves are tied to this business profile.";
    case "inactive_payment_failed":
      return "New saves are paused until billing is fixed.";
  }
}

function sessionBoundaryForState(screenState: HostedClawdScreenState): string {
  if (screenState === "active") return "Saved state on.";
  if (screenState === "inactive_payment_failed") return "Saved items are read only.";
  return "This chat is temporary.";
}

function statusLabelForState(screenState: HostedClawdScreenState): string {
  switch (screenState) {
    case "waitlist":
      return "Alpha Free";
    case "confirm_save":
      return "Beta Invite";
    case "checkout_pending":
      return "Test billing";
    case "activating":
      return "Activating";
    case "active":
      return "Active";
    case "inactive_payment_failed":
      return "Billing issue";
  }
}

function billingSummaryForState(screenState: HostedClawdScreenState, moneyEnabled: boolean): HostedClawdBillingSummary {
  if (!moneyEnabled) {
    return {
      state: "off",
      subscriptionStatus: "none",
      confirmationSource: "none",
      returnUrlGrantsAccess: false,
      paidWrites: "read_only",
      title: "Billing off",
      detail: "Billing is not live in Alpha.",
      checkoutLabel: "Checkout off",
      webhookLabel: "Idle",
      returnLabel: "No return",
      portalLabel: "Portal off",
    };
  }

  switch (screenState) {
    case "active":
      return {
        state: "webhook_confirmed",
        subscriptionStatus: "active",
        confirmationSource: "webhook",
        returnUrlGrantsAccess: false,
        paidWrites: "enabled",
        title: "Confirmed",
        detail: "Saving is on for this Clawd.",
        checkoutLabel: "Checkout done",
        webhookLabel: "Confirmed",
        returnLabel: "Checked",
        portalLabel: "Billing portal",
      };
    case "activating":
      return {
        state: "return_pending",
        subscriptionStatus: "activating",
        confirmationSource: "none",
        returnUrlGrantsAccess: false,
        paidWrites: "read_only",
        title: "Return received",
        detail: "Waiting for server confirmation. New saves stay paused.",
        checkoutLabel: "Checkout started",
        webhookLabel: "Pending",
        returnLabel: "Pending",
        portalLabel: "Portal waits",
      };
    case "inactive_payment_failed":
      return {
        state: "payment_attention",
        subscriptionStatus: "payment_failed",
        confirmationSource: "none",
        returnUrlGrantsAccess: false,
        paidWrites: "read_only",
        title: "Billing issue",
        detail: "Saved items are readable. New saves are paused.",
        checkoutLabel: "Checkout paused",
        webhookLabel: "Not active",
        returnLabel: "Not confirmed",
        portalLabel: "Billing portal",
      };
    case "checkout_pending":
    default:
      return {
        state: "test_ready",
        subscriptionStatus: "none",
        confirmationSource: "none",
        returnUrlGrantsAccess: false,
        paidWrites: "read_only",
        title: "Test billing ready",
        detail: "Checkout opens only after setup is confirmed. Stripe test mode.",
        checkoutLabel: "Test Checkout",
        webhookLabel: "Confirmation required",
        returnLabel: "Not confirmed",
        portalLabel: "Portal checked",
      };
  }
}

function inputWithSubscription<T extends HostedClawdContextInput>(
  input: T,
  subscriptionStatus: HostedClawdSubscriptionAccessStatus | undefined,
): T {
  return subscriptionStatus ? ({ ...input, subscriptionStatus } as T) : input;
}

function nextActionForProtectedPaidWrite(subscriptionStatus: HostedClawdSubscriptionAccessStatus): HostedClawdActionKind {
  switch (subscriptionStatus) {
    case "activating":
      return "refresh_status";
    case "inactive":
    case "payment_failed":
      return "open_billing_portal";
    case "none":
    case "active":
    default:
      return "continue_to_stripe";
  }
}

function savedStateMessage(savedState: HostedClawdSavedStateSummary): string {
  const savedCount =
    (savedState.clawd ? 1 : 0) +
    (savedState.businessProfile ? 1 : 0) +
    savedState.scoutDrops.length +
    savedState.campaignDrafts.length;
  if (!savedState.clawd) return "No saved items yet. Start from the map.";
  if (savedState.readOnlyReason === "billing_attention") {
    return `Loaded ${savedCount} saved item${savedCount === 1 ? "" : "s"}. Billing needs attention, so new saves stay paused.`;
  }
  if (savedState.paidWrites === "read_only") {
    return `Loaded ${savedCount} saved item${savedCount === 1 ? "" : "s"}. Saved history is readable; new saves stay locked.`;
  }
  return `Loaded ${savedCount} saved item${savedCount === 1 ? "" : "s"}.`;
}

function savedStateNextAction(savedState: HostedClawdSavedStateSummary): HostedClawdActionKind {
  if (!savedState.clawd) return "create_hosted_clawd";
  if (savedState.readOnlyReason === "billing_attention") return "open_billing_portal";
  if (savedState.paidWrites === "read_only") return "continue_to_stripe";
  return "open_saved_campaign";
}

function cleanText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
