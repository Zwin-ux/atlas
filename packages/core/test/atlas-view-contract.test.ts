import { describe, expect, it } from "vitest";

import {
  fingerprintMapView,
  nextRequestGeneration,
  parseAtlasMapView,
  plateFromMapView,
  readHostCapabilities,
  retainDisplayedPlate,
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
