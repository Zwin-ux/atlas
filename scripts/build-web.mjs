import { copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = resolve(root, "web/src/main.tsx");
const outdir = resolve(root, "web/dist");

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

await esbuild.build({
  entryPoints: [entry],
  outdir,
  entryNames: "component",
  chunkNames: "chunks/[name]-[hash]",
  bundle: true,
  format: "esm",
  platform: "browser",
  splitting: true,
  target: ["es2022"],
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  loader: {
    ".svg": "dataurl",
  },
  minify: true,
  sourcemap: true,
  logLevel: "info",
});

// Production-emulator host page (served at /emulator, asset at /widget/emulator.js).
// Separate single-file bundle: it parents the widget iframe and must not share
// chunk graph (or load order) with the widget bundle it hosts.
await esbuild.build({
  entryPoints: [resolve(root, "web/src/emulator/main.ts")],
  outfile: resolve(outdir, "emulator.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  minify: true,
  sourcemap: true,
  logLevel: "info",
});

// component.css is emitted by esbuild from the CSS the widget imports. It used
// to be overwritten here by a copy of the hand-maintained web/src/styles.css,
// which silently discarded every bundled stylesheet — the atlas plate rendered
// as black shapes because its rules never reached the browser. The widget now
// imports its own CSS, so the bundler's output is the whole truth.

console.log("built web/dist/component.js, web/dist/emulator.js and web/dist/component.css");
