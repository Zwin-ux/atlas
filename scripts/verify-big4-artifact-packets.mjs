#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));

const packets = [
  {
    owner: "Forge",
    packet: "E15.1 Candidate Readiness Aggregator",
    requiredPaths: [
      "packages/core/src/world/districtPromotionPacket.ts",
      "packages/core/test/district-promotion-packet.test.ts",
      "scripts/create-second-district-promotion-packet.mjs",
      "docs/SECOND_DISTRICT_PROMOTION_GATE.md",
    ],
    expectedNextArtifacts: ["scripts/verify-second-district-readiness.mjs"],
    requiredDocPatterns: [
      ["docs/AXIOM_BIG4_ARTIFACT_DISPATCH.md", /E15\.1 Candidate Readiness Aggregator/],
      ["docs/AXIOM_BIG4_ARTIFACT_DISPATCH.md", /source-to-scene trace/i],
    ],
  },
  {
    owner: "Lumen",
    packet: "E15.2 Hidden Draft Voxel Grammar System",
    requiredPaths: [
      "scripts/verify-second-district-draft-scene.mjs",
      "scripts/prepare-second-district-visual-packet.mjs",
      "scripts/verify-second-district-visual-packet.mjs",
      "docs/SECOND_DISTRICT_VISUAL_ACCEPTANCE_BAR.md",
      "docs/SECOND_DISTRICT_VISUAL_PACKET_TEMPLATE.md",
    ],
    expectedNextArtifacts: ["docs/SECOND_DISTRICT_VOXEL_GRAMMAR_PACKET.md"],
    requiredDocPatterns: [
      ["docs/AXIOM_BIG4_ARTIFACT_DISPATCH.md", /E15\.2 Hidden Draft Voxel Grammar System/],
      ["docs/AXIOM_BIG4_ARTIFACT_DISPATCH.md", /two-anchor native/i],
      ["docs/AXIOM_BIG4_ARTIFACT_DISPATCH.md", /recognizable before labels/i],
    ],
  },
  {
    owner: "Mira",
    packet: "E15.3 ChatGPT Entry Surface",
    requiredPaths: [
      "scripts/verify-mcp-flow.mjs",
      "scripts/verify-world-lookup-boundary.mjs",
      "scripts/verify-county-switcher.mjs",
      "server/src/index.ts",
      "web/src/CountySwitcher.tsx",
    ],
    expectedNextArtifacts: ["docs/CHATGPT_ENTRY_SURFACE_PROOF.md", "scripts/verify-chatgpt-entry-surface.mjs"],
    requiredDocPatterns: [
      ["docs/AXIOM_BIG4_ARTIFACT_DISPATCH.md", /E15\.3 ChatGPT Entry Surface/],
      ["docs/AXIOM_BIG4_ARTIFACT_DISPATCH.md", /Play Riverside\/Eastvale now/],
      ["docs/AXIOM_BIG4_ARTIFACT_DISPATCH.md", /Lookup places without saving/],
    ],
  },
  {
    owner: "Axiom",
    packet: "E15 Integration Control",
    requiredPaths: [
      "docs/BIG4_ARTIFACT_OPERATING_MODEL.md",
      "docs/AXIOM_BIG4_ARTIFACT_DISPATCH.md",
      "docs/AXIOM_BIG4_WAKEUP_PROTOCOL.md",
      "docs/AXIOM_ENGINE_REFERENCE_STACK.md",
      "docs/GAMEBLOCKS_ATLAS_ADAPTER.md",
      "docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md",
      "scripts/verify-big4-artifact-packets.mjs",
      "scripts/verify-big4-wakeup-protocol.mjs",
      "scripts/verify-gameblocks-atlas-adapter.mjs",
      "scripts/verify-external-voxel-reference-adapter.mjs",
      "scripts/verify-cityworld-derived-terrain-maps.mjs",
      "scripts/verify-cityworld-mobile-occlusion.mjs",
      "scripts/verify-alpha-rc-split.mjs",
    ],
    expectedNextArtifacts: [],
    requiredDocPatterns: [
      ["docs/BIG4_ARTIFACT_OPERATING_MODEL.md", /E15 Expanded Voxel-Engine Artifact Cycle/],
      ["docs/AXIOM_BIG4_ARTIFACT_DISPATCH.md", /Axiom integration order/i],
      ["docs/AXIOM_BIG4_WAKEUP_PROTOCOL.md", /Latest 1-2 turns from Forge, Lumen, and Mira/],
      ["docs/AXIOM_ENGINE_REFERENCE_STACK.md", /ChatGPT App Skill Adoption/],
      ["docs/AXIOM_ENGINE_REFERENCE_STACK.md", /Voxel And Isometric Engine References/],
      ["docs/AXIOM_ENGINE_REFERENCE_STACK.md", /GameBlocks/],
      ["docs/GAMEBLOCKS_ATLAS_ADAPTER.md", /WorldBasis/],
      ["docs/GAMEBLOCKS_ATLAS_ADAPTER.md", /not as a runtime dependency/],
      ["docs/AXIOM_ENGINE_REFERENCE_STACK.md", /External Voxel Reference Adapter/],
      ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /VoxCity/],
      ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /VoxelSpace/],
      ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /Pixels2Voxels/],
      ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /Do not vendor VoxCity, VoxelSpace, or Pixels2Voxels/],
      ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /verify-cityworld-derived-terrain-maps/],
      ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /verify-cityworld-mobile-occlusion/],
      ["docs/AXIOM_ENGINE_REFERENCE_STACK.md", /Object category reads before labels/],
    ],
  },
];

