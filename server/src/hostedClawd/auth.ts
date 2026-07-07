import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";

export const HOSTED_CLAWD_READ_SCOPE = "atlas:hosted_clawd.read" as const;
export const HOSTED_CLAWD_WRITE_SCOPE = "atlas:hosted_clawd.write" as const;

export type HostedClawdAuthConfig = {
  issuer: string;
  audience: string;
  jwksUrl: string;
};

export type HostedClawdAuthContext = {
  subject: string;
  email?: string;
  scopes: string[];
};

export type HostedClawdAuthFailureReason =
  | "missing_token"
  | "invalid_token"
  | "wrong_audience"
  | "expired_token";

export type HostedClawdAuthResult =
  | { ok: true; auth: HostedClawdAuthContext }
  | { ok: false; reason: HostedClawdAuthFailureReason; detail: string };

export function readHostedClawdAuthConfig(env: NodeJS.ProcessEnv): HostedClawdAuthConfig | undefined {
  const issuer = env.ATLAS_OIDC_ISSUER?.trim();
  const audience = env.ATLAS_OIDC_AUDIENCE?.trim();
  if (!issuer || !audience) return undefined;

  const jwksUrl = env.ATLAS_OIDC_JWKS_URL?.trim() || new URL("/.well-known/jwks.json", issuer).toString();
  return { issuer, audience, jwksUrl };
}

export type HostedClawdAuthenticatorOptions = {
  // Test seam: pure tests inject a local key set instead of a remote JWKS fetch.
  getKey?: JWTVerifyGetKey;
};

export class HostedClawdAuthenticator {
  readonly config: HostedClawdAuthConfig;
  private readonly getKey: JWTVerifyGetKey;

  constructor(config: HostedClawdAuthConfig, options: HostedClawdAuthenticatorOptions = {}) {
    this.config = config;
    this.getKey = options.getKey ?? createRemoteJWKSet(new URL(config.jwksUrl));
  }

  async verifyAuthorizationHeader(header: string | undefined): Promise<HostedClawdAuthResult> {
    const token = bearerTokenFromHeader(header);
    if (!token) {
      return { ok: false, reason: "missing_token", detail: "Missing bearer token." };
    }
    return this.verifyBearerToken(token);
  }

  async verifyBearerToken(token: string): Promise<HostedClawdAuthResult> {
    try {
      const { payload } = await jwtVerify(token, this.getKey, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });
      if (!payload.sub) {
        return { ok: false, reason: "invalid_token", detail: "Token has no subject." };
      }
      return {
        ok: true,
        auth: {
          subject: payload.sub,
          email: emailFromPayload(payload),
          scopes: scopesFromPayload(payload),
        },
      };
    } catch (error) {
      return authFailureFromError(error);
    }
  }
}

export function buildOAuthProtectedResourceMetadata(
  config: HostedClawdAuthConfig,
  resourceUrl: string,
): Record<string, unknown> {
  return {
    resource: resourceUrl,
    authorization_servers: [config.issuer],
    scopes_supported: [HOSTED_CLAWD_READ_SCOPE, HOSTED_CLAWD_WRITE_SCOPE],
    bearer_methods_supported: ["header"],
  };
}

export function buildAuthChallengeHeader(resourceMetadataUrl: string, requiredScope?: string): string {
  const parts = [`Bearer resource_metadata="${resourceMetadataUrl}"`];
  if (requiredScope) parts.push(`scope="${requiredScope}"`);
  return parts.join(", ");
}

export function hasWriteScope(auth: HostedClawdAuthContext): boolean {
  return auth.scopes.includes(HOSTED_CLAWD_WRITE_SCOPE);
}

export function hasReadScope(auth: HostedClawdAuthContext): boolean {
  return auth.scopes.includes(HOSTED_CLAWD_READ_SCOPE) || hasWriteScope(auth);
}

function bearerTokenFromHeader(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || undefined;
}

function emailFromPayload(payload: JWTPayload): string | undefined {
  const email = payload.email;
  return typeof email === "string" && email.trim() ? email.trim() : undefined;
}

function scopesFromPayload(payload: JWTPayload): string[] {
  if (typeof payload.scope === "string") {
    return payload.scope.split(/\s+/).filter(Boolean);
  }
  const scp = payload.scp;
  if (Array.isArray(scp)) {
    return scp.filter((entry): entry is string => typeof entry === "string");
  }
  return [];
}

function authFailureFromError(error: unknown): HostedClawdAuthResult {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  if (code === "ERR_JWT_EXPIRED") {
    return { ok: false, reason: "expired_token", detail: "Bearer token is expired." };
  }
  if (code === "ERR_JWT_CLAIM_VALIDATION_FAILED") {
    const claim =
      typeof error === "object" && error && "claim" in error ? String((error as { claim: unknown }).claim) : "";
    if (claim === "aud") {
      return { ok: false, reason: "wrong_audience", detail: "Bearer token audience does not match this resource." };
    }
    return { ok: false, reason: "invalid_token", detail: `Bearer token claim ${claim || "validation"} failed.` };
  }
  return { ok: false, reason: "invalid_token", detail: "Bearer token could not be verified." };
}
