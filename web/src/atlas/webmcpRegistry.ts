/// <reference types="webmcp-types" />

import type { AtlasMapController } from "./AtlasMapController";
import { createAtlasWebMcpTools } from "./webmcpTools";

export function registerAtlasWebMcpTools(
  controller: AtlasMapController,
  modelContext: Pick<WebMCP.ModelContext, "registerTool">,
): () => void {
  const lifecycle = new AbortController();
  controller.setToolStatus("registering");

  void Promise.all(
    createAtlasWebMcpTools(controller).map((tool) => modelContext.registerTool(tool, { signal: lifecycle.signal })),
  ).then(() => {
    if (!lifecycle.signal.aborted) controller.setToolStatus("available");
  }).catch(() => {
    lifecycle.abort();
    controller.setToolStatus("failed");
  });

  return () => lifecycle.abort();
}

export function mountAtlasWebMcp(controller: AtlasMapController): () => void {
  const registerTool = document.modelContext?.registerTool;
  const isTopLevel = window.top === window;
  const isChallengeRoute = window.location.pathname === "/" || window.location.pathname === "/explore";
  if (typeof registerTool !== "function" || !isTopLevel || !isChallengeRoute || !document.modelContext) {
    controller.setToolStatus("unavailable");
    return () => undefined;
  }
  return registerAtlasWebMcpTools(controller, document.modelContext);
}
