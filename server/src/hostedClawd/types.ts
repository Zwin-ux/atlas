import type {
  HOSTED_CLAWD_MONEY_FLAG,
  HOSTED_CLAWD_PERSISTENCE_FLAG,
  HOSTED_CLAWD_PUBLIC_CLAIM_FLAG,
  HUMAN_APPROVAL_BEFORE_MONEY,
  HUMAN_APPROVAL_BEFORE_PERSISTENCE,
  HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM,
} from "./gates.js";

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
};

export type HostedClawdSavePreviewItem = {
  label: string;
  value: string;
  status: "ready" | "needs_confirmation" | "planned";
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
  primaryAction: HostedClawdPrimaryAction;
  savePreview: HostedClawdSavePreviewItem[];
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
  | "start_checkout"
  | "open_billing_portal";

export type HostedClawdActionResponse = {
  type: "hostedClawdAction";
  operation: HostedClawdActionOperation;
  status: "waitlist" | "blocked" | "scaffold" | "accepted";
  reason:
    | "persistence_not_enabled"
    | "money_not_enabled"
    | "auth_not_configured"
    | "persistence_adapter_not_configured"
    | "billing_adapter_not_configured"
    | "ready";
  screenState: HostedClawdScreenState;
  message: string;
  nextAction: HostedClawdActionKind;
  context: HostedClawdContext;
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

export type HostedClawdPersistencePort = {
  // TODO(gate: HUMAN_APPROVAL_BEFORE_PERSISTENCE): implement after auth, DB,
  // migration, ownership, and idempotency tests are approved.
  createOrAttachClawd(input: HostedClawdCreateOrAttachInput): Promise<HostedClawdActionResponse>;
  promoteSession(input: HostedClawdPromotionInput): Promise<HostedClawdActionResponse>;
  saveCampaignArtifact(input: HostedClawdCampaignArtifactInput): Promise<HostedClawdActionResponse>;
};

export type HostedClawdBillingPort = {
  // TODO(gate: HUMAN_APPROVAL_BEFORE_MONEY): create Stripe-hosted Checkout
  // only after subscription access is backed by verified webhook state.
  startCheckout(input: HostedClawdContextInput): Promise<HostedClawdActionResponse>;
  openBillingPortal(input: HostedClawdContextInput): Promise<HostedClawdActionResponse>;
};
