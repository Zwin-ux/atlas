import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const baseUrl = (process.env.ATLAS_BASE_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");
const mcpUrl = new URL(process.env.ATLAS_MCP_URL ?? `${baseUrl}/mcp`);
const query = process.env.ATLAS_VERIFY_LOOKUP_QUERY ?? "Eastvale, CA";
const baseRadius = Number(process.env.ATLAS_VERIFY_RADIUS_METERS ?? 3200 + (Date.now() % 700));
const restRadiusMeters = normalizeRadius(baseRadius);
const mcpRadiusMeters = normalizeRadius(baseRadius + 1);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeRadius(value) {
  const radius = Number(value);
  if (!Number.isFinite(radius) || radius < 100 || radius > 50_000) {
    return 3500;
  }
  return Math.trunc(radius);
}

async function fetchJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.json().catch(async () => ({ error: await response.text() }));
  return { status: response.status, body };
}

function assertCoverageUnpromoted(directory, label) {
  assert(directory.status === 200, `${label} coverage directory returned HTTP ${directory.status}.`);
  assert(directory.body?.type === "usWorldCoverageDirectory", `${label} coverage directory returned wrong type.`);
  assert(directory.body.totals?.playableCountyCount === 1, `${label} must keep exactly one playable county.`);
  assert(directory.body.playableCounties?.[0]?.countySlug === "riverside-ca", `${label} must keep Riverside as the only playable county.`);
  assert(directory.body.totals?.providerNormalizedCountyCount === 0, `${label} must not claim provider-normalized counties.`);
  assert(directory.body.totals?.publicQualityCountyCount === 0, `${label} must not claim public-quality counties.`);
}

function assertNormalizedLookup(lookup, label) {
  assert(lookup?.type === "worldPlaceLookup", `${label} returned wrong lookup type.`);
  assert(lookup.query === query, `${label} did not preserve query.`);
  assert(Array.isArray(lookup.places), `${label} places must be an array.`);
  assert(lookup.places.length > 0, `${label} returned no places.`);
  assert(lookup.cache?.key && Number.isFinite(lookup.cache?.ttlSeconds), `${label} must expose cache key and ttlSeconds.`);
  assert(Array.isArray(lookup.cache?.sourceNotes) && lookup.cache.sourceNotes.length > 0, `${label} must expose cache source notes.`);
  assert(lookup.providerReadiness?.status === "lookup_only", `${label} must expose lookup-only provider readiness.`);
  assert(Array.isArray(lookup.providerReadiness.sources) && lookup.providerReadiness.sources.length > 0, `${label} provider readiness must expose sources.`);
  assert(lookup.providerReadiness.mode === lookup.mode, `${label} provider readiness mode must match lookup mode.`);
  assert(lookup.providerReadiness.cache?.key === lookup.cache.key, `${label} provider readiness cache key must match response cache key.`);
  assert(lookup.providerReadiness.cache?.ttlSeconds === lookup.cache.ttlSeconds, `${label} provider readiness ttlSeconds must match response cache.`);
  assert(
    ["bounded_atlas_categories", "contains_unknown_category"].includes(lookup.providerReadiness.normalizedCategoryStatus),
    `${label} provider readiness must expose normalized category status.`,
  );
  assert(
    ["mock_verified", "provider_mapped"].includes(lookup.providerReadiness.normalizedCategoryConfidence),
    `${label} provider readiness must expose normalized category confidence.`,
  );
  assert(lookup.providerReadiness.coveragePromotion === false, `${label} provider readiness must block coverage promotion.`);
  assert(lookup.providerReadiness.sceneEligible === false, `${label} provider readiness must block scene eligibility.`);
  assert(lookup.providerReadiness.publicQuality === false, `${label} provider readiness must block public-quality claims.`);
  assert(lookup.providerReadiness.sceneGeometry === false, `${label} provider readiness must block scene geometry.`);
  assert(lookup.providerReadiness.rawProviderPayloadExposed === false, `${label} provider readiness must block raw provider payload exposure.`);
  assert(
    lookup.providerReadiness.structuredContentPolicy === "atlas_normalized_only",
    `${label} provider readiness must require Atlas-normalized structuredContent.`,
  );
  assert(lookup.providerReadiness.fieldMaskPolicy?.mode === "allowlist", `${label} provider readiness must expose field-mask allowlist mode.`);
  assert(lookup.providerReadiness.fieldMaskPolicy?.wildcardAllowed === false, `${label} provider readiness must forbid wildcard field masks.`);
  assert(
    Array.isArray(lookup.providerReadiness.limitations) && lookup.providerReadiness.limitations.length > 0,
    `${label} provider readiness must expose limitations.`,
  );
  assert(!("placeId" in (lookup.resolvedLocation ?? {})), `${label} leaked provider placeId in resolvedLocation.`);
  assert(typeof lookup.runtime?.cacheHit === "boolean", `${label} must expose runtime.cacheHit.`);
  assert(lookup.runtime?.cachedAt && lookup.runtime?.expiresAt, `${label} must expose runtime cache timestamps.`);

  for (const place of lookup.places) {
    assert(typeof place.id === "string" && place.id.length > 0, `${label} place missing normalized id.`);
    assert(place.id.startsWith("lookup-"), `${label} place id must be Atlas-owned lookup id, got ${place.id}.`);
    assert(typeof place.label === "string" && place.label.length > 0, `${label} place missing label.`);
    assert(typeof place.category === "string" && place.category.length > 0, `${label} place missing normalized category.`);
    assert(Array.isArray(place.sourceNotes) && place.sourceNotes.length > 0, `${label} place missing source notes.`);
    assert(!("primaryType" in place), `${label} leaked raw Google primaryType.`);
    assert(!("types" in place), `${label} leaked raw Google types.`);
    assert(!("placeId" in place), `${label} leaked provider placeId in place summary.`);
  }
}

