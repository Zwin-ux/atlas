#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import process from "node:process";

const execFileAsync = promisify(execFile);
const args = parseArgs(process.argv.slice(2));
const outputRoot = resolve(args.out);
const districtDir = resolve(outputRoot, args.district);

await mkdir(districtDir, { recursive: true });

const readiness = await runJsonCommand([
  "scripts/verify-second-district-readiness.mjs",
  "--district",
  args.district,
  "--json-only",
  ...optionalPathArg("--visual-packet", args.visualPacketPath),
  ...optionalPathArg("--product-proof", args.productProofPath),
]);
const promotion = await runJsonCommand([
  "scripts/create-second-district-promotion-packet.mjs",
  "--district",
  args.district,
  "--json-only",
]);
const splitGuard = await runJsonCommand(
  ["scripts/verify-alpha-rc-split.mjs", "--working-tree", "--strict-selected-rc", "--rc-mode", "engine-beta-data", "--json-only"],
  { allowFailure: true },
);
const gitStatus = await readGitStatus();
const releaseStatus = {
  checkedAt: new Date().toISOString(),
  branch: gitStatus.branch,
  gitStatusCount: gitStatus.statusCount,
  splitGuard: {
    ok: splitGuard.ok === true,
    mode: splitGuard.mode ?? "working-tree",
    rcMode: splitGuard.rcMode ?? "engine-beta-data",
    fileCount: splitGuard.fileCount ?? 0,
    blockerCount: splitGuard.blockerCount ?? 0,
    unknownCount: splitGuard.counts?.unknown ?? 0,
  },
  railway: {
    inspected: false,
    status: "not-inspected-in-exporter",
    project: "atlas-chatgpt-app",
    environment: "production",
    service: "atlas-backend",
    source: "Axiom read-only status handoff",
  },
  mutation: {
    staged: false,
    committed: false,
    deployed: false,
    railwayMutated: false,
  },
};
const sourceToSceneTrace = readiness.aggregate.sourceToSceneTrace;

await writeJson("readiness-aggregate.json", readiness);
await writeJson("promotion-packet.json", promotion);
await writeJson("source-to-scene-trace.json", sourceToSceneTrace);
await writeJson("release-status.json", releaseStatus);

const summary = {
  ok: true,
  district: args.district,
  outputDir: districtDir,
  files: {
    readinessAggregate: resolve(districtDir, "readiness-aggregate.json"),
    promotionPacket: resolve(districtDir, "promotion-packet.json"),
    sourceToSceneTrace: resolve(districtDir, "source-to-scene-trace.json"),
    releaseStatus: resolve(districtDir, "release-status.json"),
  },
  readyForPlayablePromotion: readiness.readyForPlayablePromotion,
  blockerGroups: readiness.aggregate.blockerGroups,
  releaseStatus: releaseStatus.splitGuard,
};

console.log(JSON.stringify(summary, null, 2));

async function writeJson(fileName, value) {
  await writeFile(resolve(districtDir, fileName), `${JSON.stringify(value, null, 2)}\n`);
}

async function readGitStatus() {
  const branchResult = await execFileAsync("git", ["branch", "--show-current"], { cwd: process.cwd() });
  const statusResult = await execFileAsync("git", ["status", "--short"], { cwd: process.cwd(), maxBuffer: 20 * 1024 * 1024 });
  const statusLines = statusResult.stdout
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
  return {
    branch: branchResult.stdout.trim(),
    statusCount: statusLines.length,
  };
}

async function runJsonCommand(commandArgs, options = {}) {
  try {
    const { stdout } = await execFileAsync(process.execPath, commandArgs, {
      cwd: process.cwd(),
      maxBuffer: 30 * 1024 * 1024,
    });
    return JSON.parse(stdout);
  } catch (error) {
    if (!options.allowFailure) throw error;
    const stdout = error.stdout?.toString() ?? "";
    try {
      return JSON.parse(stdout);
    } catch {
      return { ok: false, blockers: [error.message] };
    }
  }
}

function optionalPathArg(flag, value) {
  return value ? [flag, value] : [];
}

function parseArgs(argv) {
  const parsed = {
    district: "",
    out: "",
    visualPacketPath: "",
    productProofPath: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--district") parsed.district = argv[++index] ?? "";
    else if (value === "--out") parsed.out = argv[++index] ?? "";
    else if (value === "--visual-packet") parsed.visualPacketPath = argv[++index] ?? "";
    else if (value === "--product-proof") parsed.productProofPath = argv[++index] ?? "";
    else if (value === "--json-only") {
      // JSON is the only output format; keep this flag for verifier parity.
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  if (!parsed.district) throw new Error("--district is required.");
  if (!/^[a-z0-9-]+$/.test(parsed.district)) throw new Error("--district must be a lowercase slug.");
  if (!parsed.out) throw new Error("--out is required.");
  return parsed;
}
