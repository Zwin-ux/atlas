/**
 * The Atlas MCP tool surface.
 *
 * Two tools, both read-only, neither touching a third party, neither needing
 * an account. Atlas draws US geography from Census data and answers from the
 * same data; that is the whole contract.
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
import { ATLAS_VIEW_CONTRACT_VERSION } from "@atlas/core/atlas";
import type { AtlasIndex } from "./atlasIndex.js";
import type { AtlasPlateService } from "./atlasPlates.js";

/**
 * Two tools, and each has to earn its place.
 *
 * OpenAI's guideline is that a plugin must do something "not natively
 * supported by the products' built-in capabilities". The base model already
 * knows which county a town is in and roughly how big it is, so a tool that
 * only recites those facts is redundant — a reviewer can reasonably ask why it
 * exists. What ChatGPT cannot do is *draw* the geography.
 *
 * So the surface collapsed from three tools to two:
 *   open_atlas_map       draws a place, and returns its Census facts with it
 *   search_atlas_places  the index — which places carry this name, and where
 *
 * describe_atlas_place was folded into open_atlas_map rather than deleted: the
 * facts were worth returning, they just were not worth a separate tool that
 * answered without showing anything.
 */
export const ATLAS_TOOL_NAMES = ["open_atlas_map", "search_atlas_places"] as const;

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
        "Use this when someone wants to see a US place on a map, or asks a factual question about a US county or town — where it is, how big it is, which towns are in it, what water runs through it. Opens the map and returns the matching 2024 US Census facts together. Pass the place name as the user said it. If the name is ambiguous the tool returns the candidates instead of a map: ask which one is meant and call again with the state. Do not use it for directions, travel times, businesses, addresses, weather, or any country other than the United States.",
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
        level: z.enum(["nation", "state", "county"]).optional(),
        title: z.string(),
        query: z.string().optional(),
        countySlug: z.string().optional(),
        county: z.string().optional(),
        state: z.string().optional(),
        stateName: z.string().optional(),
        coverage: z.string().optional(),
        townCount: z.number().optional(),
        areaSquareMiles: z.number().optional(),
        // Absorbed from the retired describe_atlas_place: the facts ship with
        // the map rather than needing a second call that shows nothing.
        largestTowns: z.array(z.object({ name: z.string(), population: z.number() })).optional(),
        water: z.array(z.string()).optional(),
        source: z.string().optional(),
        contractVersion: z.literal(ATLAS_VIEW_CONTRACT_VERSION).optional(),
        status: z.enum(["opened", "ambiguous", "unresolved", "transport_error"]),
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
        "openai/widgetAccessible": true,
        "openai/toolInvocation/invoking": "Opening the atlas...",
        "openai/toolInvocation/invoked": "Atlas plate ready.",
      },
    },
    async ({ place, level }) =>
      instrument("open_atlas_map", async () => {
        try {
        // No place named: open the national plate.
        if (!place || !place.trim()) {
          return {
            structuredContent: {
              type: "atlasMapView" as const,
              contractVersion: ATLAS_VIEW_CONTRACT_VERSION,
              level: "nation" as const,
              title: "United States",
              status: "opened" as const,
            },
            _meta: {
              atlasPlate: { level: "nation" },
              ui: { resourceUri: deps.widgetUri },
              "openai/outputTemplate": deps.widgetUri,
            },
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
          // No plate reference on refusal. A nation level here used to make
          // the widget treat Springfield as a successful US map.
          return {
            structuredContent: {
              type: "atlasMapView" as const,
              contractVersion: ATLAS_VIEW_CONTRACT_VERSION,
              title: place,
              query: place,
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
              contractVersion: ATLAS_VIEW_CONTRACT_VERSION,
              level: "state" as const,
              title: identity?.name ?? target.state.toUpperCase(),
              state: target.state.toUpperCase(),
              status: "opened" as const,
            },
            _meta: {
              atlasPlate: { level: "state", state: target.state },
              ui: { resourceUri: deps.widgetUri },
              "openai/outputTemplate": deps.widgetUri,
            },
            content: [
              {
                type: "text" as const,
                text: `${target.state.toUpperCase()} is open in Atlas with its counties drawn from Census boundaries.`,
              },
            ],
          };
        }

        const plate = plates.county(target.countySlug);
        const parsed = plate.ok
          ? (JSON.parse(plate.body) as { areaLandMeters?: number; waterNames?: (string | null)[] })
          : undefined;
        const areaSquareMiles = squareMiles(parsed?.areaLandMeters);

        // Named water, de-duplicated. The Census lists a bay once per ring, and
        // repeating "Biscayne Bay" four times reads as a bug.
        const water = (parsed?.waterNames ?? [])
          .filter((name): name is string => typeof name === "string" && name.length > 0)
          .filter((name, position, all) => all.indexOf(name) === position)
          .slice(0, 8);

        const largestTowns = anchors.slice(0, 5).map((anchor) => ({
          name: anchor.label,
          population: anchor.population2024 ?? 0,
        }));

        const where =
          target.kind === "place"
            ? `${target.name} is in ${target.countyName}, ${target.state.toUpperCase()}.`
            : `${target.countyName}, ${target.state.toUpperCase()} is open in Atlas.`;

        const facts = [
          areaSquareMiles
            ? `The county covers about ${areaSquareMiles.toLocaleString("en-US")} square miles of land.`
            : undefined,
          anchors.length > 0
            ? `Atlas maps ${anchors.length} Census place${anchors.length === 1 ? "" : "s"} in it, the largest being ${largestTowns
                .slice(0, 3)
                .map((town) => town.name)
                .join(", ")}.`
            : undefined,
          water.length > 0 ? `Named water includes ${water.slice(0, 4).join(", ")}.` : undefined,
        ].filter(Boolean);

        return {
          structuredContent: {
            type: "atlasMapView" as const,
            contractVersion: ATLAS_VIEW_CONTRACT_VERSION,
            level: "county" as const,
            title: target.kind === "place" ? target.name : target.countyName,
            countySlug: target.countySlug,
            county: target.countyName,
            state: target.state.toUpperCase(),
            coverage: coverageFor(target.countySlug),
            townCount: anchors.length,
            ...(areaSquareMiles ? { areaSquareMiles } : {}),
            largestTowns,
            ...(water.length > 0 ? { water } : {}),
            source: "2024 US Census (TIGERweb boundaries, Gazetteer place anchors)",
            status: "opened" as const,
          },
          _meta: {
            atlasPlate: {
              level: "county",
              countySlug: target.countySlug,
              state: target.state,
              ...(target.kind === "place" ? { focus: { name: target.name, lon: target.lon, lat: target.lat } } : {}),
            },
            ui: { resourceUri: deps.widgetUri },
            "openai/outputTemplate": deps.widgetUri,
          },
          content: [
            {
              type: "text" as const,
              text: [where, ...facts, coverageFor(target.countySlug)].join(" "),
            },
          ],
        };
        } catch {
          return {
            structuredContent: {
              type: "atlasMapView" as const,
              contractVersion: ATLAS_VIEW_CONTRACT_VERSION,
              title: "Atlas could not complete that request",
              status: "transport_error" as const,
            },
            content: [
              {
                type: "text" as const,
                text: "Atlas hit an operational error opening that map. The last correct map, if any, should stay on screen. Retry the same place; do not invent geography.",
              },
            ],
          };
        }
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
}