const packetResults = packets.map(evaluatePacket);
const blockers = packetResults.flatMap((result) => result.blockers.map((message) => `${result.owner}: ${message}`));

const summary = {
  ok: blockers.length === 0,
  packetCount: packets.length,
  blockers,
  packets: packetResults,
};

if (args.jsonOnly) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`Big 4 artifact packets: ${summary.ok ? "ok" : "blocked"}`);
  for (const packet of packetResults) {
    console.log(`- ${packet.owner} ${packet.packet}: ${packet.blockers.length === 0 ? "ready" : "blocked"}`);
    for (const blocker of packet.blockers) {
      console.log(`  - ${blocker}`);
    }
    for (const warning of packet.warnings) {
      console.log(`  - warning: ${warning}`);
    }
  }
}

if (!summary.ok) {
  process.exitCode = 1;
}

function evaluatePacket(packet) {
  const missingRequiredPaths = packet.requiredPaths.filter((path) => !existsSync(path));
  const missingExpectedNextArtifacts = packet.expectedNextArtifacts.filter((path) => !existsSync(path));
  const missingDocPatterns = [];

  for (const [path, pattern] of packet.requiredDocPatterns) {
    if (!existsSync(path)) {
      missingDocPatterns.push(`${path} is missing.`);
      continue;
    }
    const text = readFileSync(path, "utf8");
    if (!pattern.test(text)) {
      missingDocPatterns.push(`${path} does not mention ${pattern}.`);
    }
  }

  return {
    owner: packet.owner,
    packet: packet.packet,
    ready: missingRequiredPaths.length === 0 && missingDocPatterns.length === 0,
    blockers: [
      ...missingRequiredPaths.map((path) => `required artifact missing: ${path}`),
      ...missingDocPatterns,
    ],
    warnings: missingExpectedNextArtifacts.map((path) => `next artifact not present yet: ${path}`),
    requiredPaths: packet.requiredPaths,
    expectedNextArtifacts: packet.expectedNextArtifacts,
  };
}

function parseArgs(argv) {
  const parsed = {
    jsonOnly: false,
  };

  for (const arg of argv) {
    if (arg === "--json-only") {
      parsed.jsonOnly = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}
