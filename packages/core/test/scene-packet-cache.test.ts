import { describe, expect, it } from "vitest";
import {
  assertScenePacketCachePlanSafe,
  createScenePacketCacheKey,
  createScenePacketCachePlan,
  hashScenePacketViewportFrame,
  SCENE_PACKET_CACHE_CONTRACT_UPDATE_ID,
  scenePacketCachePolicyForReadiness,
} from "../src/index.js";

describe("scene packet cache contract", () => {
  it("creates deterministic keys from normalized county, camera, and viewport inputs", () => {
    const first = createScenePacketCacheKey({
      countryCode: "US",
      stateCode: "CA",
      countySlug: "Riverside CA",
      districtSlug: "Eastvale",
      cameraPresetId: "Desktop",
      viewportFrame: {
        minX: 0.25,
        maxX: 12.5,
        minY: -4,
        maxY: 9.75,
      },
    });
    const second = createScenePacketCacheKey({
      countryCode: "us",
      stateCode: "ca",
      countySlug: "riverside-ca",
      districtSlug: "eastvale",
      cameraPresetId: "desktop",
      windowHash: hashScenePacketViewportFrame({
        minX: 0.25,
        maxX: 12.5,
        minY: -4,
        maxY: 9.75,
      }),
    });

    expect(first).toEqual(second);
    expect(first.key).toContain("atlas:scene-packet:v1:us:ca:riverside-ca:eastvale:desktop");
    expect(first.parts.engineUpdateId).toBe("postalpha-0-31e-server-scene-packet-cache-contract");
  });

  it("keeps Riverside public playable scene packets runtime-only and provider-free", () => {
    const plan = createScenePacketCachePlan({
      countryCode: "US",
      stateCode: "CA",
      countySlug: "riverside-ca",
      districtSlug: "eastvale",
      cameraPresetId: "mobile",
      windowHash: "window-eastvale-core",
      readiness: "public_playable",
      sourceNotes: [
        {
          source: "curated",
          label: "Riverside/Eastvale curated public Alpha scene",
          attribution: "Atlas curated fixture",
          ttlSeconds: 3600,
        },
      ],
    });

    expect(plan.policy).toMatchObject({
      storageMode: "runtime_memory",
      canPersist: false,
      providerGeometryAllowed: false,
      liveProviderAllowed: false,
    });
    expect(plan.update).toBe(SCENE_PACKET_CACHE_CONTRACT_UPDATE_ID);
    expect(plan.packet).toMatchObject({
      containsScene: true,
      playable: true,
      publicRouteAllowed: true,
      containsProviderGeometry: false,
      structuredContentSafe: true,
      metaOnlyScene: true,
    });
    expect(assertScenePacketCachePlanSafe(plan)).toEqual({
      passed: true,
      blockers: [],
    });
  });

  it("keeps shell counties public as metadata without scene packets", () => {
    const plan = createScenePacketCachePlan({
      countryCode: "US",
      stateCode: "CA",
      countySlug: "orange-ca",
      cameraPresetId: "mobile",
      readiness: "shell_only",
      sourceNotes: [
        {
          source: "census",
          label: "2024 Census county identity",
          attribution: "US Census Gazetteer",
          ttlSeconds: 86400,
        },
      ],
    });

    expect(plan.packet).toMatchObject({
      containsScene: false,
      playable: false,
      publicRouteAllowed: true,
    });
    expect(plan.generation.status).toBe("not_queued");
    expect(assertScenePacketCachePlanSafe(plan).passed).toBe(true);
  });

  it("keeps Anaheim hidden draft packets non-public and non-playable", () => {
    const plan = createScenePacketCachePlan({
      countryCode: "US",
      stateCode: "CA",
      countySlug: "orange-ca",
      districtSlug: "anaheim-candidate",
      cameraPresetId: "residential_detail",
      windowHash: "anaheim-hidden-convention-center",
      readiness: "hidden_draft",
      sceneId: "city-world-draft-orange-ca-anaheim-candidate",
    });

    expect(plan.packet).toMatchObject({
      sceneId: "city-world-draft-orange-ca-anaheim-candidate",
      containsScene: true,
      playable: false,
      publicRouteAllowed: false,
      metaOnlyScene: true,
    });
    expect(assertScenePacketCachePlanSafe(plan).passed).toBe(true);
  });

  it("blocks future provider and background generation until DB/provider gates reopen", () => {
    const providerPlan = createScenePacketCachePlan({
      countryCode: "US",
      stateCode: "CA",
      countySlug: "orange-ca",
      districtSlug: "anaheim-candidate",
      cameraPresetId: "mobile",
      readiness: "hidden_draft",
      generationMode: "provider_normalized_future",
    });
    const backgroundPlan = createScenePacketCachePlan({
      countryCode: "US",
      stateCode: "CA",
      countySlug: "riverside-ca",
      districtSlug: "eastvale",
      cameraPresetId: "desktop",
      readiness: "public_playable",
      generationMode: "background_generation_future",
    });

    expect(providerPlan.generation.status).toBe("blocked");
    expect(providerPlan.generation.blockers).toEqual(
      expect.arrayContaining(["provider_normalization_not_enabled", "provider_geometry_not_allowed"]),
    );
    expect(backgroundPlan.generation.status).toBe("blocked");
    expect(backgroundPlan.generation.blockers).toEqual(
      expect.arrayContaining(["background_generation_not_enabled", "persistent_scene_packet_storage_not_enabled"]),
    );
  });

  it("names safety blockers for accidental persistence, provider source notes, and hidden draft exposure", () => {
    const plan = createScenePacketCachePlan({
      countryCode: "US",
      stateCode: "CA",
      countySlug: "orange-ca",
      districtSlug: "anaheim-candidate",
      cameraPresetId: "mobile",
      readiness: "hidden_draft",
      sourceNotes: [
        {
          source: "google",
          label: "Google lookup",
          attribution: "Google Places",
          ttlSeconds: 300,
        },
      ],
    });

    const unsafe = {
      ...plan,
      policy: {
        ...plan.policy,
        canPersist: true,
        providerGeometryAllowed: true,
        liveProviderAllowed: true,
      },
      packet: {
        ...plan.packet,
        publicRouteAllowed: true,
        containsProviderGeometry: true,
      },
    };

    const safety = assertScenePacketCachePlanSafe(unsafe as typeof plan);
    expect(safety.passed).toBe(false);
    expect(safety.blockers).toEqual(
      expect.arrayContaining([
        "Scene packet persistence is gated; canPersist must stay false.",
        "Provider geometry must not be allowed in scene packets.",
        "Live provider calls must not be allowed by scene packet cache policy.",
        "Scene packet boundary must not contain provider geometry.",
        "Google/provider source notes cannot feed scene packet cache plans before provider normalization gates reopen.",
        "Hidden draft packets must not be public routes.",
      ]),
    );
  });

  it("keeps storage policy explicit for every readiness state", () => {
    expect(scenePacketCachePolicyForReadiness("public_playable").ttlSeconds).toBeGreaterThan(0);
    expect(scenePacketCachePolicyForReadiness("shell_only").ttlSeconds).toBeGreaterThan(0);
    expect(scenePacketCachePolicyForReadiness("hidden_draft").ttlSeconds).toBeGreaterThan(0);
    expect(scenePacketCachePolicyForReadiness("unsupported").storageMode).toBe("none");
    expect(scenePacketCachePolicyForReadiness("blocked").storageMode).toBe("none");
  });
});
