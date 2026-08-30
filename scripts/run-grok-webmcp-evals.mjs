if (!process.env.XAI_API_KEY) {
  throw new Error("XAI_API_KEY is required to run the Grok 4.6 WebMCP evaluation.");
}

process.env.ATLAS_WEBMCP_EVAL_BACKEND = "vercel";
process.env.ATLAS_WEBMCP_EVAL_MODEL = "xai:grok-4.6";
process.argv[2] = "browser";

await import("./run-webmcp-evals.mjs");
