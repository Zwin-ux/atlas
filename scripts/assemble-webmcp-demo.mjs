import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const sourceProofRoot = resolve("artifacts/webmcp-release-proof/39d1e141-20260902");
const releaseProofRoot = resolve("docs/evidence/39d1e141");
const proofRoot = resolve(option("--proof-dir", existsSync(sourceProofRoot) ? sourceProofRoot : releaseProofRoot));
const outputRoot = resolve(option("--out", ".evals/webmcp-demo/39d1e141-review"));
const audioPath = option("--audio");
const captionsPath = resolve(option("--captions", "docs/webmcp/VIDEO_CAPTIONS.srt"));
const candidate = option("--candidate", "39d1e1413e72ea050845ffbaa6323fffeb8c28f1");
const ffmpegPath = process.env.FFMPEG_PATH ?? "ffmpeg";
const ffprobePath = process.env.FFPROBE_PATH ?? "ffprobe";

if (!audioPath) {
  throw new Error("assemble-webmcp-demo requires --audio <voiceover.wav>. A silent demo cannot pass the release gate.");
}
assert.match(candidate, /^[0-9a-f]{40}$/i, "--candidate must be a complete 40-character Git SHA.");

const sections = [
  { id: "trail", seconds: 12, file: "06-webmcp-trail-desktop.png", claim: "A complete three-stop national trail is visibly rendered." },
  { id: "handoff", seconds: 11, file: "07-human-stop-mobile-390x844.png", claim: "A human-selected stop opens the matching county and active trail entry." },
  { id: "ambiguity", seconds: 13, file: "02-springfield-ambiguity-desktop.png", claim: "Springfield returns labeled candidates without changing the map." },
  { id: "note", seconds: 12, file: "06-webmcp-trail-desktop.png", claim: "The note and trail remain visible and editable beside the map." },
  { id: "atomicity", seconds: 12, file: "08-reduced-motion-trail-desktop.png", claim: "The prior completed trail remains the visible state used for failure-safety narration." },
  { id: "fallback", seconds: 14, file: "01-national-entry-desktop.png", claim: "The no-login map remains usable when Site Tools are not detected." },
];
const totalSeconds = sections.reduce((sum, section) => sum + section.seconds, 0);
const resolvedAudioPath = resolve(audioPath);
const outputVideo = join(outputRoot, "atlas-webmcp-proof-cut.mp4");
const outputCaptions = join(outputRoot, "atlas-webmcp-proof-cut.srt");
const outputManifest = join(outputRoot, "manifest.json");

async function run(command, commandArgs, capture = false) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolvePromise(capture ? stdout : undefined);
      else reject(new Error(`${basename(command)} exited ${code}: ${(stderr || stdout).trim()}`));
    });
  });
}

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

function inputFilter(index, seconds) {
  const fadeOut = (seconds - 0.35).toFixed(2);
  return `[${index}:v]${[
    "scale=1280:720:force_original_aspect_ratio=decrease",
    "pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0xf5efe3",
    "setsar=1",
    "zoompan=z='min(zoom+0.00007,1.025)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1280x720:fps=30",
    "fade=t=in:st=0:d=0.35",
    `fade=t=out:st=${fadeOut}:d=0.35`,
    "setpts=PTS-STARTPTS",
  ].join(",")}[v${index}]`;
}

const sourcePaths = sections.map((section) => resolve(proofRoot, section.file));
const proofManifestPath = resolve(proofRoot, "manifest.json");
const [proofManifest] = await Promise.all([
  readFile(proofManifestPath, "utf8").then(JSON.parse),
  ...sourcePaths.map((path) => readFile(path)),
  readFile(resolvedAudioPath),
  readFile(captionsPath),
]);
assert.equal(proofManifest.candidateSha, candidate, "The proof manifest candidate does not match --candidate.");

