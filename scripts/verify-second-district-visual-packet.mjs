import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const OUTCOMES = new Set(["PASS_FOR_PUBLIC_PROMOTION", "HIDDEN_DRAFT_ONLY", "BLOCK_VISUAL_TUNNEL", "HARD_FAIL"]);
const READ_VALUES = new Set(["PASS", "FAIL"]);
const REQUIRED_FILLER_FLAGS = [
  "labelDependentIdentity",
  "sameSizeColoredBoxes",
  "pastedOnSlabOrSprite",
  "flatGreenBoardReliance",
  "uiGlowPanelCompensation",
  "fakePlayableShellRisk",
];
const DISTRICT_DEFAULT_ANCHORS = {
  anaheim: ["Anaheim Convention Center", "ARTIC / Angel Stadium area"],
  ontario: ["Ontario airport/logistics edge", "Ontario commerce/civic core"],
};

const args = parseArgs(process.argv.slice(2));

if (args.printTemplate) {
  console.log(JSON.stringify(createReviewTemplate(args), null, 2));
  process.exit(0);
}

const failures = [];
const files = await inspectPacket(args);
const review = await inspectReview(args);

const summary = {
  ok: failures.length === 0,
  districtSlug: args.districtSlug,
  screenshotDir: resolve(args.screenshotDir),
  acceptanceBar: "docs/SECOND_DISTRICT_VISUAL_ACCEPTANCE_BAR.md",
  files,
  review,
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exitCode = 1;
}

async function inspectPacket({ districtSlug, screenshotDir, minBytes }) {
  const requiredFiles = [
    ["riversideBaselineDesktop", "riverside-baseline-desktop-1280x720.png", "Public Riverside desktop baseline for regression comparison."],
    ["riversideBaselineMobile", "riverside-baseline-mobile-390x844.png", "Public Riverside mobile baseline for regression comparison."],
    ["candidateDesktop", `${districtSlug}-desktop-1280x720.png`, "Candidate district desktop first-read screenshot."],
    ["candidateMobile", `${districtSlug}-mobile-390x844.png`, "Candidate district 390x844 mobile first-read screenshot."],
    ["candidateDetailDesktop", `${districtSlug}-detail-desktop-1280x720.png`, "Candidate district detail-camera desktop screenshot."],
    ["candidateDetailMobile", `${districtSlug}-detail-mobile-390x844.png`, "Candidate district detail-camera mobile screenshot."],
    ["noLabelAnchor1", `${districtSlug}-no-label-anchor-1.png`, "No-label review image or crop for first target anchor."],
    ["noLabelAnchor2", `${districtSlug}-no-label-anchor-2.png`, "No-label review image or crop for second target anchor."],
    ["shellStateDesktop", "shell-state-desktop-1280x720.png", "Shell-state desktop screenshot proving unready counties do not look playable."],
    ["shellStateMobile", "shell-state-mobile-390x844.png", "Shell-state mobile screenshot proving unready counties do not look playable."],
    ["visualReview", "visual-review.json", "Structured Lumen/Mira visual review aligned to the acceptance bar."],
  ];

  const results = {};
  for (const [key, file, purpose] of requiredFiles) {
    const absolutePath = resolve(screenshotDir, file);
    const result = { file, path: absolutePath, purpose, exists: false, bytes: 0 };

    try {
      const stats = await stat(absolutePath);
      result.exists = stats.isFile();
      result.bytes = stats.size;
      if (!result.exists) {
        failures.push(`Required packet path is not a file: ${file}`);
      } else if (result.bytes < minBytes) {
        failures.push(`Required packet file is too small: ${file} (${result.bytes} bytes, min ${minBytes}).`);
      }
    } catch (error) {
      if (error?.code === "ENOENT") failures.push(`Missing required packet file: ${file}`);
      else throw error;
    }

    results[key] = result;
  }

  return results;
}

