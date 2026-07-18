import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const args = parseArgs(process.argv.slice(2));
const mcpUrl = new URL(args.mcpUrl ?? process.env.ATLAS_MCP_URL ?? "http://127.0.0.1:8787/mcp");
const outPath = args.out ?? process.env.ATLAS_CHATGPT_ENTRY_PROOF_OUT;
const jsonOutPath = args.jsonOut ?? process.env.ATLAS_GOLDEN_PROMPT_PRODUCT_PROOF_OUT;
const districtSlug = args.district ?? "anaheim-candidate";
const expectedTools = [
  "ask_county_question",
  "get_upgrade_options",
  "lookup_world_places",
  "preview_campaign_engine",
  "preview_scout_drop",
  "render_voxel_county",
  "select_county",
];

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--mcp-url") parsed.mcpUrl = argv[++index];
    else if (arg === "--out") parsed.out = argv[++index];
    else if (arg === "--json-out") parsed.jsonOut = argv[++index];
    else if (arg === "--district") parsed.district = argv[++index];
    else if (arg === "--help") {
      console.log("Usage: node scripts/verify-chatgpt-entry-surface.mjs [--mcp-url URL] [--out docs/CHATGPT_ENTRY_SURFACE_PROOF.md] [--json-out artifacts/second-district/e15.6-golden-prompt-product-proof.json] [--district anaheim-candidate]");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function textContent(result, label) {
  assert(result && typeof result === "object", `${label} returned no result object.`);
  assert(!result.isError, `${label} returned an MCP error.`);
  assert(Array.isArray(result.content), `${label} returned no content array.`);
  return result.content.map((part) => (typeof part?.text === "string" ? part.text.trim() : "")).filter(Boolean).join("\n");
}

function structuredContent(result, label) {
  assert(result?.structuredContent && typeof result.structuredContent === "object", `${label} returned no structuredContent.`);
  return result.structuredContent;
}

function assertNoInternalLanguage(text, label) {
  assert(!/\b(compiler|GEOID|packet|verifier|structuredContent|_meta)\b/i.test(text), `${label} leaked internal implementation language.`);
}

function assertNoForbiddenProductClaims(text, label) {
  assert(
    !/saved campaign|saved to your account|XP granted|evidence submitted|automation started|paid ads launched|checkout|webhook|OAuth/i.test(text),
    `${label} makes a forbidden product claim.`,
  );
}

function assertIncludes(text, pattern, label, expectation) {
  assert(pattern.test(text), `${label} must say ${expectation}.`);
}

function checkPublicText(label, text, checks) {
  assertNoInternalLanguage(text, label);
  assertNoForbiddenProductClaims(text, label);
  for (const [pattern, expectation] of checks) {
    assertIncludes(text, pattern, label, expectation);
  }
}

function createScenario(id, prompt, toolName, args, text, structured, checks) {
  checkPublicText(id, text, checks);
  return {
    id,
    prompt,
    toolName,
    arguments: args,
    status: "passed",
    userFacingText: text,
    structuredSummary: summarizeStructuredContent(structured),
  };
}

function summarizeStructuredContent(structured) {
  if (!structured || typeof structured !== "object") return {};
  if (structured.type === "voxelSceneSummary") {
    return {
      type: structured.type,
      selectedNodeId: structured.selectedNodeId ?? null,
      placeCount: Array.isArray(structured.places) ? structured.places.length : undefined,
    };
  }
  if (structured.type === "countyCoverageSummary") {
    return {
      type: structured.type,
      countySlug: structured.countySlug,
      coverageTier: structured.coverageTier,
      playableDistrictCount: structured.playableDistrictCount,
      placeCount: structured.placeCount,
      supported: structured.supported,
    };
  }
  if (structured.type === "countyQuestionAnswer") {
    return {
      type: structured.type,
      supported: structured.supported,
      topic: structured.topic,
    };
  }
  if (structured.type === "worldPlaceLookup") {
    return {
      type: structured.type,
      placeCount: Array.isArray(structured.places) ? structured.places.length : 0,
      categories: Array.isArray(structured.places) ? [...new Set(structured.places.map((place) => place.category))].sort() : [],
    };
  }
  return { type: structured.type ?? "unknown" };
}

function proofSection(title, text) {
  return `### ${title}\n\n\`\`\`text\n${text.replaceAll("```", "'''")}\n\`\`\`\n`;
}

const client = new Client({
  name: "atlas-chatgpt-entry-surface-verifier",
  version: "0.1.0",
});
const transport = new StreamableHTTPClientTransport(mcpUrl);

const proof = {
  proofKind: "chatgptEntrySurfaceProof",
  version: "e15.6",
  mcpUrl: mcpUrl.toString(),
  checkedAt: new Date().toISOString(),
  districtSlug,
  proofStatus: "passed",
  promotionReady: false,
  publicPlayable: false,
  miraAcceptance: false,
  productBoundary: {
    riversidePlayableNow: true,
    previewCountiesArePreviewOnly: true,
    lookupNotSaved: true,
    lookupNotCoverageProof: true,
    noInternalLanguage: true,
    noPersistencePaidXpEvidenceAutomationClaims: true,
    sevenToolListStable: true,
  },
  scenarios: [],
  toolTexts: {},
  structuredSummary: {},
};

try {
  await client.connect(transport);

  const tools = (await client.listTools()).tools ?? [];
  const actualTools = tools.map((tool) => tool.name).sort();
  assert(JSON.stringify(actualTools) === JSON.stringify(expectedTools), `Unexpected tools: ${actualTools.join(", ")}`);

  const selectPlayableResult = await client.callTool({
    name: "select_county",
    arguments: { countySlug: "riverside-ca" },
  });
  const selectPlayableText = textContent(selectPlayableResult, "select_county playable");
  const selectPlayable = structuredContent(selectPlayableResult, "select_county playable");
  checkPublicText("select_county playable", selectPlayableText, [
    [/Eastvale is the full map/i, "Eastvale is the full map"],
    [/notes that stay in this chat/i, "notes stay in this chat"],
  ]);
  assert(selectPlayable.type === "voxelSceneSummary", "select_county playable must return a scene summary.");
  proof.scenarios.push(
    createScenario(
      "direct-play-riverside",
      "I want to play Atlas now. Open the playable county map.",
      "select_county",
      { countySlug: "riverside-ca" },
      selectPlayableText,
      selectPlayable,
      [
        [/Eastvale is the full map/i, "Eastvale is the full map"],
        [/notes that stay in this chat/i, "notes stay in this chat"],
      ],
    ),
  );
  proof.toolTexts.selectCountyPlayable = selectPlayableText;
  proof.structuredSummary.selectCountyPlayable = {
    type: selectPlayable.type,
    selectedNodeId: selectPlayable.selectedNodeId,
  };

  const selectShellResult = await client.callTool({
    name: "select_county",
    arguments: { countySlug: "orange-ca" },
  });
  const selectShellText = textContent(selectShellResult, "select_county shell");
  const selectShell = structuredContent(selectShellResult, "select_county shell");
  checkPublicText("select_county shell", selectShellText, [
    [/preview only/i, "preview counties are preview only"],
    [/Riverside\/Eastvale is fully explorable today/i, "Riverside/Eastvale is fully explorable today"],
    [/does not add verified streets, buildings, businesses/i, "Atlas does not add fake local coverage"],
    [/Real Census town names are attached/i, "real Census town anchors are attached"],
    [/saved work, XP, evidence, outreach, or automation/i, "no saved work, XP, evidence, outreach, or automation"],
  ]);
  assert(selectShell.coverageTier === "L1_COUNTY_SHELL", "select_county shell must return L1 shell coverage.");
  assert(selectShell.playableDistrictCount === 0, "select_county shell must not claim playable districts.");
  assert(selectShellResult._meta?.generatedDraftSpec?.sourceBasis === "census_identity_and_town_anchors", "select_county shell must carry Census town anchors by default.");
  proof.scenarios.push(
    createScenario(
      "shell-browse-orange",
      "Show me Orange County in Atlas.",
      "select_county",
      { countySlug: "orange-ca" },
      selectShellText,
      selectShell,
      [
        [/preview only/i, "preview counties are preview only"],
        [/Riverside\/Eastvale is fully explorable today/i, "Riverside/Eastvale is fully explorable today"],
        [/does not add verified streets, buildings, businesses/i, "Atlas does not add fake local coverage"],
        [/Real Census town names are attached/i, "real Census town anchors are attached"],
        [/saved work, XP, evidence, outreach, or automation/i, "no saved work, XP, evidence, outreach, or automation"],
      ],
    ),
  );
  proof.toolTexts.selectCountyShell = selectShellText;
  proof.structuredSummary.selectCountyShell = {
    type: selectShell.type,
    coverageTier: selectShell.coverageTier,
    playableDistrictCount: selectShell.playableDistrictCount,
    placeCount: selectShell.placeCount,
  };

  const renderPlayableResult = await client.callTool({
    name: "render_voxel_county",
    arguments: { countySlug: "riverside-ca", selectedNodeId: "eastvale" },
  });
  const renderPlayableText = textContent(renderPlayableResult, "render_voxel_county playable");
  const renderPlayable = structuredContent(renderPlayableResult, "render_voxel_county playable");
  checkPublicText("render_voxel_county playable", renderPlayableText, [
    [/Riverside\/Eastvale full map/i, "Riverside/Eastvale full map"],
    [/Pins and notes stay in this chat/i, "pins and notes stay in chat"],
  ]);
  assert(renderPlayable.type === "voxelSceneSummary", "render_voxel_county playable must return a scene summary.");
  proof.toolTexts.renderVoxelCountyPlayable = renderPlayableText;
  proof.structuredSummary.renderVoxelCountyPlayable = {
    type: renderPlayable.type,
    selectedNodeId: renderPlayable.selectedNodeId,
  };

  const renderShellResult = await client.callTool({
    name: "render_voxel_county",
    arguments: { countySlug: "orange-ca" },
  });
  const renderShellText = textContent(renderShellResult, "render_voxel_county shell");
  const renderShell = structuredContent(renderShellResult, "render_voxel_county shell");
  checkPublicText("render_voxel_county shell", renderShellText, [
    [/preview only/i, "preview render is preview only"],
    [/Real Census town names are attached/i, "real Census town anchors are attached"],
    [/Open Riverside\/Eastvale for the fully explorable map/i, "Riverside/Eastvale full-map path"],
  ]);
  assert(renderShell.coverageTier === "L1_COUNTY_SHELL", "render_voxel_county shell must return L1 shell coverage.");
  assert(renderShellResult._meta?.generatedDraftSpec?.sourceBasis === "census_identity_and_town_anchors", "render_voxel_county shell must carry Census town anchors by default.");
  proof.scenarios.push(
    createScenario(
      "negative-anaheim-not-playable",
      "Is Anaheim playable in Atlas right now?",
      "render_voxel_county",
      { countySlug: "orange-ca" },
      renderShellText,
      renderShell,
      [
        [/preview only/i, "Anaheim's county preview is preview only"],
        [/Real Census town names are attached/i, "real Census town anchors are attached"],
        [/Open Riverside\/Eastvale for the fully explorable map/i, "Riverside/Eastvale full-map path"],
      ],
    ),
  );
  proof.toolTexts.renderVoxelCountyShell = renderShellText;
  proof.structuredSummary.renderVoxelCountyShell = {
    type: renderShell.type,
    coverageTier: renderShell.coverageTier,
    playableDistrictCount: renderShell.playableDistrictCount,
    placeCount: renderShell.placeCount,
  };

  const questionResult = await client.callTool({
    name: "ask_county_question",
    arguments: {
      countySlug: "riverside-ca",
      question: "Which signals support mobile detailing in Eastvale?",
      businessType: "mobile detailing",
    },
  });
  const questionText = textContent(questionResult, "ask_county_question");
  const question = structuredContent(questionResult, "ask_county_question");
  checkPublicText("ask_county_question", questionText, [
    [/Riverside\/Eastvale answer/i, "Riverside/Eastvale boundary"],
    [/No saves, XP, evidence, or automation/i, "no saves, XP, evidence, or automation"],
  ]);
  assert(question.type === "countyQuestionAnswer", "ask_county_question must return countyQuestionAnswer.");
  proof.toolTexts.askCountyQuestion = questionText;
  proof.structuredSummary.askCountyQuestion = {
    type: question.type,
    supported: question.supported,
    topic: question.topic,
  };

  const lookupResult = await client.callTool({
    name: "lookup_world_places",
    arguments: { countySlug: "riverside-ca", placeId: "eastvale", radiusMeters: 4187 },
  });
  const lookupText = textContent(lookupResult, "lookup_world_places");
  const lookup = structuredContent(lookupResult, "lookup_world_places");
  checkPublicText("lookup_world_places", lookupText, [
    [/lookup-only/i, "lookup-only results"],
    [/not saved/i, "lookup is not saved"],
    [/not coverage proof/i, "lookup is not coverage proof"],
    [/does not unlock a full county map/i, "lookup does not unlock a full map"],
  ]);
  assert(lookup.type === "worldPlaceLookup", "lookup_world_places must return worldPlaceLookup.");
  assert(Array.isArray(lookup.places) && lookup.places.length > 0, "lookup_world_places must return places.");
  proof.scenarios.push(
    createScenario(
      "lookup-places-not-saved",
      "Look up places near Eastvale. Do not save them or treat them as county readiness.",
      "lookup_world_places",
      { countySlug: "riverside-ca", placeId: "eastvale", radiusMeters: 4187 },
      lookupText,
      lookup,
      [
        [/lookup-only/i, "lookup-only results"],
        [/not saved/i, "lookup is not saved"],
        [/not coverage proof/i, "lookup is not coverage proof"],
        [/does not unlock a full county map/i, "lookup does not unlock a full map"],
      ],
    ),
  );
  proof.toolTexts.lookupWorldPlaces = lookupText;
  proof.structuredSummary.lookupWorldPlaces = {
    type: lookup.type,
    placeCount: lookup.places.length,
    categories: [...new Set(lookup.places.map((place) => place.category))].sort(),
  };

  const unsupportedResult = await client.callTool({
    name: "select_county",
    arguments: { countySlug: "made-up-ca" },
  });
  const unsupportedText = textContent(unsupportedResult, "select_county unsupported");
  const unsupported = structuredContent(unsupportedResult, "select_county unsupported");
  checkPublicText("select_county unsupported", unsupportedText, [
    [/cannot preview this county yet|preview only/i, "unknown counties do not become full maps"],
    [/Riverside\/Eastvale is fully explorable today|Open Riverside\/Eastvale/i, "Riverside/Eastvale recovery"],
    [/does not add verified streets, buildings, businesses|does not use Riverside data as a stand-in/i, "Atlas does not invent local coverage"],
    [/saved work, XP, evidence, outreach, or automation|saves, XP, evidence, or automation/i, "no saved work, XP, evidence, or automation"],
  ]);
  assert(unsupported.coverageTier === "L0_UNSUPPORTED", "Unsupported county must return L0 coverage.");
  assert(unsupported.playableDistrictCount === 0, "Unsupported county must not claim playable districts.");
  proof.scenarios.push(
    createScenario(
      "unsupported-unknown-county",
      "Open Made Up County in Atlas.",
      "select_county",
      { countySlug: "made-up-ca" },
      unsupportedText,
      unsupported,
      [
        [/cannot preview this county yet|preview only/i, "unknown counties do not become full maps"],
        [/Riverside\/Eastvale is fully explorable today|Open Riverside\/Eastvale/i, "Riverside/Eastvale recovery"],
        [/does not add verified streets, buildings, businesses|does not use Riverside data as a stand-in/i, "Atlas does not invent local coverage"],
        [/saved work, XP, evidence, outreach, or automation|saves, XP, evidence, or automation/i, "no saved work, XP, evidence, or automation"],
      ],
    ),
  );
  proof.toolTexts.selectCountyUnsupported = unsupportedText;
  proof.structuredSummary.selectCountyUnsupported = summarizeStructuredContent(unsupported);

  if (outPath) {
    const markdown = [
      "# ChatGPT Entry Surface Proof",
      "",
      `Generated: ${proof.checkedAt}`,
      "",
      "## Product Model Protected",
      "",
      "- Play Riverside/Eastvale now.",
      "- Show preview-only counties honestly.",
      "- Lookup places without saving or proving county readiness.",
      "- Anaheim and Ontario remain non-public until visual/product/release gates pass.",
      "- Keep the seven-tool list stable.",
      "- Do not expose compiler, GEOID, packet, verifier, persistence, XP, evidence, automation, or paid language in user-facing tool responses.",
      "",
      "## Structured Summary",
      "",
      "```json",
      JSON.stringify(
        {
          districtSlug: proof.districtSlug,
          proofStatus: proof.proofStatus,
          promotionReady: proof.promotionReady,
          publicPlayable: proof.publicPlayable,
          miraAcceptance: proof.miraAcceptance,
          productBoundary: proof.productBoundary,
          scenarios: proof.scenarios.map((scenario) => ({
            id: scenario.id,
            status: scenario.status,
            toolName: scenario.toolName,
            structuredSummary: scenario.structuredSummary,
          })),
          structuredSummary: proof.structuredSummary,
        },
        null,
        2,
      ),
      "```",
      "",
      "## Exact Tool Response Text",
      "",
      proofSection("select_county: Riverside playable", proof.toolTexts.selectCountyPlayable),
      proofSection("select_county: Orange shell", proof.toolTexts.selectCountyShell),
      proofSection("render_voxel_county: Riverside playable", proof.toolTexts.renderVoxelCountyPlayable),
      proofSection("render_voxel_county: Orange shell", proof.toolTexts.renderVoxelCountyShell),
      proofSection("ask_county_question", proof.toolTexts.askCountyQuestion),
      proofSection("lookup_world_places", proof.toolTexts.lookupWorldPlaces),
      proofSection("select_county: unsupported county", proof.toolTexts.selectCountyUnsupported),
      "",
    ].join("\n");
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, markdown, "utf8");
  }

  if (jsonOutPath) {
    await mkdir(dirname(jsonOutPath), { recursive: true });
    await writeFile(jsonOutPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
  }

  console.log(JSON.stringify({ ok: true, proofPath: outPath ?? null, jsonProofPath: jsonOutPath ?? null, ...proof }, null, 2));
} finally {
  await client.close();
}
