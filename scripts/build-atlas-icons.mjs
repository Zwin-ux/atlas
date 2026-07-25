#!/usr/bin/env node
/**
 * Build the plugin directory and composer icons.
 *
 * The icon is drawn from the same Census geography the product draws, through
 * the same Albers projection. That is deliberate: an icon assembled from
 * generic map clip-art would be a claim the product does not back, whereas
 * this one is literally a picture of what the app contains. It is also why it
 * survives being shrunk — the US silhouette is recognisable at 48px in a way
 * that a globe-and-pin is not.
 *
 * Emits SVG. `scripts/rasterize-icons.mjs` turns them into the PNGs the
 * submission portal asks for (directory >=256px light and dark, composer
 * >=48px).
 *
 * Run: node scripts/build-atlas-icons.mjs
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { decodeRing } from "../packages/core/dist/atlas/ringCodec.js";
import { simplifyClosedRing } from "../packages/core/dist/atlas/simplify.js";
import {
  extentOf,
  fitToBox,
  INSET_STATE_CODES,
  projectNational,
} from "../packages/core/dist/atlas/projection.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLATE = join(ROOT, "artifacts", "atlas-plates", "nation.json");
const OUT_DIR = join(ROOT, "assets", "brand");

/**
 * Icon palettes. The light icon is the plate's own paper and land; the dark
 * one is the widget's dark tokens. Both keep land against a contrasting field
 * rather than inverting to an outline, so the shape still reads when the
 * directory shrinks it.
 */
const THEMES = {
  light: { bg: "#f2ede1", land: "#3f4a3a", stroke: "#f2ede1" },
  dark: { bg: "#1b2730", land: "#cfd8c4", stroke: "#1b2730" },
};

function main() {
  const plate = JSON.parse(readFileSync(PLATE, "utf8"));
  const decimals = plate.encoding?.decimals ?? 3;

  // Contiguous states only. Alaska and Hawaii are the right call on a map and
  // the wrong one on a 48px icon, where they become three grey specks that
  // read as dirt.
  const outlines = Object.entries(plate.stateOutlines ?? {}).filter(
    ([code]) => !INSET_STATE_CODES.has(code),
  );

  const projected = outlines.map(([code, rings]) => ({
    code,
    rings: rings.map((ring) => decodeRing(ring, { decimals }).map((point) => projectNational(point, code))),
  }));

  // The composer icon is 48px across. At that size the plate's coastline detail
  // — Chesapeake inlets, Great Lakes shoreline, the Keys — is finer than a pixel
  // and anti-aliases into speckle. The small variant is rebuilt from geometry
  // simplified far harder, so it reads as a country rather than a smudge.
  const SMALL_TOLERANCE = 0.45;
  const projectedSmall = outlines.map(([code, rings]) => ({
    code,
    rings: rings
      .map((ring) => simplifyClosedRing(decodeRing(ring, { decimals }), SMALL_TOLERANCE))
      .filter((ring) => ring.length >= 4)
      .map((ring) => ring.map((point) => projectNational(point, code))),
  }));

  const all = projected.flatMap((entry) => entry.rings.flat());
  const size = 512;
  // Generous padding: directory icons are often shown rounded, and geography
  // touching the corner would get clipped.
  const fit = fitToBox(extentOf(all), { width: size, height: size, padding: size * 0.13 });

  const buildPaths = (set) =>
    set
    .flatMap((entry) => entry.rings)
    .map((ring) => {
      const points = ring.map(([x, y]) => [x * fit.scale + fit.translateX, y * fit.scale + fit.translateY]);
      if (points.length < 3) return "";
      let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
      for (let i = 1; i < points.length; i += 1) d += `L${points[i][0].toFixed(1)} ${points[i][1].toFixed(1)}`;
      return `${d}Z`;
    })
    .filter(Boolean);

  const paths = buildPaths(projected);
  const smallPaths = buildPaths(projectedSmall);

  mkdirSync(OUT_DIR, { recursive: true });
  const written = [];

  for (const [name, theme] of Object.entries(THEMES)) {
    // Two variants, because the same artwork cannot serve both sizes. At 48px
    // the state hairlines fall below one pixel and dither into speckle, so the
    // composer icon drops them for a clean silhouette. Simplifying artwork as
    // it shrinks is ordinary icon practice, not a shortcut.
    for (const variant of ["detail", "simple"]) {
      // The simple variant is stroked in its own fill colour rather than left
      // unstroked. Each state is a separate polygon and simplification leaves
      // hairline gaps along shared borders; unstroked, those gaps let the
      // background through and the 48px icon reads as speckle instead of a
      // country. Stroking with the fill welds the silhouette shut.
      const strokeAttrs =
        variant === "detail"
          ? ` stroke="${theme.stroke}" stroke-width="1.1" stroke-linejoin="round"`
          : ` stroke="${theme.land}" stroke-width="3" stroke-linejoin="round"`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
<rect width="${size}" height="${size}" rx="${size * 0.18}" fill="${theme.bg}"/>
<g fill="${theme.land}"${strokeAttrs}>
${(variant === "detail" ? paths : smallPaths).map((d) => `<path d="${d}"/>`).join("\n")}
</g>
</svg>`;
      const file = join(OUT_DIR, `atlas-icon-${name}${variant === "simple" ? "-simple" : ""}.svg`);
      writeFileSync(file, svg);
      written.push({ theme: name, variant, file, bytes: svg.length, statePaths: (variant === "detail" ? paths : smallPaths).length });
    }
  }

  console.log(JSON.stringify({ ok: true, size, states: projected.length, written }, null, 2));
}

main();
