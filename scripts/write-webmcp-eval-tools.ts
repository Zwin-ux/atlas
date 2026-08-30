import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { AtlasMapController } from "../web/src/atlas/AtlasMapController";
import { createAtlasWebMcpEvalSchema } from "../web/src/atlas/webmcpEvalSchema";

const outputPath = resolve(process.cwd(), process.env.ATLAS_WEBMCP_EVAL_TOOLS ?? ".evals/atlas-tools.json");
const schema = createAtlasWebMcpEvalSchema(new AtlasMapController());
const serialized = `${JSON.stringify(schema, null, 2)}\n`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, serialized, "utf8");

const fingerprint = createHash("sha256").update(serialized).digest("hex").slice(0, 16);
console.log(`Wrote ${schema.tools.length} Atlas WebMCP descriptors to ${outputPath} (sha256:${fingerprint}).`);
