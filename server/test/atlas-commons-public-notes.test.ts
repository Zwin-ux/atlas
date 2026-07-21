import assert from "node:assert/strict";
import test from "node:test";
import {
  ATLAS_COMMONS_READ_SCOPE,
  ATLAS_COMMONS_WRITE_SCOPE,
  AtlasCommonsError,
  AtlasCommonsService,
  createInMemoryAtlasCommonsRepository,
  type AtlasCommonsAuthContext,
} from "../src/atlasCommons/index.js";
import {
  buildOAuthProtectedResourceMetadata,
  HOSTED_CLAWD_READ_SCOPE,
  HOSTED_CLAWD_WRITE_SCOPE,
} from "../src/hostedClawd/auth.js";

const owner: AtlasCommonsAuthContext = {
  subject: "oidc|owner",
  email: "owner@example.test",
  scopes: [ATLAS_COMMONS_READ_SCOPE, ATLAS_COMMONS_WRITE_SCOPE],
};

const reader: AtlasCommonsAuthContext = {
  subject: "oidc|reader",
  scopes: [ATLAS_COMMONS_READ_SCOPE, ATLAS_COMMONS_WRITE_SCOPE],
};

function fixture(options: { reportThreshold?: number; writeLimitPerHour?: number } = {}) {
  let nowMs = Date.parse("2026-07-20T12:00:00.000Z");
  const now = () => new Date(nowMs);
  const repository = createInMemoryAtlasCommonsRepository(now);
  const service = new AtlasCommonsService({
    config: {
      enabled: true,
      pseudonymSecret: "unit-test-pseudonym-secret",
      operatorToken: "unit-test-operator-token",
      reportThreshold: options.reportThreshold ?? 2,
      writeLimitPerHour: options.writeLimitPerHour ?? 100,
    },
    repository,
    authConfigured: true,
    resolveAnchor: (countySlug, placeId) =>
      countySlug === "riverside-ca" && placeId === "eastvale"
        ? { countySlug, placeId, placeLabel: "Eastvale" }
        : undefined,
    now,
  });
  return {
    repository,
    service,
    advance(ms: number) {
      nowMs += ms;
    },
  };
}

async function createPending(service: AtlasCommonsService, auth = owner, requestId = "post-1") {
  return service.post(
    {
      countySlug: "riverside-ca",
      placeId: "eastvale",
      placeLabel: "client label is ignored",
      body: "Coffee carts are busiest before nine.",
      clientRequestId: requestId,
    },
    auth,
  );
}

test("anonymous public reads expose only approved public-safe fields", async () => {
  const { service } = fixture();
  const created = await createPending(service);
  assert.equal((await service.list({ countySlug: "riverside-ca" })).notes.length, 0);

  await service.moderate(created.note.id, "approve", "test-operator");
  const result = await service.list({ countySlug: "riverside-ca" });
  assert.equal(result.notes.length, 1);
  assert.equal(result.notes[0]?.placeLabel, "Eastvale");
  assert.match(result.notes[0]?.authorHandle ?? "", /^Atlas-[A-F0-9]{16}$/);
  assert.equal(result.notes[0]?.status, undefined);
  assert.equal("ownerUserId" in (result.notes[0] as object), false);
  assert.equal("email" in (result.notes[0] as object), false);
});

test("posting requires write scope and returns an author-visible pending note", async () => {
  const { service } = fixture();
  await assert.rejects(() => service.post({
    countySlug: "riverside-ca",
    placeId: "eastvale",
    placeLabel: "Eastvale",
    body: "Anonymous writes stay closed.",
    clientRequestId: "anonymous",
  }), (error: unknown) => {
    assert.equal((error as AtlasCommonsError).code, "AUTH_REQUIRED");
    return true;
  });
  await assert.rejects(
    () => createPending(service, { subject: "oidc|readonly", scopes: [ATLAS_COMMONS_READ_SCOPE] }),
    (error: unknown) => {
      assert.equal((error as AtlasCommonsError).code, "FORBIDDEN");
      return true;
    },
  );

  const result = await createPending(service);
  assert.equal(result.note.status, "pending");
  assert.match(result.message, /visible only to you/i);
});

test("idempotent retries return the original note without duplicating it", async () => {
  const { service } = fixture();
  const first = await createPending(service, owner, "same-request");
  const second = await createPending(service, owner, "same-request");
  assert.equal(second.status, "unchanged");
  assert.equal(second.note.id, first.note.id);
  const mine = await service.list({ mode: "mine" }, owner);
  assert.equal(mine.notes.length, 1);
});

