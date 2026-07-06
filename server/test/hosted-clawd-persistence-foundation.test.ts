import assert from "node:assert/strict";
import test from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import {
  HOSTED_CLAWD_READ_SCOPE,
  HOSTED_CLAWD_WRITE_SCOPE,
  HostedClawdAuthenticator,
  type HostedClawdAuthContext,
} from "../src/hostedClawd/auth.js";
import {
  createHostedClawdRepositoryPersistence,
  createInMemoryHostedClawdRepository,
  isSessionOnlyId,
} from "../src/hostedClawd/repository.js";
import { HostedClawdService } from "../src/hostedClawd/service.js";

const ISSUER = "https://auth.atlas.test/";
const AUDIENCE = "https://atlas.test/mcp";

async function makeAuthFixture() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = await exportJWK(publicKey);
  jwk.alg = "RS256";
  jwk.use = "sig";
  const authenticator = new HostedClawdAuthenticator(
    { issuer: ISSUER, audience: AUDIENCE, jwksUrl: "https://auth.atlas.test/jwks" },
    { getKey: createLocalJWKSet({ keys: [jwk] }) },
  );

  async function signToken(options: {
    subject?: string;
    audience?: string;
    scope?: string;
    expiresInSeconds?: number;
    email?: string;
  } = {}): Promise<string> {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresIn = options.expiresInSeconds ?? 300;
    return new SignJWT({
      scope: options.scope ?? `${HOSTED_CLAWD_READ_SCOPE} ${HOSTED_CLAWD_WRITE_SCOPE}`,
      email: options.email ?? "owner@atlas.test",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(ISSUER)
      .setAudience(options.audience ?? AUDIENCE)
      .setSubject(options.subject ?? "oidc|user-a")
      .setIssuedAt(nowSeconds - 10)
      .setExpirationTime(nowSeconds + expiresIn)
      .sign(privateKey);
  }

  return { authenticator, signToken };
}

function writeAuth(subject: string, email = `${subject}@atlas.test`): HostedClawdAuthContext {
  return { subject, email, scopes: [HOSTED_CLAWD_READ_SCOPE, HOSTED_CLAWD_WRITE_SCOPE] };
}

function makePersistedService() {
  const repository = createInMemoryHostedClawdRepository();
  const service = new HostedClawdService({
    flags: { persistenceEnabled: true, moneyEnabled: false, publicClaimEnabled: false },
    persistence: createHostedClawdRepositoryPersistence(repository),
  });
  return { repository, service };
}

test("valid bearer token verifies subject, email, and scopes", async () => {
  const { authenticator, signToken } = await makeAuthFixture();
  const result = await authenticator.verifyAuthorizationHeader(`Bearer ${await signToken()}`);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.auth.subject, "oidc|user-a");
    assert.equal(result.auth.email, "owner@atlas.test");
    assert.ok(result.auth.scopes.includes(HOSTED_CLAWD_WRITE_SCOPE));
  }
});

test("missing bearer token is denied", async () => {
  const { authenticator } = await makeAuthFixture();
  const result = await authenticator.verifyAuthorizationHeader(undefined);
  assert.deepEqual({ ok: result.ok, reason: result.ok ? "" : result.reason }, { ok: false, reason: "missing_token" });
});

test("garbage bearer token is denied as invalid", async () => {
  const { authenticator } = await makeAuthFixture();
  const result = await authenticator.verifyAuthorizationHeader("Bearer not-a-jwt");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "invalid_token");
});

test("wrong audience is denied", async () => {
  const { authenticator, signToken } = await makeAuthFixture();
  const token = await signToken({ audience: "https://someone-else.test" });
  const result = await authenticator.verifyAuthorizationHeader(`Bearer ${token}`);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "wrong_audience");
});

test("expired token is denied", async () => {
  const { authenticator, signToken } = await makeAuthFixture();
  const token = await signToken({ expiresInSeconds: -120 });
  const result = await authenticator.verifyAuthorizationHeader(`Bearer ${token}`);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "expired_token");
});

test("free Alpha stays session-only when persistence is off", async () => {
  const service = new HostedClawdService({
    flags: { persistenceEnabled: false, moneyEnabled: false, publicClaimEnabled: false },
  });
  const context = service.getContext({});
  assert.equal(context.screenState, "waitlist");
  assert.equal(context.sessionBoundary, "Session-only until Hosted Clawd is live.");
  const response = await service.createOrAttachClawd({ businessName: "Test Gym" });
  assert.equal(response.status, "waitlist");
  assert.equal(response.reason, "persistence_not_enabled");
});

test("unauthenticated write is denied with an auth challenge reason", async () => {
  const { service } = makePersistedService();
  const response = await service.createOrAttachClawd({ businessName: "Test Gym" });
  assert.equal(response.status, "blocked");
  assert.equal(response.reason, "auth_required");
});

test("token without the write scope is denied", async () => {
  const { service } = makePersistedService();
  const response = await service.createOrAttachClawd(
    { businessName: "Test Gym" },
    { subject: "oidc|user-a", scopes: [HOSTED_CLAWD_READ_SCOPE] },
  );
  assert.equal(response.status, "blocked");
  assert.equal(response.reason, "write_scope_required");
});

