/**
 * The Atlas MCP tool surface.
 *
 * Three tools, all read-only, none touching a third party, none needing an
 * account. Atlas answers questions about US geography from Census data and
 * shows the corresponding plate; that is the whole contract.
 *
 * Descriptions follow OpenAI's guidance for tool metadata: each starts with
 * "Use this when…" and names what it must *not* be used for, because the most
 * common cause of a bad plugin experience is a tool firing on the wrong intent.
 *
 * The honesty rule from the gazetteer carries all the way out to the model
 * here: when a name is ambiguous or unknown, the tool says so and offers
 * candidates. It never picks one and presents it as fact.
 */

import { z } from "zod";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { GazetteerPlace, Resolution } from "@atlas/core/atlas";
import type { AtlasIndex } from "./atlasIndex.js";
import type { AtlasPlateService } from "./atlasPlates.js";

export const ATLAS_TOOL_NAMES = ["open_atlas_map", "search_atlas_places", "describe_atlas_place"] as const;

export type AtlasToolName = (typeof ATLAS_TOOL_NAMES)[number];

export type AtlasToolDependencies = {
  index: AtlasIndex;
  plates: AtlasPlateService;
  widgetUri: string;
  /** Counties with real baked street data, for honest coverage statements. */
  countiesWithStreets: ReadonlySet<string>;
  /** Wraps a handler for metrics; defaults to a pass-through. */
  instrument?: <T>(tool: AtlasToolName, run: () => Promise<T>) => Promise<T>;
};

/** Public shape of a place in a tool response. */
function publicPlace(place: GazetteerPlace) {
  return {
    name: place.name,
    county: place.countyName,
    countySlug: place.countySlug,
    state: place.state.toUpperCase(),
    kind: place.kind,
  };
}

/** Turn square metres into a readable area, the way an atlas prints it. */
function squareMiles(squareMeters: number | undefined): number | undefined {
  if (typeof squareMeters !== "number" || !Number.isFinite(squareMeters)) return undefined;
  return Math.round(squareMeters / 2_589_988);
}

/**
 * Render an unresolved or ambiguous resolution as text for the model.
 *
 * Kept in one place so every tool refuses in the same voice, and so the
 * refusal always carries the candidates that make it actionable.
 */
function refusalText(resolution: Exclude<Resolution, { status: "resolved" }>): string {
  if (resolution.status === "ambiguous") {
    const names = resolution.candidates
      .map((candidate) => `${candidate.name}, ${candidate.state.toUpperCase()} (${candidate.countyName})`)
      .join("; ");
    return `"${resolution.query}" matches more than one place in the United States: ${names}. Ask which one is meant, then call again with the state included.`;
  }
  const nearest = resolution.nearest ?? [];
  if (nearest.length > 0) {
    const names = nearest.map((place) => `${place.name}, ${place.state.toUpperCase()}`).join("; ");
    return `Atlas has no US place indexed as "${resolution.query}". The closest names it does have are: ${names}. Do not present any of these as the place that was asked for.`;
  }
  return `Atlas has no US place indexed as "${resolution.query}", and nothing close enough to suggest. Say so plainly rather than guessing a county.`;
}

