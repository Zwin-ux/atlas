/**
 * Widget-side debug beacon.
 *
 * ChatGPT hides iframe console and CSP failures. A 1x1 GET to our origin
 * still shows up in Railway logs even when the plate fetch never does.
 */

const PRODUCTION_API_ORIGIN = "https://atlas-backend-production-e6fc.up.railway.app";

export function widgetDebugOrigin(apiBase: string): string {
  const stamped = apiBase.trim().replace(/\/+$/, "");
  if (stamped) return stamped;
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  if (host === "localhost" || host === "127.0.0.1") return "";
  return PRODUCTION_API_ORIGIN;
}

export function reportWidgetDebug(
  apiBase: string,
  kind: string,
  detail: string,
  extra: Record<string, string> = {},
): void {
  const base = widgetDebugOrigin(apiBase);
  if (!base || typeof window === "undefined") return;
  const params = new URLSearchParams({
    kind: kind.slice(0, 40),
    origin: window.location.origin.slice(0, 120),
    host: window.location.hostname.slice(0, 80),
    href: window.location.href.slice(0, 180),
    detail: detail.slice(0, 300),
    ...Object.fromEntries(
      Object.entries(extra).map(([key, value]) => [key.slice(0, 24), value.slice(0, 120)]),
    ),
  });
  const url = `${base}/api/widget-debug?${params.toString()}`;
  try {
    const probe = new Image();
    probe.referrerPolicy = "no-referrer";
    probe.src = url;
  } catch {
    void fetch(url, { mode: "no-cors", cache: "no-store", keepalive: true }).catch(() => undefined);
  }
}
