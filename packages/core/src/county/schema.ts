import { z } from "zod";

export const countySlugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, "County slug must use lowercase letters, numbers, and hyphens.");

export const voxelPointSchema = z
  .object({
    x: z.number().finite(),
    y: z.number().finite(),
    z: z.number().finite(),
  })
  .strict();

export const countyMapNodeSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.string().min(1),
    voxel: voxelPointSchema,
    scores: z.record(z.string().min(1), z.number().min(0).max(100)),
    signals: z.array(z.string().min(1)),
    campaignSuggestion: z.string().min(1),
  })
  .strict();

export const countyMapEdgeSchema = z
  .object({
    from: z.string().min(1),
    to: z.string().min(1),
    type: z.string().min(1),
  })
  .strict();

export const countySourceSchema = z
  .object({
    name: z.string().min(1),
    sourceType: z.string().min(1),
    confidenceScore: z.number().min(0).max(1),
  })
  .strict();

export const countyPackSchema = z
  .object({
    county: z.string().min(1),
    state: z.string().min(2),
    slug: countySlugSchema,
    version: z.string().min(1),
    lastUpdated: z.string().min(1),
    summary: z.string().min(1),
    mapNodes: z.array(countyMapNodeSchema).min(1),
    mapEdges: z.array(countyMapEdgeSchema),
    sources: z.array(countySourceSchema).min(1),
    confidenceNotes: z.array(z.string().min(1)).min(1),
  })
  .strict()
  .superRefine((pack, ctx) => {
    const nodeIds = new Set<string>();

    for (const node of pack.mapNodes) {
      if (nodeIds.has(node.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["mapNodes"],
          message: `Duplicate map node id: ${node.id}`,
        });
      }

      nodeIds.add(node.id);
    }

    for (const [index, edge] of pack.mapEdges.entries()) {
      if (!nodeIds.has(edge.from)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["mapEdges", index, "from"],
          message: `Edge references unknown source node: ${edge.from}`,
        });
      }

      if (!nodeIds.has(edge.to)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["mapEdges", index, "to"],
          message: `Edge references unknown target node: ${edge.to}`,
        });
      }
    }
  });
