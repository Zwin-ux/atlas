import assert from "node:assert/strict";
import { test } from "vitest";

import { classifyTownAnchors, countyStem } from "../src/atlas/townTiers.js";

test("countyStem strips administrative suffixes", () => {
  assert.equal(countyStem("Riverside County"), "riverside");
  assert.equal(countyStem("Orleans Parish"), "orleans");
  assert.equal(countyStem("Miami-Dade County"), "miami dade");
  assert.equal(countyStem("District of Columbia"), "columbia");
});

test("names the seat from the county stem when possible", () => {
  const ranked = classifyTownAnchors("Riverside County", [
    { name: "Eastvale", lon: -117.5, lat: 33.9, population: 71_000 },
    { name: "Riverside", lon: -117.4, lat: 33.95, population: 314_000 },
    { name: "Corona", lon: -117.56, lat: 33.87, population: 160_000 },
  ]);

  assert.equal(ranked[0]?.tier, "seat");
  assert.equal(ranked[0]?.name, "Riverside");
  assert.equal(ranked[0]?.seatSource, "name");
  assert.equal(ranked.filter((t) => t.tier === "primary").length, 2);
});

test("falls back to the largest place when the name does not match", () => {
  const ranked = classifyTownAnchors("Loving County", [
    { name: "Mentone", lon: -103.6, lat: 31.7, population: 0 },
  ]);
  assert.equal(ranked[0]?.name, "Mentone");
  assert.equal(ranked[0]?.tier, "seat");
  assert.equal(ranked[0]?.seatSource, "only");
});

test("Miami leads Miami-Dade even when not the sole name match token", () => {
  const ranked = classifyTownAnchors("Miami-Dade County", [
    { name: "Hialeah", lon: -80.3, lat: 25.8, population: 235_000 },
    { name: "Miami", lon: -80.2, lat: 25.7, population: 487_000 },
    { name: "Homestead", lon: -80.4, lat: 25.4, population: 80_000 },
    { name: "Doral", lon: -80.35, lat: 25.8, population: 75_000 },
    { name: "Aventura", lon: -80.14, lat: 25.95, population: 40_000 },
    { name: "Cutler Bay", lon: -80.3, lat: 25.58, population: 45_000 },
  ]);

  assert.equal(ranked[0]?.name, "Miami");
  assert.equal(ranked[0]?.tier, "seat");
  assert.equal(ranked.filter((t) => t.tier === "primary").length, 5);
  assert.equal(ranked.filter((t) => t.tier === "secondary").length, 0);
  assert.ok(ranked[0]!.importance > ranked[1]!.importance);
});

test("competitive name match still beats a slightly larger non-match", () => {
  // Name match at ≥20% of largest keeps the seat (Riverside-class).
  const ranked = classifyTownAnchors("Example County", [
    { name: "Example", lon: 0, lat: 0, population: 300_000 },
    { name: "Other", lon: 1, lat: 1, population: 400_000 },
  ]);
  assert.equal(ranked.find((t) => t.tier === "seat")?.name, "Example");
  assert.equal(ranked[0]?.seatSource, "name");
});

test("Honolulu County prefers Urban Honolulu over East Honolulu CDP", () => {
  const ranked = classifyTownAnchors("Honolulu County", [
    { name: "East Honolulu", lon: -157.7, lat: 21.3, population: 50_000 },
    { name: "Urban Honolulu", lon: -157.85, lat: 21.3, population: 350_000 },
    { name: "Pearl City", lon: -157.97, lat: 21.4, population: 45_000 },
  ]);
  assert.equal(ranked[0]?.tier, "seat");
  assert.equal(ranked[0]?.name, "Urban Honolulu");
  assert.equal(ranked[0]?.seatSource, "name");
});

test("namesake villages do not steal the seat from the real lead city", () => {
  const ranked = classifyTownAnchors("Sedgwick County", [
    { name: "Wichita", lon: -97.3, lat: 37.7, population: 400_991 },
    { name: "Sedgwick", lon: -97.4, lat: 37.9, population: 196 },
    { name: "Derby", lon: -97.2, lat: 37.5, population: 25_000 },
  ]);
  assert.equal(ranked[0]?.name, "Wichita");
  assert.equal(ranked[0]?.tier, "seat");
  assert.equal(ranked[0]?.seatSource, "largest");
});
