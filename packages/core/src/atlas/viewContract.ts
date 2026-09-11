/**
 * Shared Atlas view contract (AT-007).
 *
 * Discriminated status is the trust boundary. A refusal or transport error
 * never carries a plate reference — even if a stale payload still has
 * `level: "nation"`. Widget and server both parse through these guards.
 *
 * Schema version is this module's `ATLAS_VIEW_CONTRACT_VERSION`. Bump it when
 * the union changes. Public MCP tool names are not defined here.
 */

export const ATLAS_VIEW_CONTRACT_VERSION = 1 as const;

export type AtlasViewStatus = "opened" | "ambiguous" | "unresolved" | "transport_error";

export type AtlasPlateRef =
  | { readonly level: "nation" }
  | { readonly level: "state"; readonly state: string }
  | { readonly level: "county"; readonly countySlug: string; readonly state?: string; readonly name?: string };

export type AtlasPublicPlace = {
  readonly name: string;
  readonly county: string;
  readonly countySlug: string;
  readonly state: string;
  readonly kind: "place" | "county";
};

export type AtlasSelectedFeature = {
  readonly id: string;
  readonly name: string;
  readonly kind: "place" | "county" | "state" | "nation";
};

export type AtlasHostCapabilities = {
  readonly contractVersion: typeof ATLAS_VIEW_CONTRACT_VERSION;
  readonly hasOpenAiHost: boolean;
  readonly hasToolOutput: boolean;
  readonly hasToolResponseMetadata: boolean;
  readonly displayMode: "inline" | "fullscreen" | "pip" | "unknown";
};

export type AtlasOpenedMapView = {
  readonly contractVersion: typeof ATLAS_VIEW_CONTRACT_VERSION;
  readonly type: "atlasMapView";
  readonly status: "opened";
  readonly plate: AtlasPlateRef;
  readonly title: string;
  readonly coverage?: string;
};

export type AtlasRefusedMapView = {
  readonly contractVersion: typeof ATLAS_VIEW_CONTRACT_VERSION;
  readonly type: "atlasMapView";
  readonly status: "ambiguous" | "unresolved" | "transport_error";
  readonly title: string;
  readonly query?: string;
  readonly candidates?: readonly AtlasPublicPlace[];
};

export type AtlasMapView = AtlasOpenedMapView | AtlasRefusedMapView;

