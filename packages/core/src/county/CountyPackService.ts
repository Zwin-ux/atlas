import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { countyPackSchema, countySlugSchema } from "./schema.js";
import type { CountyMapNode, CountyPack, CountyPackSummary } from "./types.js";

export class CountyPackValidationError extends Error {
  readonly issues: string[];

  constructor(sourceLabel: string, issues: string[]) {
    super(`Invalid county pack ${sourceLabel}: ${issues.join("; ")}`);
    this.name = "CountyPackValidationError";
    this.issues = issues;
  }
}

export function parseCountyPack(input: unknown, sourceLabel = "input"): CountyPack {
  const result = countyPackSchema.safeParse(input);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    });

    throw new CountyPackValidationError(sourceLabel, issues);
  }

  return result.data;
}

export function summarizeCountyPack(pack: CountyPack): CountyPackSummary {
  return {
    county: pack.county,
    state: pack.state,
    slug: pack.slug,
    nodeCount: pack.mapNodes.length,
    edgeCount: pack.mapEdges.length,
    sourceCount: pack.sources.length,
  };
}

export class CountyPackService {
  readonly countyPackDir: string;

  constructor(countyPackDir = resolve(process.cwd(), "data", "county_packs")) {
    this.countyPackDir = resolve(countyPackDir);
  }

  loadCountyPack(countySlug: string): CountyPack {
    const filePath = this.resolveCountyPackPath(countySlug);
    const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;

    return parseCountyPack(raw, filePath);
  }

  getNode(pack: CountyPack, nodeId: string): CountyMapNode | null {
    return pack.mapNodes.find((node) => node.id === nodeId) ?? null;
  }

  requireNode(pack: CountyPack, nodeId: string): CountyMapNode {
    const node = this.getNode(pack, nodeId);

    if (!node) {
      throw new Error(`County pack ${pack.slug} does not include node ${nodeId}.`);
    }

    return node;
  }

  summarize(pack: CountyPack): CountyPackSummary {
    return summarizeCountyPack(pack);
  }

  private resolveCountyPackPath(countySlug: string): string {
    const slug = countySlugSchema.parse(countySlug);
    const filePath = resolve(this.countyPackDir, `${slug}.json`);
    const rootWithSeparator = this.countyPackDir.endsWith(sep) ? this.countyPackDir : `${this.countyPackDir}${sep}`;

    if (!filePath.startsWith(rootWithSeparator)) {
      throw new Error(`County slug resolved outside county pack directory: ${countySlug}`);
    }

    return filePath;
  }
}
