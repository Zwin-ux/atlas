#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";

const args = new Set(process.argv.slice(2));

for (const arg of args) {
  if (arg !== "--json-only") {
    throw new Error(`Unknown argument: ${arg}`);
  }
}

const protocolPath = "docs/AXIOM_BIG4_WAKEUP_PROTOCOL.md";
const expectedRcCwd = "C:\\Users\\mzwin\\Documents\\Atlas-alpha-path-b-rc";
const expectedRcCwdToml = expectedRcCwd.replaceAll("\\", "\\\\");
const automationRoot = "C:\\Users\\mzwin\\.codex\\automations";

const requiredProtocolPatterns = [
  ["Forge thread id", /019f1be1-9914-7aa2-94b1-c5e920dadec1/],
  ["Lumen thread id", /019f1a00-39c1-7330-a256-79564ba0cdb1/],
  ["Mira thread id", /019f1a01-72d8-7122-9087-c071313f4ee3/],
  ["Light automation id", /atlas-captain-light-reorg-wakeup/],
  ["Full automation id", /atlas-captain-full-power-mobilization/],
  ["RC worktree path", /C:\\Users\\mzwin\\Documents\\Atlas-alpha-path-b-rc/],
  ["No local role clones", /Do not create local Mira, Forge, or Lumen clones/],
  ["Small chunk thread reads", /Latest 1-2 turns from Forge, Lumen, and Mira/],
  ["Thread bridge fallback", /Thread Bridge Unavailable Fallback/],
  ["No invented worker reports", /must not invent Forge, Lumen, or Mira reports/],
  ["Railway read-only stance", /Read-only Railway checks are allowed/],
  ["GitHub no blind repo stance", /Do not create a repo, push, or open issues/],
];

const automationChecks = [
  {
    id: "atlas-captain-light-reorg-wakeup",
    expectedReasoning: /reasoning_effort = "medium"/,
    expectedInterval: /rrule = "FREQ=HOURLY;INTERVAL=3"/,
  },
  {
    id: "atlas-captain-full-power-mobilization",
    expectedReasoning: /reasoning_effort = "xhigh"/,
    expectedInterval: /rrule = "FREQ=HOURLY;INTERVAL=12"/,
  },
];

const blockers = [];
const warnings = [];

if (!existsSync(protocolPath)) {
  blockers.push(`Missing protocol doc: ${protocolPath}`);
} else {
  const text = readFileSync(protocolPath, "utf8");
  for (const [label, pattern] of requiredProtocolPatterns) {
    if (!pattern.test(text)) {
      blockers.push(`Protocol missing ${label}.`);
    }
  }
}

for (const check of automationChecks) {
  const path = `${automationRoot}\\${check.id}\\automation.toml`;
  if (!existsSync(path)) {
    blockers.push(`Missing automation: ${check.id}`);
    continue;
  }
  const text = readFileSync(path, "utf8");
  if (!text.includes(expectedRcCwd) && !text.includes(expectedRcCwdToml)) {
    blockers.push(`${check.id} does not target the RC worktree.`);
  }
  if (!check.expectedReasoning.test(text)) {
    blockers.push(`${check.id} has unexpected reasoning effort.`);
  }
  if (!check.expectedInterval.test(text)) {
    blockers.push(`${check.id} has unexpected schedule.`);
  }
  if (/yyoufee|THE I NBUT/.test(text)) {
    blockers.push(`${check.id} contains corrupted prompt text.`);
  }
  if (!/read/i.test(text) || !/thread/i.test(text)) {
    warnings.push(`${check.id} may not explicitly require worker thread reads.`);
  }
}

const summary = {
  ok: blockers.length === 0,
  protocolPath,
  automationCount: automationChecks.length,
  blockers,
  warnings,
};

console.log(JSON.stringify(summary, null, 2));

if (!summary.ok) {
  process.exitCode = 1;
}
