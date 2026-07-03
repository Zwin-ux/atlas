import type { DistrictReadinessAggregate } from "./districtReadinessAggregator.js";

export type DistrictOwnerGateId = "lumen" | "mira" | "forge" | "axiom";

export type DistrictOwnerGateStatus = "accepted" | "blocked" | "missing";

export type DistrictOwnerGateDecision = {
  owner: DistrictOwnerGateId;
  status: DistrictOwnerGateStatus;
  evidencePath?: string;
  reason?: string;
};

export type DistrictOwnerGateCutlineInput = {
  aggregate: DistrictReadinessAggregate;
  ownerDecisions?: Partial<Record<DistrictOwnerGateId, DistrictOwnerGateDecision>>;
};

export type DistrictOwnerGateCutlineOutcome = "APPROVE_CONTROLLED_PUBLIC_SPIKE" | "BLOCK_PROMOTION";

export type DistrictOwnerGateCutline = {
  packetKind: "secondDistrictOwnerGateCutline";
  version: "e25.0";
  candidateSlug: string;
  countySlug: string;
  districtSlug: string;
  readyForPlayablePromotion: boolean;
  outcome: DistrictOwnerGateCutlineOutcome;
  nextSlice: "0.26E Controlled Anaheim Public Playable Spike" | "Public Engine Beta Quality Or Focused Hidden Source-Art Blocker";
  ownerGates: Record<DistrictOwnerGateId, DistrictOwnerGateDecision>;
  blockerGroups: DistrictReadinessAggregate["blockerGroups"];
  cutlineBlockers: string[];
};

export function createDistrictOwnerGateCutline(input: DistrictOwnerGateCutlineInput): DistrictOwnerGateCutline {
  const aggregate = input.aggregate;
  const inferredOwnerGates = inferOwnerGates(aggregate);
  const ownerGates = {
    lumen: input.ownerDecisions?.lumen ?? inferredOwnerGates.lumen,
    mira: input.ownerDecisions?.mira ?? inferredOwnerGates.mira,
    forge: input.ownerDecisions?.forge ?? inferredOwnerGates.forge,
    axiom: input.ownerDecisions?.axiom ?? inferredOwnerGates.axiom,
  } satisfies Record<DistrictOwnerGateId, DistrictOwnerGateDecision>;

  const cutlineBlockers = [
    ...aggregate.blockerGroups.data.map((blocker) => `data:${blocker}`),
    ...aggregate.blockerGroups.visual.map((blocker) => `visual:${blocker}`),
    ...aggregate.blockerGroups.product.map((blocker) => `product:${blocker}`),
    ...aggregate.blockerGroups.release.map((blocker) => `release:${blocker}`),
    ...Object.values(ownerGates)
      .filter((gate) => gate.status !== "accepted")
      .map((gate) => `owner:${gate.owner}:${gate.status}${gate.reason ? `:${gate.reason}` : ""}`),
  ];

  const allOwnersAccepted = Object.values(ownerGates).every((gate) => gate.status === "accepted");
  const outcome =
    aggregate.readyForPlayablePromotion && allOwnersAccepted && cutlineBlockers.length === 0
      ? "APPROVE_CONTROLLED_PUBLIC_SPIKE"
      : "BLOCK_PROMOTION";

  return {
    packetKind: "secondDistrictOwnerGateCutline",
    version: "e25.0",
    candidateSlug: aggregate.candidateSlug,
    countySlug: aggregate.countySlug,
    districtSlug: aggregate.districtSlug,
    readyForPlayablePromotion: aggregate.readyForPlayablePromotion,
    outcome,
    nextSlice:
      outcome === "APPROVE_CONTROLLED_PUBLIC_SPIKE"
        ? "0.26E Controlled Anaheim Public Playable Spike"
        : "Public Engine Beta Quality Or Focused Hidden Source-Art Blocker",
    ownerGates,
    blockerGroups: aggregate.blockerGroups,
    cutlineBlockers,
  };
}

function inferOwnerGates(aggregate: DistrictReadinessAggregate): Record<DistrictOwnerGateId, DistrictOwnerGateDecision> {
  return {
    lumen: inferGate("lumen", aggregate.blockerGroups.visual, "Lumen public-promotion visual acceptance is not closed."),
    mira: inferGate("mira", aggregate.blockerGroups.product, "Mira public-playable product acceptance is not closed."),
    forge: inferGate("forge", aggregate.blockerGroups.release, "Forge release acceptance is not closed."),
    axiom: aggregate.readyForPlayablePromotion
      ? {
          owner: "axiom",
          status: "missing",
          reason: "Axiom final public promotion call has not been recorded.",
        }
      : {
          owner: "axiom",
          status: "blocked",
          reason: "Readiness aggregate is not promotion-ready.",
        },
  };
}

function inferGate(owner: DistrictOwnerGateId, blockers: string[], missingReason: string): DistrictOwnerGateDecision {
  if (blockers.length === 0) {
    return {
      owner,
      status: "missing",
      reason: missingReason,
    };
  }
  return {
    owner,
    status: "blocked",
    reason: blockers[0] ?? "owner gate blocker",
  };
}