test("pending notes are isolated by owner", async () => {
  const { service } = fixture();
  await createPending(service);
  assert.equal((await service.list({ mode: "mine" }, owner)).notes.length, 1);
  assert.equal((await service.list({ mode: "mine" }, reader)).notes.length, 0);
  assert.equal((await service.list({ mode: "all" }, reader)).notes.length, 0);
});

test("body and canonical anchor validation happen before persistence", async () => {
  const { service } = fixture();
  await assert.rejects(
    () => service.post({ countySlug: "riverside-ca", placeId: "eastvale", placeLabel: "Eastvale", body: "Visit https://spam.test", clientRequestId: "link" }, owner),
    (error: unknown) => {
      assert.equal((error as AtlasCommonsError).code, "LINKS_NOT_ALLOWED");
      return true;
    },
  );
  await assert.rejects(
    () => service.post({ countySlug: "riverside-ca", placeId: "invented", placeLabel: "Invented", body: "No such map anchor", clientRequestId: "bad-anchor" }, owner),
    (error: unknown) => {
      assert.equal((error as AtlasCommonsError).code, "UNKNOWN_ANCHOR");
      return true;
    },
  );
  assert.equal((await service.list({ mode: "mine" }, owner)).notes.length, 0);
});

test("body boundaries preserve plain text and reject oversized or injection-shaped anchors", async () => {
  const { service } = fixture();
  const exactBoundary = "x".repeat(240);
  const created = await service.post({
    countySlug: "riverside-ca",
    placeId: "eastvale",
    placeLabel: "Eastvale",
    body: exactBoundary,
    clientRequestId: "boundary-240",
  }, owner);
  assert.equal(created.note.body, exactBoundary);

  const markup = await service.post({
    countySlug: "riverside-ca",
    placeId: "eastvale",
    placeLabel: "Eastvale",
    body: "<img src=x onerror=alert(1)> stays text, never HTML.",
    clientRequestId: "plain-markup",
  }, owner);
  assert.match(markup.note.body, /^<img/);

  await assert.rejects(
    () => service.post({ countySlug: "riverside-ca", placeId: "eastvale", placeLabel: "Eastvale", body: "x".repeat(241), clientRequestId: "boundary-241" }, owner),
    (error: unknown) => {
      assert.equal((error as AtlasCommonsError).code, "INVALID_NOTE");
      return true;
    },
  );
  await assert.rejects(
    () => service.post({ countySlug: "riverside-ca", placeId: "eastvale' OR 1=1--", placeLabel: "Eastvale", body: "No query-shaped anchors", clientRequestId: "bad-id" }, owner),
    (error: unknown) => {
      assert.equal((error as AtlasCommonsError).code, "INVALID_NOTE");
      return true;
    },
  );
});

test("pseudonyms remain stable for one identity and differ across identities", async () => {
  const { service } = fixture();
  const first = await createPending(service, owner, "handle-owner-1");
  const second = await createPending(service, owner, "handle-owner-2");
  const other = await createPending(service, reader, "handle-reader-1");
  assert.equal(first.note.authorHandle, second.note.authorHandle);
  assert.notEqual(first.note.authorHandle, other.note.authorHandle);
});

test("opaque cursors page without overlap and reject tampering", async () => {
  const { service, advance } = fixture();
  const first = await createPending(service, owner, "page-1");
  await service.moderate(first.note.id, "approve", "test-operator");
  advance(1_000);
  const second = await createPending(service, owner, "page-2");
  await service.moderate(second.note.id, "approve", "test-operator");

  const pageOne = await service.list({ countySlug: "riverside-ca", sort: "new", limit: 1 });
  assert.equal(pageOne.notes.length, 1);
  assert.ok(pageOne.nextCursor);
  const pageTwo = await service.list({ countySlug: "riverside-ca", sort: "new", limit: 1, cursor: pageOne.nextCursor });
  assert.equal(pageTwo.notes.length, 1);
  assert.notEqual(pageOne.notes[0]?.id, pageTwo.notes[0]?.id);

  await assert.rejects(
    () => service.list({ countySlug: "riverside-ca", sort: "new", cursor: `${pageOne.nextCursor}tampered` }),
    (error: unknown) => {
      assert.equal((error as AtlasCommonsError).code, "INVALID_NOTE");
      return true;
    },
  );
  await assert.rejects(
    () => service.list({ countySlug: "orange-ca", sort: "new", cursor: pageOne.nextCursor }),
    (error: unknown) => {
      assert.equal((error as AtlasCommonsError).code, "INVALID_NOTE");
      return true;
    },
  );
});

