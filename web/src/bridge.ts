import { useEffect, useRef, useState } from "react";
import type { ToolResult } from "./types";

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: unknown;
};

type JsonRpcNotification = {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
};

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timer: number;
};

const SET_GLOBALS_EVENT_TYPE = "openai:set_globals";
const TEST_TOOL_RESULT_EVENT_TYPE = "atlas:test-tool-result";
let rpcId = 0;
let isListening = false;
let bridgeInitialized = false;
const pending = new Map<number, PendingRequest>();
const toolResultSubscribers = new Set<(result: ToolResult<unknown>) => void>();

export type OpenAiDisplayMode = "inline" | "pip" | "fullscreen";

function isRpcResponse(message: unknown): message is JsonRpcResponse {
  return Boolean(
    message &&
      typeof message === "object" &&
      (message as { jsonrpc?: unknown }).jsonrpc === "2.0" &&
      typeof (message as { id?: unknown }).id === "number",
  );
}

function isRpcNotification(message: unknown): message is JsonRpcNotification {
  return Boolean(
    message &&
      typeof message === "object" &&
      (message as { jsonrpc?: unknown }).jsonrpc === "2.0" &&
      typeof (message as { method?: unknown }).method === "string",
  );
}

function ensureBridgeListener(): void {
  if (isListening || typeof window === "undefined") return;
  isListening = true;

  window.addEventListener(
    "message",
    (event) => {
      if (event.source !== window.parent) return;
      const message = event.data as unknown;

      if (isRpcResponse(message)) {
        const request = pending.get(message.id);
        if (!request) return;

        pending.delete(message.id);
        window.clearTimeout(request.timer);

        if (message.error) {
          request.reject(message.error);
          return;
        }

        request.resolve(message.result);
        return;
      }

      if (!isRpcNotification(message)) return;

      if (message.method === "ui/notifications/tool-result") {
        for (const subscriber of toolResultSubscribers) {
          subscriber((message.params ?? null) as ToolResult<unknown>);
        }
      }
    },
    { passive: true },
  );

  window.addEventListener(
    TEST_TOOL_RESULT_EVENT_TYPE,
    (event) => {
      const detail = (event as CustomEvent<ToolResult<unknown>>).detail;
      const debugWindow = window as Window & {
        __atlasTestToolResultCount?: number;
        __atlasLastTestToolResultType?: string;
      };
      debugWindow.__atlasTestToolResultCount = (debugWindow.__atlasTestToolResultCount ?? 0) + 1;
      debugWindow.__atlasLastTestToolResultType =
        detail && typeof detail === "object" && detail.structuredContent && typeof detail.structuredContent === "object"
          ? String((detail.structuredContent as { type?: unknown }).type ?? "")
          : "";
      for (const subscriber of toolResultSubscribers) {
        subscriber(detail ?? null);
      }
    },
    { passive: true },
  );
  (window as Window & { __atlasToolResultBridgeReady?: boolean }).__atlasToolResultBridgeReady = true;
}

