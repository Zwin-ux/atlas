import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import process from "node:process";

const DISTRICT_DEFAULT_ANCHORS = {
  anaheim: ["Anaheim Convention Center", "ARTIC / Angel Stadium area"],
  ontario: ["Ontario airport/logistics edge", "Ontario commerce/civic core"],
};

const REQUIRED_OUTPUTS = [
  "riverside-baseline-desktop-1280x720.png",
  "riverside-baseline-mobile-390x844.png",
  "{district}-desktop-1280x720.png",
  "{district}-mobile-390x844.png",
  "{district}-detail-desktop-1280x720.png",
  "{district}-detail-mobile-390x844.png",
  "{district}-no-label-anchor-1.png",
  "{district}-no-label-anchor-2.png",
  "shell-state-desktop-1280x720.png",
  "shell-state-mobile-390x844.png",
  "visual-review.json",
];

const args = parseArgs(process.argv.slice(2));
const packetDir = resolve(args.outDir);
await mkdir(packetDir, { recursive: true });

const searchFiles = await collectSearchFiles(args.sourceDirs);
const copyResults = [];
const missing = [];

for (const item of packetPlan(args.districtSlug)) {
  const sourcePath = args.explicit[item.key] ? resolve(args.explicit[item.key]) : findSource(searchFiles, item.patterns);
  const targetPath = join(packetDir, item.file);
  if (!sourcePath) {
    missing.push({ key: item.key, output: item.file, acceptedPatterns: item.patterns });
    copyResults.push({ key: item.key, output: item.file, copied: false, source: null });
    continue;
  }
  await copyFile(sourcePath, targetPath);
  copyResults.push({ key: item.key, output: item.file, copied: true, source: sourcePath });
}

const reviewPath = join(packetDir, "visual-review.json");
const reviewTemplate = createReviewTemplate(args);
if (args.overwriteReview || !(await exists(reviewPath))) {
  await writeFile(reviewPath, `${JSON.stringify(reviewTemplate, null, 2)}\n`);
}

const summary = {
  ok: missing.length === 0,
  districtSlug: args.districtSlug,
  packetDir,
  reviewPath,
  requiredOutputs: REQUIRED_OUTPUTS.map((item) => item.replaceAll("{district}", args.districtSlug)),
  copied: copyResults,
  missing,
  nextCommand: `node scripts\\verify-second-district-visual-packet.mjs --district ${args.districtSlug} --screenshots ${packetDir} --json-only`,
};

console.log(JSON.stringify(summary, null, 2));

if (missing.length > 0) {
  process.exitCode = 1;
}

function packetPlan(districtSlug) {
  return [
    {
      key: "riversideBaselineDesktop",
      file: "riverside-baseline-desktop-1280x720.png",
      patterns: ["alpha-product-loop-desktop-1280x720.png", "riverside-baseline-desktop-1280x720.png"],
    },
    {
      key: "riversideBaselineMobile",
      file: "riverside-baseline-mobile-390x844.png",
      patterns: ["alpha-product-loop-mobile-390x844.png", "riverside-baseline-mobile-390x844.png"],
    },
    {
      key: "candidateDesktop",
      file: `${districtSlug}-desktop-1280x720.png`,
      patterns: [`${districtSlug}-draft-desktop-1280x720.png`, `${districtSlug}-desktop-1280x720.png`, "alpha-product-loop-desktop-1280x720.png"],
    },
    {
      key: "candidateMobile",
      file: `${districtSlug}-mobile-390x844.png`,
      patterns: [`${districtSlug}-draft-mobile-390x844.png`, `${districtSlug}-mobile-390x844.png`, "alpha-product-loop-mobile-390x844.png"],
    },
    {
      key: "candidateDetailDesktop",
      file: `${districtSlug}-detail-desktop-1280x720.png`,
      patterns: [
        `${districtSlug}-draft-residential-detail-1280x720.png`,
        `${districtSlug}-detail-desktop-1280x720.png`,
        "alpha-product-loop-desktop-1280x720.png",
      ],
    },
    {
      key: "candidateDetailMobile",
      file: `${districtSlug}-detail-mobile-390x844.png`,
      patterns: [`${districtSlug}-draft-residential-detail-mobile-390x844.png`, `${districtSlug}-detail-mobile-390x844.png`, "alpha-product-loop-mobile-390x844.png"],
    },
    {
      key: "noLabelAnchor1",
      file: `${districtSlug}-no-label-anchor-1.png`,
      patterns: [`${districtSlug}-no-label-anchor-1.png`, `${districtSlug}-draft-no-label-anchor-1.png`, `${districtSlug}-anchor-1.png`],
    },
    {
      key: "noLabelAnchor2",
      file: `${districtSlug}-no-label-anchor-2.png`,
      patterns: [`${districtSlug}-no-label-anchor-2.png`, `${districtSlug}-draft-no-label-anchor-2.png`, `${districtSlug}-anchor-2.png`],
    },
    {
      key: "shellStateDesktop",
      file: "shell-state-desktop-1280x720.png",
      patterns: ["shell-county-widget-desktop-1280x720.png", "shell-state-desktop-1280x720.png"],
    },
    {
      key: "shellStateMobile",
      file: "shell-state-mobile-390x844.png",
      patterns: ["shell-county-widget-mobile-390x844.png", "shell-state-mobile-390x844.png"],
    },
  ];
}

async function collectSearchFiles(sourceDirs) {
  const files = [];
  for (const sourceDir of sourceDirs) {
    await collect(resolve(sourceDir), files);
  }
  return files;
}

async function collect(dir, files) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await collect(path, files);
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
}

function findSource(files, patterns) {
  for (const pattern of patterns) {
    const found = files.find((file) => basename(file).toLowerCase() === pattern.toLowerCase());
    if (found) return found;
  }
  return null;
}

async function exists(path) {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch {
    return false;
  }
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

function parseArgs(argv) {
  const parsed = {
    districtSlug: "",
    sourceDirs: [],
    outDir: "",
    targetAnchors: [],
    overwriteReview: false,
    explicit: {},
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--district") parsed.districtSlug = argv[++index] ?? "";
    else if (value === "--source") parsed.sourceDirs.push(argv[++index] ?? "");
    else if (value === "--out") parsed.outDir = argv[++index] ?? "";
    else if (value === "--target-anchor") parsed.targetAnchors.push(argv[++index] ?? "");
    else if (value === "--overwrite-review") parsed.overwriteReview = true;
    else if (value.startsWith("--")) {
      const explicitKey = value.slice(2);
      if (!packetPlan("district").some((item) => item.key === explicitKey)) {
        throw new Error(`Unknown argument: ${value}`);
      }
      parsed.explicit[explicitKey] = argv[++index] ?? "";
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  if (!parsed.districtSlug) throw new Error("--district is required.");
  if (!/^[a-z0-9-]+$/.test(parsed.districtSlug)) throw new Error("--district must be a lowercase slug.");
  if (parsed.sourceDirs.length === 0) throw new Error("At least one --source directory is required.");
  if (!parsed.outDir) throw new Error("--out is required.");
  parsed.sourceDirs = parsed.sourceDirs.filter((item) => item.trim() !== "");
  parsed.targetAnchors = parsed.targetAnchors.filter((anchor) => anchor.trim() !== "");
  if (parsed.targetAnchors.length > 0 && parsed.targetAnchors.length !== 2) {
    throw new Error("--target-anchor must be supplied exactly twice when used.");
  }

  return parsed;
}
