#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const checks = [];
const blockers = [];

const renderer = read("web/src/CityWorldRenderer.tsx");
const webVoxel = read("web/src/PixiVoxelSceneView.tsx");
const widgetVoxel = read("apps/widget/src/PixiVoxelSceneView.tsx");

requireIncludes(renderer, 'if (actor.kind === "clawd") return;', "CityWorld actor renderer must suppress Clawd map sprites.");
requireIncludes(renderer, "SHELL_TERRAIN_COLORS", "Shell terrain needs its own muted palette.");
requireIncludes(renderer, "SHELL_LOT_COLORS", "Shell lots need their own muted palette.");
requireIncludes(renderer, "drawShellTerrainFacet", "Shell terrain needs low-noise facets.");
requireIncludes(renderer, "drawShellRoadMaterial", "Shell roads need material detail instead of flat filler.");
requireIncludes(renderer, "drawShellLotMaterial", "Shell lots need material detail instead of public props.");
requireIncludes(renderer, "isShellBuilding", "Shell building color handling must be explicit.");
requireIncludes(renderer, 'shell: { seamAlpha: 0.18, lipAlpha: 0.09, strandAlpha: 0.12, wetAlpha: 0.08 }', "Shell ground contact must not be invisible.");

requireAbsent(renderer, '"clawd";', "Animated targets must not include Clawd as an animation kind.");
requireAbsent(renderer, 'item.kind === "walker" || item.kind === "clawd"', "Animation loop must not special-case Clawd.");
requireAbsent(renderer, 'actor.kind === "clawd" && actor.placeId === "place-eastvale-core"', "Renderer must not position a Clawd mascot on Eastvale.");
requireAbsent(renderer, "actorPoint.x - 7, actorPoint.y - 28", "Renderer still contains the old mascot ear drawing.");
requireAbsent(webVoxel, "function drawClawd", "Web voxel preview still contains the legacy Clawd drawing helper.");
requireAbsent(widgetVoxel, "function drawClawd", "Widget voxel preview still contains the legacy Clawd drawing helper.");

const result = {
  ok: blockers.length === 0,
  update: "postalpha-0.58e-fable-prop-cleanup",
  blockerCount: blockers.length,
  blockers,
  checks,
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;

function read(path) {
  const absolute = resolve(path);
  checks.push(path);
  if (!existsSync(absolute)) {
    blockers.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(absolute, "utf8");
}

function requireIncludes(text, needle, message) {
  if (!text.includes(needle)) blockers.push(message);
}

function requireAbsent(text, needle, message) {
  if (text.includes(needle)) blockers.push(message);
}
