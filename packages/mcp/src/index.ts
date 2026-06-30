export type McpPackageStatus = {
  entrypoint: "Apps SDK MCP";
  alphaCountySlug: string;
  toolsImplemented: true;
  alphaTools: string[];
};

export const MCP_PACKAGE_STATUS: McpPackageStatus = {
  entrypoint: "Apps SDK MCP",
  alphaCountySlug: "riverside-ca",
  toolsImplemented: true,
  alphaTools: [
    "select_county",
    "ask_county_question",
    "render_voxel_county",
    "lookup_world_places",
    "preview_scout_drop",
    "preview_campaign_engine",
    "get_upgrade_options",
  ],
};
