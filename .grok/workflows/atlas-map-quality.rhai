let meta = #{
    name: "atlas-map-quality",
    description: "Parallel taste + accuracy critics on Atlas 2D plates; synthesize ranked fixes",
    when_to_use: "Visual population, r/place density, seat hierarchy, empty-looking counties",
    phases: [
        #{ title: "Critique", detail: "parallel critics" },
        #{ title: "Synthesize", detail: "ranked fix list" },
    ],
};

let critique_schema = #{
    "type": "object",
    "required": ["dimension", "score", "findings"],
    "properties": #{
        "dimension": #{ "type": "string" },
        "score": #{ "type": "number" },
        "findings": #{
            "type": "array",
            "maxItems": 8,
            "items": #{
                "type": "object",
                "required": ["issue", "severity", "evidence"],
                "properties": #{
                    "issue": #{ "type": "string" },
                    "severity": #{ "type": "string" },
                    "evidence": #{ "type": "string" },
                },
            },
        },
    },
};

let synth_schema = #{
    "type": "object",
    "required": ["top_fixes", "population_verdict", "notes"],
    "properties": #{
        "population_verdict": #{ "type": "string" },
        "notes": #{ "type": "string" },
        "top_fixes": #{
            "type": "array",
            "maxItems": 8,
            "items": #{
                "type": "object",
                "required": ["title", "why", "packet_hint"],
                "properties": #{
                    "title": #{ "type": "string" },
                    "why": #{ "type": "string" },
                    "packet_hint": #{ "type": "string" },
                },
            },
        },
    },
};

let counties = if args == () { () } else { args.counties };
if counties == () {
    counties = "miami-dade-fl,loving-tx,honolulu-hi,cook-il,riverside-ca";
}
let root = "C:/Users/mzwin/Documents/Atlas";
let counties_json = json_encode(counties);

phase("Critique");
log("Parallel map-quality critics");

let dimensions = [
    "population density and r/place settlement fabric",
    "seat and town label hierarchy",
    "honesty and Census truth",
    "mobile readability and declutter",
    "empty land / sparse counties still legible",
];

let jobs = [];
for d in dimensions {
    let p = "";
    p += "You are an Atlas map quality critic.\n";
    p += "Repo: " + root + "\n";
    p += "Dimension: " + d + "\n";
    p += "Focus counties (JSON): " + counties_json + "\n\n";
    p += "REQUIRED tool use:\n";
    p += "- Read web/src/atlas/AtlasPlate.tsx, plateGeometry.ts, atlas.css, townTiers in packages/core.\n";
    p += "- Read server/src/atlasPlates.ts and data/census method max anchors if needed.\n";
    p += "- Read docs/USA_ACCURACY_CONTROL_ENV.md and docs/AGENTIC_WORKFLOW.md.\n";
    p += "- If control server is up, fetch sample plate JSON via curl/fetch for one county; else note offline.\n\n";
    p += "Product: 2D SVG atlas plates inside ChatGPT. Inspiration: r/place density of activity + classic atlas hierarchy.\n";
    p += "Banned: generic SaaS UI, photoreal Google as main map, fake buildings.\n\n";
    p += "Score 0-10 for your dimension. findings[].severity is low|medium|high.\n";
    p += "evidence must cite file paths or HTTP observations you actually made.\n";
    p += "dimension field must equal: " + d + "\n";

    jobs.push(#{
        prompt: p,
        label: "critic",
        capability_mode: "read-only",
        output_schema: critique_schema,
    });
}

let results = parallel(jobs);

let critiques = [];
for r in results {
    if r != () && r.success && r.output != () {
        critiques.push(r.output);
    }
}

if critiques.len() == 0 {
    complete(#{ summary: "No critiques produced", ok: false });
}

phase("Synthesize");
log("Synthesizing ranked fixes");

let critiques_json = json_encode(critiques);
let s = "";
s += "You are the Atlas map quality synthesizer.\n";
s += "Repo: " + root + "\n";
s += "Critiques JSON: " + critiques_json + "\n\n";
s += "REQUIRED: read critiques carefully; optionally re-open 1-2 cited files to confirm.\n";
s += "Produce top_fixes (max 8) ordered by leverage for POPULATED 2D maps (r/place density + honest Census).\n";
s += "packet_hint should be a short goal string suitable for atlas-control-loop args.goal.\n";
s += "population_verdict: one paragraph on whether counties currently feel empty and why.\n";
s += "Do not invent file paths not in critiques unless you verify them.\n";

let synth = agent(s, #{
    label: "synthesize",
    capability_mode: "read-only",
    output_schema: synth_schema,
});

if synth == () || !synth.success || synth.output == () {
    complete(#{ summary: "Synthesize failed", ok: false, critiques: critiques });
}

let out = synth.output;
let report = "";
report += "# Atlas map quality\n\n";
report += "## Population verdict\n" + out.population_verdict + "\n\n";
report += "## Top fixes\n";
if out.top_fixes != () {
    for f in out.top_fixes {
        report += "### " + f.title + "\n";
        report += f.why + "\n";
        report += "Packet: `" + f.packet_hint + "`\n\n";
    }
}
report += "## Notes\n" + out.notes + "\n";

let path = write_scratch_file("map-quality.md", report);
complete(#{
    summary: "Map quality synthesis ready",
    ok: true,
    path: path,
    top_fixes: out.top_fixes,
    population_verdict: out.population_verdict,
    critique_count: critiques.len(),
});
