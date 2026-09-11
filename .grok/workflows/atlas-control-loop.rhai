let meta = #{
    name: "atlas-control-loop",
    description: "Control-first Atlas packet loop: scout, implement, adversarially verify, write RESULT.md",
    when_to_use: "Map accuracy, plate population, seats, focus fly-to, or any Atlas control-env iteration",
    phases: [
        #{ title: "Scout", detail: "root cause + kill criteria + file list" },
        #{ title: "Build", detail: "smallest implement packet" },
        #{ title: "Verify", detail: "control gates + adversarial disprove" },
        #{ title: "Report", detail: "artifact RESULT.md" },
    ],
};

let plan_schema = #{
    "type": "object",
    "required": ["summary", "kill_criteria", "files", "verifier_commands", "packet_id"],
    "properties": #{
        "summary": #{ "type": "string" },
        "packet_id": #{ "type": "string" },
        "kill_criteria": #{ "type": "string" },
        "files": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 20 },
        "verifier_commands": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 10 },
        "risks": #{ "type": "string" },
    },
};

let build_schema = #{
    "type": "object",
    "required": ["changed_files", "commands_run", "notes"],
    "properties": #{
        "changed_files": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 30 },
        "commands_run": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 20 },
        "notes": #{ "type": "string" },
        "blocked": #{ "type": "boolean" },
        "block_reason": #{ "type": "string" },
    },
};

let verify_schema = #{
    "type": "object",
    "required": ["control_green", "evidence", "remaining_issues"],
    "properties": #{
        "control_green": #{ "type": "boolean" },
        "evidence": #{ "type": "string" },
        "remaining_issues": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 12 },
        "would_ship": #{ "type": "boolean" },
    },
};

// ---- args ------------------------------------------------------------------
let goal = if args == () { () } else { args.goal };
let mode = if args == () { () } else { args.mode };
let packet = if args == () { () } else { args.packet_id };
let root = if args == () { () } else { args.root };
if goal == () {
    pause("verification", "Pass args.goal — short description of the Atlas packet. Optional: mode=scout|implement, packet_id=slug, root=checkout path.");
}
if mode == () { mode = "implement"; }
if packet == () { packet = "packet"; }
if root == () { root = "."; }
let goal_json = json_encode(goal);
let mode_json = json_encode(mode);
let packet_json = json_encode(packet);

// ---- Scout -----------------------------------------------------------------
phase("Scout");
log("Scouting control-first plan for: " + goal);

let scout_prompt = "";
scout_prompt += "You are the Atlas Scout for a control-first packet loop.\n";
scout_prompt += "Repo root: " + root + "\n";
scout_prompt += "Goal (JSON): " + goal_json + "\n";
scout_prompt += "Mode (JSON): " + mode_json + "\n";
scout_prompt += "Packet id hint (JSON): " + packet_json + "\n\n";
scout_prompt += "REQUIRED: use read_file, grep, list_dir on the real repo. Do not invent paths.\n";
scout_prompt += "Read first: AGENTS.md, docs/STATUS.md, docs/brain/PROJECT_PLAN.md, DESIGN.md, scripts/lib/atlas-tool-surface.mjs.\n";
scout_prompt += "Do not treat docs/NORTH_FACE.md, STATE.md, or LOOP.md as current product law.\n";
scout_prompt += "Do not copy public tool names into your plan; cite scripts/lib/atlas-tool-surface.mjs.\n";
scout_prompt += "Inspect plate/map code under web/src/atlas/, server/src/atlasPlates.ts, packages/core/src/atlas/, scripts/verify-usa-accuracy-*.mjs.\n\n";
scout_prompt += "Return JSON matching the schema:\n";
scout_prompt += "- packet_id: short slug\n";
scout_prompt += "- summary: what is wrong / what to change (3-6 sentences)\n";
scout_prompt += "- kill_criteria: when to STOP/revert\n";
scout_prompt += "- files: concrete paths to touch\n";
scout_prompt += "- verifier_commands: exact pnpm/node commands that must go green\n";
scout_prompt += "- risks: honesty, perf, payload size\n";
scout_prompt += "Empty files[] is invalid unless you prove the goal is already shipped with evidence paths.\n";

let scout = agent(scout_prompt, #{
    label: "scout",
    capability_mode: "read-only",
    output_schema: plan_schema,
});

