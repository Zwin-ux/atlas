// Production-emulator contract constants — the ONE authoritative copy.
// Node harnesses (scripts/verify-emulator-*.mjs) import these numbers from
// the emitted bundle's QA handle at runtime and re-declare gates against
// them; keep any change here reflected in docs/PRODUCT_SPEC_AND_GATES.md.

export const EMULATOR_VIEWPORTS = {
  desktop: { label: "desktop-1280x720", width: 1280, height: 720 },
  // ChatGPT-on-iPhone frame per NS-2/NS-3 mobile doctrine.
  mobile: { label: "mobile-390x844", width: 390, height: 844 },
} as const;

export type EmulatorViewportKey = keyof typeof EMULATOR_VIEWPORTS;

// Mirrors scripts/verify-widget-performance.mjs — the deterministic
// architecture gate (merged-Graphics ceiling) and the latency ceiling.
export const REBUILD_MS_CEILING = 350;
export const WORLD_GRAPHICS_CEILING = 1600;

// Host payload watch-item (NS-6): legacy ~780KB _meta.generatedDraftScene vs
// the real ChatGPT host transport budget. Production (0.76-T) ships the compact
// generatedDraftSpec instead; this ceiling remains a REPORTING threshold for any
// residual full-scene payload, env/param-overridable, not a hard fail.
export const HOST_PAYLOAD_REPORT_CEILING = 900_000;

export const EMULATOR_PROTOCOL_HOST_INFO = {
  name: "atlas-production-emulator",
  version: "0.1.0",
} as const;
