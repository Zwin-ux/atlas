// Atlas document authority policy.
//
// The repository contains several generations of product direction. Keeping
// those records is useful; letting an agent mistake them for current
// instructions is not. This module gives every repository-visible document one
// deterministic lane. The generated registry and its verifier both import this
// file, so classification cannot drift between tools.

export const DOCUMENT_POLICY_VERSION = 1;

export const DOCUMENT_EXTENSIONS = Object.freeze([
  ".md",
  ".mdx",
  ".txt",
  ".rst",
  ".adoc",
]);

export const EXPLICIT_KNOWLEDGE_SOURCES = Object.freeze([
  ".github/workflows/ci.yml",
  "chatgpt-app-submission.json",
  "docs/brain/document-registry.jsonl",
  "docs/brain/notion.json",
  "package.json",
  "scripts/lib/atlas-tool-surface.mjs",
]);

const GENERATED_PATHS = new Set([
  "docs/brain/DOCUMENT_REGISTRY.md",
  "docs/brain/document-registry.jsonl",
]);

const EXACT_POLICY = new Map([
  [
    "AGENTS.md",
    {
      lane: "authority",
      authority: "canonical",
      readBeforeWork: true,
      reason: "Primary router for current Atlas work.",
    },
  ],
  [
    "docs/STATUS.md",
    {
      lane: "status",
      authority: "canonical",
      readBeforeWork: true,
      reason: "Only mutable local status and blocker record.",
    },
  ],
  [
    "scripts/lib/atlas-tool-surface.mjs",
    {
      lane: "execution-contract",
      authority: "canonical",
      readBeforeWork: true,
      reason: "Executable public tool-surface contract.",
    },
  ],
  [
    "package.json",
    {
      lane: "execution-contract",
      authority: "canonical",
      readBeforeWork: false,
      reason: "Executable command and dependency contract.",
    },
  ],
  [
    ".github/workflows/ci.yml",
    {
      lane: "execution-contract",
      authority: "active-reference",
      readBeforeWork: false,
      reason: "Current automated gate configuration.",
    },
  ],
  [
    "chatgpt-app-submission.json",
    {
      lane: "release",
      authority: "active-reference",
      readBeforeWork: false,
      reason: "Machine-readable ChatGPT app submission record.",
    },
  ],
  [
    "docs/brain/README.md",
    {
      lane: "brain",
      authority: "canonical",
      readBeforeWork: true,
      reason: "Local GBrain operating contract and query guide.",
    },
  ],
  [
    "docs/brain/PROJECT_PLAN.md",
    {
      lane: "planning",
      authority: "canonical",
      readBeforeWork: true,
      reason: "Repo-local project priorities and decisions; no connector required.",
    },
  ],
  [
    "docs/brain/notion.json",
    {
      lane: "planning",
      authority: "active-reference",
      readBeforeWork: false,
      reason: "Optional Notion mirror pointer; local planning never depends on fetching it.",
    },
  ],
  [
    "DESIGN.md",
    {
      lane: "design-system",
      authority: "active-reference",
      readBeforeWork: false,
      reason: "Durable visual and interaction direction for the current map surface.",
    },
  ],
  [
    "docs/superpowers/specs/2026-08-26-atlas-playable-maproom-design.md",
    {
      lane: "product-spec",
      authority: "review-required",
      readBeforeWork: false,
      reason: "Proposed WebMCP product contract awaiting explicit user approval.",
    },
  ],
  [
    "docs/superpowers/specs/2026-08-27-atlas-fieldbook-design.md",
    {
      lane: "product-spec",
      authority: "review-required",
      readBeforeWork: false,
      reason: "Proposed private Fieldbook contract awaiting explicit user approval.",
    },
  ],
  [
    ".github/ISSUE_TEMPLATE/atlas_quest.md",
    {
      lane: "operating-history",
      authority: "historical",
      readBeforeWork: false,
      reason: "Issue template still describes the retired multi-stage product loop.",
    },
  ],
  [
    "assets/brand/BRAND.md",
    {
      lane: "brand",
      authority: "active-reference",
      readBeforeWork: false,
      reason: "Current icon craft and palette reference; product claims still come from canonical sources.",
    },
  ],
  [
    "assets/generated/README.md",
    {
      lane: "source-archive",
      authority: "historical",
      readBeforeWork: false,
      reason: "Alpha placeholder-asset note retained for provenance.",
    },
  ],
  [
    "packages/assets/city-world/README.md",
    {
      lane: "source-archive",
      authority: "historical",
      readBeforeWork: false,
      reason: "Retired Pixi city-world asset lane.",
    },
  ],
  [
    "specs/atlas_all_public_notes_design.md",
    {
      lane: "document-history",
      authority: "historical",
      readBeforeWork: false,
      reason: "Retired Commons design retained for provenance.",
    },
  ],
  [
    "CHATGPT.md",
    {
      lane: "handoff",
      authority: "canonical",
      readBeforeWork: true,
      reason: "ChatGPT and external-agent front door for the current product tree.",
    },
  ],
  [
    "GITHUB.md",
    {
      lane: "handoff",
      authority: "canonical",
      readBeforeWork: false,
      reason: "Map of Atlas GitHub remotes and local worktrees.",
    },
  ],
  [
    "llm-wiki/CLAUDE.md",
    {
      lane: "wiki-schema",
      authority: "canonical",
      readBeforeWork: false,
      reason: "LLM wiki schema. Product law remains AGENTS.md.",
    },
  ],
  [
    "README.md",
    {
      lane: "public-overview",
      authority: "review-required",
      readBeforeWork: false,
      reason: "Public overview currently contains pre-pivot product claims and needs a focused rewrite.",
    },
  ],
  [
    "TODOS.md",
    {
      lane: "planning-history",
      authority: "review-required",
      readBeforeWork: false,
      reason: "Mixed pre-pivot and current tasks; use the local project plan and STATUS instead.",
    },
  ],
]);