if scout == () || !scout.success || scout.output == () {
    complete(#{ summary: "Scout failed — no plan", ok: false });
}

let plan = scout.output;
let plan_id = plan.packet_id;
let plan_summary = plan.summary;
let plan_kill = plan.kill_criteria;
log("Plan packet_id=" + plan_id);

if mode == "scout" {
    let report = "";
    report += "# Scout only\n\n";
    report += "## Summary\n" + plan_summary + "\n\n";
    report += "## Kill criteria\n" + plan_kill + "\n\n";
    report += "## Files\n";
    if plan.files != () {
        for f in plan.files { report += "- " + f + "\n"; }
    }
    report += "\n## Verifiers\n";
    if plan.verifier_commands != () {
        for c in plan.verifier_commands { report += "- `" + c + "`\n"; }
    }
    let path = write_scratch_file("scout-report.md", report);
    complete(#{ summary: "Scout complete (no implement)", path: path, plan: plan, ok: true });
}

// ---- Build -----------------------------------------------------------------
phase("Build");
log("Implementing packet " + plan_id);

let plan_enc = json_encode(plan);
let build_prompt = "";
build_prompt += "You are the Atlas Builder. Implement ONE packet only.\n";
build_prompt += "Repo: " + root + "\n";
build_prompt += "Plan JSON: " + plan_enc + "\n\n";
build_prompt += "Laws:\n";
build_prompt += "- Control-first. Prefer changes proven by scripts/verify-usa-accuracy-control.mjs.\n";
build_prompt += "- 2D SVG plates are the product (web/src/atlas/). Do not resurrect national clay default.\n";
build_prompt += "- Census honesty: no fake streets/buildings; denser maps use more REAL places.\n";
build_prompt += "- r/place inspiration = dense settlement cells + hierarchy, not random noise.\n";
build_prompt += "- Do not add Mapbox as main renderer or bulk Google geometry.\n";
build_prompt += "- Public MCP tools are only those in scripts/lib/atlas-tool-surface.mjs. Do not restore retired names.\n";
build_prompt += "- Do not use the goal string as a filesystem path.\n\n";
build_prompt += "REQUIRED actions:\n";
build_prompt += "1. Read every file in plan.files before editing.\n";
build_prompt += "2. Implement the smallest change that satisfies the plan.\n";
build_prompt += "3. Run builds: pnpm build:web and/or pnpm build:server as needed.\n";
build_prompt += "4. If control server is needed, use PORT=8787 node server/dist/index.js (background) then run verifiers.\n";
build_prompt += "5. Prefer: pnpm verify:usa-accuracy-control\n\n";
build_prompt += "Return changed_files, commands_run, notes, blocked/block_reason.\n";
build_prompt += "Set blocked=true only if a human gate (deploy keys, ChatGPT, network census rebuild) blocks finish.\n";

let build = agent(build_prompt, #{
    label: "builder",
    capability_mode: "all",
    output_schema: build_schema,
});

if build == () || !build.success || build.output == () {
    complete(#{ summary: "Builder failed", ok: false, plan: plan });
}

if build.output.blocked == true {
    let br = if build.output.block_reason != () { build.output.block_reason } else { "unspecified" };
    complete(#{ summary: "Blocked: " + br, ok: false, plan: plan, build: build.output });
}

// ---- Verify ----------------------------------------------------------------
phase("Verify");
log("Adversarial verify — try to disprove green");

let build_enc = json_encode(build.output);
let verify_prompt = "";
verify_prompt += "You are the Atlas Verifier. Your job is to DISPROVE that the packet is done.\n";
verify_prompt += "Repo: " + root + "\n";
verify_prompt += "Plan JSON: " + plan_enc + "\n";
verify_prompt += "Build JSON: " + build_enc + "\n\n";
verify_prompt += "REQUIRED:\n";
verify_prompt += "1. Run pnpm verify:usa-accuracy-control (start server on 8787 if needed).\n";
verify_prompt += "2. Also run plan.verifier_commands if listed and applicable.\n";
verify_prompt += "3. Read artifacts/usa-accuracy/control/REPORT.md if present.\n";
verify_prompt += "4. Grep for regressions: select_county must not be public tools; provider geometry as spine banned.\n";
verify_prompt += "5. control_green=true ONLY if control verifier exit 0 and evidence string quotes real output.\n";
verify_prompt += "6. would_ship=true only if control_green and remaining_issues is empty or cosmetic-only.\n";
verify_prompt += "Fail closed: if you cannot run the verifier, control_green=false.\n";

let verify = agent(verify_prompt, #{
    label: "verifier",
    capability_mode: "all",
    output_schema: verify_schema,
});

if verify == () || !verify.success || verify.output == () {
    complete(#{ summary: "Verifier failed — treat as RED", ok: false, plan: plan, build: build.output });
}

// ---- Report ----------------------------------------------------------------
phase("Report");
log("Writing packet result");

let v = verify.output;
let green = v.control_green == true;
let report = "";
report += "# Packet: " + plan_id + "\n\n";
report += "Goal: " + goal + "\n\n";
report += "## Summary\n" + plan_summary + "\n\n";
report += "## Kill criteria\n" + plan_kill + "\n\n";
report += "## Build notes\n" + build.output.notes + "\n\n";
report += "## Control: ";
if green { report += "GREEN\n\n"; } else { report += "RED\n\n"; }
report += "### Evidence\n" + v.evidence + "\n\n";
report += "### Remaining issues\n";
if v.remaining_issues != () {
    for issue in v.remaining_issues { report += "- " + issue + "\n"; }
} else {
    report += "- (none listed)\n";
}
report += "\n## Would ship\n";
if v.would_ship == true { report += "yes\n"; } else { report += "no\n"; }
report += "\n## Next\n";
if green {
    report += "If population/accuracy: deploy then A4 ChatGPT Pro dogfood.\n";
} else {
    report += "Re-run atlas-control-loop with a tighter goal fixing remaining_issues.\n";
}

let scratch = write_scratch_file("RESULT.md", report);

// Best-effort copy into repo artifacts (builder may have done this; report path is scratch for sure)
let archive_prompt = "";
archive_prompt += "Write the following markdown to artifacts/agentic/" + plan_id + "/RESULT.md under " + root + ".\n";
archive_prompt += "Create directories. Overwrite if exists. Do not change product code.\n\n";
archive_prompt += report;
let archive = agent(archive_prompt, #{
    label: "archive",
    capability_mode: "read-write",
});

complete(#{
    summary: if green { "CONTROL GREEN — " + plan_id } else { "CONTROL RED — " + plan_id },
    ok: green,
    packet_id: plan_id,
    path: scratch,
    plan: plan,
    build: build.output,
    verify: v,
});
