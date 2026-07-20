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
//     the real host's proxy injection. The srcdoc stays same-origin for QA
//     reads, while all widget assets and lazy chunks load from a second origin.
//   - The iframe CSP mirrors the host split Atlas depends on: data: images are
//     allowed, fetch(data:) is blocked, and Pixi's unsafe-eval path is allowed.
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
  assetOrigin: string;
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
  generatedDraftSpecChars: number;
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
  hostOrigin: string;
  assetOrigin: string;
  deliveries: DeliveryRecord[];
  messages: string[];
  modelContext: string[];
  errors: string[];
  /** Inner widget QA probe (window.__ATLAS_QA__), for CDP perf reads from the parent context. */
  qa: () => unknown;
};

const SET_GLOBALS_EVENT_TYPE = "openai:set_globals";
const DISPLAY_MODE_GESTURE_WINDOW_MS = 200;

const LOOPBACK_ASSET_HOSTS: Record<string, string> = {
  "127.0.0.1": "localhost",
  localhost: "127.0.0.1",
  "[::1]": "127.0.0.1",
};

/** Use a distinct browser origin without adding a second local process. */
export function resolveEmulatorAssetOrigin(hostOrigin: string): string {
  const url = new URL(hostOrigin);
  const assetHost = LOOPBACK_ASSET_HOSTS[url.hostname];
  if (!assetHost) {
    throw new Error(`The production emulator requires a loopback host; got ${url.origin}.`);
  }
  url.hostname = assetHost;
  return url.origin;
}

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
 * _meta payload policy, mirroring the host's transport budget: when a legacy
 * serialized generatedDraftScene exceeds the ceiling, the scene is dropped
 * (generatedDraftSpec / generatedDraftPacket stay) — the widget compiles from
 * the compact spec or degrades honestly to the coverage shell, never crashes.
 */
function applyHostPayloadPolicy(result: CallToolResult, truncateChars: number): { result: CallToolResult; truncated: boolean } {
  const meta = result._meta as Record<string, unknown> | undefined;
  if (!truncateChars || !meta || meta.generatedDraftScene === undefined) return { result, truncated: false };
  if (serializedChars(meta.generatedDraftScene) <= truncateChars) return { result, truncated: false };
  const { generatedDraftScene: _dropped, ...keptMeta } = meta;
  return { result: { ...result, _meta: keptMeta }, truncated: true };
}

function rewriteWidgetAssetOrigin(html: string, assetOrigin: string): string {
  return html.replace(
    /\b(href|src)=(['"])(?:https?:\/\/[^'"<>]+)?\/widget\//gi,
    (_match, attribute: string, quote: string) => `${attribute}=${quote}${assetOrigin}/widget/`,
  );
}

function sandboxCsp(assetOrigin: string): string {
  return [
    "default-src 'none'",
    `script-src 'unsafe-inline' 'unsafe-eval' ${assetOrigin}`,
    `style-src 'unsafe-inline' ${assetOrigin}`,
    `img-src data: blob: ${assetOrigin}`,
    `font-src data: ${assetOrigin}`,
    "connect-src 'self'",
    "worker-src blob:",
  ].join("; ");
}

/** Fetch the production /preview shell and add the host bootstrap + sandbox contract. */
export async function buildWidgetSrcdoc(previewUrl: string, assetOrigin: string): Promise<string> {
  const response = await fetch(previewUrl, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Failed to fetch widget shell: HTTP ${response.status}`);
  const html = rewriteWidgetAssetOrigin(await response.text(), assetOrigin);
  // Classic inline scripts execute during parsing; the widget bundle is a
  // deferred module — so this runs strictly first, like the host proxy.
  const bootstrap = "<script>window.openai = window.parent.__ATLAS_EMULATOR_OPENAI_FACTORY__(window);</script>";
  const csp = `<meta http-equiv="Content-Security-Policy" content="${sandboxCsp(assetOrigin)}">`;
  if (html.includes("<head>")) return html.replace("<head>", `<head>${csp}${bootstrap}`);
  return `${csp}${bootstrap}${html}`;
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
    hostOrigin: window.location.origin,
    assetOrigin: options.assetOrigin,
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
  let lastDisplayModeGestureAt = Number.NEGATIVE_INFINITY;
  let gestureCleanup: (() => void) | null = null;
  const markDisplayModeGesture = () => {
    lastDisplayModeGestureAt = performance.now();
  };
  const hasRecentDisplayModeGesture = () => performance.now() - lastDisplayModeGestureAt <= DISPLAY_MODE_GESTURE_WINDOW_MS;
  const dispatchGlobals = (globals: Record<string, unknown>) => {
    innerWindow?.dispatchEvent(new CustomEvent(SET_GLOBALS_EVENT_TYPE, { detail: { globals } }));
  };
  const openaiApi = {
    get theme() {
      return qa.theme;
    },
    get displayMode() {
      return qa.displayMode;
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
      if (!hasRecentDisplayModeGesture()) {
        console.warn("requestDisplayMode ignored: no recent user gesture.");
        return undefined;
      }
      qa.displayMode = request.mode;
      dispatchGlobals({ displayMode: request.mode });
      options.onDisplayModeChange?.(request.mode);
      return Promise.resolve({ mode: request.mode });
    },
  };
  parentWindow.__ATLAS_EMULATOR_OPENAI_FACTORY__ = (inner: Window) => {
    gestureCleanup?.();
    innerWindow = inner;
    inner.addEventListener("pointerdown", markDisplayModeGesture, { capture: true, passive: true });
    inner.addEventListener("keydown", markDisplayModeGesture, true);
    gestureCleanup = () => {
      inner.removeEventListener("pointerdown", markDisplayModeGesture, true);
      inner.removeEventListener("keydown", markDisplayModeGesture, true);
      gestureCleanup = null;
    };
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
      generatedDraftSpecChars: serializedChars((raw._meta as Record<string, unknown> | undefined)?.generatedDraftSpec),
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
      gestureCleanup?.();
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
