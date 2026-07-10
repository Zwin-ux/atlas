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
   * retry until _meta.generatedDraftScene lands or attempts run out.
   */
  callUntilDraftScene(spec: ToolCallSpec): Promise<CallToolResult>;
  close(): Promise<void>;
};

type InjectedResultWindow = Window & {
  __ATLAS_EMULATOR_TOOLRESULT__?: CallToolResult;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function hasDraftScene(result: CallToolResult): boolean {
  const meta = result._meta as Record<string, unknown> | undefined;
  return Boolean(meta && typeof meta === "object" && meta.generatedDraftScene);
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
      for (let attempt = 1; attempt < DRAFT_RETRY_ATTEMPTS && !hasDraftScene(last); attempt += 1) {
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

/** CI strategy: the driver parked one pre-fetched result on the window. */
export function createInjectedToolSource(): ToolSource | null {
  const parked = (window as InjectedResultWindow).__ATLAS_EMULATOR_TOOLRESULT__;
  if (!parked) return null;
  const call = async (): Promise<CallToolResult> => parked;
  return { call, callUntilDraftScene: call, close: async () => {} };
}
