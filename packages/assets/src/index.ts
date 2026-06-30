export type AtlasAssetLane = "placeholder" | "prompt" | "production";

export type AtlasAssetPackageStatus = {
  lane: AtlasAssetLane;
  finalArtReady: false;
};

export const ASSET_PACKAGE_STATUS: AtlasAssetPackageStatus = {
  lane: "placeholder",
  finalArtReady: false,
};
