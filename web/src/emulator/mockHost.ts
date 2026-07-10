// The production ChatGPT-host emulator: parents the widget iframe and IS the
// host+model, 1:1 with what the deployed build sees.
//
// Fidelity contract (docs/0.76 emulator plan):
//   - JSON-RPC over postMessage via @modelcontextprotocol/ext-apps AppBridge:
//     answers ui/initialize (protocol 2026-01-26), accepts
//     ui/notifications/initialized, ui/message, ui/update-model-context.
//   - Tool results arrive ONLY via ui/notifications/tool-result postMessage —
//     the production data-in path (web/src/bridge.ts:77) — never the
//     atlas:test-tool-result CustomEvent shim.
//   - window.openai (theme/widgetState/setWidgetState/requestDisplayMode) is
//     installed by a synchronous bootstrap script injected into the widget
//     document BEFORE its deferred module executes — same observable order as
//     the real host's proxy injection. (Documented compromise: production is
//     cross-origin; same-origin injection changes the mechanism, not anything
//     the widget can observe.)
//   - ui/message is answered immediately (the widget bridge has a 1200ms RPC
//     timeout) and the model turn (real MCP tool call) runs async, exactly
//     like the real host.
import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { EMULATOR_PROTOCOL_HOST_INFO, EMULATOR_VIEWPORTS, type EmulatorViewportKey } from "./constants";
import type { ToolCallSpec, ToolSource } from "./toolSource";

export type EmulatorTheme = "light" | "dark";
export type EmulatorDisplayMode = "inline" | "pip" | "fullscreen";

export type MockHostOptions = {
  iframe: HTMLIFrameElement;
  toolSource: ToolSource;
  county: string;
  includeGeneratedDraft: boolean;
  theme: EmulatorTheme;
  viewport: EmulatorViewportKey;
  /** _meta payload policy: strip generatedDraftScene above this serialized char count. 0 = off. */
  truncateChars: number;
  onStatus?: (status: string) => void;
  onDisplayModeChange?: (mode: EmulatorDisplayMode) => void;
};

export type DeliveryRecord = {
  tool: string;
  at: number;
  resultChars: number;
  metaChars: number;
  generatedDraftSceneChars: number;
  metaKeys: string[];
  truncated: boolean;
};

export type MockHostHandle = {
  /** Resolves once the widget completed the ui/initialize handshake and the seed tool result was delivered. */
  ready: Promise<void>;
  setTheme(theme: EmulatorTheme): void;
  deliver(spec: ToolCallSpec): Promise<void>;
  destroy(): Promise<void>;
};

type EmulatorQaWindow = Window & {
  __ATLAS_EMULATOR_OPENAI_FACTORY__?: (inner: Window) => unknown;
  __ATLAS_EMULATOR__?: EmulatorQaHandle;
};

export type EmulatorQaHandle = {
  state: "boot" | "initialized" | "delivered" | "error";
  county: string;
  viewport: EmulatorViewportKey;
  theme: EmulatorTheme;
  displayMode: EmulatorDisplayMode;
  deliveries: DeliveryRecord[];
  messages: string[];
  modelContext: string[];
  errors: string[];
  /** Inner widget QA probe (window.__ATLAS_QA__), for CDP perf reads from the parent context. */
  qa: () => unknown;
};

const SET_GLOBALS_EVENT_TYPE = "openai:set_globals";

function serializedChars(value: unknown): number {
  if (value === undefined) return 0;
  try {
    return JSON.stringify(value)?.length ?? 0;
  } catch {
    return -1;
  }
}

function textOfMessage(params: unknown): string {
  const content = (params as { content?: Array<{ type?: string; text?: string }> })?.content;
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => (block && block.type === "text" && typeof block.text === "string" ? block.text : ""))
    .join(" ")
    .trim();
}

/**
 * _meta payload policy, mirroring the host's transport budget: when the
 * serialized generatedDraftScene exceeds the ceiling, the scene is dropped
 * (the small generatedDraftPacket summary stays) — the widget must degrade
 * honestly to the coverage summary, never crash.
 */
