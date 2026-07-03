import type { CountyCoverageTier, UsCountySummary } from "./types.js";

export type PublicPlayableToolKey =
  | "selected_place_tray"
  | "sticker_tools"
  | "note_input"
  | "scout_drop"
  | "campaign_preview";

export type AtlasProductBackendDtoKind =
  | "public_coverage"
  | "hidden_draft_evidence"
  | "future_hosted_clawd";

export type PublicCoverageBoundaryDto = {
  dtoKind: "public_coverage";
  countySlug: string;
  coverageTier: CountyCoverageTier;
  playableDistrictCount: number;
  placeCount: number;
  playableToolsEnabled: boolean;
  allowedPlayableTools: PublicPlayableToolKey[];
  blockedToolReason?: string;
};

export type HiddenDraftEvidenceBoundaryDto = {
  dtoKind: "hidden_draft_evidence";
  countySlug: string;
  districtSlug: string;
  coverageTier: "L1_COUNTY_SHELL";
  playable: false;
  publicRoute: false;
  evidenceOnly: true;
  allowedPlayableTools: [];
};

export type FutureHostedClawdBoundaryDto = {
  dtoKind: "future_hosted_clawd";
  implemented: false;
  requiresExplicitApproval: true;
  blockedScopes: [
    "persistence",
    "database",
    "hosted_clawd",
    "stripe",
    "xp_evidence",
    "oauth",
    "automation",
    "reports_exports",
  ];
};

export const PUBLIC_PLAYABLE_TOOLS: PublicPlayableToolKey[] = [
  "selected_place_tray",
  "sticker_tools",
  "note_input",
  "scout_drop",
  "campaign_preview",
];

export function publicCoverageBoundaryDto(county: Pick<UsCountySummary, "countySlug" | "coverageTier" | "playableDistrictCount" | "placeCount">): PublicCoverageBoundaryDto {
  const playableToolsEnabled = county.coverageTier === "L2_CURATED_DISTRICT" && county.playableDistrictCount > 0;
  return {
    dtoKind: "public_coverage",
    countySlug: county.countySlug,
    coverageTier: county.coverageTier,
    playableDistrictCount: county.playableDistrictCount,
    placeCount: county.placeCount,
    playableToolsEnabled,
    allowedPlayableTools: playableToolsEnabled ? [...PUBLIC_PLAYABLE_TOOLS] : [],
    ...(playableToolsEnabled
      ? {}
      : {
          blockedToolReason:
            "Playable tools require coverageTier L2_CURATED_DISTRICT and at least one playable district.",
        }),
  };
}

export function hiddenDraftEvidenceBoundaryDto(input: { countySlug: string; districtSlug: string }): HiddenDraftEvidenceBoundaryDto {
  return {
    dtoKind: "hidden_draft_evidence",
    countySlug: input.countySlug,
    districtSlug: input.districtSlug,
    coverageTier: "L1_COUNTY_SHELL",
    playable: false,
    publicRoute: false,
    evidenceOnly: true,
    allowedPlayableTools: [],
  };
}

export function futureHostedClawdBoundaryDto(): FutureHostedClawdBoundaryDto {
  return {
    dtoKind: "future_hosted_clawd",
    implemented: false,
    requiresExplicitApproval: true,
    blockedScopes: [
      "persistence",
      "database",
      "hosted_clawd",
      "stripe",
      "xp_evidence",
      "oauth",
      "automation",
      "reports_exports",
    ],
  };
}
