// Single source of truth for the public MCP tool surface.
//
// Atlas v0.2.0 is a county map with a public community-notes layer. Six tools,
// no more. Every verifier that inspects the surface imports from here, so the
// surface can only change in one place and every gate moves with it.
//
// History worth keeping: until 2026-07-25 the server also exposed
// preview_scout_drop, preview_campaign_engine, and get_upgrade_options, and the
// server instructions had to tell the model not to use them. A tool the model
// is told to avoid does not belong in a reviewed build, so they were retired.
// `forbiddenToolPatterns` is what stops them — or any commerce-shaped tool —
// from drifting back onto a surface that has no commerce behind it.

/** The exact public tool list, sorted. Compare against a sorted live list. */
export const EXPECTED_TOOLS = Object.freeze([
  "ask_county_question",
  "list_atlas_notes",
  "lookup_world_places",
  "render_voxel_county",
  "select_county",
  "write_atlas_note",
]);

/** Map tools only — the surface when ATLAS_COMMONS_ENABLED is off. */
export const MAP_ONLY_TOOLS = Object.freeze([
  "ask_county_question",
  "lookup_world_places",
  "render_voxel_county",
  "select_county",
]);

/** Commons note tools — registered only when ATLAS_COMMONS_ENABLED is true. */
export const COMMONS_TOOLS = Object.freeze(["list_atlas_notes", "write_atlas_note"]);

/** Retired tool names that must never reappear on the surface. */
export const RETIRED_TOOLS = Object.freeze([
  "preview_scout_drop",
  "preview_campaign_engine",
  "get_upgrade_options",
]);

/**
 * Name shapes that must never appear on the public surface. Atlas has no
 * checkout, no paid tier, and no campaign product; a tool whose name implies
 * one is either dead code coming back or a boundary being crossed.
 */
export const FORBIDDEN_TOOL_PATTERNS = Object.freeze([
  /scout/i,
  /campaign/i,
  /upgrade/i,
  /checkout/i,
  /billing/i,
  /subscribe/i,
  /payment/i,
]);

/**
 * write_atlas_note is the only tool that writes, and lookup_world_places is the
 * only tool that reaches a third party. Store review checks annotations against
 * observed behavior, so these are asserted rather than assumed.
 */
export const EXPECTED_ANNOTATIONS = Object.freeze({
  ask_county_question: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  list_atlas_notes: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  lookup_world_places: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
  render_voxel_county: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  select_county: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  write_atlas_note: { readOnlyHint: false, openWorldHint: false, destructiveHint: true },
});

/**
 * Assert a live tool list matches the expected surface exactly.
 *
 * @param {string[]} actualToolNames names from a live tools/list response
 * @param {{ commonsEnabled?: boolean }} [options] when commonsEnabled is false,
 *   expects the map-only surface instead of the full one
 * @returns {string[]} the sorted actual names, for logging
 */
export function assertToolSurface(actualToolNames, options = {}) {
  const commonsEnabled = options.commonsEnabled ?? true;
  const expected = commonsEnabled ? [...EXPECTED_TOOLS] : [...MAP_ONLY_TOOLS];
  const actual = [...actualToolNames].sort();

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    const missing = expected.filter((name) => !actual.includes(name));
    const extra = actual.filter((name) => !expected.includes(name));
    throw new Error(
      `MCP tool surface mismatch. Expected ${expected.length} tools (${expected.join(", ")}); ` +
        `got ${actual.length} (${actual.join(", ")}).` +
        (missing.length ? ` Missing: ${missing.join(", ")}.` : "") +
        (extra.length ? ` Unexpected: ${extra.join(", ")}.` : ""),
    );
  }

  for (const name of actual) {
    const retired = RETIRED_TOOLS.includes(name);
    if (retired) throw new Error(`Retired tool is live on the MCP surface: ${name}.`);
    const pattern = FORBIDDEN_TOOL_PATTERNS.find((candidate) => candidate.test(name));
    if (pattern) throw new Error(`Tool name matches a forbidden pattern ${pattern}: ${name}.`);
  }

  return actual;
}
