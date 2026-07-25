#!/usr/bin/env node
/**
 * Render an atlas plate to a standalone SVG file.
 *
 * This is the proof harness for the plate pipeline: projection, level of
 * detail, and ring codec all have to be right for the output to look like the
 * United States. It is also how plates get eyeballed without booting the
 * widget.
 *
 * Run:
 *   node scripts/render-atlas-plate.mjs --plate nation --out /tmp/nation.svg
 *   node scripts/render-atlas-plate.mjs --plate state --state ca --out /tmp/ca.svg
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { decodeRing } from "../packages/core/dist/atlas/ringCodec.js";
import {
  boundsOf,
  extentOf,
  fitToBox,
  projectionCenteredOn,
  projectNational,
} from "../packages/core/dist/atlas/projection.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function argValue(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
}

const plateKind = argValue("--plate", "nation");
const stateCode = argValue("--state", "ca");
const width = Number(argValue("--width", 1600));
const height = Number(argValue("--height", 1000));
const outPath = argValue("--out", join(ROOT, "artifacts", "atlas-plates", `${plateKind}.svg`));
const plateDir = argValue("--plates", join(ROOT, "artifacts", "atlas-plates"));

/**
 * Atlas palette. Muted paper tones so the geography carries the plate rather
 * than the colour: land reads as a single field, water is the only strong
 * hue, and boundaries are hairlines. This is how a printed atlas allocates
 * contrast, and it survives being shrunk into a chat window.
 */
const PALETTE = {
  paper: "#faf7f0",
  land: "#e3dcc9",
  landEdge: "#9d9075",
  water: "#9dc0d4",
  waterEdge: "#7ba5bd",
  label: "#33301f",
  frame: "#8a7f66",
  stateEdge: "#5c5340",
};

function loadPlate() {
  if (plateKind === "nation") {
    return JSON.parse(readFileSync(join(plateDir, "nation.json"), "utf8"));
  }
  return JSON.parse(readFileSync(join(plateDir, "state", `${stateCode}.json`), "utf8"));
}

function ringsToLonLat(plate, county) {
  const decimals = plate.encoding?.decimals ?? 4;
  return {
    boundary: (county.rings ?? []).map((ring) => decodeRing(ring, { decimals })),
    water: (county.water ?? []).map((ring) => decodeRing(ring, { decimals })),
  };
}

function pathFrom(points) {
  if (points.length === 0) return "";
  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    d += `L${points[i][0].toFixed(1)} ${points[i][1].toFixed(1)}`;
  }
  return `${d}Z`;
}

function main() {
  const plate = loadPlate();
  const counties = plate.counties ?? [];

  // Project every vertex once, then fit the whole plate to the viewport.
  const projected = counties.map((county) => {
    const { boundary, water } = ringsToLonLat(plate, county);
    const project =
      plate.plate === "nation"
        ? (point) => projectNational(point, county.state)
        : undefined;
    return { county, boundary, water, project };
  });

  let projectPoint;
  if (plate.plate === "nation") {
    projectPoint = (point, county) => projectNational(point, county.state);
  } else {
    const allPoints = projected.flatMap((entry) => entry.boundary.flat());
    const projection = projectionCenteredOn(boundsOf(allPoints));
    projectPoint = (point) => projection.project(point);
  }

  const allProjected = [];
  for (const entry of projected) {
    entry.projectedBoundary = entry.boundary.map((ring) =>
      ring.map((point) => projectPoint(point, entry.county)),
    );
    entry.projectedWater = entry.water.map((ring) =>
      ring.map((point) => projectPoint(point, entry.county)),
    );
    for (const ring of entry.projectedBoundary) allProjected.push(...ring);
  }

  const fit = fitToBox(extentOf(allProjected), { width, height, padding: 24 });
  const toScreen = ([x, y]) => [x * fit.scale + fit.translateX, y * fit.scale + fit.translateY];

  const landPaths = [];
  const waterPaths = [];
  for (const entry of projected) {
    for (const ring of entry.projectedBoundary) landPaths.push(pathFrom(ring.map(toScreen)));
    for (const ring of entry.projectedWater) waterPaths.push(pathFrom(ring.map(toScreen)));
  }

  // State outlines carry the plate's visual hierarchy: heavy for states,
  // hairline for counties. Without them 3,222 equal-weight shapes read as
  // texture rather than as a map of anything.
  const decimals = plate.encoding?.decimals ?? 4;
  const statePaths = [];
  const outlineSource =
    plate.plate === "nation" ? plate.stateOutlines ?? {} : { [plate.state]: plate.outline ?? [] };

  for (const [code, rings] of Object.entries(outlineSource)) {
    for (const encoded of rings) {
      const lonLat = decodeRing(encoded, { decimals });
      const screen = lonLat.map((point) => toScreen(projectPoint(point, { state: code })));
      statePaths.push(pathFrom(screen));
    }
  }

  // Labels: on a state plate, print the largest place in each county that has
  // one. On the national plate, print nothing — 3,222 labels is not a map.
  const labels = [];
  if (plate.plate === "state") {
    const ranked = [...projected].sort(
      (a, b) => (b.county.population ?? 0) - (a.county.population ?? 0),
    );
    for (const entry of ranked.slice(0, 40)) {
      const anchor = entry.county.anchors?.[0];
      if (!anchor) continue;
      const [x, y] = toScreen(projectPoint([anchor.lon, anchor.lat], entry.county));
      labels.push({ name: anchor.name, x, y });
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<rect width="${width}" height="${height}" fill="${PALETTE.paper}"/>
<g fill="${PALETTE.land}" stroke="${PALETTE.landEdge}" stroke-width="0.5" stroke-linejoin="round">
${landPaths.map((d) => `<path d="${d}"/>`).join("\n")}
</g>
<g fill="${PALETTE.water}" stroke="${PALETTE.waterEdge}" stroke-width="0.3">
${waterPaths.map((d) => `<path d="${d}"/>`).join("\n")}
</g>
<g fill="none" stroke="${PALETTE.stateEdge}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">
${statePaths.map((d) => `<path d="${d}"/>`).join("\n")}
</g>
<g font-family="Georgia, serif" font-size="11" fill="${PALETTE.label}" text-anchor="middle">
${labels.map((l) => `<circle cx="${l.x.toFixed(1)}" cy="${l.y.toFixed(1)}" r="1.8" fill="${PALETTE.label}"/><text x="${l.x.toFixed(1)}" y="${(l.y - 5).toFixed(1)}">${escapeXml(l.name)}</text>`).join("\n")}
</g>
</svg>`;

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, svg);

  console.log(
    JSON.stringify(
      {
        ok: true,
        plate: plate.plate,
        state: plate.state ?? null,
        counties: counties.length,
        landRings: landPaths.length,
        waterRings: waterPaths.length,
        labels: labels.length,
        out: outPath,
        svgKb: Math.round(svg.length / 1024),
      },
      null,
      2,
    ),
  );
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (char) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char],
  );
}

main();
