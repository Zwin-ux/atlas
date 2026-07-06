// Optional Postgres smoke for the 0.60H persistence foundation.
// Requires DATABASE_URL; exits cleanly with a skip report when it is absent.
// Runs migrations, exercises one owner-scoped roundtrip, then removes the
// smoke user (cascade cleans owned rows).
import { randomUUID } from "node:crypto";
import { runHostedClawdMigrations } from "../src/hostedClawd/migrations.js";
import { createPostgresHostedClawdRepository } from "../src/hostedClawd/postgres.js";
import { createHostedClawdRepositoryPersistence } from "../src/hostedClawd/repository.js";
import { HOSTED_CLAWD_READ_SCOPE, HOSTED_CLAWD_WRITE_SCOPE } from "../src/hostedClawd/auth.js";

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.log(JSON.stringify({ ok: true, ran: false, reason: "DATABASE_URL is not configured; smoke skipped." }));
} else {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  const failures: string[] = [];
  const smokeSubject = `smoke|${randomUUID()}`;
  try {
    const migrationResult = await runHostedClawdMigrations(client);
    const repository = createPostgresHostedClawdRepository(client);
    const persistence = createHostedClawdRepositoryPersistence(repository);
    const auth = {
      subject: smokeSubject,
      email: "smoke@atlas.test",
      scopes: [HOSTED_CLAWD_READ_SCOPE, HOSTED_CLAWD_WRITE_SCOPE],
    };

    const first = await persistence.createOrAttachClawd(auth, {
      businessName: "Smoke Gym",
      clientRequestId: "smoke-req-1",
    });
    const second = await persistence.createOrAttachClawd(auth, {
      businessName: "Smoke Gym",
      clientRequestId: "smoke-req-1",
    });
    if (first.records[0]?.id !== second.records[0]?.id) {
      failures.push("create-or-attach was not idempotent for the same client_request_id.");
    }

    const promoted = await persistence.promoteSession(auth, {
      businessName: "Smoke Gym",
      countySlug: "riverside-ca",
      scoutPreviewId: "smoke-scout-1",
      clientRequestId: "smoke-promote-1",
    });
    if (!promoted.records.some((record) => record.kind === "business_profile")) {
      failures.push("promoteSession did not save a business profile row.");
    }

    const campaign = await persistence.saveCampaignArtifact(auth, {
      campaignPreviewId: "smoke-campaign-1",
      scoutPreviewId: "smoke-scout-1",
      campaignSummary: "Smoke campaign draft",
      clientRequestId: "smoke-campaign-req-1",
    });
    const campaignAgain = await persistence.saveCampaignArtifact(auth, {
      campaignPreviewId: "smoke-campaign-1",
      clientRequestId: "smoke-campaign-req-2",
    });
    if (campaign.records[0]?.id !== campaignAgain.records[0]?.id) {
      failures.push("Repeated campaign preview save created a second row.");
    }

    console.log(
      JSON.stringify({
        ok: failures.length === 0,
        ran: true,
        migrations: migrationResult,
        failures,
      }),
    );
    if (failures.length > 0) process.exitCode = 1;
  } finally {
    try {
      await client.query("DELETE FROM users WHERE oidc_subject = $1", [smokeSubject]);
    } catch {
      // Cleanup is best-effort; the smoke user is uniquely named.
    }
    await client.end();
  }
}