const proofImages = new Map((proofManifest.images ?? []).map((image) => [image.file, image]));
for (let index = 0; index < sections.length; index += 1) {
  const section = sections[index];
  const image = proofImages.get(section.file);
  assert.ok(image, `${section.file} is not declared in the proof manifest.`);
  assert.equal(await sha256(sourcePaths[index]), image.sha256, `${section.file} does not match its proof-manifest hash.`);
}
await mkdir(outputRoot, { recursive: true });

const inputArgs = [];
for (let index = 0; index < sections.length; index += 1) {
  inputArgs.push("-loop", "1", "-framerate", "30", "-t", String(sections[index].seconds), "-i", sourcePaths[index]);
}
inputArgs.push("-i", resolvedAudioPath);

const filters = sections.map((section, index) => inputFilter(index, section.seconds));
filters.push(`${sections.map((_, index) => `[v${index}]`).join("")}concat=n=${sections.length}:v=1:a=0[vout]`);

await run(ffmpegPath, [
  "-hide_banner",
  "-loglevel", "error",
  ...inputArgs,
  "-filter_complex", filters.join(";"),
  "-map", "[vout]",
  "-map", `${sections.length}:a:0`,
  "-af", `aresample=48000,loudnorm=I=-16:LRA=7:TP=-1.5,apad=whole_dur=${totalSeconds}`,
  "-t", String(totalSeconds),
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "19",
  "-pix_fmt", "yuv420p",
  "-r", "30",
  "-c:a", "aac",
  "-b:a", "160k",
  "-ar", "48000",
  "-movflags", "+faststart",
  "-y",
  outputVideo,
]);
await copyFile(captionsPath, outputCaptions);

const probe = JSON.parse(await run(ffprobePath, [
  "-v", "error",
  "-show_streams",
  "-show_format",
  "-of", "json",
  outputVideo,
], true));
const videoStream = probe.streams.find((stream) => stream.codec_type === "video");
const audioStream = probe.streams.find((stream) => stream.codec_type === "audio");
const durationSeconds = Number(probe.format?.duration);
assert.equal(videoStream?.width, 1280);
assert.equal(videoStream?.height, 720);
assert.ok(audioStream, "The proof cut must contain an audio stream.");
assert.ok(durationSeconds > 0 && durationSeconds < 180, `The proof cut must be under three minutes; got ${durationSeconds}.`);

const manifest = {
  schemaVersion: 1,
  renderedAt: new Date().toISOString(),
  status: "provisional-proof-cut",
  candidate,
  proof: {
    manifest: relative(process.cwd(), proofManifestPath).replaceAll("\\", "/"),
    capturedAt: proofManifest.capturedAt,
    liveUrl: proofManifest.liveUrl,
    deploymentId: proofManifest.deploymentId,
    sourceRuntimeSha: proofManifest.sourceRuntimeSha,
    sha256: await sha256(proofManifestPath),
  },
  durationSeconds,
  resolution: { width: videoStream.width, height: videoStream.height },
  audio: { codec: audioStream.codec_name, source: basename(resolvedAudioPath), sha256: await sha256(resolvedAudioPath) },
  captions: { file: basename(outputCaptions), sha256: await sha256(outputCaptions) },
  video: { file: basename(outputVideo), sha256: await sha256(outputVideo) },
  sources: await Promise.all(sections.map(async (section, index) => ({
    ...section,
    path: relative(process.cwd(), sourcePaths[index]).replaceAll("\\", "/"),
    sha256: await sha256(sourcePaths[index]),
  }))),
  boundaries: [
    "Every product frame is an actual SHA-bound release-proof capture.",
    "Slow crop motion is editorial only and does not simulate a product interaction.",
    "This proof cut does not claim a real ChatGPT conversation or Site Tools picker capture.",
    "Replace the reserved ChatGPT shots and participant-recorded voice before publication.",
  ],
};
await writeFile(outputManifest, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  ok: true,
  status: manifest.status,
  candidate,
  durationSeconds,
  resolution: manifest.resolution,
  audioCodec: manifest.audio.codec,
  output: outputVideo,
  captions: outputCaptions,
  manifest: outputManifest,
}, null, 2));
