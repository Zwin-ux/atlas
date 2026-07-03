import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const roots = ["web/src", "apps/widget/src"];
const forbidden = [
  /@googlemaps\//i,
  /google\.maps/i,
  /maps\.googleapis\.com/i,
  /places\.googleapis\.com/i,
  /\bGoogleMapsAdapter\b/,
  /\bGeoDataAdapter\b/,
  /@atlas\/geo\b/,
  /packages\/geo/i,
  /server\/src\/geo/i,
];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const blockers = [];

for (const root of roots) {
  for (const file of walk(root)) {
    const source = readFileSync(file, "utf8");
    for (const pattern of forbidden) {
      if (pattern.test(source)) {
        blockers.push({
          file: normalize(file),
          pattern: pattern.toString(),
        });
      }
    }
  }
}

const summary = {
  ok: blockers.length === 0,
  roots,
  blockerCount: blockers.length,
  blockers,
};

console.log(JSON.stringify(summary, null, 2));

if (blockers.length > 0) {
  process.exitCode = 1;
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      yield* walk(path);
      continue;
    }
    if (extensions.has(path.slice(path.lastIndexOf(".")))) {
      yield path;
    }
  }
}

function normalize(path) {
  return relative(process.cwd(), path).replaceAll("\\", "/");
}