test("mine pagination stays on creation order after an older note is approved late", async () => {
  const { service, advance } = fixture();
  const older = await createPending(service, owner, "mine-page-older");
  advance(1_000);
  const newer = await createPending(service, owner, "mine-page-newer");
  advance(1_000);
  await service.moderate(older.note.id, "approve", "test-operator");

  const pageOne = await service.list({ mode: "mine", limit: 1 }, owner);
  assert.equal(pageOne.notes[0]?.id, newer.note.id);
  assert.ok(pageOne.nextCursor);
  const pageTwo = await service.list({ mode: "mine", limit: 1, cursor: pageOne.nextCursor }, owner);
  assert.equal(pageTwo.notes[0]?.id, older.note.id);
});

test("hot pagination pins one as-of instant across repository latency and cursor encoding", async () => {
  const { service, repository, advance } = fixture();
  const first = await createPending(service, owner, "hot-asof-first");
  await service.moderate(first.note.id, "approve", "test-operator");
  advance(1_000);
  const second = await createPending(service, reader, "hot-asof-second");
  await service.moderate(second.note.id, "approve", "test-operator");

  const originalList = repository.listNotes.bind(repository);
  let repositoryAsOf = "";
  repository.listNotes = async (input) => {
    repositoryAsOf = input.asOf;
    const rows = await originalList(input);
    advance(60_000);
    return rows;
  };

  const page = await service.list({ sort: "hot", limit: 1 });
  assert.ok(page.nextCursor);
  const payload = JSON.parse(Buffer.from(page.nextCursor.split(".")[0]!, "base64url").toString("utf8")) as { asOf: string };
  assert.equal(payload.asOf, repositoryAsOf);
});

test("reactions are unique and deterministic hot reads stay public-safe", async () => {
  const { service } = fixture();
  const created = await createPending(service);
  await service.moderate(created.note.id, "approve", "test-operator");

  const first = await service.react(created.note.id, true, reader);
  const duplicate = await service.react(created.note.id, true, reader);
  assert.equal(first.status, "accepted");
  assert.equal(duplicate.status, "unchanged");
  assert.equal(duplicate.note.reactionCount, 1);
  assert.equal(duplicate.note.viewerHasReacted, true);

  const removed = await service.react(created.note.id, false, reader);
  assert.equal(removed.note.reactionCount, 0);
  assert.equal(removed.note.viewerHasReacted, false);
});

test("unique reports auto-hide at threshold and authors cannot report themselves", async () => {
  const { service } = fixture({ reportThreshold: 2 });
  const created = await createPending(service);
  await service.moderate(created.note.id, "approve", "test-operator");

  await assert.rejects(() => service.report(created.note.id, "spam", owner), (error: unknown) => {
    assert.equal((error as AtlasCommonsError).code, "NOTE_NOT_FOUND");
    return true;
  });

  const reportOne = await service.report(created.note.id, "misleading", reader);
  assert.match(reportOne.message, /received/i);
  const third: AtlasCommonsAuthContext = { subject: "oidc|third", scopes: [ATLAS_COMMONS_WRITE_SCOPE] };
  const reportTwo = await service.report(created.note.id, "privacy", third);
  assert.match(reportTwo.message, /hidden/i);
  assert.equal(reportTwo.note.status, "removed");
  assert.equal((await service.list({ mode: "all" })).notes.length, 0);
});

test("moderation transitions preserve the explicit state machine", async () => {
  const { service } = fixture();
  const created = await createPending(service);
  const approved = await service.moderate(created.note.id, "approve", "test-operator");
  assert.deepEqual({ previous: approved.previousStatus, next: approved.status }, { previous: "pending", next: "visible" });
  const removed = await service.moderate(created.note.id, "remove", "test-operator");
  assert.deepEqual({ previous: removed.previousStatus, next: removed.status }, { previous: "visible", next: "removed" });
  await assert.rejects(() => service.moderate(created.note.id, "approve", "test-operator"), (error: unknown) => {
    assert.equal((error as AtlasCommonsError).code, "INVALID_TRANSITION");
    return true;
  });
});

