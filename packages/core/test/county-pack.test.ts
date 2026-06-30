import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CountyPackService,
  CountyPackValidationError,
  parseCountyPack,
} from "../src/county/CountyPackService.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const countyPackDir = resolve(testDir, "../../../data/county_packs");

describe("CountyPackService", () => {
  it("loads and validates the Riverside Alpha pack", () => {
    const service = new CountyPackService(countyPackDir);
    const pack = service.loadCountyPack("riverside-ca");
    const eastvale = service.requireNode(pack, "eastvale");

    expect(pack.slug).toBe("riverside-ca");
    expect(eastvale.name).toBe("Eastvale");
    expect(eastvale.scores.mobile_detailing).toBeGreaterThan(0);
    expect(service.summarize(pack)).toMatchObject({
      county: "Riverside County",
      nodeCount: pack.mapNodes.length,
      edgeCount: pack.mapEdges.length,
    });
  });

  it("fails clearly for invalid county pack shape", () => {
    expect(() => parseCountyPack({ slug: "riverside-ca" }, "broken-pack")).toThrow(
      CountyPackValidationError,
    );
  });
});
