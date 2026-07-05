export {
  HOSTED_CLAWD_MONEY_FLAG,
  HOSTED_CLAWD_PERSISTENCE_FLAG,
  HOSTED_CLAWD_PUBLIC_CLAIM_FLAG,
  HUMAN_APPROVAL_BEFORE_MONEY,
  HUMAN_APPROVAL_BEFORE_PERSISTENCE,
  HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM,
} from "./gates.js";
export { HostedClawdService, readHostedClawdFeatureFlags } from "./service.js";
export type {
  HostedClawdActionResponse,
  HostedClawdBillingPort,
  HostedClawdCampaignArtifactInput,
  HostedClawdContext,
  HostedClawdContextInput,
  HostedClawdFeatureFlags,
  HostedClawdPersistencePort,
  HostedClawdScreenState,
  HostedClawdTrigger,
} from "./types.js";
