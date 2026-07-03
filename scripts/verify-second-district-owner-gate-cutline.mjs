#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { createDistrictOwnerGateCutline } from "../packages/core/dist/index.js";

const args = parseArgs(process.argv.slice(2));
const readiness = JSON.parse(await readFile(resolve(args.readiness), "utf8"));
const aggregate = readiness.aggregate ?? readiness;
const ownerDecisions = await readOwnerDecisions(args.ownerDecisions);
const cutline = createDistrictOwnerGateCutline({
  aggregate,
  ownerDecisions,
});

const summary = {
  ok: true,
  update: "postalpha-0.25e-owner-gate-closure-public-promotion-cutline",
  district: cutline.districtSlug,
  outcome: cutline.outcome,
  readyForPlayablePromotion: cutline.readyForPlayablePromotion,
  nextSlice: cutline.nextSlice,
  ownerGates: cutline.ownerGates,
  blockerGroups: cutline.blockerGroups,
  cutlineBlockers: cutline.cutlineBlockers,
};

if (args.out) {
  const outPath = resolve(args.out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify(summary, null, 2));

async function readOwnerDecisions(path) {
  if (!path) return undefined;
  const parsed = JSON.parse(await readFile(resolve(path), "utf8"));
  const decisions = parsed.ownerDecisions ?? parsed;
  return {
    lumen: normalizeDecision("lumen", decisions.lumen),
    mira: normalizeDecision("mira", decisions.mira),
    forge: normalizeDecision("forge", decisions.forge),
    axiom: normalizeDecision("axiom", decisions.axiom),
  };
}

function normalizeDecision(owner, value) {
  if (!value) return undefined;
  if (value.owner && value.status) return value;
  return {
    owner,
    status: value.status,
    reason: value.reason,
    evidencePath: value.evidencePath,
  };
}

function parseArgs(argv) {
  const parsed = {
    readiness: "artifacts/second-district-readiness/latest/anaheim-candidate/readiness-aggregate.json",
    ownerDecisions: "",
    out: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--readiness") parsed.readiness = argv[++index] ?? "";
    else if (value === "--owner-decisions") parsed.ownerDecisions = argv[++index] ?? "";
    else if (value === "--out") parsed.out = argv[++index] ?? "";
    else if (value === "--json-only") {
      // JSON is the only output format; keep this flag for verifier parity.
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  if (!parsed.readiness) throw new Error("--readiness is required.");
  return parsed;
}