export function rpcRequest<T = unknown>(method: string, params: unknown, timeoutMs = 2000): Promise<T> {
  ensureBridgeListener();

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.parent) {
      reject(new Error("MCP Apps bridge is not available."));
      return;
    }

    const id = ++rpcId;
    const timer = window.setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Bridge request timed out: ${method}`));
    }, timeoutMs);

    pending.set(id, { resolve: (value) => resolve(value as T), reject, timer });
    window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
  });
}

export function rpcNotify(method: string, params: unknown): void {
  if (typeof window === "undefined" || !window.parent) return;
  window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
}

export async function initializeBridge(): Promise<void> {
  if (bridgeInitialized) return;
  bridgeInitialized = true;

  try {
    await rpcRequest(
      "ui/initialize",
      {
        appInfo: { name: "atlas-widget", version: "0.1.0" },
        appCapabilities: {},
        protocolVersion: "2026-01-26",
      },
      1200,
    );
    rpcNotify("ui/notifications/initialized", {});
  } catch {
    // Local preview has no host bridge. The widget still renders fallback data.
  }
}

export function subscribeToolResult<T>(onResult: (result: ToolResult<T>) => void): () => void {
  ensureBridgeListener();
  const subscriber = (result: ToolResult<unknown>) => onResult(result as ToolResult<T>);
  toolResultSubscribers.add(subscriber);
  (window as Window & { __atlasToolResultSubscriberCount?: number }).__atlasToolResultSubscriberCount = toolResultSubscribers.size;
  return () => {
    toolResultSubscribers.delete(subscriber);
    (window as Window & { __atlasToolResultSubscriberCount?: number }).__atlasToolResultSubscriberCount = toolResultSubscribers.size;
  };
}

export function useToolResult<T>(fallback: T): ToolResult<T> {
  const [result, setResult] = useState<ToolResult<T>>({ structuredContent: fallback });

  useEffect(() => {
    void initializeBridge();
    return subscribeToolResult<T>(setResult);
  }, []);

  return result;
}

export async function sendUserMessage(text: string): Promise<void> {
  try {
    await rpcRequest(
      "ui/message",
      {
        role: "user",
        content: [{ type: "text", text }],
      },
      1200,
    );
  } catch {
    // Local preview has no host bridge. Ignore the optional handoff.
  }
}

export async function updateModelContext(text: string): Promise<void> {
  try {
    await rpcRequest(
      "ui/update-model-context",
      {
        content: [{ type: "text", text }],
      },
      1200,
    );
  } catch {
    // Optional host capability. Ignore in local preview.
  }
}

function readWidgetState<T>(fallback: T): T {
  const state = window.openai?.widgetState;
  if (state && typeof state === "object") return state as T;
  return fallback;
}

export function useWidgetState<T extends Record<string, unknown>>(fallback: T) {
  const fallbackRef = useRef(fallback);
  const [state, setState] = useState<T>(() => readWidgetState<T>(fallbackRef.current));

  useEffect(() => {
    const onGlobals = (event: Event) => {
      const detail = (event as CustomEvent<{ globals?: { widgetState?: unknown } }>).detail;
      const next = detail?.globals?.widgetState;
      if (next && typeof next === "object") {
        setState(next as T);
      }
    };

    window.addEventListener(SET_GLOBALS_EVENT_TYPE, onGlobals, { passive: true });
    return () => window.removeEventListener(SET_GLOBALS_EVENT_TYPE, onGlobals);
  }, []);

  const setWidgetState = (next: T | ((current: T) => T)) => {
    setState((current) => {
      const resolved = typeof next === "function" ? (next as (value: T) => T)(current) : next;
      window.openai?.setWidgetState?.(resolved);
      return resolved;
    });
  };

  return [state, setWidgetState] as const;
}

function normalizeDisplayMode(value: unknown): OpenAiDisplayMode {
  return value === "fullscreen" || value === "pip" || value === "inline" ? value : "inline";
}

function readDisplayModeGlobal(): OpenAiDisplayMode {
  if (typeof window === "undefined") return "inline";
  const openai = window.openai as ({ displayMode?: unknown } & typeof window.openai) | undefined;
  return normalizeDisplayMode(openai?.displayMode);
}

export function useOpenAiDisplayMode(): OpenAiDisplayMode {
  const [displayMode, setDisplayMode] = useState<OpenAiDisplayMode>(() => readDisplayModeGlobal());

  useEffect(() => {
    const onGlobals = (event: Event) => {
      const detail = (event as CustomEvent<{ globals?: { displayMode?: unknown }; displayMode?: unknown }>).detail;
      setDisplayMode(normalizeDisplayMode(detail?.globals?.displayMode ?? detail?.displayMode ?? readDisplayModeGlobal()));
    };

    window.addEventListener(SET_GLOBALS_EVENT_TYPE, onGlobals, { passive: true });
    return () => window.removeEventListener(SET_GLOBALS_EVENT_TYPE, onGlobals);
  }, []);

  return displayMode;
}
