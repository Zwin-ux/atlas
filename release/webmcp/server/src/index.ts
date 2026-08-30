import { createServer, type ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { loadAtlasIndex } from "./atlasIndex.js";
import { createAtlasPlaceSearch, validateAtlasPlaceQuery } from "./atlasPlaceSearch.js";
import { createAtlasPlateService, plateHttpStatus } from "./atlasPlates.js";

const ROOT = process.cwd();
const PORT = Number.parseInt(process.env.PORT ?? "8787", 10);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error("PORT must be a valid TCP port.");

const WEB_DIST = resolve(ROOT, "web", "dist");
const atlasIndex = loadAtlasIndex(resolve(ROOT, "data", "census", "us-county-town-anchors.json"));
const atlasSearch = createAtlasPlaceSearch(atlasIndex);
const atlasPlates = createAtlasPlateService({
  plateDir: resolve(ROOT, "data", "atlas-plates"),
  geoPacksDir: resolve(ROOT, "data", "geo-packs"),
  townAnchorsFor: atlasIndex.anchorsFor,
  countyIdentity: atlasIndex.identityFor,
});

const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="description" content="Explore U.S. counties with a person and an agent on the same live map." />
    <title>Atlas — Shared U.S. Map</title>
    <link rel="stylesheet" href="/widget/component.css" />
  </head>
  <body>
    <main id="root"></main>
    <script type="module" src="/widget/component.js"></script>
  </body>
</html>`;

function jsonResponse(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  res.end(JSON.stringify(body));
}

function textResponse(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8", "x-content-type-options": "nosniff" });
  res.end(body);
}

function assetContentType(path: string): string {
  if (path.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".map")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

function serveAsset(res: ServerResponse, path: string): void {
  let decoded: string;
  try {
    decoded = decodeURIComponent(path).replace(/^\/+/, "");
  } catch {
    textResponse(res, 400, "Bad Request");
    return;
  }
  const absolute = resolve(WEB_DIST, decoded);
  const withinRoot = relative(WEB_DIST, absolute);
  if (withinRoot.startsWith("..") || resolve(WEB_DIST, withinRoot) !== absolute || !existsSync(absolute)) {
    textResponse(res, 404, "Not Found");
    return;
  }
  res.writeHead(200, {
    "content-type": assetContentType(absolute),
    "cache-control": withinRoot.replace(/\\/g, "/").startsWith("chunks/")
      ? "public, max-age=31536000, immutable"
      : "no-cache",
    "x-content-type-options": "nosniff",
  });
  res.end(readFileSync(absolute));
}

const server = createServer((req, res) => {
  try {
    if (!req.url) {
      textResponse(res, 400, "Bad Request");
      return;
    }
    const url = new URL(req.url, `http://${req.headers.host ?? `127.0.0.1:${PORT}`}`);

    if (req.method === "GET" && url.pathname === "/ready") {
      const ready = atlasPlates.isBuilt();
      jsonResponse(res, ready ? 200 : 503, { ok: ready, atlas: atlasIndex.stats() });
      return;
    }

    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/explore")) {
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "origin-agent-cluster": "?1",
        "permissions-policy": "tools=(self)",
        "referrer-policy": "strict-origin-when-cross-origin",
        "x-content-type-options": "nosniff",
      });
      res.end(HTML);
      return;
    }

    if (req.method === "GET" && url.pathname === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/widget/")) {
      serveAsset(res, url.pathname.slice("/widget/".length));
      return;
    }

    if (url.pathname.startsWith("/api/atlas/")) {
      res.setHeader("access-control-allow-origin", "*");
      res.setHeader("cross-origin-resource-policy", "cross-origin");
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "access-control-allow-methods": "GET, OPTIONS",
          "access-control-allow-headers": "content-type, if-none-match",
          "access-control-max-age": "86400",
        });
        res.end();
        return;
      }
      if (req.method !== "GET") {
        textResponse(res, 405, "Method Not Allowed");
        return;
      }

      const [kind, id] = url.pathname.slice("/api/atlas/".length).split("/");
      if ((kind === "search" || kind === "resolve") && !id) {
        const query = validateAtlasPlaceQuery(url.searchParams.get("query"));
        if (!query) {
          jsonResponse(res, 400, { ok: false, error: "query must contain 1 to 120 characters" });
          return;
        }
        jsonResponse(
          res,
          200,
          kind === "search"
            ? { ok: true, query, candidates: atlasSearch.search(query) }
            : { ok: true, ...atlasSearch.resolve(query) },
        );
        return;
      }

      const result =
        kind === "nation" && !id
          ? atlasPlates.nation()
          : kind === "state" && id
            ? atlasPlates.state(id)
            : kind === "county" && id
              ? atlasPlates.county(id)
              : undefined;
      if (!result) {
        jsonResponse(res, 404, { error: "Unknown atlas plate." });
        return;
      }
      if (!result.ok) {
        const error = result.reason === "invalid"
          ? "That is not a valid atlas plate id."
          : result.reason === "missing"
            ? "Atlas has no plate for that place."
            : "The atlas plates are unavailable.";
        jsonResponse(res, plateHttpStatus(result), { error });
        return;
      }
      if (req.headers["if-none-match"] === result.etag) {
        res.writeHead(304, { etag: result.etag });
        res.end();
        return;
      }
      res.setHeader("etag", result.etag);
      res.setHeader("cache-control", "public, max-age=3600, stale-while-revalidate=86400");
      jsonResponse(res, 200, JSON.parse(result.body));
      return;
    }

    textResponse(res, 404, "Not Found");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    if (!res.headersSent) jsonResponse(res, 500, { error: "Atlas could not complete that request." });
    else res.end();
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Atlas listening on http://0.0.0.0:${PORT}`);
});
