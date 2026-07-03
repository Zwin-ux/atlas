#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const blockers = [];
const warnings = [];

const requiredPatterns = [
  ["docs/GAMEBLOCKS_ATLAS_ADAPTER.md", /reference adapter only/i],
  ["docs/GAMEBLOCKS_ATLAS_ADAPTER.md", /Use GameBlocks as a pattern library, not as a runtime dependency/i],
  ["docs/GAMEBLOCKS_ATLAS_ADAPTER.md", /WorldBasis/],
  ["docs/GAMEBLOCKS_ATLAS_ADAPTER.md", /PlanarUtils/],
  ["docs/GAMEBLOCKS_ATLAS_ADAPTER.md", /TerrainSampler/],
  ["docs/GAMEBLOCKS_ATLAS_ADAPTER.md", /BoardEnvironment/],
  ["docs/GAMEBLOCKS_ATLAS_ADAPTER.md", /MinimapProjector2D/],
  ["docs/GAMEBLOCKS_ATLAS_ADAPTER.md", /Do not adapt these GameBlocks areas/i],
  ["docs/GAMEBLOCKS_ATLAS_ADAPTER.md", /actor motion/i],
  ["docs/GAMEBLOCKS_ATLAS_ADAPTER.md", /Rapier physics/i],
  ["docs/GAMEBLOCKS_ATLAS_ADAPTER.md", /Three\.js mesh factories/i],
  ["docs/GAMEBLOCKS_ATLAS_ADAPTER.md", /provider lookup never becomes map\s+geometry or readiness proof/i],
  ["docs/AXIOM_ENGINE_REFERENCE_STACK.md", /GameBlocks/],
  ["docs/AXIOM_ENGINE_REFERENCE_STACK.md", /WorldBasis/],
  ["docs/AXIOM_ENGINE_REFERENCE_STACK.md", /not a runtime dependency/i],
  ["docs/NEXT_QUESTS.md", /GameBlocks Atlas Adapter/],
];

for (const [file, pattern] of requiredPatterns) {
  requirePattern(file, pattern);
}

assertNoRuntimeDependency();
assertNoGameBlocksRuntimeImports();

const summary = {
  ok: blockers.length === 0,
  blockerCount: blockers.length,
  blockers,
  warnings,
  checked: {
    docs: [...new Set(requiredPatterns.map(([file]) => file))],
    sourceRoots: ["packages", "server", "web"],
    packageJson: "package.json",
  },
};

if (args.jsonOnly) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`GameBlocks Atlas adapter: ${summary.ok ? "ok" : "blocked"}`);
  for (const blocker of blockers) console.log(`- ${blocker}`);
  for (const warning of warnings) console.log(`- warning: ${warning}`);
}

if (!summary.ok) {
  process.exitCode = 1;
}

function requirePattern(file, pattern) {
  if (!existsSync(file)) {
    blockers.push(`${file} is missing.`);
    return;
  }

  const text = readFileSync(file, "utf8");
  if (!pattern.test(text)) {
    blockers.push(`${file} does not match ${pattern}.`);
  }
}

function assertNoRuntimeDependency() {
  if (!existsSync("package.json")) {
    blockers.push("package.json is missing.");
    return;
  }

  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  const dependencySections = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
  const forbidden = new Set(["gameblocks", "@xt4d/gameblocks", "three", "@dimforge/rapier3d-compat", "rapier"]);

  for (const section of dependencySections) {
    const deps = packageJson[section] ?? {};
    for (const dependencyName of Object.keys(deps)) {
      if (forbidden.has(dependencyName.toLowerCase())) {
        blockers.push(`Forbidden GameBlocks adapter runtime dependency in ${section}: ${dependencyName}.`);
      }
    }
  }
}

function assertNoGameBlocksRuntimeImports() {
  const roots = ["packages", "server", "web"];
  const sourceFiles = roots.flatMap((root) => listFiles(root));
  const importPatterns = [
    /from\s+["'][^"']*gameblocks[^"']*["']/i,
    /import\s+["'][^"']*gameblocks[^"']*["']/i,
    /from\s+["']three(?:\/[^"']*)?["']/i,
    /import\s+["']three(?:\/[^"']*)?["']/i,
    /@dimforge\/rapier/i,
  ];

  for (const file of sourceFiles) {
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const pattern of importPatterns) {
      if (pattern.test(text)) {
        blockers.push(`${file} imports a forbidden GameBlocks-adjacent runtime pattern: ${pattern}.`);
      }
    }
  }
}

function listFiles(root) {
  if (!existsSync(root)) return [];
  const results = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    const stat = statSync(current);
    if (stat.isDirectory()) {
      for (const child of readdirSync(current)) {
        if (["node_modules", "dist", ".next", ".vite"].includes(child)) continue;
        stack.push(path.join(current, child));
      }
      continue;
    }
    results.push(current.replaceAll("\\", "/"));
  }

  return results;
}

function parseArgs(argv) {
  const parsed = { jsonOnly: false };
  for (const arg of argv) {
    if (arg === "--json-only") {
      parsed.jsonOnly = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}