test("operator moderation queues are bounded, ordered, and exclude identity fields", async () => {
  const { service, advance } = fixture();
  const first = await createPending(service, owner, "queue-1");
  advance(1_000);
  const second = await createPending(service, reader, "queue-2");

  const pending = await service.listModerationQueue("pending", 1);
  assert.equal(pending.notes.length, 1);
  assert.equal(pending.notes[0]?.id, first.note.id);
  assert.equal("ownerUserId" in (pending.notes[0] as object), false);
  assert.equal("oidcSubject" in (pending.notes[0] as object), false);
  assert.equal("email" in (pending.notes[0] as object), false);
  assert.equal("clientRequestId" in (pending.notes[0] as object), false);

  await service.moderate(second.note.id, "remove", "test-operator");
  const removed = await service.listModerationQueue("removed", 10);
  assert.equal(removed.notes[0]?.id, second.note.id);
  assert.equal(removed.notes[0]?.status, "removed");
});

test("write actions are rate limited per verified identity", async () => {
  const { service } = fixture({ writeLimitPerHour: 1 });
  await createPending(service, owner, "rate-1");
  await assert.rejects(() => createPending(service, owner, "rate-2"), (error: unknown) => {
    assert.equal((error as AtlasCommonsError).code, "RATE_LIMITED");
    return true;
  });
});

test("idempotent post retries return the original even after the hourly quota is full", async () => {
  const { service } = fixture({ writeLimitPerHour: 1 });
  const first = await createPending(service, owner, "quota-retry");
  const retry = await service.post({
    countySlug: "riverside-ca",
    placeId: "eastvale",
    placeLabel: "ignored",
    body: "A changed retry body cannot overwrite the accepted post.",
    clientRequestId: "quota-retry",
  }, owner);
  assert.equal(retry.status, "unchanged");
  assert.equal(retry.note.id, first.note.id);
  assert.equal(retry.note.body, first.note.body);
});

test("disabled and misconfigured services fail narrowly while reporting safe metadata", async () => {
  const disabled = new AtlasCommonsService({
    config: { enabled: false, reportThreshold: 3, writeLimitPerHour: 30 },
    resolveAnchor: () => undefined,
  });
  assert.equal(disabled.publicMeta().enabled, false);
  await assert.rejects(() => disabled.list({}), (error: unknown) => {
    assert.equal((error as AtlasCommonsError).code, "COMMONS_DISABLED");
    return true;
  });

  const unavailable = new AtlasCommonsService({
    config: { enabled: true, reportThreshold: 3, writeLimitPerHour: 30 },
    resolveAnchor: () => undefined,
  });
  assert.equal(unavailable.publicMeta().available, false);
  await assert.rejects(() => unavailable.list({}), (error: unknown) => {
    assert.equal((error as AtlasCommonsError).code, "COMMONS_UNAVAILABLE");
    return true;
  });
});

test("Commons-only OAuth metadata advertises no Hosted Clawd scopes", () => {
  const metadata = buildOAuthProtectedResourceMetadata(
    { issuer: "https://identity.example.test/", audience: "https://atlas.example.test/mcp", jwksUrl: "https://identity.example.test/jwks.json" },
    "https://atlas.example.test/mcp",
    [ATLAS_COMMONS_READ_SCOPE, ATLAS_COMMONS_WRITE_SCOPE],
    false,
  );
  assert.deepEqual(metadata.scopes_supported, [ATLAS_COMMONS_READ_SCOPE, ATLAS_COMMONS_WRITE_SCOPE]);
  assert.equal((metadata.scopes_supported as string[]).includes(HOSTED_CLAWD_READ_SCOPE), false);
  assert.equal((metadata.scopes_supported as string[]).includes(HOSTED_CLAWD_WRITE_SCOPE), false);
});

test("bounded 100-note reads stay within the response and warm-latency budgets", async () => {
  const { service, advance } = fixture({ writeLimitPerHour: 100 });
  for (let index = 0; index < 100; index += 1) {
    const created = await service.post({
      countySlug: "riverside-ca",
      placeId: "eastvale",
      body: `Public map note ${String(index + 1).padStart(3, "0")}.`,
      clientRequestId: `payload-${index}`,
    }, owner);
    await service.moderate(created.note.id, "approve", "test-operator");
    advance(1_000);
  }

  const startedAt = performance.now();
  const result = await service.list({ countySlug: "riverside-ca", sort: "hot", limit: 100 });
  const elapsedMs = performance.now() - startedAt;
  assert.equal(result.notes.length, 100);
  assert.ok(Buffer.byteLength(JSON.stringify(result), "utf8") < 64 * 1024);
  assert.ok(elapsedMs < 350, `Expected a warm bounded read below 350ms; got ${elapsedMs.toFixed(2)}ms.`);
});
