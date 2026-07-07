import type { DeterministicGeneratedDistrictInput } from "./cityWorldGeneratedDistrictTypes.js";

export function deterministicGeneratedDistrictSeedForCounty(input: DeterministicGeneratedDistrictInput): number {
  const centroid = input.county.centroid
    ? `${roundCoordinate(input.county.centroid.latitude)},${roundCoordinate(input.county.centroid.longitude)}`
    : "no-centroid";
  const hash = fnv1a32(
    [
      input.county.geoid,
      input.county.stateCode,
      input.county.countySlug,
      input.county.name,
      centroid,
      input.seedSalt ?? "atlas-generated-district-v1",
    ].join("|"),
  );
  return hash === 0 ? 1 : hash;
}

export function unitFromSeed(seed: number, salt: string): number {
  return fnv1a32(`${seed}:${salt}`) / 0xffffffff;
}

export function fnv1a32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function roundCoordinate(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
