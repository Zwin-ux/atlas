import { z } from "zod";
import type { CountyCoverageTier, DistrictCandidateGap, DistrictPlayableGate, WorldPlaceCategory, WorldSourceKind } from "./types.js";

export const districtCandidateSceneStressorSchema = z.enum([
  "residential_variety",
  "commerce_landmark_read",
  "road_lot_contact",
  "parking_apron_without_cars",
  "mobile_camera_density",
]);

export const districtCandidateSourceNoteSchema = z
  .object({
    id: z.string().min(1),
    source: z.enum(["mock", "curated", "google", "census", "osm", "local-open-data"] satisfies [WorldSourceKind, ...WorldSourceKind[]]),
    label: z.string().min(1),
    attribution: z.string().min(1),
    url: z.string().url().optional(),
    lastChecked: z.string().min(1),
    verifies: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const districtCandidateAnchorRequirementSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    category: z.enum([
      "home_area",
      "food_drink",
      "shop",
      "service",
      "park",
      "school",
      "civic",
      "health",
      "fitness",
      "entertainment",
      "transit",
      "landmark",
      "unknown",
    ] satisfies [WorldPlaceCategory, ...WorldPlaceCategory[]]),
    anchorKind: z.enum(["district_identity", "area_role", "category_role"]),
    sourceNoteIds: z.array(z.string().min(1)).min(1),
    renderableNow: z.literal(false),
    requiredForPlayable: z.literal(true),
    sceneStressors: z.array(districtCandidateSceneStressorSchema).min(1),
  })
  .strict();

export const districtCandidatePackSchema = z
  .object({
    packId: z.string().min(1),
    version: z.string().min(1),
    stateCode: z.literal("CA"),
    countySlug: z.string().min(1),
    countyGeoid: z.string().regex(/^\d{5}$/),
    districtSlug: z.string().min(1),
    districtLabel: z.string().min(1),
    districtGeoid: z.string().regex(/^\d{7}$/),
    candidateStatus: z.literal("candidate_only"),
    currentCoverageTier: z.literal("L1_COUNTY_SHELL" satisfies Extract<CountyCoverageTier, "L1_COUNTY_SHELL">),
    targetCoverageTier: z.literal("L2_CURATED_DISTRICT" satisfies Extract<CountyCoverageTier, "L2_CURATED_DISTRICT">),
    playableNow: z.literal(false),
    promotionBlocked: z.literal(true),
    sourceNotes: z.array(districtCandidateSourceNoteSchema).min(1),
    anchorRequirements: z.array(districtCandidateAnchorRequirementSchema).min(1),
    requiredBeforePlayable: z.array(
      z.enum([
        "curated_district_pack",
        "place_anchors_with_source_notes",
        "bounded_scene_compiler_proof",
        "desktop_mobile_product_loop_screenshots",
        "lumen_visual_acceptance",
        "mira_readiness_acceptance",
        "forge_split_guard",
      ] satisfies [DistrictPlayableGate, ...DistrictPlayableGate[]]),
    ).min(1),
    knownGaps: z.array(
      z.enum([
        "no_curated_places",
        "no_local_scene",
        "no_provider_normalized_categories",
        "not_public_quality",
      ] satisfies [DistrictCandidateGap, ...DistrictCandidateGap[]]),
    ).min(1),
    acceptanceCriteria: z.array(z.string().min(1)).min(1),
    rejectRules: z.array(z.string().min(1)).min(1),
  })
  .strict()
  .superRefine((pack, ctx) => {
    const sourceNoteIds = new Set(pack.sourceNotes.map((note) => note.id));
    for (const [index, anchor] of pack.anchorRequirements.entries()) {
      for (const sourceNoteId of anchor.sourceNoteIds) {
        if (!sourceNoteIds.has(sourceNoteId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["anchorRequirements", index, "sourceNoteIds"],
            message: `Anchor references unknown source note: ${sourceNoteId}`,
          });
        }
      }
    }
  });

export type DistrictCandidateSceneStressor = z.infer<typeof districtCandidateSceneStressorSchema>;
export type DistrictCandidateSourceNote = z.infer<typeof districtCandidateSourceNoteSchema>;
export type DistrictCandidateAnchorRequirement = z.infer<typeof districtCandidateAnchorRequirementSchema>;
export type DistrictCandidatePack = z.infer<typeof districtCandidatePackSchema>;

export class DistrictCandidatePackValidationError extends Error {
  readonly issues: string[];

  constructor(sourceLabel: string, issues: string[]) {
    super(`Invalid district candidate pack ${sourceLabel}: ${issues.join("; ")}`);
    this.name = "DistrictCandidatePackValidationError";
    this.issues = issues;
  }
}

export function parseDistrictCandidatePack(input: unknown, sourceLabel = "input"): DistrictCandidatePack {
  const result = districtCandidatePackSchema.safeParse(input);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    });

    throw new DistrictCandidatePackValidationError(sourceLabel, issues);
  }

  return result.data;
}
