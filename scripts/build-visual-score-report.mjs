#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import { buildVisualScoreReport, visualScoreReportMarkdown } from "./lib/visual-score.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(repoRoot, "artifacts", "visual-score");
const jsonPath = path.join(outDir, "report.json");
const markdownPath = path.join(outDir, "REPORT.md");

const report = buildVisualScoreReport();

await mkdir(outDir, { recursive: true });
await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(markdownPath, visualScoreReportMarkdown(report), "utf8");

console.log(
  [
    `Atlas 0.79-1 visual score report: ${report.countyCount}/${report.expectedCountyCount} counties`,
    `median ${report.distribution.median} (floor ${report.floors.median})`,
    `min ${report.distribution.min} (hard floor ${report.floors.hard})`,
    `worst ${report.worst50[0]?.countySlug ?? "none"} ${report.worst50[0]?.score ?? "n/a"}`,
    `wrote ${path.relative(repoRoot, jsonPath)} and ${path.relative(repoRoot, markdownPath)}`,
  ].join("; "),
);

if (!report.gates.pass) {
  console.error("Visual score gates failed:");
  for (const [id, gate] of Object.entries(report.gates)) {
    if (id === "pass" || gate.pass) continue;
    console.error(`  ${id}: actual ${gate.actual}, floor ${gate.floor}`);
  }
  process.exit(1);
}
