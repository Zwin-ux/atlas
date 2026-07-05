import {
  HOSTED_CLAWD_MONEY_FLAG,
  HOSTED_CLAWD_PERSISTENCE_FLAG,
  HOSTED_CLAWD_PUBLIC_CLAIM_FLAG,
  HUMAN_APPROVAL_BEFORE_MONEY,
  HUMAN_APPROVAL_BEFORE_PERSISTENCE,
  HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM,
} from "./gates.js";
import type {
  HostedClawdActionKind,
  HostedClawdActionOperation,
  HostedClawdActionResponse,
  HostedClawdBillingPort,
  HostedClawdCampaignArtifactInput,
  HostedClawdContext,
  HostedClawdContextInput,
  HostedClawdCreateOrAttachInput,
  HostedClawdFeatureFlags,
  HostedClawdGateStatus,
  HostedClawdPersistencePort,
  HostedClawdPrimaryAction,
  HostedClawdPromotionInput,
  HostedClawdSavePreviewItem,
  HostedClawdScreenState,
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
      paymentCopy: this.flags.moneyEnabled
        ? "Checkout stays behind server-confirmed subscription state."
        : "Payment is not live in Alpha.",
      primaryAction,
      savePreview: savePreviewForInput(input),
      flags: this.flags,
      gates: gateStatuses(this.flags),
      canPersist: this.flags.persistenceEnabled && Boolean(this.persistence),
      canStartCheckout: this.flags.moneyEnabled && Boolean(this.billing),
      canUsePaidWrites: screenState === "active" && this.flags.persistenceEnabled && this.flags.moneyEnabled,
    };
  }

  async createOrAttachClawd(input: HostedClawdCreateOrAttachInput = {}): Promise<HostedClawdActionResponse> {
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

    return this.persistence.createOrAttachClawd(input);
  }

  async promoteSession(input: HostedClawdPromotionInput = {}): Promise<HostedClawdActionResponse> {
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

    return this.persistence.promoteSession(input);
  }

  async saveCampaignArtifact(input: HostedClawdCampaignArtifactInput = {}): Promise<HostedClawdActionResponse> {
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

    return this.persistence.saveCampaignArtifact(input);
  }

  async startCheckout(input: HostedClawdContextInput = {}): Promise<HostedClawdActionResponse> {
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

    return this.billing.startCheckout(input);
  }

  async openBillingPortal(input: HostedClawdContextInput = {}): Promise<HostedClawdActionResponse> {
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

    return this.billing.openBillingPortal(input);
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
        return { kind: "join_waitlist", label: "Join Hosted Clawd waitlist", enabled: true };
      case "confirm_save":
        return { kind: "create_hosted_clawd", label: "Create Hosted Clawd", enabled: this.flags.persistenceEnabled };
      case "checkout_pending":
        return { kind: "continue_to_stripe", label: "Continue to Stripe", enabled: this.flags.moneyEnabled };
      case "activating":
        return { kind: "refresh_status", label: "Refresh status", enabled: true };
      case "active":
        return { kind: "open_saved_campaign", label: "Open saved campaign", enabled: true };
      case "inactive_payment_failed":
        return { kind: "open_billing_portal", label: "Open billing portal", enabled: this.flags.moneyEnabled };
    }
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
          ? "Payment is not live in Alpha. Keep this as a session preview or join the Hosted Clawd waitlist."
          : "Hosted Clawd is not live yet. Join the waitlist to save this business when Beta opens.",
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
      return "Hosted Clawd is not live yet. Join the waitlist to save this business when Beta opens.";
    case "confirm_save":
      return "Save this business, scout report, and campaign draft to Hosted Clawd.";
    case "checkout_pending":
      return "Hosted Clawd needs an active subscription before it can save new campaign work.";
    case "activating":
      return "Activating Hosted Clawd. Saved writes unlock after billing is confirmed.";
    case "active":
      return "Hosted Clawd is saving this business.";
    case "inactive_payment_failed":
      return "Hosted Clawd is read-only until billing is fixed.";
  }
}

function secondaryCopyForState(screenState: HostedClawdScreenState): string {
  switch (screenState) {
    case "waitlist":
      return "This map, pins, notes, Scout Drop, and campaign preview remain temporary.";
    case "confirm_save":
      return "Session stickers and demo XP stay temporary unless you choose what to save.";
    case "checkout_pending":
      return "Business context is confirmed before checkout. Stripe access is granted only after the server confirms billing.";
    case "activating":
      return "Keep working in the map while Atlas waits for subscription status to sync.";
    case "active":
      return "Saved state is tied to the confirmed business profile and owned Hosted Clawd.";
    case "inactive_payment_failed":
      return "Saved history can remain readable, but new paid writes stay blocked.";
  }
}

function sessionBoundaryForState(screenState: HostedClawdScreenState): string {
  if (screenState === "active") return "Saved-state mode.";
  if (screenState === "inactive_payment_failed") return "Read-only Hosted Clawd state.";
  return "Session-only until Hosted Clawd is live.";
}

function statusLabelForState(screenState: HostedClawdScreenState): string {
  switch (screenState) {
    case "waitlist":
      return "Alpha Free";
    case "confirm_save":
      return "Beta Invite";
    case "checkout_pending":
      return "Checkout pending";
    case "activating":
      return "Activating";
    case "active":
      return "Active";
    case "inactive_payment_failed":
      return "Payment attention";
  }
}

function cleanText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