test("create-or-attach is idempotent for the same client request id", async () => {
  const { service } = makePersistedService();
  const auth = writeAuth("oidc|user-a");
  const first = await service.createOrAttachClawd({ businessName: "Test Gym", clientRequestId: "req-1" }, auth);
  const second = await service.createOrAttachClawd({ businessName: "Test Gym", clientRequestId: "req-1" }, auth);
  assert.equal(first.status, "accepted");
  assert.equal(second.status, "accepted");
  assert.equal(first.saved?.[0]?.id, second.saved?.[0]?.id);
  assert.equal(second.saved?.[0]?.reused, true);
});

test("create-or-attach attaches the existing owned Clawd on repeat calls", async () => {
  const { service } = makePersistedService();
  const auth = writeAuth("oidc|user-a");
  const first = await service.createOrAttachClawd({ businessName: "Test Gym", clientRequestId: "req-1" }, auth);
  const second = await service.createOrAttachClawd({ businessName: "Test Gym", clientRequestId: "req-2" }, auth);
  assert.equal(first.saved?.[0]?.id, second.saved?.[0]?.id);
});

test("saving the same Scout Drop request twice returns one row", async () => {
  const { service, repository } = makePersistedService();
  const auth = writeAuth("oidc|user-a");
  const input = {
    businessName: "Test Gym",
    countySlug: "riverside-ca",
    scoutPreviewId: "scout-preview-1",
  };
  const first = await service.promoteSession({ ...input, clientRequestId: "promote-1" }, auth);
  const second = await service.promoteSession({ ...input, clientRequestId: "promote-2" }, auth);
  assert.equal(first.status, "accepted");
  assert.equal(second.status, "accepted");
  const firstDrop = first.saved?.find((record) => record.kind === "scout_drop");
  const secondDrop = second.saved?.find((record) => record.kind === "scout_drop");
  assert.ok(firstDrop);
  assert.equal(firstDrop?.id, secondDrop?.id);
  assert.equal(secondDrop?.reused, true);
  const user = await repository.upsertUserByOidcSubject("oidc|user-a");
  const persisted = await repository.findScoutDropByPreviewId(user.id, "scout-preview-1");
  assert.equal(persisted?.countySlug, "riverside-ca");
  assert.ok(persisted?.sourceNote);
});

test("saving the same campaign preview twice returns one owned row", async () => {
  const { service, repository } = makePersistedService();
  const auth = writeAuth("oidc|user-a");
  await service.promoteSession(
    { businessName: "Test Gym", countySlug: "riverside-ca", scoutPreviewId: "scout-preview-1" },
    auth,
  );
  const input = {
    campaignPreviewId: "campaign-preview-1",
    scoutPreviewId: "scout-preview-1",
    campaignSummary: "7-day local campaign draft",
  };
  const first = await service.saveCampaignArtifact({ ...input, clientRequestId: "camp-1" }, auth);
  const second = await service.saveCampaignArtifact({ ...input, clientRequestId: "camp-2" }, auth);
  assert.equal(first.status, "accepted");
  assert.equal(first.saved?.[0]?.id, second.saved?.[0]?.id);
  assert.equal(second.saved?.[0]?.reused, true);

  const user = await repository.upsertUserByOidcSubject("oidc|user-a");
  const clawd = await repository.findClawdForOwner(user.id);
  assert.ok(clawd);
  const profile = await repository.findBusinessProfile(user.id, clawd!.id);
  const drop = await repository.findScoutDropByPreviewId(user.id, "scout-preview-1");
  assert.ok(profile);
  assert.ok(drop);
});

test("campaign save requires an owned business profile first", async () => {
  const { service } = makePersistedService();
  const auth = writeAuth("oidc|user-a");
  await assert.rejects(
    service.saveCampaignArtifact({ campaignPreviewId: "campaign-preview-1" }, auth),
    /Create or attach a Hosted Clawd/,
  );
});

test("user A cannot read or write user B's rows", async () => {
  const { service, repository } = makePersistedService();
  const authA = writeAuth("oidc|user-a");
  const authB = writeAuth("oidc|user-b");
  const created = await service.createOrAttachClawd({ businessName: "A's Gym" }, authA);
  const clawdAId = created.saved?.[0]?.id as string;
  await service.promoteSession({ businessName: "A's Gym", countySlug: "riverside-ca" }, authA);

  const userA = await repository.upsertUserByOidcSubject("oidc|user-a");
  const userB = await repository.upsertUserByOidcSubject("oidc|user-b");
  assert.equal(await repository.getOwnedClawd(userB.id, clawdAId), null);
  assert.ok(await repository.getOwnedClawd(userA.id, clawdAId));

  await service.promoteSession({ businessName: "B's Bakery", countySlug: "riverside-ca" }, authB);
  const clawdA = await repository.findClawdForOwner(userA.id);
  const profileA = await repository.findBusinessProfile(userA.id, clawdA!.id);
  assert.equal(profileA?.businessName, "A's Gym");
  const clawdB = await repository.findClawdForOwner(userB.id);
  assert.notEqual(clawdB?.id, clawdA?.id);
});

test("session Clawd ids never resolve as persisted Clawds", async () => {
  const { repository } = makePersistedService();
  const user = await repository.upsertUserByOidcSubject("oidc|user-a");
  assert.equal(isSessionOnlyId("session-clawd-1"), true);
  assert.equal(isSessionOnlyId("preview_abc"), true);
  assert.equal(await repository.getOwnedClawd(user.id, "session-clawd-1"), null);
});
