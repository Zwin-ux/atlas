#!/usr/bin/env node
// Source-of-truth drift detector.
//
// This script used to validate the repo against artifacts/current-update.json,
// a retired 0.81d Commons packet. Its blockers read "Missing Commons read
// tool" and "Missing Commons write tool", which told any agent trying to make
// the verifiers green to re-add the two note tools the 2026-07-25 pivot
// deliberately deleted. In an agent-driven repo that made it the most
// dangerous file present: a check that undoes the product when satisfied.
//
// It now points at scripts/lib/atlas-tool-surface.mjs, the executable source
// of truth for the public MCP tool surface. Drift *toward* a retired tool
// fails. Drift away from one does not. Making this verifier green can only
// move the repo closer to what ships.
//
//   node scripts/verify-atlas-source-of-truth-drift.mjs [--json-only]

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

import {
  EXPECTED_TOOLS,
  FORBIDDEN_TOOL_PATTERNS,
  RETIRED_TOOLS,
} from "./lib/atlas-tool-surface.mjs";

const TOOLS_SOURCE = "server/src/atlasTools.ts";
const SERVER_ENTRY = "server/src/index.ts";
// The two documents that instruct agents. Everything else under docs/ predates
// the pivot and is history; scanning it would keep this verifier permanently
// red over facts nobody is being told to act on.
const INSTRUCTION_DOCS = ["AGENTS.md", "docs/STATUS.md"];

const jsonOnly = process.argv.slice(2).includes("--json-only");
const blockers = [];
const warnings = [];
const checkedFiles = [];

const expected = [...EXPECTED_TOOLS].sort();
const toolsSource = read(TOOLS_SOURCE, "Atlas tool implementations");
const serverEntry = read(SERVER_ENTRY, "server entrypoint");

checkDeclaredNames(toolsSource);
checkRegistrations(toolsSource);
checkDeadCode(serverEntry);
for (const path of INSTRUCTION_DOCS) checkInstructionDoc(path);

const result = {
  ok: blockers.length === 0,
  gate: "atlas-source-of-truth-drift",
  surfaceSource: "scripts/lib/atlas-tool-surface.mjs",
  expectedToolCount: expected.length,
  blockerCount: blockers.length,
  blockers,
  warnings,
  checkedFiles,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;

function read(path, label) {
  checkedFiles.push(path);
  const absolute = resolve(path);
  if (!existsSync(absolute)) {
    blockers.push(`Missing ${label}: ${path}.`);
    return "";
  }
  return readFileSync(absolute, "utf8");
}

/** Every string literal inside the first [...] of a named const array. */
function arrayLiteral(source, constName) {
  const match = new RegExp(`const\\s+${constName}\\s*=\\s*\\[([^\\]]*)\\]`).exec(source);
  if (!match) return null;
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/** The exported name list in atlasTools.ts must equal the surface library. */
function checkDeclaredNames(source) {
  if (!source) return;
  const declared = arrayLiteral(source, "ATLAS_TOOL_NAMES");
  if (!declared) {
    blockers.push(`Could not find ATLAS_TOOL_NAMES in ${TOOLS_SOURCE}.`);
    return;
  }
  compare(declared, `ATLAS_TOOL_NAMES in ${TOOLS_SOURCE}`);
}

/** What the server actually registers must equal the surface library. */
function checkRegistrations(source) {
  if (!source) return;
  const registered = [
    ...source.matchAll(/registerAppTool\(\s*[A-Za-z_$][\w$]*\s*,\s*"([^"]+)"/g),
  ].map((m) => m[1]);
  if (registered.length === 0) {
    blockers.push(`No registerAppTool calls found in ${TOOLS_SOURCE}.`);
    return;
  }
  compare(registered, `registered tools in ${TOOLS_SOURCE}`);
}

/** One comparison, used for both the declaration and the registrations. */
function compare(actualNames, label) {
  const actual = [...actualNames].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    const missing = expected.filter((name) => !actual.includes(name));
    const extra = actual.filter((name) => !expected.includes(name));
    blockers.push(
      `Tool surface drift in ${label}: expected ${expected.length}, got ${actual.length}.` +
        (missing.length ? ` Missing: ${missing.join(", ")}.` : "") +
        (extra.length ? ` Unexpected: ${extra.join(", ")}.` : ""),
    );
  }
  for (const name of actual) {
    if (RETIRED_TOOLS.includes(name)) {
      blockers.push(`Retired tool is back in ${label}: ${name}. It was deleted in the pivot and stays deleted.`);
    }
    const pattern = FORBIDDEN_TOOL_PATTERNS.find((candidate) => candidate.test(name));
    if (pattern) blockers.push(`Tool name in ${label} matches forbidden pattern ${pattern}: ${name}.`);
  }
}

/**
 * Retired names still sit in dead Zod enums and a rate-limit signature in the
 * server entrypoint. Nothing registers them, so this is a warning rather than
 * a blocker — but those strings are what misled agents in the first place, so
 * they stay counted until someone deletes them.
 */
function checkDeadCode(source) {
  if (!source) return;
  const found = RETIRED_TOOLS.filter((name) => source.includes(`"${name}"`));
  if (found.length) {
    warnings.push(
      `${SERVER_ENTRY} still contains ${found.length} retired tool name(s) in dead code: ${found.join(", ")}. ` +
        "Not registered, so the live surface is clean. Safe to delete.",
    );
  }
}

/**
 * The governing rule: no prose restates a machine-checkable fact. A tool name
 * written into an instruction document is how the pivot got undone the first
 * time — a retired name tells an agent to build the wrong thing, and a live
 * name is a copy that will rot the next time the surface moves.
 */
function checkInstructionDoc(path) {
  const text = read(path, `instruction document ${path}`);
  if (!text) return;
  for (const name of RETIRED_TOOLS) {
    if (text.includes(name)) {
      blockers.push(
        `${path} names a retired tool (${name}). Instruction docs link to the surface library; they never list tools.`,
      );
    }
  }
  for (const name of EXPECTED_TOOLS) {
    if (text.includes(name)) {
      blockers.push(`${path} restates a live tool name (${name}). Link scripts/lib/atlas-tool-surface.mjs instead.`);
    }
  }
}
