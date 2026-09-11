#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DOCUMENT_POLICY_VERSION,
  classifyKnowledgeSource,
  isKnowledgeSource,
  normalizePath,
} from "./lib/atlas-document-policy.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = resolve(ROOT, "docs/brain/document-registry.jsonl");
const blockers = [];

if (!existsSync(REGISTRY_PATH)) {
  blockers.push("Missing docs/brain/document-registry.jsonl. Run pnpm brain:build.");
}

const entries = existsSync(REGISTRY_PATH)
  ? readFileSync(REGISTRY_PATH, "utf8").trim().split("\n").filter(Boolean).map(parseEntry)
  : [];
const entryPaths = entries.map((entry) => entry.path);
const visiblePaths = gitFiles().filter(isKnowledgeSource).sort();

compareSets(visiblePaths, entryPaths);

for (const entry of entries) {
  const expected = classifyKnowledgeSource(entry.path);
  if (entry.policyVersion !== DOCUMENT_POLICY_VERSION) {
    blockers.push(`${entry.path}: policy version ${entry.policyVersion} is stale; expected ${DOCUMENT_POLICY_VERSION}.`);
  }
  for (const field of ["lane", "authority", "readBeforeWork", "reason"]) {
    if (entry[field] !== expected[field]) {
      blockers.push(`${entry.path}: ${field} drifted. Run pnpm brain:build.`);
    }
  }
  if (!entry.generated && existsSync(resolve(ROOT, entry.path))) {
    const absolute = resolve(ROOT, entry.path);
    const actualBytes = statSync(absolute).size;
    const actualHash = createHash("sha256").update(readFileSync(absolute)).digest("hex");
    if (entry.bytes !== actualBytes || entry.sha256 !== actualHash) {
      blockers.push(`${entry.path}: content drifted. Run pnpm brain:build.`);
    }
  }
}

const canonical = entries.filter((entry) => entry.authority === "canonical").map((entry) => entry.path);
for (const required of ["AGENTS.md", "docs/STATUS.md", "docs/brain/README.md", "scripts/lib/atlas-tool-surface.mjs", "package.json"]) {
  if (!canonical.includes(required)) blockers.push(`Canonical source missing from registry: ${required}.`);
}

const unclassified = entries.filter((entry) => entry.authority === "review-required");
const result = {
  ok: blockers.length === 0,
  gate: "atlas-document-registry",
  policyVersion: DOCUMENT_POLICY_VERSION,
  documentCount: entries.length,
  canonicalCount: canonical.length,
  reviewRequiredCount: unclassified.length,
  blockers,
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;

function parseEntry(line, index) {
  try {
    return JSON.parse(line);
  } catch (error) {
    blockers.push(`Invalid JSONL at line ${index + 1}: ${error.message}`);
    return { path: `invalid-line-${index + 1}` };
  }
}

function gitFiles() {
  const output = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return output.split("\0").map(normalizePath).filter(Boolean);
}

function compareSets(expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = expected.filter((path) => !actualSet.has(path));
  const extra = actual.filter((path) => !expectedSet.has(path));
  if (missing.length) blockers.push(`Registry missing ${missing.length} source(s): ${missing.slice(0, 10).join(", ")}.`);
  if (extra.length) blockers.push(`Registry contains ${extra.length} removed source(s): ${extra.slice(0, 10).join(", ")}.`);
  if (actual.length !== actualSet.size) blockers.push("Registry contains duplicate paths.");
}
