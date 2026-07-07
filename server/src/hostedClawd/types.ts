import type {
  HOSTED_CLAWD_MONEY_FLAG,
  HOSTED_CLAWD_PERSISTENCE_FLAG,
  HOSTED_CLAWD_PUBLIC_CLAIM_FLAG,
  HUMAN_APPROVAL_BEFORE_MONEY,
  HUMAN_APPROVAL_BEFORE_PERSISTENCE,
  HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM,
} from "./gates.js";
import type { HostedClawdAuthContext } from "./auth.js";

export type HostedClawdApprovalGate =
  | typeof HUMAN_APPROVAL_BEFORE_PERSISTENCE
  | typeof HUMAN_APPROVAL_BEFORE_MONEY
  | typeof HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM;

export type HostedClawdFlagName =
  | typeof HOSTED_CLAWD_PERSISTENCE_FLAG
  | typeof HOSTED_CLAWD_MONEY_FLAG
  | typeof HOSTED_CLAWD_PUBLIC_CLAIM_FLAG;

export type HostedClawdMode = "alpha_free" | "beta_invite" | "beta_paid";

export type HostedClawdScreenState =
  | "waitlist"
  | "confirm_save"
  | "checkout_pending"
  | "activating"
  | "active"
  | "inactive_payment_failed";

export type HostedClawdTrigger = "map_tray" | "scout_drop" | "campaign_preview" | "upgrade_tool";

export type HostedClawdActionKind =
  | "join_waitlist"
  | "create_hosted_clawd"
  | "continue_to_stripe"
  | "refresh_status"
  | "open_saved_campaign"
  | "open_billing_portal";

export type HostedClawdFeatureFlags = {
  persistenceEnabled: boolean;
  moneyEnabled: boolean;
  publicClaimEnabled: boolean;
};

export type HostedClawdGateStatus = {
  gate: HostedClawdApprovalGate;
  flag: HostedClawdFlagName;
  approved: boolean;
  requiredFor: string;
};

export type HostedClawdContextInput = {
  trigger?: HostedClawdTrigger;
  businessName?: string;
  businessType?: string;
  serviceArea?: string;
  primaryGoal?: string;
  offerNotes?: string;
  countySlug?: string;
  countyLabel?: string;
  placeLabel?: string;
  scoutPreviewId?: string;
  campaignPreviewId?: string;
  selectedNoteCount?: number;
  subscriptionStatus?: "none" | "activating" | "active" | "inactive" | "payment_failed";
  savedState?: HostedClawdSavedStateSummary;
};

export type HostedClawdSubscriptionAccessStatus = NonNullable<HostedClawdContextInput["subscriptionStatus"]>;

export type HostedClawdBillingUiState =
  | "off"
  | "test_ready"
  | "return_pending"
  | "webhook_confirmed"
  | "payment_attention";

export type HostedClawdBillingSummary = {
  state: HostedClawdBillingUiState;
  subscriptionStatus: HostedClawdSubscriptionAccessStatus;
  confirmationSource: "none" | "webhook";
  returnUrlGrantsAccess: false;
  paidWrites: "enabled" | "read_only";
  title: string;
  detail: string;
  checkoutLabel: string;
  webhookLabel: string;
  returnLabel: string;
  portalLabel: string;
};

export type HostedClawdSavePreviewItem = {
  label: string;
  value: string;
  status: "ready" | "needs_confirmation" | "planned";
};

export type HostedClawdSavedStateBusinessSummary = {
  id: string;
  name: string;
  businessType?: string;
  countySlug: string;
  countyLabel?: string;
  placeLabel?: string;
};

export type HostedClawdSavedStateScoutSummary = {
  id: string;
  scoutPreviewId: string;
  countySlug: string;
};

export type HostedClawdSavedStateCampaignSummary = {
  id: string;
  campaignPreviewId: string;
  summary?: string;
  status: "draft";
};

export type HostedClawdSavedStateSummary = {
  type: "hostedClawdSavedState";
  clawd?: {
    id: string;
    name: string;
    status: "active";
  };
  businessProfile?: HostedClawdSavedStateBusinessSummary;
  scoutDrops: HostedClawdSavedStateScoutSummary[];
  campaignDrafts: HostedClawdSavedStateCampaignSummary[];
  subscriptionStatus: HostedClawdSubscriptionAccessStatus;
  paidWrites: "enabled" | "read_only";
  readOnlyReason: "none" | "no_saved_clawd" | "billing_attention" | "subscription_inactive";
};

export type HostedClawdPrimaryAction = {
  kind: HostedClawdActionKind;
  label: string;
  enabled: boolean;
};

