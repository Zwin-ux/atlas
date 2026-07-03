import { z } from "zod";
import {
  districtCandidateSceneStressorSchema,
  districtCandidateSourceNoteSchema,
} from "./districtCandidatePack.js";
import type { DistrictPlayableGate, WorldPlaceCategory } from "./types.js";

const curatedAnchorRoleSchema = z.enum([
  "district_identity",
  "mixed_use_area",
  "destination_landmark",
  "transit_anchor",
  "venue_anchor",
  "civic_anchor",
]);

const curatedRenderPolicySchema = z.enum(["draft_only", "blocked_until_coordinates"]);

const curatedAnchorCategorySchema = z.enum([
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
] satisfies [WorldPlaceCategory, ...WorldPlaceCategory[]]);

const promotionBlockerSchema = z.enum([
  "coordinates_or_bounds_missing",
  "provider_category_confidence_missing",
  "public_product_loop_screenshots_missing",
  "visual_acceptance_missing",
  "product_readiness_missing",
  "split_guard_missing",
]);

export const districtCuratedAnchorSchema = z
  .object({
    id: z.string().min(1),
    sourceAnchorId: z.string().min(1),
    label: z.string().min(1),
    category: curatedAnchorCategorySchema,
    role: curatedAnchorRoleSchema,
    sceneRole: z.string().min(1),
    sourceNoteIds: z.array(z.string().min(1)).min(1),
    renderPolicy: curatedRenderPolicySchema,
    publicPlaceClaim: z.literal(false),
    requiredBeforePublic: z.array(z.string().min(1)).min(1),
    sceneStressors: z.array(districtCandidateSceneStressorSchema).min(1),
  })
  .strict();

export const districtCuratedPackSchema = z
  .object({
    packId: z.string().min(1),
    candidatePackId: z.string().min(1),
    anchorPackId: z.string().min(1),
    version: z.string().min(1),
    stateCode: z.literal("CA"),
    countySlug: z.string().min(1),
    countyGeoid: z.string().regex(/^\d{5}$/),
    districtSlug: z.string().min(1),
    districtGeoid: z.string().regex(/^\d{7}$/),
    promotionStatus: z.literal("draft_only"),
    currentCoverageTier: z.literal("L1_COUNTY_SHELL"),
    targetCoverageTier: z.literal("L2_CURATED_DISTRICT"),
    playableNow: z.literal(false),
    publicNow: z.literal(false),
    sourceNotes: z.array(districtCandidateSourceNoteSchema).min(1),
    curatedAnchors: z.array(districtCuratedAnchorSchema).min(1),
    requiredBeforeL2: z.array(
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
    promotionBlockers: z.array(promotionBlockerSchema).min(1),
    objectKitRequirements: z.array(z.string().min(1)).min(1),
    screenshotRequirements: z.array(z.string().min(1)).min(1),
    rejectRules: z.array(z.string().min(1)).min(1),
  })
  .strict()
  .superRefine((pack, ctx) => {
    const sourceNoteIds = new Set(pack.sourceNotes.map((note) => note.id));
    for (const [index, anchor] of pack.curatedAnchors.entries()) {
      for (const sourceNoteId of anchor.sourceNoteIds) {
        if (!sourceNoteIds.has(sourceNoteId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["curatedAnchors", index, "sourceNoteIds"],
            message: `Curated anchor references unknown source note: ${sourceNoteId}`,
          });
        }
      }
    }
  });

export type DistrictCuratedAnchor = z.infer<typeof districtCuratedAnchorSchema>;
export type DistrictCuratedPack = z.infer<typeof districtCuratedPackSchema>;

export class DistrictCuratedPackValidationError extends Error {
  readonly issues: string[];

  constructor(sourceLabel: string, issues: string[]) {
    super(`Invalid district curated pack ${sourceLabel}: ${issues.join("; ")}`);
    this.name = "DistrictCuratedPackValidationError";
    this.issues = issues;
  }
}

export function parseDistrictCuratedPack(input: unknown, sourceLabel = "input"): DistrictCuratedPack {
  const result = districtCuratedPackSchema.safeParse(input);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    });

    throw new DistrictCuratedPackValidationError(sourceLabel, issues);
  }

  return result.data;
}
