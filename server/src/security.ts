import type { IncomingMessage, ServerResponse } from "node:http";

type HostParts = {
  hostname: string;
  port?: string;
};

export type ServerSecurityConfig = {
  production: boolean;
  allowedOrigins: Set<string>;
  allowedHosts: HostParts[];
};

export type RequestAdmission =
  | { ok: true }
  | { ok: false; status: 400 | 403; reason: string };

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export function readServerSecurityConfig(env: NodeJS.ProcessEnv): ServerSecurityConfig {
  const production = env.NODE_ENV === "production";
  const allowedOrigins = new Set<string>();
  const allowedHosts: HostParts[] = [];

  for (const value of splitList(env.ATLAS_ALLOWED_ORIGINS)) {
    const origin = originFromEnvValue(value);
    if (origin) allowedOrigins.add(origin);
  }

  const appBaseUrl = env.APP_BASE_URL?.trim();
  if (appBaseUrl) {
    const appOrigin = originFromEnvValue(appBaseUrl);
    const appHost = hostFromUrlLike(appBaseUrl);
    if (appOrigin) allowedOrigins.add(appOrigin);
    if (appHost) allowedHosts.push(appHost);
  }

  const railwayPublicDomain = env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayPublicDomain) {
    const railwayHost = hostFromUrlLike(railwayPublicDomain);
    if (railwayHost) allowedHosts.push(railwayHost);
  }

  return {
    production,
    allowedOrigins,
    allowedHosts: dedupeHosts(allowedHosts),
  };
}

export function validateHostHeader(req: IncomingMessage, config: ServerSecurityConfig): RequestAdmission {
  const hostHeader = headerValue(req.headers.host);
  if (!hostHeader) {
    return { ok: false, status: 400, reason: "missing_host" };
  }

  const host = parseHostHeader(hostHeader);
  if (!host) {
    return { ok: false, status: 400, reason: "invalid_host" };
  }

  if (!config.production && isLocalHostname(host.hostname)) {
    return { ok: true };
  }

  if (config.allowedHosts.some((allowed) => hostMatches(host, allowed))) {
    return { ok: true };
  }

  return { ok: false, status: 403, reason: "host_not_allowed" };
}

export function validateOriginHeader(req: IncomingMessage, config: ServerSecurityConfig): RequestAdmission {
  const origin = headerValue(req.headers.origin);
  if (!origin) {
    return { ok: true };
  }

  if (isAllowedOrigin(origin, config)) {
    return { ok: true };
  }

  return { ok: false, status: 403, reason: "origin_not_allowed" };
}

export function setCorsHeaders(req: IncomingMessage, res: ServerResponse, config: ServerSecurityConfig): void {
  const origin = headerValue(req.headers.origin);
  const allowedOrigin = origin && isAllowedOrigin(origin, config) ? normalizeOrigin(origin) : undefined;

  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    appendVaryHeader(res, "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, mcp-session-id, authorization");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id, WWW-Authenticate");
}

export function isAllowedOrigin(origin: string, config: ServerSecurityConfig): boolean {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  if (config.allowedOrigins.has(normalized)) return true;

  if (!config.production) {
    const url = parseUrl(normalized);
    return Boolean(url && isLocalHostname(url.hostname));
  }

  return false;
}

export function isLoopbackAddress(address: string | undefined): boolean {
  const normalized = normalizeAddress(address);
  return normalized === "127.0.0.1" || normalized === "::1" || normalized === "localhost";
}

export function isPrivateOrLoopbackAddress(address: string | undefined): boolean {
  const normalized = normalizeAddress(address);
  if (!normalized) return false;
  if (isLoopbackAddress(normalized)) return true;
  if (normalized.startsWith("10.")) return true;
  if (normalized.startsWith("192.168.")) return true;

  const private172 = normalized.match(/^172\.(\d{1,3})\./);
  if (private172) {
    const secondOctet = Number(private172[1]);
    return secondOctet >= 16 && secondOctet <= 31;
  }

  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  return false;
}

function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function headerValue(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed || undefined;
}

function originFromEnvValue(value: string): string | undefined {
  return normalizeOrigin(value.includes("://") ? value : `https://${value}`);
}

function normalizeOrigin(value: string): string | undefined {
  const url = parseUrl(value);
  if (!url || !["http:", "https:"].includes(url.protocol)) return undefined;
  return url.origin;
}

function hostFromUrlLike(value: string): HostParts | undefined {
  const url = parseUrl(value.includes("://") ? value : `https://${value}`);
  if (!url) return undefined;
  return {
    hostname: normalizeHostname(url.hostname),
    ...(url.port ? { port: url.port } : {}),
  };
}

function parseHostHeader(value: string): HostParts | undefined {
  if (value.includes(",") || /[/?#]/.test(value)) return undefined;
  const url = parseUrl(`http://${value}`);
  if (!url) return undefined;
  return {
    hostname: normalizeHostname(url.hostname),
    ...(url.port ? { port: url.port } : {}),
  };
}

function parseUrl(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/^\[(.*)\]$/, "$1").replace(/\.$/, "");
}

function normalizeAddress(address: string | undefined): string | undefined {
  const normalized = address?.trim().toLowerCase().replace(/^::ffff:/, "");
  return normalized ? normalizeHostname(normalized) : undefined;
}

function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTNAMES.has(normalizeHostname(hostname));
}

function hostMatches(host: HostParts, allowed: HostParts): boolean {
  if (host.hostname !== allowed.hostname) return false;
  return !allowed.port || host.port === allowed.port;
}

function dedupeHosts(hosts: HostParts[]): HostParts[] {
  const seen = new Set<string>();
  const result: HostParts[] = [];
  for (const host of hosts) {
    const key = `${host.hostname}:${host.port ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(host);
  }
  return result;
}

function appendVaryHeader(res: ServerResponse, value: string): void {
  const current = res.getHeader("Vary");
  const values = new Set<string>();
  if (Array.isArray(current)) {
    for (const entry of current) values.add(String(entry));
  } else if (current) {
    for (const entry of String(current).split(",")) values.add(entry.trim());
  }
  values.add(value);
  res.setHeader("Vary", [...values].filter(Boolean).join(", "));
}