function applyHostPayloadPolicy(result: CallToolResult, truncateChars: number): { result: CallToolResult; truncated: boolean } {
  const meta = result._meta as Record<string, unknown> | undefined;
  if (!truncateChars || !meta || meta.generatedDraftScene === undefined) return { result, truncated: false };
  if (serializedChars(meta.generatedDraftScene) <= truncateChars) return { result, truncated: false };
  const { generatedDraftScene: _dropped, ...keptMeta } = meta;
  return { result: { ...result, _meta: keptMeta }, truncated: true };
}

/** Fetch the production /preview shell and prepend the synchronous window.openai bootstrap. */
export async function buildWidgetSrcdoc(previewUrl: string): Promise<string> {
  const response = await fetch(previewUrl, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Failed to fetch widget shell: HTTP ${response.status}`);
  const html = await response.text();
  // Classic inline scripts execute during parsing; the widget bundle is a
  // deferred module — so this runs strictly first, like the host proxy.
  const bootstrap = "<script>window.openai = window.parent.__ATLAS_EMULATOR_OPENAI_FACTORY__(window);</script>";
  if (html.includes("<head>")) return html.replace("<head>", `<head>${bootstrap}`);
  return `${bootstrap}${html}`;
}

export async function createMockHost(options: MockHostOptions): Promise<MockHostHandle> {
  const { iframe, toolSource } = options;
  const parentWindow = window as EmulatorQaWindow;
  const viewport = EMULATOR_VIEWPORTS[options.viewport];

  const qa: EmulatorQaHandle = {
    state: "boot",
    county: options.county,
    viewport: options.viewport,
    theme: options.theme,
    displayMode: "inline",
    deliveries: [],
    messages: [],
    modelContext: [],
    errors: [],
    qa: () => (iframe.contentWindow as (Window & { __ATLAS_QA__?: unknown }) | null)?.__ATLAS_QA__,
  };
  parentWindow.__ATLAS_EMULATOR__ = qa;

  const status = (text: string) => options.onStatus?.(text);
  const fail = (context: string, error: unknown) => {
    const message = `${context}: ${error instanceof Error ? error.message : String(error)}`;
    qa.errors.push(message);
    qa.state = "error";
    status(message);
  };

  // ---- window.openai (installed by the srcdoc bootstrap, synchronously) ----
  let widgetState: Record<string, unknown> | undefined;
  let innerWindow: Window | null = null;
  const dispatchGlobals = (globals: Record<string, unknown>) => {
    innerWindow?.dispatchEvent(new CustomEvent(SET_GLOBALS_EVENT_TYPE, { detail: { globals } }));
  };
  const openaiApi = {
    get theme() {
      return qa.theme;
    },
    get widgetState() {
      return widgetState;
    },
    setWidgetState: (next: unknown) => {
      if (next && typeof next === "object") widgetState = next as Record<string, unknown>;
      dispatchGlobals({ widgetState });
      return Promise.resolve();
    },
    requestDisplayMode: (request: { mode: EmulatorDisplayMode }) => {
      qa.displayMode = request.mode;
      options.onDisplayModeChange?.(request.mode);
      return Promise.resolve({ mode: request.mode });
    },
  };
  parentWindow.__ATLAS_EMULATOR_OPENAI_FACTORY__ = (inner: Window) => {
    innerWindow = inner;
    return openaiApi;
  };

  // ---- the host bridge -----------------------------------------------------
  const contentWindow = iframe.contentWindow;
  if (!contentWindow) throw new Error("Emulator iframe has no contentWindow (append it before createMockHost).");
  const transport = new PostMessageTransport(contentWindow, contentWindow);
  const bridge = new AppBridge(null, { ...EMULATOR_PROTOCOL_HOST_INFO }, {}, {
    hostContext: {
      theme: options.theme,
      displayMode: "inline",
      platform: options.viewport === "mobile" ? "mobile" : "web",
      locale: "en-US",
      userAgent: "atlas-production-emulator",
      deviceCapabilities: { touch: options.viewport === "mobile", hover: options.viewport === "desktop" },
      safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
      maxWidth: viewport.width,
      maxHeight: viewport.height,
    },
  });

  const deliverResult = (tool: string, raw: CallToolResult) => {
    const { result, truncated } = applyHostPayloadPolicy(raw, options.truncateChars);
    const meta = result._meta as Record<string, unknown> | undefined;
    qa.deliveries.push({
      tool,
      at: Date.now(),
      resultChars: serializedChars(raw),
      metaChars: serializedChars(raw._meta),
      generatedDraftSceneChars: serializedChars((raw._meta as Record<string, unknown> | undefined)?.generatedDraftScene),
      metaKeys: meta ? Object.keys(meta) : [],
      truncated,
    });
    void bridge.sendToolResult(result as Parameters<typeof bridge.sendToolResult>[0]);
    qa.state = "delivered";
  };

  const runToolTurn = async (tool: ToolCallSpec, label: string) => {
    status(`model turn: ${label}…`);
    try {
      const result = tool.arguments.includeGeneratedDraft
        ? await toolSource.callUntilDraftScene(tool)
        : await toolSource.call(tool);
      deliverResult(tool.name, result);
      status(`delivered ${tool.name} (${label})`);
    } catch (error) {
      fail(`tool turn ${tool.name}`, error);
    }
  };

  // The emulated model: route the widget's visible user turns to real tools.
  const routeUserMessage = (text: string) => {
    if (/draft district|generate/i.test(text)) {
      void runToolTurn(
        { name: "render_voxel_county", arguments: { countySlug: qa.county, includeGeneratedDraft: true } },
        "generate district",
      );
      return;
    }
    if (/riverside\/?eastvale|open riverside/i.test(text)) {
      qa.county = "riverside-ca";
      void runToolTurn({ name: "select_county", arguments: { countySlug: "riverside-ca" } }, "open riverside");
      return;
    }
    status(`ui/message recorded (no tool route): ${text.slice(0, 80)}`);
  };

  bridge.onmessage = async (params) => {
    const text = textOfMessage(params);
    qa.messages.push(text);
    // Ack immediately (widget RPC timeout is 1200ms); model turn runs async.
    queueMicrotask(() => routeUserMessage(text));
    return {};
  };
  bridge.onupdatemodelcontext = async (params) => {
    const text = textOfMessage(params) || JSON.stringify((params as { structuredContent?: unknown })?.structuredContent ?? "");
    qa.modelContext.push(text);
    return {};
  };

  // Seed turn: like production, the triggering tool's result arrives right
  // after the widget completes the handshake (subscriber is registered
  // synchronously with the ui/initialize request — web/src/bridge.ts:168).
  let resolveReady!: () => void;
  let rejectReady!: (error: unknown) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  bridge.oninitialized = () => {
    qa.state = "initialized";
    status("widget initialized — running seed tool turn");
    void (async () => {
      try {
        const seed: ToolCallSpec = {
          name: "select_county",
          arguments: {
            countySlug: options.county,
            ...(options.includeGeneratedDraft ? { includeGeneratedDraft: true } : {}),
          },
        };
        const result = options.includeGeneratedDraft
          ? await toolSource.callUntilDraftScene(seed)
          : await toolSource.call(seed);
        deliverResult(seed.name, result);
        status(`seed delivered: ${options.county}${options.includeGeneratedDraft ? " + generated draft" : ""}`);
        resolveReady();
      } catch (error) {
        fail("seed tool turn", error);
        rejectReady(error);
      }
    })();
  };

  await bridge.connect(transport);

  return {
    ready,
    setTheme(theme) {
      qa.theme = theme;
      dispatchGlobals({ theme });
    },
    async deliver(spec) {
      await runToolTurn(spec, `manual ${spec.name}`);
    },
    async destroy() {
      try {
        await bridge.close();
      } catch {
        /* transport may already be gone */
      }
      await toolSource.close();
      iframe.remove();
    },
  };
}
