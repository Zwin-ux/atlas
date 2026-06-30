import { spawnSync } from "node:child_process";

function run(command, args) {
  const executable = process.platform === "win32" ? "cmd.exe" : command;
  const executableArgs = process.platform === "win32"
    ? ["/d", "/s", "/c", [command, ...args].join(" ")]
    : args;
  const result = spawnSync(executable, executableArgs, {
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });

  return {
    ok: result.status === 0,
    text: `${result.stdout ?? ""}${result.stderr ?? result.error?.message ?? ""}`.trim(),
  };
}

function firstLine(text) {
  return text.split(/\r?\n/).find(Boolean) ?? "";
}

const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
let failed = false;

console.log(`node: ${process.version}`);
if (nodeMajor < 18) {
  console.error("node: expected 18 or newer");
  failed = true;
}

const pnpm = run("pnpm", ["--version"]);
console.log(`pnpm: ${pnpm.ok ? firstLine(pnpm.text) : "missing"}`);
if (!pnpm.ok) {
  console.error("pnpm is required for this workspace");
  failed = true;
}

const git = run("git", ["--version"]);
console.log(`git: ${git.ok ? firstLine(git.text) : "missing"}`);
if (!git.ok) {
  console.error("git is required");
  failed = true;
}

const npm = run("npm", ["--version"]);
if (npm.ok) {
  console.log(`npm: ${firstLine(npm.text)}`);
} else {
  console.warn("npm: unavailable or broken locally; use pnpm for this repo");
}

console.log(`mcp endpoint: http://localhost:${process.env.PORT ?? "8787"}${process.env.MCP_PATH ?? "/mcp"}`);

process.exitCode = failed ? 1 : 0;
