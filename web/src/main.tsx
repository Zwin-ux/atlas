import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

import { AtlasApp } from "./atlas/AtlasApp";
import { AtlasMapController } from "./atlas/AtlasMapController";
import { useToolPlate } from "./atlas/useToolPlate";
import { mountAtlasWebMcp } from "./atlas/webmcpRegistry";

/**
 * Shell theme plumbing.
 *
 * Reads `window.openai.theme` before first paint and stamps `data-theme` on
 * the document root so the map's tokens remap without a white flash, then
 * follows the ChatGPT shell toggle via the host globals events. When the host
 * reports no theme, `data-theme` stays unset and the CSS
 * `prefers-color-scheme` fallback applies.
 */
const HOST_GLOBALS_EVENT_TYPES = ["openai:set_globals", "globals-change"] as const;

function applyShellTheme(theme: unknown): void {
  if (theme === "dark" || theme === "light") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

function readEventTheme(event: Event): unknown {
  const detail = (event as CustomEvent<{ globals?: { theme?: unknown }; theme?: unknown }>).detail;
  return detail?.globals?.theme ?? detail?.theme ?? window.openai?.theme;
}

applyShellTheme(window.openai?.theme);

for (const eventType of HOST_GLOBALS_EVENT_TYPES) {
  window.addEventListener(eventType, (event) => applyShellTheme(readEventTheme(event)), { passive: true });
}

/**
 * The widget is served from a per-app sandbox origin, so plate fetches need the
 * absolute backend origin rather than a same-origin path. The bundle records it
 * at build time; in the local preview the widget and the API share an origin
 * and the empty default is correct.
 */
const API_BASE = (window as { __ATLAS_API_BASE__?: string }).__ATLAS_API_BASE__ ?? "";

function LegacyAtlasWidget() {
  const { ref, coverage } = useToolPlate();
  return <AtlasApp initialRef={ref} coverage={coverage} apiBase={API_BASE} />;
}

function ChallengeAtlas() {
  const controllerRef = useRef<AtlasMapController | null>(null);
  if (!controllerRef.current) controllerRef.current = new AtlasMapController({ level: "nation" }, API_BASE);
  const controller = controllerRef.current;

  useEffect(() => mountAtlasWebMcp(controller), [controller]);
  return <AtlasApp apiBase={API_BASE} controller={controller} />;
}

const isChallengeRoute = window.location.pathname === "/" || window.location.pathname === "/explore";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element for Atlas widget.");
}

createRoot(root).render(isChallengeRoute ? <ChallengeAtlas /> : <LegacyAtlasWidget />);
