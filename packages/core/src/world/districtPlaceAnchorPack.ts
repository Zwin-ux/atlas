import { z } from "zod";
import {
  districtCandidateSceneStressorSchema,
  districtCandidateSourceNoteSchema,
} from "./districtCandidatePack.js";
import type { DistrictPlayableGate, WorldPlaceCategory } from "./types.js";

const placeAnchorRoleSchema = z.enum(["district_identity", "area_anchor", "place_anchor"]);

const placeAnchorCategorySchema = z.enum([
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

const placeAnchorRenderableGateSchema = z.enum([
  "place_source_review",
  "coordinates_or_bounds",
  "category_confidence",
  "compiler_position",
  "desktop_mobile_product_loop_screenshots",
  "lumen_visual_acceptance",
  "mira_readiness_acceptance",
  "forge_split_guard",
]);

export const districtPlaceAnchorSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    category: placeAnchorCategorySchema,
    anchorRole: placeAnchorRoleSchema,
    sourceNoteIds: z.array(z.string().min(1)).min(1),
    sourceFact: z.string().min(1),
    providerNormalized: z.literal(false),
    renderableNow: z.literal(false),
    sceneEligible: z.literal(false),
    sceneStressors: z.array(districtCandidateSceneStressorSchema).min(1),
    requiredBeforeRenderable: z.array(placeAnchorRenderableGateSchema).min(1),
  })
  .strict();

export const districtPlaceAnchorPackSchema = z
  .object({
    packId: z.string().min(1),
    candidatePackId: z.string().min(1),
    version: z.string().min(1),
    stateCode: z.literal("CA"),
    countySlug: z.string().min(1),
    countyGeoid: z.string().regex(/^\d{5}$/),
    districtSlug: z.string().min(1),
    districtGeoid: z.string().regex(/^\d{7}$/),
    anchorStatus: z.literal("source_noted_nonrenderable"),
    playableNow: z.literal(false),
    renderableNow: z.literal(false),
    sourceNotes: z.array(districtCandidateSourceNoteSchema).min(1),
    placeAnchors: z.array(districtPlaceAnchorSchema).min(1),
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
    rejectRules: z.array(z.string().min(1)).min(1),
  })
  .strict()
  .superRefine((pack, ctx) => {
    const sourceNoteIds = new Set(pack.sourceNotes.map((note) => note.id));
    for (const [index, anchor] of pack.placeAnchors.entries()) {
      for (const sourceNoteId of anchor.sourceNoteIds) {
        if (!sourceNoteIds.has(sourceNoteId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["placeAnchors", index, "sourceNoteIds"],
            message: `Place anchor references unknown source note: ${sourceNoteId}`,
          });
        }
      }
    }
  });

export type DistrictPlaceAnchor = z.infer<typeof districtPlaceAnchorSchema>;
export type DistrictPlaceAnchorPack = z.infer<typeof districtPlaceAnchorPackSchema>;
export type DistrictPlaceAnchorRole = z.infer<typeof placeAnchorRoleSchema>;

export class DistrictPlaceAnchorPackValidationError extends Error {
  readonly issues: string[];

  constructor(sourceLabel: string, issues: string[]) {
    super(`Invalid district place anchor pack ${sourceLabel}: ${issues.join("; ")}`);
    this.name = "DistrictPlaceAnchorPackValidationError";
    this.issues = issues;
  }
}

export function parseDistrictPlaceAnchorPack(input: unknown, sourceLabel = "input"): DistrictPlaceAnchorPack {
  const result = districtPlaceAnchorPackSchema.safeParse(input);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    });

    throw new DistrictPlaceAnchorPackValidationError(sourceLabel, issues);
  }

  return result.data;
}
