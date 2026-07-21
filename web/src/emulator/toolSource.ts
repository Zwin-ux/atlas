// Tool-result acquisition for the production emulator.
//
// Two strategies, one delivery path (the mock host's postMessage
// ui/notifications/tool-result — production-identical either way):
//   - liveMcp:   in-browser MCP client against same-origin /mcp. The human
//                page uses this; it exercises the real server round-trip
//                including the scene-packet cache.
//   - injected:  a node/CDP driver pre-fetches the result and parks it on
//                window.__ATLAS_EMULATOR_TOOLRESULT__ before navigation.
//                CI fallback when in-browser MCP is unavailable.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const DRAFT_RETRY_ATTEMPTS = 12;
const DRAFT_RETRY_DELAY_MS = 700;

export type ToolCallSpec = {
  name: string;
  arguments: Record<string, unknown>;
};

export type ToolSource = {
  call(spec: ToolCallSpec): Promise<CallToolResult>;
  /**
   * select_county / render_voxel_county with includeGeneratedDraft can return
   * only the queued generatedDraftPacket on a cold packet cache. Mirror the
   * production model's behavior (and verify-generated-district-widget.mjs):
   * retry until draft meta is ready for the widget (0.76-T prefers the compact
   * `_meta.generatedDraftSpec`; legacy hosts may still ship generatedDraftScene)
   * or attempts run out.
   */
  callUntilDraftScene(spec: ToolCallSpec): Promise<CallToolResult>;
  close(): Promise<void>;
};

type CommonsDemoNote = {
  id: string;
  countySlug: string;
  placeId: string;
  placeLabel: string;
  body: string;
  authorHandle: string;
  status: "pending" | "visible" | "removed";
  reactionCount: number;
  createdAt: string;
  publishedAt?: string;
  viewerHasReacted: boolean;
  viewerCanReport: boolean;
};

