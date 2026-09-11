import { describe, expect, it } from "vitest";

import {
  fingerprintMapView,
  nextRequestGeneration,
  parseAtlasMapView,
  parseMapViewOrRefusal,
  plateFromMapView,
  readHostCapabilities,
  resolveWidgetPlate,
  retainDisplayedPlate,
  shouldFetchDisplayedPlate,
  startingPlateTrail,
  widgetStatusAfterParse,
} from "../src/atlas/viewContract.js";

describe("parseAtlasMapView", () => {
  it("accepts an opened county plate", () => {
    const view = parseAtlasMapView({
      type: "atlasMapView",
      status: "opened",
      level: "county",
      countySlug: "riverside-ca",
      state: "CA",
      title: "Eastvale",
      coverage: "boundary only",
    });
    expect(view?.status).toBe("opened");
    expect(plateFromMapView(view!)).toEqual({
      level: "county",
      countySlug: "riverside-ca",
      state: "ca",
      name: "Eastvale",
    });
  });

  it("does not turn an ambiguous payload into a national plate", () => {
    const view = parseAtlasMapView({
      type: "atlasMapView",
      status: "ambiguous",
      level: "nation",
      title: "Springfield",
      candidates: [
        { name: "Springfield", county: "Sangamon County", countySlug: "sangamon-il", state: "IL", kind: "place" },
        { name: "Springfield", county: "Hampden County", countySlug: "hampden-ma", state: "MA", kind: "place" },
      ],
    });
    expect(view?.status).toBe("ambiguous");
    expect(plateFromMapView(view!)).toBeUndefined();
    expect(view && "plate" in view && view.status === "opened").toBe(false);
  });

  it("does not turn unresolved into a successful map", () => {
    const view = parseAtlasMapView({
      type: "atlasMapView",
      status: "unresolved",
      level: "nation",
      title: "London, United Kingdom",
    });
    expect(view?.status).toBe("unresolved");
    expect(plateFromMapView(view!)).toBeUndefined();
  });

  it("discriminates transport errors from refusals", () => {
    const view = parseAtlasMapView({
      type: "atlasMapView",
      status: "transport_error",
      title: "Atlas could not complete that request",
    });
    expect(view?.status).toBe("transport_error");
    expect(plateFromMapView(view!)).toBeUndefined();
  });

  it("fails closed without a status", () => {
    expect(
      parseAtlasMapView({
        type: "atlasMapView",
        level: "nation",
        title: "United States",
      }),
    ).toBeUndefined();
  });

  it("fails closed on unknown type", () => {
    expect(parseAtlasMapView({ type: "atlasPlaceSearch", status: "opened" })).toBeUndefined();
  });
});

describe("generation and host capabilities", () => {
  it("increments request generation from a non-negative integer", () => {
    expect(nextRequestGeneration(0)).toBe(1);
    expect(nextRequestGeneration(4)).toBe(5);
    expect(nextRequestGeneration(-1)).toBe(1);
  });

  it("does not invent displayMode when the host omits it", () => {
    const caps = readHostCapabilities({ toolOutput: { type: "atlasMapView" } });
    expect(caps.hasOpenAiHost).toBe(true);
    expect(caps.hasToolOutput).toBe(true);
    expect(caps.displayMode).toBe("unknown");
  });

  it("treats missing tool output as idle, not unresolved or opened", () => {
    expect(widgetStatusAfterParse(undefined, false, false)).toBe("idle");
    expect(widgetStatusAfterParse(undefined, true, false)).toBe("opened");
    const refused = parseAtlasMapView({
      type: "atlasMapView",
      status: "unresolved",
      title: "Zzyzxqqq",
    });
    expect(widgetStatusAfterParse(refused, true, false)).toBe("unresolved");
  });

  it("keeps the last opened plate when the next result is ambiguous", () => {
    const opened = parseAtlasMapView({
      type: "atlasMapView",
      status: "opened",
      level: "county",
      countySlug: "riverside-ca",
      title: "Riverside County",
    })!;
    const refused = parseAtlasMapView({
      type: "atlasMapView",
      status: "ambiguous",
      level: "nation",
      title: "Springfield",
    })!;
    const kept = retainDisplayedPlate(plateFromMapView(opened), refused);
    expect(kept).toEqual({ level: "county", countySlug: "riverside-ca", name: "Riverside County" });
  });

  it("fingerprints opened vs refusal separately", () => {
    const opened = parseAtlasMapView({
      type: "atlasMapView",
      status: "opened",
      level: "nation",
      title: "United States",
    })!;
    const refused = parseAtlasMapView({
      type: "atlasMapView",
      status: "ambiguous",
      title: "Springfield",
    })!;
    expect(fingerprintMapView(opened)).not.toBe(fingerprintMapView(refused));
  });
});

const springfieldCandidates = [
  { name: "Springfield", county: "Sangamon County", countySlug: "sangamon-il", state: "IL", kind: "place" },
  { name: "Springfield", county: "Hampden County", countySlug: "hampden-ma", state: "MA", kind: "place" },
];

