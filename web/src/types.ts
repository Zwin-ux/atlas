export type ToolResult<T> = {
  structuredContent?: T;
  content?: unknown[];
  _meta?: Record<string, unknown>;
} | null;

export type WidgetState = {
  selectedNodeId: string;
  compact: boolean;
  activeSceneId?: string;
  scoutPreviewId?: string;
  activeStepId?: "county" | "drop" | "report" | "campaign";
};

declare global {
  interface Window {
    openai?: {
      widgetState?: unknown;
      setWidgetState?: (state: unknown) => void;
      requestDisplayMode?: (payload: { mode: "inline" | "pip" | "fullscreen" }) => Promise<unknown>;
    };
  }
}
