/// <reference types="webmcp-types" />

import type { AtlasMapController } from "./AtlasMapController";
import { ATLAS_WEBMCP_TOOL_NAMES, createAtlasWebMcpTools } from "./webmcpTools";

export interface AtlasWebMcpEvalTool {
  name: string;
  description: string;
  inputSchema: WebMCP.ModelContextTool["inputSchema"];
}

export interface AtlasWebMcpEvalSchema {
  tools: AtlasWebMcpEvalTool[];
}

export function createAtlasWebMcpEvalSchema(controller: AtlasMapController): AtlasWebMcpEvalSchema {
  const tools = createAtlasWebMcpTools(controller).map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  }));
  const names = tools.map((tool) => tool.name);
  if (JSON.stringify(names) !== JSON.stringify(ATLAS_WEBMCP_TOOL_NAMES)) {
    throw new Error(`Atlas eval schema drifted from the exact-five tool cut: ${names.join(", ")}`);
  }
  return { tools };
}