export function registerAtlasTools(server: McpServer, deps: AtlasToolDependencies): void {
  const instrument = deps.instrument ?? (async (_tool, run) => run());
  const { index, plates } = deps;

  /** Coverage sentence attached to every county the map opens on. */
  function coverageFor(countySlug: string): string {
    return deps.countiesWithStreets.has(countySlug)
      ? "This county has real street geometry from the Census TIGER road files."
      : "Atlas draws this county's real boundary, water, and town positions. Its streets are not mapped, so do not describe individual roads or addresses here.";
  }

  registerAppTool(
    server,
    "open_atlas_map",
    {
      title: "Open the atlas",
      description:
        "Use this when someone wants to see a place on a map: a US county, a state, a town, or the whole country. Pass the place name as the user said it. If the name is ambiguous the tool returns the candidates instead of a map — ask which one is meant and call again with the state. Do not use this to answer a factual question without showing a map (use describe_atlas_place), and do not use it for directions, travel time, businesses, or any country other than the United States.",
      inputSchema: {
        place: z
          .string()
          .max(120)
          .optional()
          .describe('Place to open, as the user said it. Examples: "Riverside County", "Fresno", "Springfield, IL", "Texas". Omit to open the whole United States.'),
        level: z
          .enum(["nation", "state", "county"])
          .optional()
          .describe("Zoom level to open at. Defaults to the most specific level the place names."),
      },
      outputSchema: {
        type: z.literal("atlasMapView"),
        level: z.enum(["nation", "state", "county"]),
        title: z.string(),
        countySlug: z.string().optional(),
        county: z.string().optional(),
        state: z.string().optional(),
        stateName: z.string().optional(),
        coverage: z.string().optional(),
        townCount: z.number().optional(),
        areaSquareMiles: z.number().optional(),
        status: z.enum(["opened", "ambiguous", "unresolved"]),
        candidates: z
          .array(
            z.object({
              name: z.string(),
              county: z.string(),
              countySlug: z.string(),
              state: z.string(),
              kind: z.enum(["place", "county"]),
            }),
          )
          .optional(),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        securitySchemes: [{ type: "noauth" }],
        ui: { resourceUri: deps.widgetUri },
        "openai/outputTemplate": deps.widgetUri,
        "openai/toolInvocation/invoking": "Opening the atlas...",
        "openai/toolInvocation/invoked": "Atlas plate ready.",
      },
    },
    async ({ place, level }) =>
      instrument("open_atlas_map", async () => {
        // No place named: open the national plate.
        if (!place || !place.trim()) {
          return {
            structuredContent: {
              type: "atlasMapView" as const,
              level: "nation" as const,
              title: "United States",
              status: "opened" as const,
            },
            _meta: { atlasPlate: { level: "nation" } },
            content: [
              {
                type: "text" as const,
                text: "The United States is open in Atlas, drawn from Census county boundaries. Zoom to a state or county to see town names.",
              },
            ],
          };
        }

        const resolution = index.gazetteer.resolve(place);

        if (resolution.status !== "resolved") {
          return {
            structuredContent: {
              type: "atlasMapView" as const,
              level: "nation" as const,
              title: place,
              status: resolution.status,
              ...(resolution.status === "ambiguous"
                ? { candidates: resolution.candidates.map(publicPlace) }
                : {}),
            },
            content: [{ type: "text" as const, text: refusalText(resolution) }],
          };
        }

        const target = resolution.place;
        const identity = index.identityFor(target.countySlug);
        const anchors = index.anchorsFor(target.countySlug);

        // An explicit state level, or a query that named only a state, opens
        // the state plate rather than diving to one county.
        const openAt = level ?? (target.kind === "county" ? "county" : "county");
        if (openAt === "state") {
          return {
            structuredContent: {
              type: "atlasMapView" as const,
              level: "state" as const,
              title: identity?.name ?? target.state.toUpperCase(),
              state: target.state.toUpperCase(),
              status: "opened" as const,
            },
            _meta: { atlasPlate: { level: "state", state: target.state } },
            content: [
              {
                type: "text" as const,
                text: `${target.state.toUpperCase()} is open in Atlas with its counties drawn from Census boundaries.`,
              },
            ],
          };
        }

        const plate = plates.county(target.countySlug);
        const areaSquareMiles = plate.ok
          ? squareMiles((JSON.parse(plate.body) as { areaLandMeters?: number }).areaLandMeters)
          : undefined;

        const where =
          target.kind === "place"
            ? `${target.name} is in ${target.countyName}, ${target.state.toUpperCase()}.`
            : `${target.countyName}, ${target.state.toUpperCase()} is open in Atlas.`;

        return {
          structuredContent: {
            type: "atlasMapView" as const,
            level: "county" as const,
            title: target.kind === "place" ? target.name : target.countyName,
            countySlug: target.countySlug,
            county: target.countyName,
            state: target.state.toUpperCase(),
            coverage: coverageFor(target.countySlug),
            townCount: anchors.length,
            ...(areaSquareMiles ? { areaSquareMiles } : {}),
            status: "opened" as const,
          },
          _meta: {
            atlasPlate: {
              level: "county",
              countySlug: target.countySlug,
              state: target.state,
              ...(target.kind === "place" ? { focus: { name: target.name, lon: target.lon, lat: target.lat } } : {}),
            },
          },
          content: [
            {
              type: "text" as const,
              text: `${where} ${coverageFor(target.countySlug)}`,
            },
          ],
        };
      }),
  );

  registerAppTool(
    server,
    "search_atlas_places",
    {
      title: "Look up a place in the atlas index",
      description:
        "Use this when you need to know which US county and state a town is in, or when a place name might refer to several places and you need the list to choose from. Returns index entries only. Do not use this to open a map (use open_atlas_map), and do not use it for businesses, addresses, postcodes, or places outside the United States.",
      inputSchema: {
        query: z.string().min(1).max(120).describe("Place name to look up."),
        state: z
          .string()
          .length(2)
          .optional()
          .describe("Two-letter US state code to narrow the search, when the user named one."),
        limit: z.number().int().min(1).max(20).optional().describe("Maximum entries to return. Defaults to 8."),
      },
      outputSchema: {
        type: z.literal("atlasPlaceSearch"),
        query: z.string(),
        resolved: z
          .object({
            name: z.string(),
            county: z.string(),
            countySlug: z.string(),
            state: z.string(),
            kind: z.enum(["place", "county"]),
          })
          .optional(),
        candidates: z.array(
          z.object({
            name: z.string(),
            county: z.string(),
            countySlug: z.string(),
            state: z.string(),
            kind: z.enum(["place", "county"]),
          }),
        ),
        status: z.enum(["resolved", "ambiguous", "unresolved"]),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        securitySchemes: [{ type: "noauth" }],
        "openai/toolInvocation/invoking": "Searching the atlas index...",
        "openai/toolInvocation/invoked": "Index results ready.",
      },
    },
    async ({ query, state, limit }) =>
      instrument("search_atlas_places", async () => {
        const scoped = state ? `${query}, ${state}` : query;
        const resolution = index.gazetteer.resolve(scoped);
        const suggestions = index.gazetteer.search(scoped, limit ?? 8);

        if (resolution.status === "resolved") {
          const place = resolution.place;
          return {
            structuredContent: {
              type: "atlasPlaceSearch" as const,
              query,
              resolved: publicPlace(place),
              candidates: suggestions.map(publicPlace),
              status: "resolved" as const,
            },
            content: [
              {
                type: "text" as const,
                text: `${place.name} is in ${place.countyName}, ${place.state.toUpperCase()}.`,
              },
            ],
          };
        }

        return {
          structuredContent: {
            type: "atlasPlaceSearch" as const,
            query,
            candidates: (resolution.status === "ambiguous" ? resolution.candidates : suggestions).map(publicPlace),
            status: resolution.status,
          },
          content: [{ type: "text" as const, text: refusalText(resolution) }],
        };
      }),
  );

  registerAppTool(
    server,
    "describe_atlas_place",
    {
      title: "Describe a place from atlas data",
      description:
        "Use this when someone asks a factual question about a US county or town that Atlas holds data for: which county a town belongs to, how large a county is, which towns are in it, or how many people live there. Answers come from the 2024 US Census only. Do not use this for directions, travel times, weather, businesses, history, or anything the map does not contain — say the data is not in Atlas instead.",
      inputSchema: {
        place: z.string().min(1).max(120).describe("Place or county the question is about."),
      },
      outputSchema: {
        type: z.literal("atlasPlaceDescription"),
        status: z.enum(["described", "ambiguous", "unresolved"]),
        name: z.string().optional(),
        county: z.string().optional(),
        countySlug: z.string().optional(),
        state: z.string().optional(),
        areaSquareMiles: z.number().optional(),
        townCount: z.number().optional(),
        largestTowns: z
          .array(z.object({ name: z.string(), population: z.number() }))
          .optional(),
        water: z.array(z.string()).optional(),
        coverage: z.string().optional(),
        source: z.string(),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        securitySchemes: [{ type: "noauth" }],
        "openai/toolInvocation/invoking": "Reading the atlas...",
        "openai/toolInvocation/invoked": "Atlas facts ready.",
      },
    },
    async ({ place }) =>
      instrument("describe_atlas_place", async () => {
        const source = "2024 US Census (TIGERweb boundaries, Gazetteer place anchors)";
        const resolution = index.gazetteer.resolve(place);

        if (resolution.status !== "resolved") {
          return {
            structuredContent: {
              type: "atlasPlaceDescription" as const,
              status: resolution.status,
              source,
            },
            content: [{ type: "text" as const, text: refusalText(resolution) }],
          };
        }

        const target = resolution.place;
        const anchors = index.anchorsFor(target.countySlug);
        const plateResult = plates.county(target.countySlug);
        const plate = plateResult.ok
          ? (JSON.parse(plateResult.body) as { areaLandMeters?: number; waterNames?: (string | null)[] })
          : undefined;

        const water = (plate?.waterNames ?? [])
          .filter((name): name is string => typeof name === "string" && name.length > 0)
          .filter((name, position, all) => all.indexOf(name) === position)
          .slice(0, 8);

        const largestTowns = anchors.slice(0, 5).map((anchor) => ({
          name: anchor.label,
          population: anchor.population2024 ?? 0,
        }));

        const area = squareMiles(plate?.areaLandMeters);
        const sentences = [
          target.kind === "place"
            ? `${target.name} is a Census place in ${target.countyName}, ${target.state.toUpperCase()}.`
            : `${target.countyName} is in ${target.state.toUpperCase()}.`,
          area ? `The county covers about ${area.toLocaleString("en-US")} square miles of land.` : undefined,
          anchors.length > 0
            ? `Atlas maps ${anchors.length} Census place${anchors.length === 1 ? "" : "s"} in it, the largest being ${largestTowns
                .slice(0, 3)
                .map((town) => town.name)
                .join(", ")}.`
            : undefined,
          water.length > 0 ? `Named water in the county includes ${water.slice(0, 4).join(", ")}.` : undefined,
          coverageFor(target.countySlug),
        ].filter(Boolean);

        return {
          structuredContent: {
            type: "atlasPlaceDescription" as const,
            status: "described" as const,
            name: target.name,
            county: target.countyName,
            countySlug: target.countySlug,
            state: target.state.toUpperCase(),
            ...(area ? { areaSquareMiles: area } : {}),
            townCount: anchors.length,
            largestTowns,
            ...(water.length > 0 ? { water } : {}),
            coverage: coverageFor(target.countySlug),
            source,
          },
          content: [{ type: "text" as const, text: sentences.join(" ") }],
        };
      }),
  );
}
