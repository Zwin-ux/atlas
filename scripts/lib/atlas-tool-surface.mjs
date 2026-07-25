// Single source of truth for the public MCP tool surface.
//
// Atlas v0.3.0 is an atlas of the United States: two read-only tools over US
// Census geography. No accounts, no commerce, no third-party calls, and no tool
// the model is instructed to avoid using. Every verifier that inspects the
// surface imports from here, so it can only change in one place.
//
// History worth keeping. The voxel-era build exposed seven tools, three of
// which (preview_scout_drop, preview_campaign_engine, get_upgrade_options) the
// server's own instructions told the model not to use — a lead-generation
// product wearing a map's clothes. They were retired on 2026-07-25, along with
// the public-notes tools (deferred to a later version) and lookup_world_places
// (a Google dependency, the only open-world tool on the surface, and not
// atlas). `FORBIDDEN_TOOL_PATTERNS` is what stops any of it drifting back.

/** The exact public tool list, sorted. Compare against a sorted live list. */
export const EXPECTED_TOOLS = Object.freeze(["open_atlas_map", "search_atlas_places"]);

/** Retired tool names that must never reappear on the surface. */
export const RETIRED_TOOLS = Object.freeze([
  "preview_scout_drop",
  "preview_campaign_engine",
  "get_upgrade_options",
  "lookup_world_places",
  "select_county",
  "render_voxel_county",
  "ask_county_question",
  "list_atlas_notes",
  "write_atlas_note",
  // Folded into open_atlas_map. It answered without showing anything, which
  // duplicated a capability the base model already has.
  "describe_atlas_place",
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
 * Every Atlas tool only reads, and none of them reach outside Atlas's own
 * Census data. Store review checks annotations against observed behaviour and
 * names incorrect labels as a common cause of rejection, so these are asserted
 * rather than assumed. If a future tool writes anything or calls a third party,
 * this table must change with it.
 */
export const EXPECTED_ANNOTATIONS = Object.freeze({
  open_atlas_map: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  search_atlas_places: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
});

/**
 * Assert a live tool list matches the expected surface exactly.
 *
 * @param {string[]} actualToolNames names from a live tools/list response
 * @returns {string[]} the sorted actual names, for logging
 */
export function assertToolSurface(actualToolNames) {
  const expected = [...EXPECTED_TOOLS];
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
    if (RETIRED_TOOLS.includes(name)) throw new Error(`Retired tool is live on the MCP surface: ${name}.`);
    const pattern = FORBIDDEN_TOOL_PATTERNS.find((candidate) => candidate.test(name));
    if (pattern) throw new Error(`Tool name matches a forbidden pattern ${pattern}: ${name}.`);
  }

  return actual;
}