export function isKnowledgeSource(path) {
  const normalized = normalizePath(path);
  if (EXPLICIT_KNOWLEDGE_SOURCES.includes(normalized)) return true;
  const lower = normalized.toLowerCase();
  return DOCUMENT_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export function classifyKnowledgeSource(path) {
  const normalized = normalizePath(path);
  const exact = EXACT_POLICY.get(normalized);
  if (exact) return withDefaults(normalized, exact);

  if (GENERATED_PATHS.has(normalized)) {
    return withDefaults(normalized, {
      lane: "brain",
      authority: "generated",
      readBeforeWork: false,
      reason: "Generated from the document policy; edit the policy or source documents instead.",
    });
  }

  if (normalized.startsWith("docs/legal/")) {
    return withDefaults(normalized, {
      lane: "policy",
      authority: "active-reference",
      readBeforeWork: false,
      reason: "Policy source; confirm the deployed route before making a live claim.",
    });
  }

  if (normalized.startsWith("artifacts/")) {
    return withDefaults(normalized, {
      lane: "evidence-history",
      authority: "historical",
      readBeforeWork: false,
      reason: "Point-in-time evidence from an earlier product or release slice.",
    });
  }

  if (
    normalized.startsWith("prompt-pack/") ||
    normalized.startsWith("engineering-prompt-pack/") ||
    normalized.startsWith("prompts/") ||
    normalized.startsWith("plugins/") ||
    normalized.startsWith("experiments/") ||
    normalized.startsWith("assets/prompts/")
  ) {
    return withDefaults(normalized, {
      lane: "source-archive",
      authority: "historical",
      readBeforeWork: false,
      reason: "Preserved prompt, skill, experiment, or source-pack material from an earlier Atlas generation.",
    });
  }

  if (normalized.startsWith("llm-wiki/")) {
    return withDefaults(normalized, {
      lane: "wiki",
      authority: "generated",
      readBeforeWork: false,
      reason: "Compiled LLM wiki; edit via ingest/compile/audit, not as product law.",
    });
  }

  if (normalized.startsWith("docs/brain/")) {
    return withDefaults(normalized, {
      lane: "brain-history",
      authority: "historical",
      readBeforeWork: false,
      reason: "Pre-pivot brain note retained for provenance, not current direction.",
    });
  }

  if (normalized.startsWith("docs/")) {
    return withDefaults(normalized, {
      lane: "document-history",
      authority: "historical",
      readBeforeWork: false,
      reason: "Pre-pivot document retained for provenance; current work starts from AGENTS and STATUS.",
    });
  }

  if (
    normalized === "STATE.md" ||
    normalized === "LOOP.md" ||
    normalized.startsWith("loop-") ||
    normalized === "design-qa.md"
  ) {
    return withDefaults(normalized, {
      lane: "operating-history",
      authority: "historical",
      readBeforeWork: false,
      reason: "Retired operating packet retained for provenance.",
    });
  }

  if (normalized.startsWith("data/")) {
    return withDefaults(normalized, {
      lane: "data-source",
      authority: "active-reference",
      readBeforeWork: false,
      reason: "Source dataset, not product direction.",
    });
  }

  return withDefaults(normalized, {
    lane: "reference",
    authority: "review-required",
    readBeforeWork: false,
    reason: "Repository-visible document without an explicit current authority decision.",
  });
}

export function canonicalReplacements(policy) {
  if (policy.authority === "historical" || policy.authority === "review-required") {
    return ["AGENTS.md", "docs/STATUS.md", "docs/brain/README.md"];
  }
  return [];
}

export function normalizePath(path) {
  return String(path).replaceAll("\\", "/").replace(/^\.\//, "");
}

function withDefaults(path, policy) {
  return Object.freeze({
    path,
    lane: policy.lane,
    authority: policy.authority,
    readBeforeWork: Boolean(policy.readBeforeWork),
    reason: policy.reason,
  });
}
