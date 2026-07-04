import { createRoot } from "react-dom/client";
import { App } from "./App";

/**
 * Shell theme plumbing.
 *
 * Reads `window.openai.theme` before first paint and stamps `data-theme` on
 * the document root so the Tier-2 tokens remap without a white flash, then
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

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element for Atlas widget.");
}

createRoot(root).render(<App />);
