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

await copyFile(resolve(root, "web/src/styles.css"), resolve(outdir, "component.css"));

console.log("built web/dist/component.js and web/dist/component.css");