async function inspectReview({ districtSlug, screenshotDir }) {
  const reviewPath = resolve(screenshotDir, "visual-review.json");
  let review;
  try {
    review = JSON.parse(await readFile(reviewPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw new Error(`Could not parse visual-review.json: ${error.message}`);
  }

  requireString(review.districtSlug, "visual-review.json districtSlug");
  if (review.districtSlug && review.districtSlug !== districtSlug) {
    failures.push(`visual-review.json districtSlug must be ${districtSlug}, got ${review.districtSlug}.`);
  }

  requireEnum(review.outcome, OUTCOMES, "visual-review.json outcome");
  requireBoolean(review.promotionReady, "visual-review.json promotionReady");
  requireBoolean(review.publicPlayable, "visual-review.json publicPlayable");
  requireStringArray(review.targetAnchors, 2, "visual-review.json targetAnchors");
  requireFirstThreeSecondRead(review.firstThreeSecondRead);
  requireNoLabelRecognition(review.noLabelRecognition);
  requireFillerFlags(review.fillerFlags);
  requireArray(review.p0Blockers, "visual-review.json p0Blockers");
  requireArray(review.p1Backlog, "visual-review.json p1Backlog");
  requireString(review.smallestNextSlice, "visual-review.json smallestNextSlice");

  if (review.publicPlayable === true && review.outcome !== "PASS_FOR_PUBLIC_PROMOTION") {
    failures.push("visual-review.json cannot set publicPlayable true unless outcome is PASS_FOR_PUBLIC_PROMOTION.");
  }
  if (review.promotionReady === true && review.outcome !== "PASS_FOR_PUBLIC_PROMOTION") {
    failures.push("visual-review.json cannot set promotionReady true unless outcome is PASS_FOR_PUBLIC_PROMOTION.");
  }
  if (review.outcome === "PASS_FOR_PUBLIC_PROMOTION") {
    const failedAnchors = (review.noLabelRecognition ?? []).flatMap((item) =>
      ["desktop", "mobile", "detail"].filter((field) => item?.[field] !== "PASS").map((field) => `${item?.anchor ?? "anchor"}.${field}`),
    );
    if (failedAnchors.length > 0) {
      failures.push(`PASS_FOR_PUBLIC_PROMOTION requires all no-label checks to PASS: ${failedAnchors.join(", ")}.`);
    }
  }

  return {
    districtSlug: review.districtSlug ?? null,
    outcome: review.outcome ?? null,
    promotionReady: review.promotionReady ?? null,
    publicPlayable: review.publicPlayable ?? null,
    targetAnchors: Array.isArray(review.targetAnchors) ? review.targetAnchors : [],
    firstThreeSecondReadPresent: Boolean(review.firstThreeSecondRead),
    noLabelRecognitionCount: Array.isArray(review.noLabelRecognition) ? review.noLabelRecognition.length : 0,
    fillerFlags: review.fillerFlags ?? null,
    p0BlockerCount: Array.isArray(review.p0Blockers) ? review.p0Blockers.length : null,
    p1BacklogCount: Array.isArray(review.p1Backlog) ? review.p1Backlog.length : null,
    smallestNextSlice: typeof review.smallestNextSlice === "string" ? review.smallestNextSlice : null,
  };
}

function requireFirstThreeSecondRead(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failures.push("visual-review.json firstThreeSecondRead must be an object.");
    return;
  }
  for (const field of ["desktop", "mobile", "detail"]) {
    requireString(value[field], `visual-review.json firstThreeSecondRead.${field}`);
  }
}

function requireNoLabelRecognition(value) {
  if (!Array.isArray(value) || value.length !== 2) {
    failures.push("visual-review.json noLabelRecognition must contain exactly two anchor reviews.");
    return;
  }
  value.forEach((item, index) => {
    const label = `visual-review.json noLabelRecognition[${index}]`;
    requireString(item?.anchor, `${label}.anchor`);
    requireEnum(item?.desktop, READ_VALUES, `${label}.desktop`);
    requireEnum(item?.mobile, READ_VALUES, `${label}.mobile`);
    requireEnum(item?.detail, READ_VALUES, `${label}.detail`);
    requireString(item?.reason, `${label}.reason`);
  });
}

function requireFillerFlags(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failures.push("visual-review.json fillerFlags must be an object.");
    return;
  }
  for (const flag of REQUIRED_FILLER_FLAGS) {
    requireBoolean(value[flag], `visual-review.json fillerFlags.${flag}`);
  }
}

function requireStringArray(value, length, label) {
  if (!Array.isArray(value) || value.length !== length || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    failures.push(`${label} must contain exactly ${length} non-empty strings.`);
  }
}

function requireArray(value, label) {
  if (!Array.isArray(value)) failures.push(`${label} must be an array.`);
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") failures.push(`${label} must be a non-empty string.`);
}

