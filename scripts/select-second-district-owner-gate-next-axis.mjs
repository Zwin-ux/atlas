#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

const UPDATE_ID = "postalpha-0.45e-owner-gate-cutline-next-axis-selection";
const DEFAULT_DISTRICT = "anaheim-candidate";
const DEFAULT_READINESS_PATH = "artifacts/second-district-readiness/latest/anaheim-candidate/readiness-aggregate.json";
const DEFAULT_CUTLINE_PATH = "artifacts/second-district-readiness/latest/anaheim-candidate/owner-gate-cutline.json";
const DEFAULT_VISUAL_REVIEW_PATH = "artifacts/second-district-visual-packets/postalpha-0.44e-anaheim-hidden-proof/visual-review.json";
const DEFAULT_PRODUCT_PROOF_PATH = "artifacts/second-district-readiness/latest/anaheim-candidate/product-proof.json";
const DEFAULT_OUT_PATH = "artifacts/second-district-readiness/latest/anaheim-candidate/postalpha-0.45e-owner-gate-next-axis.json";

const args = parseArgs(process.argv.slice(2));

const readiness = await readJson(args.readinessPath);
const cutline = await readJson(args.cutlinePath);
const visualReview = await readJson(args.visualReviewPath);
const productProof = await readJson(args.productProofPath);

const decision = selectNextAxis({
  district: args.district,
  readiness,
  cutline,
  visualReview,
  productProof,
  paths: {
    readiness: resolve(args.readinessPath),
    cutline: resolve(args.cutlinePath),
    visualReview: resolve(args.visualReviewPath),
    productProof: resolve(args.productProofPath),
  },
});

