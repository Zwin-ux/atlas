#!/usr/bin/env node
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import process from "node:process";
import { createDistrictReadinessAggregate } from "../packages/core/dist/index.js";

const execFileAsync = promisify(execFile);
const args = parseArgs(process.argv.slice(2));

const promotion = await runJsonCommand([
  "scripts/create-second-district-promotion-packet.mjs",
  "--district",
  args.district,
  "--json-only",
]);
const sourceVerifier = await readSourceVerifierState();
const visualPacket = await readVisualPacketState(promotion.packet.reviewPlaceholders.requiredScreenshotPacketPath);
const productProof = await readProductProofState();
const splitGuard = await readSplitGuardState();

const aggregate = createDistrictReadinessAggregate({
  promotionPacket: promotion.packet,
  sourceVerifier,
  visualPacket,
  productProof,
  splitGuard,
});

const summary = {
  ok: true,
  update: "postalpha-0.24e-second-district-promotion-readiness-aggregator",
  district: args.district,
  readyForPlayablePromotion: aggregate.readyForPlayablePromotion,
  evidenceStates: {
    sourceVerifier: sourceVerifier.status,
    visualPacket: visualPacket.status,
    productProof: productProof.status,
    splitGuard: splitGuard.status,
  },
  promotionPacket: {
    promotionReady: promotion.packet.promotionReady,
    nextRequiredGate: promotion.packet.nextRequiredGate,
    satisfied: promotion.packet.gateSummary.satisfied,
    missing: promotion.packet.gateSummary.missing,
  },
  coverage: promotion.coverage,
  aggregate,
};

console.log(JSON.stringify(summary, null, 2));

async function readSourceVerifierState() {
  const result = await runJsonCommand(["scripts/verify-county-index-source.mjs", "--offline", "--json-only"], { allowFailure: true });
  if (!result.ok) {
    return {
      status: "failed",
      verified: false,
      source: "county-index-source",
      blockerCount: Array.isArray(result.blockers) ? result.blockers.length : 1,
    };
  }
  return {
    status: "passed",
    verified: true,
    source: "county-index-source",
    blockerCount: Array.isArray(result.blockers) ? result.blockers.length : 0,
  };
}

async function readVisualPacketState(defaultPacketPath) {
  const packetPath = args.visualPacketPath || defaultPacketPath;
  if (!args.visualPacketPath) {
    return {
      status: "missing",
      packetPath,
      outcome: null,
      promotionReady: false,
      publicPlayable: false,
      failureCount: 1,
    };
  }

  const visualDistrict = args.visualDistrict || args.district.replace(/-candidate$/, "");
  const result = await runJsonCommand(
    ["scripts/verify-second-district-visual-packet.mjs", "--district", visualDistrict, "--screenshots", args.visualPacketPath, "--json-only"],
    { allowFailure: true },
  );
  return {
    status: result.ok ? "passed" : "failed",
    packetPath: resolve(args.visualPacketPath),
    outcome: result.review?.outcome ?? null,
    promotionReady: result.review?.promotionReady ?? false,
    publicPlayable: result.review?.publicPlayable ?? false,
    failureCount: Array.isArray(result.failures) ? result.failures.length : result.ok ? 0 : 1,
  };
}

async function readProductProofState() {
  if (!args.productProofPath) {
    return {
      status: "missing",
      proofPath: "artifacts/second-district/product-proof.json",
      promotionReady: false,
      failureCount: 1,
    };
  }

  let proof;
  try {
    proof = JSON.parse(await readFile(resolve(args.productProofPath), "utf8"));
  } catch {
    return {
      status: "failed",
      proofPath: resolve(args.productProofPath),
      promotionReady: false,
      failureCount: 1,
    };
  }

  const productBoundary = proof?.productBoundary && typeof proof.productBoundary === "object" ? proof.productBoundary : {};
  const boundaryPassed =
    productBoundary.riversidePlayableNow === true &&
    productBoundary.shellCountiesBrowseOnly === true &&
    productBoundary.lookupNotSaved === true &&
    productBoundary.lookupNotCoverageProof === true &&
    productBoundary.noInternalLanguage === true &&
    productBoundary.noPersistencePaidXpEvidenceAutomationClaims === true &&
    productBoundary.sevenToolListStable === true;
  const proofPassed =
    proof?.proofKind === "chatgptEntrySurfaceProof" &&
    proof?.proofStatus === "passed" &&
    proof?.districtSlug === args.district &&
    boundaryPassed &&
    Array.isArray(proof?.scenarios) &&
    proof.scenarios.length >= 5;
  return {
    status: proofPassed ? "passed" : "failed",
    proofPath: resolve(args.productProofPath),
    proofStatus: proof?.proofStatus ?? null,
    promotionReady: proof?.promotionReady === true,
    publicPlayable: proof?.publicPlayable === true,
    miraAcceptance: proof?.miraAcceptance === true,
    scenarioCount: Array.isArray(proof?.scenarios) ? proof.scenarios.length : 0,
    failureCount: proofPassed ? 0 : 1,
  };
}

async function readSplitGuardState() {
  if (args.skipSplitGuard) {
    return {
      status: "missing",
      mode: "engine-beta-data",
      blockerCount: 0,
      unknownCount: 0,
    };
  }

  const result = await runJsonCommand(
    ["scripts/verify-alpha-rc-split.mjs", "--working-tree", "--strict-selected-rc", "--rc-mode", "engine-beta-data", "--json-only"],
    { allowFailure: true },
  );
  const unknownCount = result.counts?.unknown ?? 0;
  return {
    status: result.ok ? "passed" : "failed",
    mode: "engine-beta-data",
    blockerCount: result.blockerCount ?? (Array.isArray(result.blockers) ? result.blockers.length : 1),
    unknownCount,
  };
}

async function runJsonCommand(commandArgs, options = {}) {
  try {
    const { stdout } = await execFileAsync(process.execPath, commandArgs, {
      cwd: process.cwd(),
      maxBuffer: 20 * 1024 * 1024,
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

function parseArgs(argv) {
  const parsed = {
    district: "",
    visualPacketPath: "",
    visualDistrict: "",
    productProofPath: "",
    skipSplitGuard: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--district") parsed.district = argv[++index] ?? "";
    else if (value === "--visual-packet") parsed.visualPacketPath = argv[++index] ?? "";
    else if (value === "--visual-district") parsed.visualDistrict = argv[++index] ?? "";
    else if (value === "--product-proof") parsed.productProofPath = argv[++index] ?? "";
    else if (value === "--skip-split-guard") parsed.skipSplitGuard = true;
    else if (value === "--json-only") {
      // JSON is the only output format; keep this flag for verifier parity.
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  if (!parsed.district) throw new Error("--district is required.");
  if (!/^[a-z0-9-]+$/.test(parsed.district)) throw new Error("--district must be a lowercase slug.");
  return parsed;
}