function requireBoolean(value, label) {
  if (typeof value !== "boolean") failures.push(`${label} must be a boolean.`);
}

function requireEnum(value, allowed, label) {
  if (!allowed.has(value)) failures.push(`${label} must be one of: ${[...allowed].join(", ")}.`);
}

function parseArgs(argv) {
  const parsed = { districtSlug: "", screenshotDir: "", minBytes: 1, printTemplate: false, targetAnchors: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--district") parsed.districtSlug = argv[++index] ?? "";
    else if (value === "--screenshots") parsed.screenshotDir = argv[++index] ?? "";
    else if (value === "--min-bytes") parsed.minBytes = Number(argv[++index] ?? "");
    else if (value === "--target-anchor") parsed.targetAnchors.push(argv[++index] ?? "");
    else if (value === "--print-template") parsed.printTemplate = true;
    else if (value === "--json-only") {
      // JSON is the only output format; keep this flag for parity with other verifiers.
    } else if (value === "--help" || value === "-h") printHelpAndExit();
    else throw new Error(`Unknown argument: ${value}`);
  }

  if (!parsed.districtSlug) throw new Error("--district is required.");
  if (!/^[a-z0-9-]+$/.test(parsed.districtSlug)) throw new Error("--district must be a lowercase slug.");
  if (!parsed.printTemplate && !parsed.screenshotDir) throw new Error("--screenshots is required.");
  if (!Number.isFinite(parsed.minBytes) || parsed.minBytes < 1) throw new Error("--min-bytes must be a positive number.");
  parsed.targetAnchors = parsed.targetAnchors.filter((anchor) => anchor.trim() !== "");
  if (parsed.targetAnchors.length > 0 && parsed.targetAnchors.length !== 2) {
    throw new Error("--target-anchor must be supplied exactly twice when used.");
  }

  return parsed;
}

function createReviewTemplate({ districtSlug, targetAnchors }) {
  const anchors = targetAnchors.length === 2 ? targetAnchors : DISTRICT_DEFAULT_ANCHORS[districtSlug] ?? ["Target anchor 1", "Target anchor 2"];
  return {
    districtSlug,
    outcome: "HIDDEN_DRAFT_ONLY",
    promotionReady: false,
    publicPlayable: false,
    targetAnchors: anchors,
    firstThreeSecondRead: {
      desktop: "Describe what the district says before labels on 1280x720 desktop.",
      mobile: "Describe what remains readable on 390x844 mobile before labels.",
      detail: "Describe whether the detail camera proves object identity or only adds label-dependent detail.",
    },
    noLabelRecognition: anchors.map((anchor) => ({
      anchor,
      desktop: "FAIL",
      mobile: "FAIL",
      detail: "FAIL",
      reason: "Replace this with the no-label read. Keep FAIL unless the object family is recognizable by silhouette, footprint, material, and ground contact.",
    })),
    fillerFlags: {
      labelDependentIdentity: true,
      sameSizeColoredBoxes: false,
      pastedOnSlabOrSprite: false,
      flatGreenBoardReliance: false,
      uiGlowPanelCompensation: false,
      fakePlayableShellRisk: false,
    },
    p0Blockers: [],
    p1Backlog: ["Replace this with concrete visual backlog items or remove it."],
    smallestNextSlice: "Name the smallest next visual-engine slice, or say stop visual tunnel and return to public product-loop quality.",
  };
}

function printHelpAndExit() {
  console.log(`Usage: node scripts/verify-second-district-visual-packet.mjs --district <slug> --screenshots <dir> [--min-bytes <n>] [--json-only]
       node scripts/verify-second-district-visual-packet.mjs --district <slug> --print-template [--target-anchor <name> --target-anchor <name>]

Required packet files:
  riverside-baseline-desktop-1280x720.png
  riverside-baseline-mobile-390x844.png
  <district>-desktop-1280x720.png
  <district>-mobile-390x844.png
  <district>-detail-desktop-1280x720.png
  <district>-detail-mobile-390x844.png
  <district>-no-label-anchor-1.png
  <district>-no-label-anchor-2.png
  shell-state-desktop-1280x720.png
  shell-state-mobile-390x844.png
  visual-review.json

The verifier checks packet completeness and structured review fields. It does
not perform image recognition. Use --print-template to create a conservative
visual-review.json starter that defaults to HIDDEN_DRAFT_ONLY.`);
  process.exit(0);
}