if (args.outPath) {
  const outPath = resolve(args.outPath);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(decision, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify(decision, null, 2));

if (!decision.ok) process.exitCode = 1;

function selectNextAxis({ district, readiness, cutline, visualReview, productProof, paths }) {
  const hardBlockers = [];
  const warnings = [];

  if (readiness?.district !== district) hardBlockers.push(`Readiness district mismatch: expected ${district}, got ${readiness?.district ?? "missing"}.`);
  if (cutline?.district !== district) hardBlockers.push(`Cutline district mismatch: expected ${district}, got ${cutline?.district ?? "missing"}.`);
  if (productProof?.districtSlug !== district) {
    hardBlockers.push(`Product proof district mismatch: expected ${district}, got ${productProof?.districtSlug ?? "missing"}.`);
  }
  if (visualReview?.districtSlug !== district.replace(/-candidate$/, "")) {
    hardBlockers.push(`Visual review district mismatch: expected ${district.replace(/-candidate$/, "")}, got ${visualReview?.districtSlug ?? "missing"}.`);
  }

  const trace = readiness?.aggregate?.sourceToSceneTrace ?? {};
  const blockerGroups = readiness?.aggregate?.blockerGroups ?? {};
  const noFake = readiness?.aggregate?.noFakePlayability ?? {};
  const releaseCutline = readiness?.aggregate?.releaseCutline ?? {};

  const evidence = {
    sourceVerifier: readiness?.evidenceStates?.sourceVerifier ?? "missing",
    visualPacket: readiness?.evidenceStates?.visualPacket ?? "missing",
    productProof: readiness?.evidenceStates?.productProof ?? "missing",
    splitGuard: readiness?.evidenceStates?.splitGuard ?? "missing",
    visualOutcome: trace.visualPacket?.outcome ?? visualReview?.outcome ?? null,
    visualPromotionReady: trace.visualPacket?.promotionReady === true || visualReview?.promotionReady === true,
    visualPublicPlayable: trace.visualPacket?.publicPlayable === true || visualReview?.publicPlayable === true,
    productPromotionReady: trace.productProof?.promotionReady === true || productProof?.promotionReady === true,
    productPublicPlayable: trace.productProof?.publicPlayable === true || productProof?.publicPlayable === true,
    productMiraAcceptance: trace.productProof?.miraAcceptance === true || productProof?.miraAcceptance === true,
    readyForPlayablePromotion: readiness?.readyForPlayablePromotion === true,
    ownerCutlineOutcome: cutline?.outcome ?? null,
    splitGuardBlockerCount: trace.splitGuard?.blockerCount ?? null,
    splitGuardUnknownCount: trace.splitGuard?.unknownCount ?? null,
  };

  const publicSpikeAllowed =
    evidence.readyForPlayablePromotion &&
    evidence.visualPromotionReady &&
    evidence.visualPublicPlayable &&
    evidence.productPromotionReady &&
    evidence.productPublicPlayable &&
    evidence.productMiraAcceptance &&
    evidence.splitGuardBlockerCount === 0 &&
    evidence.splitGuardUnknownCount === 0 &&
    cutline?.outcome === "APPROVE_CONTROLLED_PUBLIC_SPIKE";

  const ownerAcceptanceMissing = Object.values(cutline?.ownerGates ?? {}).some((gate) => gate?.status !== "accepted");
  const evidencePassed =
    evidence.sourceVerifier === "passed" &&
    evidence.visualPacket === "passed" &&
    evidence.productProof === "passed" &&
    evidence.splitGuard === "passed";

  if (!evidencePassed) hardBlockers.push("0.45E requires source, visual packet, product proof, and split guard evidence to be present and passed.");
  if (noFake.countyRemainsShell !== true || noFake.zeroPlayableDistricts !== true || noFake.districtNotPlayable !== true) {
    hardBlockers.push("No-fake-playability boundary is not intact.");
  }
  if (releaseCutline.mayExposeInPublicSwitcher !== false || releaseCutline.mayCompilePublicScene !== false) {
    hardBlockers.push("Release cutline allows public switcher or public scene compilation before owner approval.");
  }
  if (visualReview?.publicPlayable !== false || visualReview?.promotionReady !== false) {
    hardBlockers.push("Visual review must remain hidden-only unless public promotion is explicitly approved.");
  }
  if (productProof?.publicPlayable !== false || productProof?.promotionReady !== false) {
    hardBlockers.push("Product proof must remain non-public and non-promotional until gates pass.");
  }

  if (visualReview?.outcome === "HIDDEN_DRAFT_ONLY" && allNoLabelAnchorsPass(visualReview)) {
    warnings.push("Hidden no-label visual proof is strong enough for owner review, but not for automatic public promotion.");
  }

  const blockedAxes = buildBlockedAxes({ publicSpikeAllowed, evidence, blockerGroups, cutline });
  const selected = chooseAxis({ hardBlockers, publicSpikeAllowed, ownerAcceptanceMissing, evidence, visualReview });
  const candidateScores = scoreCandidates({ selected, publicSpikeAllowed, ownerAcceptanceMissing, evidence, visualReview, blockerGroups });

  return {
    ok: hardBlockers.length === 0,
    update: UPDATE_ID,
    district,
    selectedAxis: selected.axis,
    recommendedNextQuest: selected.nextQuest,
    decision: selected.decision,
    reasons: selected.reasons,
    candidateScores,
    blockedAxes,
    requiredEvidence: selected.requiredEvidence,
    antiScope: [
      "public Anaheim/Ontario exposure",
      "public playable second district unless owner cutline is APPROVE_CONTROLLED_PUBLIC_SPIKE",
      "provider-created geometry",
      "database persistence",
      "migrations",
      "new MCP tools",
      "paid, Stripe, OAuth, Hosted Clawd, XP, evidence, automation, reports, or exports",
      "renderer or public UI changes inside 0.45E",
      "cars, humans, decorative props, panels, glows, or label crutches",
    ],
    evidence,
    blockerGroups,
    noFakePlayability: noFake,
    releaseCutline,
    ownerGates: cutline?.ownerGates ?? {},
    artifactPaths: paths,
    warnings,
    hardBlockers,
  };
}

function chooseAxis({ hardBlockers, publicSpikeAllowed, ownerAcceptanceMissing, evidence, visualReview }) {
  if (hardBlockers.length > 0) {
    return {
      axis: "repair_hidden_proof_packet",
      decision: "BLOCK_AND_REPAIR_EVIDENCE",
      nextQuest: "0.46E Hidden Proof Packet Repair",
      reasons: ["Hard proof invariants failed; do not continue public or visual work until evidence is repaired."],
      requiredEvidence: ["Fix hardBlockers from the 0.45E selector output."],
    };
  }

  if (publicSpikeAllowed) {
    return {
      axis: "controlled_public_second_district_spike",
      decision: "APPROVE_CONTROLLED_PUBLIC_SPIKE",
      nextQuest: "0.46E Controlled Anaheim Public Playable Spike",
      reasons: ["All promotion gates and owner gates are accepted."],
      requiredEvidence: ["Preserve seven tools, public screenshots, split guard, provider boundary, and rollback plan."],
    };
  }

  if (evidence.visualPacket === "passed" && evidence.productProof === "passed" && ownerAcceptanceMissing && allNoLabelAnchorsPass(visualReview)) {
    return {
      axis: "owner_gate_review",
      decision: "REQUEST_OWNER_REVIEW",
      nextQuest: "0.46E Owner Gate Review Packet",
      reasons: [
        "0.44E visual and product proof passed as hidden evidence.",
        "Public promotion is still blocked because visual/product/release owner gates are not accepted.",
        "No-label anchors pass in the hidden packet, so the next useful move is owner review, not more hidden art.",
      ],
      requiredEvidence: [
        "Lumen explicit accept/reject on hidden visual packet.",
        "Mira explicit accept/reject on product proof and mobile boundary.",
        "Forge explicit accept/reject on split/provider/release safety.",
        "Axiom final cutline after owner responses.",
      ],
    };
  }

  if (evidence.visualPacket === "passed" && evidence.productProof === "passed") {
    return {
      axis: "focused_hidden_second_district_fix",
      decision: "FOCUSED_HIDDEN_FIX",
      nextQuest: "0.46E Focused Hidden Anaheim Proof Fix",
      reasons: [
        "Hidden evidence is present but does not justify owner review yet.",
        "Keep fixes hidden and bounded to the exact blocker named in visual/product proof.",
      ],
      requiredEvidence: ["One exact visual/product blocker and a before/after hidden packet."],
    };
  }

  return {
    axis: "public_engine_beta_quality",
    decision: "RETURN_TO_PUBLIC_ENGINE_BETA",
    nextQuest: "0.46E Public Engine Beta Quality Axis Review",
    reasons: ["Second-district proof does not currently produce a promotion path; return to public app quality."],
    requiredEvidence: ["Current public Engine Beta diagnostics and screenshots."],
  };
}

function scoreCandidates({ selected, publicSpikeAllowed, ownerAcceptanceMissing, evidence, visualReview, blockerGroups }) {
  const visualBlockers = Array.isArray(blockerGroups.visual) ? blockerGroups.visual.length : 0;
  const productBlockers = Array.isArray(blockerGroups.product) ? blockerGroups.product.length : 0;
  const releaseBlockers = Array.isArray(blockerGroups.release) ? blockerGroups.release.length : 0;
  return {
    owner_gate_review: {
      score: selected.axis === "owner_gate_review" ? 94 : ownerAcceptanceMissing && allNoLabelAnchorsPass(visualReview) ? 82 : 45,
      reason: "Best next move when hidden proof is valid but owner acceptances are missing.",
    },
    controlled_public_second_district_spike: {
      score: publicSpikeAllowed ? 100 : 0,
      reason: publicSpikeAllowed ? "All public promotion gates passed." : "Blocked until cutline is APPROVE_CONTROLLED_PUBLIC_SPIKE.",
    },
    focused_hidden_second_district_fix: {
      score: selected.axis === "focused_hidden_second_district_fix" ? 75 : visualBlockers + productBlockers > 0 ? 50 : 25,
      reason: "Only useful if proof has one exact hidden blocker to fix before owner review.",
    },
    public_engine_beta_quality: {
      score: selected.axis === "public_engine_beta_quality" ? 70 : 35,
      reason: "Fallback if hidden second-district proof cannot move promotion work.",
    },
    repeat_hidden_art_tunnel: {
      score: 0,
      reason: "Blocked unless owner review names one exact hidden visual blocker.",
    },
    release_mechanics_only: {
      score: releaseBlockers > 0 && evidence.splitGuard === "passed" ? 35 : 10,
      reason: "Split guard is already passing; release mechanics alone do not solve owner acceptance.",
    },
  };
}

function buildBlockedAxes({ publicSpikeAllowed, evidence, blockerGroups, cutline }) {
  const blocked = [];
  if (!publicSpikeAllowed) {
    blocked.push({
      axis: "controlled_public_second_district_spike",
      reason: "Cutline is not APPROVE_CONTROLLED_PUBLIC_SPIKE and promotion readiness is false.",
      blockers: [
        ...(blockerGroups.visual ?? []),
        ...(blockerGroups.product ?? []),
        ...(blockerGroups.release ?? []),
        `owner_cutline:${cutline?.outcome ?? "missing"}`,
      ],
    });
  }
  blocked.push({
    axis: "metadata_flip_promotion",
    reason: "Provider lookup, metadata, or hidden proof cannot create public playability.",
    blockers: ["forbidden_scope", "no_fake_playability_gate"],
  });
  if (evidence.visualPacket === "passed" && evidence.productProof === "passed") {
    blocked.push({
      axis: "more_hidden_art_without_owner_review",
      reason: "Hidden proof is already present; do not continue visual tunnel without an owner-named blocker.",
      blockers: ["no_exact_new_visual_blocker"],
    });
  }
  return blocked;
}

function allNoLabelAnchorsPass(review) {
  return (
    Array.isArray(review?.noLabelRecognition) &&
    review.noLabelRecognition.length >= 2 &&
    review.noLabelRecognition.every((item) => item.desktop === "PASS" && item.mobile === "PASS" && item.detail === "PASS")
  );
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(resolve(path), "utf8"));
  } catch (error) {
    throw new Error(`Could not read JSON ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function parseArgs(argv) {
  const parsed = {
    district: DEFAULT_DISTRICT,
    readinessPath: DEFAULT_READINESS_PATH,
    cutlinePath: DEFAULT_CUTLINE_PATH,
    visualReviewPath: DEFAULT_VISUAL_REVIEW_PATH,
    productProofPath: DEFAULT_PRODUCT_PROOF_PATH,
    outPath: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--district") parsed.district = argv[++index] ?? "";
    else if (value === "--readiness") parsed.readinessPath = argv[++index] ?? "";
    else if (value === "--cutline") parsed.cutlinePath = argv[++index] ?? "";
    else if (value === "--visual-review") parsed.visualReviewPath = argv[++index] ?? "";
    else if (value === "--product-proof") parsed.productProofPath = argv[++index] ?? "";
    else if (value === "--out") parsed.outPath = argv[++index] ?? DEFAULT_OUT_PATH;
    else if (value === "--write-default") parsed.outPath = DEFAULT_OUT_PATH;
    else if (value === "--json-only") {
      // JSON is the only output format.
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  if (!parsed.district) throw new Error("--district is required.");
  if (!/^[a-z0-9-]+$/.test(parsed.district)) throw new Error("--district must be a lowercase slug.");
  return parsed;
}
