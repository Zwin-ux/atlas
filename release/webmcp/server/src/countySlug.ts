const COUNTY_SLUG = /^[a-z0-9-]+$/;

export function isValidCountySlug(value: string | undefined): value is string {
  return typeof value === "string" && COUNTY_SLUG.test(value);
}