export type AtlasWidgetView = {
  readonly contractVersion: typeof ATLAS_VIEW_CONTRACT_VERSION;
  readonly status: AtlasViewStatus;
  readonly displayed?: AtlasPlateRef;
  readonly requested?: AtlasPlateRef;
  readonly requestGeneration: number;
  readonly selected?: AtlasSelectedFeature;
  readonly hostCapabilities: AtlasHostCapabilities;
  readonly candidates?: readonly AtlasPublicPlace[];
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATE = /^[a-z]{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asTrimmedString(value: unknown, max = 120): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return undefined;
  return trimmed;
}

function parsePublicPlace(value: unknown): AtlasPublicPlace | undefined {
  if (!isRecord(value)) return undefined;
  const name = asTrimmedString(value.name);
  const county = asTrimmedString(value.county);
  const countySlug = asTrimmedString(value.countySlug, 80)?.toLowerCase();
  const state = asTrimmedString(value.state, 2)?.toLowerCase();
  const kind = value.kind === "place" || value.kind === "county" ? value.kind : undefined;
  if (!name || !county || !countySlug || !state || !kind) return undefined;
  if (!SLUG.test(countySlug) || !STATE.test(state)) return undefined;
  return { name, county, countySlug, state: state.toUpperCase(), kind };
}

export function parseAtlasPlateRef(value: unknown): AtlasPlateRef | undefined {
  if (!isRecord(value)) return undefined;
  const level = value.level;
  if (level === "nation") return { level: "nation" };
  if (level === "state") {
    const state = asTrimmedString(value.state, 2)?.toLowerCase();
    if (!state || !STATE.test(state)) return undefined;
    return { level: "state", state };
  }
  if (level === "county") {
    const countySlug = asTrimmedString(value.countySlug, 80)?.toLowerCase();
    if (!countySlug || !SLUG.test(countySlug)) return undefined;
    const state = asTrimmedString(value.state, 2)?.toLowerCase();
    const name = asTrimmedString(value.name ?? value.county);
    return {
      level: "county",
      countySlug,
      ...(state && STATE.test(state) ? { state } : {}),
      ...(name ? { name } : {}),
    };
  }
  return undefined;
}

/**
 * Fail closed. Refusal statuses never yield a plate, even if `level` is present.
 */
export function parseAtlasMapView(input: unknown): AtlasMapView | undefined {
  if (!isRecord(input)) return undefined;
  if (input.type !== "atlasMapView") return undefined;
  const title = asTrimmedString(input.title, 200) ?? "";
  const status = input.status;

  if (status === "ambiguous" || status === "unresolved" || status === "transport_error") {
    const candidates = Array.isArray(input.candidates)
      ? input.candidates.map(parsePublicPlace).filter((place): place is AtlasPublicPlace => place !== undefined).slice(0, 8)
      : undefined;
    const query = asTrimmedString(input.query, 120);
    return {
      contractVersion: ATLAS_VIEW_CONTRACT_VERSION,
      type: "atlasMapView",
      status,
      title,
      ...(query ? { query } : {}),
      ...(candidates && candidates.length > 0 ? { candidates } : {}),
    };
  }

  if (status !== "opened") return undefined;
  const plate =
    parseAtlasPlateRef(input.plate) ??
    parseAtlasPlateRef({
      level: input.level,
      state: input.state,
      countySlug: input.countySlug,
      name: input.county ?? input.title,
    });
  if (!plate) return undefined;
  const coverage = asTrimmedString(input.coverage, 400);
  return {
    contractVersion: ATLAS_VIEW_CONTRACT_VERSION,
    type: "atlasMapView",
    status: "opened",
    plate,
    title: title || plateTitle(plate),
    ...(coverage ? { coverage } : {}),
  };
}

function plateTitle(plate: AtlasPlateRef): string {
  if (plate.level === "nation") return "United States";
  if (plate.level === "state") return plate.state.toUpperCase();
  return plate.name ?? plate.countySlug;
}

/** Plate only for a successful open. */
export function plateFromMapView(view: AtlasMapView): AtlasPlateRef | undefined {
  return view.status === "opened" ? view.plate : undefined;
}

/** Refusals keep the last opened plate; they never invent a nation map. */
export function retainDisplayedPlate(
  previous: AtlasPlateRef | undefined,
  incoming: AtlasMapView,
): AtlasPlateRef | undefined {
  return incoming.status === "opened" ? incoming.plate : previous;
}

export function nextRequestGeneration(previous: number): number {
  if (!Number.isInteger(previous) || previous < 0) return 1;
  return previous + 1;
}

export function readHostCapabilities(host: unknown): AtlasHostCapabilities {
  const record = isRecord(host) ? host : undefined;
  const display = record?.displayMode;
  return {
    contractVersion: ATLAS_VIEW_CONTRACT_VERSION,
    hasOpenAiHost: record !== undefined,
    hasToolOutput: record !== undefined && "toolOutput" in record && record.toolOutput !== undefined,
    hasToolResponseMetadata:
      record !== undefined && "toolResponseMetadata" in record && record.toolResponseMetadata !== undefined,
    displayMode: display === "inline" || display === "fullscreen" || display === "pip" ? display : "unknown",
  };
}

export function fingerprintMapView(view: AtlasMapView): string {
  if (view.status === "opened") {
    const plate = view.plate;
    if (plate.level === "nation") return "opened:nation";
    if (plate.level === "state") return `opened:state:${plate.state}`;
    return `opened:county:${plate.countySlug}`;
  }
  const n = view.candidates?.length ?? 0;
  return `${view.status}:${view.query ?? view.title}:${n}`;
}
