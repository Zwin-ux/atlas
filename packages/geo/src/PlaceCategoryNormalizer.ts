export type AtlasPlaceCategory =
  | "home_area"
  | "food_drink"
  | "shop"
  | "service"
  | "park"
  | "school"
  | "civic"
  | "health"
  | "fitness"
  | "entertainment"
  | "transit"
  | "landmark"
  | "unknown";

const GOOGLE_TYPE_CATEGORY = new Map<string, AtlasPlaceCategory>([
  ["apartment_building", "home_area"],
  ["housing_complex", "home_area"],
  ["lodging", "home_area"],
  ["restaurant", "food_drink"],
  ["cafe", "food_drink"],
  ["coffee_shop", "food_drink"],
  ["bakery", "food_drink"],
  ["bar", "food_drink"],
  ["meal_takeaway", "food_drink"],
  ["meal_delivery", "food_drink"],
  ["supermarket", "shop"],
  ["grocery_store", "shop"],
  ["shopping_mall", "shop"],
  ["store", "shop"],
  ["clothing_store", "shop"],
  ["book_store", "shop"],
  ["electronics_store", "shop"],
  ["hardware_store", "shop"],
  ["car_wash", "service"],
  ["laundry", "service"],
  ["beauty_salon", "service"],
  ["hair_care", "service"],
  ["bank", "service"],
  ["atm", "service"],
  ["post_office", "service"],
  ["park", "park"],
  ["campground", "park"],
  ["tourist_attraction", "landmark"],
  ["point_of_interest", "landmark"],
  ["school", "school"],
  ["primary_school", "school"],
  ["secondary_school", "school"],
  ["university", "school"],
  ["library", "civic"],
  ["city_hall", "civic"],
  ["courthouse", "civic"],
  ["local_government_office", "civic"],
  ["police", "civic"],
  ["fire_station", "civic"],
  ["hospital", "health"],
  ["doctor", "health"],
  ["dentist", "health"],
  ["pharmacy", "health"],
  ["physiotherapist", "health"],
  ["gym", "fitness"],
  ["fitness_center", "fitness"],
  ["spa", "fitness"],
  ["movie_theater", "entertainment"],
  ["bowling_alley", "entertainment"],
  ["amusement_center", "entertainment"],
  ["museum", "entertainment"],
  ["art_gallery", "entertainment"],
  ["bus_station", "transit"],
  ["transit_station", "transit"],
  ["train_station", "transit"],
  ["light_rail_station", "transit"],
  ["airport", "transit"],
  ["parking", "transit"],
]);

const GENERIC_GOOGLE_TYPES = new Set(["point_of_interest", "establishment"]);

export function normalizeProviderPlaceCategory(input: {
  primaryType?: string | undefined;
  types?: readonly string[] | undefined;
}): AtlasPlaceCategory {
  const candidates = [input.primaryType, ...(input.types ?? [])]
    .map((type) => type?.trim().toLowerCase())
    .filter((type): type is string => Boolean(type));

  for (const candidate of candidates.filter((type) => !GENERIC_GOOGLE_TYPES.has(type))) {
    const category = GOOGLE_TYPE_CATEGORY.get(candidate);
    if (category) return category;
  }

  for (const candidate of candidates) {
    const category = GOOGLE_TYPE_CATEGORY.get(candidate);
    if (category) return category;
  }

  return "unknown";
}