function structuredContent(result, toolName) {
  assert(result && typeof result === "object", `${toolName} returned no result object.`);
  assert(!result.isError, `${toolName} returned an MCP error.`);
  assert(result.structuredContent && typeof result.structuredContent === "object", `${toolName} returned no structuredContent.`);
  return result.structuredContent;
}

function toolText(result, toolName) {
  assert(result && typeof result === "object", `${toolName} returned no result object.`);
  assert(Array.isArray(result.content), `${toolName} returned no content array.`);
  return result.content.map((part) => (typeof part?.text === "string" ? part.text : "")).join("\n");
}

function assertLookupToolCopy(text, label) {
  const normalized = text.toLowerCase();
  assert(normalized.includes("lookup-only"), `${label} text must say lookup-only.`);
  assert(normalized.includes("not saved"), `${label} text must say lookup results are not saved.`);
  assert(normalized.includes("not coverage proof"), `${label} text must say lookup is not coverage proof.`);
  assert(normalized.includes("does not unlock a playable county map"), `${label} text must block county-playability claims.`);
}

const beforeCoverage = await fetchJson("/api/world/us/coverage");
assertCoverageUnpromoted(beforeCoverage, "before lookup");

const restLookupPath = `/api/world/lookup?query=${encodeURIComponent(query)}&radiusMeters=${restRadiusMeters}`;
const restFirst = await fetchJson(restLookupPath);
assert(restFirst.status === 200, `REST world lookup returned HTTP ${restFirst.status}: ${JSON.stringify(restFirst.body)}`);
assertNormalizedLookup(restFirst.body, "REST first lookup");

const restSecond = await fetchJson(restLookupPath);
assert(restSecond.status === 200, `REST cached lookup returned HTTP ${restSecond.status}: ${JSON.stringify(restSecond.body)}`);
assertNormalizedLookup(restSecond.body, "REST cached lookup");
assert(restSecond.body.runtime.cacheHit === true, "Second REST lookup should hit runtime cache.");
assert(restSecond.body.cache.key === restFirst.body.cache.key, "Second REST lookup must preserve cache key.");

const client = new Client({
  name: "atlas-world-lookup-boundary-verifier",
  version: "0.1.0",
});
const transport = new StreamableHTTPClientTransport(mcpUrl);

try {
  await client.connect(transport);
  const lookupResult = await client.callTool({
    name: "lookup_world_places",
    arguments: { query, radiusMeters: mcpRadiusMeters },
  });
  const mcpLookupText = toolText(lookupResult, "lookup_world_places");
  assertLookupToolCopy(mcpLookupText, "lookup_world_places");
  const mcpLookup = structuredContent(lookupResult, "lookup_world_places");
  assertNormalizedLookup(mcpLookup, "MCP first lookup");

  const cachedLookupResult = await client.callTool({
    name: "lookup_world_places",
    arguments: { query, radiusMeters: mcpRadiusMeters },
  });
  const mcpCachedLookupText = toolText(cachedLookupResult, "lookup_world_places cached");
  assertLookupToolCopy(mcpCachedLookupText, "lookup_world_places cached");
  const mcpCachedLookup = structuredContent(cachedLookupResult, "lookup_world_places cached");
  assertNormalizedLookup(mcpCachedLookup, "MCP cached lookup");
  assert(mcpCachedLookup.runtime.cacheHit === true, "Second MCP lookup should hit runtime cache.");
  assert(mcpCachedLookup.cache.key === mcpLookup.cache.key, "Second MCP lookup must preserve cache key.");

  const shellCounty = structuredContent(
    await client.callTool({
      name: "select_county",
      arguments: { countySlug: "orange-ca" },
    }),
    "select_county shell after lookup",
  );
  assert(shellCounty.type === "countyCoverageSummary", "Orange County must remain a shell coverage summary after lookup.");
  assert(shellCounty.coverageTier === "L1_COUNTY_SHELL", "Orange County must remain L1 after provider lookup.");
  assert(shellCounty.playableDistrictCount === 0, "Orange County must not gain playable districts from provider lookup.");
} finally {
  await client.close().catch(() => {});
}

const afterCoverage = await fetchJson("/api/world/us/coverage");
assertCoverageUnpromoted(afterCoverage, "after lookup");

console.log(
  JSON.stringify(
    {
      ok: true,
      baseUrl,
      mcpUrl: mcpUrl.toString(),
      query,
      rest: {
        radiusMeters: restRadiusMeters,
        mode: restFirst.body.mode,
        placeCount: restFirst.body.places.length,
        firstCacheHit: restFirst.body.runtime.cacheHit,
        secondCacheHit: restSecond.body.runtime.cacheHit,
        cacheKey: restFirst.body.cache.key,
        providerReadiness: restFirst.body.providerReadiness,
      },
      mcp: {
        radiusMeters: mcpRadiusMeters,
      },
      coverage: {
        playableCountyCount: afterCoverage.body.totals.playableCountyCount,
        providerNormalizedCountyCount: afterCoverage.body.totals.providerNormalizedCountyCount,
        publicQualityCountyCount: afterCoverage.body.totals.publicQualityCountyCount,
        playableCountySlug: afterCoverage.body.playableCounties[0].countySlug,
      },
    },
    null,
    2,
  ),
);
