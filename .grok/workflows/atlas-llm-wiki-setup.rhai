let meta = #{
    name: "atlas-llm-wiki-setup",
    description: "Scaffold, ingest canonical Atlas sources, compile, and lint the Atlas LLM wiki",
    when_to_use: "First-time Atlas llm-wiki setup, or re-ingest after AGENTS/STATUS/policy changes",
    phases: [
        #{ title: "Locate", detail: "confirm Atlas repo and wiki root" },
        #{ title: "Scaffold", detail: "ensure llm-wiki tree and schema" },
        #{ title: "Ingest", detail: "canonical sources in parallel" },
        #{ title: "Compile", detail: "rebuild index from wiki pages" },
        #{ title: "Lint", detail: "dead links, orphans, index coverage" },
    ],
};

let locate_schema = #{
    "type": "object",
    "required": ["ok", "root", "wiki_root", "missing"],
    "properties": #{
        "ok": #{ "type": "boolean" },
        "root": #{ "type": "string" },
        "wiki_root": #{ "type": "string" },
        "missing": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 20 },
        "notes": #{ "type": "string" },
    },
};

let scaffold_schema = #{
    "type": "object",
    "required": ["ok", "created_or_verified", "notes"],
    "properties": #{
        "ok": #{ "type": "boolean" },
        "created_or_verified": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 30 },
        "notes": #{ "type": "string" },
        "blocked": #{ "type": "boolean" },
        "block_reason": #{ "type": "string" },
    },
};

let ingest_schema = #{
    "type": "object",
    "required": ["slug", "ok", "pages_written"],
    "properties": #{
        "slug": #{ "type": "string" },
        "ok": #{ "type": "boolean" },
        "pages_written": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 15 },
        "notes": #{ "type": "string" },
        "skipped": #{ "type": "boolean" },
        "skip_reason": #{ "type": "string" },
    },
};

let compile_schema = #{
    "type": "object",
    "required": ["ok", "index_updated", "pages_listed"],
    "properties": #{
        "ok": #{ "type": "boolean" },
        "index_updated": #{ "type": "boolean" },
        "pages_listed": #{ "type": "number" },
        "splits": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 10 },
        "notes": #{ "type": "string" },
    },
};

let lint_schema = #{
    "type": "object",
    "required": ["ok", "issue_count", "issues"],
    "properties": #{
        "ok": #{ "type": "boolean" },
        "issue_count": #{ "type": "number" },
        "issues": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 20 },
        "fixed": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 20 },
        "notes": #{ "type": "string" },
    },
};

let mode = if args == () { () } else { args.mode };
let root = if args == () { () } else { args.root };
if mode == () { mode = "full"; }
if root == () { root = "C:/Users/mzwin/Documents/Atlas"; }
let wiki_root = root + "/llm-wiki";
let mode_json = json_encode(mode);
let root_json = json_encode(root);
let wiki_json = json_encode(wiki_root);

// ---- Locate ----------------------------------------------------------------
phase("Locate");
log("Locating Atlas wiki at " + wiki_root);

let locate_prompt = "";
locate_prompt += "You are locating the Atlas LLM wiki. Use read_file, list_dir, grep. Do not invent paths.\n";
locate_prompt += "Repo root (JSON): " + root_json + "\n";
locate_prompt += "Expected wiki root (JSON): " + wiki_json + "\n\n";
locate_prompt += "REQUIRED checks (read or list each):\n";
locate_prompt += "1. AGENTS.md exists at repo root\n";
locate_prompt += "2. docs/STATUS.md exists\n";
locate_prompt += "3. scripts/lib/atlas-tool-surface.mjs exists\n";
locate_prompt += "4. llm-wiki/ exists or is missing\n";
locate_prompt += "5. llm-wiki/CLAUDE.md and llm-wiki/wiki/index.md if present\n";
locate_prompt += "6. llm-wiki/scripts/lint_wiki.py if present\n\n";
locate_prompt += "Set ok=true only if AGENTS.md and docs/STATUS.md exist.\n";
locate_prompt += "missing: paths that should exist for a full wiki run but do not.\n";
locate_prompt += "Return root and wiki_root as the actual paths you verified.\n";

let located = agent(locate_prompt, #{
    label: "locate",
    capability_mode: "read-only",
    output_schema: locate_schema,
});

