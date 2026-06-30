import type { z } from "zod";
import type {
  countyMapEdgeSchema,
  countyMapNodeSchema,
  countyPackSchema,
  countySourceSchema,
  voxelPointSchema,
} from "./schema.js";

export type VoxelPoint = z.infer<typeof voxelPointSchema>;

export type CountyMapNode = z.infer<typeof countyMapNodeSchema>;

export type CountyMapEdge = z.infer<typeof countyMapEdgeSchema>;

export type CountySource = z.infer<typeof countySourceSchema>;

export type CountyPack = z.infer<typeof countyPackSchema>;

export type CountyPackSummary = {
  county: string;
  state: string;
  slug: string;
  nodeCount: number;
  edgeCount: number;
  sourceCount: number;
};