export type HostedClawdContext = {
  type: "hostedClawdContext";
  mode: HostedClawdMode;
  screenState: HostedClawdScreenState;
  trigger: HostedClawdTrigger;
  statusLabel: string;
  contextLabel: string;
  primaryCopy: string;
  secondaryCopy: string;
  sessionBoundary: string;
  paymentCopy: string;
  billing: HostedClawdBillingSummary;
  primaryAction: HostedClawdPrimaryAction;
  savePreview: HostedClawdSavePreviewItem[];
  savedState?: HostedClawdSavedStateSummary;
  flags: HostedClawdFeatureFlags;
  gates: HostedClawdGateStatus[];
  canPersist: boolean;
  canStartCheckout: boolean;
  canUsePaidWrites: boolean;
};

export type HostedClawdActionOperation =
  | "create_or_attach_clawd"
  | "promote_session"
  | "save_campaign_artifact"
  | "read_saved_state"
  | "start_checkout"
  | "open_billing_portal";

export type HostedClawdSavedRecord = {
  kind: "clawd" | "business_profile" | "scout_drop" | "campaign_draft";
  id: string;
  reused: boolean;
};

export type HostedClawdPersistResult = {
  records: HostedClawdSavedRecord[];
  reusedRequest: boolean;
};

export type HostedClawdActionResponse = {
  type: "hostedClawdAction";
  operation: HostedClawdActionOperation;
  status: "waitlist" | "blocked" | "scaffold" | "accepted";
  reason:
    | "persistence_not_enabled"
    | "money_not_enabled"
    | "auth_not_configured"
    | "auth_required"
    | "read_scope_required"
    | "write_scope_required"
    | "persistence_adapter_not_configured"
    | "billing_adapter_not_configured"
    | "account_setup_required"
    | "billing_customer_not_found"
    | "billing_subscription_not_active"
    | "ready";
  screenState: HostedClawdScreenState;
  message: string;
  nextAction: HostedClawdActionKind;
  saved?: HostedClawdSavedRecord[];
  savedState?: HostedClawdSavedStateSummary;
  redirectUrl?: string;
  billing?: {
    checkoutSessionId?: string;
    portalSessionId?: string;
    subscriptionStatus?: HostedClawdSubscriptionAccessStatus;
    confirmationSource: "none" | "webhook";
    returnUrlGrantsAccess: false;
  };
  context: HostedClawdContext;
};

export type HostedClawdBillingActionResult = {
  status: "blocked" | "accepted";
  reason:
    | "account_setup_required"
    | "billing_customer_not_found"
    | "billing_subscription_not_active"
    | "ready";
  message: string;
  nextAction: HostedClawdActionKind;
  subscriptionStatus: HostedClawdSubscriptionAccessStatus;
  redirectUrl?: string;
  billing?: HostedClawdActionResponse["billing"];
};

export type HostedClawdCreateOrAttachInput = HostedClawdContextInput & {
  clientRequestId?: string;
};

export type HostedClawdPromotionInput = HostedClawdContextInput & {
  clientRequestId?: string;
  confirmedFields?: string[];
};

export type HostedClawdCampaignArtifactInput = HostedClawdContextInput & {
  clientRequestId?: string;
  campaignPreviewId?: string;
  scoutPreviewId?: string;
  campaignSummary?: string;
};

// HUMAN_APPROVAL_BEFORE_PERSISTENCE is reopened for the named 0.60H slice only.
// Every write requires a verified OIDC account context; there is no
// unauthenticated persisted write path.
export type HostedClawdPersistencePort = {
  getSubscriptionStatus(auth: HostedClawdAuthContext): Promise<HostedClawdSubscriptionAccessStatus>;
  readSavedState(auth: HostedClawdAuthContext): Promise<HostedClawdSavedStateSummary>;
  createOrAttachClawd(
    auth: HostedClawdAuthContext,
    input: HostedClawdCreateOrAttachInput,
  ): Promise<HostedClawdPersistResult>;
  promoteSession(auth: HostedClawdAuthContext, input: HostedClawdPromotionInput): Promise<HostedClawdPersistResult>;
  saveCampaignArtifact(
    auth: HostedClawdAuthContext,
    input: HostedClawdCampaignArtifactInput,
  ): Promise<HostedClawdPersistResult>;
};

export type HostedClawdBillingPort = {
  // HUMAN_APPROVAL_BEFORE_MONEY is reopened for the named 0.62H test-billing
  // slice only. Checkout can redirect; access still comes only from stored
  // webhook-confirmed subscription state.
  startCheckout(
    auth: HostedClawdAuthContext,
    input: HostedClawdContextInput,
  ): Promise<HostedClawdBillingActionResult>;
  openBillingPortal(
    auth: HostedClawdAuthContext,
    input: HostedClawdContextInput,
  ): Promise<HostedClawdBillingActionResult>;
};
