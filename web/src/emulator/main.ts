// /emulator — the production-fidelity host page.
//
// Humans browse it (http://127.0.0.1:8787/emulator?county=cook-il&draft=1&
// viewport=mobile&theme=dark); the CDP harnesses navigate the identical URL
// headless and read window.__ATLAS_EMULATOR__ + .qa() from this parent
// context. Query params:
//   county=<slug>      seed county (default orange-ca)
//   draft=1|0          includeGeneratedDraft on the seed turn (default 1)
//   viewport=desktop|mobile
//   theme=light|dark
//   truncate=<chars>   host payload policy: strip generatedDraftScene above N serialized chars
//   src=live|injected  tool-result strategy (injected = pre-parked by the CDP driver)
import { EMULATOR_VIEWPORTS, type EmulatorViewportKey } from "./constants";
import {
  buildWidgetSrcdoc,
  createMockHost,
  resolveEmulatorAssetOrigin,
  type EmulatorDisplayMode,
  type EmulatorTheme,
} from "./mockHost";
import { createInjectedToolSource, createLiveMcpToolSource } from "./toolSource";

const params = new URLSearchParams(window.location.search);
// The county slug is the only user-controlled string interpolated into
// markup — constrain it to slug characters (council security finding:
// reflected XSS via ?county= into innerHTML).
const county = (params.get("county") ?? "orange-ca").replace(/[^a-z0-9-]/gi, "").slice(0, 64) || "orange-ca";
const includeGeneratedDraft = params.get("draft") !== "0";
const viewportKey: EmulatorViewportKey = params.get("viewport") === "mobile" ? "mobile" : "desktop";
const theme: EmulatorTheme = params.get("theme") === "dark" ? "dark" : "light";
const truncateChars = Number(params.get("truncate") ?? "0") || 0;
const geoBoardEnabled = params.get("atlasGeoBoard") === "1";
const preferInjected = params.get("src") === "injected";
const viewport = EMULATOR_VIEWPORTS[viewportKey];
const assetOrigin = resolveEmulatorAssetOrigin(window.location.origin);

const style = document.createElement("style");
style.textContent = `
  :root { color-scheme: light dark; }
  body { margin: 0; min-height: 100vh; background: #23252a; color: #d7d9de;
         font: 12px/1.5 ui-monospace, Consolas, monospace; display: flex; flex-direction: column; }
  header { display: flex; gap: 14px; align-items: baseline; padding: 8px 14px;
           border-bottom: 1px solid #3a3d44; flex: none; flex-wrap: wrap; }
  header b { color: #fff; font-weight: 600; }
  header a { color: #8ab4f8; text-decoration: none; }
  #stage { flex: 1; display: grid; place-items: center; overflow: auto; padding: 20px; }
  #frame-box { background: #000; border-radius: 8px; box-shadow: 0 4px 30px rgba(0,0,0,.5); flex: none; }
  #frame-box.fullscreen { position: fixed; inset: 0; z-index: 10; border-radius: 0; width: 100vw !important; height: 100vh !important; }
  #frame-box.fullscreen iframe { width: 100vw !important; height: 100vh !important; }
  iframe { display: block; border: 0; border-radius: inherit; background: #fff; }
  #status { padding: 6px 14px; border-top: 1px solid #3a3d44; color: #9aa0a6; flex: none;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;
document.head.appendChild(style);

function link(label: string, patch: Record<string, string>): string {
  const next = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(patch)) next.set(key, value);
  return `<a href="?${next.toString()}">${label}</a>`;
}

const root = document.getElementById("root") ?? document.body;
root.innerHTML = `
  <header>
    <b>Atlas production emulator</b>
    <span>county=<b>${county}</b></span>
    <span>draft=${includeGeneratedDraft ? "1" : "0"}</span>
    <span>${viewport.label}</span>
    <span>${theme}</span>
    <span>assets=<b>${assetOrigin}</b></span>
    ${link("desktop", { viewport: "desktop" })} ${link("mobile", { viewport: "mobile" })}
    ${link("light", { theme: "light" })} ${link("dark", { theme: "dark" })}
    ${link(includeGeneratedDraft ? "draft off" : "draft on", { draft: includeGeneratedDraft ? "0" : "1" })}
    ${link("riverside", { county: "riverside-ca", draft: "0" })}
  </header>
  <div id="stage"><div id="frame-box"></div></div>
  <div id="status" data-qa="emulator-status">booting…</div>
`;

const frameBox = document.getElementById("frame-box")!;
const statusLine = document.getElementById("status")!;
frameBox.dataset.displayMode = "inline";
document.body.dataset.displayMode = "inline";
const setStatus = (text: string) => {
  statusLine.textContent = text;
};

async function boot(): Promise<void> {
  setStatus("fetching widget shell…");
  const srcdoc = await buildWidgetSrcdoc("/preview", assetOrigin);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("data-qa", "emulator-frame");
  // allow-same-origin is required for the openai bootstrap + CDP QA reads;
  // postMessage (the JSON-RPC bridge) needs neither. Widget assets still load
  // from a distinct loopback origin; see the mockHost.ts fidelity contract.
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
  iframe.width = String(viewport.width);
  iframe.height = String(viewport.height);
  iframe.style.width = `${viewport.width}px`;
  iframe.style.height = `${viewport.height}px`;
  iframe.dataset.displayMode = "inline";
  if (geoBoardEnabled) iframe.dataset.atlasGeoBoard = "1";
  frameBox.appendChild(iframe);

  setStatus("connecting tool source…");
  const toolSource = (preferInjected ? createInjectedToolSource() : null) ?? (await createLiveMcpToolSource("/mcp"));

  const host = await createMockHost({
    iframe,
    toolSource,
    assetOrigin,
    county,
    includeGeneratedDraft,
    theme,
    viewport: viewportKey,
    truncateChars,
    onStatus: setStatus,
    onDisplayModeChange: (mode: EmulatorDisplayMode) => {
      frameBox.classList.toggle("fullscreen", mode === "fullscreen");
      frameBox.dataset.displayMode = mode;
      iframe.dataset.displayMode = mode;
      document.body.dataset.displayMode = mode;
    },
  });

  // Navigate the widget document only after the host bridge is listening.
  iframe.srcdoc = srcdoc;
  await host.ready;
}

boot().catch((error: unknown) => {
  setStatus(`emulator boot failed: ${error instanceof Error ? error.message : String(error)}`);
});
