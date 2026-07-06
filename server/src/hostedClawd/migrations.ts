import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Committed SQL migrations plus a small Node runner (0.59H decision).
// The runner expects a single-connection client so each migration can apply
// inside one transaction.

export type HostedClawdMigrationClient = {
  query(sql: string, params?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>;
};

export type HostedClawdMigrationResult = {
  applied: string[];
  skipped: string[];
};

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));

export const HOSTED_CLAWD_MIGRATIONS_DIR = resolve(MODULE_DIR, "../../..", "migrations", "hosted-clawd");

export function listHostedClawdMigrations(migrationsDir: string = HOSTED_CLAWD_MIGRATIONS_DIR): string[] {
  return readdirSync(migrationsDir)
    .filter((entry) => entry.endsWith(".sql"))
    .sort();
}

export async function runHostedClawdMigrations(
  client: HostedClawdMigrationClient,
  migrationsDir: string = HOSTED_CLAWD_MIGRATIONS_DIR,
): Promise<HostedClawdMigrationResult> {
  await client.query(
    `CREATE TABLE IF NOT EXISTS hosted_clawd_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
  );

  const appliedRows = await client.query("SELECT id FROM hosted_clawd_migrations");
  const alreadyApplied = new Set(appliedRows.rows.map((row) => String(row.id)));

  const result: HostedClawdMigrationResult = { applied: [], skipped: [] };

  for (const file of listHostedClawdMigrations(migrationsDir)) {
    if (alreadyApplied.has(file)) {
      result.skipped.push(file);
      continue;
    }

    const sql = readFileSync(join(migrationsDir, file), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO hosted_clawd_migrations (id) VALUES ($1)", [file]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Hosted Clawd migration ${file} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    result.applied.push(file);
  }

  return result;
}

const isDirectRun = Boolean(
  process.argv[1] && /migrations\.(ts|js|mjs|cjs)$/.test(process.argv[1].replaceAll("\\", "/")),
);

if (isDirectRun) {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.log(JSON.stringify({ ok: true, ran: false, reason: "DATABASE_URL is not configured." }));
  } else {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      const result = await runHostedClawdMigrations(client);
      console.log(JSON.stringify({ ok: true, ran: true, ...result }));
    } finally {
      await client.end();
    }
  }
}
