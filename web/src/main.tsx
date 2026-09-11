import { createRoot } from "react-dom/client";

import { AtlasApp } from "./atlas/AtlasApp";
import { useToolPlate } from "./atlas/useToolPlate";

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
 * Plate JSON is fetched by the widget. Inside ChatGPT the document origin is
 * a sandbox host (*.oaiusercontent.com), not Atlas, so relative `/api/atlas`
 * URLs miss the server entirely — that looks like a loaded app with no map.
 */
const PRODUCTION_API_ORIGIN = "https://atlas-backend-production-e6fc.up.railway.app";

function atlasApiBase(): string {
  const stamped = (window as { __ATLAS_API_BASE__?: string }).__ATLAS_API_BASE__;
  if (typeof stamped === "string" && stamped.trim()) return stamped.replace(/\/+$/, "");
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "";
  // srcdoc / blob / sandbox hosts are not Atlas. Always hit production there.
  return PRODUCTION_API_ORIGIN;
}

const API_BASE = atlasApiBase();

function AtlasWidget() {
  const plate = useToolPlate();
  return (
    <AtlasApp
      initialRef={plate.ref}
      focus={plate.focus}
      apiBase={API_BASE}
      viewStatus={plate.status}
      candidates={plate.candidates}
      refusalTitle={plate.title}
      refusalQuery={plate.query}
    />
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element for Atlas widget.");
}

createRoot(root).render(<AtlasWidget />);