describe("resolveWidgetPlate", () => {
  it("treats first-load absence as idle, not unresolved or an opened nation map", () => {
    const resolved = resolveWidgetPlate({
      structured: undefined,
      generation: 0,
      lastFingerprint: "",
    });
    expect(resolved.status).toBe("idle");
    expect(resolved.displayed).toBeUndefined();
    expect(resolved.requested).toBeUndefined();
    expect(startingPlateTrail(resolved.displayed)).toEqual([]);
    expect(shouldFetchDisplayedPlate(resolved.status, resolved.displayed)).toBe(false);
  });

  it("STATE-01: refusal with leftover level nation does not open a US map", () => {
    const resolved = resolveWidgetPlate({
      structured: {
        type: "atlasMapView",
        status: "ambiguous",
        level: "nation",
        title: "Springfield",
        candidates: springfieldCandidates,
      },
      generation: 0,
      lastFingerprint: "",
    });
    expect(resolved.status).toBe("ambiguous");
    expect(resolved.displayed).toBeUndefined();
    expect(resolved.requested).toBeUndefined();
    expect(resolved.candidates?.map((place) => place.countySlug)).toEqual(["sangamon-il", "hampden-ma"]);
    expect(shouldFetchDisplayedPlate(resolved.status, resolved.displayed)).toBe(false);
  });

  it("honors an explicit refusal even when type is missing", () => {
    const parsed = parseMapViewOrRefusal({
      status: "unresolved",
      level: "nation",
      title: "Zzyzxqqq",
      query: "Zzyzxqqq",
    });
    expect(parsed?.status).toBe("unresolved");
    const resolved = resolveWidgetPlate({
      structured: { status: "unresolved", level: "nation", title: "Zzyzxqqq" },
      generation: 0,
      lastFingerprint: "",
    });
    expect(resolved.status).toBe("unresolved");
    expect(resolved.displayed).toBeUndefined();
    expect(shouldFetchDisplayedPlate(resolved.status, resolved.displayed)).toBe(false);
  });

  it("ID-09: nonsense unresolved is not a success map", () => {
    const resolved = resolveWidgetPlate({
      structured: {
        type: "atlasMapView",
        status: "unresolved",
        title: "Zzyzxqqq",
        query: "Zzyzxqqq",
      },
      generation: 0,
      lastFingerprint: "",
    });
    expect(resolved.status).toBe("unresolved");
    expect(resolved.displayed).toBeUndefined();
    expect(shouldFetchDisplayedPlate(resolved.status, resolved.displayed)).toBe(false);
  });

  it("STATE-02: leftover success metadata cannot override a newer refusal", () => {
    const opened = resolveWidgetPlate({
      structured: {
        type: "atlasMapView",
        status: "opened",
        level: "county",
        countySlug: "riverside-ca",
        title: "Riverside County",
      },
      generation: 0,
      lastFingerprint: "",
    });
    expect(opened.status).toBe("opened");
    expect(shouldFetchDisplayedPlate(opened.status, opened.displayed)).toBe(true);

    const refused = resolveWidgetPlate({
      structured: {
        type: "atlasMapView",
        status: "ambiguous",
        level: "nation",
        title: "Springfield",
        candidates: springfieldCandidates,
      },
      legacyPlate: { level: "county", countySlug: "riverside-ca", name: "Riverside County" },
      previous: opened,
      generation: opened.generation,
      lastFingerprint: opened.fingerprint,
    });
    expect(refused.status).toBe("ambiguous");
    expect(refused.requested).toBeUndefined();
    expect(refused.displayed).toEqual(opened.displayed);
    expect(shouldFetchDisplayedPlate(refused.status, refused.displayed)).toBe(false);
  });

  it("does not attribute stale _meta to a first-load refusal", () => {
    const resolved = resolveWidgetPlate({
      structured: {
        type: "atlasMapView",
        status: "unresolved",
        title: "London, United Kingdom",
      },
      legacyPlate: { level: "nation" },
      generation: 0,
      lastFingerprint: "",
    });
    expect(resolved.status).toBe("unresolved");
    expect(resolved.displayed).toBeUndefined();
    expect(resolved.requested).toBeUndefined();
  });

  it("keeps an opened plate when the host re-emits empty globals", () => {
    const opened = resolveWidgetPlate({
      structured: {
        type: "atlasMapView",
        status: "opened",
        level: "state",
        state: "ca",
        title: "California",
      },
      generation: 0,
      lastFingerprint: "",
    });
    const again = resolveWidgetPlate({
      structured: undefined,
      previous: opened,
      generation: opened.generation,
      lastFingerprint: opened.fingerprint,
    });
    expect(again.status).toBe("opened");
    expect(again.displayed).toEqual(opened.displayed);
    expect(again.fingerprint).toBe(opened.fingerprint);
  });

  it("still opens from legacy metadata when there is no structured refusal", () => {
    const resolved = resolveWidgetPlate({
      structured: { coverage: "boundary only" },
      legacyPlate: { level: "county", countySlug: "riverside-ca" },
      generation: 0,
      lastFingerprint: "",
    });
    expect(resolved.status).toBe("opened");
    expect(resolved.displayed).toEqual({ level: "county", countySlug: "riverside-ca" });
    expect(resolved.coverage).toBe("boundary only");
  });
});
