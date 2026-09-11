let meta = #{
    name: "atlas-ship-gate",
    description: "Fail-closed pre-deploy / pre-Pro-dogfood gates for Atlas",
    when_to_use: "Before deploy or ChatGPT Pro A4 acceptance",
    phases: [
        #{ title: "Gates", detail: "parallel hard checks" },
        #{ title: "Verdict", detail: "ship / no-ship" },
    ],
};

let gate_schema = #{
    "type": "object",
    "required": ["gate", "passed", "evidence"],
    "properties": #{
        "gate": #{ "type": "string" },
        "passed": #{ "type": "boolean" },
        "evidence": #{ "type": "string" },
        "blockers": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 10 },
    },
};

let target = if args == () { () } else { args.target };
if target == () { target = "control"; }

let root = "C:/Users/mzwin/Documents/Atlas";
let target_json = json_encode(target);

phase("Gates");
log("Running ship gates (fail closed)");

let gate_names = [
    "control_verifier",
    "tool_surface",
    "honesty_and_provider_boundary",
    "emulator_open_atlas_map",
];

let jobs = [];
for g in gate_names {
    let p = "";
    p += "You are an Atlas ship-gate checker. FAIL CLOSED.\n";
    p += "Repo: " + root + "\n";
    p += "Gate id: " + g + "\n";
    p += "Target (JSON): " + target_json + "\n\n";
    p += "Gate definitions:\n";
    p += "- control_verifier: run pnpm verify:usa-accuracy-control (start PORT=8787 server if needed). passed only if exit 0.\n";
    p += "- tool_surface: public tools must be exactly open_atlas_map + search_atlas_places. Check scripts/lib/atlas-tool-surface.mjs and/or live MCP tools/list. select_county must not be public.\n";
    p += "- honesty_and_provider_boundary: grep/read AGENTS.md, ProviderUsagePolicy, atlasTools — no provider geometry as scene spine; no fake buildings claims.\n";
    p += "- emulator_open_atlas_map: confirm web/src/emulator/mockHost.ts seeds open_atlas_map not select_county; toolResponseMetadata globals wired.\n\n";
    p += "Set gate field to exactly: " + g + "\n";
    p += "passed=true only with concrete evidence (command output quotes or file:line).\n";
    p += "If unsure, passed=false and list blockers.\n";

    jobs.push(#{
        prompt: p,
        label: "gate:" + g,
        capability_mode: "all",
        output_schema: gate_schema,
    });
}

let results = parallel(jobs);

let all_pass = true;
let gates = [];
let blockers = [];
for r in results {
    if r == () || !r.success || r.output == () {
        all_pass = false;
        blockers.push("gate agent failed or empty");
    } else {
        gates.push(r.output);
        if r.output.passed != true {
            all_pass = false;
            if r.output.blockers != () {
                for b in r.output.blockers { blockers.push(b); }
            } else {
                blockers.push(r.output.gate + " failed");
            }
        }
    }
}

phase("Verdict");

let report = "";
report += "# Atlas ship gate\n\n";
report += "Target: " + target + "\n\n";
if all_pass {
    report += "## VERDICT: SHIP-READY (control)\n\n";
    report += "Still required for users: deploy + ChatGPT Pro A4 dogfood.\n\n";
} else {
    report += "## VERDICT: NO SHIP\n\n";
}
report += "## Gates\n";
for g in gates {
    let mark = if g.passed == true { "PASS" } else { "FAIL" };
    report += "- **" + g.gate + "**: " + mark + " — " + g.evidence + "\n";
}
report += "\n## Blockers\n";
if blockers.len() == 0 {
    report += "- none\n";
} else {
    for b in blockers { report += "- " + b + "\n"; }
}

let path = write_scratch_file("ship-gate.md", report);
complete(#{
    summary: if all_pass { "SHIP-READY (control)" } else { "NO SHIP" },
    ok: all_pass,
    path: path,
    gates: gates,
    blockers: blockers,
});
