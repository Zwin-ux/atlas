#!/usr/bin/env node
import pg from "pg";
import { runHostedClawdMigrations } from "../server/dist/hostedClawd/migrations.js";

const databaseUrl = (
  process.env.DATABASE_PUBLIC_URL ||
  process.env.DATABASE_URL ||
  ""
).trim();

if (!databaseUrl) {
  console.log(
    JSON.stringify({
      ok: true,
      ran: false,
      reason: "DATABASE_URL or DATABASE_PUBLIC_URL is not configured.",
    }),
  );
  process.exit(0);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  const result = await runHostedClawdMigrations(client);
  console.log(JSON.stringify({ ok: true, ran: true, ...result }));
} finally {
  await client.end();
}
