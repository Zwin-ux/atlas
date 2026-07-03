import type { CountyCoverageTier, DistrictPlayableGate, WorldPlaceCategory } from "./types.js";

export type CaliforniaDistrictCandidateArchetype = "dense_suburban_commerce" | "inland_logistics_suburb";

export type CaliforniaDistrictSceneStressor =
  | "residential_variety"
  | "commerce_landmark_read"
  | "road_lot_contact"
  | "parking_apron_without_cars"
  | "mobile_camera_density";

export type CaliforniaDistrictCandidatePackEntry = {
  priority: 1 | 2;
  countySlug: string;
  countyGeoid: string;
  districtSlug: string;
  districtLabel: string;
  districtGeoid: string;
  currentCoverageTier: Extract<CountyCoverageTier, "L1_COUNTY_SHELL">;
  targetCoverageTier: Extract<CountyCoverageTier, "L2_CURATED_DISTRICT">;
  playableNow: false;
  archetype: CaliforniaDistrictCandidateArchetype;
  whyThisCandidate: string;
  requiredPlaceCategories: WorldPlaceCategory[];
  sceneStressors: CaliforniaDistrictSceneStressor[];
  requiredBeforePlayable: DistrictPlayableGate[];
};

export const CALIFORNIA_DISTRICT_CANDIDATE_PACK: CaliforniaDistrictCandidatePackEntry[] = [
  {
    priority: 1,
    countySlug: "orange-ca",
    countyGeoid: "06059",
    districtSlug: "anaheim-candidate",
    districtLabel: "Anaheim",
    districtGeoid: "0602000",
    currentCoverageTier: "L1_COUNTY_SHELL",
    targetCoverageTier: "L2_CURATED_DISTRICT",
    playableNow: false,
    archetype: "dense_suburban_commerce",
    whyThisCandidate:
      "Anaheim is the best second-district stress test for a denser suburban commerce map: residential variety, destination commerce, civic landmarks, and parking/lot grammar all matter without requiring paid or provider-normalized claims.",
    requiredPlaceCategories: ["home_area", "shop", "food_drink", "entertainment", "park", "civic", "transit", "landmark"],
    sceneStressors: ["residential_variety", "commerce_landmark_read", "road_lot_contact", "parking_apron_without_cars", "mobile_camera_density"],
    requiredBeforePlayable: [
      "curated_district_pack",
      "place_anchors_with_source_notes",
      "bounded_scene_compiler_proof",
      "desktop_mobile_product_loop_screenshots",
      "lumen_visual_acceptance",
      "mira_readiness_acceptance",
      "forge_split_guard",
    ],
  },
  {
    priority: 2,
    countySlug: "san-bernardino-ca",
    countyGeoid: "06071",
    districtSlug: "ontario-candidate",
    districtLabel: "Ontario",
    districtGeoid: "0653896",
    currentCoverageTier: "L1_COUNTY_SHELL",
    targetCoverageTier: "L2_CURATED_DISTRICT",
    playableNow: false,
    archetype: "inland_logistics_suburb",
    whyThisCandidate:
      "Ontario is the follow-up inland proof: broader roads, commerce/service blocks, apartments, and logistics-adjacent lots should prove the engine can leave Eastvale without becoming a generic grid.",
    requiredPlaceCategories: ["home_area", "shop", "service", "food_drink", "fitness", "park", "transit", "landmark"],
    sceneStressors: ["residential_variety", "commerce_landmark_read", "road_lot_contact", "parking_apron_without_cars", "mobile_camera_density"],
    requiredBeforePlayable: [
      "curated_district_pack",
      "place_anchors_with_source_notes",
      "bounded_scene_compiler_proof",
      "desktop_mobile_product_loop_screenshots",
      "lumen_visual_acceptance",
      "mira_readiness_acceptance",
      "forge_split_guard",
    ],
  },
];

export const FIRST_CALIFORNIA_SECOND_DISTRICT_CANDIDATE = CALIFORNIA_DISTRICT_CANDIDATE_PACK[0];