type InjectedResultWindow = Window & {
  __ATLAS_EMULATOR_TOOLRESULT__?: CallToolResult;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** True when the tool result carries enough draft meta for the widget to render. */
function hasDraftReady(result: CallToolResult): boolean {
  const meta = result._meta as Record<string, unknown> | undefined;
  if (!meta || typeof meta !== "object") return false;
  // North Face production wire (0.76-T): ship params, compile client-side.
  if (meta.generatedDraftSpec) return true;
  // Legacy read path: full scene payload on the wire.
  if (meta.generatedDraftScene) return true;
  return false;
}

function wantsDraftScene(spec: ToolCallSpec): boolean {
  return Boolean(spec.arguments.includeGeneratedDraft);
}

export async function createLiveMcpToolSource(mcpUrl: string): Promise<ToolSource> {
  const client = new Client({ name: "atlas-emulator-host", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl, window.location.origin));
  // The sdk's own StreamableHTTPClientTransport is not assignable to its
  // Transport interface under exactOptionalPropertyTypes (sessionId:
  // string|undefined vs string) — upstream type inconsistency, runtime-safe.
  await client.connect(transport as unknown as Parameters<typeof client.connect>[0]);

  const call = async (spec: ToolCallSpec): Promise<CallToolResult> => {
    const result = await client.callTool({ name: spec.name, arguments: spec.arguments });
    return result as CallToolResult;
  };

  return {
    call,
    async callUntilDraftScene(spec) {
      let last = await call(spec);
      if (!wantsDraftScene(spec)) return last;
      for (let attempt = 1; attempt < DRAFT_RETRY_ATTEMPTS && !hasDraftReady(last); attempt += 1) {
        await delay(DRAFT_RETRY_DELAY_MS);
        last = await call(spec);
      }
      return last;
    },
    async close() {
      await client.close();
    },
  };
}

/**
 * Deterministic Commons state for visual/interaction QA. It still delegates the
 * seed map to the real local MCP server; only the two gated Commons tools are
 * simulated. This mode is reachable solely through the emulator query string.
 */
export function createAtlasCommonsDemoToolSource(base: ToolSource): ToolSource {
  const notes: CommonsDemoNote[] = [
    demoNote("demo-core-1", "place-eastvale", "Eastvale", "Atlas-7C2A19F0D48E3B61", "The plaza is calm before school pickup; the shaded benches fill first.", 8, "2026-07-21T17:40:00.000Z"),
    demoNote("demo-core-2", "place-eastvale", "Eastvale", "Atlas-2D10A1BE3A86C471", "Farmers market setup starts on the west side Saturday morning.", 5, "2026-07-21T15:10:00.000Z"),
    demoNote("demo-plaza-1", "place-gym-plaza-eastvale", "Gym / Plaza", "Atlas-B42390CC0F2B71A4", "Lunch lines move fastest near the smaller storefronts after one.", 12, "2026-07-21T18:05:00.000Z"),
    demoNote("demo-plaza-2", "place-gym-plaza-eastvale", "Gym / Plaza", "Atlas-4E112C8DD09F7A20", "Parking turns over quickly between the morning classes.", 6, "2026-07-21T16:30:00.000Z"),
    demoNote("demo-homes-1", "place-residential-eastvale", "Residential Cluster", "Atlas-9DF8130A7C224B5E", "The corner route is busiest right after the elementary-school bell.", 4, "2026-07-21T13:15:00.000Z"),
    demoNote("demo-apartments-1", "place-apartment-cluster", "Apartment Cluster", "Atlas-6A918BFE0C210D43", "The north entrance stays quieter during the evening commute.", 3, "2026-07-21T14:20:00.000Z"),
    demoNote("demo-norco-1", "place-norco", "Norco", "Atlas-0C8132AFB9E5D742", "The route edge is clearest just after the morning traffic drops.", 2, "2026-07-21T12:45:00.000Z"),
  ];
  const mine: CommonsDemoNote[] = [];

  const call = async (spec: ToolCallSpec): Promise<CallToolResult> => {
    if (spec.name === "list_atlas_notes") {
      const mode = spec.arguments.mode === "mine" ? "mine" : "all";
      const placeId = typeof spec.arguments.placeId === "string" ? spec.arguments.placeId : undefined;
      const sort = spec.arguments.sort === "new" ? "new" : "hot";
      const source = mode === "mine" ? mine : notes;
      const selected = source
        .filter((note) => !placeId || note.placeId === placeId)
        .filter((note) => mode === "mine" || note.status === "visible")
        .sort((a, b) => sort === "hot" ? b.reactionCount - a.reactionCount : b.createdAt.localeCompare(a.createdAt));
      return commonsResult({
        type: "atlasPublicNoteList",
        notes: selected,
        scope: { mode, sort, countySlug: "riverside-ca", ...(placeId ? { placeId } : {}) },
      });
    }

    if (spec.name === "write_atlas_note") {
      const operation = spec.arguments.operation;
      if (operation === "post") {
        const pending = {
          ...demoNote(
            `demo-mine-${mine.length + 1}`,
            String(spec.arguments.placeId ?? "place-eastvale"),
            String(spec.arguments.placeLabel ?? "Eastvale"),
            "Atlas-0A71D490FCE238B5",
            String(spec.arguments.body ?? ""),
            0,
            new Date().toISOString(),
          ),
          status: "pending" as const,
          viewerCanReport: false,
        };
        mine.unshift(pending);
        return commonsWrite("post", pending, "Posted for review. It is visible only to you until approved.");
      }
      const noteId = String(spec.arguments.noteId ?? "");
      const note = notes.find((candidate) => candidate.id === noteId);
      if (!note) return { isError: true, content: [{ type: "text", text: "That public note is not available." }] };
      if (operation === "react") {
        const active = spec.arguments.active === true;
        const hadReacted = note.viewerHasReacted === true;
        note.viewerHasReacted = active;
        if (hadReacted !== active) note.reactionCount += active ? 1 : -1;
        return commonsWrite("react", note, active ? "Marked useful." : "Useful mark removed.");
      }
      if (operation === "report") {
        note.status = "removed";
        return commonsWrite("report", note, "Reported. This note is hidden while it is reviewed.");
      }
    }

    const result = await base.call(spec);
    return {
      ...result,
      _meta: {
        ...(result._meta as Record<string, unknown> | undefined),
        atlasCommons: {
          enabled: true,
          available: true,
          requiresIdentityForPosting: true,
          publicPostingIsExplicit: true,
          privateNotesStayPrivate: true,
          moderation: "pre_publication",
          modes: ["all", "nearby", "mine"],
          statusLabel: "Public notes are ready. New posts wait for review.",
        },
      },
    };
  };

  return {
    call,
    callUntilDraftScene: call,
    close: () => base.close(),
  };
}

function demoNote(id: string, placeId: string, placeLabel: string, authorHandle: string, body: string, reactionCount: number, createdAt: string): CommonsDemoNote {
  return {
    id,
    countySlug: "riverside-ca",
    placeId,
    placeLabel,
    body,
    authorHandle,
    status: "visible",
    reactionCount,
    createdAt,
    publishedAt: createdAt,
    viewerHasReacted: false,
    viewerCanReport: true,
  };
}

function commonsResult(structuredContent: Record<string, unknown>): CallToolResult {
  return { content: [{ type: "text", text: "Atlas public notes ready." }], structuredContent };
}

function commonsWrite(operation: "post" | "react" | "report", note: CommonsDemoNote, message: string): CallToolResult {
  return commonsResult({ type: "atlasPublicNoteWrite", operation, status: "accepted", note, message });
}

/** CI strategy: the driver parked one pre-fetched result on the window. */
export function createInjectedToolSource(): ToolSource | null {
  const parked = (window as InjectedResultWindow).__ATLAS_EMULATOR_TOOLRESULT__;
  if (!parked) return null;
  const call = async (): Promise<CallToolResult> => parked;
  return { call, callUntilDraftScene: call, close: async () => {} };
}