if located == () || !located.success || located.output == () {
    complete(#{ summary: "Locate failed — Atlas root missing AGENTS.md or STATUS.md", ok: false });
}
if located.output.ok == false {
    complete(#{ summary: "Locate failed — Atlas root missing AGENTS.md or STATUS.md", ok: false, locate: located.output });
}

// ---- Scaffold --------------------------------------------------------------
phase("Scaffold");
log("Scaffolding llm-wiki tree if needed");

let scaffold_prompt = "";
scaffold_prompt += "You are scaffolding the Atlas LLM wiki (Karpathy llm-wiki pattern).\n";
scaffold_prompt += "Repo (JSON): " + root_json + "\n";
scaffold_prompt += "Wiki root (JSON): " + wiki_json + "\n";
scaffold_prompt += "Mode (JSON): " + mode_json + "\n\n";
scaffold_prompt += "REQUIRED: use list_dir and read_file first. Create only what is missing.\n";
scaffold_prompt += "Tree required under llm-wiki/: CLAUDE.md, wiki/index.md, wiki/concepts/, wiki/entities/, wiki/summaries/, raw/articles/, raw/papers/, raw/notes/, raw/refs/, log/, audit/, audit/resolved/, outputs/queries/, scripts/lint_wiki.py, scripts/audit_review.py, scripts/scaffold.py.\n";
scaffold_prompt += "If CLAUDE.md is missing or still a blank template, write an Atlas-specific schema: current ChatGPT Census atlas, hard stops, no restating tool names, wiki lives in llm-wiki/ not repo root.\n";
scaffold_prompt += "If wiki/index.md is missing, write the category skeleton (Concepts / Entities / Summaries / Open Questions).\n";
scaffold_prompt += "If scripts are missing, copy from C:/Users/mzwin/.grok/skills/llm-wiki/scripts/ using read_file then write.\n";
scaffold_prompt += "Append a scaffold line to log/YYYYMMDD.md (today from the environment; if unknown use 20260910).\n";
scaffold_prompt += "Do not ingest historical docs/ archive. Do not restore retired voxel/Clawd/Google surfaces.\n";
scaffold_prompt += "Do not edit product code outside llm-wiki/ except you may leave product files untouched.\n";
scaffold_prompt += "Return created_or_verified as the paths you checked.\n";

let scaffolded = agent(scaffold_prompt, #{
    label: "scaffold",
    capability_mode: "read-write",
    output_schema: scaffold_schema,
});

if scaffolded == () || !scaffolded.success || scaffolded.output == () {
    complete(#{ summary: "Scaffold failed", ok: false, locate: located.output });
}
if scaffolded.output.ok == false {
    complete(#{ summary: "Scaffold failed", ok: false, locate: located.output, scaffold: scaffolded.output });
}

if mode == "setup" {
    let setup_report = "";
    setup_report += "# Atlas LLM wiki setup\n\n";
    setup_report += "Mode: setup (scaffold only).\n\n";
    setup_report += "Wiki root: " + wiki_root + "\n\n";
    if scaffolded.output.notes != () { setup_report += scaffolded.output.notes + "\n"; }
    let setup_path = write_scratch_file("atlas-wiki-setup.md", setup_report);
    complete(#{ summary: "Wiki scaffold verified", path: setup_path, ok: true, mode: mode });
}

// ---- Ingest ----------------------------------------------------------------
phase("Ingest");
log("Ingesting canonical Atlas sources");

let source_specs = [
    #{ slug: "agents-md", path: "AGENTS.md", kind: "router" },
    #{ slug: "status-md", path: "docs/STATUS.md", kind: "status" },
    #{ slug: "project-plan", path: "docs/brain/PROJECT_PLAN.md", kind: "plan" },
    #{ slug: "brain-readme", path: "docs/brain/README.md", kind: "brain" },
    #{ slug: "design-md", path: "DESIGN.md", kind: "design" },
    #{ slug: "chatgpt-handoff", path: "CHATGPT.md", kind: "handoff" },
    #{ slug: "github-map", path: "GITHUB.md", kind: "handoff" },
    #{ slug: "tool-surface", path: "scripts/lib/atlas-tool-surface.mjs", kind: "contract" },
];

if mode == "lint" {
    source_specs = [];
}

let ingest_jobs = [];
for spec in source_specs {
    let p = "";
    p += "You are ingesting ONE Atlas source into the LLM wiki. Use read_file. Do not invent quotes.\n";
    p += "Repo (JSON): " + root_json + "\n";
    p += "Wiki root (JSON): " + wiki_json + "\n";
    p += "Source slug: " + spec.slug + "\n";
    p += "Source path relative to repo: " + spec.path + "\n";
    p += "Kind: " + spec.kind + "\n\n";
    p += "Steps:\n";
    p += "1. Read the source in full. If missing, set ok=false, skipped=true, skip_reason=missing, pages_written=[].\n";
    p += "2. Write or update llm-wiki/raw/refs/<slug>.md as a pointer (kind: ref, external_path: the repo-relative path).\n";
    p += "3. Write llm-wiki/wiki/summaries/<slug>.md (200-400 words, takeaways, YAML frontmatter).\n";
    p += "4. Update at most two concept or entity pages that this source actually changes. Do not create a page that duplicates another source's job.\n";
    p += "5. Laws: do not copy the MCP tool name list into prose — point at scripts/lib/atlas-tool-surface.mjs. Historical docs are not current law. Hard stops stay deleted.\n";
    p += "6. Append one log line to llm-wiki/log/YYYYMMDD.md: ## [HH:MM] ingest | <slug>\n";
    p += "Return slug, ok, pages_written (wiki-relative paths), notes.\n";
    ingest_jobs.push(#{
        prompt: p,
        label: "ingest:" + spec.slug,
        capability_mode: "read-write",
        output_schema: ingest_schema,
    });
}

let ingest_results = [];
if ingest_jobs.len() > 0 {
    ingest_results = parallel(ingest_jobs);
}

if mode == "ingest" {
    let n_ok = 0;
    let n_all = ingest_results.len();
    for r in ingest_results {
        if r != () && r.success && r.output != () && r.output.ok == true { n_ok += 1; }
    }
    complete(#{ summary: n_ok.to_string() + "/" + n_all.to_string() + " sources ingested", ok: n_ok > 0 });
}

// ---- Compile ---------------------------------------------------------------
phase("Compile");
log("Compiling wiki index");

let ingest_json = json_encode(ingest_results);
let compile_prompt = "";
compile_prompt += "You are compiling the Atlas LLM wiki index. Use list_dir and read_file on llm-wiki/wiki/.\n";
compile_prompt += "Wiki root (JSON): " + wiki_json + "\n";
compile_prompt += "Ingest results JSON: " + ingest_json + "\n\n";
compile_prompt += "REQUIRED:\n";
compile_prompt += "1. List every .md under wiki/concepts, wiki/entities, wiki/summaries.\n";
compile_prompt += "2. Rebuild wiki/index.md so every page appears exactly once, grouped by Concepts / Entities / Summaries / Open Questions.\n";
compile_prompt += "3. One-line summary per bullet. Folder-split topics use indented bullets.\n";
compile_prompt += "4. If any concept page is over ~1200 words, do NOT split in this run; list it in splits[] as a proposal.\n";
compile_prompt += "5. Update llm-wiki/CLAUDE.md Current articles to match the index.\n";
compile_prompt += "6. Log: ## [HH:MM] compile | rebuilt index\n";
compile_prompt += "Do not ingest new sources. Do not edit product code outside llm-wiki/.\n";
compile_prompt += "pages_listed = number of wiki pages excluding index.md.\n";

let compiled = agent(compile_prompt, #{
    label: "compile",
    capability_mode: "read-write",
    output_schema: compile_schema,
});

if compiled == () || !compiled.success || compiled.output == () {
    complete(#{ summary: "Compile failed", ok: false });
}

if mode == "compile" {
    complete(#{ summary: "Compile complete", ok: compiled.output.ok, compile: compiled.output });
}

// ---- Lint ------------------------------------------------------------------
phase("Lint");
log("Linting Atlas LLM wiki");

let lint_prompt = "";
lint_prompt += "You are linting the Atlas LLM wiki. FAIL CLOSED on invented fixes.\n";
lint_prompt += "Wiki root (JSON): " + wiki_json + "\n\n";
lint_prompt += "REQUIRED:\n";
lint_prompt += "1. Run: python llm-wiki/scripts/lint_wiki.py llm-wiki   (cwd = Atlas repo root " + root + ")\n";
lint_prompt += "2. Read the output. issue_count = number of issues reported. ok=true only if the script exits 0.\n";
lint_prompt += "3. You MAY fix dead wikilinks and missing index entries that you can prove by reading the files. Do not invent pages to silence orphans unless the page is clearly a stub that should exist from CLAUDE.md Current articles.\n";
lint_prompt += "4. Re-run lint after fixes. Put remaining issues in issues[]. Put fixes in fixed[].\n";
lint_prompt += "5. Log: ## [HH:MM] lint | N issues found, M fixed\n";
lint_prompt += "If the python script is missing, ok=false and issues=[\"lint_wiki.py missing\"].\n";

let linted = agent(lint_prompt, #{
    label: "lint",
    capability_mode: "all",
    output_schema: lint_schema,
});

if linted == () || !linted.success || linted.output == () {
    complete(#{ summary: "Lint agent failed", ok: false, compile: compiled.output });
}

let report = "";
report += "# Atlas LLM wiki setup\n\n";
report += "Mode: " + mode + "\n\n";
report += "Wiki root: `" + wiki_root + "`\n\n";
report += "## Compile\n";
if compiled.output.notes != () { report += compiled.output.notes + "\n\n"; }
report += "pages_listed: " + compiled.output.pages_listed.to_string() + "\n\n";
report += "## Lint\n";
report += "ok: " + linted.output.ok.to_string() + "\n";
report += "issue_count: " + linted.output.issue_count.to_string() + "\n";
if linted.output.issues != () {
    for issue in linted.output.issues { report += "- " + issue + "\n"; }
}
report += "\nNext: read llm-wiki/CLAUDE.md and llm-wiki/wiki/index.md. Query with the llm-wiki skill. File human corrections in llm-wiki/audit/.\n";

let report_path = write_scratch_file("atlas-wiki-setup.md", report);
let summary = "Wiki lint issues=" + linted.output.issue_count.to_string();
complete(#{ summary: summary, path: report_path, ok: linted.output.ok, lint: linted.output, compile: compiled.output });
