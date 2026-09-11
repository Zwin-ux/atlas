#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = resolve(ROOT, "docs/brain/document-registry.jsonl");
const query = process.argv.slice(2).filter((argument) => argument !== "--").join(" ").trim();

if (!query) {
  console.error('Usage: pnpm brain:query -- "location truth"');
  process.exit(2);
}
if (!existsSync(REGISTRY_PATH)) {
  console.error("Missing document registry. Run pnpm brain:build first.");
  process.exit(1);
}

const terms = tokenize(query);
const entries = readFileSync(REGISTRY_PATH, "utf8")
  .trim()
  .split("\n")
  .filter(Boolean)
  .map(JSON.parse)
  .map((entry) => ({ ...entry, score: score(entry, terms) }))
  .filter((entry) => entry.score > 0)
  .sort((a, b) => b.score - a.score || authorityRank(b.authority) - authorityRank(a.authority) || a.path.localeCompare(b.path))
  .slice(0, 12);

if (!entries.length) {
  console.log(`No document matches for: ${query}`);
  process.exit(0);
}

for (const entry of entries) {
  console.log(`[${entry.authority}] ${entry.path}`);
  console.log(`  ${entry.title} | ${entry.lane} | score ${entry.score}`);
  console.log(`  ${entry.reason}`);
  if (entry.canonicalReplacements?.length) {
    console.log(`  Current route: ${entry.canonicalReplacements.join(", ")}`);
  }
}

function score(entry, terms) {
  const path = tokenize(entry.path);
  const title = tokenize(entry.title ?? "");
  const headings = tokenize((entry.headings ?? []).join(" "));
  const context = tokenize(`${entry.lane} ${entry.reason}`);
  let total = 0;
  let matched = false;
  for (const term of terms) {
    if (path.includes(term)) { total += 10; matched = true; }
    if (title.includes(term)) { total += 8; matched = true; }
    if (headings.includes(term)) { total += 4; matched = true; }
    if (context.includes(term)) { total += 2; matched = true; }
  }
  if (!matched) return 0;
  return total + authorityRank(entry.authority) + (entry.readBeforeWork ? 10 : 0);
}

function tokenize(value) {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 1);
}

function authorityRank(authority) {
  return {
    canonical: 50,
    "active-reference": 40,
    generated: 30,
    "review-required": 15,
    historical: 0,
  }[authority] ?? 0;
}
